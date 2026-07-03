import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const publicDir = path.join(__dirname, '../public');
const logoPath = path.join(publicDir, 'logo.png');

async function generate() {
  try {
    console.log(`Loading source logo from: ${logoPath}`);
    
    // Generate 192x192 icon
    await sharp(logoPath)
      .resize(192, 192, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(path.join(publicDir, 'icon-192.png'));
    console.log('Successfully generated public/icon-192.png');

    // Generate 512x512 icon
    await sharp(logoPath)
      .resize(512, 512, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      })
      .toFile(path.join(publicDir, 'icon-512.png'));
    console.log('Successfully generated public/icon-512.png');
  } catch (err) {
    console.error('Error generating icons:', err);
    process.exit(1);
  }
}

generate();
