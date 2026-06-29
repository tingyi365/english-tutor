// 第29輪驗證：聽寫「本回合完成總結」端到端真機（本機 local / 線上 <URL> 共用）。
// 驗：做完一輪後出現完成卡(聽寫 X/N 句 + 平均分 + 鼓勵)、有錯題出「複習錯題」鈕可進複習、再來一輪重置回 1/N、回首頁；
//     全跳過給「聽寫 0/N 句」誠實計分；完成後不再靜默 wrap 回輸入題；全程 0 console error。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import http from "node:http"; import fs from "node:fs"; import path from "node:path";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ARG = process.argv[2] || "local";
const ROOT = process.cwd();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; } else { fail++; console.log("  ✗ " + m); } };
const tap = async (page, sel) => { await page.waitForSelector(sel, { timeout: 6000 }); await page.click(sel); };

let server, BASE;
if (ARG === "local") {
  server = http.createServer((req, res) => {
    let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
    const fp = path.join(ROOT, p);
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp)) { res.writeHead(404); return res.end("nf"); }
    res.writeHead(200, { "content-type": MIME[path.extname(fp)] || "application/octet-stream" });
    fs.createReadStream(fp).pipe(res);
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  BASE = `http://127.0.0.1:${server.address().port}/`;
} else { BASE = ARG; }

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const errs = [];
try {
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push("PAGEERR " + e.message));
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 6000 });

  // 進聽寫
  await tap(page, '.tab[data-route="dictation"]');
  await page.waitForSelector(".pill-lv", { timeout: 6000 });
  const N = await page.evaluate(() => parseInt(document.querySelector(".pill-lv").textContent.split("/")[1]));
  ok(N >= 10, "聽寫題庫 N=" + N);

  // 前兩句各打一個錯答案（產生作答分數 + 錯題）
  for (let k = 0; k < 2; k++) {
    await page.evaluate(() => { document.querySelector("#answer").value = ""; });
    await page.type("#answer", "zzz wrong");
    await page.evaluate(() => document.querySelector("#checkBtn").click());
    await sleep(120);
    await page.evaluate(() => document.querySelector("#nextBtn").click());
    await sleep(60);
  }
  // 走到最後一句
  for (let k = 2; k < N - 1; k++) { await page.evaluate(() => document.querySelector("#nextBtn").click()); await sleep(30); }
  const lastBtn = await page.evaluate(() => document.querySelector("#nextBtn").textContent.trim());
  ok(/完成本回合/.test(lastBtn), "最後一句按鈕=完成本回合, got " + lastBtn);
  await page.evaluate(() => document.querySelector("#nextBtn").click());
  await sleep(120);

  const sum = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      hasCount: /聽寫 \d+ \/ \d+ 句/.test(t),
      hasAvg: /平均 \d+ 分/.test(t),
      hasReview: !!document.querySelector("#dReview"),
      hasAgain: !!document.querySelector("#dAgain"),
      hasHome: !!document.querySelector("#dHome"),
      reviewTxt: document.querySelector("#dReview")?.textContent.trim() || "",
      notWrapped: !document.querySelector("#answer"),
    };
  });
  ok(sum.hasCount, "完成卡有『聽寫 X / N 句』");
  ok(sum.hasAvg, "完成卡有『平均 X 分』（有作答）");
  ok(sum.notWrapped, "完成後不再靜默 wrap 回輸入題（無 #answer）");
  ok(sum.hasAgain && sum.hasHome, "有『再來一輪』『回首頁』鈕");
  ok(sum.hasReview && /複習錯題/.test(sum.reviewTxt), "有錯題→出『複習錯題』鈕, got " + sum.reviewTxt);

  // 點複習錯題 → 進複習頁
  await tap(page, "#dReview");
  await sleep(300);
  const inReview = await page.evaluate(() => /複習錯題/.test(document.querySelector(".ttl")?.textContent || ""));
  ok(inReview, "『複習錯題』可導向複習頁");

  // 回首頁→重進聽寫→全跳過→完成卡『聽寫 0 / N 句』→再來一輪重置回 1/N
  await tap(page, '.tab[data-route="home"]');
  await page.waitForSelector(".mode-card", { timeout: 6000 });
  await tap(page, '.tab[data-route="dictation"]');
  await page.waitForSelector("#nextBtn", { timeout: 6000 });
  for (let k = 0; k < N; k++) { await page.evaluate(() => document.querySelector("#nextBtn")?.click()); await sleep(30); }
  await sleep(120);
  const skip = await page.evaluate(() => ({
    zero: /聽寫 0 \/ \d+ 句/.test(document.body.innerText),
    noAvg: /這一輪沒有作答/.test(document.body.innerText),
    again: !!document.querySelector("#dAgain"),
  }));
  ok(skip.zero && skip.again, "全跳過→完成卡『聽寫 0 / N 句』+再來一輪");
  ok(skip.noAvg, "全跳過→顯示『這一輪沒有作答』（誠實計分）");
  await tap(page, "#dAgain");
  await sleep(200);
  const restarted = await page.evaluate(() => (document.querySelector(".pill-lv")?.textContent || "").includes("1/"));
  ok(restarted, "『再來一輪』重置回 1/N");

  ok(errs.length === 0, "0 console error, got " + errs.length + " " + JSON.stringify(errs.slice(0, 3)));
  console.log(`\n[${ARG === "local" ? "LOCAL" : "LIVE"}] PASS ${pass} / FAIL ${fail}`);
} finally {
  await browser.close();
  if (server) server.close();
}
process.exit(fail ? 1 : 0);
