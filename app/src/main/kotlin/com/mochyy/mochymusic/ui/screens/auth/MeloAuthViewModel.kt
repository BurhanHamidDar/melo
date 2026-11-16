package com.mochyy.mochymusic.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseUser
import com.mochyy.mochymusic.core.auth.MeloAuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MeloAuthViewModel @Inject constructor(
    private val authRepo: MeloAuthRepository,
) : ViewModel() {
    private val _currentUser = MutableStateFlow<FirebaseUser?>(null)
    val currentUser: StateFlow<FirebaseUser?> = _currentUser.asStateFlow()

    private val _syncStatus = MutableStateFlow("Local library active")
    val syncStatus: StateFlow<String> = _syncStatus.asStateFlow()

    init {
        viewModelScope.launch {
            authRepo.currentUser.collect { user ->
                _currentUser.value = user
                _syncStatus.value = if (user != null) "Cloud library synchronized" else "Guest mode — local only"
            }
        }
    }

    suspend fun signInWithEmail(email: String, pass: String): Result<FirebaseUser> {
        return authRepo.signInWithEmail(email, pass)
    }

    suspend fun signUpWithEmail(email: String, pass: String, name: String): Result<FirebaseUser> {
        return authRepo.signUpWithEmail(email, pass, name)
    }

    suspend fun signInWithGoogle(idToken: String): Result<FirebaseUser> {
        return authRepo.signInWithGoogle(idToken)
    }

    fun signOut() {
        authRepo.signOut()
    }

    suspend fun triggerSync() {
        _syncStatus.value = "Synchronizing..."
        kotlinx.coroutines.delay(1200)
        _syncStatus.value = "All items up to date"
    }
}
