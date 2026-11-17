// MeloLoginScreen.kt
//
// iOS-style authentication screen for Melo.
// Adheres strictly to the Melo Onboarding/Profile design language:
// - Inter typography with tight tracking
// - Pure dark surfaces with charcoal bubble containers (Color(0xFF1C1C1C) / Color(0xFF2C2C2C))
// - Tactile pill buttons with depression animation (0.97f scale)
// - Seamless guest mode fallback: "Continue as Guest" allows full offline/online streaming without friction.

package com.mochyy.mochymusic.ui.screens.auth

import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInVertically
import androidx.compose.animation.slideOutVertically
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.interaction.collectIsPressedAsState
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.BoxWithConstraints
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.layout.widthIn
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.BasicTextField
import androidx.compose.foundation.text.KeyboardActions
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.CircularProgressIndicator
import androidx.compose.material3.Icon
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.rememberCoroutineScope
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusDirection
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.SolidColor
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.platform.LocalFocusManager
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.TextStyle
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.input.VisualTransformation
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.em
import androidx.compose.ui.unit.sp
import com.google.android.gms.auth.api.signin.GoogleSignIn
import com.google.android.gms.auth.api.signin.GoogleSignInOptions
import com.google.android.gms.common.api.ApiException
import com.mochyy.mochymusic.R
import com.mochyy.mochymusic.ui.component.RemoteFocus
import com.mochyy.mochymusic.ui.screens.setup.onboarding.Onb
import com.mochyy.mochymusic.ui.screens.setup.onboarding.OnbButton
import com.mochyy.mochymusic.ui.screens.setup.onboarding.OnbButtonStyle
import com.mochyy.mochymusic.ui.screens.setup.onboarding.OnbSubtitleTracking
import com.mochyy.mochymusic.ui.screens.setup.onboarding.OnbTitleTracking
import com.mochyy.mochymusic.ui.screens.setup.onboarding.PageBadge
import com.mochyy.mochymusic.ui.theme.InterFontFamily
import kotlinx.coroutines.launch

private val WarningRed = Color(0xFFFF453A)
private val WarningRedBg = Color(0x2BFF453A)

/**
 * iOS-styled full screen authentication page.
 */
@Composable
fun MeloLoginScreen(
    onDismiss: () -> Unit,
    onLoginSuccess: () -> Unit,
    onGoogleSignInClick: () -> Unit = {},
    authViewModel: MeloAuthViewModel? = null,
    modifier: Modifier = Modifier,
) {
    var isSignUp by remember { mutableStateOf(false) }
    var email by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var displayName by remember { mutableStateOf("") }
    var passwordVisible by remember { mutableStateOf(false) }
    var isLoading by remember { mutableStateOf(false) }
    var errorMessage by remember { mutableStateOf<String?>(null) }

    val focusManager = LocalFocusManager.current
    val scope = rememberCoroutineScope()
    val context = LocalContext.current

    val webClientId = "522961269977-4868df4ujusqae79lj55pg2icdek2srh.apps.googleusercontent.com"
    val gso = remember {
        GoogleSignInOptions.Builder(GoogleSignInOptions.DEFAULT_SIGN_IN)
            .requestIdToken(webClientId)
            .requestEmail()
            .build()
    }
    val googleSignInClient = remember { GoogleSignIn.getClient(context, gso) }

    val googleSignInLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.StartActivityForResult()
    ) { result ->
        val task = GoogleSignIn.getSignedInAccountFromIntent(result.data)
        try {
            val account = task.getResult(ApiException::class.java)
            val idToken = account.idToken
            if (idToken != null) {
                isLoading = true
                errorMessage = null
                scope.launch {
                    try {
                        val res = authViewModel?.signInWithGoogle(idToken)
                        if (res?.isSuccess == true) {
                            onLoginSuccess()
                        } else {
                            errorMessage = res?.exceptionOrNull()?.localizedMessage ?: "Google sign-in failed."
                        }
                    } catch (e: Exception) {
                        errorMessage = e.localizedMessage ?: "Google sign-in failed."
                    } finally {
                        isLoading = false
                    }
                }
            } else {
                errorMessage = "Google sign-in did not return a valid token."
            }
        } catch (e: ApiException) {
            if (e.statusCode != 12501) { // 12501 = user canceled
                errorMessage = "Google sign-in error (${e.statusCode}): ${e.localizedMessage}"
            }
        } catch (e: Exception) {
            errorMessage = e.localizedMessage ?: "Google sign-in failed."
        }
    }

    BoxWithConstraints(
        modifier = modifier
            .fillMaxSize()
            .background(Onb.Page)
    ) {
        val maxW = maxWidth
        val sidePadding = if (maxW < 340.dp) 20.dp else 28.dp

        Column(
            modifier = Modifier
                .align(Alignment.TopCenter)
                .widthIn(max = Onb.MaxContentWidth)
                .fillMaxSize(),
        ) {
            // Scrollable Content
            Column(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth()
                    .verticalScroll(rememberScrollState())
                    .padding(horizontal = sidePadding)
                    .padding(top = Onb.TopClearance + 16.dp, bottom = 16.dp),
            ) {
                // Top Badge
                PageBadge(
                    icon = painterResource(R.drawable.person),
                    size = 44.dp,
                )

                Spacer(Modifier.height(20.dp))

                // Title
                Text(
                    text = if (isSignUp) "Create Account" else "Welcome to Melo",
                    color = Onb.Title,
                    fontSize = 32.sp,
                    lineHeight = 36.sp,
                    fontWeight = FontWeight.Bold,
                    letterSpacing = OnbTitleTracking,
                )

                Spacer(Modifier.height(8.dp))

                // Subtitle
                Text(
                    text = if (isSignUp)
                        "Sync your playlists, favorites, and listening stats across all your devices."
                    else
                        "Sign in to access your cloud library and synchronized preferences.",
                    color = Onb.Subtitle,
                    fontSize = 15.sp,
                    lineHeight = 21.sp,
                    fontWeight = FontWeight.Medium,
                    letterSpacing = OnbSubtitleTracking,
                )

                Spacer(Modifier.height(24.dp))

                // Mode Toggle Capsule (iOS segmented pill)
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .clip(CircleShape)
                        .background(Color(0xFF242424))
                        .padding(4.dp),
                ) {
                    AuthTabPill(
                        title = "Sign In",
                        selected = !isSignUp,
                        onClick = {
                            isSignUp = false
                            errorMessage = null
                        },
                        modifier = Modifier.weight(1f),
                    )
                    AuthTabPill(
                        title = "Create Account",
                        selected = isSignUp,
                        onClick = {
                            isSignUp = true
                            errorMessage = null
                        },
                        modifier = Modifier.weight(1f),
                    )
                }

                Spacer(Modifier.height(20.dp))

                // Error Banner
                AnimatedVisibility(
                    visible = errorMessage != null,
                    enter = fadeIn() + slideInVertically(),
                    exit = fadeOut() + slideOutVertically(),
                ) {
                    errorMessage?.let { msg ->
                        Box(
                            modifier = Modifier
                                .fillMaxWidth()
                                .clip(RoundedCornerShape(16.dp))
                                .background(WarningRedBg)
                                .padding(horizontal = 16.dp, vertical = 12.dp),
                        ) {
                            Text(
                                text = msg,
                                color = WarningRed,
                                fontSize = 13.sp,
                                fontFamily = InterFontFamily,
                                fontWeight = FontWeight.Medium,
                            )
                        }
                        Spacer(Modifier.height(16.dp))
                    }
                }

                // Sign Up: Display Name Field
                if (isSignUp) {
                    AuthInputField(
                        value = displayName,
                        onValueChange = { displayName = it },
                        placeholder = "Display Name",
                        keyboardType = KeyboardType.Text,
                        imeAction = ImeAction.Next,
                        onImeAction = { focusManager.moveFocus(FocusDirection.Down) },
                    )
                    Spacer(Modifier.height(12.dp))
                }

                // Email Field
                AuthInputField(
                    value = email,
                    onValueChange = {
                        email = it
                        errorMessage = null
                    },
                    placeholder = "Email Address",
                    keyboardType = KeyboardType.Email,
                    imeAction = ImeAction.Next,
                    onImeAction = { focusManager.moveFocus(FocusDirection.Down) },
                )

                Spacer(Modifier.height(12.dp))

                // Password Field
                AuthInputField(
                    value = password,
                    onValueChange = {
                        password = it
                        errorMessage = null
                    },
                    placeholder = "Password",
                    keyboardType = KeyboardType.Password,
                    imeAction = ImeAction.Done,
                    isPassword = true,
                    passwordVisible = passwordVisible,
                    onTogglePasswordVisibility = { passwordVisible = !passwordVisible },
                    onImeAction = {
                        focusManager.clearFocus()
                        // Trigger submit
                    },
                )

                Spacer(Modifier.height(20.dp))

                // Submit Button
                OnbButton(
                    text = if (isLoading) "Please wait..." else (if (isSignUp) "Create Account" else "Sign In"),
                    enabled = !isLoading && email.isNotBlank() && password.isNotBlank() && (!isSignUp || displayName.isNotBlank()),
                    onClick = {
                        focusManager.clearFocus()
                        isLoading = true
                        errorMessage = null
                        scope.launch {
                            try {
                                if (authViewModel != null) {
                                    val res = if (isSignUp) {
                                        authViewModel.signUpWithEmail(email.trim(), password, displayName.trim())
                                    } else {
                                        authViewModel.signInWithEmail(email.trim(), password)
                                    }
                                    if (res.isSuccess) {
                                        onLoginSuccess()
                                    } else {
                                        errorMessage = res.exceptionOrNull()?.localizedMessage ?: "Authentication failed."
                                    }
                                } else {
                                    // Fallback demo simulation
                                    kotlinx.coroutines.delay(1000)
                                    onLoginSuccess()
                                }
                            } catch (e: Exception) {
                                errorMessage = e.localizedMessage ?: "An unexpected error occurred."
                            } finally {
                                isLoading = false
                            }
                        }
                    },
                )

                Spacer(Modifier.height(18.dp))

                // Divider: "or"
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 8.dp),
                ) {
                    Box(Modifier.weight(1f).height(0.6.dp).background(Color(0xFF333333)))
                    Text(
                        text = "or",
                        color = Onb.Faint,
                        fontSize = 12.sp,
                        fontFamily = InterFontFamily,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier.padding(horizontal = 12.dp),
                    )
                    Box(Modifier.weight(1f).height(0.6.dp).background(Color(0xFF333333)))
                }

                Spacer(Modifier.height(18.dp))

                // Google Sign In Pill Button
                GoogleSignInPillButton(
                    onClick = {
                        errorMessage = null
                        googleSignInLauncher.launch(googleSignInClient.signInIntent)
                        onGoogleSignInClick()
                    },
                )
            }

            // Fixed Footer: Continue as Guest
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .navigationBarsPadding()
                    .padding(horizontal = sidePadding)
                    .padding(bottom = 18.dp, top = 6.dp),
                verticalArrangement = Arrangement.spacedBy(10.dp),
            ) {
                OnbButton(
                    text = "Continue as Guest",
                    style = OnbButtonStyle.Secondary,
                    onClick = onDismiss,
                )

                Text(
                    text = "Guest mode keeps all music streaming & local features active without an account.",
                    color = Onb.Faint,
                    fontSize = 11.sp,
                    fontFamily = InterFontFamily,
                    textAlign = TextAlign.Center,
                    modifier = Modifier.fillMaxWidth().padding(horizontal = 12.dp),
                )
            }
        }
    }
}

/** Segmented Tab Pill for switching between Sign In and Create Account */
@Composable
private fun AuthTabPill(
    title: String,
    selected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()
    Box(
        modifier = modifier
            .height(38.dp)
            .graphicsLayer {
                val s = if (pressed) 0.97f else 1f
                scaleX = s
                scaleY = s
            }
            .clip(CircleShape)
            .background(if (selected) Color(0xFF424242) else Color.Transparent)
            .clickable(interactionSource = interaction, indication = RemoteFocus, onClick = onClick),
        contentAlignment = Alignment.Center,
    ) {
        Text(
            text = title,
            color = if (selected) Color.White else Onb.Muted,
            fontSize = 14.sp,
            fontFamily = InterFontFamily,
            fontWeight = if (selected) FontWeight.Bold else FontWeight.Medium,
        )
    }
}

/** Rounded pill text field matching OnbTextField */
@Composable
private fun AuthInputField(
    value: String,
    onValueChange: (String) -> Unit,
    placeholder: String,
    modifier: Modifier = Modifier,
    keyboardType: KeyboardType = KeyboardType.Text,
    imeAction: ImeAction = ImeAction.Next,
    onImeAction: () -> Unit = {},
    isPassword: Boolean = false,
    passwordVisible: Boolean = false,
    onTogglePasswordVisibility: () -> Unit = {},
) {
    BasicTextField(
        value = value,
        onValueChange = onValueChange,
        singleLine = true,
        textStyle = TextStyle(
            color = Color.White,
            fontFamily = InterFontFamily,
            fontSize = 15.sp,
            fontWeight = FontWeight.SemiBold,
            letterSpacing = (-0.02).em,
        ),
        cursorBrush = SolidColor(Color.White),
        keyboardOptions = KeyboardOptions(
            keyboardType = keyboardType,
            imeAction = imeAction,
        ),
        keyboardActions = KeyboardActions(onAny = { onImeAction() }),
        visualTransformation = if (isPassword && !passwordVisible) PasswordVisualTransformation() else VisualTransformation.None,
        modifier = modifier,
        decorationBox = { inner ->
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .fillMaxWidth()
                    .clip(CircleShape)
                    .background(Onb.Field)
                    .padding(horizontal = 20.dp, vertical = 14.dp),
            ) {
                Box(Modifier.weight(1f)) {
                    if (value.isEmpty()) {
                        Text(
                            text = placeholder,
                            color = Onb.Faint,
                            fontSize = 15.sp,
                            fontFamily = InterFontFamily,
                        )
                    }
                    inner()
                }

                if (isPassword && value.isNotEmpty()) {
                    Text(
                        text = if (passwordVisible) "Hide" else "Show",
                        color = Onb.Muted,
                        fontSize = 13.sp,
                        fontFamily = InterFontFamily,
                        fontWeight = FontWeight.SemiBold,
                        modifier = Modifier
                            .clip(CircleShape)
                            .clickable(onClick = onTogglePasswordVisibility)
                            .padding(horizontal = 6.dp, vertical = 2.dp),
                    )
                }
            }
        },
    )
}

/** Tactile Google Sign-In Pill */
@Composable
private fun GoogleSignInPillButton(
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
) {
    val interaction = remember { MutableInteractionSource() }
    val pressed by interaction.collectIsPressedAsState()

    Box(
        modifier = modifier
            .fillMaxWidth()
            .height(50.dp)
            .graphicsLayer {
                val s = if (pressed) 0.97f else 1f
                scaleX = s
                scaleY = s
            }
            .clip(CircleShape)
            .background(Color(0xFF262626))
            .clickable(interactionSource = interaction, indication = RemoteFocus, onClick = onClick)
            .padding(horizontal = 20.dp),
        contentAlignment = Alignment.Center,
    ) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            Icon(
                painter = painterResource(R.drawable.ic_google),
                contentDescription = null,
                tint = Color.Unspecified,
                modifier = Modifier.size(18.dp),
            )
            Spacer(Modifier.width(10.dp))
            Text(
                text = "Continue with Google",
                color = Color.White,
                fontSize = 14.sp,
                fontFamily = InterFontFamily,
                fontWeight = FontWeight.SemiBold,
            )
        }
    }
}
