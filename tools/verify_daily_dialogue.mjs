// 第33輪：本機真 Chrome 端到端驗「daily 主題對話量擴充 2→4」(append-only)。
// 驗：①資料層 daily≥4、全對話仍有 topic+level、總數正確 ②兩則新對話存在且為初級
//     ③動機=daily 走新對話含分支 choices→點選→出 reply→走到底出🎉完成態
//     ④零回歸(其他主題數不變、未選動機照常) ⑤0 console error / 375px 手機。
// 走真實模組 app.js/modes.js/data.js + 真實渲染。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8841;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml",
};
const LIVE = process.argv[2]; // 傳網址＝驗線上；不傳＝本機 server
const server = LIVE ? null : createServer(async (req, res) => {
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
if (server) await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const BASE = LIVE || `http://127.0.0.1:${PORT}/`;

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

  // ===== ① 資料層：daily≥4、全標籤、新對話存在 =====
  const d = await page.evaluate(async () => {
    const m = await import("/assets/js/data.js");
    const t = {}; let allTagged = true;
    m.DIALOGUES.forEach((x) => { t[x.topic] = (t[x.topic] || 0) + 1; if (!x.topic || !x.level) allTagged = false; });
    const titles = m.DIALOGUES.map((x) => x.title);
    const shop = m.DIALOGUES.find((x) => x.title === "在商店買東西");
    const wk = m.DIALOGUES.find((x) => x.title === "聊週末計畫");
    const hasBranch = (x) => x && x.turns.some((tn) => Array.isArray(tn.choices) && tn.choices.length >= 2);
    return { t, allTagged, total: m.DIALOGUES.length, titles,
             shopLv: shop?.level, wkLv: wk?.level, shopBranch: hasBranch(shop), wkBranch: hasBranch(wk) };
  });
  ok("daily 對話 ≥4（本輪 2→4 擴充）", (d.t.daily || 0) >= 4, JSON.stringify(d.t));
  ok("全對話仍有 topic+level 標籤（零破壞）", d.allTagged, JSON.stringify(d.t));
  ok("其他主題數不變（travel3/work4/exam3，零回歸）", d.t.travel === 3 && d.t.work === 4 && d.t.exam === 3, JSON.stringify(d.t));
  ok("新對話「在商店買東西」存在且為初級", d.titles.includes("在商店買東西") && d.shopLv === "初級", `lv=${d.shopLv}`);
  ok("新對話「聊週末計畫」存在且為初級", d.titles.includes("聊週末計畫") && d.wkLv === "初級", `lv=${d.wkLv}`);
  ok("兩則新對話皆含分支選項 choices", d.shopBranch && d.wkBranch, `shop=${d.shopBranch} wk=${d.wkBranch}`);

  // ===== ② 動機=daily → 對話聚焦 daily，找到並走完「在商店買東西」含分支 =====
  await page.evaluate(async () => {
    localStorage.clear();
    localStorage.setItem("learnMotive", "daily");
    const app = await import("/assets/js/app.js");
    app.navigate("conversation");
  });
  await page.waitForSelector(".conv-chip", { timeout: 5000 });
  const filterDaily = await page.evaluate(() => document.querySelector(".conv-chip.on")?.dataset.f);
  ok("動機=daily → 對話預設聚焦 daily 主題", filterDaily === "daily", `filter=${filterDaily}`);

  // 用 #switchBtn 在 daily 主題內循環，找到「在商店買東西」
  let foundShop = false;
  for (let i = 0; i < 6; i++) {
    const title = await page.evaluate(() => (document.querySelector(".card b")?.textContent || "").trim());
    if (title.includes("在商店買東西")) { foundShop = true; break; }
    await page.evaluate(() => document.querySelector("#switchBtn")?.click());
    await sleep(200);
  }
  ok("可在 daily 主題內循環到新對話「在商店買東西」", foundShop);

  // 走對話：推進靠 #skipBtn（略過）；遇分支先點 .conv-choice 再略過 → advance 推出對方 reply 氣泡
  let sawChoices = false, sawReply = false, done = false;
  for (let i = 0; i < 14; i++) {
    await sleep(350);
    const state = await page.evaluate(() => ({
      fin: /對話完成/.test(document.querySelector("#convCtl")?.innerText || ""),
      hasChoice: document.querySelectorAll("#convCtl .conv-choice").length > 0,
      hasSkip: !!document.querySelector("#convCtl #skipBtn"),
    }));
    if (state.fin) { done = true; break; }
    if (state.hasChoice) {
      sawChoices = true;
      // 點第一個分支選項 → 應出現「就照這句練習」的 renderControls（含 #skipBtn）
      await page.evaluate(() => document.querySelector("#convCtl .conv-choice")?.click());
      await sleep(250);
      const bubbleBefore = await page.evaluate(() => document.querySelectorAll("#chat .bubble").length);
      // 按略過 → advance(reply) 推出對方依選擇的回覆 bubble
      await page.evaluate(() => document.querySelector("#convCtl #skipBtn")?.click());
      await sleep(700);
      const bubbleAfter = await page.evaluate(() => document.querySelectorAll("#chat .bubble").length);
      if (bubbleAfter > bubbleBefore) sawReply = true;
      continue;
    }
    if (state.hasSkip) {
      await page.evaluate(() => document.querySelector("#convCtl #skipBtn")?.click());
      continue;
    }
  }
  ok("新對話分支選項可渲染（.conv-choice 出現）", sawChoices);
  ok("點分支選項→略過 → 對方依選擇回覆（新增 bubble）", sawReply);
  ok("走到底出現「🎉 對話完成」完成態", done);

  // ===== ③ 零回歸：未選動機照常渲染 =====
  await page.evaluate(async () => {
    localStorage.clear();
    const app = await import("/assets/js/app.js");
    app.navigate("conversation");
  });
  await page.waitForSelector(".conv-chip", { timeout: 5000 });
  const noMotive = await page.evaluate(() => ({
    filter: document.querySelector(".conv-chip.on")?.dataset.f,
    title: (document.querySelector(".card b")?.textContent || "").trim(),
    pill: document.querySelector(".pill-lv")?.textContent || "",
  }));
  ok("未選動機 → filter=all 且對話正常渲染（零回歸）", noMotive.filter === "all" && !!noMotive.title && /初級|中級/.test(noMotive.pill), JSON.stringify(noMotive));

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n==== daily 對話擴充 真機驗證 (${LIVE ? "線上 " + LIVE : "本機"}) ====`);
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  if (server) server.close();
}
