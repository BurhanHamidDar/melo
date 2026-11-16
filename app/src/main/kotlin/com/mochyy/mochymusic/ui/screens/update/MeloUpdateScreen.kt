package com.mochyy.mochymusic.ui.screens.update

import android.app.Activity
import androidx.activity.compose.BackHandler
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableFloatStateOf
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.mochyy.mochymusic.BuildConfig
import com.mochyy.mochymusic.R
import com.mochyy.mochymusic.core.updater.GithubRelease
import com.mochyy.mochymusic.core.updater.MeloReleaseInfo
import com.mochyy.mochymusic.core.updater.MeloUpdateManager
import com.mochyy.mochymusic.core.updater.downloadApk
import com.mochyy.mochymusic.core.updater.formatBytes
import com.mochyy.mochymusic.core.updater.installApk
import com.mochyy.mochymusic.ui.player.menu.MenuRowSurface
import com.mochyy.mochymusic.ui.screens.setup.onboarding.Onb
import com.mochyy.mochymusic.ui.screens.setup.onboarding.OnbButton
import com.mochyy.mochymusic.ui.screens.setup.onboarding.OnbButtonStyle
import com.mochyy.mochymusic.ui.screens.setup.onboarding.OnbCard
import com.mochyy.mochymusic.ui.theme.InterFontFamily
import kotlinx.coroutines.launch

private val MandatoryRed = Color(0xFFFF3B5C)
private val OptionalBlue = Color(0xFF0A84FF)
private val DarkBg = Color(0xFF141414)
private val CardBg = Color(0xFF222222)

/**
 * Full-screen iOS-styled update screen.
 * - If [isMandatory] is true: User cannot dismiss or use app until updated.
 * - If [isMandatory] is false: User can skip for this session, but will be reminded on each cold launch.
 */
@Composable
fun MeloUpdateScreen(
    release: MeloReleaseInfo,
    onDismiss: () -> Unit = {},
    modifier: Modifier = Modifier,
) {
    val context = LocalContext.current
    val scope = rememberCoroutineScope()
    val scrollState = rememberScrollState()

    var isDownloading by remember { mutableStateOf(false) }
    var downloadProgress by remember { mutableFloatStateOf(0f) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    // Intercept hardware/gesture Back button
    BackHandler {
        if (release.isMandatory) {
            // Cannot bypass mandatory update — minimize app to launcher
            (context as? Activity)?.moveTaskToBack(true)
        } else {
            onDismiss()
        }
    }

    Box(
        modifier = modifier
            .fillMaxSize()
            .background(DarkBg)
            .statusBarsPadding()
            .navigationBarsPadding(),
    ) {
        // Spinning canvas art ring positioned behind the top icon
        Box(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .padding(top = 16.dp),
        ) {
            VersionRing(
                text = "MELO UPDATE · V${release.versionName} · ",
                radius = 110.dp,
                band = 36.dp,
                ringColor = if (release.isMandatory) MandatoryRed.copy(alpha = 0.12f) else OptionalBlue.copy(alpha = 0.12f),
                textColor = Color.White.copy(alpha = 0.35f),
                turnMillis = 20_000,
            )
        }

        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            modifier = Modifier
                .fillMaxSize()
                .padding(horizontal = 24.dp)
                .verticalScroll(scrollState),
        ) {
            Spacer(Modifier.height(48.dp))

            // App Icon Bubble
            Box(
                modifier = Modifier
                    .size(88.dp)
                    .clip(RoundedCornerShape(26.dp))
                    .background(CardBg),
                contentAlignment = Alignment.Center,
            ) {
                Icon(
                    painter = painterResource(R.drawable.ic_mochy_mark),
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(46.dp),
                )
            }

            Spacer(Modifier.height(18.dp))

            // Update Badge
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .clip(CircleShape)
                    .background(if (release.isMandatory) MandatoryRed.copy(alpha = 0.18f) else OptionalBlue.copy(alpha = 0.18f))
                    .padding(horizontal = 12.dp, vertical = 5.dp),
            ) {
                Box(
                    modifier = Modifier
                        .size(8.dp)
                        .clip(CircleShape)
                        .background(if (release.isMandatory) MandatoryRed else OptionalBlue),
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    text = if (release.isMandatory) "Mandatory Update Required" else "New Version Available",
                    color = if (release.isMandatory) MandatoryRed else OptionalBlue,
                    fontSize = 12.sp,
                    fontFamily = InterFontFamily,
                    fontWeight = FontWeight.Bold,
                )
            }

            Spacer(Modifier.height(12.dp))

            // Title
            Text(
                text = "Melo v${release.versionName}",
                color = Color.White,
                fontSize = 28.sp,
                fontFamily = InterFontFamily,
                fontWeight = FontWeight.ExtraBold,
                letterSpacing = (-0.8).sp,
            )

            Spacer(Modifier.height(4.dp))

            Text(
                text = "Installed: v${BuildConfig.VERSION_NAME} (code ${BuildConfig.VERSION_CODE})",
                color = Onb.Subtitle,
                fontSize = 13.sp,
                fontFamily = InterFontFamily,
            )

            Spacer(Modifier.height(24.dp))

            // Admin-configured Description & Release Notes Card
            OnbCard(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Text(
                        text = "What's New in this Update",
                        color = Color.White,
                        fontSize = 16.sp,
                        fontFamily = InterFontFamily,
                        fontWeight = FontWeight.Bold,
                    )

                    Spacer(Modifier.height(10.dp))

                    Text(
                        text = release.releaseNotes.ifBlank { "Performance improvements, stability updates, and new features." },
                        color = Color(0xFFDDDDDD),
                        fontSize = 14.sp,
                        fontFamily = InterFontFamily,
                        lineHeight = 21.sp,
                    )

                    if (release.fileSizeBytes > 0) {
                        Spacer(Modifier.height(14.dp))
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(
                                painter = painterResource(R.drawable.storage),
                                contentDescription = null,
                                tint = Onb.Subtitle,
                                modifier = Modifier.size(16.dp),
                            )
                            Spacer(Modifier.width(6.dp))
                            Text(
                                text = "Download Size: ${formatBytes(release.fileSizeBytes)}",
                                color = Onb.Subtitle,
                                fontSize = 12.sp,
                                fontFamily = InterFontFamily,
                            )
                        }
                    }
                }
            }

            if (errorMessage != null) {
                Spacer(Modifier.height(12.dp))
                Text(
                    text = errorMessage!!,
                    color = MandatoryRed,
                    fontSize = 13.sp,
                    fontFamily = InterFontFamily,
                    textAlign = TextAlign.Center,
                )
            }

            Spacer(Modifier.height(28.dp))

            // Action Buttons
            if (isDownloading) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    modifier = Modifier.fillMaxWidth(),
                ) {
                    CircularProgressIndicator(
                        color = Color.White,
                        strokeWidth = 3.dp,
                        modifier = Modifier.size(32.dp),
                    )
                    Spacer(Modifier.height(10.dp))
                    Text(
                        text = if (downloadProgress > 0f) "Downloading update: ${(downloadProgress * 100).toInt()}%" else "Starting download...",
                        color = Onb.Subtitle,
                        fontSize = 13.sp,
                        fontFamily = InterFontFamily,
                    )
                }
            } else {
                OnbButton(
                    text = "Update Melo Now",
                    style = OnbButtonStyle.Primary,
                    onClick = {
                        if (release.downloadUrl.isNotBlank()) {
                            if (release.downloadUrl.endsWith(".apk", ignoreCase = true)) {
                                isDownloading = true
                                errorMessage = null
                                scope.launch {
                                    val ghRel = GithubRelease(
                                        title = "Melo v${release.versionName}",
                                        tag = release.versionName,
                                        version = release.versionName,
                                        body = release.releaseNotes,
                                        htmlUrl = release.downloadUrl,
                                        apkUrl = release.downloadUrl,
                                        apkName = "melo-v${release.versionName}.apk",
                                        apkSizeBytes = release.fileSizeBytes,
                                        publishedAt = "",
                                    )
                                    val result = downloadApk(context, ghRel) { progress ->
                                        downloadProgress = progress
                                    }
                                    isDownloading = false
                                    result.fold(
                                        onSuccess = { apkFile ->
                                            installApk(context, apkFile)
                                        },
                                        onFailure = { err ->
                                            errorMessage = err.message ?: "Download failed, opening browser..."
                                            MeloUpdateManager.openDownloadUrl(context, release.downloadUrl)
                                        },
                                    )
                                }
                            } else {
                                MeloUpdateManager.openDownloadUrl(context, release.downloadUrl)
                            }
                        } else {
                            errorMessage = "No download link provided for this release."
                        }
                    },
                )

                if (!release.isMandatory) {
                    Spacer(Modifier.height(10.dp))
                    OnbButton(
                        text = "Skip for Now",
                        style = OnbButtonStyle.Secondary,
                        onClick = onDismiss,
                    )
                    Spacer(Modifier.height(6.dp))
                    Text(
                        text = "You will be reminded again the next time you open Melo.",
                        color = Onb.Subtitle.copy(alpha = 0.7f),
                        fontSize = 11.5.sp,
                        fontFamily = InterFontFamily,
                        textAlign = TextAlign.Center,
                    )
                } else {
                    Spacer(Modifier.height(12.dp))
                    Text(
                        text = "This update is required to continue using Melo. All streaming and library features will resume immediately after updating.",
                        color = Onb.Subtitle,
                        fontSize = 12.sp,
                        fontFamily = InterFontFamily,
                        textAlign = TextAlign.Center,
                        lineHeight = 17.sp,
                        modifier = Modifier.padding(horizontal = 12.dp),
                    )
                }
            }

            Spacer(Modifier.height(36.dp))
        }
    }
}
