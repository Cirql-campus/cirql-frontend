import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create a simple white circle badge icon from the existing logo
// Badge icons must be monochrome (white on transparent)
async function generateBadge() {
  const logoPath = path.join(__dirname, '../public/icon-192.png');
  const outputPath = path.join(__dirname, '../public/icon-badge.png');

  await sharp(logoPath)
    .resize(96, 96)
    .toFile(outputPath.replace('.png', '-temp.png'));

  // Convert to white monochrome on transparent background
  await sharp(outputPath.replace('.png', '-temp.png'))
    .resize(96, 96)
    .threshold(128)
    .toFile(outputPath);

  try { fs.unlinkSync(outputPath.replace('.png', '-temp.png')); } catch {}
  
  console.log('Badge icon created: public/icon-badge.png');
}

generateBadge().catch(console.error);
