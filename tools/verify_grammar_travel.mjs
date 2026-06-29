// 第35輪驗證：旅遊文法 append-only 擴充 2→4（內容矩陣最單薄格補強，讓「為你推薦」對旅遊族群名副其實）。
// 真 Chrome、375px 手機、真實模組+真實渲染。用法：node tools/verify_grammar_travel.mjs [URL]
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
  await page.goto(BASE, { waitUntil: "networkidle0" });

  // 1) 資料層：GRAMMAR 總數 19、travel=4、新增2題在末端且結構合法、既有索引0~16不變
  const data = await page.evaluate(async (base) => {
    const m = await import(base + "/assets/js/data.js");
    const g = m.GRAMMAR;
    const counts = {}; g.forEach((q) => counts[q.topic] = (counts[q.topic] || 0) + 1);
    const valid = (q) => q.prompt && Array.isArray(q.options) && q.options.length === 4 &&
      typeof q.answer === "number" && q.answer >= 0 && q.answer <= 3 && q.explain && q.zh && q.topic;
    const newOnes = g.slice(17);
    return {
      len: g.length, counts,
      allValid: g.every(valid),
      idx0Prompt: g[0].prompt, idx16Topic: g[16]?.topic,
      newTravel: newOnes.every((q) => q.topic === "travel" && valid(q)),
      newPrompts: newOnes.map((q) => q.prompt),
      newAnswers: newOnes.map((q) => q.options[q.answer]),
    };
  }, BASE);
  ok("GRAMMAR 總數 = 19（17+新增2）", data.len === 19);
  ok("travel 文法補至 4 題（原2→4）", data.counts.travel === 4);
  ok("四大主題皆有題", ["travel", "work", "exam", "daily"].every((k) => data.counts[k] > 0));
  ok("全部題結構合法（4選項/answer合法/有解說）", data.allValid);
  ok("既有索引未動：GRAMMAR[0] 仍為原 work 第三人稱題", /She ___ to work/.test(data.idx0Prompt));
  ok("新增2題皆 travel 且結構合法", data.newTravel);
  ok("新題答案正確（buy / far）", data.newAnswers.join(",") === "buy,far");
  console.log("  topic 分佈:", JSON.stringify(data.counts), " 新題:", JSON.stringify(data.newPrompts), " 答案:", JSON.stringify(data.newAnswers));

  // 2) 真機渲染：動機=travel 進文法，前幾題即 travel（含新題可被排到前面），可實際作答出對錯回饋
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); localStorage.setItem("learnMotive", "travel"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  await page.evaluate(() => document.querySelector(`.tab[data-route="grammar"]`)?.click());
  await page.waitForSelector(".opt", { timeout: 8000 });

  // 走訪整輪，收集所有題的中文翻譯，確認兩則新題（買票/海灘多遠）真的會出現在 travel 動機的題序中
  const N = await page.evaluate(() => parseInt(document.querySelector(".pill-lv").textContent.split("/")[1]));
  const seenZh = [];
  for (let k = 0; k < N; k++) {
    const zh = await page.evaluate(() => document.querySelector(".gap-sentence")?.parentElement?.querySelector(".translation")?.textContent.trim());
    seenZh.push(zh);
    await page.evaluate(() => document.querySelector("#nextBtn")?.click());
    await sleep(50);
  }
  ok("整輪題數 = 19", N === 19);
  ok("新題「買票」出現在題序中", seenZh.some((z) => z && z.includes("買一張到市中心")));
  ok("新題「海灘多遠」出現在題序中", seenZh.some((z) => z && z.includes("到海灘有多遠")));

  // 3) 實際作答新題：找到新題、點正解 → 出正向回饋；點錯 → 出錯誤回饋+解說
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); localStorage.setItem("learnMotive", "travel"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  await page.evaluate(() => document.querySelector(`.tab[data-route="grammar"]`)?.click());
  await page.waitForSelector(".opt", { timeout: 8000 });
  // 走到第一則新題（買票）
  let foundBuy = false;
  for (let k = 0; k < 19; k++) {
    const isBuy = await page.evaluate(() => /買一張到市中心/.test(document.querySelector(".translation")?.textContent || ""));
    if (isBuy) { foundBuy = true; break; }
    await page.evaluate(() => document.querySelector("#nextBtn")?.click());
    await sleep(50);
  }
  let answerFeedback = { correctShown: false, explainShown: false };
  if (foundBuy) {
    answerFeedback = await page.evaluate(() => {
      const opts = [...document.querySelectorAll(".opt")];
      const buy = opts.find((o) => /\bbuy\b/.test(o.textContent) && !/buys|buying|bought/.test(o.textContent));
      if (buy) buy.click();
      const body = document.body.innerText;
      return {
        correctShown: /答對|正確|✅|🎉|太棒|很好|Correct/i.test(body) || !!document.querySelector(".opt.correct, .opt.right, .correct"),
        explainShown: /原形動詞|can 後面/.test(body),
      };
    });
  }
  ok("新題可作答：點正解 buy 出正向/正解標示", answerFeedback.correctShown);
  ok("新題作答後顯示解說（can 後接原形）", answerFeedback.explainShown);

  ok("0 console error", errs.length === 0);

  console.log("\n--- 結果 ---");
  results.forEach(([s, n]) => console.log(`  [${s}] ${n}`));
  const pass = results.filter((r) => r[0] === "PASS").length;
  console.log(`\n${pass}/${results.length} PASS, console errors: ${errs.length}`, errs.slice(0, 5));
} finally { await browser.close(); if (server) server.close(); }
