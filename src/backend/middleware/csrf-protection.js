const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

function getAllowedOrigins(options = {}) {
  const origins = new Set();

  if (typeof options.allowedOrigin === "string" && options.allowedOrigin) {
    origins.add(options.allowedOrigin);
  }

  if (Array.isArray(options.allowedOrigins)) {
    options.allowedOrigins.forEach((origin) => {
      if (typeof origin === "string" && origin) {
        origins.add(origin);
      }
    });
  }

  return origins;
}

function extractOrigin(req) {
  const originHeader = req.headers.origin;

  if (originHeader) {
    return originHeader;
  }

  const refererHeader = req.headers.referer;

  if (!refererHeader) {
    return null;
  }

  try {
    return new URL(refererHeader).origin;
  } catch (_error) {
    return null;
  }
}

function csrfProtection(options) {
  const allowedOrigins = getAllowedOrigins(options);

  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    const requestOrigin = extractOrigin(req);

    if (!requestOrigin || !allowedOrigins.has(requestOrigin)) {
      res.status(403).json({
        message: "Yêu cầu bị chặn bởi CSRF protection."
      });
      return;
    }

    next();
  };
}

module.exports = csrfProtection;
