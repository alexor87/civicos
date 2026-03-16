# CivicOS — Product Requirements Document

**Electoral Campaign Management Platform**

---

| Campo | Detalle |
|---|---|
| **Documento** | PRD — CivicOS v2.0 |
| **Autor** | Sr. Product Manager — CivicOS |
| **Versión** | 2.0 — Marzo 2026 |
| **Estado** | Draft — Para revisión de stakeholders |
| **Cambios v2** | Supabase como DB · AI Agents · Motor de Sugerencias IA |
| **Clasificación** | Confidencial — Uso interno |

---

## Tabla de Contenidos

1. [Resumen Ejecutivo](#1-resumen-ejecutivo)
2. [Contexto y Oportunidad de Mercado](#2-contexto-y-oportunidad-de-mercado)
3. [Arquitectura del Sistema](#3-arquitectura-del-sistema)
4. [Multi-Tenant, Roles y Permisos](#4-multi-tenant-roles-y-permisos)
5. [Módulos Funcionales Operacionales](#5-módulos-funcionales-operacionales)
6. [Supabase — Arquitectura de Datos](#6-supabase--arquitectura-de-datos)
7. [Módulo de Agentes de IA y Workflows](#7-módulo-de-agentes-de-ia-y-workflows)
8. [Motor de Sugerencias IA](#8-motor-de-sugerencias-ia)
9. [Aplicación Móvil KMM](#9-aplicación-móvil-kmm)
10. [Modelo de Negocio SaaS](#10-modelo-de-negocio-saas)
11. [Roadmap de Desarrollo](#11-roadmap-de-desarrollo)
12. [Seguridad y Cumplimiento](#12-seguridad-y-cumplimiento)
13. [Decisiones Pendientes y Riesgos](#13-decisiones-pendientes-y-riesgos)

---

## 1. Resumen Ejecutivo

CivicOS es una plataforma SaaS B2B de gestión de campañas electorales que combina las capacidades más avanzadas de **NationBuilder** (CRM, comunicaciones) con las fortalezas operacionales de **Qomon** (canvassing, terreno y movilización), potenciadas por un motor de Inteligencia Artificial nativo que sugiere acciones, detecta oportunidades y automatiza workflows complejos mediante agentes.

La plataforma se construye sobre **Supabase** como backend de base de datos y autenticación, aprovechando PostgreSQL gestionado con Row Level Security nativo para el aislamiento multi-tenant, Realtime para actualizaciones en vivo, y Edge Functions para lógica serverless. La capa de IA se integra con **Claude de Anthropic** como LLM principal y un sistema de agentes orquestados que ejecutan tareas complejas de forma autónoma.

### 1.1 Los Tres Pilares Diferenciales de CivicOS

#### 🗂 Plataforma Operacional

- CRM unificado de contactos y votantes
- Canvassing offline con app KMM (iOS + Android)
- Comunicaciones multicanal (email, SMS, WhatsApp)
- Mapas y segmentación geográfica avanzada
- Gestión de voluntarios y equipos

#### 🤖 Inteligencia Artificial

- Agentes IA que automatizan workflows de campaña
- Motor de sugerencias proactivas por contexto
- Scoring predictivo de votantes con ML
- Análisis de sentiment en interacciones de terreno
- Generación de contenido asistida por IA

#### 🟢 Infraestructura (Supabase)

- PostgreSQL gestionado con RLS multi-tenant nativo
- Realtime para dashboards y mapas en vivo
- Edge Functions para lógica serverless
- pgvector para búsqueda semántica con IA
- Auth integrado con custom JWT claims para RBAC

> **🟢 Base de Datos:** CivicOS utiliza Supabase (PostgreSQL gestionado) como única fuente de verdad: Row Level Security para aislamiento multi-tenant, Realtime para dashboards en vivo, Storage para archivos y Edge Functions para lógica serverless cerca del usuario.

---

## 2. Contexto y Oportunidad de Mercado

### 2.1 Problema que Resolvemos

Las campañas políticas modernas operan con herramientas fragmentadas: un CRM para contactos, otra plataforma para email marketing, hojas de cálculo para coordinar voluntarios y aplicaciones genéricas para el trabajo de campo. Esta fragmentación genera pérdida de datos, duplicidad de esfuerzos e imposibilidad de medir el impacto real de cada acción de campaña.

Adicionalmente, **ninguna plataforma electoral existente aprovecha de forma nativa la Inteligencia Artificial** para guiar las decisiones de los equipos de campaña. Los datos se recopilan pero raramente se convierten en acciones recomendadas de forma automática y contextual.

### 2.2 Tamaño de Mercado

| Mercado | Descripción | Estimado | Criterio |
|---|---|---|---|
| **TAM** | Campañas políticas + ONGs globales con necesidad de software de movilización | USD 4,200M | Global, todos los segmentos |
| **SAM** | LATAM + España + Francia — campañas con >5 usuarios | USD 380M | Regiones objetivo año 1–3 |
| **SOM** | 5% del SAM en 3 años post-lanzamiento | USD 19M ARR | Meta conservadora |

### 2.3 Competidores Directos

| Plataforma | CRM | Terreno | Móvil | IA Nativa | Precio/mes |
|---|---|---|---|---|---|
| NationBuilder | ★★★★★ | ★★☆☆☆ | ★★★☆☆ | ★☆☆☆☆ | USD 29–599+ |
| Qomon | ★★★☆☆ | ★★★★★ | ★★★★☆ | ★★☆☆☆ | EUR 99–499+ |
| NGP VAN | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | ★☆☆☆☆ | USD 50–800+ |
| **CivicOS (objetivo)** | **★★★★★** | **★★★★★** | **★★★★★** | **★★★★★** | **USD 49–699+** |

---

## 3. Arquitectura del Sistema

### 3.1 Principios de Diseño

- **Supabase-first:** PostgreSQL gestionado con todas sus capacidades nativas (PostGIS, pgvector, tsvector, RLS); sin ORM propio en capa de datos
- **Multi-tenant por diseño:** aislamiento mediante Row Level Security nativo de Supabase por `tenant_id`
- **API-first:** toda funcionalidad expuesta vía REST (PostgREST de Supabase) + GraphQL + Realtime websockets
- **AI-native:** la capa de IA no es un añadido; está integrada en el core de cada módulo desde el diseño
- **Mobile-first:** app KMM con lógica compartida iOS/Android, UI nativa por plataforma
- **Edge computing:** Supabase Edge Functions (Deno) para lógica serverless de baja latencia
- **Event-driven:** Supabase Realtime + webhooks para comunicación asíncrona entre servicios

### 3.2 Stack Tecnológico

| Capa | Tecnología | Justificación |
|---|---|---|
| Frontend Web | React 18 + TypeScript + Vite + Next.js | SSR, routing, client-side supabase-js SDK |
| BaaS / DB | **Supabase (PostgreSQL 16 + PostGIS)** | RLS multi-tenant, Realtime, Auth, Storage, Edge Fn |
| Auth | **Supabase Auth (JWT + MFA + SSO SAML)** | Auth nativo integrado con RLS; OAuth social |
| Storage de archivos | **Supabase Storage (S3-compatible)** | Archivos de campaña, fotos de canvassing, exports |
| Realtime | **Supabase Realtime (Phoenix Channels)** | Dashboard en vivo, mapas de terreno, chat equipo |
| Edge Functions | **Supabase Edge Functions (Deno / TypeScript)** | Webhooks, lógica serverless, triggers de agentes IA |
| Cache | Redis (Upstash serverless) | Rate limiting, sesiones de agentes, job queues |
| Búsqueda | **pgvector (Supabase) + tsvector full-text** | Búsqueda semántica de contactos y base de conocimiento IA |
| Motor IA LLM | **Anthropic Claude (API)** | Agentes, sugerencias, generación de contenido |
| Orquestación IA | LangGraph TypeScript | Workflows de agentes multi-paso con estado persistente |
| Embeddings | OpenAI text-embedding-3 / Supabase pgvector | Base de conocimiento semántica de la campaña |
| Mapas | Mapbox GL JS + PostGIS (Supabase) | Análisis espacial SQL-native, mapas vectoriales |
| App Móvil | **Kotlin Multiplatform Mobile (KMM)** | ~70% lógica compartida iOS/Android, UI nativa |
| UI iOS | SwiftUI | Experiencia nativa Apple, biometría, APNs |
| UI Android | Jetpack Compose | Experiencia nativa Android moderna, FCM |
| Persistencia local | SQLDelight + SQLCipher | Offline en KMM, datos encriptados en dispositivo |
| Email | SendGrid / Amazon SES | Deliverability, templates dinámicos, analytics |
| SMS / WhatsApp | Twilio + WhatsApp Business API | Cobertura global, compliance por país |
| CI/CD | GitHub Actions + Supabase CLI migrations | Migrations versionadas, deploy automático |
| Monitoring | Datadog + Sentry + Supabase Dashboard | APM, errores, métricas de DB en tiempo real |

### 3.3 Arquitectura Multi-Tenant con Supabase

CivicOS implementa multi-tenancy usando **Row Level Security (RLS)** nativo de Supabase. Cada tabla incluye una columna `tenant_id` (UUID) y políticas RLS que filtran automáticamente todos los queries según el JWT del usuario autenticado. No se requiere lógica de filtrado en la capa de aplicación.

> **🔒 Patrón RLS por Tenant:** Todas las tablas tienen `tenant_id UUID NOT NULL REFERENCES tenants(id)`. La política RLS es: `USING (tenant_id = auth.jwt() ->> 'tenant_id')`. El `tenant_id` se inyecta como custom claim en el JWT durante el login. Supabase aplica la política en el motor de PostgreSQL, haciendo imposible el acceso cruzado entre tenants.

Para tenants Enterprise con volúmenes superiores a 5 millones de contactos, se prevé la opción de **instancias Supabase dedicadas** (Supabase Enterprise), manteniendo la misma API y estructura de datos pero con recursos PostgreSQL aislados.

---

## 4. Multi-Tenant, Roles y Permisos

### 4.1 Modelo de Organización (Tenant)

La jerarquía es: **Organización → Campaña → Equipo → Usuario**. La facturación y el plan SaaS se gestionan a nivel de organización.

| Nivel | Descripción | Ejemplo |
|---|---|---|
| **Organización** | El tenant raíz. Facturación y plan SaaS a este nivel. Tiene su propio subdominio. | `partido-demo.civicos.app` |
| **Campaña** | Proceso electoral específico dentro de la org. Tiene su propia configuración. | Elecciones Alcaldía 2026 |
| **Equipo** | Agrupación funcional o geográfica dentro de una campaña. | Equipo Norte / Voluntarios / Comms |
| **Usuario** | Persona con acceso. Puede pertenecer a múltiples campañas con roles distintos. | `juan@campana.org` |

### 4.2 Integración RBAC con Supabase Auth

Los roles y permisos se gestionan a través de **custom claims en los JWT de Supabase Auth**. Al autenticarse, un Edge Function enriquece el token con `tenant_id`, `campaign_ids[]` y `role`. Las políticas RLS verifican estos claims directamente en la base de datos, sin necesidad de un middleware externo.

| Rol | Alcance | Permisos Clave |
|---|---|---|
| **Super Admin** | Organización completa | Gestión de tenants, facturación, usuarios, configuración global, logs de agentes IA |
| **Campaign Manager** | Campaña asignada | CRUD completo: contactos, equipos, comunicaciones, reportes, configuración de agentes IA |
| **Field Coordinator** | Equipo(s) asignado(s) | Asignar canvassing, ver mapas de equipo, aprobar visitas, recibir sugerencias IA de terreno |
| **Volunteer** | Actividades asignadas | Ejecutar canvassing, registrar resultados, ver territorio asignado, chatbot IA de soporte |
| **Analyst (Read-Only)** | Campaña asignada | Ver todos los reportes y dashboards, exportar datos, acceder a sugerencias IA sin ejecutar acciones |
| **Custom Role** | Configurable | El Campaign Manager puede crear roles intermedios con permisos granulares por recurso y acción |

---

## 5. Módulos Funcionales Operacionales

### 5.1 CRM de Contactos y Votantes

Núcleo de la plataforma. Cada contacto tiene un perfil unificado que agrega todas las interacciones a través del tiempo y los canales. Los datos se almacenan en Supabase con full-text search (`tsvector`) y búsqueda semántica via `pgvector`.

- **Perfil unificado:** datos demográficos, electorales, de engagement e historial de interacciones
- **Importación masiva:** CSV, Excel; deduplicación automática por email/teléfono/nombre+dirección
- **Segmentos dinámicos:** listas que se recalculan automáticamente via Supabase Realtime
- **Búsqueda full-text + semántica** (pgvector) para encontrar perfiles por descripción libre
- **Timeline de actividad:** registro cronológico de llamadas, visitas, emails, SMS, eventos
- **Notas, tareas y follow-ups** integrados al perfil con asignación a usuarios

### 5.2 Canvassing y Trabajo de Terreno

- División geográfica: zonas, barrios, manzanas con shapes GeoJSON importables
- Asignación de territorios a equipos y voluntarios desde el dashboard web o la app móvil
- App móvil KMM: offline-first, scripts de conversación configurables, registro de resultados
- Mapa en tiempo real del progreso del equipo vía Supabase Realtime
- Sincronización delta automática al recuperar conexión (hasta 72h offline)
- Aprobación de resultados de canvassing por el coordinador antes de procesarse en el CRM

### 5.3 Gestión de Voluntarios

- Perfil de voluntario: habilidades, disponibilidad, zonas de interés, historial de participación
- Formulario de registro público con URL personalizada por campaña
- Proceso de onboarding configurable: verificación, capacitación, asignación de equipo
- Gamificación opcional: puntos, insignias y ranking por actividad registrada
- Comunicación directa: notificaciones push, mensajes y reconocimientos desde la plataforma

### 5.4 Comunicaciones Multicanal

- **Email:** editor drag-and-drop con variables dinámicas, A/B testing, métricas en tiempo real
- **SMS:** envío masivo personalizado, respuestas capturadas en el timeline del contacto
- **WhatsApp Business:** mensajes template aprobados por Meta, conversaciones 1:1, chatbot configurable
- **Automatizaciones:** journeys de comunicación basados en triggers del CRM o del calendario
- Todos los mensajes enviados quedan registrados en el perfil del contacto en Supabase

### 5.5 Mapas y Segmentación Geográfica

- Mapas de calor de simpatizantes, votantes objetivo y territorio no cubierto (PostGIS nativo en Supabase)
- Superposición de capas: divisiones electorales, resultados históricos, datos demográficos
- Geocodificación automática de direcciones al importar contactos
- Dibujo de zonas personalizadas para asignación de territorios
- Análisis de brecha: zonas con menor penetración de campaña detectadas automáticamente

### 5.6 Analítica y Reportes

- Dashboard ejecutivo en tiempo real: KPIs de contactos, cobertura, comunicaciones y voluntarios
- Reportes operacionales: canvassing por zona/voluntario, rendimiento de comunicaciones, retención
- Todos los reportes exportables a PDF, Excel y CSV
- Supabase Realtime alimenta los dashboards sin necesidad de polling manual

---

## 6. Supabase — Arquitectura de Datos

### 6.1 Por Qué Supabase

Supabase es el backend-as-a-service elegido para CivicOS por cuatro razones estratégicas:

1. **PostgreSQL gestionado** con todas sus capacidades nativas (PostGIS, pgvector, tsvector, RLS)
2. **Auth integrado** con soporte nativo de custom JWT claims necesario para RBAC
3. **Realtime nativo** para dashboards de terreno en vivo sin polling
4. **Edge Functions** para lógica serverless sin cold starts significativos, reduciendo la necesidad de un backend propio para la mayoría de operaciones

### 6.2 Módulos de Supabase Utilizados

| Módulo Supabase | Uso en CivicOS | Detalle Técnico |
|---|---|---|
| **Database (PostgreSQL)** | Toda la persistencia de datos | RLS por `tenant_id`, PostGIS para geo, pgvector para IA |
| **Auth** | Autenticación y tokens | JWT con custom claims (`tenant_id`, `role`, `campaign_ids`) |
| **Row Level Security** | Multi-tenancy | Políticas RLS en todas las tablas; zero lógica de filtrado en app |
| **Realtime** | Dashboards y mapas en vivo | Canales por tenant; suscripciones a cambios en tablas críticas |
| **Storage** | Archivos de campaña | Fotos de canvassing, documentos, exports; políticas por tenant |
| **Edge Functions** | Lógica serverless + IA | Webhooks, triggers de agentes IA, enriquecimiento de JWT |
| **pgvector** | IA semántica | Embeddings de contactos, documentos y base de conocimiento de campaña |
| **pg_cron** | Tareas programadas | Cálculo nocturno de scores, limpieza de datos, reportes automáticos |

### 6.3 Esquema de Tablas Principales

Todas las tablas incluyen `tenant_id UUID NOT NULL` con política RLS activa.

| Tabla | Columnas Clave | Notas |
|---|---|---|
| `tenants` | `id, name, slug, plan, settings JSONB` | Tenant raíz; slug define el subdominio |
| `campaigns` | `id, tenant_id, name, election_date, config JSONB` | Una org puede tener múltiples campañas activas |
| `contacts` | `id, tenant_id, campaign_id, name, address, geo POINT, embedding VECTOR(1536)` | PostGIS para geo, pgvector para búsqueda semántica |
| `users` | `id, tenant_id, role, campaign_ids[], preferences JSONB` | Gestionado por Supabase Auth; claims en JWT |
| `canvass_visits` | `id, tenant_id, campaign_id, contact_id, result, notes, geo POINT, synced_at` | Soporte offline; geo del punto de visita real |
| `communications` | `id, tenant_id, campaign_id, channel, status, metrics JSONB` | Canal: `email / sms / whatsapp`; métricas por envío |
| `ai_suggestions` | `id, tenant_id, campaign_id, type, content JSONB, status, feedback` | Sugerencias generadas por el motor IA; trazabilidad completa |
| `agent_runs` | `id, tenant_id, workflow_id, status, steps JSONB, result JSONB` | Log de ejecuciones de agentes; pasos auditables |

### 6.4 Estrategia de Migraciones

- Todas las migraciones se gestionan con **Supabase CLI** (`supabase db push` / `supabase migration new`)
- El repositorio incluye `/supabase/migrations` con cada cambio versionado en Git
- CI/CD aplica migraciones automáticamente a staging antes de cada deploy a producción
- Las políticas RLS se incluyen en las migraciones, garantizando que nunca exista una tabla sin protección
- Para nuevos tenants, un Edge Function ejecuta las seeds iniciales de configuración de campaña

---

## 7. Módulo de Agentes de IA y Workflows

> **🤖 Visión IA:** CivicOS no es una plataforma con IA añadida como feature: la IA es un ciudadano de primera clase del producto. Los agentes tienen acceso directo a Supabase, pueden leer y escribir datos, ejecutar comunicaciones y coordinarse entre sí para completar tareas complejas de manera autónoma.

### 7.1 Arquitectura del Sistema de Agentes

CivicOS implementa un framework de agentes multi-paso basado en **LangGraph (TypeScript)** con **Claude de Anthropic** como LLM principal. Los agentes se ejecutan en Supabase Edge Functions, persisten su estado en la tabla `agent_runs`, y pueden suspenderse y reanudarse (workflows de larga duración).

| Componente | Tecnología | Responsabilidad |
|---|---|---|
| **LLM Principal** | Anthropic Claude (claude-sonnet) | Razonamiento, generación de texto, decisiones de flujo |
| **Orquestador** | LangGraph TypeScript | Gestión de estado, transiciones entre nodos, manejo de errores |
| **Herramientas (Tools)** | Supabase SDK + APIs externas | Leer/escribir DB, enviar comunicaciones, llamar APIs de mapas |
| **Memoria a corto plazo** | Redis (Upstash) | Contexto de conversación activa del agente |
| **Memoria a largo plazo** | pgvector (Supabase) | Base de conocimiento semántica de la campaña |
| **Estado persistente** | Tabla `agent_runs` (Supabase) | Checkpoint de workflows de larga duración, auditoría |
| **Ejecución** | Supabase Edge Functions (Deno) | Serverless, escalado automático, sin cold starts críticos |
| **Triggers** | Supabase pg_cron + Webhooks + UI | Ejecución programada, por evento de DB, o bajo demanda |

### 7.2 Catálogo de Workflows de Agentes

#### 🤖 Agente 1 — Bienvenida y Calificación de Nuevos Contactos

**Trigger:** nuevo contacto registrado en el CRM (vía formulario o importación)

- Enriquece el perfil con datos públicos disponibles (redes sociales, registro electoral si integrado)
- Clasifica automáticamente el nivel de simpatía inicial basado en el canal de captación y respuestas
- Asigna tags automáticos según el perfil demográfico y geográfico
- Envía mensaje de bienvenida personalizado por el canal preferido del contacto
- Notifica al Campaign Manager si el contacto tiene un perfil de alto valor (donante potencial, influencer local)

#### 🤖 Agente 2 — Seguimiento de Canvassing

**Trigger:** voluntario registra resultado de visita como "no en casa" o "requiere seguimiento"

- Programa automáticamente una visita de reintento en el horario más probable según el perfil del contacto
- Si han pasado 3 intentos fallidos, sugiere al coordinador cambiar el canal (llamada telefónica o SMS)
- Genera un resumen diario de los resultados del terreno para el Campaign Manager
- Identifica patrones de rechazo por zona y genera alerta si una zona supera el umbral configurable

#### 🤖 Agente 3 — Comunicaciones Inteligentes

**Trigger:** inicio de una campaña de comunicación o caída en métricas de engagement

- Analiza el historial de comunicaciones y sugiere el mejor horario de envío por segmento
- Genera variantes de asunto de email para A/B testing basadas en el perfil de la audiencia
- Monitorea en tiempo real las métricas; si están por debajo del benchmark, pausa el envío y notifica
- Sugiere mensajes de reengagement para contactos sin interacción en más de 30 días
- Genera borradores de mensajes adaptados al tono y valores configurados de la campaña

#### 🤖 Agente 4 — Análisis de Terreno y Redistribución

**Trigger:** ejecución programada cada noche o cuando la cobertura de una zona cae por debajo del umbral

- Analiza el mapa de progreso y detecta zonas con baja cobertura relativa al tiempo disponible
- Calcula la redistribución óptima de voluntarios para maximizar cobertura antes del día de elección
- Genera propuesta de redistribución para aprobación del coordinador **(Human-in-the-Loop)**
- Una vez aprobada, reasigna automáticamente los territorios en el sistema y notifica a los voluntarios

#### 🤖 Agente 5 — Monitoreo de Indicadores de Campaña

**Trigger:** ejecución diaria vía `pg_cron` + alerta en tiempo real si KPI cae >20% en 24h

- Consolida todos los KPIs de la campaña: contactos alcanzados, cobertura, comunicaciones, voluntarios activos
- Compara contra benchmarks históricos y metas configuradas por el Campaign Manager
- Genera el informe diario de situación de campaña con resumen ejecutivo en lenguaje natural
- Detecta anomalías (caída brusca de simpatizantes en una zona, voluntarios inactivos) y genera alertas
- Sugiere acciones correctivas priorizadas con estimación de impacto potencial

#### 🤖 Agente 6 — Generación de Contenido de Campaña

**Trigger:** solicitud explícita del Campaign Manager o Field Coordinator desde la UI

- Genera borradores de discursos, mensajes de campaña, scripts de canvassing y posts en redes sociales
- Adapta el tono, los temas clave y los valores de la campaña según la configuración del perfil
- Permite iterar sobre el borrador mediante conversación directa con el agente
- Todo el contenido generado queda guardado en Supabase Storage con metadatos de autoría y versión

### 7.3 Human-in-the-Loop (HITL)

Todos los agentes que realizan acciones irreversibles requieren aprobación humana antes de ejecutarse:

1. El agente completa su análisis y genera una propuesta de acción con justificación
2. Se crea una notificación en la UI y un registro en `ai_suggestions` con estado `pending_approval`
3. El usuario revisa la propuesta, puede editarla, aprobarla o rechazarla con feedback
4. Si el usuario aprueba, el agente ejecuta la acción y registra el resultado en `agent_runs`
5. El feedback (aprobado / rechazado / editado) se usa para mejorar el modelo de preferencias de la campaña

> **🔐 Seguridad de Agentes:** Los agentes operan con un JWT de servicio de Supabase con permisos acotados al tenant de la campaña activa. Un agente no puede leer ni modificar datos de otro tenant. Cada operación de escritura del agente queda registrada en el audit log con `agent_id`, `timestamp` y justificación.

---

## 8. Motor de Sugerencias IA

### 8.1 Visión del Motor

El Motor de Sugerencias IA es la capa proactiva de inteligencia de CivicOS. A diferencia de los agentes (que ejecutan tareas), el motor de sugerencias **observa continuamente los datos de la campaña** y genera recomendaciones accionables para mejorar el desempeño, organizadas por módulo, prioridad e impacto estimado.

Las sugerencias se muestran en un panel dedicado **"Centro de Inteligencia"** dentro del dashboard de cada campaña. Cada sugerencia puede ser aplicada con un clic (dispara el agente correspondiente), descartada, o guardada para revisión posterior.

### 8.2 Tipos de Sugerencias por Módulo

| Módulo | Tipo de Sugerencia | Ejemplo Concreto |
|---|---|---|
| **CRM** | Segmentación de contactos | *"Hay 347 contactos indecisos en la zona norte sin interacción en 21 días. Sugerimos una secuencia de reengagement."* |
| **Canvassing** | Optimización de rutas y zonas | *"La zona 12 tiene solo 34% de cobertura con 8 días para la elección. Reasignar 3 voluntarios del sector 4 puede cerrar la brecha."* |
| **Voluntarios** | Retención y activación | *"12 voluntarios no han registrado actividad en 7 días. Un mensaje de motivación personalizado podría reactivar al 60% según patrones históricos."* |
| **Comunicaciones** | Optimización de envíos | *"Los emails enviados los martes a las 7pm tienen 34% más apertura en tu base. Tu próximo envío está programado para lunes 10am."* |
| **Mapas** | Alertas geográficas | *"Fuerte concentración de contactos indecisos en 3 manzanas del barrio Centro. Una zona de acción intensiva podría impactar 420 votantes."* |
| **Analítica** | Alertas de indicadores | *"El NPS de la campaña cayó 8 puntos en 5 días. Las notas de canvassing muestran preocupación recurrente por el tema de seguridad."* |
| **Contenido** | Mejora de mensajes | *"Los mensajes que mencionan empleo local tienen 2.3x más respuestas positivas en tu base. Tu próximo SMS no menciona este tema."* |

### 8.3 Arquitectura del Motor de Sugerencias

#### Pipeline de Generación

1. **Recolección:** `pg_cron` ejecuta queries analíticos sobre las tablas de Supabase cada hora para detectar patrones, anomalías y oportunidades
2. **Contextualización:** los datos se enriquecen con el perfil de la campaña (metas, benchmarks, configuración, historial de sugerencias previas)
3. **Generación LLM:** Claude recibe el contexto estructurado y genera sugerencias priorizadas en formato JSON con: tipo, título, descripción, impacto estimado, acción sugerida y agente ejecutor
4. **Almacenamiento:** las sugerencias se insertan en la tabla `ai_suggestions` de Supabase con estado `active`
5. **Notificación:** Supabase Realtime notifica al frontend; la UI actualiza el Centro de Inteligencia en tiempo real

#### Sistema de Priorización

Cada sugerencia recibe un **score de prioridad** calculado por la IA basado en tres factores:

- **Urgencia:** días restantes para la elección × magnitud del problema detectado
- **Impacto estimado:** número de votantes/contactos afectados × probabilidad de mejora según datos históricos
- **Costo de acción:** esfuerzo estimado para implementar la acción sugerida (bajo / medio / alto)

#### Aprendizaje Continuo

- Cada vez que el usuario aplica, descarta o modifica una sugerencia, se genera un registro de feedback
- El feedback se incluye como contexto en las próximas rondas de generación (few-shot learning)
- Mensualmente se generan embeddings de las sugerencias más exitosas para guiar futuras generaciones
- **El modelo se personaliza por campaña:** las preferencias de una campaña no afectan a otras tenants

### 8.4 Centro de Inteligencia (UI)

- **Panel de sugerencias activas:** organizadas por prioridad (crítica / alta / media) con badges por módulo
- **Vista de detalle:** datos que originaron la sugerencia, razonamiento del modelo y acciones disponibles
- **Chat contextual:** el usuario puede hacer preguntas sobre cualquier sugerencia en lenguaje natural
- **Historial:** sugerencias pasadas con resultado (aplicada / descartada / modificada) e impacto real medido
- **Configuración:** ajuste de umbrales de alerta, silenciar tipos de sugerencias y frecuencia de análisis

> **💡 Ejemplo de Sugerencia Crítica:** *"Tu tasa de conversión de contactos a simpatizantes activos cayó del 23% al 14% esta semana. El análisis de las notas de canvassing de la zona sur sugiere que la preocupación principal es el tema de transporte público. Recomendamos: (1) ajustar el script de conversación para abordar este tema, (2) enviar un SMS específico a 890 contactos indecisos de la zona. ¿Aplicar las dos acciones?"*

### 8.5 Base de Conocimiento Semántica de Campaña

Cada campaña puede cargar su base de conocimiento: plataforma política, propuestas, discursos, resultados de encuestas, notas de reuniones, etc. Estos documentos se procesan con embeddings y se almacenan en **pgvector (Supabase)**. El motor de IA y los agentes utilizan esta base para:

- Contextualizar sugerencias con los valores y propuestas reales de la campaña
- Generar contenido alineado con el mensaje oficial de la campaña
- Responder preguntas de los voluntarios sobre las propuestas del candidato (chatbot de soporte interno)
- Detectar inconsistencias entre las comunicaciones enviadas y la plataforma oficial

---

## 9. Aplicación Móvil KMM

### 9.1 Arquitectura KMM con Supabase

La app móvil de CivicOS usa **Kotlin Multiplatform Mobile (KMM)** para compartir ~70% del código entre iOS (SwiftUI) y Android (Jetpack Compose). La integración con Supabase se realiza vía **Ktor** (cliente HTTP) usando la API REST de Supabase y los JWT de autenticación. SQLDelight gestiona la persistencia local para el modo offline.

| Capa | Tecnología | Responsabilidad |
|---|---|---|
| UI iOS | SwiftUI | Pantallas nativas iOS, biometría FaceID, APNs push |
| UI Android | Jetpack Compose | Pantallas nativas Android, huella dactilar, FCM push |
| ViewModel (shared) | KMM + Kotlin Coroutines | Estado de UI, lógica de presentación compartida |
| Domain (shared) | KMM | Use cases, reglas de negocio, validaciones |
| Data (shared) | KMM + Ktor + SQLDelight | Supabase REST API, caché local, sincronización offline |
| Auth móvil | Supabase Auth SDK / JWT | Login, refresh de tokens, claims de rol |
| Mapas móvil | Mapbox SDK nativo | Mapas de canvassing offline con tiles descargados |
| IA móvil *(Fase 2)* | Claude API vía Edge Fn | Asistente de campo y sugerencias en tiempo real |

### 9.2 Funcionalidades para Voluntarios

- Login con biometría (FaceID / huella dactilar)
- Lista de tareas del día con ruta optimizada en mapa
- Modo canvassing offline: registro de visitas, scripts de conversación, captura de fotos
- Sincronización automática al recuperar conexión (hasta 72h offline)
- Notificaciones push del coordinador
- Chatbot IA de soporte: responde preguntas sobre las propuestas de la campaña

### 9.3 Funcionalidades para Coordinadores

- Dashboard en tiempo real del progreso del equipo
- Mapa en vivo con progreso por zona (Supabase Realtime)
- Reasignación de territorios desde el móvil
- Mensajería al equipo y alertas de campo
- Aprobación de resultados de canvassing
- Notificaciones de alertas IA de terreno

### 9.4 Características Técnicas Móviles

- **Offline-first:** hasta 72 horas de operación sin conexión usando SQLDelight
- **Sincronización delta:** solo se transmiten cambios, no datos completos
- **Encriptación local:** datos sensibles encriptados con SQLCipher
- **Push notifications:** Firebase Cloud Messaging (Android) + APNs (iOS)
- **Gestión de batería:** optimización de geolocalización en background

---

## 10. Modelo de Negocio SaaS

### 10.1 Planes y Precios

| | Starter | Pro | Campaign | Enterprise |
|---|---|---|---|---|
| **Precio/mes** | USD 49 | USD 199 | USD 499 | Custom |
| **Contactos** | 5,000 | 50,000 | 500,000 | Ilimitado |
| **Usuarios** | 5 | 25 | Ilimitado | Ilimitado |
| **Campañas activas** | 1 | 3 | Ilimitado | Ilimitado |
| **App móvil** | ✅ | ✅ | ✅ | ✅ |
| **Agentes IA** | — | 2 agentes | Todos | Custom |
| **Sugerencias IA** | Básico | ✅ | ✅ + Prioridad | ✅ + Fine-tuning |
| **WhatsApp** | — | ✅ | ✅ | ✅ |
| **Base conocimiento IA** | — | — | ✅ 500MB | ✅ Ilimitado |
| **SLA** | 99.5% | 99.9% | 99.9% | 99.99% |
| **Soporte** | Email | Email + Chat | Prioritario | Dedicado |

### 10.2 Créditos de IA

Las funcionalidades de IA (agentes y sugerencias) consumen **créditos de IA** incluidos en cada plan, calculados por tokens LLM consumidos y por ejecución de agentes. El plan Campaign incluye créditos equivalentes a ~10,000 sugerencias/mes y ~500 ejecuciones de agentes. Al superar el límite, el cliente puede adquirir créditos adicionales o escalar de plan.

### 10.3 Onboarding Self-Service

- Registro de la organización: nombre, país, tipo (partido, ONG, consultoría), subdominio
- Trial gratuito de 14 días con acceso completo al plan Pro
- Wizard de configuración inicial: primera campaña, importación de contactos, invitación de usuarios
- Verificación de dominio para email personalizado y configuración de WhatsApp Business
- Biblioteca de plantillas de campaña por tipo de elección (municipal, regional, nacional)

---

## 11. Roadmap de Desarrollo

### 11.1 Fases

| Fase | Duración | Alcance | Hito |
|---|---|---|---|
| **MVP (Fase 1)** | 4 meses | CRM + Canvassing + App KMM + Multi-tenant Supabase + RBAC + 2 agentes básicos | Primera campaña pagante en producción |
| **Fase 2** | 3 meses | Email + SMS + Mapas + Voluntarios + Dashboard Realtime + Motor Sugerencias IA v1 | 50 organizaciones activas |
| **Fase 3** | 3 meses | WhatsApp + Automatizaciones + 6 agentes completos + Centro de Inteligencia + API pública | USD 100K MRR |
| **Fase 4** | 4 meses | Fine-tuning IA por campaña + Integraciones electorales oficiales + Marketplace de templates | USD 500K MRR |

### 11.2 MVP — Criterios de Éxito (Fase 1)

- Onboarding de una organización en menos de 10 minutos sin asistencia
- Importación de 10,000 contactos en menos de 2 minutos
- App móvil disponible en App Store y Google Play
- Canvassing offline funcional por al menos 24 horas sin conexión
- Tiempo de carga del dashboard < 2 segundos (p95)
- Zero data leakage entre tenants (validado con pruebas de penetración)

### 11.3 KPIs Post-Lanzamiento

| KPI | Mes 3 | Mes 6 | Mes 12 |
|---|---|---|---|
| Organizaciones activas | 20 | 75 | 250 |
| MRR | USD 8K | USD 35K | USD 150K |
| NPS | > 30 | > 40 | > 50 |
| Sugerencias IA aceptadas/mes | — | 2,000 | 25,000 |
| Tasa de aceptación sugerencias | — | > 40% | > 60% |
| Contactos gestionados | 500K | 5M | 25M |
| DAU App Móvil | 200 | 2,000 | 15,000 |

---

## 12. Seguridad y Cumplimiento

### 12.1 Seguridad de Datos con Supabase

- **RLS en todas las tablas:** ningún query puede acceder a datos de otro tenant, verificado a nivel de motor PostgreSQL
- **Encriptación en reposo:** AES-256 gestionado por Supabase/AWS RDS
- **Encriptación en tránsito:** TLS 1.3 en todos los endpoints de Supabase y Edge Functions
- **Audit log inmutable:** trigger de PostgreSQL registra cada INSERT/UPDATE/DELETE con `user_id` y `timestamp`
- **Secrets management:** variables de entorno en Supabase Vault para credenciales de terceros (Twilio, SendGrid, Claude API)

### 12.2 Seguridad de los Agentes IA

- Los agentes operan con JWT de servicio acotado al tenant activo; imposible acceder a datos de otros tenants
- **Prompt injection prevention:** los inputs de usuario se sanitizan antes de incluirse en prompts de agentes
- Rate limiting por tenant en las Edge Functions que invocan la API de Claude
- Todas las acciones irreversibles requieren aprobación humana explícita (HITL)
- Los prompts del sistema y la lógica de los agentes no son accesibles desde el frontend

### 12.3 Cumplimiento Regulatorio

- **GDPR:** derecho al olvido vía Supabase (DELETE + limpieza de embeddings en pgvector), portabilidad de datos
- **Leyes nacionales:** Colombia Ley 1581, México LFPDPPP, Argentina Ley 25326, España LOPDGDD
- **Compliance electoral:** motor de reglas configurable para restricciones de comunicación en períodos electorales por país
- **SOC 2 Type II:** objetivo para Mes 12; Supabase ya cuenta con certificaciones de seguridad base
- **IA responsable:** sugerencias y outputs de agentes incluyen metadatos de trazabilidad (modelo usado, versión, timestamp)

---

## 13. Decisiones Pendientes y Riesgos

### 13.1 Decisiones Abiertas

| Decisión | Opciones | Propietario |
|---|---|---|
| Plan de Supabase (shared vs dedicated por tenant grande) | Shared tier vs Dedicated (Supabase Enterprise) | CTO |
| Modelo LLM de fallback si Claude no disponible | GPT-4o / Gemini / modelo propio | CTO + CPO |
| Frecuencia de generación de sugerencias IA | Horaria vs por evento vs mixta | CPO + Data |
| Región Supabase primaria | `us-east-1` vs `sa-east-1` vs `eu-west-1` | CTO |
| Precio de créditos IA adicionales | Por tokens vs por ejecución de agente | CPO + CFO |

### 13.2 Riesgos Identificados

| Riesgo | Impacto | Mitigación |
|---|---|---|
| Costos de API LLM escalan más rápido que los ingresos | Alto | Caching agresivo de respuestas + rate limiting por tenant + modelo de créditos |
| Dependencia de Supabase como proveedor único de BaaS | Medio | Abstraer el acceso a datos en una capa de repositorio; migraciones SQL portables |
| Alucinaciones del LLM en sugerencias críticas de campaña | Alto | HITL obligatorio en acciones de alto impacto; evaluación automática de calidad de outputs |
| Complejidad de KMM en equipo sin experiencia | Medio | Contratar 1 senior KMM; training del equipo; biblioteca de ejemplos interna |
| Regulación de IA en elecciones (legislación emergente) | Alto | Monitoreo legal por país; etiquetado obligatorio de contenido generado por IA |
| Latencia de Edge Functions para workflows de agentes largos | Medio | Dividir workflows en steps cortos; usar `pg_cron` para jobs pesados fuera de Edge Fn |

### 13.3 Próximos Pasos

1. Revisión del PRD con stakeholders técnicos y de negocio
2. Estimación de esfuerzo con el equipo de ingeniería (arquitectura Supabase + KMM + IA)
3. Setup del proyecto en Supabase: proyecto, RLS base, migraciones iniciales
4. Proof of Concept del primer agente IA (Bienvenida de Contactos) para validar el stack completo
5. Sprint 0: scaffolding de KMM, Edge Functions base, autenticación con custom claims

---

*CivicOS © 2026 — Documento Confidencial — Uso Interno*
