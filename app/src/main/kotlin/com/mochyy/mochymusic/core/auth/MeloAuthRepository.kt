package com.mochyy.mochymusic.core.auth

import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.auth.FirebaseUser
import com.google.firebase.auth.GoogleAuthProvider
import com.google.firebase.auth.UserProfileChangeRequest
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

/**
 * MeloAuthRepository manages Firebase authentication state for Melo.
 * Ensures the app can operate in both Guest mode and Cloud Authenticated mode.
 */
@Singleton
class MeloAuthRepository @Inject constructor() {
    private val auth: FirebaseAuth by lazy { FirebaseAuth.getInstance() }

    val currentUser: Flow<FirebaseUser?> = callbackFlow {
        trySend(auth.currentUser)
        val listener = FirebaseAuth.AuthStateListener { authInstance ->
            trySend(authInstance.currentUser)
        }
        auth.addAuthStateListener(listener)
        awaitClose { auth.removeAuthStateListener(listener) }
    }

    suspend fun signInWithEmail(email: String, pass: String): Result<FirebaseUser> = runCatching {
        val result = auth.signInWithEmailAndPassword(email, pass).await()
        result.user ?: error("No user returned from Firebase")
    }

    suspend fun signUpWithEmail(email: String, pass: String, name: String): Result<FirebaseUser> = runCatching {
        val result = auth.createUserWithEmailAndPassword(email, pass).await()
        val user = result.user ?: error("Failed to create user")
        if (name.isNotBlank()) {
            user.updateProfile(UserProfileChangeRequest.Builder().setDisplayName(name).build()).await()
        }
        user
    }

    suspend fun signInWithGoogle(idToken: String): Result<FirebaseUser> = runCatching {
        val credential = GoogleAuthProvider.getCredential(idToken, null)
        val result = auth.signInWithCredential(credential).await()
        result.user ?: error("Google sign-in credential failed")
    }

    fun signOut() {
        auth.signOut()
    }

    fun getCurrentUser(): FirebaseUser? = auth.currentUser

    suspend fun getIdToken(forceRefresh: Boolean = false): String? = runCatching {
        auth.currentUser?.getIdToken(forceRefresh)?.await()?.token
    }.getOrNull()
}
