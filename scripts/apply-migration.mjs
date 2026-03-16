#!/usr/bin/env node
/**
 * Applies migration 012_journeys.sql to the remote Supabase project.
 *
 * Usage:
 *   DB_PASSWORD=<tu-password> node scripts/apply-migration.mjs
 *
 * Where encontrar tu DB password:
 *   Supabase Dashboard → Project Settings → Database → Connection string
 *   (el campo [YOUR-PASSWORD] en la URI)
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import postgres from 'postgres'

const __dirname = dirname(fileURLToPath(import.meta.url))

const DB_PASSWORD = process.env.DB_PASSWORD

if (!DB_PASSWORD) {
  console.error('\n❌  DB_PASSWORD is required.\n')
  console.error('   1. Abre: https://supabase.com/dashboard/project/hugufyyhiiqwbxvxbinm/settings/database')
  console.error('   2. Copia el campo "Database password" (o usa Connection String → URI)')
  console.error('   3. Ejecuta: DB_PASSWORD="<password>" node scripts/apply-migration.mjs\n')
  process.exit(1)
}

const sql = postgres({
  host:     'db.hugufyyhiiqwbxvxbinm.supabase.co',
  port:     5432,
  database: 'postgres',
  username: 'postgres',
  password: DB_PASSWORD,
  ssl:      'require',
})

const migrationPath = join(__dirname, '../supabase/migrations/014_journey_runner_cron.sql')
const migrationSQL  = readFileSync(migrationPath, 'utf-8')

console.log('🚀  Applying migration 014_journey_runner_cron.sql...\n')

try {
  await sql.unsafe(migrationSQL)
  console.log('✅  Migration applied successfully! pg_cron job "journey-runner" scheduled every minute.')
} catch (err) {
  if (err.message?.includes('already exists')) {
    console.log('ℹ️   Tables already exist — migration skipped.')
  } else {
    console.error('❌  Migration failed:', err.message)
    process.exit(1)
  }
} finally {
  await sql.end()
}
