const env = require("../config/env");
const { getPool } = require("../db/pool");
const { parseCookies, serializeCookie } = require("../lib/cookies");
const { readJwt } = require("../lib/jwt");
const AUTH_COOKIE_SAME_SITE = "Lax";

function clearAuthCookie() {
  return serializeCookie(env.jwtCookieName, "", {
    httpOnly: true,
    expires: new Date(0),
    maxAge: 0,
    path: "/",
    sameSite: AUTH_COOKIE_SAME_SITE,
    secure: env.secureCookies
  });
}

async function requireAuth(req, res, next) {
  const cookies = parseCookies(req.headers.cookie || "");
  const token = cookies[env.jwtCookieName];

  if (!token) {
    res.status(401).json({
      message: "Bạn cần đăng nhập để truy cập API này."
    });
    return;
  }

  const jwtPayload = readJwt(token, env.jwtSecret);

  if (!jwtPayload) {
    res.setHeader("Set-Cookie", clearAuthCookie());
    res.status(401).json({
      message: "Token đăng nhập không hợp lệ hoặc đã hết hạn."
    });
    return;
  }

  try {
    const pool = getPool();
    const userResult = await pool.query(
      `
        select
          u.id,
          u.full_name,
          u.email,
          u.phone_number,
          u.gender,
          u.birth_date,
          u.avatar_url,
          u.role,
          u.account_status,
          u.marketing_opt_in,
          u.last_login_at,
          u.created_at,
          u.updated_at,
          exists(
            select 1
            from auth_identities ai
            where ai.user_id = u.id
          ) as has_identity
        from users u
        where u.id = $1
        limit 1
      `,
      [jwtPayload.sub]
    );

    if (!userResult.rowCount || !userResult.rows[0].has_identity) {
      res.setHeader("Set-Cookie", clearAuthCookie());
      res.status(401).json({
        message: "Phiên đăng nhập không còn hợp lệ."
      });
      return;
    }

    req.auth = jwtPayload;
    req.currentUser = userResult.rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = requireAuth;
