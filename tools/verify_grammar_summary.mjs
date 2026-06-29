// 第28輪驗證：文法填空「本回合完成總結」端到端真機（本機 local / 線上 <URL> 共用）。
// 驗：做完 15 題後出現完成卡(分數/正確率/鼓勵)、有錯題出「複習錯題」鈕可進複習、再來一輪重置回 1/15、回首頁；全程 0 console error。
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
  // 老用戶（跳過 onboarding）、清空狀態：goto → seed → goto（沿用既有 verify 慣例，不用 reload 以免 SW 干擾）
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 6000 });

  // 進文法
  await tap(page, '.tab[data-route="grammar"]');
  await page.waitForSelector(".pill-lv", { timeout: 6000 });
  const total = await page.evaluate(() => parseInt(document.querySelector(".pill-lv").textContent.split("/")[1]));
  ok(total === 15, "題庫 15 題, got " + total);

  // 第一輪：每題都作答（選第一個選項，保證有對有錯→產生錯題）
  for (let k = 0; k < total; k++) {
    await page.evaluate(() => { const o = document.querySelector(".opt:not([disabled])"); if (o) o.click(); });
    await sleep(50);
    if (k === total - 1) {
      const btnTxt = await page.evaluate(() => document.querySelector("#nextBtn").textContent.trim());
      ok(/完成本回合/.test(btnTxt), "最後一題按鈕=完成本回合, got " + btnTxt);
    }
    await page.evaluate(() => document.querySelector("#nextBtn").click());
    await sleep(60);
  }
  const sum = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      hasScore: /答對 \d+ \/ 15 題/.test(t),
      hasRate: /正確率 \d+%/.test(t),
      hasReview: !!document.querySelector("#gReview"),
      hasAgain: !!document.querySelector("#gAgain"),
      hasHome: !!document.querySelector("#gHome"),
      reviewTxt: document.querySelector("#gReview")?.textContent.trim() || "",
      notWrapped: !document.querySelector(".gap-blank"),
    };
  });
  ok(sum.hasScore, "完成卡有『答對 X / 15 題』");
  ok(sum.hasRate, "完成卡有『正確率 X%』");
  ok(sum.notWrapped, "完成後不再靜默 wrap 回題目（無 gap-blank）");
  ok(sum.hasAgain && sum.hasHome, "有『再來一輪』『回首頁』鈕");
  ok(sum.hasReview && /複習錯題/.test(sum.reviewTxt), "有錯題→出『複習錯題』鈕, got " + sum.reviewTxt);

  // 點複習錯題 → 進複習頁
  await tap(page, "#gReview");
  await sleep(300);
  const inReview = await page.evaluate(() => /複習錯題/.test(document.querySelector(".ttl")?.textContent || ""));
  ok(inReview, "『複習錯題』可導向複習頁");

  // 回首頁→重進文法→全跳過衝到完成卡→『再來一輪』重置回 1/15
  await tap(page, '.tab[data-route="home"]');
  await page.waitForSelector(".mode-card", { timeout: 6000 });
  await tap(page, '.tab[data-route="grammar"]');
  await page.waitForSelector("#nextBtn", { timeout: 6000 });
  for (let k = 0; k < total; k++) { await page.evaluate(() => document.querySelector("#nextBtn")?.click()); await sleep(40); }
  await sleep(100);
  const skipCard = await page.evaluate(() => ({ has: /答對 0 \/ 15 題/.test(document.body.innerText), again: !!document.querySelector("#gAgain") }));
  ok(skipCard.has && skipCard.again, "全跳過→完成卡『答對 0 / 15』+再來一輪");
  await tap(page, "#gAgain");
  await sleep(200);
  const restarted = await page.evaluate(() => (document.querySelector(".pill-lv")?.textContent || "").includes("1/15"));
  ok(restarted, "『再來一輪』重置回 1/15");

  ok(errs.length === 0, "0 console error, got " + errs.length + " " + JSON.stringify(errs.slice(0, 3)));
  console.log(`\n[${ARG === "local" ? "LOCAL" : "LIVE"}] PASS ${pass} / FAIL ${fail}`);
} finally {
  await browser.close();
  if (server) server.close();
}
process.exit(fail ? 1 : 0);
