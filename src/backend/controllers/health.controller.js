const env = require("../config/env");

function getHealth(_req, res) {
  res.json({
    status: "ok",
    service: "backend",
    timestamp: new Date().toISOString(),
    databaseConfigured: Boolean(env.databaseUrl)
  });
}

module.exports = {
  getHealth
};
