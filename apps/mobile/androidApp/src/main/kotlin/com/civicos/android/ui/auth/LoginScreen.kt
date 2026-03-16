package com.civicos.android.ui.auth

import androidx.compose.foundation.Image
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.painterResource
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.unit.dp
import com.civicos.android.R
import org.koin.androidx.compose.koinViewModel

@Composable
fun LoginScreen(
    onLoginSuccess: () -> Unit,
    viewModel: AuthViewModel = koinViewModel(),
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(state) {
        if (state is AuthState.Success) onLoginSuccess()
    }

    var email    by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }

    Column(
        modifier            = Modifier.fillMaxSize().padding(24.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center,
    ) {
        Image(
            painter            = painterResource(id = R.drawable.ic_civicos_logo),
            contentDescription = "CivicOS",
            modifier           = Modifier.size(80.dp),
        )

        Spacer(Modifier.height(32.dp))

        Text("Bienvenido", style = MaterialTheme.typography.headlineMedium)
        Text("Inicia sesión para continuar", style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f))

        Spacer(Modifier.height(32.dp))

        OutlinedTextField(
            value         = email,
            onValueChange = { email = it },
            label         = { Text("Correo electrónico") },
            keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Email),
            singleLine    = true,
            modifier      = Modifier.fillMaxWidth(),
        )

        Spacer(Modifier.height(12.dp))

        OutlinedTextField(
            value                  = password,
            onValueChange          = { password = it },
            label                  = { Text("Contraseña") },
            visualTransformation   = PasswordVisualTransformation(),
            keyboardOptions        = KeyboardOptions(keyboardType = KeyboardType.Password),
            singleLine             = true,
            modifier               = Modifier.fillMaxWidth(),
        )

        if (state is AuthState.Error) {
            Spacer(Modifier.height(8.dp))
            Text(
                text  = (state as AuthState.Error).message,
                color = MaterialTheme.colorScheme.error,
                style = MaterialTheme.typography.bodySmall,
            )
        }

        Spacer(Modifier.height(24.dp))

        Button(
            onClick  = { viewModel.signIn(email, password) },
            enabled  = email.isNotBlank() && password.isNotBlank() && state !is AuthState.Loading,
            modifier = Modifier.fillMaxWidth().height(48.dp),
        ) {
            if (state is AuthState.Loading) {
                CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp,
                    color = MaterialTheme.colorScheme.onPrimary)
            } else {
                Text("Iniciar sesión")
            }
        }
    }
}
