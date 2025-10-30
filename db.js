// db.js
import dotenv from "dotenv";
import pg from "pg";

dotenv.config(); // no-op on Flightcontrol; works locally

const { Pool } = pg;

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If you use RDS with SSL required, uncomment:
  // ssl: { rejectUnauthorized: false },
});

// Helper to run queries with pooled client
export async function q(text, params = []) {
  const client = await pool.connect();
  try {
    return await client.query(text, params);
  } finally {
    client.release();
  }
}
