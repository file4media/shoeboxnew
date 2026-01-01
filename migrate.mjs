#!/usr/bin/env node
/**
 * Database Migration Script for Railway Deployment
 * 
 * This script runs Drizzle migrations to create all database tables.
 * Run this once after deploying to Railway to set up the database schema.
 * 
 * Usage:
 *   node migrate.mjs
 * 
 * Or via Railway CLI:
 *   railway run node migrate.mjs
 */

import { drizzle } from 'drizzle-orm/mysql2';
import mysql from 'mysql2/promise';
import { migrate } from 'drizzle-orm/mysql2/migrator';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function runMigrations() {
  const DATABASE_URL = process.env.DATABASE_URL;
  
  if (!DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL environment variable is not set!');
    console.error('Please set DATABASE_URL in your Railway environment variables.');
    process.exit(1);
  }

  console.log('🔄 Connecting to database...');
  
  let connection;
  try {
    // Create connection
    connection = await mysql.createConnection(DATABASE_URL);
    console.log('✅ Database connection established');
    
    // Create drizzle instance
    const db = drizzle(connection);
    
    console.log('🔄 Running migrations...');
    
    // Run migrations from the drizzle folder
    await migrate(db, { migrationsFolder: './drizzle' });
    
    console.log('✅ Migrations completed successfully!');
    console.log('');
    console.log('Your database is now ready. You can start using the application.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run migrations
runMigrations();
