// 本機真 Chrome 端到端驗「連續保護（streak freeze）」：漏一天不歸零、自動補回缺口、持續練習自動賺保護。
// 走真實模組 addStat→bumpDaily→localStorage 路徑（dynamic import 既載入的 app.js，非另寫一份邏輯）＋首頁真實渲染。
// 0 console error / 375px 手機。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8826;
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
const tap = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); }, sel);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  await page.evaluateOnNewDocument(() => { try { localStorage.setItem("onboarded", "1"); } catch (e) {} });

  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  ok("首頁渲染（無致命錯誤）", true);

  // 在 page 內注入工具：用同一份日期格式產生 昨天/前天/N天前 的 key；直接打 app.js 真實 addStat。
  await page.evaluate(() => {
    const pad = (n) => String(n).padStart(2, "0");
    window.__keyOf = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
    window.__app = null;
  });
  // dynamic import 取得既載入的 app.js 真實 exports（同 URL = 同一模組實例）
  const imported = await page.evaluate(async () => {
    try { window.__app = await import("/assets/js/app.js"); return Object.keys(window.__app).includes("addStat") && "freezesToNext" in window.__app; }
    catch (e) { return "ERR:" + e.message; }
  });
  ok("能取得 app.js 真實模組（addStat/freezesToNext export）", imported === true, String(imported));

  // 共用：設定 streak 狀態 + 清掉今天的 daily/toast → 跑一次真實練習 → 回讀結果
  const runCase = (streak, dailyOffsetIsOld = true) => page.evaluate((streak, dailyOffsetIsOld) => {
    // 移除舊 toast
    document.querySelectorAll(".celebrate-toast").forEach((t) => t.remove());
    localStorage.setItem("streak", JSON.stringify(streak));
    // 確保 daily 不是今天（讓今天首次練習觸發 bump；count 也歸零）
    localStorage.setItem("daily", JSON.stringify({ date: "1999-01-01", count: 0, celebrated: false }));
    window.__app.addStat({ practiced: 1 });
    const s = JSON.parse(localStorage.getItem("streak") || "{}");
    const toast = document.querySelector(".celebrate-toast");
    return { count: s.count, best: s.best, freezes: s.freezes, lastDay: s.lastDay,
      toast: toast ? toast.textContent : "" };
  }, streak, dailyOffsetIsOld);

  const Y = await page.evaluate(() => window.__keyOf(-1));   // 昨天
  const D2 = await page.evaluate(() => window.__keyOf(-2));  // 前天（漏掉昨天一天）
  const D3 = await page.evaluate(() => window.__keyOf(-3));  // 3 天前（漏 2 天）

  // 1) 正常接續（昨天有練）：count 4→5，未動保護
  let r = await runCase({ count: 4, best: 9, lastDay: Y, freezes: 0 });
  ok("昨天有練→連續+1（4→5）", r.count === 5, JSON.stringify(r));
  ok("正常接續不動用保護（freezes 0）", r.freezes === 0, `freezes=${r.freezes}`);

  // 2) 漏一天 + 有保護 → 補回缺口、連續不歸零、消耗 1 張、跳安心 toast
  r = await runCase({ count: 4, best: 9, lastDay: D2, freezes: 1 });
  ok("漏一天有保護→連續保住不歸零（4→5，非 1）", r.count === 5, `count=${r.count}`);
  ok("動用保護消耗 1 張（1→0）", r.freezes === 0, `freezes=${r.freezes}`);
  ok("動用保護跳『🛡️ 連續保護生效』安心回饋", /連續保護生效/.test(r.toast) && r.toast.includes("🛡️"), r.toast.slice(0, 24));

  // 3) 漏一天 + 無保護 → 連續歸零重新開始
  r = await runCase({ count: 8, best: 12, lastDay: D2, freezes: 0 });
  ok("漏一天無保護→連續歸零重來（→1）", r.count === 1, `count=${r.count}`);
  ok("歸零保留最佳紀錄（best 不變）", r.best === 12, `best=${r.best}`);

  // 4) 漏 2 天 + 有保護 → 保護只擋一天，仍歸零、保護不被消耗
  r = await runCase({ count: 8, best: 12, lastDay: D3, freezes: 2 });
  ok("漏 2 天即使有保護也歸零（保護只擋一天）", r.count === 1, `count=${r.count}`);
  ok("漏 2 天不消耗保護（仍 2 張）", r.freezes === 2, `freezes=${r.freezes}`);

  // 5) 持續練習自動賺保護：count 2→3（滿 3 天）→ +1 張
  r = await runCase({ count: 2, best: 5, lastDay: Y, freezes: 0 });
  ok("連續滿 3 天自動賺 1 張保護（freezes 0→1）", r.freezes === 1 && r.count === 3, JSON.stringify(r));

  // 6) 保護上限：已 2 張，count 5→6（滿 3 天）也不超過 MAX_FREEZE
  r = await runCase({ count: 5, best: 9, lastDay: Y, freezes: 2 });
  ok("保護達上限 2 張不再溢出（仍 2）", r.freezes === 2 && r.count === 6, JSON.stringify(r));

  // 7) 同一天重複練習不重複 bump（streak 不變）
  await page.evaluate(() => {
    document.querySelectorAll(".celebrate-toast").forEach((t) => t.remove());
    const s = JSON.parse(localStorage.getItem("streak"));
    window.__app.addStat({ practiced: 1 }); // 第二次（lastDay 已是今天）
    window.__beforeCount = s.count;
  });
  const dbl = await page.evaluate(() => JSON.parse(localStorage.getItem("streak")));
  ok("同一天再練不重複累加連續天數", dbl.count === 6, `count=${dbl.count}`);

  // 8) getStreak 回傳含 freezes 欄位
  const gs = await page.evaluate(() => window.__app.getStreak());
  ok("getStreak() 回傳含 freezes 欄位", typeof gs.freezes === "number", JSON.stringify(gs));

  // 9) 首頁顯示「連續保護 ×N」（有保護時）
  await page.evaluate(() => { localStorage.setItem("streak", JSON.stringify({ count: 6, best: 9, lastDay: window.__keyOf(0), freezes: 2 })); });
  await tap(page, '.tab[data-route="home"]');
  await page.waitForSelector(".daily-card", { timeout: 8000 });
  const hasFreeze = await page.evaluate(() => {
    const e = document.querySelector(".streak-freeze.has");
    return { present: !!e, txt: e ? e.textContent.replace(/\s+/g, " ").trim() : "" };
  });
  ok("首頁顯示『🛡️ 連續保護 ×N』狀態列", hasFreeze.present && /連續保護 ×2/.test(hasFreeze.txt), hasFreeze.txt.slice(0, 40));

  // 10) 首頁顯示「再 X 天解鎖連續保護」（無保護、連續>0 時的動力提示）
  await page.evaluate(() => { localStorage.setItem("streak", JSON.stringify({ count: 4, best: 9, lastDay: window.__keyOf(0), freezes: 0 })); });
  await tap(page, '.tab[data-route="shadowing"]');
  await page.waitForSelector("#sentence", { timeout: 8000 });
  await tap(page, '.tab[data-route="home"]');
  await page.waitForSelector(".daily-card", { timeout: 8000 });
  const toNext = await page.evaluate(() => {
    const e = document.querySelector(".streak-freeze:not(.has)");
    return { present: !!e, txt: e ? e.textContent.replace(/\s+/g, " ").trim() : "" };
  });
  ok("首頁顯示『再 X 天解鎖連續保護』動力提示", toNext.present && /再 \d+ 天解鎖/.test(toNext.txt), toNext.txt.slice(0, 40));

  // 11) 清除學習進度後 streak（含 freezes）一併清掉
  await page.evaluate(() => localStorage.removeItem("streak"));
  const cleared = await page.evaluate(() => window.__app.getStreak());
  ok("清除進度後 freezes 歸 0、連續歸 0", cleared.freezes === 0 && cleared.count === 0, JSON.stringify(cleared));

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 連續保護（streak freeze）真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
