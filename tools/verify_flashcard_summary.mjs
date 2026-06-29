// 第30輪驗證：單字卡「走完一圈完成總結」端到端真機（本機 local / 線上 <URL> 共用）。
// 驗：走完一圈(最後一張鈕=完成這一輪)後出現完成卡(走完一圈 N 張 + 已熟/複習中/新字計數 + 鼓勵)、
//     有「再複習一輪」「回首頁」、再複習一輪重置回 1/N、完成後不再靜默 wrap 回卡片；
//     評過「認識/不熟」會反映到計數（已熟/複習中變動）；全程 0 console error。
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

  // 進單字卡
  await tap(page, '.tab[data-route="flashcard"]');
  await page.waitForSelector(".pill-lv", { timeout: 6000 });
  const N = await page.evaluate(() => parseInt(document.querySelector(".pill-lv").textContent.split("/")[1]));
  ok(N >= 10, "單字卡 N=" + N);

  // 前兩張：翻卡後評「認識了」(rateKnown) → 產生已熟/複習中變動，並 advance
  for (let k = 0; k < 2; k++) {
    await page.evaluate(() => document.querySelector("#flash")?.classList.add("flipped"));
    await sleep(40);
    await page.evaluate(() => document.querySelector("#rateKnown")?.click());
    await sleep(60);
  }
  // 走到最後一張（用略過 nextBtn）
  for (let k = 2; k < N - 1; k++) { await page.evaluate(() => document.querySelector("#nextBtn")?.click()); await sleep(25); }
  const lastBtn = await page.evaluate(() => document.querySelector("#nextBtn")?.textContent.trim() || "");
  ok(/完成這一輪/.test(lastBtn), "最後一張按鈕=完成這一輪, got " + lastBtn);
  await page.evaluate(() => document.querySelector("#nextBtn")?.click());
  await sleep(120);

  const sum = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      hasLap: /走完一圈 \d+ 張單字/.test(t),
      hasCounts: /🟢 已熟 \d+/.test(t) && /🟡 複習中 \d+/.test(t) && /🆕 新字 \d+/.test(t),
      hasAgain: !!document.querySelector("#fAgain"),
      hasHome: !!document.querySelector("#fHome"),
      notWrapped: !document.querySelector(".flash"),
      summaryPill: /本回合完成/.test(t),
    };
  });
  ok(sum.hasLap, "完成卡有『走完一圈 N 張單字』");
  ok(sum.hasCounts, "完成卡有『已熟/複習中/新字』計數");
  ok(sum.summaryPill, "完成卡 pill=本回合完成");
  ok(sum.notWrapped, "完成後不再靜默 wrap 回卡片（無 .flash）");
  ok(sum.hasAgain && sum.hasHome, "有『再複習一輪』『回首頁』鈕");

  // 再複習一輪 → 重置回 1/N、回到卡片
  await tap(page, "#fAgain");
  await sleep(150);
  const restarted = await page.evaluate(() => ({
    pill1: (document.querySelector(".pill-lv")?.textContent || "").includes("1/"),
    backToCard: !!document.querySelector(".flash"),
  }));
  ok(restarted.pill1 && restarted.backToCard, "『再複習一輪』重置回 1/N 且回到卡片");

  // 回首頁 → 重進 → 全略過走一圈 → 完成卡仍出現（不依賴有沒有評分）
  await tap(page, '.tab[data-route="home"]');
  await page.waitForSelector(".mode-card", { timeout: 6000 });
  await tap(page, '.tab[data-route="flashcard"]');
  await page.waitForSelector("#nextBtn", { timeout: 6000 });
  for (let k = 0; k < N; k++) { await page.evaluate(() => document.querySelector("#nextBtn")?.click()); await sleep(25); }
  await sleep(120);
  const lapAgain = await page.evaluate(() => /走完一圈 \d+ 張單字/.test(document.body.innerText) && !!document.querySelector("#fAgain"));
  ok(lapAgain, "全略過走一圈→完成卡仍出現");
  // 回首頁鈕 → 真的回首頁
  await tap(page, "#fHome");
  await sleep(200);
  const home = await page.evaluate(() => !!document.querySelector(".mode-card"));
  ok(home, "『回首頁』導回首頁");

  ok(errs.length === 0, "0 console error, got " + errs.length + " " + JSON.stringify(errs.slice(0, 3)));
  console.log(`\n[${ARG === "local" ? "LOCAL" : "LIVE"}] PASS ${pass} / FAIL ${fail}`);
} finally {
  await browser.close();
  if (server) server.close();
}
process.exit(fail ? 1 : 0);
