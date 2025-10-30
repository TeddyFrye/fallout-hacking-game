// db.js
import dotenv from "dotenv";
import pg from "pg";

dotenv.config();
const { Pool } = pg;

function getPoolConfig() {
  const url = (process.env.DATABASE_URL || "").trim();

  // Helper: decide if local (no SSL) or remote (SSL)
  const isLocal =
    url.includes("localhost") ||
    url.includes("127.0.0.1") ||
    process.env.PGHOST === "localhost" ||
    process.env.PGHOST === "127.0.0.1";

  // Prefer DATABASE_URL if present
  if (url) {
    return {
      connectionString: url,
      // ✅ RDS/Neon/Supabase need SSL; local doesn't
      ssl: isLocal ? false : { rejectUnauthorized: false },
    };
  }

  // Fallback to discrete PG* env vars
  const {
    PGHOST,
    PGUSER,
    PGPASSWORD,
    PGDATABASE,
    PGPORT = "5432",
  } = process.env;
  if (!PGHOST || !PGUSER || !PGDATABASE) {
    throw new Error(
      "Database config missing. Set DATABASE_URL or PGHOST/PGUSER/PGDATABASE."
    );
  }
  const local = PGHOST === "localhost" || PGHOST === "127.0.0.1";
  return {
    host: PGHOST,
    user: PGUSER,
    password: PGPASSWORD,
    database: PGDATABASE,
    port: Number(PGPORT),
    ssl: local ? false : { rejectUnauthorized: false },
  };
}

export const pool = new Pool(getPoolConfig());

export async function q(text, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
