package com.civicos.android.ui.territories

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.civicos.shared.model.Territory
import com.civicos.shared.repository.TerritoryRepository
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class TerritoriesUiState(
    val territories: List<Territory> = emptyList(),
    val isLoading: Boolean           = false,
    val error: String?               = null,
)

class TerritoriesViewModel(private val repo: TerritoryRepository) : ViewModel() {

    private val _state = MutableStateFlow(TerritoriesUiState())
    val state: StateFlow<TerritoriesUiState> = _state.asStateFlow()

    fun loadMyTerritories(campaignId: String, volunteerId: String) {
        viewModelScope.launch {
            _state.update { it.copy(isLoading = true, error = null) }
            repo.getMyTerritories(campaignId, volunteerId)
                .onSuccess { list -> _state.update { it.copy(territories = list, isLoading = false) } }
                .onFailure { e    -> _state.update { it.copy(error = e.message, isLoading = false) } }
        }
    }
}
