# Whitecat2

Node.js skeleton repo with:

- backend API using Express
- frontend web using a small Node static server
- PostgreSQL database schema seed structure

## Structure

```text
src/
  backend/
    config/
    controllers/
    db/
    routes/
  database/
  frontend/
    public/
```

## Scripts

- `npm run dev` starts backend and frontend together
- `npm run dev:backend` starts the API server
- `npm run dev:frontend` starts the web server
- `npm run db:migrate` applies pending database migrations
- `npm run db:migrate:status` shows migration status
- `npm run db:migrate:create -- add_table_name` creates a new migration pair

## Default ports

- API: `API_PORT`, fallback `BACKEND_PORT` or `PORT`, default `8080`
- web: `WEB_PORT`, fallback `FRONTEND_PORT`, default `3000`

## Main env names

- `WEB_URL`: public URL of the frontend
- `API_URL`: base URL the frontend uses to call the backend
- `DATABASE_URL`: PostgreSQL connection string

The code still supports older names like `FRONTEND_PORT`, `BACKEND_PORT`, `BASE_URL`, and `API_BASE_URL` as fallback, but new config should use `WEB_*` and `API_*`.

## Database versioning

Database schema changes are tracked in `src/database/migrations`. Run `npm run db:migrate` to apply pending versions to an existing PostgreSQL database.

## Backend API inventory

The backend currently exposes `10` HTTP endpoints if you count the root docs route `/`, or `9` feature endpoints if you count only `/auth/*` and `/api/*`.

### Route groups

- `/` returns a small backend status payload and the top-level docs links.
- `/auth/*` handles Google OAuth login, session lookup, and logout.
- `/api/health` exposes a simple health payload.
- `/api/products/*` exposes product listing endpoints.
- `/api/users/*` exposes current-user profile endpoints.

### Full endpoint list

| Method | Path | Auth | Description | Notes |
| --- | --- | --- | --- | --- |
| `GET` | `/` | No | Root docs/status endpoint | Returns `name`, `status`, docs links, and frontend URL |
| `GET` | `/auth/google` | No | Starts Google OAuth flow | Redirects to Google and sets an OAuth state cookie |
| `GET` | `/auth/callback` | No | Handles Google OAuth callback | Creates or updates local user, sets JWT cookie, then redirects to frontend |
| `GET` | `/auth/me` | Yes | Returns basic authenticated session info | Reads user info from `req.auth` JWT payload |
| `POST` | `/auth/logout` | No session required | Clears auth cookie and redirects to frontend | This route is subject to CSRF origin checking because it is a non-GET request |
| `GET` | `/api/health` | No | Backend health payload | Only reports whether `DATABASE_URL` exists, it does not ping the database |
| `GET` | `/api/products` | No | Lists products | Supports query params `limit`, `status`, `search` |
| `GET` | `/api/products/home` | No | Returns homepage product sections | Supports query params `limit`, `search`; always uses `active` products |
| `GET` | `/api/users/me` | Yes | Returns current logged-in user profile from DB | Reads `req.currentUser` after `requireAuth` |
| `GET` | `/api/users` | No | Placeholder users endpoint | Still a skeleton endpoint returning `items: []` |

### Route details

#### `GET /`

- Defined in `src/backend/app.js`
- Purpose: quick backend heartbeat and route discovery
- Response fields:
  - `name`
  - `status`
  - `docs.auth`
  - `docs.health`
  - `docs.products`
  - `docs.users`
  - `frontend`

#### Auth routes

##### `GET /auth/google`

- Starts the Google OAuth flow
- Requires env vars:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI`
- Sets an OAuth state cookie:
  - `__Host-whitecat_oauth_state` when running on HTTPS
  - `whitecat_oauth_state` otherwise

##### `GET /auth/callback`

- Handles `code` and `state` returned by Google
- Validates the state cookie before exchanging the code for tokens
- Fetches Google profile info from Google userinfo API
- Syncs user into local tables `users` and `auth_identities`
- Sets login cookie:
  - `__Host-whitecat_token` on HTTPS by default
  - `whitecat_token` otherwise
  - Can be overridden by `JWT_COOKIE_NAME` or `SESSION_COOKIE_NAME`
- Redirect target: frontend home page `/`

##### `GET /auth/me`

- Protected by `requireAuth`
- Response shape:

```json
{
  "authenticated": true,
  "user": {
    "id": "...",
    "email": "...",
    "name": "...",
    "provider": "google"
  }
}
```

##### `POST /auth/logout`

- Clears the auth cookie and redirects to frontend home page
- Because the app applies CSRF protection globally for non-safe methods, the request `Origin` or `Referer` must match `WEB_URL`

#### Health route

##### `GET /api/health`

- Response shape:

```json
{
  "status": "ok",
  "service": "backend",
  "timestamp": "2026-03-20T00:00:00.000Z",
  "databaseConfigured": true
}
```

- `databaseConfigured` only checks whether `DATABASE_URL` exists in env

#### Product routes

##### `GET /api/products`

- Public product listing endpoint
- Query params:
  - `limit`: default `24`, max `60`
  - `status`: default `active`; pass `all` to skip status filtering
  - `search`: matches product `name` and `short_description`
- Response shape:

```json
{
  "items": [],
  "total": 0
}
```

##### `GET /api/products/home`

- Public endpoint for homepage product blocks
- Query params:
  - `limit`: default `48`, max `60`
  - `search`: optional text filter
- Always forces `status = active`
- Response sections:
  - `hero_stats`
  - `spotlight_products`
  - `deal_products`
  - `latest_products`
  - `in_stock_products`
  - `budget_products`
  - `all_products`

#### User routes

##### `GET /api/users/me`

- Protected by `requireAuth`
- Reads the current user from the database, not only from JWT
- Response shape:

```json
{
  "user": {
    "uid": "...",
    "full_name": "...",
    "email": "...",
    "phone_number": "...",
    "gender": "...",
    "birth_date": "...",
    "avatar_url": "...",
    "role": "...",
    "account_status": "...",
    "marketing_opt_in": true,
    "last_login_at": "...",
    "created_at": "...",
    "updated_at": "..."
  }
}
```

##### `GET /api/users`

- Placeholder endpoint for future users listing
- Current response:

```json
{
  "items": [],
  "message": "Skeleton endpoint. Replace with a real database query."
}
```

### Auth and middleware notes

- CORS allows requests only when `Origin` matches `WEB_URL`, except requests without an origin header.
- `requireAuth` reads JWT from cookie and loads the full user row from the `users` table.
- If JWT is missing, invalid, expired, or the linked user no longer has an auth identity, protected endpoints return `401`.
- Global CSRF protection applies to all non-safe methods: `POST`, `PUT`, `PATCH`, `DELETE`, and any other method outside `GET`, `HEAD`, `OPTIONS`.
- Current protected endpoints:
  - `GET /auth/me`
  - `GET /api/users/me`

### Common error responses

- `401 Unauthorized`: missing or invalid login cookie on protected routes
- `403 Forbidden`: blocked by CSRF protection when request origin is not allowed
- `404 Not Found`: route does not exist
- `500 Internal Server Error`: unexpected backend exception

## Next step

Replace placeholder routes, UI blocks, and SQL schema with your real app logic. For backend work, use the API inventory above as the current source of truth for exposed routes.
