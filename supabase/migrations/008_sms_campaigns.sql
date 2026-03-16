-- ─────────────────────────────────────────────────────────────────────────────
-- Migration 008 — SMS Campaigns
-- Adds sms_campaigns table for Twilio-based bulk SMS with tenant isolation.
-- Mirrors the email_campaigns structure; body is plain text only (no HTML).
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.sms_campaigns (
  id               uuid primary key default gen_random_uuid(),
  tenant_id        uuid not null references public.tenants(id) on delete cascade,
  campaign_id      uuid references public.campaigns(id) on delete set null,
  name             text not null,
  body_text        text not null,
  segment_id       uuid references public.contact_segments(id) on delete set null,
  status           text not null default 'draft'
                     check (status in ('draft', 'sent', 'failed')),
  recipient_count  integer not null default 0,
  sent_at          timestamptz,
  created_by       uuid references public.profiles(id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- Auto-update updated_at
create trigger sms_campaigns_updated_at
  before update on public.sms_campaigns
  for each row execute procedure public.handle_updated_at();

-- Indexes
create index sms_campaigns_tenant_id_idx    on public.sms_campaigns(tenant_id);
create index sms_campaigns_campaign_id_idx  on public.sms_campaigns(campaign_id);
create index sms_campaigns_status_idx       on public.sms_campaigns(status);

-- ── RLS ───────────────────────────────────────────────────────────────────────

alter table public.sms_campaigns enable row level security;

-- Tenant isolation: users see only their tenant's SMS campaigns
create policy "sms_campaigns_tenant_isolation"
  on public.sms_campaigns
  using (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);
