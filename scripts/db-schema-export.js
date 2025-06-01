#!/usr/bin/env node

/* eslint-disable no-console */

/**
 * Database Schema Export Script - Export current Supabase schema via MCP
 * Run with: node scripts/db-schema-export.js
 */

import fs from 'fs';
import path from 'path';

const PROJECT_ID = 'usmcnnvgdntpxjhhhplt';

console.log('🗃️  Exporting Supabase schema...');

// For now, this creates the structure - you'll run the actual MCP commands
const schemaDir = 'database';

// Create database directory
if (!fs.existsSync(schemaDir)) {
  fs.mkdirSync(schemaDir, { recursive: true });
}

// Instructions for MCP usage
const instructions = `
# Database Development Workflow

## 1. Export Schema (Run these MCP commands)

// Get all table schemas
f1e_list_tables({ project_id: "${PROJECT_ID}" })

// Export key wallet data
f1e_execute_sql({ 
  project_id: "${PROJECT_ID}", 
  query: "SELECT * FROM wallet_addresses;" 
})

f1e_execute_sql({ 
  project_id: "${PROJECT_ID}", 
  query: "SELECT * FROM wallet_settings;" 
})

f1e_execute_sql({ 
  project_id: "${PROJECT_ID}", 
  query: "SELECT * FROM token_overrides;" 
})

## 2. Schema Changes

Edit files in /database/ directory, then apply with:

f1e_apply_migration({
  project_id: "${PROJECT_ID}",
  name: "fix_wallet_persistence", 
  query: "-- Your SQL here"
})

## 3. Test Changes

f1e_execute_sql({ 
  project_id: "${PROJECT_ID}", 
  query: "-- Test queries here" 
})
`;

fs.writeFileSync(path.join(schemaDir, 'README.md'), instructions);

console.log('✅ Created database/ directory with MCP workflow instructions');
console.log('📁 Check database/README.md for MCP commands to run');
