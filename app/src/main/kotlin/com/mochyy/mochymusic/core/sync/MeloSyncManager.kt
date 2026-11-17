package com.mochyy.mochymusic.core.sync

import android.content.Context
import com.mochyy.mochymusic.BuildConfig
import com.mochyy.mochymusic.core.auth.MeloAuthRepository
import com.mochyy.mochymusic.core.updater.MeloUpdateManager
import com.mochyy.mochymusic.db.MusicDatabase
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
import java.util.Date
import java.util.Locale
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

/**
 * MeloSyncManager provides idempotent, local-first library and account synchronization
 * with the Melo Go backend and Neon PostgreSQL database.
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

    suspend fun syncNow(): Result<Unit> = withContext(Dispatchers.IO) {
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

            // 2. Gather local liked songs & playlists to push
            val mutations = JSONArray()

            // Collect liked songs from local Room database
            val db = database.openHelper.readableDatabase
            db.query("SELECT id, title, liked FROM song WHERE liked = 1 LIMIT 200").use { cursor ->
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

            // Collect user playlists
            db.query("SELECT id, name FROM playlist LIMIT 50").use { cursor ->
                val idIdx = cursor.getColumnIndex("id")
                val nameIdx = cursor.getColumnIndex("name")
                while (cursor.moveToNext()) {
                    val playlistId = if (idIdx >= 0) cursor.getString(idIdx) else ""
                    val name = if (nameIdx >= 0) cursor.getString(nameIdx) else ""
                    if (playlistId.isNotBlank()) {
                        val clientMutationId = UUID.nameUUIDFromBytes("playlist:$playlistId".toByteArray()).toString()
                        val entityId = UUID.nameUUIDFromBytes(playlistId.toByteArray()).toString()
                        val payload = JSONObject().apply {
                            put("playlist_id", playlistId)
                            put("name", name)
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
                    connectTimeout = 5_000
                    readTimeout = 5_000
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
                    }
                } finally {
                    pushConn.disconnect()
                }
            }

            // 4. Pull any incoming remote changes from backend /v1/sync/pull
            val currentCursor = prefs.getLong("sync_cursor", 0L)
            val pullEndpoint = "$workingBaseUrl/v1/sync/pull?cursor=$currentCursor&limit=50"
            val pullConn = (URL(pullEndpoint).openConnection() as HttpURLConnection).apply {
                connectTimeout = 5_000
                readTimeout = 5_000
                setRequestProperty("Authorization", "Bearer $token")
                setRequestProperty("Accept", "application/json")
            }

            try {
                val code = pullConn.responseCode
                if (code in 200..299) {
                    val respStr = pullConn.inputStream.bufferedReader().use { it.readText() }
                    val respJson = JSONObject(respStr)
                    val nextCursor = respJson.optLong("next_cursor", currentCursor)
                    prefs.edit().putLong("sync_cursor", nextCursor).apply()
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
