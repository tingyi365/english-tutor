// 第32輪驗證：文法填空首屏新增操作指示（補上唯一缺操作提示的模式＝降低初學者「不知道要幹嘛」摩擦）。
// 真 Chrome、375px 手機、真實模組+真實渲染。用法：node tools/verify_grammar_hint.mjs [URL]
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
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  await page.evaluate(() => document.querySelector(`.tab[data-route="grammar"]`)?.click());
  await page.waitForSelector(".gap-sentence", { timeout: 8000 });

  // 首屏：指示出現、在選項之前、含「選/正確/對不對」關鍵語意
  const f = await page.evaluate(() => {
    const card = document.querySelector(".card");
    const hint = card?.querySelector(".read-hint");
    const opts = card?.querySelector(".opt-grid");
    const hintText = hint?.textContent || "";
    // 指示是否在選項之前（DOM 順序）
    let before = false;
    if (hint && opts) before = !!(hint.compareDocumentPosition(opts) & Node.DOCUMENT_POSITION_FOLLOWING);
    return {
      hasHint: !!hint,
      hintText,
      before,
      mentionsSelect: /選|挑/.test(hintText),
      mentionsFeedback: /對不對|對與錯|原因|為什麼|告訴你/.test(hintText),
      optCount: card?.querySelectorAll(".opt").length || 0,
    };
  });
  ok("首屏有操作指示(.read-hint)", f.hasHint);
  ok("指示位於選項之前(先讀指示再選)", f.before);
  ok("指示說明「要做什麼」(選/挑出正確字)", f.mentionsSelect);
  ok("指示說明「會得到什麼回饋」(對不對/原因)", f.mentionsFeedback);
  ok("選項仍正常渲染(四選一)", f.optCount === 4);
  console.log("  指示文字:", JSON.stringify(f.hintText));

  // 作答後仍正常：點第一個選項，確認即時對錯+解析照舊（零回歸）
  await page.evaluate(() => document.querySelectorAll(".opt")[0]?.click());
  await sleep(150);
  const after = await page.evaluate(() => ({
    hasResult: /✅ 答對了|❌ 再想想/.test(document.querySelector("#gramResult")?.textContent || ""),
    optsDisabled: [...document.querySelectorAll(".opt")].every((b) => b.disabled),
    hintStill: !!document.querySelector(".read-hint"),
  }));
  ok("作答後即時對錯+解析照舊(零回歸)", after.hasResult);
  ok("作答後選項鎖定照舊", after.optsDisabled);

  // 走完整輪仍出完成總結（第28輪收尾不回歸）
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  await page.evaluate(() => document.querySelector(`.tab[data-route="grammar"]`)?.click());
  await page.waitForSelector(".pill-lv", { timeout: 8000 });
  const gN = await page.evaluate(() => parseInt(document.querySelector(".pill-lv").textContent.split("/")[1]));
  for (let k = 0; k < gN; k++) { await page.evaluate(() => document.querySelector("#nextBtn")?.click()); await sleep(50); }
  const summary = await page.evaluate(() => /本回合完成|答對 \d+ \/ \d+ 題/.test(document.body.innerText));
  ok("走完整輪仍出完成總結卡(第28輪不回歸)", summary);

  ok("0 console error", errs.length === 0);

  console.log("\n--- 結果 ---");
  results.forEach(([s, n]) => console.log(`  [${s}] ${n}`));
  const pass = results.filter((r) => r[0] === "PASS").length;
  console.log(`\n${pass}/${results.length} PASS, console errors: ${errs.length}`, errs.slice(0, 5));
} finally { await browser.close(); if (server) server.close(); }
