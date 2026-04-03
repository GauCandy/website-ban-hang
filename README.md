# WhiteCat Store

Website ban linh kien may tinh xay dung bang Node.js, Express va PostgreSQL.

## Cau truc du an

```text
src/
  backend/            # API server (Express)
    controllers/      # Xu ly logic: admin, auth, cart, products, users
    middleware/        # CSRF, auth, upload anh
    routes/           # Dinh nghia endpoints
    config/
    db/
  database/
    migrations/       # 14 migration files
    schema.sql
  frontend/           # Web server (Express static)
    public/
      index.html      # Trang chu
      search.html     # Tim kiem san pham
      product.html    # Chi tiet san pham
      cart.html       # Gio hang
      scripts/        # JS frontend (admin, cart, product-detail, ...)
      styles/         # CSS
uploads/
  products/           # Anh san pham upload
```

## Cai dat

1. Copy `.env.example` thanh `.env` va dien thong tin:
   - `DATABASE_URL` - PostgreSQL connection string
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI` - Google OAuth
   - `JWT_SECRET` - Secret cho JSON Web Token

2. Cai dependencies:
   ```bash
   npm install
   ```

3. Chay migration:
   ```bash
   npm run db:migrate
   ```

4. Chay dev:
   ```bash
   npm run dev
   ```

## Scripts

| Script | Mo ta |
| --- | --- |
| `npm run dev` | Chay backend + frontend + cloudflared tunnel |
| `npm run dev:backend` | Chay API server (co hot reload) |
| `npm run dev:frontend` | Chay web server (co hot reload) |
| `npm run db:migrate` | Ap dung migration |
| `npm run db:migrate:down` | Rollback migration |
| `npm run db:migrate:status` | Xem trang thai migration |
| `npm run db:migrate:create -- <ten>` | Tao migration moi |
| `npm start` | Chay backend (production) |
| `npm run start:frontend` | Chay frontend (production) |

## Cong mac dinh

- Frontend: `WEB_PORT` (default `8080`)
- Backend API: `API_PORT` (default `3000`)

## API Endpoints

### Auth (`/auth`)

| Method | Path | Auth | Mo ta |
| --- | --- | --- | --- |
| `GET` | `/auth/google` | No | Bat dau Google OAuth |
| `GET` | `/auth/callback` | No | Xu ly callback tu Google |
| `GET` | `/auth/me` | Yes | Lay thong tin session |
| `POST` | `/auth/logout` | No | Dang xuat |

### Products (`/api/products`)

| Method | Path | Auth | Mo ta |
| --- | --- | --- | --- |
| `GET` | `/api/products` | No | Danh sach san pham (`limit`, `status`, `search`) |
| `GET` | `/api/products/home` | No | San pham cho trang chu (featured, deals, ...) |
| `GET` | `/api/products/:slug` | No | Chi tiet san pham theo slug |

### Cart (`/api/cart`)

| Method | Path | Auth | Mo ta |
| --- | --- | --- | --- |
| `GET` | `/api/cart` | Yes | Lay gio hang |
| `POST` | `/api/cart/items` | Yes | Them san pham vao gio |
| `PATCH` | `/api/cart/items/:productId` | Yes | Cap nhat so luong |
| `DELETE` | `/api/cart/items/:productId` | Yes | Xoa san pham khoi gio |
| `DELETE` | `/api/cart` | Yes | Xoa toan bo gio hang |

### Users (`/api/users`)

| Method | Path | Auth | Mo ta |
| --- | --- | --- | --- |
| `GET` | `/api/users/me` | Yes | Thong tin user hien tai |
| `PATCH` | `/api/users/me` | Yes | Cap nhat profile |
| `GET` | `/api/users/me/address` | Yes | Lay dia chi mac dinh |
| `PUT` | `/api/users/me/address` | Yes | Tao/cap nhat dia chi mac dinh |
| `GET` | `/api/users/me/addresses` | Yes | Danh sach dia chi |
| `POST` | `/api/users/me/addresses` | Yes | Them dia chi moi |
| `PATCH` | `/api/users/me/addresses/:addressId` | Yes | Sua dia chi |
| `DELETE` | `/api/users/me/addresses/:addressId` | Yes | Xoa dia chi |
| `GET` | `/api/users` | No | Danh sach users (placeholder) |

### Admin (`/api/admin`) - Yeu cau quyen admin

| Method | Path | Mo ta |
| --- | --- | --- |
| `GET` | `/api/admin/categories` | Danh sach danh muc |
| `POST` | `/api/admin/categories` | Tao danh muc |
| `PATCH` | `/api/admin/categories/:categoryId` | Sua danh muc |
| `DELETE` | `/api/admin/categories/:categoryId` | Xoa danh muc |
| `GET` | `/api/admin/products` | Danh sach san pham (admin) |
| `POST` | `/api/admin/products` | Tao san pham (ho tro upload max 8 anh) |
| `PATCH` | `/api/admin/products/:productId` | Sua san pham |
| `DELETE` | `/api/admin/products/:productId` | Xoa san pham |

### Health

| Method | Path | Mo ta |
| --- | --- | --- |
| `GET` | `/api/health` | Trang thai backend |

## Middleware

- **CORS**: Chi chap nhan request tu `WEB_URL`
- **CSRF**: Kiem tra `Origin`/`Referer` cho tat ca non-GET requests
- **Auth**: JWT tu cookie, load user tu database
- **Admin**: Kiem tra `role === 'admin'` truoc khi truy cap admin routes
- **Upload**: Multer xu ly upload anh san pham (jpg, png, webp, gif)

## Database

14 migrations quan ly schema bao gom: users, auth_identities, products, categories, product_images, product_variants, shopping_cart, user addresses, va cac view ho tro.

## Bien moi truong

| Ten | Mo ta | Mac dinh |
| --- | --- | --- |
| `WEB_PORT` | Port frontend | `8080` |
| `WEB_URL` | URL public cua frontend | `http://localhost:8080` |
| `API_PORT` | Port backend | `3000` |
| `API_URL` | URL backend cho frontend goi | `http://localhost:3000` |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | - |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret | - |
| `GOOGLE_REDIRECT_URI` | Google OAuth redirect URI | - |
| `JWT_SECRET` | Secret key cho JWT | - |
| `JWT_COOKIE_NAME` | Ten cookie JWT | `__Host-whitecat_token` |
