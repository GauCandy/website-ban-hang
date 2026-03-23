const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

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
  const allowedOrigin = options.allowedOrigin;

  return (req, res, next) => {
    if (SAFE_METHODS.has(req.method)) {
      next();
      return;
    }

    const requestOrigin = extractOrigin(req);

    if (!requestOrigin || requestOrigin !== allowedOrigin) {
      res.status(403).json({
        message: "Yêu cầu bị chặn bởi CSRF protection."
      });
      return;
    }

    next();
  };
}

module.exports = csrfProtection;
