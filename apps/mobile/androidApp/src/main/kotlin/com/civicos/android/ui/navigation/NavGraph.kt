package com.civicos.android.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.civicos.android.ui.auth.LoginScreen
import com.civicos.android.ui.canvassing.CanvassingScreen
import com.civicos.android.ui.contacts.ContactsScreen
import com.civicos.android.ui.territories.TerritoriesScreen

sealed class Screen(val route: String) {
    data object Login        : Screen("login")
    data object Contacts     : Screen("contacts")
    data object Territories  : Screen("territories")
    data object Canvassing   : Screen("canvassing")
}

@Composable
fun CivicOSNavGraph(startDestination: String = Screen.Login.route) {
    val navController = rememberNavController()

    NavHost(navController = navController, startDestination = startDestination) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = {
                    navController.navigate(Screen.Contacts.route) {
                        popUpTo(Screen.Login.route) { inclusive = true }
                    }
                }
            )
        }
        composable(Screen.Contacts.route) {
            ContactsScreen(
                onNavigateToCanvassing = { navController.navigate(Screen.Canvassing.route) }
            )
        }
        composable(Screen.Territories.route) {
            TerritoriesScreen()
        }
        composable(Screen.Canvassing.route) {
            CanvassingScreen(
                onBack = { navController.popBackStack() }
            )
        }
    }
}
