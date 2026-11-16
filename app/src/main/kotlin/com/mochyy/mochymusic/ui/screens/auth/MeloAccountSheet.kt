// MeloAccountSheet.kt
//
// Bottom sheet modal for Melo Account and Cloud Sync management.
// Follows the colleague app's PopupSheetState pattern:
// - Uses showWithHandle(fullBleed = true, surface = Onb.Page)
// - Sleek iOS dark surfaces with tactile pill buttons
// - Real-time library sync status display

package com.mochyy.mochymusic.ui.screens.auth

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import coil3.compose.AsyncImage
import com.mochyy.mochymusic.R
import com.mochyy.mochymusic.ui.component.PopupSheetHandle
import com.mochyy.mochymusic.ui.component.PopupSheetState
import com.mochyy.mochymusic.ui.screens.setup.onboarding.Onb
import com.mochyy.mochymusic.ui.screens.setup.onboarding.OnbButton
import com.mochyy.mochymusic.ui.screens.setup.onboarding.OnbButtonStyle
import com.mochyy.mochymusic.ui.screens.setup.onboarding.OnbCard
import com.mochyy.mochymusic.ui.theme.InterFontFamily
import kotlinx.coroutines.launch

private val ConnectedGreen = Color(0xFF30D158)

/**
 * Open the iOS-styled Account Sheet modal.
 */
fun PopupSheetState.showAccountSheet(
    authViewModel: MeloAuthViewModel,
    onNavigateToLogin: () -> Unit = {},
) {
    var sheet: PopupSheetHandle? = null
    sheet = showWithHandle(fullBleed = true, surface = Onb.Page) {
        AccountSheetContent(
            authViewModel = authViewModel,
            onDismiss = { sheet?.dismiss() },
            onNavigateToLogin = {
                sheet?.dismiss()
                onNavigateToLogin()
            },
        )
    }
}

@Composable
private fun AccountSheetContent(
    authViewModel: MeloAuthViewModel,
    onDismiss: () -> Unit,
    onNavigateToLogin: () -> Unit,
) {
    val currentUser by authViewModel.currentUser.collectAsState()
    val syncState by authViewModel.syncStatus.collectAsState()
    val scope = rememberCoroutineScope()
    var isSyncing by remember { mutableStateOf(false) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 24.dp)
            .padding(top = 8.dp, bottom = 28.dp),
    ) {
        if (currentUser != null) {
            val user = currentUser!!
            // Authenticated Account View
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier.fillMaxWidth(),
            ) {
                // User Avatar
                Box(
                    modifier = Modifier
                        .size(64.dp)
                        .clip(CircleShape)
                        .background(Onb.Card),
                    contentAlignment = Alignment.Center,
                ) {
                    if (user.photoUrl != null) {
                        AsyncImage(
                            model = user.photoUrl,
                            contentDescription = null,
                            contentScale = ContentScale.Crop,
                            modifier = Modifier.size(64.dp).clip(CircleShape),
                        )
                    } else {
                        Text(
                            text = (user.displayName?.take(1) ?: user.email?.take(1) ?: "M").uppercase(),
                            color = Color.White,
                            fontSize = 26.sp,
                            fontFamily = InterFontFamily,
                            fontWeight = FontWeight.Bold,
                        )
                    }
                }

                Spacer(Modifier.width(16.dp))

                Column(modifier = Modifier.weight(1f)) {
                    Text(
                        text = user.displayName ?: "Melo Listener",
                        color = Color.White,
                        fontSize = 20.sp,
                        fontFamily = InterFontFamily,
                        fontWeight = FontWeight.Bold,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )
                    Spacer(Modifier.height(3.dp))
                    Text(
                        text = user.email ?: "",
                        color = Onb.Subtitle,
                        fontSize = 13.sp,
                        fontFamily = InterFontFamily,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis,
                    )

                    Spacer(Modifier.height(6.dp))

                    // Cloud Active Badge
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .clip(CircleShape)
                            .background(Color(0xFF242424))
                            .padding(horizontal = 8.dp, vertical = 3.dp),
                    ) {
                        Box(
                            modifier = Modifier
                                .size(6.dp)
                                .clip(CircleShape)
                                .background(ConnectedGreen),
                        )
                        Spacer(Modifier.width(6.dp))
                        Text(
                            text = "Cloud Sync Active",
                            color = ConnectedGreen,
                            fontSize = 11.sp,
                            fontFamily = InterFontFamily,
                            fontWeight = FontWeight.SemiBold,
                        )
                    }
                }
            }

            Spacer(Modifier.height(24.dp))

            // Sync Status Card
            OnbCard(
                modifier = Modifier.fillMaxWidth(),
                shape = RoundedCornerShape(20.dp),
            ) {
                Column(modifier = Modifier.padding(18.dp)) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.SpaceBetween,
                        modifier = Modifier.fillMaxWidth(),
                    ) {
                        Column {
                            Text(
                                text = "Library Synchronization",
                                color = Color.White,
                                fontSize = 16.sp,
                                fontFamily = InterFontFamily,
                                fontWeight = FontWeight.Bold,
                            )
                            Spacer(Modifier.height(2.dp))
                            Text(
                                text = syncState,
                                color = Onb.Subtitle,
                                fontSize = 13.sp,
                                fontFamily = InterFontFamily,
                            )
                        }

                        if (isSyncing) {
                            CircularProgressIndicator(
                                color = Color.White,
                                strokeWidth = 2.dp,
                                modifier = Modifier.size(20.dp),
                            )
                        }
                    }

                    Spacer(Modifier.height(14.dp))

                    OnbButton(
                        text = if (isSyncing) "Syncing Library..." else "Sync Now",
                        style = OnbButtonStyle.Secondary,
                        enabled = !isSyncing,
                        onClick = {
                            isSyncing = true
                            scope.launch {
                                try {
                                    authViewModel.triggerSync()
                                } finally {
                                    isSyncing = false
                                }
                            }
                        },
                    )
                }
            }

            Spacer(Modifier.height(18.dp))

            // Sign Out Button
            OnbButton(
                text = "Sign Out",
                style = OnbButtonStyle.Secondary,
                onClick = {
                    authViewModel.signOut()
                    onDismiss()
                },
            )
        } else {
            // Guest Account View
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth(),
            ) {
                Box(
                    modifier = Modifier
                        .size(60.dp)
                        .clip(CircleShape)
                        .background(Onb.Card),
                    contentAlignment = Alignment.Center,
                ) {
                    Icon(
                        painter = painterResource(R.drawable.person),
                        contentDescription = null,
                        tint = Color.White,
                        modifier = Modifier.size(28.dp),
                    )
                }

                Spacer(Modifier.height(14.dp))

                Text(
                    text = "Guest Mode",
                    color = Color.White,
                    fontSize = 22.sp,
                    fontFamily = InterFontFamily,
                    fontWeight = FontWeight.Bold,
                )

                Spacer(Modifier.height(6.dp))

                Text(
                    text = "You are using Melo in Guest Mode. Connect your account to backup and sync your playlists and favorites across devices.",
                    color = Onb.Subtitle,
                    fontSize = 14.sp,
                    fontFamily = InterFontFamily,
                    textAlign = androidx.compose.ui.text.style.TextAlign.Center,
                    lineHeight = 20.sp,
                    modifier = Modifier.padding(horizontal = 8.dp),
                )

                Spacer(Modifier.height(24.dp))

                OnbButton(
                    text = "Sign In or Register",
                    style = OnbButtonStyle.Primary,
                    onClick = onNavigateToLogin,
                )

                Spacer(Modifier.height(10.dp))

                OnbButton(
                    text = "Dismiss",
                    style = OnbButtonStyle.Secondary,
                    onClick = onDismiss,
                )
            }
        }
    }
}
