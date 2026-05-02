// Run this script to generate PWA icons from the SVG
// Requires: npm install sharp (one-time)
// Usage: node scripts/generate-icons.js

const fs = require("fs");
const path = require("path");

async function generate() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.log("sharp not installed. Using SVG fallback icons instead.");
    console.log("To generate PNG icons: npm install sharp && node scripts/generate-icons.js");

    // Create simple PNG-like SVGs as fallback
    const sizes = [192, 512];
    for (const size of sizes) {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs><linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#6366f1"/><stop offset="100%" stop-color="#8b5cf6"/></linearGradient></defs>
  <rect width="${size}" height="${size}" rx="${Math.round(size * 0.2)}" fill="url(#g)"/>
  <text x="${size / 2}" y="${size * 0.625}" text-anchor="middle" font-family="system-ui" font-size="${Math.round(size * 0.47)}" font-weight="800" fill="white">₹</text>
</svg>`;
      fs.writeFileSync(path.join(__dirname, "..", "public", "icons", `icon-${size}.svg`), svg);
      console.log(`Created icon-${size}.svg`);
    }
    return;
  }

  const svgPath = path.join(__dirname, "..", "public", "icons", "icon-192.svg");
  const svg = fs.readFileSync(svgPath);

  for (const size of [192, 512]) {
    await sharp(svg).resize(size, size).png().toFile(
      path.join(__dirname, "..", "public", "icons", `icon-${size}.png`)
    );
    console.log(`Generated icon-${size}.png`);
  }
}

generate();
