import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { query } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default async function initDB() {
  const schemaPath = path.join(__dirname, "sql", "schema.sql");
  const schema = fs.readFileSync(schemaPath, "utf-8");
  await query(schema);
  console.log("✅ DB initialized");
}
