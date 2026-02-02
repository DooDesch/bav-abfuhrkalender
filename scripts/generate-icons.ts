/**
 * App Icon Generator Script
 *
 * Generates static PNG icons for favicon and PWA manifest.
 * Uses sharp for high-quality image generation with SVG input.
 *
 * Usage: pnpm generate-icons
 *
 * Generated files:
 * - public/favicon.png (32x32, fallback favicon)
 * - public/icon-192.png (192x192, PWA maskable)
 * - public/icon-512.png (512x512, PWA any purpose)
 *
 * Note: Next.js also dynamically generates icons via app/icon.tsx and app/apple-icon.tsx
 */

import sharp from 'sharp';
import path from 'path';
import { fileURLToPath } from 'url';

// Import shared icon configuration
// Note: We duplicate the values here because this script runs outside of Next.js
// and the @/ alias doesn't work. Keep in sync with lib/icons/recycle-icon.tsx
const LOGO_COLORS = {
  gradientFrom: '#22c55e', // green-500
  gradientTo: '#059669', // emerald-600
  iconColor: '#ffffff', // white
};

const RECYCLE_ICON_PATHS = `
  <path d="M7 19H4.815a1.83 1.83 0 0 1-1.57-.881 1.785 1.785 0 0 1-.004-1.784L7.196 9.5" />
  <path d="M11 19h8.203a1.83 1.83 0 0 0 1.556-.89 1.784 1.784 0 0 0 0-1.775l-1.226-2.12" />
  <path d="m14 16-3 3 3 3" />
  <path d="M8.293 13.596 7.196 9.5 3.1 10.598" />
  <path d="m9.344 5.811 1.093-1.892A1.83 1.83 0 0 1 11.985 3a1.784 1.784 0 0 1 1.546.888l3.943 6.843" />
  <path d="m13.378 9.633 4.096 1.098 1.097-4.096" />
`;

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '..', 'public');

/**
 * Generate SVG string for the logo at a given size
 */
function generateLogoSvg(size: number): string {
  const borderRadius = Math.round(size * 0.22); // PWA icons use smaller radius
  const iconSize = Math.round(size * 0.55);
  const iconOffset = (size - iconSize) / 2;

  return `
    <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:${LOGO_COLORS.gradientFrom}" />
          <stop offset="100%" style="stop-color:${LOGO_COLORS.gradientTo}" />
        </linearGradient>
      </defs>
      <rect width="${size}" height="${size}" rx="${borderRadius}" fill="url(#bg-gradient)" />
      <g transform="translate(${iconOffset}, ${iconOffset}) scale(${iconSize / 24})">
        <g fill="none" stroke="${LOGO_COLORS.iconColor}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          ${RECYCLE_ICON_PATHS}
        </g>
      </g>
    </svg>
  `;
}

/**
 * Generate a PNG icon at the specified size
 */
async function generateIcon(size: number, filename: string): Promise<void> {
  const svg = generateLogoSvg(size);
  const outputPath = path.join(publicDir, filename);

  await sharp(Buffer.from(svg)).png().toFile(outputPath);

  console.log(`Generated: ${filename} (${size}x${size})`);
}

/**
 * Generate a multi-size ICO favicon
 * Contains 16x16, 32x32, and 48x48 sizes
 */
async function generateFavicon(): Promise<void> {
  const sizes = [16, 32, 48];
  const buffers: Buffer[] = [];

  for (const size of sizes) {
    const svg = generateLogoSvg(size);
    const pngBuffer = await sharp(Buffer.from(svg)).png().toBuffer();
    buffers.push(pngBuffer);
  }

  // For ICO format, we'll just use the 32x32 PNG as favicon.png
  // Most modern browsers support PNG favicons
  const svg32 = generateLogoSvg(32);
  const outputPath = path.join(publicDir, 'favicon.png');
  await sharp(Buffer.from(svg32)).png().toFile(outputPath);

  console.log('Generated: favicon.png (32x32)');
}

/**
 * Main function - generates all required icons
 */
async function main(): Promise<void> {
  console.log('Generating app icons...\n');

  try {
    // Generate static favicon for public folder
    await generateFavicon();

    // Generate icons for manifest.ts (PWA)
    await generateIcon(192, 'icon-192.png');
    await generateIcon(512, 'icon-512.png');

    console.log('\nAll icons generated successfully!');
    console.log(`Output directory: ${publicDir}`);
  } catch (error) {
    console.error('Error generating icons:', error);
    process.exit(1);
  }
}

main();
