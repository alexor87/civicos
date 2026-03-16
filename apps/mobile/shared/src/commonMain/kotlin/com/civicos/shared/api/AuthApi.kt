package com.civicos.shared.api

import io.ktor.client.call.body
import io.ktor.client.request.post
import io.ktor.client.request.setBody
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class SignInRequest(
    val email: String,
    val password: String,
)

@Serializable
data class AuthSession(
    @SerialName("access_token")  val accessToken: String,
    @SerialName("refresh_token") val refreshToken: String,
    @SerialName("token_type")    val tokenType: String,
    @SerialName("expires_in")    val expiresIn: Int,
    val user: AuthUser,
)

@Serializable
data class AuthUser(
    val id: String,
    val email: String? = null,
)

class AuthApi(private val client: SupabaseClient) {

    suspend fun signIn(email: String, password: String): Result<AuthSession> = runCatching {
        client.http.post("${client.authUrl}/token?grant_type=password") {
            setBody(SignInRequest(email, password))
        }.body<AuthSession>().also { session ->
            client.setAccessToken(session.accessToken)
        }
    }

    fun signOut() {
        client.clearSession()
    }
}
