// 第28輪稽核：真機走訪線上站各模式，找真實「不容易學」摩擦點 + console error 基線。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] || "https://english-tutor-ai.pages.dev/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const errs = [];
try {
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push("PAGEERR " + e.message));
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); });

  // 走訪文法：答到最後一題、按「下一題」，看有沒有「回合完成/總結/分數」
  await page.evaluate(async () => { const app = await import("/assets/js/app.js?a=1"); app.navigate("grammar"); });
  await sleep(400);
  const gram = await page.evaluate(async () => {
    // 連按 next 直到 wrap，記錄 pill 文字（x/N），看最後一題後是否有完成畫面
    const pillSeq = [];
    let hasSummaryWord = false;
    for (let k = 0; k < 40; k++) {
      const pill = document.querySelector(".pill-lv");
      pillSeq.push(pill ? pill.textContent.trim() : "?");
      const txt = document.body.innerText;
      if (/回合完成|本回合|答對 \d+\s*\/\s*\d+|這一輪|完成所有/.test(txt)) hasSummaryWord = true;
      const next = document.querySelector("#nextBtn");
      if (!next) break;
      // 先選一個答案再下一題（模擬真實作答）
      const opt = document.querySelector(".opt:not([disabled])");
      if (opt) opt.click();
      next.click();
      await new Promise((r) => setTimeout(r, 60));
    }
    return { pillSeq, hasSummaryWord };
  });
  // 偵測 wrap：pill 從 x/N 跳回 1/N 而中間無完成畫面
  const seq = gram.pillSeq;
  const total = seq[0] ? seq[0].split("/")[1] : "?";
  let wrapped = false;
  for (let k = 1; k < seq.length; k++) {
    const cur = (seq[k] || "").split("・").pop();
    const prev = (seq[k - 1] || "").split("・").pop();
    if (prev && prev.endsWith("/" + total) && parseInt(prev) === parseInt(total) && cur && parseInt(cur) === 1) { wrapped = true; break; }
  }
  console.log("[grammar] total=", total, "wrappedSilently=", wrapped, "hasCompletionSummary=", gram.hasSummaryWord);
  console.log("[grammar] pillSeq=", seq.slice(0, Math.min(seq.length, parseInt(total) + 3)).join(" | "));

  console.log("[console errors]", errs.length, errs.slice(0, 5));
} finally { await browser.close(); }
