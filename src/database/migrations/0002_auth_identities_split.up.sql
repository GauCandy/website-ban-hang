CREATE TABLE IF NOT EXISTS auth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider VARCHAR(64) NOT NULL,
  provider_user_id VARCHAR(255) NOT NULL,
  provider_email VARCHAR(255),
  create_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  update_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT auth_identities_provider_user_id_key UNIQUE (provider, provider_user_id),
  CONSTRAINT auth_identities_user_provider_key UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS auth_identities_user_id_idx
ON auth_identities (user_id);

INSERT INTO auth_identities (user_id, provider, provider_user_id, provider_email)
SELECT
  id,
  'legacy_email',
  email,
  email
FROM users
WHERE email IS NOT NULL AND btrim(email) <> ''
ON CONFLICT (provider, provider_user_id) DO NOTHING;

ALTER TABLE users
DROP COLUMN IF EXISTS email;

ALTER TABLE users
DROP COLUMN IF EXISTS google_id;
