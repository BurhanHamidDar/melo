package com.mochyy.mochymusic.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.google.firebase.auth.FirebaseUser
import com.mochyy.mochymusic.core.auth.MeloAuthRepository
import com.mochyy.mochymusic.core.sync.MeloSyncManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class MeloAuthViewModel @Inject constructor(
    private val authRepo: MeloAuthRepository,
    private val syncManager: MeloSyncManager,
) : ViewModel() {
    private val _currentUser = MutableStateFlow<FirebaseUser?>(authRepo.getCurrentUser())
    val currentUser: StateFlow<FirebaseUser?> = _currentUser.asStateFlow()

    val syncStatus: StateFlow<String> = syncManager.syncStatus
    val isSyncing: StateFlow<Boolean> = syncManager.isSyncing

    init {
        viewModelScope.launch {
            authRepo.currentUser.collect { user ->
                _currentUser.value = user
                if (user != null) {
                    syncManager.syncNow()
                }
            }
        }
    }

    suspend fun signInWithEmail(email: String, pass: String): Result<FirebaseUser> {
        val res = authRepo.signInWithEmail(email, pass)
        if (res.isSuccess) {
            _currentUser.value = res.getOrNull()
            syncManager.syncNow()
        }
        return res
    }

    suspend fun signUpWithEmail(email: String, pass: String, name: String): Result<FirebaseUser> {
        val res = authRepo.signUpWithEmail(email, pass, name)
        if (res.isSuccess) {
            _currentUser.value = res.getOrNull()
            syncManager.syncNow()
        }
        return res
    }

    suspend fun signInWithGoogle(idToken: String): Result<FirebaseUser> {
        val res = authRepo.signInWithGoogle(idToken)
        if (res.isSuccess) {
            _currentUser.value = res.getOrNull()
            syncManager.syncNow()
        }
        return res
    }

    fun signOut() {
        authRepo.signOut()
        _currentUser.value = null
    }

    suspend fun triggerSync() {
        syncManager.syncNow()
    }
}
