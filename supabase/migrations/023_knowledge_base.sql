-- ── Knowledge Base Semántica ──────────────────────────────────────────────────
-- Migration 023: Document storage with pgvector embeddings for semantic search

-- Enable vector extension (idempotent)
CREATE EXTENSION IF NOT EXISTS "vector";

-- Metadata table: one row per uploaded document
CREATE TABLE IF NOT EXISTS knowledge_document_meta (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id    UUID NOT NULL,
  campaign_id  UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  file_path    TEXT,
  file_type    TEXT CHECK (file_type IN ('pdf', 'txt', 'docx', 'md')),
  total_chunks INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,
  created_by   UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Documents table: one row per text chunk with its embedding
CREATE TABLE IF NOT EXISTS knowledge_documents (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID NOT NULL,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  meta_id     UUID REFERENCES knowledge_document_meta(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  content     TEXT NOT NULL,
  file_path   TEXT,
  file_type   TEXT CHECK (file_type IN ('pdf', 'txt', 'docx', 'md')),
  chunk_index INTEGER NOT NULL DEFAULT 0,
  embedding   VECTOR(1536),
  token_count INTEGER,
  created_by  UUID REFERENCES profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- HNSW index for fast approximate nearest-neighbor search
CREATE INDEX IF NOT EXISTS knowledge_documents_embedding_idx
  ON knowledge_documents USING hnsw (embedding vector_cosine_ops)
  WITH (m=16, ef_construction=64);

-- Full-text search index (Spanish)
CREATE INDEX IF NOT EXISTS knowledge_documents_fts
  ON knowledge_documents USING GIN(to_tsvector('spanish', title || ' ' || content));

-- RLS
ALTER TABLE knowledge_document_meta ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents     ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tenant_isolation" ON knowledge_document_meta
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

CREATE POLICY "tenant_isolation" ON knowledge_documents
  USING (tenant_id = (auth.jwt() ->> 'tenant_id')::uuid);

-- Additional indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_meta_campaign
  ON knowledge_document_meta(tenant_id, campaign_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_campaign
  ON knowledge_documents(tenant_id, campaign_id);

CREATE INDEX IF NOT EXISTS idx_knowledge_documents_meta
  ON knowledge_documents(meta_id);

-- Semantic search function
CREATE OR REPLACE FUNCTION match_knowledge_documents(
  query_embedding  VECTOR(1536),
  p_campaign_id    UUID,
  p_tenant_id      UUID,
  match_threshold  FLOAT DEFAULT 0.5,
  match_count      INT   DEFAULT 5
)
RETURNS TABLE (
  id         UUID,
  title      TEXT,
  content    TEXT,
  similarity FLOAT
)
LANGUAGE SQL STABLE
AS $$
  SELECT
    id,
    title,
    content,
    1 - (embedding <=> query_embedding) AS similarity
  FROM knowledge_documents
  WHERE campaign_id = p_campaign_id
    AND tenant_id   = p_tenant_id
    AND embedding   IS NOT NULL
    AND 1 - (embedding <=> query_embedding) > match_threshold
  ORDER BY embedding <=> query_embedding
  LIMIT match_count;
$$;
