package com.civicos.shared.repository

import com.civicos.shared.api.SupabaseClient
import com.civicos.shared.model.Territory
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.parameter

class TerritoryRepository(private val client: SupabaseClient) {

    /** Returns territories assigned to [volunteerId] for the given campaign. */
    suspend fun getMyTerritories(campaignId: String, volunteerId: String): Result<List<Territory>> = runCatching {
        client.http.get("${client.restUrl}/territory_assignments") {
            parameter("campaign_id", "eq.$campaignId")
            parameter("volunteer_id", "eq.$volunteerId")
            parameter("select", "territory_id,territories(*)")
            parameter("order", "created_at.desc")
        }.body()
    }

    /** Returns all available territories for the campaign (for map view). */
    suspend fun getAllTerritories(campaignId: String): Result<List<Territory>> = runCatching {
        client.http.get("${client.restUrl}/territories") {
            parameter("campaign_id", "eq.$campaignId")
            parameter("order", "name.asc")
        }.body()
    }
}
