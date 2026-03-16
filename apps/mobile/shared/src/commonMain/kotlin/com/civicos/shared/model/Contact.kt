package com.civicos.shared.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Contact(
    val id: String,
    @SerialName("first_name") val firstName: String,
    @SerialName("last_name")  val lastName: String,
    val email: String? = null,
    val phone: String? = null,
    val address: String? = null,
    @SerialName("campaign_id") val campaignId: String,
    @SerialName("tenant_id")   val tenantId: String,
)
