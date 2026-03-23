ALTER TABLE auth_identities
RENAME COLUMN create_at TO created_at;

ALTER TABLE auth_identities
RENAME COLUMN update_at TO updated_at;

ALTER TABLE users
RENAME COLUMN user_name TO full_name;

ALTER TABLE users
RENAME COLUMN create_at TO created_at;

ALTER TABLE users
RENAME COLUMN credit TO store_credit_balance;

ALTER TABLE users
ALTER COLUMN store_credit_balance TYPE NUMERIC(12, 2)
USING COALESCE(store_credit_balance, 0)::NUMERIC(12, 2);

ALTER TABLE users
ADD COLUMN email VARCHAR(255),
ADD COLUMN phone_number VARCHAR(32),
ADD COLUMN avatar_url TEXT,
ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'customer',
ADD COLUMN account_status VARCHAR(32) NOT NULL DEFAULT 'active',
ADD COLUMN marketing_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN last_login_at TIMESTAMPTZ,
ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

WITH identity_source AS (
  SELECT DISTINCT ON (user_id)
    user_id,
    provider,
    provider_user_id,
    provider_email
  FROM auth_identities
  ORDER BY
    user_id,
    CASE
      WHEN provider = 'google' THEN 0
      WHEN provider = 'legacy_email' THEN 1
      ELSE 2
    END,
    created_at ASC
)
UPDATE users u
SET email = COALESCE(
  identity_source.provider_email,
  CASE
    WHEN identity_source.provider = 'legacy_email' THEN identity_source.provider_user_id
    ELSE NULL
  END
)
FROM identity_source
WHERE u.id = identity_source.user_id
  AND (u.email IS NULL OR btrim(u.email) = '');

UPDATE users
SET email = concat(id::text, '@placeholder.local')
WHERE email IS NULL OR btrim(email) = '';

WITH duplicate_emails AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY lower(email) ORDER BY created_at ASC, id ASC) AS email_rank
  FROM users
)
UPDATE users u
SET email = concat(u.id::text, '@placeholder.local')
FROM duplicate_emails
WHERE u.id = duplicate_emails.id
  AND duplicate_emails.email_rank > 1;

UPDATE users
SET role = CASE
  WHEN admin THEN 'admin'
  ELSE 'customer'
END;

UPDATE users
SET updated_at = created_at
WHERE updated_at IS NULL;

ALTER TABLE users
ALTER COLUMN email SET NOT NULL;

CREATE UNIQUE INDEX users_email_unique_idx
ON users (lower(email));

ALTER TABLE users
ADD CONSTRAINT users_role_check CHECK (role IN ('customer', 'admin')),
ADD CONSTRAINT users_account_status_check CHECK (
  account_status IN ('active', 'inactive', 'blocked')
);

ALTER TABLE users
DROP COLUMN admin,
DROP COLUMN pterodatyl;

CREATE TABLE user_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL DEFAULT 'Home',
  recipient_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(32) NOT NULL,
  country_code VARCHAR(2) NOT NULL DEFAULT 'VN',
  state_or_province VARCHAR(120) NOT NULL,
  district VARCHAR(120),
  ward VARCHAR(120),
  address_line_1 VARCHAR(255) NOT NULL,
  address_line_2 VARCHAR(255),
  postal_code VARCHAR(32),
  delivery_notes TEXT,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX user_addresses_user_id_idx
ON user_addresses (user_id);

CREATE UNIQUE INDEX user_addresses_one_default_per_user_idx
ON user_addresses (user_id)
WHERE is_default;
