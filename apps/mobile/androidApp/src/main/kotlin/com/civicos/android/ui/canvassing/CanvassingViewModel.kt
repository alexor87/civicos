package com.civicos.android.ui.canvassing

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.civicos.shared.model.CanvassVisit
import com.civicos.shared.model.Contact
import com.civicos.shared.model.VisitResult
import com.civicos.shared.repository.CanvassingRepository
import com.civicos.shared.repository.ContactRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CanvassingUiState(
    val contacts: List<Contact>     = emptyList(),
    val isLoading: Boolean          = false,
    val isSubmitting: Boolean       = false,
    val submitSuccess: Boolean      = false,
    val error: String?              = null,
    // form fields
    val selectedContactId: String?  = null,
    val result: VisitResult?        = null,
    val notes: String               = "",
    val sympathyLevel: Int?         = null,
    val voteIntention: String?      = null,
)

class CanvassingViewModel(
    private val contactRepo: ContactRepository,
    private val canvassingRepo: CanvassingRepository,
) : ViewModel() {

    private val _state = MutableStateFlow(CanvassingUiState())
    val state: StateFlow<CanvassingUiState> = _state.asStateFlow()

    fun loadContacts(campaignId: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true) }
            contactRepo.getContacts(campaignId)
                .onSuccess { list -> _state.update { it.copy(contacts = list, isLoading = false) } }
                .onFailure { e    -> _state.update { it.copy(error = e.message, isLoading = false) } }
        }
    }

    fun onContactSelected(contactId: String)  = _state.update { it.copy(selectedContactId = contactId) }
    fun onResultSelected(result: VisitResult) = _state.update { it.copy(result = result) }
    fun onNotesChanged(notes: String)         = _state.update { it.copy(notes = notes) }
    fun onSympathyChanged(level: Int)         = _state.update { it.copy(sympathyLevel = level) }
    fun onVoteIntentionChanged(vi: String)    = _state.update { it.copy(voteIntention = vi) }

    fun submitVisit(campaignId: String, tenantId: String, volunteerId: String) {
        val s = _state.value
        val contactId = s.selectedContactId ?: return
        val result    = s.result ?: return

        viewModelScope.launch {
            _state.update { it.copy(isSubmitting = true, error = null) }
            canvassingRepo.submitVisit(
                CanvassVisit(
                    contactId      = contactId,
                    volunteerId    = volunteerId,
                    campaignId     = campaignId,
                    tenantId       = tenantId,
                    result         = result,
                    notes          = s.notes.takeIf { it.isNotBlank() },
                    sympathyLevel  = s.sympathyLevel,
                    voteIntention  = s.voteIntention,
                )
            )
                .onSuccess { _state.update { it.copy(isSubmitting = false, submitSuccess = true) } }
                .onFailure { e -> _state.update { it.copy(isSubmitting = false, error = e.message) } }
        }
    }

    fun resetForm() {
        _state.update { CanvassingUiState(contacts = it.contacts) }
    }
}
