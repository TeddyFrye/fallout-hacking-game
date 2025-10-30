// scripts/migrate.js
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { q, pool } from "../db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function run() {
  const sql = fs.readFileSync(
    path.join(__dirname, "..", "sql", "migrate.sql"),
    "utf8"
  );
  await q(sql);
  await pool.end();
  console.log("Migration complete.");
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
