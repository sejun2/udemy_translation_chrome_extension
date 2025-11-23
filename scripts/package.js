const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const DIST_DIR = path.join(__dirname, '../dist');
const OUTPUT_ZIP = path.join(__dirname, '../udemy-subtitle-translator.zip');

console.log('📦 Creating distribution package for Chrome Web Store...\n');

// Check if dist directory exists
if (!fs.existsSync(DIST_DIR)) {
  console.error('❌ Error: dist directory not found. Please run "npm run build" first.');
  process.exit(1);
}

// Check for required files
const requiredFiles = [
  'manifest.json',
  'content.js',
  'popup.js',
  'popup.html',
  'popup.css',
  'background.js'
];

const missingFiles = [];
requiredFiles.forEach(file => {
  if (!fs.existsSync(path.join(DIST_DIR, file))) {
    missingFiles.push(file);
  }
});

if (missingFiles.length > 0) {
  console.error('❌ Error: Missing required files in dist directory:');
  missingFiles.forEach(file => console.error(`   - ${file}`));
  process.exit(1);
}

// Check for icons
const iconFiles = ['icon16.png', 'icon48.png', 'icon128.png'];
const missingIcons = iconFiles.filter(icon => !fs.existsSync(path.join(DIST_DIR, icon)));

if (missingIcons.length > 0) {
  console.warn('⚠️  Warning: Missing icon files:');
  missingIcons.forEach(icon => console.warn(`   - ${icon}`));
  console.warn('\n   You need to add these icons before submitting to Chrome Web Store.');
  console.warn('   See STORE_LISTING.md for icon requirements.\n');
}

// Remove old zip if exists
if (fs.existsSync(OUTPUT_ZIP)) {
  fs.unlinkSync(OUTPUT_ZIP);
  console.log('🗑️  Removed old package file\n');
}

// Create zip file
try {
  console.log('📁 Files to be packaged:');
  const files = fs.readdirSync(DIST_DIR);
  files.forEach(file => {
    const stats = fs.statSync(path.join(DIST_DIR, file));
    const size = (stats.size / 1024).toFixed(2);
    console.log(`   ✓ ${file} (${size} KB)`);
  });
  console.log('');

  // Use zip command (works on macOS and Linux)
  if (process.platform === 'win32') {
    console.log('Creating zip file using PowerShell...');
    execSync(`powershell Compress-Archive -Path "${DIST_DIR}\\*" -DestinationPath "${OUTPUT_ZIP}"`, { stdio: 'inherit' });
  } else {
    console.log('Creating zip file...');
    execSync(`cd "${DIST_DIR}" && zip -r "${OUTPUT_ZIP}" .`, { stdio: 'inherit' });
  }

  const zipStats = fs.statSync(OUTPUT_ZIP);
  const zipSize = (zipStats.size / 1024).toFixed(2);

  console.log('\n✅ Package created successfully!');
  console.log(`📦 File: udemy-subtitle-translator.zip (${zipSize} KB)`);
  console.log(`📍 Location: ${OUTPUT_ZIP}\n`);

  // Final checklist
  console.log('📋 Before uploading to Chrome Web Store:\n');
  console.log('   1. ✓ Build completed');
  console.log('   2. ✓ Package created');
  if (missingIcons.length === 0) {
    console.log('   3. ✓ All icons included');
  } else {
    console.log('   3. ⚠️  Add missing icons to public/ and rebuild');
  }
  console.log('   4. ⏳ Prepare screenshots (see STORE_LISTING.md)');
  console.log('   5. ⏳ Host privacy policy online');
  console.log('   6. ⏳ Register Chrome Web Store developer account ($5)');
  console.log('   7. ⏳ Upload udemy-subtitle-translator.zip to Chrome Web Store\n');

  console.log('📚 See STORE_LISTING.md for detailed submission instructions.\n');

} catch (error) {
  console.error('❌ Error creating package:', error.message);
  process.exit(1);
}
