package com.civicos.android

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import com.civicos.android.ui.theme.CivicOSTheme
import com.civicos.android.ui.navigation.CivicOSNavGraph

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            CivicOSTheme {
                CivicOSNavGraph()
            }
        }
    }
}
