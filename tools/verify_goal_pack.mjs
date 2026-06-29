// 本機真 Chrome 端到端驗「目標精選句」（第21輪）：
// 依第20輪 onboarding 問到的學習動機，首頁出現「為『XX』精選句」卡，列出對應主題的句子，
// 點一句 → 寫 shadowIdx 並直接進跟讀糾音練該句（讓「依動機推薦」名副其實＝容易學）。
// 走真實模組 app.js/modes.js + 真實渲染。0 console error / 375px 手機。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8833;
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.goto(BASE, { waitUntil: "networkidle0" });

  // ===== 資料層：每個動機主題都有 ≥3 句（卡片才填得滿） =====
  const topics = await page.evaluate(async () => {
    const d = await import("/assets/js/data.js");
    const c = {};
    d.SENTENCES.forEach((s) => { c[s.topic] = (c[s.topic] || 0) + 1; });
    return c;
  });
  ok("旅遊 travel 句 ≥3", (topics.travel || 0) >= 3, `travel=${topics.travel}`);
  ok("工作 work 句 ≥3", (topics.work || 0) >= 3, `work=${topics.work}`);
  ok("考試 exam 句 ≥3", (topics.exam || 0) >= 3, `exam=${topics.exam}`);
  ok("日常 daily 句 ≥3", (topics.daily || 0) >= 3, `daily=${topics.daily}`);

  // ===== 路徑 A：動機=旅遊 → 首頁出現旅遊精選句卡 =====
  await page.evaluate(() => {
    localStorage.clear();
    localStorage.setItem("onboarded", "1");
    localStorage.setItem("learnMotive", "travel");
  });
  await page.evaluate(async () => { const app = await import("/assets/js/app.js"); window.__app = app; app.navigate("home"); });
  await page.waitForSelector(".goal-card", { timeout: 5000 });
  const travelCard = await page.evaluate(() => {
    const card = document.querySelector(".goal-card");
    const items = [...document.querySelectorAll(".goal-item")];
    return {
      title: card?.querySelector(".goal-head-txt b")?.textContent.trim() || "",
      ico: card?.querySelector(".goal-ico")?.textContent.trim() || "",
      count: items.length,
      idxs: items.map((b) => parseInt(b.dataset.idx, 10)),
      ens: items.map((b) => b.querySelector(".gi-en")?.textContent.trim() || ""),
      hasGo: items.every((b) => /開口練/.test(b.querySelector(".gi-go")?.textContent || "")),
    };
  });
  ok("旅遊：首頁出現精選句卡，標題正確", /為「旅遊出國」精選句/.test(travelCard.title), travelCard.title);
  ok("旅遊：卡片有動機圖示 ✈️", travelCard.ico === "✈️", travelCard.ico);
  ok("旅遊：精選 1~3 句", travelCard.count >= 1 && travelCard.count <= 3, `count=${travelCard.count}`);
  ok("旅遊：每句都有『🎤 開口練』鈕", travelCard.hasGo);
  // 卡片裡每句確實 topic=travel
  const travelOk = await page.evaluate(async (idxs) => {
    const d = await import("/assets/js/data.js");
    return idxs.every((i) => d.SENTENCES[i].topic === "travel");
  }, travelCard.idxs);
  ok("旅遊：卡內每句 topic 都=travel（名副其實）", travelOk, JSON.stringify(travelCard.idxs));

  // ===== 點第一句 → 寫 shadowIdx + 進跟讀糾音 + 顯示該句 =====
  const targetIdx = travelCard.idxs[0];
  const targetEn = travelCard.ens[0];
  await page.evaluate(() => document.querySelector(".goal-item").click());
  await sleep(350);
  const afterClick = await page.evaluate(() => ({
    hash: location.hash,
    shadowIdx: localStorage.getItem("shadowIdx"),
    body: document.body.textContent,
  }));
  ok("點精選句 → 導向跟讀糾音（hash=#shadowing）", afterClick.hash === "#shadowing", afterClick.hash);
  ok("點精選句 → shadowIdx 寫成該句索引", afterClick.shadowIdx === String(targetIdx), `shadowIdx=${afterClick.shadowIdx} target=${targetIdx}`);
  ok("跟讀頁實際顯示該精選句", afterClick.body.includes(targetEn), targetEn.slice(0, 40));

  // ===== 路徑 B：動機=工作 → 換成 work 主題句（內容隨動機改變） =====
  await page.evaluate(async () => {
    localStorage.setItem("learnMotive", "work");
    const app = await import("/assets/js/app.js");
    app.navigate("home");
  });
  await page.waitForSelector(".goal-card", { timeout: 5000 });
  const workCard = await page.evaluate(() => {
    const items = [...document.querySelectorAll(".goal-item")];
    return {
      title: document.querySelector(".goal-head-txt b")?.textContent.trim() || "",
      ico: document.querySelector(".goal-ico")?.textContent.trim() || "",
      idxs: items.map((b) => parseInt(b.dataset.idx, 10)),
    };
  });
  ok("工作：卡片標題切成『為「工作職場」精選句』", /為「工作職場」精選句/.test(workCard.title), workCard.title);
  ok("工作：圖示切成 💼", workCard.ico === "💼", workCard.ico);
  const workOk = await page.evaluate(async (idxs) => {
    const d = await import("/assets/js/data.js");
    return idxs.length > 0 && idxs.every((i) => d.SENTENCES[i].topic === "work");
  }, workCard.idxs);
  ok("工作：卡內每句 topic 都=work（內容隨動機改變）", workOk, JSON.stringify(workCard.idxs));

  // ===== 路徑 C：未選動機 → 無精選句卡（零摩擦、不打擾） =====
  await page.evaluate(async () => {
    localStorage.removeItem("learnMotive");
    const app = await import("/assets/js/app.js");
    app.navigate("home");
  });
  await page.waitForSelector(".mode-grid", { timeout: 5000 });
  const noMotive = await page.evaluate(() => ({
    goalCard: document.querySelectorAll(".goal-card").length,
    modeCards: document.querySelectorAll(".mode-card").length,
  }));
  ok("未選動機 → 不顯示精選句卡", noMotive.goalCard === 0, `goalCard=${noMotive.goalCard}`);
  ok("未選動機 → 首頁 5 種模式照常渲染（無回歸）", noMotive.modeCards === 5, `modeCards=${noMotive.modeCards}`);

  // ===== 回歸：第20輪推薦緞帶仍在（動機=旅遊→情境對話卡掛緞帶並排最前） =====
  await page.evaluate(async () => {
    localStorage.setItem("learnMotive", "travel");
    const app = await import("/assets/js/app.js");
    app.navigate("home");
  });
  await page.waitForSelector(".mode-card", { timeout: 5000 });
  const ribbon = await page.evaluate(() => {
    const rec = document.querySelector(".mode-card.mc-rec");
    const first = document.querySelector(".mode-card");
    return { recTitle: rec?.querySelector("h3")?.textContent.trim() || "",
             firstTitle: first?.querySelector("h3")?.textContent.trim() || "",
             recCount: document.querySelectorAll(".mode-card.mc-rec").length };
  });
  ok("回歸：第20輪推薦緞帶仍在（旅遊→情境對話）", ribbon.recTitle === "情境對話" && ribbon.recCount === 1, JSON.stringify(ribbon));
  ok("回歸：推薦卡仍排最前", ribbon.firstTitle === "情境對話", ribbon.firstTitle);

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 目標精選句（依動機推主題內容）真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
