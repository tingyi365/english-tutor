// 本機真 Chrome 端到端驗「設定面板可單獨重選學習動機」：
// 不必整套重看 onboarding，於 ⚙️設定 直接改學習動機 → 即時更新首頁「為你推薦」緞帶 + 跨次持久化 + 可清為未設定。
// 走真實模組 app.js + 真實渲染。0 console error / 375px 手機。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8836;
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// 開設定 → 改 motiveSelect → 回讀首頁推薦狀態
async function setMotiveAndReadHome(page, val) {
  await tap(page, "#settingsBtn"); await sleep(120);
  await page.select("#motiveSelect", val); await sleep(180);
  await tap(page, "#settingsClose"); await sleep(120);
  return page.evaluate(() => {
    const rec = document.querySelector(".mode-card.mc-rec");
    return {
      motive: localStorage.getItem("learnMotive"),
      recCount: document.querySelectorAll(".mode-card.mc-rec").length,
      recTitle: rec?.querySelector("h3")?.textContent.trim() || "",
      firstTitle: document.querySelector(".mode-card")?.querySelector("h3")?.textContent.trim() || "",
    };
  });
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  // 跳過首訪 onboarding（已是老用戶）、動機初始未設定
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 6000 });
  ok("老用戶不出 onboarding（首頁直接是 mode-card）", await page.evaluate(() => !document.getElementById("onboarding")));

  // 設定面板有「學習動機」下拉
  await tap(page, "#settingsBtn"); await sleep(150);
  const sel = await page.evaluate(() => {
    const s = document.getElementById("motiveSelect");
    if (!s) return null;
    return {
      exists: true,
      optCount: s.options.length,
      optVals: [...s.options].map((o) => o.value),
      firstLabel: s.options[0]?.textContent.trim() || "",
      curVal: s.value,
      panelOpen: !document.getElementById("settingsPanel").classList.contains("hidden"),
    };
  });
  ok("設定面板有 #motiveSelect 學習動機下拉", !!sel?.exists, JSON.stringify(sel));
  ok("選項=未設定 + 4 動機（共 5）", sel?.optCount === 5, `count=${sel?.optCount}`);
  ok("選項值齊（''/travel/work/exam/daily）",
    JSON.stringify(sel?.optVals) === JSON.stringify(["", "travel", "work", "exam", "daily"]), JSON.stringify(sel?.optVals));
  ok("首項為『未設定（不特別推薦）』", /未設定/.test(sel?.firstLabel || ""), sel?.firstLabel);
  ok("初始為未設定（空值）", sel?.curVal === "", `cur=${sel?.curVal}`);
  await tap(page, "#settingsClose"); await sleep(100);
  ok("初始首頁無推薦緞帶", await page.evaluate(() => document.querySelectorAll(".mode-card.mc-rec").length === 0));

  // 改成「工作」→ 推薦跟讀糾音(shadowing)
  const work = await setMotiveAndReadHome(page, "work");
  ok("改工作 → learnMotive=work 持久化", work.motive === "work", `m=${work.motive}`);
  ok("改工作 → 首頁出現 1 張推薦緞帶卡", work.recCount === 1, `c=${work.recCount}`);
  ok("改工作 → 推薦卡=跟讀糾音", work.recTitle === "跟讀糾音", work.recTitle);
  ok("改工作 → 推薦卡排到最前", work.firstTitle === "跟讀糾音", `first=${work.firstTitle}`);

  // 改成「旅遊」→ 推薦情境對話(conversation)，即時切換不殘留舊推薦
  const travel = await setMotiveAndReadHome(page, "travel");
  ok("改旅遊 → learnMotive=travel", travel.motive === "travel", `m=${travel.motive}`);
  ok("改旅遊 → 推薦卡=情境對話（即時切換）", travel.recTitle === "情境對話", travel.recTitle);
  ok("改旅遊 → 仍只有 1 張推薦卡（不殘留工作推薦）", travel.recCount === 1, `c=${travel.recCount}`);

  // 改成「考試」→ 推薦文法填空(grammar)
  const exam = await setMotiveAndReadHome(page, "exam");
  ok("改考試 → learnMotive=exam", exam.motive === "exam", `m=${exam.motive}`);
  ok("改考試 → 推薦卡=文法填空", exam.recTitle === "文法填空", exam.recTitle);

  // 清回「未設定」→ 移除 learnMotive、首頁無推薦緞帶
  const none = await setMotiveAndReadHome(page, "");
  ok("清未設定 → learnMotive 被移除（null）", none.motive === null, `m=${none.motive}`);
  ok("清未設定 → 首頁無推薦緞帶", none.recCount === 0, `c=${none.recCount}`);

  // 再設「日常」→ shadowing，並驗跨次持久化（reload 後設定面板回讀正確值）
  await setMotiveAndReadHome(page, "daily");
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 6000 });
  await tap(page, "#settingsBtn"); await sleep(150);
  const persist = await page.evaluate(() => ({
    selVal: document.getElementById("motiveSelect")?.value,
    stored: localStorage.getItem("learnMotive"),
    recTitle: document.querySelector(".mode-card.mc-rec h3")?.textContent.trim() || "",
  }));
  ok("跨次持久化：reload 後 learnMotive=daily", persist.stored === "daily", `s=${persist.stored}`);
  ok("跨次持久化：設定面板回讀 motiveSelect=daily", persist.selVal === "daily", `v=${persist.selVal}`);
  ok("跨次持久化：首頁推薦卡=跟讀糾音（日常→shadowing）", persist.recTitle === "跟讀糾音", persist.recTitle);

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 設定面板單獨重選學習動機 真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
