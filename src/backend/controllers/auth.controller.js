const crypto = require("crypto");
const env = require("../config/env");
const { getPool } = require("../db/pool");
const { parseCookies, serializeCookie } = require("../lib/cookies");
const { createJwt } = require("../lib/jwt");

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo";
const OAUTH_STATE_COOKIE = env.secureCookies
  ? "__Host-whitecat_oauth_state"
  : "whitecat_oauth_state";
const JWT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;
const AUTH_COOKIE_SAME_SITE = "Lax";

function buildCookieOptions({ maxAge, sameSite }) {
  return {
    httpOnly: true,
    maxAge,
    path: "/",
    sameSite,
    secure: env.secureCookies
  };
}

function buildLoginUrl(status, message) {
  const loginUrl = new URL("/", env.webUrl);

  if (status) {
    loginUrl.searchParams.set("auth", status);
  }

  if (message) {
    loginUrl.searchParams.set("message", message);
  }

  return loginUrl.toString();
}

function buildHomeUrl() {
  return new URL("/", env.webUrl).toString();
}

function missingGoogleConfig() {
  const missing = [];

  if (!env.googleClientId) {
    missing.push("GOOGLE_CLIENT_ID");
  }

  if (!env.googleClientSecret) {
    missing.push("GOOGLE_CLIENT_SECRET");
  }

  if (!env.googleRedirectUri) {
    missing.push("GOOGLE_REDIRECT_URI");
  }

  return missing;
}

function clearStateCookie() {
  return serializeCookie(
    OAUTH_STATE_COOKIE,
    "",
    {
      ...buildCookieOptions({ maxAge: 0, sameSite: "Lax" }),
      expires: new Date(0)
    }
  );
}

function clearAuthCookie() {
  return serializeCookie(
    env.jwtCookieName,
    "",
    {
      ...buildCookieOptions({ maxAge: 0, sameSite: AUTH_COOKIE_SAME_SITE }),
      expires: new Date(0)
    }
  );
}

function redirectWithError(res, message) {
  res.setHeader("Set-Cookie", [clearStateCookie()]);
  res.redirect(buildLoginUrl("error", message));
}

async function exchangeCodeForToken(code) {
  const body = new URLSearchParams({
    client_id: env.googleClientId,
    client_secret: env.googleClientSecret,
    code,
    grant_type: "authorization_code",
    redirect_uri: env.googleRedirectUri
  });

  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Không đổi được mã Google.");
  }

  return payload;
}

async function fetchGoogleProfile(accessToken) {
  const response = await fetch(GOOGLE_USERINFO_URL, {
    headers: {
      Authorization: `Bearer ${accessToken}`
    }
  });

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || "Không lấy được hồ sơ Google.");
  }

  return payload;
}

async function syncUser(profile) {
  const pool = getPool();
  const provider = "google";
  const providerUserId = profile.sub?.trim();
  const providerEmail = profile.email.trim().toLowerCase();
  const fullName =
    profile.name?.trim() || profile.given_name?.trim() || providerEmail.split("@")[0];
  const avatarUrl = profile.picture?.trim() || null;

  if (!providerUserId) {
    throw new Error("Google không trả về mã định danh người dùng.");
  }

  const exactIdentity = await pool.query(
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
        ai.id as auth_identity_id,
        ai.provider_email
      from auth_identities ai
      join users u on u.id = ai.user_id
      where ai.provider = $1 and ai.provider_user_id = $2
      limit 1
    `,
    [provider, providerUserId]
  );

  if (exactIdentity.rowCount) {
    const user = exactIdentity.rows[0];

    await pool.query(
      `
        update users
        set
          full_name = $1,
          email = $2,
          avatar_url = coalesce($3, avatar_url),
          last_login_at = now(),
          updated_at = now()
        where id = $4
      `,
      [fullName, providerEmail, avatarUrl, user.id]
    );

    if (user.provider_email !== providerEmail) {
      await pool.query(
        `
          update auth_identities
          set provider_email = $1, updated_at = now()
          where id = $2
        `,
        [providerEmail, user.auth_identity_id]
      );
    }

    user.full_name = fullName;
    user.email = providerEmail;
    user.avatar_url = avatarUrl || user.avatar_url;
    return user;
  }

  const linkedIdentity = await pool.query(
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
        u.updated_at
      from auth_identities ai
      join users u on u.id = ai.user_id
      where lower(coalesce(ai.provider_email, '')) = lower($1)
      order by ai.created_at asc
      limit 1
    `,
    [providerEmail]
  );

  if (linkedIdentity.rowCount) {
    const user = linkedIdentity.rows[0];

    await pool.query(
      `
        update users
        set
          full_name = $1,
          email = $2,
          avatar_url = coalesce($3, avatar_url),
          last_login_at = now(),
          updated_at = now()
        where id = $4
      `,
      [fullName, providerEmail, avatarUrl, user.id]
    );

    await pool.query(
      `
        insert into auth_identities (user_id, provider, provider_user_id, provider_email)
        values ($1, $2, $3, $4)
        on conflict (provider, provider_user_id)
        do update set
          user_id = excluded.user_id,
          provider_email = excluded.provider_email,
          updated_at = now()
      `,
      [user.id, provider, providerUserId, providerEmail]
    );

    user.full_name = fullName;
    user.email = providerEmail;
    user.avatar_url = avatarUrl || user.avatar_url;
    return user;
  }

  const insertedUser = await pool.query(
    `
      insert into users (full_name, email, avatar_url, last_login_at)
      values ($1, $2, $3, now())
      returning
        id,
        full_name,
        email,
        phone_number,
        gender,
        birth_date,
        avatar_url,
        role,
        account_status,
        marketing_opt_in,
        last_login_at,
        created_at,
        updated_at
    `,
    [fullName, providerEmail, avatarUrl]
  );

  await pool.query(
    `
      insert into auth_identities (user_id, provider, provider_user_id, provider_email)
      values ($1, $2, $3, $4)
    `,
    [insertedUser.rows[0].id, provider, providerUserId, providerEmail]
  );

  return {
    ...insertedUser.rows[0],
    email: providerEmail
  };
}

function createJwtPayload(user) {
  const now = Math.floor(Date.now() / 1000);

  return {
    sub: user.id,
    email: user.email,
    name: user.full_name,
    provider: "google",
    iat: now,
    exp: now + JWT_MAX_AGE_SECONDS
  };
}

function startGoogleAuth(_req, res) {
  const missing = missingGoogleConfig();

  if (missing.length) {
    return redirectWithError(res, `Thiếu cấu hình Google OAuth: ${missing.join(", ")}`);
  }

  const state = crypto.randomBytes(24).toString("hex");
  const authUrl = new URL(GOOGLE_AUTH_URL);

  authUrl.searchParams.set("client_id", env.googleClientId);
  authUrl.searchParams.set("redirect_uri", env.googleRedirectUri);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", "openid email profile");
  authUrl.searchParams.set("prompt", "select_account");
  authUrl.searchParams.set("state", state);

  res.setHeader(
    "Set-Cookie",
    serializeCookie(
      OAUTH_STATE_COOKIE,
      state,
      buildCookieOptions({ maxAge: 600, sameSite: "Lax" })
    )
  );
  res.redirect(authUrl.toString());
}

async function handleGoogleCallback(req, res) {
  if (req.query.error) {
    return redirectWithError(res, "Google đã từ chối yêu cầu đăng nhập.");
  }

  const cookies = parseCookies(req.headers.cookie || "");
  const expectedState = cookies[OAUTH_STATE_COOKIE];
  const returnedState = typeof req.query.state === "string" ? req.query.state : "";
  const code = typeof req.query.code === "string" ? req.query.code : "";

  if (!expectedState || !returnedState || expectedState !== returnedState) {
    return redirectWithError(res, "Trạng thái xác thực Google không hợp lệ.");
  }

  if (!code) {
    return redirectWithError(res, "Thiếu mã xác thực trả về từ Google.");
  }

  try {
    const tokenPayload = await exchangeCodeForToken(code);
    const profile = await fetchGoogleProfile(tokenPayload.access_token);

    if (!profile.email || !profile.email_verified) {
      return redirectWithError(res, "Tài khoản Google chưa có email đã xác minh.");
    }

    const user = await syncUser(profile);
    const jwtToken = createJwt(createJwtPayload(user), env.jwtSecret);

    res.setHeader("Set-Cookie", [
      clearStateCookie(),
      serializeCookie(
        env.jwtCookieName,
        jwtToken,
        // Lax allows the first navigation after OAuth to include the auth cookie.
        buildCookieOptions({ maxAge: JWT_MAX_AGE_SECONDS, sameSite: AUTH_COOKIE_SAME_SITE })
      )
    ]);

    res.redirect(buildHomeUrl());
  } catch (error) {
    redirectWithError(res, error.message || "Đăng nhập Google thất bại.");
  }
}

function getCurrentUser(req, res) {
  const jwtPayload = req.auth;
  res.json({
    authenticated: true,
    user: {
      id: jwtPayload.sub,
      email: jwtPayload.email,
      name: jwtPayload.name,
      provider: jwtPayload.provider
    }
  });
}

function logout(_req, res) {
  res.setHeader("Set-Cookie", clearAuthCookie());
  res.redirect(buildHomeUrl());
}

module.exports = {
  getCurrentUser,
  handleGoogleCallback,
  logout,
  startGoogleAuth
};
