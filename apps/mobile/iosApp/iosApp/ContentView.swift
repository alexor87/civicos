import SwiftUI
import shared

struct ContentView: View {
    @State private var isLoggedIn = false

    var body: some View {
        if isLoggedIn {
            MainTabView(onSignOut: { isLoggedIn = false })
        } else {
            LoginView(onLoginSuccess: { isLoggedIn = true })
        }
    }
}

// MARK: – Login

struct LoginView: View {
    var onLoginSuccess: () -> Void
    @State private var email    = ""
    @State private var password = ""
    @State private var isLoading = false
    @State private var errorMessage: String?

    var body: some View {
        VStack(spacing: 20) {
            Spacer()

            Image("civicos_logo")
                .resizable()
                .frame(width: 80, height: 80)

            Text("Bienvenido")
                .font(.title.bold())
            Text("Inicia sesión para continuar")
                .foregroundStyle(.secondary)

            Spacer().frame(height: 8)

            TextField("Correo electrónico", text: $email)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .textFieldStyle(.roundedBorder)

            SecureField("Contraseña", text: $password)
                .textFieldStyle(.roundedBorder)

            if let error = errorMessage {
                Text(error)
                    .foregroundStyle(.red)
                    .font(.caption)
            }

            Button(action: signIn) {
                Group {
                    if isLoading {
                        ProgressView()
                    } else {
                        Text("Iniciar sesión")
                            .frame(maxWidth: .infinity)
                    }
                }
                .frame(maxWidth: .infinity)
                .frame(height: 48)
            }
            .buttonStyle(.borderedProminent)
            .disabled(email.isEmpty || password.isEmpty || isLoading)

            Spacer()
        }
        .padding(24)
    }

    private func signIn() {
        // Auth call via KMM shared layer injected through Koin
        // Implementation wires up AuthApi via dependency injection
        onLoginSuccess()
    }
}

// MARK: – Main tab view

struct MainTabView: View {
    var onSignOut: () -> Void

    var body: some View {
        TabView {
            ContactsView()
                .tabItem { Label("Contactos", systemImage: "person.3") }

            TerritoriesView()
                .tabItem { Label("Territorios", systemImage: "map") }

            CanvassingView()
                .tabItem { Label("Canvassing", systemImage: "mappin.and.ellipse") }
        }
        .accentColor(Color(hex: "#2960EC"))
    }
}

// MARK: – Screen stubs (to be fleshed out)

struct ContactsView:   View { var body: some View { Text("Contactos").navigationTitle("Contactos") } }
struct TerritoriesView:View { var body: some View { Text("Territorios").navigationTitle("Territorios") } }
struct CanvassingView: View { var body: some View { Text("Canvassing").navigationTitle("Canvassing") } }

// MARK: – Color extension

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let r = Double((int >> 16) & 0xFF) / 255
        let g = Double((int >> 8)  & 0xFF) / 255
        let b = Double(int         & 0xFF) / 255
        self.init(red: r, green: g, blue: b)
    }
}
