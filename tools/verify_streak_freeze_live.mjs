// 線上正式站真機驗「連續保護（streak freeze）」：漏一天不歸零、自動補回缺口、持續練習自動賺保護。
// 直接打 https://english-tutor-ai.pages.dev，dynamic import 線上 app.js 真實 addStat→bumpDaily 路徑。0 console error / 375px。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://english-tutor-ai.pages.dev/";

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
  await page.waitForSelector(".mode-card", { timeout: 12000 });
  ok("線上首頁渲染（無致命錯誤）", true);

  await page.evaluate(() => {
    const pad = (n) => String(n).padStart(2, "0");
    window.__keyOf = (offset) => { const d = new Date(); d.setDate(d.getDate() + offset);
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  });
  const imported = await page.evaluate(async () => {
    try { window.__app = await import("/assets/js/app.js"); return "freezesToNext" in window.__app && "addStat" in window.__app; }
    catch (e) { return "ERR:" + e.message; }
  });
  ok("取得線上 app.js 真實模組", imported === true, String(imported));

  const runCase = (streak) => page.evaluate((streak) => {
    document.querySelectorAll(".celebrate-toast").forEach((t) => t.remove());
    localStorage.setItem("streak", JSON.stringify(streak));
    localStorage.setItem("daily", JSON.stringify({ date: "1999-01-01", count: 0, celebrated: false }));
    window.__app.addStat({ practiced: 1 });
    const s = JSON.parse(localStorage.getItem("streak") || "{}");
    const toast = document.querySelector(".celebrate-toast");
    return { count: s.count, best: s.best, freezes: s.freezes, toast: toast ? toast.textContent : "" };
  }, streak);

  const Y = await page.evaluate(() => window.__keyOf(-1));
  const D2 = await page.evaluate(() => window.__keyOf(-2));
  const D3 = await page.evaluate(() => window.__keyOf(-3));

  let r = await runCase({ count: 4, best: 9, lastDay: D2, freezes: 1 });
  ok("漏一天有保護→連續保住不歸零（4→5）", r.count === 5, `count=${r.count}`);
  ok("動用保護消耗 1 張（1→0）", r.freezes === 0, `freezes=${r.freezes}`);
  ok("動用保護跳『🛡️ 連續保護生效』回饋", /連續保護生效/.test(r.toast), r.toast.slice(0, 20));

  r = await runCase({ count: 8, best: 12, lastDay: D2, freezes: 0 });
  ok("漏一天無保護→歸零重來（→1）", r.count === 1, `count=${r.count}`);

  r = await runCase({ count: 8, best: 12, lastDay: D3, freezes: 2 });
  ok("漏 2 天即使有保護也歸零、保護不消耗", r.count === 1 && r.freezes === 2, JSON.stringify(r));

  r = await runCase({ count: 2, best: 5, lastDay: Y, freezes: 0 });
  ok("連續滿 3 天自動賺 1 張保護", r.freezes === 1 && r.count === 3, JSON.stringify(r));

  await page.evaluate(() => { localStorage.setItem("streak", JSON.stringify({ count: 6, best: 9, lastDay: window.__keyOf(0), freezes: 2 })); });
  await tap(page, '.tab[data-route="home"]');
  await page.waitForSelector(".daily-card", { timeout: 8000 });
  const hasFreeze = await page.evaluate(() => {
    const e = document.querySelector(".streak-freeze.has");
    return { present: !!e, txt: e ? e.textContent.replace(/\s+/g, " ").trim() : "" };
  });
  ok("首頁顯示『🛡️ 連續保護 ×2』狀態列", hasFreeze.present && /連續保護 ×2/.test(hasFreeze.txt), hasFreeze.txt.slice(0, 36));

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 連續保護（streak freeze）【線上正式站】真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
}
