// Generates maskable-safe PWA icons: the existing artwork is centered at 80%
// scale on a solid brand background so the logo stays inside the central safe
// zone that Android launchers / maskable masks crop to.
//
// Usage: node scripts/generate-maskable-icons.mjs (run from the frontend root)
import sharp from 'sharp';

const BRAND_BG = '#059669'; // emerald-600 theme_color
const SAFE_SCALE = 0.8;

for (const size of [192, 512]) {
  const inner = Math.round(size * SAFE_SCALE);
  const icon = await sharp(`public/icons/icon-${size}.png`)
    .resize(inner, inner, {
      fit: 'contain',
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
  await sharp({
    create: { width: size, height: size, channels: 4, background: BRAND_BG },
  })
    .composite([{ input: icon, gravity: 'center' }])
    .png()
    .toFile(`public/icons/icon-maskable-${size}.png`);
  console.log(`Generated public/icons/icon-maskable-${size}.png`);
}