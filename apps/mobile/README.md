# CivicOS Mobile (KMM)

Kotlin Multiplatform Mobile app for field volunteers.

## Architecture

```
apps/mobile/
├── shared/          ← KMM shared module (business logic + API client)
│   └── src/
│       ├── commonMain/   Models, repositories, Ktor HTTP client, Koin DI
│       ├── androidMain/  Android-specific Ktor engine
│       └── iosMain/      Darwin-specific Ktor engine
├── androidApp/      ← Jetpack Compose Android app
└── iosApp/          ← SwiftUI iOS app
```

## Shared layer

| Package | Responsibility |
|---|---|
| `model/` | Data classes: `Contact`, `Territory`, `CanvassVisit` |
| `api/` | `SupabaseClient` (Ktor) + `AuthApi` |
| `repository/` | `ContactRepository`, `TerritoryRepository`, `CanvassingRepository` |
| `di/` | `sharedModule(url, key)` — Koin module for both platforms |

## Android screens

- **Login** — email/password via Supabase Auth
- **Contacts** — searchable list with debounced query
- **Territories** — assigned territories with status chips
- **Canvassing** — visit form (result, notes, sympathy level, vote intention)

## iOS screens

- **LoginView** — email/password
- **MainTabView** — Contacts / Territories / Canvassing tabs (stubs ready for implementation)

## Setup

1. Copy `.env.example` → `local.properties` and fill in:
   ```
   SUPABASE_URL=https://<project>.supabase.co
   SUPABASE_ANON_KEY=<anon-key>
   ```
2. Android: open `androidApp/` in Android Studio, sync Gradle
3. iOS: run `./gradlew :shared:linkDebugFrameworkIosSimulatorArm64` then open `iosApp/iosApp.xcodeproj` in Xcode

## Requirements

- Android: API 26+ (Android 8.0)
- iOS: iOS 16+
- Kotlin: 2.0.0
- Gradle: 8.7
