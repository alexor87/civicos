package com.civicos.shared.repository

import com.civicos.shared.api.SupabaseClient
import com.civicos.shared.model.Contact
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.headers
import io.ktor.client.request.parameter

class ContactRepository(private val client: SupabaseClient) {

    /**
     * Returns all contacts for [campaignId].
     * RLS on the server side enforces tenant isolation automatically.
     */
    suspend fun getContacts(campaignId: String): Result<List<Contact>> = runCatching {
        client.http.get("${client.restUrl}/contacts") {
            parameter("campaign_id", "eq.$campaignId")
            parameter("order", "last_name.asc")
            headers { append("Prefer", "return=representation") }
        }.body()
    }

    /** Full-text search across first_name, last_name and address. */
    suspend fun searchContacts(campaignId: String, query: String): Result<List<Contact>> = runCatching {
        client.http.get("${client.restUrl}/contacts") {
            parameter("campaign_id", "eq.$campaignId")
            parameter("or", "(first_name.ilike.*$query*,last_name.ilike.*$query*,address.ilike.*$query*)")
            parameter("order", "last_name.asc")
            parameter("limit", "50")
        }.body()
    }
}
