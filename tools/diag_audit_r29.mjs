// 第29輪真機稽核：走訪線上站找「一輪做完無收尾」摩擦（聽寫/單字卡，比照第28輪文法）。
// 用法：node tools/diag_audit_r29.mjs [URL]（預設線上正式站）。375px 手機，收 console error。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] || "https://english-tutor-ai.pages.dev";
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
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });

  // ===== 聽寫：走到最後一句按「下一句」看是否靜默 wrap 回 1/N、有無完成總結 =====
  await page.click('.tab[data-route="dictation"]');
  await page.waitForSelector(".pill-lv", { timeout: 8000 });
  const dN = await page.evaluate(() => parseInt(document.querySelector(".pill-lv").textContent.split("/")[1]));
  const seq = [];
  for (let k = 0; k < dN; k++) {
    seq.push(await page.evaluate(() => document.querySelector(".pill-lv")?.textContent.trim()));
    await page.evaluate(() => document.querySelector("#nextBtn")?.click());
    await sleep(40);
  }
  const afterLast = await page.evaluate(() => ({
    pill: document.querySelector(".pill-lv")?.textContent.trim() || "",
    hasInput: !!document.querySelector("#answer"),
    bodyHasSummary: /本回合完成|答對 \d+ \/ \d+ 句|聽寫完成/.test(document.body.innerText),
  }));
  console.log("聽寫題數 N =", dN);
  console.log("聽寫 pillSeq 頭尾:", seq[0], "...", seq[dN - 1], "→（按下一句後）", afterLast.pill);
  console.log("聽寫 最後一句後 仍是輸入題畫面(hasInput):", afterLast.hasInput, " 有完成總結:", afterLast.bodyHasSummary);
  const dictWrapsSilently = afterLast.pill.includes("1/" + dN) && afterLast.hasInput && !afterLast.bodyHasSummary;
  console.log("→ 聽寫【靜默 wrap 回 1、無完成總結】摩擦存在:", dictWrapsSilently);

  // ===== 單字卡：略過走一圈看是否靜默 wrap、有無收尾 =====
  await page.click('.tab[data-route="home"]');
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  await page.click('.tab[data-route="flashcard"]');
  await page.waitForSelector(".pill-lv", { timeout: 8000 });
  const fN = await page.evaluate(() => parseInt(document.querySelector(".pill-lv").textContent.split("/")[1]));
  for (let k = 0; k < fN; k++) { await page.evaluate(() => document.querySelector("#nextBtn")?.click()); await sleep(30); }
  const fAfter = await page.evaluate(() => ({
    pill: document.querySelector(".pill-lv")?.textContent.trim() || "",
    hasFlash: !!document.querySelector(".flash"),
    bodyHasSummary: /本回合完成|複習完|這輪/.test(document.body.innerText),
  }));
  console.log("\n單字卡 N =", fN, " 走一圈後 pill:", fAfter.pill, " 仍是卡片:", fAfter.hasFlash, " 有收尾:", fAfter.bodyHasSummary);

  console.log("\nconsole error 基線:", errs.length, errs.slice(0, 3));
} finally { await browser.close(); }
