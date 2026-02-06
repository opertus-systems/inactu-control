CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'owner_kind') THEN
        CREATE TYPE owner_kind AS ENUM ('user', 'org');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'package_visibility') THEN
        CREATE TYPE package_visibility AS ENUM ('private', 'public');
    END IF;
END
$$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'context_status') THEN
        CREATE TYPE context_status AS ENUM ('starting', 'running', 'stopped', 'failed');
    END IF;
END
$$;

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    email text NOT NULL UNIQUE,
    password_hash text NOT NULL,
    email_verified_at timestamptz,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS organizations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug text NOT NULL UNIQUE,
    display_name text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS owners (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    kind owner_kind NOT NULL,
    user_id uuid UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    organization_id uuid UNIQUE REFERENCES organizations (id) ON DELETE CASCADE,
    created_at timestamptz NOT NULL DEFAULT now(),
    CHECK (
        (kind = 'user' AND user_id IS NOT NULL AND organization_id IS NULL) OR
        (kind = 'org' AND organization_id IS NOT NULL AND user_id IS NULL)
    )
);

CREATE TABLE IF NOT EXISTS organization_members (
    organization_id uuid NOT NULL REFERENCES organizations (id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    role text NOT NULL CHECK (role IN ('owner', 'admin', 'member')),
    created_at timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (organization_id, user_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    session_token_hash text NOT NULL UNIQUE,
    expires_at timestamptz NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    revoked_at timestamptz
);

CREATE TABLE IF NOT EXISTS packages (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES owners (id) ON DELETE CASCADE,
    name text NOT NULL,
    visibility package_visibility NOT NULL DEFAULT 'private',
    description text,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),
    UNIQUE (owner_id, name)
);

CREATE TABLE IF NOT EXISTS package_versions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    package_id uuid NOT NULL REFERENCES packages (id) ON DELETE CASCADE,
    version text NOT NULL,
    artifact_digest text NOT NULL,
    manifest_json jsonb NOT NULL,
    published_by_user_id uuid NOT NULL REFERENCES users (id),
    published_at timestamptz NOT NULL DEFAULT now(),
    deprecated_at timestamptz,
    UNIQUE (package_id, version)
);

CREATE TABLE IF NOT EXISTS contexts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id uuid NOT NULL REFERENCES owners (id) ON DELETE CASCADE,
    package_version_id uuid REFERENCES package_versions (id) ON DELETE SET NULL,
    status context_status NOT NULL,
    region text NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz
);

CREATE TABLE IF NOT EXISTS context_logs (
    id bigserial PRIMARY KEY,
    context_id uuid NOT NULL REFERENCES contexts (id) ON DELETE CASCADE,
    ts timestamptz NOT NULL DEFAULT now(),
    severity text NOT NULL,
    message text NOT NULL,
    metadata_json jsonb
);

CREATE INDEX IF NOT EXISTS idx_context_logs_context_ts ON context_logs (context_id, ts);
CREATE INDEX IF NOT EXISTS idx_context_logs_context_severity ON context_logs (context_id, severity);
