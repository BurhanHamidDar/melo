package com.mochyy.mochymusic.core.sync

import android.content.Context
import com.mochyy.mochymusic.core.auth.MeloAuthRepository
import com.mochyy.mochymusic.core.updater.MeloUpdateManager
import com.mochyy.mochymusic.db.MusicDatabase
import com.mochyy.mochymusic.db.entities.PlaylistEntity
import com.mochyy.mochymusic.db.entities.PlaylistSongMap
import com.mochyy.mochymusic.db.entities.SongEntity
import dagger.hilt.android.qualifiers.ApplicationContext
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import org.json.JSONArray
import org.json.JSONObject
import timber.log.Timber
import java.net.HttpURLConnection
import java.net.URL
import java.text.SimpleDateFormat
import java.time.LocalDateTime
import java.util.Date
import java.util.Locale
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * MeloSyncManager provides idempotent, local-first library and account synchronization
 * with the Melo Go backend and Neon PostgreSQL database.
 *
 * Ensures:
 * 1. Playlists marked with isAutoSync are fully backed up to the cloud with all ordered tracks.
 * 2. When a user logs in on another device, their playlists and tracks are fetched and restored into Room.
 * 3. Fast offline operation: playback and local changes are never blocked.
 */
@Singleton
class MeloSyncManager @Inject constructor(
    @ApplicationContext private val context: Context,
    private val authRepo: MeloAuthRepository,
    private val database: MusicDatabase,
) {
    private val prefs = context.getSharedPreferences("melo_sync_prefs", Context.MODE_PRIVATE)

    private val _syncStatus = MutableStateFlow("Local library active")
    val syncStatus: StateFlow<String> = _syncStatus.asStateFlow()

    private val _isSyncing = MutableStateFlow(false)
    val isSyncing: StateFlow<Boolean> = _isSyncing.asStateFlow()

    init {
        val lastSync = prefs.getString("last_sync_time", null)
        if (lastSync != null) {
            _syncStatus.value = "Last synced: $lastSync"
        }
    }

    /**
     * Enable or disable cloud sync for a specific playlist.
     */
    suspend fun setPlaylistSync(playlistId: String, enable: Boolean): Result<Unit> = withContext(Dispatchers.IO) {
        runCatching {
            val db = database.openHelper.writableDatabase
            db.execSQL(
                "UPDATE playlist SET isAutoSync = ? WHERE id = ?",
                arrayOf<Any>(if (enable) 1 else 0, playlistId)
            )
            database.invalidationTracker.refreshVersionsAsync()
            if (enable) {
                syncNow()
            }
            Unit
        }
    }

    /**
     * Delete playlist from cloud sync ledger.
     */
    suspend fun deleteCloudPlaylist(playlistId: String): Result<Unit> = withContext(Dispatchers.IO) {
        val user = authRepo.getCurrentUser() ?: return@withContext Result.success(Unit)
        val token = authRepo.getIdToken(forceRefresh = false) ?: return@withContext Result.success(Unit)
        runCatching {
            val workingBaseUrl = MeloUpdateManager.backendApiBaseUrl
            val clientMutationId = UUID.nameUUIDFromBytes("delete_playlist:$playlistId:${System.currentTimeMillis()}".toByteArray()).toString()
            val entityId = UUID.nameUUIDFromBytes(playlistId.toByteArray()).toString()
            val mutations = JSONArray().apply {
                put(JSONObject().apply {
                    put("client_mutation_id", clientMutationId)
                    put("entity_type", "playlist")
                    put("entity_id", entityId)
                    put("operation", "delete")
                    put("payload", JSONObject().put("playlist_id", playlistId))
                })
            }
            val pushEndpoint = "$workingBaseUrl/v1/sync/push"
            val pushConn = (URL(pushEndpoint).openConnection() as HttpURLConnection).apply {
                requestMethod = "POST"
                connectTimeout = 5_000
                readTimeout = 5_000
                doOutput = true
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("Content-Type", "application/json")
                setRequestProperty("Accept", "application/json")
            }
            val body = JSONObject().put("mutations", mutations).toString()
            pushConn.outputStream.bufferedWriter().use { it.write(body) }
            pushConn.responseCode
            pushConn.disconnect()
            Unit
        }
    }

    /**
     * Clear stored sync cursor (e.g. on account sign out).
     */
    fun resetSyncCursor() {
        prefs.edit().remove("sync_cursor").remove("last_sync_time").apply()
        _syncStatus.value = "Guest mode — local only"
    }

    /**
     * Run a bidirectional sync pass with the Melo backend.
     */
    suspend fun syncNow(forceFullPull: Boolean = false): Result<Unit> = withContext(Dispatchers.IO) {
        val user = authRepo.getCurrentUser()
        if (user == null) {
            _syncStatus.value = "Guest mode — local only"
            return@withContext Result.success(Unit)
        }

        if (_isSyncing.value) {
            return@withContext Result.success(Unit)
        }

        _isSyncing.value = true
        _syncStatus.value = "Synchronizing with cloud..."

        runCatching {
            val token = authRepo.getIdToken(forceRefresh = false)
                ?: error("Failed to obtain authentication token")

            val baseUrls = MeloUpdateManager.candidateBaseUrls
            var workingBaseUrl = MeloUpdateManager.backendApiBaseUrl

            // 1. Ensure user profile is registered with backend /v1/me
            for (base in baseUrls) {
                val meUrl = "$base/v1/me"
                val conn = runCatching {
                    (URL(meUrl).openConnection() as HttpURLConnection).apply {
                        connectTimeout = 3_000
                        readTimeout = 3_000
                        setRequestProperty("Authorization", "Bearer $token")
                        setRequestProperty("Accept", "application/json")
                    }
                }.getOrNull() ?: continue

                try {
                    val code = conn.responseCode
                    if (code in 200..299) {
                        workingBaseUrl = base
                        MeloUpdateManager.backendApiBaseUrl = base
                        break
                    }
                } catch (_: Exception) {
                } finally {
                    conn.disconnect()
                }
            }

            val readableDb = database.openHelper.readableDatabase

            // 2. Gather local liked songs & playlists to push
            val mutations = JSONArray()

            // Collect liked songs
            readableDb.query("SELECT id, title, liked FROM song WHERE liked = 1 LIMIT 200").use { cursor ->
                val idIdx = cursor.getColumnIndex("id")
                val titleIdx = cursor.getColumnIndex("title")
                while (cursor.moveToNext()) {
                    val songId = if (idIdx >= 0) cursor.getString(idIdx) else ""
                    val title = if (titleIdx >= 0) cursor.getString(titleIdx) else ""
                    if (songId.isNotBlank()) {
                        val clientMutationId = UUID.nameUUIDFromBytes("liked_song:$songId".toByteArray()).toString()
                        val entityId = UUID.nameUUIDFromBytes(songId.toByteArray()).toString()
                        val payload = JSONObject().apply {
                            put("song_id", songId)
                            put("title", title)
                            put("is_liked", true)
                        }
                        mutations.put(JSONObject().apply {
                            put("client_mutation_id", clientMutationId)
                            put("entity_type", "library_item")
                            put("entity_id", entityId)
                            put("operation", "upsert")
                            put("payload", payload)
                        })
                    }
                }
            }

            // Collect playlists marked for sync (isAutoSync = 1) or user editable playlists
            val playlistQuery = "SELECT id, name, description, thumbnailUrl, isAutoSync FROM playlist WHERE isEditable = 1 LIMIT 100"
            readableDb.query(playlistQuery).use { cursor ->
                val idIdx = cursor.getColumnIndex("id")
                val nameIdx = cursor.getColumnIndex("name")
                val descIdx = cursor.getColumnIndex("description")
                val thumbIdx = cursor.getColumnIndex("thumbnailUrl")
                val syncIdx = cursor.getColumnIndex("isAutoSync")

                while (cursor.moveToNext()) {
                    val playlistId = if (idIdx >= 0) cursor.getString(idIdx) else ""
                    val name = if (nameIdx >= 0) cursor.getString(nameIdx) else ""
                    val desc = if (descIdx >= 0) cursor.getString(descIdx) else ""
                    val thumb = if (thumbIdx >= 0) cursor.getString(thumbIdx) else ""
                    val isAutoSync = if (syncIdx >= 0) cursor.getInt(syncIdx) == 1 else false

                    // Sync playlists where isAutoSync is enabled
                    if (playlistId.isNotBlank() && isAutoSync) {
                        // Collect all tracks in this playlist
                        val tracks = JSONArray()
                        val songQuery = """
                            SELECT psm.songId, psm.position, s.title, s.duration, s.thumbnailUrl, s.albumName
                            FROM playlist_song_map psm
                            LEFT JOIN song s ON psm.songId = s.id
                            WHERE psm.playlistId = ?
                            ORDER BY psm.position ASC
                        """.trimIndent()

                        readableDb.query(songQuery, arrayOf(playlistId)).use { songCursor ->
                            val sIdIdx = songCursor.getColumnIndex("songId")
                            val posIdx = songCursor.getColumnIndex("position")
                            val tIdx = songCursor.getColumnIndex("title")
                            val durIdx = songCursor.getColumnIndex("duration")
                            val thIdx = songCursor.getColumnIndex("thumbnailUrl")
                            val albIdx = songCursor.getColumnIndex("albumName")

                            while (songCursor.moveToNext()) {
                                val sId = if (sIdIdx >= 0) songCursor.getString(sIdIdx) else ""
                                val pos = if (posIdx >= 0) songCursor.getInt(posIdx) else 0
                                val title = if (tIdx >= 0) songCursor.getString(tIdx).orEmpty() else ""
                                val dur = if (durIdx >= 0) songCursor.getInt(durIdx) else -1
                                val sThumb = if (thIdx >= 0) songCursor.getString(thIdx).orEmpty() else ""
                                val alb = if (albIdx >= 0) songCursor.getString(albIdx).orEmpty() else ""

                                tracks.put(JSONObject().apply {
                                    put("song_id", sId)
                                    put("position", pos)
                                    put("title", title.ifBlank { "Track ${pos + 1}" })
                                    put("duration", dur)
                                    put("thumbnail_url", sThumb)
                                    put("album_name", alb)
                                })
                            }
                        }

                        val trackSig = StringBuilder()
                        for (idx in 0 until tracks.length()) {
                            val t = tracks.getJSONObject(idx)
                            trackSig.append(t.optString("song_id")).append(':').append(t.optInt("position")).append(',')
                        }
                        val contentSignature = "$playlistId:$name:$desc:${tracks.length()}:$trackSig"
                        val clientMutationId = UUID.nameUUIDFromBytes("playlist:$contentSignature".toByteArray()).toString()
                        val entityId = UUID.nameUUIDFromBytes(playlistId.toByteArray()).toString()
                        val payload = JSONObject().apply {
                            put("playlist_id", playlistId)
                            put("name", name)
                            put("description", desc)
                            put("thumbnail_url", thumb)
                            put("is_auto_sync", true)
                            put("tracks", tracks)
                        }

                        mutations.put(JSONObject().apply {
                            put("client_mutation_id", clientMutationId)
                            put("entity_type", "playlist")
                            put("entity_id", entityId)
                            put("operation", "upsert")
                            put("payload", payload)
                        })
                    }
                }
            }

            // 3. Push mutations to backend /v1/sync/push
            if (mutations.length() > 0) {
                val pushEndpoint = "$workingBaseUrl/v1/sync/push"
                val pushConn = (URL(pushEndpoint).openConnection() as HttpURLConnection).apply {
                    requestMethod = "POST"
                    connectTimeout = 6_000
                    readTimeout = 6_000
                    doOutput = true
                    setRequestProperty("Authorization", "Bearer $token")
                    setRequestProperty("Content-Type", "application/json")
                    setRequestProperty("Accept", "application/json")
                }

                try {
                    val body = JSONObject().put("mutations", mutations).toString()
                    pushConn.outputStream.bufferedWriter().use { it.write(body) }
                    val code = pushConn.responseCode
                    if (code in 200..299) {
                        val respStr = pushConn.inputStream.bufferedReader().use { it.readText() }
                        val respJson = JSONObject(respStr)
                        val cursor = respJson.optLong("current_cursor", 0L)
                        if (cursor > 0) {
                            prefs.edit().putLong("sync_cursor", cursor).apply()
                        }
                    } else {
                        Timber.w("Sync push returned code $code")
                    }
                } finally {
                    pushConn.disconnect()
                }
            }

            // 4. Pull remote changes from backend /v1/sync/pull
            val currentCursor = if (forceFullPull) 0L else prefs.getLong("sync_cursor", 0L)
            val pullEndpoint = "$workingBaseUrl/v1/sync/pull?cursor=$currentCursor&limit=100"
            val pullConn = (URL(pullEndpoint).openConnection() as HttpURLConnection).apply {
                connectTimeout = 6_000
                readTimeout = 6_000
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("Accept", "application/json")
            }

            try {
                val code = pullConn.responseCode
                if (code in 200..299) {
                    val respStr = pullConn.inputStream.bufferedReader().use { it.readText() }
                    val respJson = JSONObject(respStr)
                    val nextCursor = respJson.optLong("next_cursor", currentCursor)
                    val mutationsArr = respJson.optJSONArray("mutations")

                    if (mutationsArr != null && mutationsArr.length() > 0) {
                        for (i in 0 until mutationsArr.length()) {
                            val m = mutationsArr.getJSONObject(i)
                            val entityType = m.optString("entity_type")
                            val operation = m.optString("operation", "upsert")
                            val payload = m.optJSONObject("payload") ?: continue

                            when (entityType) {
                                "playlist" -> {
                                    val playlistId = payload.optString("playlist_id").ifBlank { m.optString("entity_id") }
                                    if (operation == "delete") {
                                        if (playlistId.isNotBlank()) {
                                            val existing = database.playlistEntity(playlistId)
                                            if (existing != null) {
                                                database.delete(existing)
                                            }
                                            database.clearPlaylist(playlistId)
                                        }
                                        continue
                                    }

                                    val name = payload.optString("name")
                                    val desc = payload.optString("description")
                                    val thumb = payload.optString("thumbnail_url")
                                    val tracks = payload.optJSONArray("tracks")

                                    if (playlistId.isNotBlank() && name.isNotBlank()) {
                                        val existingPlaylist = database.playlistEntity(playlistId)
                                        val playlist = PlaylistEntity(
                                            id = playlistId,
                                            name = name,
                                            description = desc.ifBlank { existingPlaylist?.description },
                                            thumbnailUrl = thumb.ifBlank { existingPlaylist?.thumbnailUrl },
                                            isAutoSync = true,
                                            isEditable = true,
                                            isLocal = false,
                                            bookmarkedAt = existingPlaylist?.bookmarkedAt ?: LocalDateTime.now(),
                                            createdAt = existingPlaylist?.createdAt ?: LocalDateTime.now(),
                                            lastUpdateTime = LocalDateTime.now(),
                                        )
                                        database.upsert(playlist)

                                        if (tracks != null) {
                                            database.clearPlaylist(playlistId)
                                            for (t in 0 until tracks.length()) {
                                                val track = tracks.getJSONObject(t)
                                                val songId = track.optString("song_id")
                                                val songTitle = track.optString("title").ifBlank { "Track ${t + 1}" }
                                                val duration = track.optInt("duration", -1)
                                                val songThumb = track.optString("thumbnail_url")
                                                val albumName = track.optString("album_name")
                                                val position = track.optInt("position", t)

                                                if (songId.isNotBlank()) {
                                                    val existingSong = database.songEntity(songId)
                                                    val song = SongEntity(
                                                        id = songId,
                                                        title = songTitle,
                                                        duration = duration,
                                                        thumbnailUrl = songThumb.ifBlank { existingSong?.thumbnailUrl },
                                                        albumName = albumName.ifBlank { existingSong?.albumName },
                                                        liked = existingSong?.liked ?: false,
                                                        likedDate = existingSong?.likedDate,
                                                        totalPlayTime = existingSong?.totalPlayTime ?: 0,
                                                        inLibrary = existingSong?.inLibrary ?: LocalDateTime.now(),
                                                    )
                                                    database.upsert(song)

                                                    database.insert(
                                                        PlaylistSongMap(
                                                            playlistId = playlistId,
                                                            songId = songId,
                                                            position = position,
                                                        )
                                                    )
                                                }
                                            }
                                        }
                                    }
                                }
                                "library_item", "liked_song" -> {
                                    val songId = payload.optString("song_id")
                                    val title = payload.optString("title")
                                    val isLiked = payload.optBoolean("is_liked", true)
                                    if (songId.isNotBlank()) {
                                        val existingSong = database.songEntity(songId)
                                        val song = SongEntity(
                                            id = songId,
                                            title = title.ifBlank { existingSong?.title ?: "Liked Song" },
                                            duration = existingSong?.duration ?: -1,
                                            thumbnailUrl = existingSong?.thumbnailUrl,
                                            albumName = existingSong?.albumName,
                                            liked = isLiked,
                                            likedDate = if (isLiked) (existingSong?.likedDate ?: LocalDateTime.now()) else null,
                                            totalPlayTime = existingSong?.totalPlayTime ?: 0,
                                            inLibrary = existingSong?.inLibrary ?: LocalDateTime.now(),
                                        )
                                        database.upsert(song)
                                    }
                                }
                            }
                        }
                        database.invalidationTracker.refreshVersionsAsync()
                    }

                    if (nextCursor > 0) {
                        prefs.edit().putLong("sync_cursor", nextCursor).apply()
                    }
                }
            } finally {
                pullConn.disconnect()
            }

            val formattedTime = SimpleDateFormat("h:mm a", Locale.getDefault()).format(Date())
            val statusMsg = "Synced today at $formattedTime"
            prefs.edit().putString("last_sync_time", statusMsg).apply()
            _syncStatus.value = statusMsg
            Timber.i("Melo Cloud library sync completed successfully at $formattedTime")
        }.onFailure { err ->
            Timber.w(err, "Melo Cloud Sync encountered an issue: ${err.message}")
            _syncStatus.value = "Local library active (${err.localizedMessage ?: "Offline"})"
        }

        _isSyncing.value = false
        Result.success(Unit)
    }
}
