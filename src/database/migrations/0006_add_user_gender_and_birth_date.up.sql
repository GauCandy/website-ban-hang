ALTER TABLE users
ADD COLUMN IF NOT EXISTS gender VARCHAR(32),
ADD COLUMN IF NOT EXISTS birth_date DATE;

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_gender_check;

ALTER TABLE users
ADD CONSTRAINT users_gender_check CHECK (
  gender IS NULL OR gender IN ('male', 'female', 'other')
);
