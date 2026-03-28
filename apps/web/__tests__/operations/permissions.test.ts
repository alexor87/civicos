import { describe, it, expect } from 'vitest'
import {
  ALL_PERMISSIONS,
  PERMISSION_MODULES,
  DEFAULT_PERMISSIONS,
  PERMISSION_DEPENDENCIES,
} from '@/lib/permissions'

const OPERATIONS_PERMISSIONS = [
  'operations.view',
  'operations.create_tasks',
  'operations.create_missions',
  'operations.assign_any',
  'operations.assign_team',
  'operations.manage_all',
] as const

// ── All 6 operations permissions exist in ALL_PERMISSIONS ───────────────────

describe('Operations permissions in ALL_PERMISSIONS', () => {
  it.each(OPERATIONS_PERMISSIONS)(
    '%s exists in ALL_PERMISSIONS',
    (permission) => {
      expect(ALL_PERMISSIONS).toContain(permission)
    }
  )

  it('there are exactly 6 operations permissions', () => {
    const ops = ALL_PERMISSIONS.filter(p => p.startsWith('operations.'))
    expect(ops).toHaveLength(6)
  })
})

// ── Operations module in PERMISSION_MODULES ─────────────────────────────────

describe('Operations module in PERMISSION_MODULES', () => {
  it('operations module exists', () => {
    const mod = PERMISSION_MODULES.find(m => m.key === 'operations')
    expect(mod).toBeDefined()
    expect(mod!.name).toBe('Operaciones')
  })

  it('operations module has exactly 6 permissions', () => {
    const mod = PERMISSION_MODULES.find(m => m.key === 'operations')!
    expect(mod.permissions).toHaveLength(6)
  })

  it('operations module contains the correct permission keys', () => {
    const mod = PERMISSION_MODULES.find(m => m.key === 'operations')!
    const keys = mod.permissions.map(p => p.key)
    for (const perm of OPERATIONS_PERMISSIONS) {
      expect(keys).toContain(perm)
    }
  })
})

// ── super_admin has all 6 = true ────────────────────────────────────────────

describe('super_admin operations permissions', () => {
  it('has all 6 operations permissions set to true', () => {
    const perms = DEFAULT_PERMISSIONS.super_admin
    for (const perm of OPERATIONS_PERMISSIONS) {
      expect(perms[perm]).toBe(true)
    }
  })
})

// ── campaign_manager has all 6 = true ───────────────────────────────────────

describe('campaign_manager operations permissions', () => {
  it('has all 6 operations permissions set to true', () => {
    const perms = DEFAULT_PERMISSIONS.campaign_manager
    for (const perm of OPERATIONS_PERMISSIONS) {
      expect(perms[perm]).toBe(true)
    }
  })
})

// ── field_coordinator: view, create_tasks, create_missions, assign_team = true; assign_any and manage_all = false ──

describe('field_coordinator operations permissions', () => {
  it('has operations.view = true', () => {
    expect(DEFAULT_PERMISSIONS.field_coordinator['operations.view']).toBe(true)
  })

  it('has operations.create_tasks = true', () => {
    expect(DEFAULT_PERMISSIONS.field_coordinator['operations.create_tasks']).toBe(true)
  })

  it('has operations.create_missions = true', () => {
    expect(DEFAULT_PERMISSIONS.field_coordinator['operations.create_missions']).toBe(true)
  })

  it('has operations.assign_team = true', () => {
    expect(DEFAULT_PERMISSIONS.field_coordinator['operations.assign_team']).toBe(true)
  })

  it('has operations.assign_any = false', () => {
    expect(DEFAULT_PERMISSIONS.field_coordinator['operations.assign_any']).toBe(false)
  })

  it('has operations.manage_all = false', () => {
    expect(DEFAULT_PERMISSIONS.field_coordinator['operations.manage_all']).toBe(false)
  })
})

// ── volunteer: view and create_tasks = true; rest = false ───────────────────

describe('volunteer operations permissions', () => {
  it('has operations.view = true', () => {
    expect(DEFAULT_PERMISSIONS.volunteer['operations.view']).toBe(true)
  })

  it('has operations.create_tasks = true', () => {
    expect(DEFAULT_PERMISSIONS.volunteer['operations.create_tasks']).toBe(true)
  })

  it('has operations.create_missions = false', () => {
    expect(DEFAULT_PERMISSIONS.volunteer['operations.create_missions']).toBe(false)
  })

  it('has operations.assign_any = false', () => {
    expect(DEFAULT_PERMISSIONS.volunteer['operations.assign_any']).toBe(false)
  })

  it('has operations.assign_team = false', () => {
    expect(DEFAULT_PERMISSIONS.volunteer['operations.assign_team']).toBe(false)
  })

  it('has operations.manage_all = false', () => {
    expect(DEFAULT_PERMISSIONS.volunteer['operations.manage_all']).toBe(false)
  })
})

// ── analyst: view = true; rest = false ──────────────────────────────────────

describe('analyst operations permissions', () => {
  it('has operations.view = true', () => {
    expect(DEFAULT_PERMISSIONS.analyst['operations.view']).toBe(true)
  })

  it('has operations.create_tasks = false', () => {
    expect(DEFAULT_PERMISSIONS.analyst['operations.create_tasks']).toBe(false)
  })

  it('has operations.create_missions = false', () => {
    expect(DEFAULT_PERMISSIONS.analyst['operations.create_missions']).toBe(false)
  })

  it('has operations.assign_any = false', () => {
    expect(DEFAULT_PERMISSIONS.analyst['operations.assign_any']).toBe(false)
  })

  it('has operations.assign_team = false', () => {
    expect(DEFAULT_PERMISSIONS.analyst['operations.assign_team']).toBe(false)
  })

  it('has operations.manage_all = false', () => {
    expect(DEFAULT_PERMISSIONS.analyst['operations.manage_all']).toBe(false)
  })
})

// ── Permission dependencies ─────────────────────────────────────────────────

describe('Operations permission dependencies', () => {
  it('create_tasks requires view', () => {
    expect(PERMISSION_DEPENDENCIES['operations.create_tasks']).toContain('operations.view')
  })

  it('create_missions requires view', () => {
    expect(PERMISSION_DEPENDENCIES['operations.create_missions']).toContain('operations.view')
  })

  it('assign_any requires create_tasks', () => {
    expect(PERMISSION_DEPENDENCIES['operations.assign_any']).toContain('operations.create_tasks')
  })

  it('assign_team requires create_tasks', () => {
    expect(PERMISSION_DEPENDENCIES['operations.assign_team']).toContain('operations.create_tasks')
  })

  it('manage_all requires view', () => {
    expect(PERMISSION_DEPENDENCIES['operations.manage_all']).toContain('operations.view')
  })
})
