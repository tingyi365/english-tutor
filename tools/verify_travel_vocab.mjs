// 第37輪驗證：travel 單字 append-only 擴充 4→6（旅遊單字為內容矩陣最單薄格；借鏡 Babbel 旅遊路線＝實用情境＋清楚解說的初學者常用字）。
// 真 Chrome、375px 手機、真實模組+真實渲染。用法：node tools/verify_travel_vocab.mjs [URL]
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
const NEW = ["ticket", "direction"];
try {
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push("PAGEERR " + e.message));
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(BASE, { waitUntil: "networkidle0" });

  // 1) 資料層：VOCAB 總數 29、travel=6、其他主題未動、新增2字在末端結構合法、字串為 SRS key 不重複
  const data = await page.evaluate(async (base) => {
    const m = await import(base + "/assets/js/data.js");
    const v = m.VOCAB;
    const counts = {}; v.forEach((x) => counts[x.topic] = (counts[x.topic] || 0) + 1);
    const valid = (x) => x.word && x.ipa && x.pos && x.zh && x.ex && x.exZh && x.topic;
    const last2 = v.slice(-2);
    const words = v.map((x) => x.word);
    return {
      len: v.length, counts, allValid: v.every(valid),
      idx0: v[0].word, idx21: v[21]?.word, idx26: v[26]?.word,
      last2: last2.map((x) => x.word), last2Travel: last2.every((x) => x.topic === "travel" && valid(x)),
      uniq: new Set(words).size === words.length,
      hasNew: ["ticket", "direction"].every((w) => words.includes(w)),
    };
  }, BASE);
  ok("VOCAB 總數 = 29（27+新增2）", data.len === 29);
  ok("travel 單字補至 6（原4→6）", data.counts.travel === 6);
  ok("其他主題未動：daily10/work8/exam5", data.counts.daily === 10 && data.counts.work === 8 && data.counts.exam === 5);
  ok("四大主題皆有單字", ["travel", "work", "exam", "daily"].every((k) => data.counts[k] > 0));
  ok("全部單字結構合法（word/ipa/pos/zh/ex/exZh/topic）", data.allValid);
  ok("既有索引未動：VOCAB[0]=appreciate", data.idx0 === "appreciate");
  ok("既有索引未動：VOCAB[21]=suggest", data.idx21 === "suggest");
  ok("既有末端未動：VOCAB[26]=summarize（第22輪 exam 字）", data.idx26 === "summarize");
  ok("新增2字皆 travel + 結構合法（ticket/direction）", data.last2Travel && data.last2.includes("ticket") && data.last2.includes("direction"));
  ok("單字字串唯一（SRS 以 word 為 key、零碰撞）", data.uniq);
  console.log("  topic 分佈:", JSON.stringify(data.counts), " 新字:", JSON.stringify(data.last2));

  // 2) 真機渲染：動機=travel → 新 travel 字（box0 新字）排前；走完一圈 29 張收集所有出現過的 word，確認新字真的在線可練
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); localStorage.setItem("learnMotive", "travel"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  await page.evaluate(() => document.querySelector(`.tab[data-route="flashcard"]`)?.click());
  await page.waitForSelector("#flash", { timeout: 8000 });
  const total = await page.evaluate(() => parseInt(document.querySelector(".pill-lv").textContent.split("/")[1]));
  ok("單字卡總張數 = 29", total === 29);

  // 第一張就是 box0+travel 優先 → 應為新 travel 字之一（或既有 travel 字）；收集走訪每一張的 word
  const firstWord = await page.evaluate(() => document.querySelector(".word")?.textContent || "");
  const seen = new Set([firstWord]);
  for (let k = 0; k < total - 1; k++) {
    await page.evaluate(() => document.querySelector("#nextBtn")?.click());
    await sleep(25);
    const w = await page.evaluate(() => document.querySelector(".word")?.textContent || "");
    if (w) seen.add(w);
  }
  ok("走訪整圈出現新字 ticket", seen.has("ticket"));
  ok("走訪整圈出現新字 direction", seen.has("direction"));
  ok("動機=travel → 第一張為 travel 主題字（弱點+動機優先）", ["recommend", "reservation", "passport", "luggage", "ticket", "direction"].includes(firstWord));
  console.log("  第一張:", firstWord, " 走訪不重複字數:", seen.size);

  // 3) 翻卡 + 發音按鈕可運作（回到最後一張，flip 看中文例句）
  const flipOk = await page.evaluate(() => {
    const f = document.querySelector("#flash"); if (!f) return false;
    f.click(); return f.classList.contains("flipped");
  });
  ok("卡片可翻面看中文/例句", flipOk);

  // 4) 完成這一輪 → 顯示走完一圈完成總結卡（第30輪單字卡收尾回歸）
  const lastBtn = await page.evaluate(() => document.querySelector("#nextBtn")?.textContent || "");
  ok("最後一張按鈕為「完成這一輪 →」", /完成這一輪/.test(lastBtn));
  await page.evaluate(() => document.querySelector("#nextBtn")?.click());
  await sleep(150);
  const summaryShown = await page.evaluate(() => /走完一圈|已熟|複習中|新字|再複習一輪|回首頁/.test(document.querySelector(".view")?.innerText || ""));
  ok("完成顯示走完一圈總結卡（第30輪收尾回歸）", summaryShown);

  ok("0 console error", errs.length === 0);

  console.log("\n--- 結果 ---");
  results.forEach(([s, n]) => console.log(`  [${s}] ${n}`));
  const pass = results.filter((r) => r[0] === "PASS").length;
  console.log(`\n${pass}/${results.length} PASS, console errors: ${errs.length}`, errs.slice(0, 5));
  process.exitCode = pass === results.length && errs.length === 0 ? 0 : 1;
} finally { await browser.close(); if (server) server.close(); }
