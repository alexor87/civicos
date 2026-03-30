import { describe, it, expect } from 'vitest'
import {
  ALL_PERMISSIONS, PERMISSION_MODULES, DEFAULT_PERMISSIONS,
  PERMISSION_DEPENDENCIES, type Permission,
} from '@/lib/permissions'

describe('permissions constants', () => {
  it('defines 52 permissions', () => {
    expect(ALL_PERMISSIONS).toHaveLength(52)
  })

  it('all 5 system roles have defaults', () => {
    const roles = ['super_admin', 'campaign_manager', 'field_coordinator', 'volunteer', 'analyst']
    roles.forEach(r => expect(DEFAULT_PERMISSIONS[r]).toBeDefined())
  })

  it('super_admin has all permissions true', () => {
    ALL_PERMISSIONS.forEach(p => {
      expect(DEFAULT_PERMISSIONS.super_admin[p]).toBe(true)
    })
  })

  it('every permission in modules exists in ALL_PERMISSIONS', () => {
    PERMISSION_MODULES.forEach(mod => {
      mod.permissions.forEach(p => {
        expect(ALL_PERMISSIONS).toContain(p.key)
      })
    })
  })

  it('ALL_PERMISSIONS matches total from modules', () => {
    const fromModules = PERMISSION_MODULES.flatMap(m => m.permissions.map(p => p.key))
    expect(new Set(fromModules).size).toBe(ALL_PERMISSIONS.length)
  })

  it('dependencies are consistent with defaults (child true implies parent true)', () => {
    Object.entries(PERMISSION_DEPENDENCIES).forEach(([child, parents]) => {
      Object.entries(DEFAULT_PERMISSIONS).forEach(([_role, perms]) => {
        if (perms[child as Permission]) {
          (parents as Permission[]).forEach(parent => {
            expect(perms[parent]).toBe(true)
          })
        }
      })
    })
  })

  it('volunteer has minimal permissions', () => {
    const vol = DEFAULT_PERMISSIONS.volunteer
    expect(vol['contacts.view']).toBe(true)
    expect(vol['contacts.create']).toBe(true)
    expect(vol['contacts.edit']).toBe(false)
    expect(vol['contacts.delete']).toBe(false)
    expect(vol['reports.view']).toBe(false)
    expect(vol['settings.campaign']).toBe(false)
  })

  it('analyst has read-heavy permissions', () => {
    const an = DEFAULT_PERMISSIONS.analyst
    expect(an['contacts.view']).toBe(true)
    expect(an['contacts.export']).toBe(true)
    expect(an['contacts.edit']).toBe(false)
    expect(an['reports.view']).toBe(true)
    expect(an['reports.export']).toBe(true)
    expect(an['team.invite']).toBe(false)
  })
})
