package com.civicos.android

import com.civicos.android.ui.auth.AuthViewModel
import com.civicos.android.ui.canvassing.CanvassingViewModel
import com.civicos.android.ui.contacts.ContactsViewModel
import com.civicos.android.ui.territories.TerritoriesViewModel
import org.koin.androidx.viewmodel.dsl.viewModel
import org.koin.dsl.module

val androidModule = module {
    viewModel { AuthViewModel(get()) }
    viewModel { ContactsViewModel(get()) }
    viewModel { TerritoriesViewModel(get()) }
    viewModel { CanvassingViewModel(get(), get()) }
}
