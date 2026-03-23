ALTER TABLE users
ADD COLUMN IF NOT EXISTS email VARCHAR(255);

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
    create_at ASC
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
WHERE u.id = identity_source.user_id;

UPDATE users
SET email = concat(id::text, '@placeholder.local')
WHERE email IS NULL OR btrim(email) = '';

ALTER TABLE users
ALTER COLUMN email SET NOT NULL;

DROP TABLE IF EXISTS auth_identities;
