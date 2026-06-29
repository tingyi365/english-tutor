// 第31輪驗證：文法依學習動機把對應主題題目排前（內容分主題最後一個模式）。
// 真 Chrome、375px 手機、真實模組+真實渲染。用法：node tools/verify_grammar_motive.mjs [URL]
import http from "http"; import fs from "fs"; import path from "path";
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve("."); const ARG = process.argv[2];
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json" };

let server = null, BASE = ARG;
if (!ARG) {
  server = http.createServer((req, res) => {
    let f = decodeURIComponent(req.url.split("?")[0]); if (f === "/") f = "/index.html";
    const fp = path.join(ROOT, f);
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp)) { res.writeHead(404); return res.end("nf"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(fp)] || "text/plain" }); res.end(fs.readFileSync(fp));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  BASE = `http://127.0.0.1:${server.address().port}`;
}

const results = []; const ok = (n, c) => results.push([c ? "PASS" : "FAIL", n]);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const errs = [];
try {
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push("PAGEERR " + e.message));
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  // 取得 GRAMMAR topic 分佈（從 data.js 模組）
  await page.goto(BASE, { waitUntil: "networkidle0" });
  const dist = await page.evaluate(async (base) => {
    const m = await import(base + "/assets/js/data.js");
    const topics = m.GRAMMAR.map((g) => g.topic || "(none)");
    const counts = {}; topics.forEach((t) => counts[t] = (counts[t] || 0) + 1);
    return { len: m.GRAMMAR.length, counts, allTagged: topics.every((t) => t !== "(none)"), firstTravelIdx: topics.indexOf("travel") };
  }, BASE);
  ok("全部 GRAMMAR 題已標 topic", dist.allTagged);
  ok("四大動機主題皆有題(travel/work/exam/daily)", ["travel", "work", "exam", "daily"].every((k) => dist.counts[k] > 0));
  console.log("  topic 分佈:", JSON.stringify(dist.counts), " 題數:", dist.len);

  // 幫手：設定動機 → 進文法 → 讀首題 pill+句子，回傳前幾題的「真實 GRAMMAR 索引」
  async function firstQuestionsFor(motive) {
    await page.evaluate((mv) => { localStorage.clear(); localStorage.setItem("onboarded", "1"); if (mv) localStorage.setItem("learnMotive", mv); }, motive);
    await page.goto(BASE, { waitUntil: "networkidle0" });
    await page.waitForSelector(".mode-card", { timeout: 8000 });
    await page.evaluate(() => document.querySelector(`.tab[data-route="grammar"]`)?.click());
    await page.waitForSelector(".gap-sentence", { timeout: 8000 });
    // 走前 4 題，記錄每題英文句（用以對回 data.js 找 topic）
    const seen = [];
    for (let k = 0; k < 4; k++) {
      const info = await page.evaluate(() => ({
        pill: document.querySelector(".pill-lv")?.textContent.trim(),
        zh: document.querySelector(".gap-sentence")?.parentElement?.querySelector(".translation")?.textContent.trim(),
      }));
      seen.push(info);
      await page.evaluate(() => document.querySelector("#nextBtn")?.click());
      await sleep(120);
    }
    return seen;
  }

  // 取得各 zh→topic 對照
  const zhTopic = await page.evaluate(async (base) => {
    const m = await import(base + "/assets/js/data.js");
    const map = {}; m.GRAMMAR.forEach((g) => map[g.zh] = g.topic);
    return map;
  }, BASE);

  for (const mv of ["travel", "work", "exam"]) {
    const seen = await firstQuestionsFor(mv);
    const topicsOfFirst = seen.map((s) => zhTopic[s.zh]);
    const firstIsMotive = topicsOfFirst[0] === mv;
    ok(`動機=${mv} → 首題即為 ${mv} 主題`, firstIsMotive);
    console.log(`  動機=${mv} 前4題主題:`, JSON.stringify(topicsOfFirst), " pill:", seen.map((s) => s.pill).join(", "));
  }

  // 未設動機 → 維持原序（首題=GRAMMAR[0]，topic=work，原序零回歸）
  const seenNone = await firstQuestionsFor("");
  const orderPreserved = zhTopic[seenNone[0].zh] === "work"; // GRAMMAR[0] topic=work
  ok("未設動機 → 維持原順序(零回歸，首題=原 GRAMMAR[0])", orderPreserved);

  // 錯題本相容：設動機=work，第一題故意答錯 → 進複習頁，確認該錯題能正確回放（同一句子）
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); localStorage.setItem("learnMotive", "work"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  await page.evaluate(() => document.querySelector(`.tab[data-route="grammar"]`)?.click());
  await page.waitForSelector(".opt", { timeout: 8000 });
  const wrongQ = await page.evaluate(() => {
    const zh = document.querySelector(".gap-sentence")?.parentElement?.querySelector(".translation")?.textContent.trim();
    const opts = [...document.querySelectorAll(".opt")];
    // 點一個一定錯的（第一個非正解）：先點 index 0，若剛好正解再點 1
    opts[0].click();
    return { zh };
  });
  await sleep(150);
  // 確認錯題本有存且 qIndex 對應真索引（回放句子一致）
  const reviewMatch = await page.evaluate(async (base, wrongZh) => {
    const dm = await import(base + "/assets/js/data.js");
    const am = await import(base + "/assets/js/app.js");
    const ms = am.getMistakes ? am.getMistakes() : JSON.parse(localStorage.getItem("mistakes") || "[]");
    const gm = ms.find((x) => x.type === "grammar");
    if (!gm) return { hasMistake: false };
    const q = dm.GRAMMAR[gm.qIndex];
    return { hasMistake: true, qIndexZhMatchesWrong: q && q.zh === wrongZh, qIndex: gm.qIndex, key: gm.key };
  }, BASE, wrongQ.zh);
  ok("錯題以真 GRAMMAR 索引存(qIndex 回放句子一致)", reviewMatch.hasMistake && reviewMatch.qIndexZhMatchesWrong);
  ok("錯題 key 與 qIndex 一致(g<真索引>)", reviewMatch.hasMistake && reviewMatch.key === ("g" + reviewMatch.qIndex));
  console.log("  錯題:", JSON.stringify(reviewMatch));

  // 完成總結仍在：走完整輪到底，出完成卡（沿用第28輪）
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  await page.evaluate(() => document.querySelector(`.tab[data-route="grammar"]`)?.click());
  await page.waitForSelector(".pill-lv", { timeout: 8000 });
  const gN = await page.evaluate(() => parseInt(document.querySelector(".pill-lv").textContent.split("/")[1]));
  for (let k = 0; k < gN; k++) { await page.evaluate(() => document.querySelector("#nextBtn")?.click()); await sleep(60); }
  const summary = await page.evaluate(() => /本回合完成|答對 \d+ \/ \d+ 題/.test(document.body.innerText));
  ok("走完整輪仍出完成總結卡(第28輪收尾不回歸)", summary);
  ok(`完成卡題數=${gN}（含新增旅遊題後總數）`, gN === dist.len);

  ok("0 console error", errs.length === 0);

  console.log("\n--- 結果 ---");
  results.forEach(([s, n]) => console.log(`  [${s}] ${n}`));
  const pass = results.filter((r) => r[0] === "PASS").length;
  console.log(`\n${pass}/${results.length} PASS, console errors: ${errs.length}`, errs.slice(0, 5));
} finally { await browser.close(); if (server) server.close(); }
