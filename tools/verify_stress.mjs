// 本機真 Chrome 端到端驗「發音回饋核心：音節 + 重音標記」：
// 注入假 SpeechRecognition → 走真實 mic→evaluate→drill 渲染路徑（非只看檔案在）。
// 固定第一句(含 morning/today)、空 transcript 逼出 drill → 驗每個多音節字的音節 chip + 唯一重音節 + 指引文案。
// 0 console error / 375px 手機。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8817;
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

  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("onboarded", "1"); localStorage.setItem("shadowIdx", "0"); } catch (e) {}
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

  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#sentence", { timeout: 8000 });
  await page.waitForSelector("#micBtn:not([disabled])", { timeout: 8000 });
  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));
  ok("固定到含 morning/today 的句子", /morning/i.test(target) && /today/i.test(target), target);

  // 只唸第一個字 → 其餘漏唸 → 逼出 drill（含多音節字 morning）
  await page.evaluate((t) => { window.__FAKE_TRANSCRIPT__ = t.split(" ")[0]; }, target);
  await page.click("#micBtn");
  await page.waitForSelector("#result .ring", { timeout: 8000 });
  await page.waitForSelector(".drill-card", { timeout: 8000 });
  ok("唸錯 → 出現逐音 drill 卡", true);

  // 收集每個 drill item 的字 + 音節卡資訊
  const items = await page.evaluate(() => {
    return [...document.querySelectorAll(".drill-card .drill-item")].map((it) => {
      const syl = it.querySelector(".drill-syl");
      const chips = syl ? [...syl.querySelectorAll(".syl-chip")].map((c) => ({ t: c.textContent, stress: c.classList.contains("syl-stress") })) : null;
      return {
        word: (it.querySelector(".drill-w")?.textContent || "").trim(),
        hasSyl: !!syl,
        chips,
        stressCount: syl ? syl.querySelectorAll(".syl-stress").length : 0,
        tip: syl ? (syl.querySelector(".syl-tip")?.textContent || "") : "",
      };
    });
  });

  const find = (w) => items.find((i) => i.word.toLowerCase() === w);

  // morning → ["morn","ing"]，重音第一節 "morn"
  const m = find("morning");
  ok("morning 有音節卡", m && m.hasSyl, JSON.stringify(m));
  ok("morning 音節 = morn·ing", m && m.chips && m.chips.map((c) => c.t).join("·") === "morn·ing", m && JSON.stringify(m.chips));
  ok("morning 唯一重音節 = morn", m && m.stressCount === 1 && m.chips.find((c) => c.stress)?.t === "morn", m && JSON.stringify(m.chips));
  ok("morning 指引文案含『重音在第一音節「morn」』", m && /重音在.*第一音節.*morn/.test(m.tip), m && m.tip);

  // 所有有音節卡的 item：恰一個重音節 + chip 拼回原字
  const sylItems = items.filter((i) => i.hasSyl);
  ok("有音節卡的字皆恰 1 個重音節", sylItems.length > 0 && sylItems.every((i) => i.stressCount === 1), sylItems.map((i) => i.word + ":" + i.stressCount).join(","));
  ok("音節 chip 拼回 = 原字（不漏不增）", sylItems.every((i) => i.chips.map((c) => c.t).join("") === i.word.toLowerCase().replace(/[^a-z]/g, "")), sylItems.map((i) => i.word + "=" + i.chips.map((c) => c.t).join("")).join(","));

  // 單音節字（如 good/how/are/you）不顯示音節卡
  const monos = items.filter((i) => ["good", "how", "are", "you"].includes(i.word.toLowerCase()));
  ok("單音節字不顯示音節卡（不增負擔）", monos.length === 0 || monos.every((i) => !i.hasSyl), monos.map((i) => i.word + ":" + i.hasSyl).join(","));

  // 點重音節示範音不丟錯（沿用既有 🐢慢速鈕）
  const slowClick = await page.evaluate(() => { const b = document.querySelector(".drill-slow"); if (!b) return false; b.click(); return true; });
  ok("點 🐢慢速 重聽單字（無錯誤）", slowClick);
  await new Promise((r) => setTimeout(r, 150));

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 音節 + 重音標記 真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
