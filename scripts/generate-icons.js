const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [16, 48, 128];
const inputPath = path.join(__dirname, '../public/logo1.png');
const outputDir = path.join(__dirname, '../public');

async function generateIcons() {
  console.log('Generating icons from logo1.png...');

  // Check if input file exists
  if (!fs.existsSync(inputPath)) {
    console.error('Error: logo1.png not found in public directory');
    process.exit(1);
  }

  for (const size of sizes) {
    const outputPath = path.join(outputDir, `icon${size}.png`);

    try {
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(outputPath);

      console.log(`✓ Created icon${size}.png (${size}x${size})`);
    } catch (error) {
      console.error(`✗ Failed to create icon${size}.png:`, error.message);
      process.exit(1);
    }
  }

  console.log('\n✓ All icons generated successfully!');
}

generateIcons();
