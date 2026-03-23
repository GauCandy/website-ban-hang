const crypto = require("crypto");

function encodeSegment(value) {
  return Buffer.from(JSON.stringify(value)).toString("base64url");
}

function signSegment(value, secret) {
  return crypto.createHmac("sha256", secret).update(value).digest("base64url");
}

function createJwt(payload, secret) {
  if (!secret) {
    throw new Error("JWT_SECRET hoặc GOOGLE_CLIENT_SECRET chưa được cấu hình.");
  }

  const header = {
    alg: "HS256",
    typ: "JWT"
  };
  const encodedHeader = encodeSegment(header);
  const encodedPayload = encodeSegment(payload);
  const signedContent = `${encodedHeader}.${encodedPayload}`;
  const signature = signSegment(signedContent, secret);

  return `${signedContent}.${signature}`;
}

function readJwt(token, secret) {
  if (!token || !secret) {
    return null;
  }

  const [encodedHeader, encodedPayload, providedSignature] = token.split(".");

  if (!encodedHeader || !encodedPayload || !providedSignature) {
    return null;
  }

  const signedContent = `${encodedHeader}.${encodedPayload}`;
  const expectedSignature = signSegment(signedContent, secret);
  const providedBuffer = Buffer.from(providedSignature);
  const expectedBuffer = Buffer.from(expectedSignature);

  if (providedBuffer.length !== expectedBuffer.length) {
    return null;
  }

  if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch (_error) {
    return null;
  }
}

module.exports = {
  createJwt,
  readJwt
};
