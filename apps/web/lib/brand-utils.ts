/**
 * Brand utilities — safe to import from both Server and Client Components.
 * No 'use client' directive here.
 */

export interface TenantBrand {
  color_primary:        string
  color_secondary:      string
  color_accent:         string
  color_background:     string
  color_surface:        string
  logo_url?:            string | null
  candidate_photo_url?: string | null
  slogan?:              string | null
  candidate_name?:      string | null
  candidate_role?:      string | null
}

export const DEFAULT_BRAND: TenantBrand = {
  color_primary:    '#2960ec',
  color_secondary:  '#1e293b',
  color_accent:     '#ea580c',
  color_background: '#FEFEFF',
  color_surface:    '#ffffff',
}

/** Build a TenantBrand from a single primary hex (backward-compat helper). */
export function brandFromColor(primaryHex: string): TenantBrand {
  return {
    ...DEFAULT_BRAND,
    color_primary: primaryHex,
  }
}
