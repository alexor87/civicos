package com.civicos.android

import android.app.Application
import com.civicos.shared.di.sharedModule
import org.koin.android.ext.koin.androidContext
import org.koin.core.context.startKoin

class CivicOSApp : Application() {

    override fun onCreate() {
        super.onCreate()

        startKoin {
            androidContext(this@CivicOSApp)
            modules(
                sharedModule(
                    supabaseUrl     = BuildConfig.SUPABASE_URL,
                    supabaseAnonKey = BuildConfig.SUPABASE_ANON_KEY,
                ),
                androidModule,
            )
        }
    }
}
