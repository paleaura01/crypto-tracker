#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * Simple migration runner using Supabase client
 * Usage: npm run migrate [migration-name]
 */

import { readFileSync, readdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function getAppliedMigrations() {
  const { data, error } = await supabase
    .from('schema_migrations')
    .select('version')
    .order('version');
  
  if (error) {
    console.log('📝 Creating migrations tracking table...');
    // Create the table if it doesn't exist
    const { error: createError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS schema_migrations (
          version TEXT PRIMARY KEY,
          applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    });
    
    if (createError) {
      console.error('❌ Failed to create migrations table:', createError);
      return [];
    }
    return [];
  }
  
  return data.map(row => row.version);
}

async function applyMigration(fileName, sql) {
  console.log(`🔄 Applying migration: ${fileName}`);
  
  // Execute the migration SQL
  const { error: migrationError } = await supabase.rpc('exec', { sql });
  
  if (migrationError) {
    console.error(`❌ Migration failed: ${fileName}`, migrationError);
    return false;
  }
  
  // Record the migration as applied
  const version = fileName.replace('.sql', '');
  const { error: recordError } = await supabase
    .from('schema_migrations')
    .upsert({ version, applied_at: new Date().toISOString() });
  
  if (recordError) {
    console.error(`❌ Failed to record migration: ${fileName}`, recordError);
    return false;
  }
  
  console.log(`✅ Migration applied: ${fileName}`);
  return true;
}

async function runMigrations() {
  try {
    const migrationsDir = join(__dirname, '../supabase/migrations');
    const migrationFiles = readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort();
    
    if (migrationFiles.length === 0) {
      console.log('📂 No migration files found');
      return;
    }
    
    const appliedMigrations = await getAppliedMigrations();
    console.log(`📊 Found ${migrationFiles.length} migration files, ${appliedMigrations.length} already applied`);
    
    let appliedCount = 0;
    
    for (const file of migrationFiles) {
      const version = file.replace('.sql', '');
      
      if (appliedMigrations.includes(version)) {
        console.log(`⏭️  Skipping already applied: ${file}`);
        continue;
      }
      
      const filePath = join(migrationsDir, file);
      const sql = readFileSync(filePath, 'utf-8').trim();
      
      if (!sql) {
        console.log(`⚠️  Skipping empty migration: ${file}`);
        continue;
      }
      
      const success = await applyMigration(file, sql);
      if (!success) {
        console.error(`❌ Migration failed, stopping at: ${file}`);
        process.exit(1);
      }
      
      appliedCount++;
    }
    
    if (appliedCount > 0) {
      console.log(`🎉 Successfully applied ${appliedCount} new migrations`);
    } else {
      console.log('✨ All migrations are up to date');
    }
    
  } catch (error) {
    console.error('❌ Migration runner failed:', error);
    process.exit(1);
  }
}

// Create RPC function for executing SQL
async function setupDatabase() {
  const { error } = await supabase.rpc('exec', {
    sql: `
      CREATE OR REPLACE FUNCTION exec(sql text)
      RETURNS void
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      BEGIN
        EXECUTE sql;
      END;
      $$;
    `
  });
  
  if (error) {
    console.error('❌ Failed to create exec function:', error);
    return false;
  }
  
  return true;
}

// Main execution
async function main() {
  console.log('🚀 Starting migration runner...');
  
  const setupSuccess = await setupDatabase();
  if (!setupSuccess) {
    process.exit(1);
  }
  
  await runMigrations();
}

main().catch(console.error);
