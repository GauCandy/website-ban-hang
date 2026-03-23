const fs = require("fs/promises");
const path = require("path");
const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config({ path: path.resolve(process.cwd(), ".env"), quiet: true });

const MIGRATIONS_DIR = __dirname;
const MIGRATIONS_TABLE = "schema_migrations";
const MIN_VERSION_WIDTH = 4;

function printUsage() {
  console.log("Usage:");
  console.log("  node src/database/migrate.js create <migration_name>");
  console.log("  node src/database/migrate.js up");
  console.log("  node src/database/migrate.js down [count]");
  console.log("  node src/database/migrate.js status");
}

function slugifyMigrationName(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function parseMigrationFileName(fileName) {
  const match = fileName.match(/^(\d+)_(.+)\.up\.sql$/);

  if (!match) {
    throw new Error(
      `Invalid migration file name "${fileName}". Expected "<version>_<name>.up.sql".`
    );
  }

  const [, version, name] = match;
  const versionNumber = Number.parseInt(version, 10);

  if (!Number.isSafeInteger(versionNumber) || versionNumber <= 0) {
    throw new Error(`Invalid migration version "${version}" in file "${fileName}".`);
  }

  return {
    version,
    versionNumber,
    name,
    baseName: `${version}_${name}`
  };
}

function formatVersion(versionNumber, minWidth = MIN_VERSION_WIDTH) {
  return String(versionNumber).padStart(Math.max(minWidth, String(versionNumber).length), "0");
}

function getNextVersion(migrations) {
  const maxVersionNumber = migrations.reduce(
    (currentMax, migration) => Math.max(currentMax, migration.versionNumber),
    0
  );
  const width = migrations.reduce(
    (currentMax, migration) => Math.max(currentMax, migration.version.length),
    MIN_VERSION_WIDTH
  );

  return formatVersion(maxVersionNumber + 1, width);
}

function ensureUniqueMigrations(migrations) {
  const versions = new Set();
  const names = new Set();

  for (const migration of migrations) {
    if (versions.has(migration.versionNumber)) {
      throw new Error(`Duplicate migration version found: ${migration.version}`);
    }

    if (names.has(migration.name)) {
      throw new Error(`Duplicate migration name found: ${migration.name}`);
    }

    versions.add(migration.versionNumber);
    names.add(migration.name);
  }
}

async function ensureMigrationsDirectory() {
  await fs.mkdir(MIGRATIONS_DIR, { recursive: true });
}

async function readMigrationFiles() {
  await ensureMigrationsDirectory();

  const entries = await fs.readdir(MIGRATIONS_DIR);
  const upFiles = entries.filter((entry) => entry.endsWith(".up.sql"));
  const migrations = upFiles
    .map((fileName) => {
      const parsed = parseMigrationFileName(fileName);

      return {
        ...parsed,
        upFileName: fileName,
        upPath: path.join(MIGRATIONS_DIR, fileName),
        downPath: path.join(MIGRATIONS_DIR, `${parsed.baseName}.down.sql`)
      };
    })
    .sort((left, right) => left.versionNumber - right.versionNumber);

  ensureUniqueMigrations(migrations);

  return migrations;
}

async function ensureMigrationPairs(migrations) {
  for (const migration of migrations) {
    try {
      await fs.access(migration.downPath);
    } catch {
      throw new Error(`Missing down migration for ${migration.upFileName}`);
    }
  }
}

function getDatabaseUrl() {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not configured.");
  }

  return process.env.DATABASE_URL;
}

async function withClient(work) {
  const client = new Client({
    connectionString: getDatabaseUrl()
  });

  await client.connect();

  try {
    return await work(client);
  } finally {
    await client.end();
  }
}

async function ensureMigrationsTable(client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS ${MIGRATIONS_TABLE} (
      version VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);
}

async function getAppliedMigrations(client) {
  const result = await client.query(
    `SELECT version, name, applied_at
     FROM ${MIGRATIONS_TABLE}
     ORDER BY CAST(version AS BIGINT) ASC`
  );

  return result.rows;
}

function findAppliedMigration(appliedRows, migration) {
  return (
    appliedRows.find((row) => row.version === migration.version) ||
    appliedRows.find((row) => row.name === migration.name) ||
    null
  );
}

async function reconcileAppliedMigrations(client, migrations) {
  const appliedRows = await getAppliedMigrations(client);

  for (const migration of migrations) {
    const applied = findAppliedMigration(appliedRows, migration);

    if (!applied || applied.version === migration.version) {
      continue;
    }

    await client.query(
      `UPDATE ${MIGRATIONS_TABLE}
       SET version = $1
       WHERE version = $2`,
      [migration.version, applied.version]
    );

    applied.version = migration.version;
  }
}

async function createMigration(name) {
  const slug = slugifyMigrationName(name || "");

  if (!slug) {
    throw new Error("Migration name is required. Example: add_posts_table");
  }

  const migrations = await readMigrationFiles();
  const version = getNextVersion(migrations);
  const baseName = `${version}_${slug}`;
  const upPath = path.join(MIGRATIONS_DIR, `${baseName}.up.sql`);
  const downPath = path.join(MIGRATIONS_DIR, `${baseName}.down.sql`);
  const upTemplate = "-- Write your upgrade SQL here.\n";
  const downTemplate = "-- Write your rollback SQL here.\n";

  await fs.writeFile(upPath, upTemplate, { flag: "wx" });
  await fs.writeFile(downPath, downTemplate, { flag: "wx" });

  console.log(`Created ${path.relative(process.cwd(), upPath)}`);
  console.log(`Created ${path.relative(process.cwd(), downPath)}`);
}

async function applyPendingMigrations() {
  const migrations = await readMigrationFiles();
  await ensureMigrationPairs(migrations);

  await withClient(async (client) => {
    await ensureMigrationsTable(client);
    await reconcileAppliedMigrations(client, migrations);

    const appliedRows = await getAppliedMigrations(client);
    const appliedVersions = new Set(appliedRows.map((row) => row.version));
    const pending = migrations.filter((migration) => !appliedVersions.has(migration.version));

    if (pending.length === 0) {
      console.log("No pending migrations.");
      return;
    }

    for (const migration of pending) {
      const sql = await fs.readFile(migration.upPath, "utf8");

      console.log(`Applying ${migration.version}_${migration.name}`);

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(
          `INSERT INTO ${MIGRATIONS_TABLE} (version, name) VALUES ($1, $2)`,
          [migration.version, migration.name]
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  });
}

async function rollbackMigrations(countValue) {
  const rollbackCount = Number(countValue || 1);

  if (!Number.isInteger(rollbackCount) || rollbackCount <= 0) {
    throw new Error("Rollback count must be a positive integer.");
  }

  const migrations = await readMigrationFiles();
  await ensureMigrationPairs(migrations);
  const migrationMap = new Map(migrations.map((migration) => [migration.version, migration]));

  await withClient(async (client) => {
    await ensureMigrationsTable(client);
    await reconcileAppliedMigrations(client, migrations);

    const appliedRows = await getAppliedMigrations(client);
    const targets = appliedRows.slice(-rollbackCount).reverse();

    if (targets.length === 0) {
      console.log("No applied migrations to roll back.");
      return;
    }

    for (const target of targets) {
      const migration = migrationMap.get(target.version);

      if (!migration) {
        throw new Error(`Migration file not found for applied version ${target.version}`);
      }

      const sql = await fs.readFile(migration.downPath, "utf8");

      console.log(`Rolling back ${migration.version}_${migration.name}`);

      try {
        await client.query("BEGIN");
        await client.query(sql);
        await client.query(`DELETE FROM ${MIGRATIONS_TABLE} WHERE version = $1`, [
          migration.version
        ]);
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      }
    }
  });
}

async function printStatus() {
  const migrations = await readMigrationFiles();
  await ensureMigrationPairs(migrations);

  await withClient(async (client) => {
    await ensureMigrationsTable(client);
    await reconcileAppliedMigrations(client, migrations);

    const appliedRows = await getAppliedMigrations(client);
    const appliedMap = new Map(appliedRows.map((row) => [row.version, row]));

    if (migrations.length === 0) {
      console.log("No migration files found.");
      return;
    }

    for (const migration of migrations) {
      const applied = appliedMap.get(migration.version);
      const marker = applied ? "[x]" : "[ ]";
      const suffix = applied
        ? ` applied at ${new Date(applied.applied_at).toISOString()}`
        : "";

      console.log(`${marker} ${migration.version}_${migration.name}${suffix}`);
    }
  });
}

async function main() {
  const [, , command, argument] = process.argv;

  switch (command) {
    case "create":
      await createMigration(argument);
      return;
    case "up":
      await applyPendingMigrations();
      return;
    case "down":
      await rollbackMigrations(argument);
      return;
    case "status":
      await printStatus();
      return;
    default:
      printUsage();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
