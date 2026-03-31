UPDATE users
SET gender = NULL
WHERE gender IS NOT NULL
  AND gender NOT IN ('male', 'female');

ALTER TABLE users
DROP CONSTRAINT IF EXISTS users_gender_check;

ALTER TABLE users
ADD CONSTRAINT users_gender_check CHECK (
  gender IS NULL OR gender IN ('male', 'female')
);
