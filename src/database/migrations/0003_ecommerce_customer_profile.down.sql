DROP INDEX IF EXISTS user_addresses_one_default_per_user_idx;

DROP INDEX IF EXISTS user_addresses_user_id_idx;

DROP TABLE IF EXISTS user_addresses;

DROP INDEX IF EXISTS users_email_unique_idx;

ALTER TABLE users
ADD COLUMN admin BOOLEAN NOT NULL DEFAULT FALSE,
ADD COLUMN pterodatyl BOOLEAN NOT NULL DEFAULT FALSE;

UPDATE users
SET admin = role = 'admin';

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_role_check,
DROP CONSTRAINT IF EXISTS users_account_status_check;

ALTER TABLE users
RENAME COLUMN full_name TO user_name;

ALTER TABLE users
RENAME COLUMN created_at TO create_at;

ALTER TABLE users
RENAME COLUMN store_credit_balance TO credit;

ALTER TABLE users
ALTER COLUMN credit TYPE INTEGER
USING ROUND(credit)::INTEGER;

ALTER TABLE users
ALTER COLUMN credit SET DEFAULT 0;

ALTER TABLE users
DROP COLUMN email,
DROP COLUMN phone_number,
DROP COLUMN avatar_url,
DROP COLUMN role,
DROP COLUMN account_status,
DROP COLUMN marketing_opt_in,
DROP COLUMN last_login_at,
DROP COLUMN updated_at;

ALTER TABLE auth_identities
RENAME COLUMN created_at TO create_at;

ALTER TABLE auth_identities
RENAME COLUMN updated_at TO update_at;
