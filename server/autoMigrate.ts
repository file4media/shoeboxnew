import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import mysql from "mysql2/promise";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function autoMigrate() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.warn("[AutoMigrate] DATABASE_URL not set, skipping migrations");
    return;
  }

  console.log("[AutoMigrate] Starting database migrations...");
  
  try {
    const connection = await mysql.createConnection(DATABASE_URL);
    const db = drizzle(connection);
    
    // Try to run migrations - the folder should contain SQL files and meta/_journal.json
    const migrationsFolder = path.join(process.cwd(), "drizzle");
    console.log("[AutoMigrate] Looking for migrations in:", migrationsFolder);
    
    await migrate(db, { migrationsFolder });
    
    await connection.end();
    
    console.log("[AutoMigrate] Migrations completed successfully");
  } catch (error) {
    console.warn("[AutoMigrate] Migration skipped or failed (database may already be up to date):", error);
    // Don't throw - let the app continue even if migrations fail
  }
}
