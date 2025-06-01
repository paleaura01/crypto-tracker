#!/usr/bin/env node
/* eslint-disable no-console */

import { rmSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Directories to clean
const directoriesToClean = [
  '.svelte-kit',
  '.vercel',
  'dist',
  'build'
];

console.log('🧹 Cleaning build directories...');

directoriesToClean.forEach(dir => {
  const fullPath = join(projectRoot, dir);
  
  if (existsSync(fullPath)) {
    try {
      console.log(`  Removing ${dir}...`);
      rmSync(fullPath, { 
        recursive: true, 
        force: true,
        maxRetries: 3,
        retryDelay: 1000
      });
      console.log(`  ✅ ${dir} removed successfully`);
    } catch (error) {
      console.warn(`  ⚠️  Warning: Could not remove ${dir}:`, error.message);
      
      // If normal removal fails, try alternative approach on Windows
      if (process.platform === 'win32') {
        try {
          console.log(`  🔄 Retrying with alternative method for ${dir}...`);
          // Force remove with Windows-specific options
          rmSync(fullPath, { 
            recursive: true, 
            force: true,
            maxRetries: 5,
            retryDelay: 2000
          });
          console.log(`  ✅ ${dir} removed on retry`);
        } catch (retryError) {
          console.error(`  ❌ Failed to remove ${dir} after retry:`, retryError.message);
        }
      }
    }
  } else {
    console.log(`  ℹ️  ${dir} does not exist, skipping`);
  }
});

console.log('🎉 Clean completed!');
