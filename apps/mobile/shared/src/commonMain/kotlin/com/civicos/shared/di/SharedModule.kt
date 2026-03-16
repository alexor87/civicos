package com.civicos.shared.di

import com.civicos.shared.api.AuthApi
import com.civicos.shared.api.SupabaseClient
import com.civicos.shared.repository.CanvassingRepository
import com.civicos.shared.repository.ContactRepository
import com.civicos.shared.repository.TerritoryRepository
import org.koin.dsl.module

/**
 * Koin module for the shared KMM layer.
 * Both Android and iOS consume this module.
 *
 * Pass supabaseUrl and supabaseAnonKey from environment/config at startup.
 */
fun sharedModule(supabaseUrl: String, supabaseAnonKey: String) = module {
    single { SupabaseClient(supabaseUrl, supabaseAnonKey) }
    single { AuthApi(get()) }
    single { ContactRepository(get()) }
    single { TerritoryRepository(get()) }
    single { CanvassingRepository(get()) }
}
