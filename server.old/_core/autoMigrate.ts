/**
 * Automatic Database Migration
 * 
 * This module automatically runs database migrations on server startup.
 * It ensures that all database tables are created before the application starts.
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { migrate } from 'drizzle-orm/mysql2/migrator';

export async function runAutoMigration(): Promise<void> {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ [Migration] ERROR: DATABASE_URL environment variable is not set!');
    throw new Error('DATABASE_URL is required for database migrations');
  }

  console.log('🔄 [Migration] Starting automatic database migration...');
  
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ [Migration] Database connection established');
    
    // Create drizzle instance
    const db = drizzle(connection);
    
    console.log('🔄 [Migration] Running migrations from ./drizzle folder...');
    
    // Run migrations from the drizzle folder
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ [Migration] All migrations completed successfully!');
    console.log('📊 [Migration] Database schema is up to date');
    
  } catch (error) {
    // Check if error is because migrations were already run
    if (error instanceof Error && error.message.includes('no migration files')) {
      console.log('ℹ️  [Migration] No new migrations to run - database is up to date');
      return;
    }
    
    console.error('❌ [Migration] Migration failed:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 [Migration] Database connection closed');
    }
  }
}
