# Spec: Plantilla Excel Descargable para Importación de Contactos

## Estado
Aprobada ✅ — 2026-04-06

## Problema
Las campañas intentan importar contactos con archivos en formatos distintos al requerido por Scrutix. Los campos no coinciden, faltan columnas obligatorias y los datos llegan incompletos o con errores. Esto genera retrabajo y contactos mal cargados.

## Solución
Proveer una plantilla Excel oficial que las campañas descarguen, llenen con su información y carguen directamente. La plantilla garantiza que las columnas siempre coincidan con el formato esperado por Scrutix.

## Flujo de usuario
1. La campaña navega a `/dashboard/contacts/import`
2. Ve el botón **"Descargar plantilla Excel"** antes del área de carga
3. Descarga `plantilla_contactos_scrutix.xlsx`
4. Abre en Excel / Google Sheets, llena sus datos
5. Guarda y sube el archivo en la misma página
6. Los datos se importan sin necesidad de mapear columnas manualmente

## Alcance técnico

### API: `GET /api/import/contacts/template`
- Requiere autenticación (401 si no hay sesión)
- Genera y retorna un archivo `.xlsx` con:
  - **Hoja "Plantilla"**: fila 1 = encabezados con estilo, fila 2 = datos de ejemplo
  - **Hoja "Instrucciones"**: guía de cada campo con formato, valores válidos y cuáles son obligatorios
- Headers de respuesta:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="plantilla_contactos_scrutix.xlsx"`

### Campos en la plantilla (33 columnas)
| Encabezado | Campo interno | Obligatorio |
|---|---|---|
| Nombre | first_name | ✅ |
| Apellido | last_name | ✅ |
| Nro. Documento | document_number | — |
| Tipo Documento | document_type | — |
| Teléfono | phone | — |
| Teléfono Alterno | phone_alternate | — |
| Correo | email | — |
| Fecha Nacimiento (DD/MM/AAAA) | birth_date | — |
| Género | gender | — |
| Estado Civil | marital_status | — |
| Dirección | address | — |
| Ciudad | city | — |
| Departamento | department | — |
| Municipio | municipality | — |
| Comuna | commune | — |
| Barrio / Vereda | district | — |
| Sector | sector | — |
| Puesto de Votación | voting_place | — |
| Mesa de Votación | voting_table | — |
| Estado del Contacto | status | — |
| Afinidad Política | political_affinity | — |
| Intención de Voto | vote_intention | — |
| Prioridad Electoral | electoral_priority | — |
| Rol en Campaña | campaign_role | — |
| Fuente de Captura | capture_source | — |
| Detalle de Fuente | source_detail | — |
| Líder que Refiere | referred_by | — |
| Votos que Moviliza | mobilizes_count | — |
| Necesidad Principal | main_need | — |
| Sector Económico | economic_sector | — |
| Beneficiario de Programa | beneficiary_program | — |
| Etiquetas (separadas por coma) | tags | — |
| Notas | notes | — |

### UI: botón en import page
- Ubicación: Step 1, antes del área de drag-and-drop
- Componente: `Button` variant `outline` con ícono `Download` (lucide-react)
- Texto: "Descargar plantilla Excel"
- Acción: descarga directa via `window.location.href`

## Fuera de alcance
- Generación de plantillas por campaña con datos pre-cargados
- Validación de datos en celdas Excel (dropdowns de Excel — complejidad alta vs valor bajo)
- Plantilla multilingüe
