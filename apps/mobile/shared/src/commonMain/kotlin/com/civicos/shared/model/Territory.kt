package com.civicos.shared.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Territory(
    val id: String,
    val name: String,
    val description: String? = null,
    val status: TerritoryStatus,
    val color: String = "#2960ec",
    val priority: Int = 1,
    @SerialName("campaign_id") val campaignId: String,
    @SerialName("tenant_id")   val tenantId: String,
    val geojson: String? = null,
)

@Serializable
enum class TerritoryStatus {
    @SerialName("disponible")   DISPONIBLE,
    @SerialName("asignado")     ASIGNADO,
    @SerialName("en_progreso")  EN_PROGRESO,
    @SerialName("completado")   COMPLETADO,
}
