# Database

This folder holds the database layer for the skeleton project.

- `migrations/` is the source of truth for versioned schema changes
- `schema.sql` is only a snapshot of the current schema
- `migrate.js` provides a minimal migration CLI using `pg`
- migration files should use sequential versions such as `0001_create_users.up.sql`

## Commands

- `npm run db:migrate` or `npm run db:migrate:up`: apply pending migrations
- `npm run db:migrate:down`: roll back the latest migration
- `npm run db:migrate:down -- 2`: roll back the latest 2 migrations
- `npm run db:migrate:status`: show applied and pending migrations
- `npm run db:migrate:create -- add_posts_table`: create a new migration pair

## Notes

- migrations use `DATABASE_URL` from `.env`
- the database itself should already exist before running migrations
- each migration needs both an `.up.sql` and `.down.sql` file
