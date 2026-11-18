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
    private val isEmulator: Boolean by lazy {
        android.os.Build.FINGERPRINT.startsWith("generic") ||
            android.os.Build.FINGERPRINT.startsWith("unknown") ||
            android.os.Build.MODEL.contains("google_sdk") ||
            android.os.Build.MODEL.contains("Emulator") ||
            android.os.Build.MODEL.contains("Android SDK built for x86") ||
            android.os.Build.MANUFACTURER.contains("Genymotion") ||
            (android.os.Build.BRAND.startsWith("generic") && android.os.Build.DEVICE.startsWith("generic")) ||
            "google_sdk" == android.os.Build.PRODUCT
    }

    // Configurable backend API base URL
    var backendApiBaseUrl = if (BuildConfig.DEBUG) {
        if (isEmulator) "http://10.0.2.2:8080" else "http://192.168.31.36:8080"
    } else {
        "https://api.melo.app"
    }

    val candidateBaseUrls: List<String>
        get() = if (BuildConfig.DEBUG) {
            if (isEmulator) {
                listOf(
                    "http://10.0.2.2:8080",
                    "http://192.168.31.36:8080",
                    "http://127.0.0.1:8080",
                    "https://api.melo.app"
                )
            } else {
                listOf(
                    "http://192.168.31.36:8080",
                    "http://10.0.2.2:8080",
                    "http://127.0.0.1:8080",
                    "https://api.melo.app"
                )
            }
        } else {
            listOf("https://api.melo.app")
        }

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

    fun resetDismissed() {
        _dismissedThisSession.value = false
    }

    suspend fun checkForUpdate(context: Context, force: Boolean = false): MeloReleaseInfo? =
        withContext(Dispatchers.IO) {
            runCatching {
                if (force) {
                    _dismissedThisSession.value = false
                }
                val currentVersionCode = BuildConfig.VERSION_CODE.toLong()
                val channel = updateChannel(context).name.lowercase()

                for (base in candidateBaseUrls) {
                    val endpoint = "$base/api/v1/releases/latest?version_code=$currentVersionCode&channel=$channel"
                    val conn = runCatching {
                        (URL(endpoint).openConnection() as HttpURLConnection).apply {
                            connectTimeout = 2_500
                            readTimeout = 2_500
                            setRequestProperty("Accept", "application/json")
                            setRequestProperty("User-Agent", "Melo-Android/${BuildConfig.VERSION_NAME}")
                        }
                    }.getOrNull() ?: continue

                    try {
                        val code = conn.responseCode
                        if (code == 200) {
                            backendApiBaseUrl = base
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
                                val rawDownloadUrl = relObj.optString("download_url", "")
                                val downloadUrl = if (rawDownloadUrl.isNotBlank() && !rawDownloadUrl.startsWith("http://") && !rawDownloadUrl.startsWith("https://")) {
                                    "${base.trimEnd('/')}/${rawDownloadUrl.trimStart('/')}"
                                } else {
                                    rawDownloadUrl
                                }
                                val fileSize = relObj.optLong("file_size_bytes", 0L)
                                val sha256 = relObj.optString("sha256", "")
                                val mandatoryFromRel = relObj.optBoolean("mandatory", false)

                                val mandatory = isMandatoryFlag || mandatoryFromRel ||
                                        (minSupported > 1 && currentVersionCode > 0 && currentVersionCode < minSupported)

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
                                // No update needed from backend
                                _updateState.value = null
                                return@runCatching null
                            }
                        }
                    } catch (_: Exception) {
                        // try next candidate base URL
                    } finally {
                        conn.disconnect()
                    }
                }

                // Fallback to GitHub releases if backend is not reachable or has no release
                val ghRelease = getLatestRelease(updateChannel(context), force).getOrNull()
                if (ghRelease != null && isNewerThanInstalled(ghRelease.version)) {
                    val fullVer = parseFullVersion(ghRelease.version)
                    val rawGhUrl = ghRelease.apkUrl ?: ghRelease.htmlUrl
                    val info = MeloReleaseInfo(
                        versionCode = fullVer.buildNumber.toLong().takeIf { it > 0 } ?: (currentVersionCode + 1),
                        versionName = ghRelease.version,
                        minSupportedVersionCode = 0L,
                        releaseNotes = ghRelease.body.ifBlank { "What's new in Melo ${ghRelease.version}" },
                        downloadUrl = rawGhUrl,
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
            val target = if (urlString.isNotBlank() && !urlString.startsWith("http://") && !urlString.startsWith("https://")) {
                "${backendApiBaseUrl.trimEnd('/')}/${urlString.trimStart('/')}"
            } else {
                urlString
            }
            val uri = Uri.parse(target)
            val intent = Intent(Intent.ACTION_VIEW, uri).apply {
                addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            }
            context.startActivity(intent)
        }
    }
}
