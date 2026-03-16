package com.civicos.shared.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class CanvassVisit(
    val id: String? = null,
    @SerialName("contact_id")    val contactId: String,
    @SerialName("territory_id")  val territoryId: String? = null,
    @SerialName("volunteer_id")  val volunteerId: String,
    @SerialName("campaign_id")   val campaignId: String,
    @SerialName("tenant_id")     val tenantId: String,
    val result: VisitResult,
    val notes: String? = null,
    @SerialName("sympathy_level")   val sympathyLevel: Int? = null,
    @SerialName("vote_intention")   val voteIntention: String? = null,
    @SerialName("persuadability")   val persuadability: Int? = null,
    val status: VisitStatus = VisitStatus.PENDING,
)

@Serializable
enum class VisitResult {
    @SerialName("contacted")         CONTACTED,
    @SerialName("not_home")          NOT_HOME,
    @SerialName("refused")           REFUSED,
    @SerialName("moved")             MOVED,
    @SerialName("wrong_address")     WRONG_ADDRESS,
}

@Serializable
enum class VisitStatus {
    @SerialName("pending")    PENDING,
    @SerialName("approved")   APPROVED,
    @SerialName("rejected")   REJECTED,
}
