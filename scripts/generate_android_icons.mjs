import sharp from 'sharp';
import { promises as fs } from 'fs';
import path from 'path';

const iconSizes = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

async function generateIcons(inputPath, { flavor } = {}) {
  const baseResFolder = flavor ? `./android/app/src/${flavor}/res` : './android/app/src/main/res';
  const androidResPath = path.resolve(baseResFolder);
  
  try {
    // Ensure the res directory exists
    await fs.mkdir(androidResPath, { recursive: true });
    
    // Generate icons for all density folders
    for (const [folder, size] of Object.entries(iconSizes)) {
      const outputDir = path.join(androidResPath, folder);
      await fs.mkdir(outputDir, { recursive: true });
      
      // Generate regular launcher icon
      await sharp(inputPath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .png()
        .toFile(path.join(outputDir, 'ic_launcher.png'));
      
      // Generate round launcher icon
      const roundSize = size;
      const canvas = sharp({
        create: {
          width: roundSize,
          height: roundSize,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        }
      });
      
      const circle = Buffer.from(
        `<svg width="${roundSize}" height="${roundSize}">
          <defs>
            <clipPath id="circle">
              <circle cx="${roundSize/2}" cy="${roundSize/2}" r="${roundSize/2}"/>
            </clipPath>
          </defs>
        </svg>`
      );
      
      await sharp(inputPath)
        .resize(roundSize, roundSize, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 }
        })
        .composite([{
          input: circle,
          blend: 'dest-in'
        }])
        .png()
        .toFile(path.join(outputDir, 'ic_launcher_round.png'));
      
      console.log(`Generated icons for ${folder} (${size}x${size})`);
    }
    
    // Copy the original icon to branding folder for reference
    const brandingDir = path.resolve('./android/app/src/main/branding');
    await fs.mkdir(brandingDir, { recursive: true });
    await sharp(inputPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .png()
      .toFile(path.join(brandingDir, 'logo.png'));
    
    console.log('✅ Android icons generated successfully!');
    console.log(`📁 Icons saved to: ${androidResPath}`);
    
  } catch (error) {
    console.error('❌ Error generating icons:', error);
    process.exit(1);
  }
}

// Get input file from command line arguments
const args = process.argv.slice(2);
const inputFile = args[0];
let flavorArg = null;
for (let i = 1; i < args.length; i++) {
  const a = args[i];
  if (a === '--flavor' && args[i + 1]) {
    flavorArg = args[i + 1];
    i++;
  } else if (a.startsWith('--flavor=')) {
    flavorArg = a.split('=')[1];
  }
}

if (!inputFile) {
  console.error('❌ Please provide an input image file path');
  console.error('Usage: node generate_android_icons.mjs <input-image-path> [--flavor host|user]');
  process.exit(1);
}

if (flavorArg && !['host', 'user', 'main'].includes(flavorArg)) {
  console.error('❌ Invalid flavor. Use: host | user | main');
  process.exit(1);
}

console.log(`🚀 Generating Android icons from: ${inputFile}${flavorArg ? ` (flavor: ${flavorArg})` : ''}`);
generateIcons(inputFile, { flavor: flavorArg === 'main' ? null : flavorArg });