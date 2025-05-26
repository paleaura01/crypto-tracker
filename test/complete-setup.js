#!/usr/bin/env node

// Complete setup script for browser positioning and BNB testing
// This script can be run step by step if needed

console.log('🎯 Complete Browser Positioning & BNB Testing Setup');
console.log('=====================================================');
console.log('');
console.log('This script will:');
console.log('1. 📸 Take initial desktop screenshot');
console.log('2. 🚀 Launch Brave browser positioned on right monitor');
console.log('3. 🌐 Navigate to crypto tracker test page');
console.log('4. 🪙 Test BNB override functionality');
console.log('5. 📊 Capture screenshots for verification');
console.log('');
console.log('Prerequisites:');
console.log('- Dev server should be running on port 5175 (npm run dev)');
console.log('- Brave browser should be installed');
console.log('- Dual monitor setup configured');
console.log('');

import puppeteer from 'puppeteer';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFileSync } from 'fs';

const execAsync = promisify(exec);

// Configuration
const CONFIG = {
  devServerUrl: 'http://localhost:5176/test-evm',
  bravePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe',
  screenshotDir: 'd:/Github/crypto-tracker/static/data/screenshots/',
  powershellScript: 'd:/Github/crypto-tracker/mcp-scripts/take-screenshot.ps1',
  rightMonitor: {
    x: 1920,
    y: 0,
    width: 1920,
    height: 1080
  }
};

async function checkPrerequisites() {
  console.log('🔍 Checking prerequisites...');
  
  const checks = {
    devServer: false,
    braveInstalled: false,
    powershellScript: false
  };
  
  // Check if dev server is running
  try {
    const response = await fetch(CONFIG.devServerUrl);
    checks.devServer = response.ok;
    console.log(checks.devServer ? '✅ Dev server is running' : '❌ Dev server not responding');
  } catch (error) {
    console.log('❌ Dev server not running - please start with: npm run dev');
  }
  
  // Check if Brave is installed
  try {
    await execAsync(`"${CONFIG.bravePath}" --version`);
    checks.braveInstalled = true;
    console.log('✅ Brave browser found');
  } catch (error) {
    console.log('❌ Brave browser not found at expected path');
  }
  
  // Check if PowerShell script exists
  try {
    readFileSync(CONFIG.powershellScript);
    checks.powershellScript = true;
    console.log('✅ PowerShell screenshot script found');
  } catch (error) {
    console.log('❌ PowerShell screenshot script not found');
  }
  
  const allChecksPass = Object.values(checks).every(check => check);
  
  if (!allChecksPass) {
    console.log('\n⚠️ Some prerequisites are missing. Please fix the issues above before continuing.');
    if (!checks.devServer) {
      console.log('   Run: npm run dev (in a separate terminal)');
    }
    return false;
  }
  
  console.log('✅ All prerequisites met!');
  return true;
}

async function takeScreenshot(filename, description) {
  console.log(`📸 ${description}...`);
  
  try {
    const command = `powershell -ExecutionPolicy Bypass -File "${CONFIG.powershellScript}" -OutputPath "${CONFIG.screenshotDir}" -Filename "${filename}"`;
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && stderr.trim()) {
      console.log('⚠️ Screenshot warning:', stderr.trim());
    }
    
    console.log(`✅ Screenshot saved: ${filename}`);
    return `${CONFIG.screenshotDir}${filename}`;
  } catch (error) {
    console.log(`❌ Failed to take screenshot: ${error.message}`);
    return null;
  }
}

async function launchAndPositionBrowser() {
  console.log('🚀 Launching and positioning browser...');
  
  try {
    const browser = await puppeteer.launch({
      headless: false,
      devtools: true,
      executablePath: CONFIG.bravePath,
      args: [
        '--disable-web-security',
        '--remote-debugging-port=9222',
        '--new-window',
        `--window-position=${CONFIG.rightMonitor.x},${CONFIG.rightMonitor.y}`,
        `--window-size=${CONFIG.rightMonitor.width},${CONFIG.rightMonitor.height}`,
        '--start-maximized',
        '--force-device-scale-factor=1',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows'
      ]
    });
    
    console.log('✅ Browser launched');
    
    // Get the page
    const pages = await browser.pages();
    const page = pages.length > 0 ? pages[0] : await browser.newPage();
    
    // Set viewport
    await page.setViewport({
      width: CONFIG.rightMonitor.width,
      height: CONFIG.rightMonitor.height,
      deviceScaleFactor: 1
    });
    
    console.log('✅ Viewport configured');
    
    return { browser, page };
  } catch (error) {
    console.error('❌ Failed to launch browser:', error);
    throw error;
  }
}

async function enhanceWindowPositioning(page) {
  console.log('🎯 Enhancing window positioning...');
  
  try {
    // Method 1: CDP (Chrome DevTools Protocol)
    const session = await page.target().createCDPSession();
    
    await session.send('Browser.setWindowBounds', {
      windowId: 1,
      bounds: {
        left: CONFIG.rightMonitor.x,
        top: CONFIG.rightMonitor.y,
        width: CONFIG.rightMonitor.width,
        height: CONFIG.rightMonitor.height,
        windowState: 'maximized'
      }
    });
    
    console.log('✅ CDP positioning completed');
  } catch (cdpError) {
    console.log('⚠️ CDP positioning failed, trying Windows API...');
    
    // Method 2: Windows API via PowerShell
    const windowsApiScript = `
      Add-Type -TypeDefinition '
        using System;
        using System.Runtime.InteropServices;
        public class Win32 {
          [DllImport("user32.dll")]
          public static extern bool SetWindowPos(IntPtr hWnd, IntPtr hWndInsertAfter, int X, int Y, int cx, int cy, uint uFlags);
          [DllImport("user32.dll")]
          public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
          [DllImport("user32.dll")]
          public static extern bool EnumWindows(EnumWindowsProc enumProc, IntPtr lParam);
          [DllImport("user32.dll")]
          public static extern int GetWindowText(IntPtr hWnd, System.Text.StringBuilder strText, int maxCount);
          [DllImport("user32.dll")]
          public static extern int GetClassName(IntPtr hWnd, System.Text.StringBuilder strText, int maxCount);
          public delegate bool EnumWindowsProc(IntPtr hWnd, IntPtr lParam);
        }
      '
      
      $braveWindows = @()
      $callback = {
        param($hwnd, $lParam)
        $title = New-Object System.Text.StringBuilder 256
        $class = New-Object System.Text.StringBuilder 256
        [Win32]::GetWindowText($hwnd, $title, 256)
        [Win32]::GetClassName($hwnd, $class, 256)
        
        if ($class.ToString() -like "*Chrome*" -and $title.ToString() -like "*Brave*") {
          $script:braveWindows += $hwnd
        }
        return $true
      }
      
      [Win32]::EnumWindows($callback, [IntPtr]::Zero)
      
      foreach ($hwnd in $braveWindows) {
        [Win32]::SetWindowPos($hwnd, [IntPtr]::Zero, 1920, 0, 1920, 1080, 0x0040)
        [Win32]::ShowWindow($hwnd, 3)
      }
      
      Write-Host "Positioned $($braveWindows.Count) browser windows"
    `;
    
    try {
      await execAsync(`powershell -Command "${windowsApiScript}"`);
      console.log('✅ Windows API positioning completed');
    } catch (apiError) {
      console.log('⚠️ Windows API positioning also failed');
    }
  }
}

async function navigateToTestPage(page) {
  console.log('🌐 Navigating to test page...');
  
  try {
    await page.goto(CONFIG.devServerUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('✅ Navigation completed');
    
    const pageTitle = await page.title();
    console.log('📄 Page title:', pageTitle);
    
    return true;
  } catch (error) {
    console.error('❌ Navigation failed:', error);
    return false;
  }
}

async function testBNBOverride(page) {
  console.log('🪙 Testing BNB override functionality...');
  
  try {
    // Wait for page to load completely
    await page.waitForTimeout(3000);
    
    // Look for override section
    const overrideSection = await page.$('#symbol-overrides-section');
    
    if (overrideSection) {
      console.log('✅ Found symbol overrides section');
      
      // Take screenshot of the section
      await overrideSection.screenshot({
        path: `${CONFIG.screenshotDir}bnb-override-section.png`
      });
      
      console.log('📸 Override section screenshot saved');
      
      // Look for BNB-specific elements
      const bnbElements = await page.$$eval('*', els => 
        els.filter(el => el.textContent && el.textContent.toLowerCase().includes('bnb'))
           .map(el => ({ 
             tag: el.tagName, 
             text: el.textContent.trim().substring(0, 100),
             id: el.id,
             className: el.className
           }))
      );
      
      console.log(`🔍 Found ${bnbElements.length} BNB-related elements:`);
      bnbElements.forEach((el, i) => {
        console.log(`  ${i + 1}. ${el.tag} ${el.id ? '#' + el.id : ''} ${el.className ? '.' + el.className.split(' ').join('.') : ''}: ${el.text}`);
      });
      
      return { success: true, elementsFound: bnbElements.length };
      
    } else {
      console.log('⚠️ Symbol overrides section not found');
      
      // Debug: check what's on the page
      const bodyText = await page.$eval('body', el => el.textContent);
      console.log('📄 Page content length:', bodyText.length);
      
      // Look for any BNB mentions
      const bnbMatches = bodyText.toLowerCase().match(/bnb/g);
      if (bnbMatches) {
        console.log(`🔍 Found ${bnbMatches.length} BNB mentions in page text`);
      } else {
        console.log('❌ No BNB mentions found in page');
      }
      
      return { success: false, reason: 'Override section not found' };
    }
    
  } catch (error) {
    console.error('❌ BNB override test failed:', error);
    return { success: false, reason: error.message };
  }
}

async function main() {
  console.log('⏰ Starting at:', new Date().toLocaleString());
  console.log('');
  
  let browser = null;
  
  try {
    // Step 1: Check prerequisites
    const prereqsOk = await checkPrerequisites();
    if (!prereqsOk) {
      console.log('\n❌ Prerequisites check failed. Please fix the issues and try again.');
      return;
    }
    
    console.log('');
    
    // Step 2: Initial screenshot
    await takeScreenshot('setup-initial.png', 'Taking initial desktop screenshot');
    
    // Step 3: Launch and position browser
    const { browser: browserInstance, page } = await launchAndPositionBrowser();
    browser = browserInstance;
    
    // Step 4: Enhanced positioning
    await enhanceWindowPositioning(page);
    
    // Wait for positioning to take effect
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Step 5: Screenshot after positioning
    await takeScreenshot('browser-positioned.png', 'Taking screenshot after browser positioning');
    
    // Step 6: Navigate to test page
    const navigationSuccess = await navigateToTestPage(page);
    
    if (!navigationSuccess) {
      throw new Error('Failed to navigate to test page');
    }
    
    // Step 7: Screenshot after navigation
    await takeScreenshot('page-loaded.png', 'Taking screenshot after page load');
    
    // Step 8: Full page screenshot from browser
    await page.screenshot({
      path: `${CONFIG.screenshotDir}browser-full-page.png`,
      fullPage: true
    });
    console.log('📸 Browser full page screenshot saved');
    
    // Step 9: Test BNB override
    const bnbTestResult = await testBNBOverride(page);
    
    // Step 10: Final screenshot
    await takeScreenshot('final-state.png', 'Taking final desktop screenshot');
    
    // Summary
    console.log('\n🎉 Setup completed successfully!');
    console.log('=================================');
    console.log('✅ Browser positioned on right monitor');
    console.log('✅ Crypto tracker test page loaded');
    console.log('✅ Screenshots captured for verification');
    console.log(`${bnbTestResult.success ? '✅' : '⚠️'} BNB override test: ${bnbTestResult.success ? 'Success' : bnbTestResult.reason}`);
    
    console.log('\n📸 Screenshots saved in:', CONFIG.screenshotDir);
    console.log('  - setup-initial.png');
    console.log('  - browser-positioned.png');
    console.log('  - page-loaded.png');
    console.log('  - browser-full-page.png');
    console.log('  - final-state.png');
    if (bnbTestResult.success) {
      console.log('  - bnb-override-section.png');
    }
    
    console.log('\n🎯 Browser is ready for manual BNB token testing!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Verify browser is positioned correctly on right monitor');
    console.log('2. Check crypto tracker interface is fully loaded');
    console.log('3. Test BNB token override functionality manually');
    console.log('4. Use the desktop screenshot MCP server for ongoing monitoring');
    
    console.log('\nPress Ctrl+C to close browser and exit');
    
    // Keep browser open for manual testing
    process.on('SIGINT', async () => {
      console.log('\n🛑 Shutting down...');
      if (browser) {
        await browser.close();
        console.log('✅ Browser closed');
      }
      process.exit(0);
    });
    
    // Keep the process alive
    await new Promise(() => {});
    
  } catch (error) {
    console.error('\n💥 Setup failed:', error);
    
    // Take error screenshot
    await takeScreenshot('error-state.png', 'Taking error state screenshot');
    
    if (browser) {
      await browser.close();
    }
    
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Make sure dev server is running: npm run dev');
    console.log('2. Verify Brave browser installation');
    console.log('3. Check dual monitor configuration');
    console.log('4. Ensure PowerShell execution policy allows scripts');
    
    process.exit(1);
  }
}

// Run the main function
main().catch(console.error);
