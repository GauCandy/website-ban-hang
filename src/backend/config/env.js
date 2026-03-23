const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });

const apiPort = Number(
  process.env.API_PORT || process.env.BACKEND_PORT || process.env.PORT || 8080
);
const webPort = Number(process.env.WEB_PORT || process.env.FRONTEND_PORT || 3000);
const webUrl = process.env.WEB_URL || process.env.BASE_URL || `http://localhost:${webPort}`;
const apiUrl =
  process.env.API_URL || process.env.API_BASE_URL || `http://localhost:${apiPort}`;
const googleClientId = process.env.GOOGLE_CLIENT_ID || "";
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET || "";
const googleRedirectUri = process.env.GOOGLE_REDIRECT_URI || "";
const jwtSecret = process.env.JWT_SECRET || process.env.SESSION_SECRET || googleClientSecret || "";
const secureCookies = webUrl.startsWith("https://");
const webOrigin = new URL(webUrl).origin;

module.exports = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: apiPort,
  apiPort,
  frontendPort: webPort,
  webPort,
  baseUrl: webUrl,
  webUrl,
  apiBaseUrl: apiUrl,
  apiUrl,
  databaseUrl: process.env.DATABASE_URL || "",
  googleClientId,
  googleClientSecret,
  googleRedirectUri,
  jwtSecret,
  secureCookies,
  webOrigin,
  jwtCookieName:
    process.env.JWT_COOKIE_NAME ||
    process.env.SESSION_COOKIE_NAME ||
    (secureCookies ? "__Host-whitecat_token" : "whitecat_token")
};
