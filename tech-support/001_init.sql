-- Migracja bazy danych
-- Uruchom: psql $DATABASE_URL -f migrations/001_init.sql

BEGIN;

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── Tabela: uploads ─────────────────────────────────────────────────────────
-- Reprezentuje jeden "zestaw" plików przesłany przez klienta.
-- status FSM: pending → uploading → completed | partial | failed
CREATE TABLE IF NOT EXISTS uploads (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name      VARCHAR(200) NOT NULL,
  email            VARCHAR(320) NOT NULL,
  description      TEXT,
  status           VARCHAR(20)  NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending','uploading','completed','partial','failed')),
  idempotency_key  UUID UNIQUE,                    -- bezpieczne retry
  completed_at     TIMESTAMPTZ,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_uploads_created_at ON uploads (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_uploads_email       ON uploads (email);
CREATE INDEX IF NOT EXISTS idx_uploads_status      ON uploads (status);

-- ─── Tabela: files ───────────────────────────────────────────────────────────
-- Każdy plik w ramach uploadu.
-- status FSM: pending → completed | failed
CREATE TABLE IF NOT EXISTS files (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  upload_id   UUID NOT NULL REFERENCES uploads (id) ON DELETE CASCADE,
  file_name   VARCHAR(512) NOT NULL,
  s3_key      VARCHAR(1024) NOT NULL,
  size        BIGINT NOT NULL CHECK (size > 0),
  mime_type   VARCHAR(128) NOT NULL,
  status      VARCHAR(20)  NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending','completed','failed')),
  error_msg   TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_files_upload_id ON files (upload_id);

-- ─── Trigger: updated_at auto-update ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DROP TRIGGER IF EXISTS uploads_updated_at ON uploads;
CREATE TRIGGER uploads_updated_at
  BEFORE UPDATE ON uploads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
