import sharp from "sharp";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 128];
const svgPath = path.join(__dirname, "../src/assets/icon.svg");
const outputDir = path.join(__dirname, "../public/icons");

// 아이콘 디렉토리 생성
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// SVG 내용 (위의 SVG를 사용)
const svgContent = `<svg width="128" height="128" viewBox="0 0 128 128" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="64" cy="64" r="60" fill="#F8FAFC" stroke="#2563EB" stroke-width="4"/>
  <rect x="24" y="40" width="20" height="48" rx="2" fill="#2563EB"/>
  <rect x="26" y="42" width="16" height="4" fill="#F8FAFC" opacity="0.5"/>
  <rect x="54" y="52" width="20" height="36" rx="2" fill="#F59E0B"/>
  <rect x="56" y="54" width="16" height="4" fill="#F8FAFC" opacity="0.5"/>
  <rect x="84" y="64" width="20" height="24" rx="2" fill="#10B981"/>
  <rect x="86" y="66" width="16" height="4" fill="#F8FAFC" opacity="0.5"/>
  <path d="M64 20 L74 35 L69 35 L69 45 L59 45 L59 35 L54 35 Z" fill="#F59E0B"/>
  <path d="M38 30 L40.5 35 L46 35 L41.5 38.5 L43.5 43.5 L38 40 L32.5 43.5 L34.5 38.5 L30 35 L35.5 35 Z" fill="#F59E0B" opacity="0.8"/>
  <line x1="20" y1="88" x2="108" y2="88" stroke="#2563EB" stroke-width="2" stroke-linecap="round"/>
</svg>`;

// 각 크기별로 PNG 생성
async function generateIcons() {
  const svgBuffer = Buffer.from(svgContent);

  for (const size of sizes) {
    try {
      await sharp(svgBuffer)
        .resize(size, size)
        .png()
        .toFile(path.join(outputDir, `icon-${size}.png`));

      console.log(`✅ Generated icon-${size}.png`);
    } catch (error) {
      console.error(`❌ Error generating icon-${size}.png:`, error);
    }
  }
}

generateIcons().then(() => {
  console.log("🎨 Icon generation complete!");
});
