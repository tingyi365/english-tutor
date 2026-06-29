// 本機真 Chrome 端到端驗 PWA：SW 啟用 / 離線秒開 / 安裝橫幅 / 0 console error
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8814;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml",
};
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/") p = "/index.html";
    const fp = normalize(join(ROOT, p));
    if (!fp.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const s = await stat(fp).catch(() => null);
    if (!s || !s.isFile()) { res.writeHead(404).end("nf"); return; }
    const buf = await readFile(fp);
    res.writeHead(200, { "Content-Type": TYPES[extname(fp)] || "application/octet-stream" });
    res.end(buf);
  } catch { res.writeHead(500).end(); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${PORT}/`;

const results = [];
const ok = (n, c, extra = "") => results.push({ n, pass: !!c, extra });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.goto(BASE, { waitUntil: "networkidle0" });
  // 1) 首頁渲染（renderHome 跑完才有 mode-card → 無致命錯誤）
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  ok("首頁 mode-card 渲染", true);

  // 2) manifest 連結 + 內容可解析 + icons 200
  const manifestHref = await page.$eval('link[rel="manifest"]', (l) => l.href);
  const man = await page.evaluate(async (h) => { const r = await fetch(h); return { status: r.status, json: await r.json() }; }, manifestHref);
  ok("manifest 可載入(200)+解析", man.status === 200 && man.json.name === "AI 英語口說老師");
  ok("manifest 有 standalone + icons", man.json.display === "standalone" && (man.json.icons || []).length >= 2);
  const iconStatuses = await page.evaluate(async (icons, base) => {
    const out = [];
    for (const ic of icons) { const r = await fetch(new URL(ic.src, base)); out.push(r.status); }
    return out;
  }, man.json.icons, manifestHref);
  ok("所有 icon 200", iconStatuses.every((s) => s === 200), iconStatuses.join(","));

  // 3) service worker 註冊並 activated
  const swState = await page.evaluate(async () => {
    const reg = await navigator.serviceWorker.ready;
    return reg.active ? reg.active.state : "none";
  });
  ok("SW 已 activated", swState === "activated", swState);
  const controlled = await page.evaluate(() => !!navigator.serviceWorker.controller);
  ok("頁面已被 SW 接管(controller)", controlled);

  // 4) 安裝橫幅：模擬 beforeinstallprompt → 橫幅出現 → 點安裝 → prompt 被呼叫 → 橫幅移除
  const banner = await page.evaluate(async () => {
    return await new Promise((resolve) => {
      let prompted = false;
      const ev = new Event("beforeinstallprompt");
      ev.prompt = () => { prompted = true; };
      ev.userChoice = Promise.resolve({ outcome: "accepted" });
      window.dispatchEvent(ev);
      setTimeout(() => {
        const el = document.getElementById("pwaInstall");
        const shown = !!el && el.classList.contains("show");
        const go = document.getElementById("pwaGo");
        if (go) go.click();
        setTimeout(() => resolve({ shown, prompted, removed: !document.getElementById("pwaInstall") }), 200);
      }, 150);
    });
  });
  ok("安裝橫幅出現", banner.shown);
  ok("點安裝觸發 prompt()", banner.prompted);
  ok("安裝後橫幅移除", banner.removed);

  // 5) 離線秒開：斷網 reload，仍由 SW 快取渲染 mode-card
  await page.setOfflineMode(true);
  await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
  const offlineOk = await page.waitForSelector(".mode-card", { timeout: 8000 }).then(() => true).catch(() => false);
  ok("離線 reload 仍可渲染(離線可用)", offlineOk);
  await page.setOfflineMode(false);

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== PWA 驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
