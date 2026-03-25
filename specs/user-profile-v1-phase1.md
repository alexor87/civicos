# Perfil de Usuario — Fase 1 (MVP)

**Fecha:** 2026-03-25
**Estado:** En desarrollo
**Autor:** CTO (Claude)
**Aprobado por:** PM (Usuario)
**PRD:** PRD Perfil de Usuario v1.0

---

## Problema / Necesidad

CivicOS no tiene una página de perfil de usuario. Las configuraciones personales (nombre, foto, contraseña, preferencias) no tienen dónde vivir. El usuario solo ve su nombre e iniciales en el footer del sidebar. Para una plataforma multi-tenant con 6 roles, esto es una carencia crítica.

## Solución propuesta

Crear el módulo `/perfil` con layout de dos columnas (menú lateral + contenido), implementando las 6 secciones del MVP de Fase 1. Los cambios se guardan por sección con un botón "Guardar cambios" que aparece solo cuando hay ediciones pendientes.

---

## Requisitos funcionales — Fase 1

### RF-1: Layout y navegación del perfil
- Ruta base: `/dashboard/perfil`
- Layout: menú vertical izquierdo (200px) + contenido derecho
- Menú con 6 secciones (ver tabla del PRD). Secciones filtradas por rol
- Punto de entrada: clic en avatar del header → dropdown con "Mi perfil"
- URL pattern: `/dashboard/perfil/informacion`, `/dashboard/perfil/seguridad`, etc.
- Default redirect: `/dashboard/perfil` → `/dashboard/perfil/informacion`

### RF-2: Información Personal
- **Foto de perfil**: zona circular con upload. JPG/PNG/WebP, max 5MB, min 200x200px. Storage: bucket `avatars` → `{user_id}/avatar.{ext}`. Sin editor de recorte en Fase 1 (se agrega en Fase 2)
- **Nombre completo**: Input text. Min 2 palabras, max 100 chars
- **Nombre corto**: Input text opcional. Max 30 chars
- **Email**: Solo lectura (mostrar email de auth). Cambio de email queda para Fase 2
- **Teléfono**: Input con código de país (default +57). Formato E.164
- **Cargo personalizado**: Input text libre. Max 100 chars
- **Zona geográfica**: Selectors en cascada usando `public/geo/colombia.json`. Departamento → Municipio → Localidad → Barrio
- **Idioma**: Select con Español (CO) / Español (Intl) / English. Solo cambia preferencia guardada (i18n real queda para Fase 2)
- **Zona horaria**: Select con autodetección. Default: America/Bogota

### RF-3: Seguridad — Cambio de contraseña
- 3 campos: contraseña actual, nueva, confirmar
- Indicador de fortaleza en tiempo real (barra de color)
- Requisitos: min 8 chars, 1 mayúscula, 1 número
- Al cambiar: toast de éxito, limpiar campos
- 2FA completo queda para Fase 2

### RF-4: Seguridad — Sesiones activas
- Lista de sesiones activas del usuario (Supabase Auth sessions)
- Por sesión: navegador/OS (parseado de user_agent), último acceso, badge "Esta sesión"
- Botón "Cerrar sesión" por cada sesión excepto la actual
- Botón "Cerrar todas las otras sesiones"
- Historial de accesos queda para Fase 2

### RF-5: Notificaciones básicas
- Toggle global: activar/desactivar notificaciones
- Guardado en `profiles.preferences` como `{ notifications: { enabled: true } }`
- Configuración granular por tipo y horario de no molestar quedan para Fase 2

### RF-6: Mis Campañas
- Lista de campañas del usuario (de `profile.campaign_ids`)
- Por campaña: nombre, rol, estado (activa/inactiva), chip "Campaña activa"
- Botón "Activar" en campañas no activas → usa el API `/api/campaigns/switch` existente
- Estado vacío: "No tienes campañas asignadas"

### RF-7: Preferencias básicas
- **Modo interfaz**: 3 opciones con preview — Claro / Oscuro / Automático. Guardado en preferences, aplicación visual queda para Fase 2
- **Tamaño de fuente**: Slider 3 niveles — Normal / Grande / Muy grande. Guardado en preferences, aplicación visual queda para Fase 2

### RF-8: Dropdown de usuario en header
- Clic en avatar → dropdown con:
  - "Mi perfil" → `/dashboard/perfil`
  - Separador
  - "Cerrar sesión"
- Reemplaza el avatar estático actual del header

---

## Migración de base de datos

Extender tabla `profiles` existente (no crear `user_profiles` separada — ya existe `profiles` con datos). Agregar campos faltantes:

```sql
-- Migration: 018_user_profile_fields.sql
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS short_name TEXT,
  ADD COLUMN IF NOT EXISTS custom_title TEXT,
  ADD COLUMN IF NOT EXISTS avatar_thumbnail_url TEXT,
  ADD COLUMN IF NOT EXISTS department_code TEXT,
  ADD COLUMN IF NOT EXISTS municipality_code TEXT,
  ADD COLUMN IF NOT EXISTS locality_name TEXT,
  ADD COLUMN IF NOT EXISTS neighborhood_name TEXT,
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'es_CO',
  ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/Bogota',
  ADD COLUMN IF NOT EXISTS theme_mode TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'normal';

-- Storage bucket para avatars
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 5242880, ARRAY['image/jpeg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Políticas de storage
CREATE POLICY "avatar_upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "avatar_read" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'avatars');

CREATE POLICY "avatar_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);
```

**Decisión:** No crear tabla `user_profiles` nueva como dice el PRD. Ya existe `profiles` con RLS. Extenderla es más limpio que migrar datos.

---

## Archivos a crear

| Archivo | Propósito |
|---------|-----------|
| `supabase/migrations/018_user_profile_fields.sql` | Migración DB |
| `app/dashboard/perfil/layout.tsx` | Layout 2 columnas con menú lateral |
| `app/dashboard/perfil/page.tsx` | Redirect a `/perfil/informacion` |
| `app/dashboard/perfil/informacion/page.tsx` | Sección información personal |
| `app/dashboard/perfil/seguridad/page.tsx` | Cambio de contraseña + sesiones |
| `app/dashboard/perfil/notificaciones/page.tsx` | Toggle de notificaciones |
| `app/dashboard/perfil/campanas/page.tsx` | Lista de campañas |
| `app/dashboard/perfil/preferencias/page.tsx` | Modo UI + tamaño fuente |
| `components/perfil/ProfilePhotoUpload.tsx` | Componente de upload de foto |
| `components/perfil/PasswordStrengthBar.tsx` | Indicador de fortaleza |
| `components/perfil/GeoSelector.tsx` | Selector cascada Colombia |
| `app/api/profile/route.ts` | API PATCH para guardar perfil |
| `app/api/profile/avatar/route.ts` | API POST para subir avatar |
| `app/api/profile/password/route.ts` | API POST para cambiar contraseña |
| `__tests__/perfil/` | Tests para cada sección |

## Archivos a modificar

| Archivo | Cambio |
|---------|--------|
| `components/dashboard/DashboardHeader.tsx` | Agregar dropdown al avatar con "Mi perfil" + "Cerrar sesión" |

## Reutilizar

- Upload pattern de `app/api/upload/image/route.ts` para avatar
- `lib/supabase/server.ts` createClient + createAdminClient
- `public/geo/colombia.json` para el selector geográfico
- `/api/campaigns/switch/route.ts` para cambio de campaña activa
- shadcn/ui: Card, Input, Label, Select, Button, Separator, Badge, Avatar, Tabs

---

## Edge cases

| Caso | Comportamiento esperado |
|------|------------------------|
| Usuario sin foto | Mostrar iniciales en círculo con color primario |
| Upload de imagen > 5MB | Error toast: "La imagen no puede superar 5MB" |
| Upload de formato inválido | Error toast: "Solo se aceptan JPG, PNG y WebP" |
| Contraseña actual incorrecta | Error inline: "La contraseña actual es incorrecta" |
| Nueva contraseña no cumple requisitos | Barra roja + mensaje de requisitos faltantes |
| Usuario sin campañas | Estado vacío: "No tienes campañas asignadas" |
| Colombia JSON no carga | Selectors disabled con mensaje "Datos geográficos no disponibles" |
| Sesión actual en lista | Badge "Esta sesión", sin botón de cerrar |

---

## Criterios de aceptación

- [ ] CA-1: La ruta `/dashboard/perfil` carga y redirige a `/perfil/informacion`
- [ ] CA-2: El menú lateral muestra las secciones correctas según el rol
- [ ] CA-3: La foto de perfil se sube y actualiza el avatar del header
- [ ] CA-4: El cambio de contraseña funciona con validación en tiempo real
- [ ] CA-5: Las sesiones activas se listan y se pueden cerrar individualmente
- [ ] CA-6: La lista de campañas muestra las campañas del usuario con la activa marcada
- [ ] CA-7: Las preferencias (tema, fuente) se guardan correctamente
- [ ] CA-8: El dropdown del avatar en el header funciona con "Mi perfil" y "Cerrar sesión"
- [ ] CA-9: Todos los tests pasan (`pnpm test`)
- [ ] CA-10: Deploy exitoso a producción

## Out of scope (Fase 2+)

- Editor de recorte de foto circular
- Cambio de email con verificación
- 2FA (app autenticadora + SMS)
- Historial de accesos con alertas
- Notificaciones granulares por tipo
- Horario de no molestar
- Integraciones de calendario (OAuth)
- Biometría mobile
- i18n real (cambio de idioma de la interfaz)
- Aplicación visual de tema oscuro/fuente
- Sección Organización
- Privacidad y datos (descarga, eliminación)

## Notas técnicas

- La tabla `profiles` ya tiene `preferences JSONB` — usarla para theme_mode, font_size, notification toggle
- Los nuevos campos (short_name, custom_title, etc.) van como columnas directas, no en JSONB, para poder hacer queries
- El bucket `avatars` es separado de `campaign-images` para mejor organización
- Supabase Auth no expone lista de sesiones directamente — usar `auth.sessions` table vía admin client
