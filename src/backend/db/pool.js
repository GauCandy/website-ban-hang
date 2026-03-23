const { Pool } = require("pg");
const env = require("../config/env");

let pool;

function getPool() {
  if (!env.databaseUrl) {
    throw new Error("DATABASE_URL is not configured.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: env.databaseUrl
    });
  }

  return pool;
}

async function checkDatabaseConnection() {
  const client = await getPool().connect();

  try {
    await client.query("select 1");
    return true;
  } finally {
    client.release();
  }
}

module.exports = {
  checkDatabaseConnection,
  getPool
};
