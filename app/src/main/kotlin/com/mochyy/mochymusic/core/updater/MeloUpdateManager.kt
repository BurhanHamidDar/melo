package com.mochyy.mochymusic.core.updater

import android.content.Context
import android.content.Intent
import android.net.Uri
import com.mochyy.mochymusic.BuildConfig
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.io.File
import java.net.HttpURLConnection
import java.net.URL

data class MeloReleaseInfo(
    val versionCode: Long,
    val versionName: String,
    val minSupportedVersionCode: Long,
    val releaseNotes: String,
    val downloadUrl: String,
    val fileSizeBytes: Long,
    val sha256: String,
    val isMandatory: Boolean,
    val hasUpdate: Boolean,
)

object MeloUpdateManager {
    // Configurable backend API base URL
    var backendApiBaseUrl = "https://api.melo.app"

    private val _updateState = MutableStateFlow<MeloReleaseInfo?>(null)
    val updateState: StateFlow<MeloReleaseInfo?> = _updateState.asStateFlow()

    // Resets on each cold launch so optional updates remind every time app opens
    private val _dismissedThisSession = MutableStateFlow(false)
    val dismissedThisSession: StateFlow<Boolean> = _dismissedThisSession.asStateFlow()

    fun dismissForThisSession() {
        val current = _updateState.value
        // Only optional updates can be dismissed
        if (current != null && !current.isMandatory) {
            _dismissedThisSession.value = true
        }
    }

    suspend fun checkForUpdate(context: Context, force: Boolean = false): MeloReleaseInfo? =
        withContext(Dispatchers.IO) {
            runCatching {
                val currentVersionCode = BuildConfig.VERSION_CODE.toLong()
                val channel = updateChannel(context).name.lowercase()

                val endpoint = "$backendApiBaseUrl/api/v1/releases/latest?version_code=$currentVersionCode&channel=$channel"
                val conn = (URL(endpoint).openConnection() as HttpURLConnection).apply {
                    connectTimeout = 8_000
                    readTimeout = 8_000
                    setRequestProperty("Accept", "application/json")
                    setRequestProperty("User-Agent", "Melo-Android/${BuildConfig.VERSION_NAME}")
                }

                try {
                    val code = conn.responseCode
                    if (code == 200) {
                        val body = conn.inputStream.bufferedReader().use { it.readText() }
                        val json = JSONObject(body)
                        val hasUpdate = json.optBoolean("has_update", false)
                        val isMandatoryFlag = json.optBoolean("is_mandatory", false)
                        val relObj = json.optJSONObject("release")

                        if (relObj != null) {
                            val relVersionCode = relObj.optLong("version_code", 0L)
                            val relVersionName = relObj.optString("version_name", "")
                            val minSupported = relObj.optLong("min_supported_version_code", 0L)
                            val releaseNotes = relObj.optString("release_notes", "A new version of Melo is available.")
                            val downloadUrl = relObj.optString("download_url", "")
                            val fileSize = relObj.optLong("file_size_bytes", 0L)
                            val sha256 = relObj.optString("sha256", "")
                            val mandatoryFromRel = relObj.optBoolean("mandatory", false)

                            val mandatory = isMandatoryFlag || mandatoryFromRel ||
                                    (currentVersionCode > 0 && currentVersionCode < minSupported)

                            val info = MeloReleaseInfo(
                                versionCode = relVersionCode,
                                versionName = relVersionName,
                                minSupportedVersionCode = minSupported,
                                releaseNotes = releaseNotes,
                                downloadUrl = downloadUrl,
                                fileSizeBytes = fileSize,
                                sha256 = sha256,
                                isMandatory = mandatory,
                                hasUpdate = hasUpdate || relVersionCode > currentVersionCode,
                            )

                            if (info.hasUpdate) {
                                _updateState.value = info
                                return@runCatching info
                            }
                        }
                    }
                } finally {
                    conn.disconnect()
                }

                // Fallback to GitHub releases if backend is not reachable or has no release
                val ghRelease = getLatestRelease(updateChannel(context), force).getOrNull()
                if (ghRelease != null && isNewerThanInstalled(ghRelease.version)) {
                    val fullVer = parseFullVersion(ghRelease.version)
                    val info = MeloReleaseInfo(
                        versionCode = fullVer.buildNumber.toLong().takeIf { it > 0 } ?: (currentVersionCode + 1),
                        versionName = ghRelease.version,
                        minSupportedVersionCode = 0L,
                        releaseNotes = ghRelease.body.ifBlank { "What's new in Melo ${ghRelease.version}" },
                        downloadUrl = ghRelease.apkUrl ?: ghRelease.htmlUrl,
                        fileSizeBytes = ghRelease.apkSizeBytes,
                        sha256 = "",
                        isMandatory = false,
                        hasUpdate = true,
                    )
                    _updateState.value = info
                    return@runCatching info
                }

                _updateState.value = null
                null
            }.getOrNull()
        }

    fun openDownloadUrl(context: Context, urlString: String) {
        runCatching {
            val uri = Uri.parse(urlString)
            val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }
    }
}
