/**
 * Generate PWA icons for Angelina AI
 * Creates 192x192, 512x512, and maskable 512x512 PNGs
 * Uses sharp (if available) or falls back to writing raw SVG → PNG
 */

const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'public', 'icons');

// SVG template matching the Angelina logo (cyan diamond on dark bg)
function generateSVG(size, maskable = false) {
  const padding = maskable ? size * 0.2 : size * 0.1;
  const innerSize = size - padding * 2;
  const cx = size / 2;
  const cy = size / 2;
  const iconScale = innerSize / 24; // SVG viewBox is 24x24

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#0a0a0f"/>
      <stop offset="100%" stop-color="#141418"/>
    </linearGradient>
    <linearGradient id="iconGrad" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#00c8e8"/>
      <stop offset="100%" stop-color="#00a8b8"/>
    </linearGradient>
    <filter id="glow">
      <feGaussianBlur stdDeviation="${size * 0.02}" result="blur"/>
      <feFlood flood-color="#00c8e8" flood-opacity="0.4"/>
      <feComposite in2="blur" operator="in"/>
      <feMerge>
        <feMergeNode/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  ${maskable
    ? `<rect width="${size}" height="${size}" fill="url(#bg)"/>`
    : `<rect width="${size}" height="${size}" rx="${size * 0.18}" fill="url(#bg)"/>`
  }
  <g transform="translate(${cx - 12 * iconScale}, ${cy - 12 * iconScale}) scale(${iconScale})" filter="url(#glow)">
    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
          fill="none" stroke="url(#iconGrad)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;
}

// Write SVG files (these work as icons too, and we'll convert if possible)
const sizes = [
  { name: 'icon-192.png', size: 192, maskable: false },
  { name: 'icon-512.png', size: 512, maskable: false },
  { name: 'icon-maskable-512.png', size: 512, maskable: true },
];

async function main() {
  // Try to use sharp for proper PNG conversion
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.log('sharp not available, writing SVG files as fallback...');
  }

  for (const icon of sizes) {
    const svg = generateSVG(icon.size, icon.maskable);
    const svgPath = path.join(ICONS_DIR, icon.name.replace('.png', '.svg'));
    const pngPath = path.join(ICONS_DIR, icon.name);

    if (sharp) {
      // Convert SVG to PNG using sharp
      await sharp(Buffer.from(svg))
        .png()
        .toFile(pngPath);
      console.log(`✓ Generated ${icon.name} (${icon.size}x${icon.size})`);
    } else {
      // Write SVG as fallback — browsers accept SVG icons too
      fs.writeFileSync(svgPath, svg);
      // Also write a simple SVG renamed as .png for manifest compatibility
      // (Not ideal but works as fallback)
      fs.writeFileSync(pngPath.replace('.png', '.svg'), svg);
      console.log(`✓ Generated ${icon.name.replace('.png', '.svg')} (${icon.size}x${icon.size})`);
    }
  }

  // Always write SVGs for apple-touch-icon fallback
  for (const icon of sizes) {
    const svg = generateSVG(icon.size, icon.maskable);
    const svgPath = path.join(ICONS_DIR, icon.name.replace('.png', '.svg'));
    fs.writeFileSync(svgPath, svg);
  }

  console.log('\nDone! Icons generated in public/icons/');
}

main().catch(console.error);
