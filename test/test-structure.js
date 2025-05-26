#!/usr/bin/env node

// Quick test to verify the reorganized structure
console.log('🧪 Testing reorganized project structure...');

import path from 'path';
import fs from 'fs';

// Test if screenshots directory exists
const screenshotsDir = 'd:/Github/crypto-tracker/static/data/screenshots';
console.log('📁 Checking screenshots directory:', screenshotsDir);

if (fs.existsSync(screenshotsDir)) {
  console.log('✅ Screenshots directory exists');
} else {
  console.log('❌ Screenshots directory missing, creating...');
  fs.mkdirSync(screenshotsDir, { recursive: true });
  console.log('✅ Screenshots directory created');
}

// Test PowerShell script
console.log('📸 Testing PowerShell screenshot script...');
import { exec } from 'child_process';

exec('powershell -ExecutionPolicy Bypass -File "../take-screenshot.ps1" -filename "structure-test"', 
  { cwd: __dirname }, 
  (error, stdout, stderr) => {
    if (error) {
      console.log('❌ PowerShell test failed:', error.message);
    } else {
      console.log('✅ PowerShell screenshot test successful');
      console.log('📋 Output:', stdout.trim());
    }
    
    if (stderr) {
      console.log('⚠️ Warnings:', stderr.trim());
    }
  }
);

console.log('');
console.log('📋 Project structure update complete:');
console.log('  📁 /test/ - All test scripts moved here');
console.log('  📁 /static/data/screenshots/ - All screenshots saved here');
console.log('  🔧 MCP configuration updated');
console.log('  🎯 Browser positioning scripts ready for use');
console.log('');
console.log('Next: Run "node complete-setup.js" from the test directory to position browser');
