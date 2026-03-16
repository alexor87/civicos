package com.civicos.android.ui.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.civicos.shared.api.AuthApi
import com.civicos.shared.api.AuthSession
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class AuthState {
    data object Idle     : AuthState()
    data object Loading  : AuthState()
    data class  Success(val session: AuthSession) : AuthState()
    data class  Error(val message: String)        : AuthState()
}

class AuthViewModel(private val authApi: AuthApi) : ViewModel() {

    private val _state = MutableStateFlow<AuthState>(AuthState.Idle)
    val state: StateFlow<AuthState> = _state.asStateFlow()

    fun signIn(email: String, password: String) {
        viewModelScope.launch {
            _state.value = AuthState.Loading
            authApi.signIn(email, password)
                .onSuccess { session -> _state.value = AuthState.Success(session) }
                .onFailure { e       -> _state.value = AuthState.Error(e.message ?: "Error al iniciar sesión") }
        }
    }

    fun signOut() {
        authApi.signOut()
        _state.value = AuthState.Idle
    }
}
