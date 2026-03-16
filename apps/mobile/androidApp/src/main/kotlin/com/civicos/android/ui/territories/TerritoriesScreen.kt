package com.civicos.android.ui.territories

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import com.civicos.shared.model.Territory
import com.civicos.shared.model.TerritoryStatus
import org.koin.androidx.compose.koinViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TerritoriesScreen(viewModel: TerritoriesViewModel = koinViewModel()) {
    val state by viewModel.state.collectAsState()

    Scaffold(topBar = { TopAppBar(title = { Text("Mis territorios") }) }) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize()) {
            when {
                state.isLoading -> CircularProgressIndicator(modifier = Modifier.align(Alignment.Center))
                state.error != null -> Text(state.error!!, color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.align(Alignment.Center))
                state.territories.isEmpty() -> Text("No tienes territorios asignados.",
                    modifier = Modifier.align(Alignment.Center))
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
                    items(state.territories, key = { it.id }) { territory ->
                        TerritoryItem(territory)
                    }
                }
            }
        }
    }
}

@Composable
private fun TerritoryItem(territory: Territory) {
    val statusColor = when (territory.status) {
        TerritoryStatus.DISPONIBLE  -> Color(0xFF22C55E)
        TerritoryStatus.ASIGNADO    -> Color(0xFF3B82F6)
        TerritoryStatus.EN_PROGRESO -> Color(0xFFF59E0B)
        TerritoryStatus.COMPLETADO  -> Color(0xFF6B7280)
    }
    val statusLabel = when (territory.status) {
        TerritoryStatus.DISPONIBLE  -> "Disponible"
        TerritoryStatus.ASIGNADO    -> "Asignado"
        TerritoryStatus.EN_PROGRESO -> "En progreso"
        TerritoryStatus.COMPLETADO  -> "Completado"
    }

    ListItem(
        headlineContent   = { Text(territory.name) },
        supportingContent = { territory.description?.let { Text(it) } },
        trailingContent   = {
            AssistChip(
                onClick = {},
                label   = { Text(statusLabel, style = MaterialTheme.typography.labelSmall) },
                colors  = AssistChipDefaults.assistChipColors(containerColor = statusColor.copy(alpha = 0.15f)),
            )
        },
    )
    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
}
