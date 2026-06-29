// 本機真 Chrome 端到端驗「發音回饋核心：逐音 drill」：
// 注入假 SpeechRecognition → 走真實 mic→evaluate→drill 渲染路徑（非只看檔案在）。
// 0 console error / 375px 手機 / 錯字出 drill+提示+重聽鈕 / 全對不出 drill。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8816;
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

  // 注入假 STT（在頁面腳本前）：start() 後依 window.__FAKE_TRANSCRIPT__ 回一筆 final 結果
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("onboarded", "1"); } catch (e) {}
    class FakeSR {
      constructor() { this.lang = ""; this.continuous = false; this.interimResults = true; this.maxAlternatives = 3; }
      start() {
        setTimeout(() => {
          const transcript = window.__FAKE_TRANSCRIPT__ || "";
          const results = { 0: { 0: { transcript, confidence: 0.9 }, isFinal: true, length: 1 }, length: 1 };
          if (this.onresult) this.onresult({ resultIndex: 0, results });
          if (this.onend) this.onend();
        }, 20);
      }
      stop() { if (this.onend) this.onend(); }
      abort() {}
    }
    window.SpeechRecognition = FakeSR;
    window.webkitSpeechRecognition = FakeSR;
  });

  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  ok("首頁 mode-card 渲染（無致命錯誤）", true);

  // 進跟讀糾音
  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#sentence", { timeout: 8000 });
  await page.waitForSelector("#micBtn:not([disabled])", { timeout: 8000 });
  ok("假 STT 注入後 mic 可用（speechSupport.stt=true）", true);

  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));
  ok("跟讀句子已渲染", target.length > 0, target.slice(0, 40));

  // === 案例 A：唸錯（只唸第一個字）→ 應出 drill 卡 + 提示 + 重聽鈕 ===
  const firstWord = target.split(" ")[0];
  await page.evaluate((t) => { window.__FAKE_TRANSCRIPT__ = t; }, firstWord);
  await page.click("#micBtn");
  await page.waitForSelector("#result .ring", { timeout: 8000 });
  ok("評分結果(分數環)出現", true);
  const drill = await page.evaluate(() => {
    const card = document.querySelector(".drill-card");
    if (!card) return { has: false };
    const items = [...card.querySelectorAll(".drill-item")];
    return {
      has: true, count: items.length,
      allTip: items.every((i) => (i.querySelector(".drill-tip")?.textContent || "").trim().length > 0),
      allSay: items.every((i) => i.querySelector(".drill-say")),
      allSlow: items.every((i) => i.querySelector(".drill-slow")),
      words: items.map((i) => i.querySelector(".drill-w")?.textContent),
    };
  });
  ok("唸錯 → 出現逐音 drill 卡", drill.has);
  ok("drill 數量 1~4（小批次）", drill.count >= 1 && drill.count <= 4, String(drill.count));
  ok("每個 drill 都有音素提示", drill.allTip);
  ok("每個 drill 都有 🔊正常 / 🐢慢速 重聽鈕", drill.allSay && drill.allSlow);
  ok("錯字標紅/漏字標黃（句子上色）", await page.evaluate(() => !!document.querySelector("#sentence .w-miss, #sentence .w-bad")), drill.words.join(","));

  // 點「慢速」重聽單字示範 — 不應丟錯
  const slowClick = await page.evaluate(() => {
    const b = document.querySelector(".drill-slow");
    if (!b) return false;
    b.click(); return true;
  });
  ok("點 🐢慢速 重聽單字（無錯誤）", slowClick);
  await new Promise((r) => setTimeout(r, 200));

  // === 案例 B：全對 → 不應出 drill 卡（不增無謂負擔）===
  await page.click('.tab[data-route="home"]');
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#micBtn:not([disabled])", { timeout: 8000 });
  const target2 = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));
  await page.evaluate((t) => { window.__FAKE_TRANSCRIPT__ = t; }, target2);
  await page.click("#micBtn");
  await page.waitForSelector("#result .ring", { timeout: 8000 });
  const noDrill = await page.evaluate(() => !document.querySelector(".drill-card"));
  ok("全對 → 不出 drill 卡", noDrill);

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 發音回饋核心(逐音 drill) 驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
