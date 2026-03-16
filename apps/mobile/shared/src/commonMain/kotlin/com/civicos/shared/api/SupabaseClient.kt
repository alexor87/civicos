package com.civicos.shared.api

import io.ktor.client.HttpClient
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.client.plugins.defaultRequest
import io.ktor.client.plugins.logging.LogLevel
import io.ktor.client.plugins.logging.Logging
import io.ktor.http.ContentType
import io.ktor.http.contentType
import io.ktor.serialization.kotlinx.json.json
import kotlinx.serialization.json.Json

/**
 * Bare Ktor client configured for the Supabase REST API.
 *
 * Supabase exposes a PostgREST endpoint at:
 *   https://<project>.supabase.co/rest/v1/<table>
 *
 * Authentication is done via:
 *   - `apikey` header  → anon / service key
 *   - `Authorization`  → `Bearer <access_token>` after login
 */
class SupabaseClient(
    private val supabaseUrl: String,
    private val supabaseAnonKey: String,
) {
    private var accessToken: String? = null

    val http: HttpClient = HttpClient {
        install(ContentNegotiation) {
            json(Json {
                ignoreUnknownKeys = true
                isLenient = true
            })
        }
        install(Logging) {
            level = LogLevel.HEADERS
        }
        defaultRequest {
            url(supabaseUrl)
            contentType(ContentType.Application.Json)
            headers.append("apikey", supabaseAnonKey)
            accessToken?.let { headers.append("Authorization", "Bearer $it") }
        }
    }

    val restUrl get() = "$supabaseUrl/rest/v1"
    val authUrl get() = "$supabaseUrl/auth/v1"

    fun setAccessToken(token: String) {
        accessToken = token
    }

    fun clearSession() {
        accessToken = null
    }
}
