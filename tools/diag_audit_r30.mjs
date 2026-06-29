// 第30輪真機稽核：走訪線上站找真實摩擦。重點＝單字卡(flashcard)「走完一圈無收尾」是否真實摩擦
// （第29輪 backlog #2 點名：若使用者期待走完一圈給小結＝真實摩擦再做，否則勿為改而改）。
// 同時全模式 console error / 手機破版基線掃描。用法：node tools/diag_audit_r30.mjs [URL]。375px 手機。
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

  // ===== 單字卡：略過走「整整一圈」(len 張) 看是否靜默 wrap 回 1/N、有無收尾 =====
  await page.click('.tab[data-route="flashcard"]');
  await page.waitForSelector(".pill-lv", { timeout: 8000 });
  const fN = await page.evaluate(() => parseInt(document.querySelector(".pill-lv").textContent.split("/")[1]));
  const fseq = [];
  for (let k = 0; k < fN; k++) {
    fseq.push(await page.evaluate(() => document.querySelector(".pill-lv")?.textContent.trim()));
    await page.evaluate(() => document.querySelector("#nextBtn")?.click());
    await sleep(30);
  }
  const fAfter = await page.evaluate(() => ({
    pill: document.querySelector(".pill-lv")?.textContent.trim() || "",
    hasFlash: !!document.querySelector(".flash"),
    hasNext: !!document.querySelector("#nextBtn"),
    bodyHasSummary: /本回合完成|複習完|走完|這一輪|認識 \d+|待加強/.test(document.body.innerText),
  }));
  console.log("單字卡 N =", fN);
  console.log("單字卡 pillSeq 頭尾:", fseq[0], "...", fseq[fN - 1], "→（走完整整一圈後）", fAfter.pill);
  console.log("單字卡 走完一圈後 仍是卡片(hasFlash):", fAfter.hasFlash, " 有收尾總結:", fAfter.bodyHasSummary);
  const flashWrapsSilently = fAfter.pill.includes("1/" + fN) && fAfter.hasFlash && !fAfter.bodyHasSummary;
  console.log("→ 單字卡【走完一圈靜默 wrap 回 1、無任何收尾/進度小結】摩擦存在:", flashWrapsSilently);

  // ===== 全模式快掃：點過各 tab，確認渲染+無破版 =====
  console.log("\n--- 全模式快掃（console error / 渲染） ---");
  for (const r of ["home", "shadowing", "grammar", "dictation", "flashcard", "dialogue"]) {
    await page.evaluate((rt) => document.querySelector(`.tab[data-route="${rt}"]`)?.click(), r);
    await sleep(250);
    const info = await page.evaluate(() => {
      const v = document.querySelector(".view");
      const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
      return { has: !!(v && v.innerText.trim().length), overflowX };
    });
    console.log(`  ${r.padEnd(10)} 有內容:${info.has} 橫向溢出(破版):${info.overflowX}`);
  }

  console.log("\nconsole error 基線:", errs.length, errs.slice(0, 5));
} finally { await browser.close(); }
