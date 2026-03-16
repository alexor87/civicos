import SwiftUI
import shared

@main
struct iOSApp: App {

    init() {
        // Bootstrap Koin with the shared KMM module
        let supabaseUrl     = Bundle.main.infoDictionary?["SUPABASE_URL"]     as? String ?? ""
        let supabaseAnonKey = Bundle.main.infoDictionary?["SUPABASE_ANON_KEY"] as? String ?? ""
        KoinKt.doInitKoin(supabaseUrl: supabaseUrl, supabaseAnonKey: supabaseAnonKey)
    }

    var body: some Scene {
        WindowGroup {
            ContentView()
        }
    }
}
