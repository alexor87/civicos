import { z } from 'zod'

/* ── Enums ── */

export const documentTypes = ['CC', 'CE', 'TI', 'Pasaporte'] as const
export const contactStatuses = ['unknown', 'supporter', 'undecided', 'opponent'] as const
export const genders = ['M', 'F', 'NB', 'NE'] as const
export const voteIntentions = ['si', 'no', 'indeciso'] as const
export const electoralPriorities = ['alta', 'media', 'baja'] as const
export const campaignRoles = [
  'votante', 'lider_barrial', 'coordinador', 'voluntario', 'donante', 'testigo',
] as const
export const contactSources = [
  'puerta_a_puerta', 'evento', 'referido', 'formulario_web',
  'importado', 'whatsapp', 'otro',
] as const
export const maritalStatuses = [
  'soltero', 'casado', 'union_libre', 'divorciado', 'viudo',
] as const

/* ── Quick Add (15s flow — 3 fields) ── */

export const quickAddSchema = z.object({
  full_name: z.string().min(1, 'Nombre requerido').max(200, 'Máximo 200 caracteres'),
  phone: z.string().min(1, 'Teléfono requerido').max(15, 'Máximo 15 caracteres'),
  political_affinity: z.number().int().min(1).max(5).optional(),
})

/* ── Step 1: Essentials ── */

export const stepEssentialsSchema = z.object({
  first_name: z.string().min(1, 'Nombre requerido').max(100, 'Máximo 100 caracteres'),
  last_name: z.string().min(1, 'Apellido requerido').max(100, 'Máximo 100 caracteres'),
  document_type: z.enum(documentTypes),
  document_number: z.string().min(1, 'Documento requerido').max(20, 'Máximo 20 caracteres'),
  phone: z.string().min(1, 'Teléfono requerido').max(15, 'Máximo 15 caracteres'),
  status: z.enum(contactStatuses),
  email: z.string().email('Email inválido').min(1, 'Email requerido').max(254, 'Máximo 254 caracteres'),
  phone_alternate: z.string().max(15, 'Máximo 15 caracteres').optional(),
})

/* ── Step 2: Location ── */

export const stepLocationSchema = z.object({
  department: z.string().max(100, 'Máximo 100 caracteres').optional(),
  municipality: z.string().max(100, 'Máximo 100 caracteres').optional(),
  commune: z.string().max(100, 'Máximo 100 caracteres').optional(),
  district_barrio: z.string().max(100, 'Máximo 100 caracteres').optional(),
  sector: z.string().max(100, 'Máximo 100 caracteres').optional(),
  address: z.string().max(200, 'Máximo 200 caracteres').optional(),
  voting_place: z.string().max(150, 'Máximo 150 caracteres').optional(),
  voting_table: z.string().max(10, 'Máximo 10 caracteres').optional(),
  location_lat: z.number().nullable().optional(),
  location_lng: z.number().nullable().optional(),
  geocoding_status: z.string().optional(),
})

/* ── Step 3: Political ── */

export const stepPoliticalSchema = z.object({
  political_affinity: z.number().int().min(1).max(5).optional(),
  vote_intention: z.enum(voteIntentions).optional(),
  electoral_priority: z.enum(electoralPriorities).optional(),
  campaign_role: z.enum(campaignRoles).optional(),
  preferred_party: z.string().max(100, 'Máximo 100 caracteres').optional(),
})

/* ── Step 4: Additional ── */

export const stepAdditionalSchema = z.object({
  birth_date: z.string().optional(),
  gender: z.enum(genders).optional(),
  marital_status: z.enum(maritalStatuses).optional(),
  contact_source: z.enum(contactSources).optional(),
  source_detail: z.string().max(200, 'Máximo 200 caracteres').optional(),
  referred_by: z.string().max(100, 'Máximo 100 caracteres').optional(),
  mobilizes_count: z.preprocess(
    (v) => (v === '' || v === undefined || Number.isNaN(v) ? undefined : Number(v)),
    z.number().int().min(0).optional()
  ),
  main_need: z.string().max(150, 'Máximo 150 caracteres').optional(),
  economic_sector: z.string().max(100, 'Máximo 100 caracteres').optional(),
  beneficiary_program: z.string().max(150, 'Máximo 150 caracteres').optional(),
})

/* ── Full contact form (merge of all 4 steps) ── */

export const contactFormSchema = stepEssentialsSchema
  .merge(stepLocationSchema)
  .merge(stepPoliticalSchema)
  .merge(stepAdditionalSchema)
  .extend({
    tags: z.string().max(500, 'Máximo 500 caracteres').optional(),
    notes: z.string().max(2000, 'Máximo 2000 caracteres').optional(),
  })

export type QuickAddForm = z.infer<typeof quickAddSchema>
export type ContactForm = z.infer<typeof contactFormSchema>
export type StepEssentials = z.infer<typeof stepEssentialsSchema>
export type StepLocation = z.infer<typeof stepLocationSchema>
export type StepPolitical = z.infer<typeof stepPoliticalSchema>
export type StepAdditional = z.infer<typeof stepAdditionalSchema>
