package com.civicos.android.ui.contacts

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Map
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.civicos.shared.model.Contact
import org.koin.androidx.compose.koinViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContactsScreen(
    onNavigateToCanvassing: () -> Unit,
    viewModel: ContactsViewModel = koinViewModel(),
) {
    val state by viewModel.state.collectAsState()

    LaunchedEffect(Unit) { viewModel.loadContacts() }

    Scaffold(
        topBar = {
            TopAppBar(
                title  = { Text("Contactos") },
                actions = {
                    IconButton(onClick = onNavigateToCanvassing) {
                        Icon(Icons.Default.Map, contentDescription = "Canvassing")
                    }
                }
            )
        }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            // Search bar
            OutlinedTextField(
                value         = state.searchQuery,
                onValueChange = viewModel::onSearchQueryChange,
                placeholder   = { Text("Buscar contacto…") },
                leadingIcon   = { Icon(Icons.Default.Search, null) },
                singleLine    = true,
                modifier      = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 8.dp),
            )

            when {
                state.isLoading -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    CircularProgressIndicator()
                }
                state.error != null -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text(state.error!!, color = MaterialTheme.colorScheme.error)
                }
                state.contacts.isEmpty() -> Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                    Text("No se encontraron contactos.", style = MaterialTheme.typography.bodyMedium)
                }
                else -> LazyColumn(contentPadding = PaddingValues(vertical = 8.dp)) {
                    items(state.contacts, key = { it.id }) { contact ->
                        ContactItem(contact)
                    }
                }
            }
        }
    }
}

@Composable
private fun ContactItem(contact: Contact) {
    ListItem(
        headlineContent   = { Text("${contact.firstName} ${contact.lastName}") },
        supportingContent = {
            Column {
                contact.phone?.let { Text(it, style = MaterialTheme.typography.bodySmall) }
                contact.address?.let { Text(it, style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.6f)) }
            }
        },
    )
    HorizontalDivider(modifier = Modifier.padding(horizontal = 16.dp))
}
