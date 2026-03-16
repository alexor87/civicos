package com.civicos.android.ui.contacts

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.civicos.shared.model.Contact
import com.civicos.shared.repository.ContactRepository
import kotlinx.coroutines.FlowPreview
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch

data class ContactsUiState(
    val contacts: List<Contact> = emptyList(),
    val isLoading: Boolean      = false,
    val error: String?          = null,
    val searchQuery: String     = "",
)

@OptIn(FlowPreview::class)
class ContactsViewModel(private val repo: ContactRepository) : ViewModel() {

    private val _state = MutableStateFlow(ContactsUiState())
    val state: StateFlow<ContactsUiState> = _state.asStateFlow()

    private val searchQuery = MutableStateFlow("")

    init {
        searchQuery
            .debounce(300)
            .onEach { query -> if (query.isBlank()) loadContacts() else search(query) }
            .launchIn(viewModelScope)
    }

    fun loadContacts(campaignId: String = "") {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            repo.getContacts(campaignId)
                .onSuccess { contacts -> _state.update { it.copy(contacts = contacts, isLoading = false) } }
                .onFailure { e        -> _state.update { it.copy(error = e.message, isLoading = false) } }
        }
    }

    fun onSearchQueryChange(query: String) {
        _state.update { it.copy(searchQuery = query) }
        searchQuery.value = query
    }

    private fun search(query: String, campaignId: String = "") {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            repo.searchContacts(campaignId, query)
                .onSuccess { contacts -> _state.update { it.copy(contacts = contacts, isLoading = false) } }
                .onFailure { e        -> _state.update { it.copy(error = e.message, isLoading = false) } }
        }
    }
}
