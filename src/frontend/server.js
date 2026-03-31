const http = require("http");
const https = require("https");
const fs = require("fs");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });

const frontendPort = Number(process.env.WEB_PORT || process.env.FRONTEND_PORT || 3000);
const backendPort = Number(
  process.env.API_PORT || process.env.BACKEND_PORT || process.env.PORT || 8080
);
const webUrl = process.env.WEB_URL || process.env.BASE_URL || `http://localhost:${frontendPort}`;
const secureCookies = webUrl.startsWith("https://");
const authCookieName =
  process.env.JWT_COOKIE_NAME ||
  process.env.SESSION_COOKIE_NAME ||
  (secureCookies ? "__Host-whitecat_token" : "whitecat_token");
const apiBaseUrl =
  process.env.API_URL || process.env.API_BASE_URL || `http://localhost:${backendPort}`;
const publicDir = path.resolve(__dirname, "public");
const storefrontPath = path.resolve(publicDir, "index.html");
const accountProfilePath = path.resolve(publicDir, "user", "account", "profile.html");
const accountAddressPath = path.resolve(publicDir, "user", "account", "address.html");
const adminDashboardPath = path.resolve(publicDir, "admin", "index.html");
const headTemplatePath = path.resolve(publicDir, "partials", "head.html");
const SITE_HEADER_TOKEN = "__SITE_HEADER__";
const ACCOUNT_CONTROL_TOKEN = "__ACCOUNT_CONTROL__";
const ACCOUNT_PROFILE_CONTENT_TOKEN = "__ACCOUNT_PROFILE_CONTENT__";
const ACCOUNT_LOOKUP_TIMEOUT_MS = 1500;
const APP_SHELL_ROUTES = new Set([
  "/",
  "/index.html",
  "/cart",
  "/cart/",
  "/user/purchase",
  "/user/purchase/"
]);
const ACCOUNT_PROFILE_ROUTES = new Set([
  "/user/account/profile"
]);
const ACCOUNT_ADDRESS_ROUTES = new Set([
  "/user/account/address"
]);
const ADMIN_ROUTES = new Set([
  "/admin",
  "/admin/categories",
  "/admin/products"
]);
const ACCOUNT_ROUTE_REDIRECTS = new Map([
  ["/user/account", "/user/account/profile"],
  ["/user/account/", "/user/account/profile"],
  ["/user/account/profile/", "/user/account/profile"],
  ["/user/account/address/", "/user/account/address"],
  ["/admin/", "/admin"],
  ["/admin/categories/", "/admin/categories"],
  ["/admin/products/", "/admin/products"]
]);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

function writeResponse(
  res,
  statusCode,
  body,
  contentType = "text/plain; charset=utf-8",
  headers = {}
) {
  res.writeHead(statusCode, {
    "Content-Type": contentType,
    ...headers
  });
  res.end(body);
}

function buildStaticHeaders(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".html" || extension === ".css" || extension === ".js") {
    return {
      "Cache-Control": "no-store"
    };
  }

  return {};
}

function redirect(res, location, headers = {}) {
  res.writeHead(302, {
    Location: location,
    ...headers
  });
  res.end();
}

function serveFile(res, filePath, headers = {}) {
  fs.readFile(filePath, (error, file) => {
    if (error) {
      writeResponse(res, 500, "Internal server error");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();
    writeResponse(
      res,
      200,
      file,
      contentTypes[extension] || "application/octet-stream",
      {
        ...buildStaticHeaders(filePath),
        ...headers
      }
    );
  });
}

function proxyRequest(req, res, targetUrl) {
  const transport = targetUrl.protocol === "https:" ? https : http;
  const upstreamRequest = transport.request(
    targetUrl,
    {
      method: req.method,
      headers: {
        ...req.headers,
        host: targetUrl.host
      }
    },
    (upstreamResponse) => {
      res.writeHead(upstreamResponse.statusCode || 502, upstreamResponse.headers);
      upstreamResponse.pipe(res);
    }
  );

  upstreamRequest.on("error", () => {
    writeResponse(res, 502, "Bad gateway");
  });

  req.pipe(upstreamRequest);
}

function isStorefrontRequest(pathname) {
  return APP_SHELL_ROUTES.has(pathname);
}

function isAccountProfileRequest(pathname) {
  return ACCOUNT_PROFILE_ROUTES.has(pathname);
}

function isAccountAddressRequest(pathname) {
  return ACCOUNT_ADDRESS_ROUTES.has(pathname);
}

function isAdminRequest(pathname) {
  return ADMIN_ROUTES.has(pathname);
}

function getRouteRedirect(pathname) {
  return ACCOUNT_ROUTE_REDIRECTS.get(pathname) || null;
}

function isLegacyStoreRequest(pathname) {
  return (
    pathname === "/home" ||
    pathname === "/home/" ||
    pathname === "/home.html" ||
    pathname === "/login" ||
    pathname === "/login/" ||
    pathname === "/login.html"
  );
}

function resolveFilePath(requestedPath) {
  const candidates = requestedPath === "/" ? ["/index.html"] : [requestedPath];

  if (!path.extname(requestedPath)) {
    if (requestedPath.endsWith("/") && requestedPath !== "/") {
      candidates.push(`${requestedPath.slice(0, -1)}.html`);
    }

    candidates.push(`${requestedPath}.html`);
    candidates.push(path.posix.join(requestedPath, "index.html"));
  }

  for (const candidate of candidates) {
    const filePath = path.resolve(publicDir, `.${candidate}`);
    const relativePath = path.relative(publicDir, filePath);

    if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
      return null;
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      return filePath;
    }
  }

  return null;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => {
    switch (character) {
      case "&":
        return "&amp;";
      case "<":
        return "&lt;";
      case ">":
        return "&gt;";
      case '"':
        return "&quot;";
      case "'":
        return "&#39;";
      default:
        return character;
    }
  });
}

function hasAuthCookie(cookieHeader = "") {
  return cookieHeader
    .split(";")
    .map((part) => part.trim())
    .some((part) => part.startsWith(`${authCookieName}=`));
}

function getDisplayName(user) {
  return user?.full_name || user?.email || "Tài khoản";
}

function getInitials(name) {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "TK";
}

function isAdminUser(user) {
  return String(user?.role || "")
    .trim()
    .toLowerCase() === "admin";
}

function buildGuestAccountControl() {
  return [
    '<a class="account-link account-link--guest" href="/auth/google" aria-label="Đăng ký hoặc đăng nhập" title="Đăng ký hoặc đăng nhập">',
    '  <span class="account-text">Đăng ký / Đăng nhập</span>',
    '  <span class="account-avatar-shell" aria-hidden="true">',
    '    <img class="account-avatar-image" alt="" hidden />',
    '    <span class="account-avatar-fallback" hidden></span>',
    "  </span>",
    "</a>"
  ].join("\n");
}

function buildAuthenticatedAccountControl(user) {
  const displayName = escapeHtml(getDisplayName(user));
  const initials = escapeHtml(getInitials(getDisplayName(user)));
  const avatarUrl = user?.avatar_url ? escapeHtml(user.avatar_url) : "";
  const avatarMarkup = avatarUrl
    ? [
        `    <span class="account-avatar-fallback">${initials}</span>`,
        `    <img class="account-avatar-image" src="${avatarUrl}" alt="" referrerpolicy="no-referrer" decoding="async" fetchpriority="high" onerror="this.style.display='none'" />`
      ].join("\n")
    : `<span class="account-avatar-fallback">${initials}</span>`;

  const adminItem = isAdminUser(user)
    ? '    <a class="account-dropdown-link" href="/admin" role="menuitem">Trang quản trị</a>'
    : "";

  return [
    '<div class="account-menu" data-account-menu data-open="false">',
    `  <button class="account-link account-link--authenticated account-toggle" type="button" aria-haspopup="menu" aria-expanded="false" aria-label="Mở menu tài khoản ${displayName}" title="${displayName}" data-account-toggle>`,
    `    <span class="account-name" title="${displayName}">${displayName}</span>`,
    '    <span class="account-avatar-shell" aria-hidden="true">',
    `      ${avatarMarkup}`,
    "    </span>",
    "  </button>",
    '  <div class="account-dropdown" role="menu" aria-label="Menu tài khoản">',
    '    <a class="account-dropdown-link" href="/user/account/profile" role="menuitem">Tài khoản của tôi</a>',
    '    <a class="account-dropdown-link" href="/cart" role="menuitem">Giỏ hàng</a>',
    '    <a class="account-dropdown-link" href="/user/purchase/" role="menuitem">Đơn mua</a>',
    adminItem,
    '    <form class="account-dropdown-form" method="post" action="/auth/logout">',
      '      <button class="account-dropdown-action account-dropdown-action--danger" type="submit">Đăng xuất</button>',
    "    </form>",
    "  </div>",
    "</div>"
  ]
    .filter(Boolean)
    .join("\n");
}

function renderSiteHeader(template, user) {
  const accountControl = user ? buildAuthenticatedAccountControl(user) : buildGuestAccountControl();
  return template.replace(ACCOUNT_CONTROL_TOKEN, accountControl);
}

function renderStorefront(template, headTemplate, user) {
  return template.replace(SITE_HEADER_TOKEN, renderSiteHeader(headTemplate, user));
}

function formatDateTime(value) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
}

function formatDateOnly(value) {
  if (!value) {
    return "Chưa cập nhật";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Chưa cập nhật";
  }

  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium"
  }).format(date);
}

function getRoleLabel(role) {
  return String(role || "").toLowerCase() === "admin" ? "Quản trị viên" : "Khách hàng";
}

function getGenderLabel(gender) {
  switch (String(gender || "").toLowerCase()) {
    case "male":
      return "Nam";
    case "female":
      return "Nữ";
    case "other":
      return "Khác";
    default:
      return "Chưa cập nhật";
  }
}

function getStatusLabel(status) {
  switch (String(status || "").toLowerCase()) {
    case "active":
      return "Đang hoạt động";
    case "inactive":
      return "Chưa kích hoạt";
    case "blocked":
      return "Đã khóa";
    default:
      return "Chưa cập nhật";
  }
}

function getSafeText(value, fallback = "Chưa cập nhật") {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  return escapeHtml(value);
}

function buildProfileAvatar(user) {
  const displayName = escapeHtml(getDisplayName(user));
  const initials = escapeHtml(getInitials(getDisplayName(user)));
  const avatarUrl = user?.avatar_url ? escapeHtml(user.avatar_url) : "";

  if (!avatarUrl) {
    return initials;
  }

  return `<img src="${avatarUrl}" alt="${displayName}" referrerpolicy="no-referrer" decoding="async" />`;
}

function buildAccountProfileContent(user) {
  if (!user) {
    return [
      '<div class="profile-panel profile-empty">',
      '  <p class="profile-eyebrow">Tài khoản</p>',
      '  <h1 class="profile-empty-title">Bạn chưa đăng nhập</h1>',
      '  <p class="profile-empty-copy">Vui lòng đăng nhập để xem và quản lý thông tin profile của bạn.</p>',
      '  <a class="profile-login-link" href="/auth/google">Đăng nhập với Google</a>',
      "</div>"
    ].join("\n");
  }

  const displayName = escapeHtml(getDisplayName(user));
  const email = getSafeText(user.email);
  const phoneNumber = getSafeText(user.phone_number);
  const genderLabel = escapeHtml(getGenderLabel(user.gender));
  const birthDate = escapeHtml(formatDateOnly(user.birth_date));
  const roleLabel = escapeHtml(getRoleLabel(user.role));
  const statusLabel = escapeHtml(getStatusLabel(user.account_status));
  const lastLoginAt = escapeHtml(formatDateTime(user.last_login_at));

  return [
    '<div class="profile-panel">',
    '  <div class="profile-panel-header">',
    '    <div class="profile-title-wrap">',
    '      <p class="profile-eyebrow">Tài khoản</p>',
    '      <h1 class="profile-title">Profile</h1>',
    `      <p class="profile-subtitle">${displayName}</p>`,
    "    </div>",
    `    <div class="profile-avatar" aria-hidden="true">${buildProfileAvatar(user)}</div>`,
    "  </div>",
    '  <div class="profile-grid">',
    '    <article class="profile-stat">',
    '      <p class="profile-stat-label">Họ và tên</p>',
    `      <p class="profile-stat-value">${displayName}</p>`,
    "    </article>",
    '    <article class="profile-stat">',
    '      <p class="profile-stat-label">Email</p>',
    `      <p class="profile-stat-value">${email}</p>`,
    "    </article>",
    '    <article class="profile-stat">',
    '      <p class="profile-stat-label">Số điện thoại</p>',
    `      <p class="profile-stat-value">${phoneNumber}</p>`,
    "    </article>",
    '    <article class="profile-stat">',
    '      <p class="profile-stat-label">Giới tính</p>',
    `      <p class="profile-stat-value">${genderLabel}</p>`,
    "    </article>",
    '    <article class="profile-stat">',
    '      <p class="profile-stat-label">Ngày sinh</p>',
    `      <p class="profile-stat-value">${birthDate}</p>`,
    "    </article>",
    '    <article class="profile-stat">',
    '      <p class="profile-stat-label">Vai trò</p>',
    `      <p class="profile-stat-value">${roleLabel}</p>`,
    "    </article>",
    '    <article class="profile-stat">',
    '      <p class="profile-stat-label">Trạng thái</p>',
    `      <p class="profile-stat-value">${statusLabel}</p>`,
    "    </article>",
    '    <article class="profile-stat">',
    '      <p class="profile-stat-label">Lần đăng nhập gần nhất</p>',
    `      <p class="profile-stat-value">${lastLoginAt}</p>`,
    "    </article>",
    "  </div>",
    "</div>"
  ].join("\n");
}

function renderAccountProfile(template, headTemplate, user) {
  return template
    .replace(SITE_HEADER_TOKEN, renderSiteHeader(headTemplate, user))
    .replace(ACCOUNT_PROFILE_CONTENT_TOKEN, buildAccountProfileContent(user));
}

function renderAccountShell(template, headTemplate, user) {
  return template.replace(SITE_HEADER_TOKEN, renderSiteHeader(headTemplate, user));
}

async function fetchCurrentUser(cookieHeader = "") {
  if (!cookieHeader || !hasAuthCookie(cookieHeader)) {
    return null;
  }

  try {
    const response = await fetch(new URL("/api/users/me", apiBaseUrl), {
      headers: {
        Accept: "application/json",
        Cookie: cookieHeader
      },
      signal: AbortSignal.timeout(ACCOUNT_LOOKUP_TIMEOUT_MS)
    });

    if (!response.ok) {
      return null;
    }

    const payload = await response.json().catch(() => null);
    return payload?.user || null;
  } catch (_error) {
    return null;
  }
}

async function serveStorefront(req, res) {
  try {
    const [template, headTemplate, user] = await Promise.all([
      fs.promises.readFile(storefrontPath, "utf8"),
      fs.promises.readFile(headTemplatePath, "utf8"),
      fetchCurrentUser(req.headers.cookie || "")
    ]);

    writeResponse(
      res,
      200,
      renderStorefront(template, headTemplate, user),
      contentTypes[".html"],
      buildStaticHeaders(storefrontPath)
    );
  } catch (_error) {
    writeResponse(res, 500, "Internal server error");
  }
}

async function serveAccountProfile(req, res) {
  try {
    const [template, headTemplate, user] = await Promise.all([
      fs.promises.readFile(accountProfilePath, "utf8"),
      fs.promises.readFile(headTemplatePath, "utf8"),
      fetchCurrentUser(req.headers.cookie || "")
    ]);

    writeResponse(
      res,
      200,
      renderAccountProfile(template, headTemplate, user),
      contentTypes[".html"],
      buildStaticHeaders(accountProfilePath)
    );
  } catch (_error) {
    writeResponse(res, 500, "Internal server error");
  }
}

async function serveAccountAddress(req, res) {
  try {
    const [template, headTemplate, user] = await Promise.all([
      fs.promises.readFile(accountAddressPath, "utf8"),
      fs.promises.readFile(headTemplatePath, "utf8"),
      fetchCurrentUser(req.headers.cookie || "")
    ]);

    writeResponse(
      res,
      200,
      renderAccountShell(template, headTemplate, user),
      contentTypes[".html"],
      buildStaticHeaders(accountAddressPath)
    );
  } catch (_error) {
    writeResponse(res, 500, "Internal server error");
  }
}

async function serveAdminDashboard(req, res) {
  try {
    const [template, headTemplate, user] = await Promise.all([
      fs.promises.readFile(adminDashboardPath, "utf8"),
      fs.promises.readFile(headTemplatePath, "utf8"),
      fetchCurrentUser(req.headers.cookie || "")
    ]);

    writeResponse(
      res,
      200,
      renderAccountShell(template, headTemplate, user),
      contentTypes[".html"],
      buildStaticHeaders(adminDashboardPath)
    );
  } catch (_error) {
    writeResponse(res, 500, "Internal server error");
  }
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/config.js") {
    writeResponse(
      res,
      200,
      `window.__APP_CONFIG__ = ${JSON.stringify({ apiBaseUrl })};`,
      "text/javascript; charset=utf-8",
      {
        "Cache-Control": "no-store"
      }
    );
    return;
  }

  if (url.pathname === "/auth" || url.pathname.startsWith("/auth/")) {
    proxyRequest(req, res, new URL(req.url, apiBaseUrl));
    return;
  }

  if (url.pathname === "/api" || url.pathname.startsWith("/api/")) {
    proxyRequest(req, res, new URL(req.url, apiBaseUrl));
    return;
  }

  if (isLegacyStoreRequest(url.pathname)) {
    redirect(res, url.search ? `/${url.search}` : "/");
    return;
  }

  const routeRedirect = getRouteRedirect(url.pathname);

  if (routeRedirect) {
    redirect(res, url.search ? `${routeRedirect}${url.search}` : routeRedirect);
    return;
  }

  if (isStorefrontRequest(url.pathname)) {
    await serveStorefront(req, res);
    return;
  }

  if (isAccountProfileRequest(url.pathname)) {
    await serveAccountProfile(req, res);
    return;
  }

  if (isAccountAddressRequest(url.pathname)) {
    await serveAccountAddress(req, res);
    return;
  }

  if (isAdminRequest(url.pathname)) {
    await serveAdminDashboard(req, res);
    return;
  }

  const filePath = resolveFilePath(url.pathname);

  if (!filePath) {
    writeResponse(res, 404, "Not found");
    return;
  }

  serveFile(res, filePath);
});

server.listen(frontendPort, () => {
  console.log(`[frontend] listening on http://localhost:${frontendPort}`);
});
