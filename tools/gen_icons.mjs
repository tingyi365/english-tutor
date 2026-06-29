// 用真 Chrome 把 SVG 光柵化成 PNG app icon（無 build step、不引入影像庫）
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { writeFileSync, mkdirSync } from "node:fs";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const OUT = "assets/icons";
mkdirSync(OUT, { recursive: true });

// any 用：圓角卡片 + 漸層 + 🗣️；maskable 用：滿版漸層 + 安全區內較小的圖示
function svg({ size, rounded, glyphScale }) {
  const r = rounded ? Math.round(size * 0.22) : 0;
  const fs = Math.round(size * glyphScale);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#6366f1"/>
      <stop offset="0.55" stop-color="#7c3aed"/>
      <stop offset="1" stop-color="#4f46e5"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="url(#g)"/>
  <text x="50%" y="50%" dominant-baseline="central" text-anchor="middle" font-size="${fs}">🗣️</text>
</svg>`;
}

const jobs = [
  { file: "icon-192.png", size: 192, rounded: true, glyphScale: 0.62 },
  { file: "icon-512.png", size: 512, rounded: true, glyphScale: 0.62 },
  { file: "icon-maskable-512.png", size: 512, rounded: false, glyphScale: 0.5 },
];

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  for (const j of jobs) {
    const page = await browser.newPage();
    await page.setViewport({ width: j.size, height: j.size, deviceScaleFactor: 1 });
    const html = `<!doctype html><html><head><meta charset="utf-8"><style>*{margin:0;padding:0}html,body{width:${j.size}px;height:${j.size}px}</style></head><body>${svg(j)}</body></html>`;
    await page.setContent(html, { waitUntil: "networkidle0" });
    const buf = await page.screenshot({ type: "png", omitBackground: false, clip: { x: 0, y: 0, width: j.size, height: j.size } });
    writeFileSync(`${OUT}/${j.file}`, buf);
    console.log("wrote", j.file, buf.length, "bytes");
    await page.close();
  }
} finally {
  await browser.close();
}
