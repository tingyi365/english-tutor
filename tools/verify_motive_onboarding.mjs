// 本機真 Chrome 端到端驗「學習動機 onboarding → 推薦起始模式」：
// 新手第 3 步問「為什麼學英文」(旅遊/工作/考試/日常)，第 4 步據此推薦起始模式 + 可直接開始；
// 首頁對應模式卡掛「👍 為你推薦」緞帶並排最前。走真實模組 app.js + 真實渲染。0 console error / 375px 手機。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8831;
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

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  // ===== 路徑 A：新手選「旅遊」→ 推薦情境對話 → 直接開始 =====
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector("#onboarding", { timeout: 8000 });
  ok("新手首訪自動出現 onboarding", true);

  // app.js 新 export 齊
  const imp = await page.evaluate(async () => {
    try {
      window.__app = await import("/assets/js/app.js");
      const k = Object.keys(window.__app);
      return ["getLearnMotive", "setLearnMotive", "getRecommendedMode", "LEARN_MOTIVES"].every((x) => k.includes(x));
    } catch (e) { return "ERR:" + e.message; }
  });
  ok("app.js 新 export 齊（getLearnMotive/setLearnMotive/getRecommendedMode/LEARN_MOTIVES）", imp === true, String(imp));

  // 共 4 步（welcome/goal/motive/recommend）
  const dots = await page.evaluate(() => document.querySelectorAll("#onboarding .onb-dots i").length);
  ok("onboarding 共 4 步（多了動機步）", dots === 4, `dots=${dots}`);

  // step0 welcome
  ok("第1步=歡迎", await page.evaluate(() => /歡迎/.test(document.querySelector(".onb-body").textContent)));
  await tap(page, "#onbNext"); await sleep(80);
  // step1 goal
  ok("第2步=每天小目標（有 onb-goals）", await page.evaluate(() => !!document.querySelector("#onbGoals")));
  await tap(page, "#onbNext"); await sleep(80);
  // step2 motive
  const motiveCount = await page.evaluate(() => document.querySelectorAll("#onbMotives .onb-motive").length);
  ok("第3步=學習動機，提供 4 個動機選項", motiveCount === 4, `count=${motiveCount}`);
  ok("動機步問句正確", await page.evaluate(() => /為什麼/.test(document.querySelector(".onb-body").textContent)));

  // 選「旅遊」→ 高亮
  await tap(page, '.onb-motive[data-k="travel"]'); await sleep(60);
  const travelOn = await page.evaluate(() => document.querySelector('.onb-motive[data-k="travel"]').classList.contains("on"));
  ok("點『旅遊出國』→ 該選項高亮(.on)", travelOn);

  await tap(page, "#onbNext"); await sleep(100);
  // step3 recommend
  const rec = await page.evaluate(() => {
    const b = document.querySelector(".onb-body");
    return { txt: b.textContent.replace(/\s+/g, " ").trim(), hasGo: !!document.querySelector("#onbRecGo"),
             nextLabel: document.querySelector("#onbNext").textContent.trim() };
  });
  ok("第4步=為你推薦『情境對話』(旅遊→conversation)", /為你推薦.*情境對話/.test(rec.txt), rec.txt.slice(0, 60));
  ok("推薦步有『直接開始』按鈕", rec.hasGo, `hasGo=${rec.hasGo}`);
  ok("末步主鈕為『開始學習 →』", /開始學習/.test(rec.nextLabel), rec.nextLabel);

  // 點直接開始 → onboarding 移除、進入 conversation、持久化
  await tap(page, "#onbRecGo"); await sleep(250);
  const afterGo = await page.evaluate(() => ({
    onbGone: !document.getElementById("onboarding"),
    motive: localStorage.getItem("learnMotive"),
    onboarded: localStorage.getItem("onboarded"),
    recMode: window.__app.getRecommendedMode(),
    convView: !!document.querySelector("#view .ttl, .view .ttl") &&
      /情境對話|💬/.test(document.body.textContent),
    hash: location.hash,
  }));
  ok("點直接開始 → onboarding 清乾淨", afterGo.onbGone);
  ok("學習動機持久化 learnMotive=travel", afterGo.motive === "travel", `motive=${afterGo.motive}`);
  ok("onboarded 標記寫入", afterGo.onboarded === "1");
  ok("getRecommendedMode()=conversation", afterGo.recMode === "conversation", `rec=${afterGo.recMode}`);
  ok("直接導向情境對話模式（hash=#conversation）", afterGo.hash === "#conversation", `hash=${afterGo.hash}`);

  // 回首頁 → 推薦卡有緞帶且排最前
  await page.evaluate(() => window.__app.navigate("home"));
  await page.waitForSelector(".mode-card", { timeout: 5000 });
  const home = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".mode-card")];
    const recCard = document.querySelector(".mode-card.mc-rec");
    return {
      recExists: !!recCard,
      recTag: recCard?.querySelector(".mc-rec-tag")?.textContent.trim() || "",
      recTitle: recCard?.querySelector("h3")?.textContent.trim() || "",
      firstTitle: cards[0]?.querySelector("h3")?.textContent.trim() || "",
      recCount: document.querySelectorAll(".mode-card.mc-rec").length,
    };
  });
  ok("首頁有『為你推薦』緞帶卡", home.recExists && /為你推薦/.test(home.recTag), `${home.recTag}`);
  ok("推薦卡=情境對話", home.recTitle === "情境對話", home.recTitle);
  ok("推薦卡排到最前", home.firstTitle === "情境對話", `first=${home.firstTitle}`);
  ok("只有 1 張推薦卡", home.recCount === 1, `count=${home.recCount}`);

  // ===== 路徑 B：不選動機 → 推薦步退回通用清單、開始學習回首頁、無推薦緞帶 =====
  await page.evaluate(() => { localStorage.clear(); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector("#onboarding", { timeout: 8000 });
  await tap(page, "#onbNext"); await sleep(60); // → goal
  await tap(page, "#onbNext"); await sleep(60); // → motive（不選）
  await tap(page, "#onbNext"); await sleep(80); // → recommend
  const generic = await page.evaluate(() => ({
    hasModes: !!document.querySelector(".onb-modes"),
    hasGo: !!document.querySelector("#onbRecGo"),
  }));
  ok("不選動機 → 推薦步退回通用模式清單（onb-modes）", generic.hasModes, JSON.stringify(generic));
  ok("不選動機 → 無『直接開始』按鈕（零摩擦不強迫）", !generic.hasGo);
  await tap(page, "#onbNext"); await sleep(200); // 開始學習 → home
  const noMotive = await page.evaluate(async () => {
    const app = await import("/assets/js/app.js");
    return { onbGone: !document.getElementById("onboarding"), motive: app.getLearnMotive(),
             onboarded: localStorage.getItem("onboarded"),
             recCount: document.querySelectorAll(".mode-card.mc-rec").length };
  });
  ok("不選動機 → 開始學習回首頁、onboarding 清乾淨", noMotive.onbGone);
  ok("不選動機 → learnMotive 空、首頁無推薦緞帶", noMotive.motive === "" && noMotive.recCount === 0, JSON.stringify(noMotive));
  ok("不選動機 → onboarded 仍寫入", noMotive.onboarded === "1");

  // ===== 動機→模式對應表正確（規則） =====
  const map = await page.evaluate(async () => {
    const app = await import("/assets/js/app.js");
    const m = app.LEARN_MOTIVES;
    return { travel: m.travel.rec, work: m.work.rec, exam: m.exam.rec, daily: m.daily.rec };
  });
  ok("動機→模式對應：旅遊→conversation", map.travel === "conversation", map.travel);
  ok("動機→模式對應：工作→shadowing", map.work === "shadowing", map.work);
  ok("動機→模式對應：考試→grammar", map.exam === "grammar", map.exam);
  ok("動機→模式對應：日常→shadowing", map.daily === "shadowing", map.daily);

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 學習動機 onboarding → 推薦起始模式 真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
