package com.civicos.android.ui.canvassing

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.filled.ArrowBack
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.civicos.shared.model.VisitResult
import org.koin.androidx.compose.koinViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CanvassingScreen(
    onBack: () -> Unit,
    viewModel: CanvassingViewModel = koinViewModel(),
) {
    val state by viewModel.state.collectAsState()

    // Navigate back on success
    LaunchedEffect(state.submitSuccess) {
        if (state.submitSuccess) { viewModel.resetForm(); onBack() }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title           = { Text("Registrar visita") },
                navigationIcon  = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.AutoMirrored.Filled.ArrowBack, contentDescription = "Volver")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .padding(16.dp)
                .fillMaxSize()
                .verticalScroll(rememberScrollState()),
            verticalArrangement = Arrangement.spacedBy(16.dp),
        ) {
            // Result selector
            Text("Resultado de la visita", style = MaterialTheme.typography.titleMedium)
            Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                VisitResult.entries.forEach { result ->
                    FilterChip(
                        selected = state.result == result,
                        onClick  = { viewModel.onResultSelected(result) },
                        label    = { Text(result.displayName) },
                    )
                }
            }

            // Notes
            OutlinedTextField(
                value         = state.notes,
                onValueChange = viewModel::onNotesChanged,
                label         = { Text("Notas") },
                minLines      = 3,
                modifier      = Modifier.fillMaxWidth(),
            )

            // Sympathy level (1–5) — shown only when contacted
            if (state.result == VisitResult.CONTACTED) {
                Text("Nivel de simpatía", style = MaterialTheme.typography.titleMedium)
                Row(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    (1..5).forEach { level ->
                        FilterChip(
                            selected = state.sympathyLevel == level,
                            onClick  = { viewModel.onSympathyChanged(level) },
                            label    = { Text("$level") },
                        )
                    }
                }
            }

            state.error?.let {
                Text(it, color = MaterialTheme.colorScheme.error)
            }

            Button(
                onClick  = { /* campaignId/tenantId/volunteerId passed from session */ },
                enabled  = state.selectedContactId != null && state.result != null && !state.isSubmitting,
                modifier = Modifier.fillMaxWidth().height(48.dp),
            ) {
                if (state.isSubmitting) {
                    CircularProgressIndicator(modifier = Modifier.size(20.dp), strokeWidth = 2.dp,
                        color = MaterialTheme.colorScheme.onPrimary)
                } else {
                    Text("Guardar visita")
                }
            }
        }
    }
}

private val VisitResult.displayName get() = when (this) {
    VisitResult.CONTACTED     -> "Contactado"
    VisitResult.NOT_HOME      -> "No estaba"
    VisitResult.REFUSED       -> "Rechazó"
    VisitResult.MOVED         -> "Se mudó"
    VisitResult.WRONG_ADDRESS -> "Dir. incorrecta"
}
