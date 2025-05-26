#!/usr/bin/env node

/**
 * Apply ESM compatibility patch to @coinbase/cdp-sdk
 * 
 * This script fixes the ESM/CommonJS compatibility issue in the CDP SDK
 * by replacing require('jose') with dynamic import('jose') in the JWT utilities.
 * 
 * Run this script after npm install to ensure the patch is applied.
 */

const fs = require('fs');
const path = require('path');

const targetFile = path.join(__dirname, '..', 'node_modules', '@coinbase', 'cdp-sdk', '_cjs', 'auth', 'utils', 'jwt.js');
const patchFile = path.join(__dirname, '..', 'patches', '@coinbase', 'cdp-sdk', '_cjs', 'auth', 'utils', 'jwt.js');

function applyPatch() {
    console.log('🔧 Applying CDP SDK ESM compatibility patch...');
    console.log('📁 Target file:', targetFile);
    console.log('📁 Patch file:', patchFile);
    
    // Check if target file exists
    if (!fs.existsSync(targetFile)) {
        console.error('❌ Target file not found:', targetFile);
        console.error('Make sure @coinbase/coinbase-sdk is installed');
        process.exit(1);
    }
    
    // Check if patch file exists
    if (!fs.existsSync(patchFile)) {
        console.error('❌ Patch file not found:', patchFile);
        process.exit(1);
    }
    
    try {
        // Read the patch file
        const patchContent = fs.readFileSync(patchFile, 'utf8');
        
        // Apply the patch by copying the patched file
        fs.writeFileSync(targetFile, patchContent);
        
        console.log('✅ CDP SDK ESM compatibility patch applied successfully!');
        console.log('📍 Patched file:', targetFile);
        console.log('🎯 Fixed: require(\'jose\') → dynamic import(\'jose\')');
        
    } catch (error) {
        console.error('❌ Failed to apply patch:', error.message);
        process.exit(1);
    }
}

// Run the patch
applyPatch();
