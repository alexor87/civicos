package com.civicos.shared.repository

import com.civicos.shared.api.SupabaseClient
import com.civicos.shared.model.CanvassVisit
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.headers
import io.ktor.client.request.parameter
import io.ktor.client.request.post
import io.ktor.client.request.setBody

class CanvassingRepository(private val client: SupabaseClient) {

    /**
     * Submits a new canvass visit.
     * The record starts with status = "pending" and awaits coordinator approval.
     */
    suspend fun submitVisit(visit: CanvassVisit): Result<CanvassVisit> = runCatching {
        client.http.post("${client.restUrl}/canvass_visits") {
            setBody(visit)
            headers { append("Prefer", "return=representation") }
        }.body<List<CanvassVisit>>().first()
    }

    /** Returns visits submitted by [volunteerId] for the given campaign. */
    suspend fun getMyVisits(campaignId: String, volunteerId: String): Result<List<CanvassVisit>> = runCatching {
        client.http.get("${client.restUrl}/canvass_visits") {
            parameter("campaign_id", "eq.$campaignId")
            parameter("volunteer_id", "eq.$volunteerId")
            parameter("order", "created_at.desc")
            parameter("limit", "100")
        }.body()
    }
}
