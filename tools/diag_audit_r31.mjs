// 第31輪真機稽核（修正版）：測驗式三模式收尾已補齊(文法28/聽寫29/單字卡30)。本輪先真機走全模式找「真實摩擦」。
// 正確導覽：對話 route=conversation；設定=點 #settingsBtn 開 sheet；複習=點首頁 #reviewCard。
// 掃：onboarding 首次體驗、review 空狀態引導、conversation 完成態、各模式 375px 手機破版/console warn/文案不清。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] || "https://english-tutor-ai.pages.dev";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const errs = [], warns = [];
try {
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); if (m.type() === "warning") warns.push(m.text()); });
  page.on("pageerror", (e) => errs.push("PAGEERR " + e.message));
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });

  // ===== onboarding 首次進站體驗 =====
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await sleep(500);
  const onb = await page.evaluate(() => {
    const ob = document.getElementById("onboarding");
    return { has: !!ob, text: (ob?.innerText || "").replace(/\n+/g, "|").slice(0, 160),
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      hasNext: !!ob?.querySelector("button") };
  });
  console.log("== onboarding (首次) ==");
  console.log("  顯示:", onb.has, " 破版:", onb.overflowX, " 有鈕:", onb.hasNext);
  console.log("  文案:", JSON.stringify(onb.text));

  // 跳過 onboarding 進主站
  await page.evaluate(() => { localStorage.setItem("onboarded", "1"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });

  // ===== review 複習 空狀態（無錯題時）=====
  console.log("\n== review 複習 空狀態 ==");
  await page.evaluate(() => document.getElementById("reviewCard")?.click());
  await sleep(400);
  const rv = await page.evaluate(() => {
    const v = document.querySelector(".view");
    return { route: location.hash, text: (v?.innerText || "").replace(/\n+/g, "|").slice(0, 260),
      hasCTA: !!v?.querySelector("button, .btn, [data-route], [role='button']"),
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1 };
  });
  console.log("  hash:", rv.route, " 破版:", rv.overflowX, " 有引導CTA:", rv.hasCTA);
  console.log("  文案:", JSON.stringify(rv.text));

  // ===== conversation 對話 完成態 =====
  console.log("\n== conversation 對話 ==");
  await page.evaluate(() => document.querySelector(`.tab[data-route="conversation"]`)?.click());
  await sleep(500);
  const cv = await page.evaluate(() => {
    const v = document.querySelector(".view");
    return { hasChips: !!document.querySelector(".conv-chips"), pill: document.querySelector(".pill-lv")?.textContent.trim(),
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      text: (v?.innerText || "").replace(/\n+/g, "|").slice(0, 120) };
  });
  console.log("  chips:", cv.hasChips, " pill:", cv.pill, " 破版:", cv.overflowX);
  // 連按略過走到對話結束，看完成態
  for (let k = 0; k < 12; k++) { await page.evaluate(() => document.querySelector("#skipBtn")?.click()); await sleep(180); }
  const cvEnd = await page.evaluate(() => ({ done: /對話完成|再練一次/.test(document.body.innerText), text: (document.querySelector("#convCtl")?.innerText || "").replace(/\n+/g, "|").slice(0, 80) }));
  console.log("  走到底有完成態:", cvEnd.done, " ctl:", JSON.stringify(cvEnd.text));

  // ===== settings sheet 開啟 + 各 field 渲染 =====
  console.log("\n== settings sheet ==");
  await page.evaluate(() => document.getElementById("settingsBtn")?.click());
  await sleep(300);
  const st = await page.evaluate(() => {
    const p = document.getElementById("settingsPanel");
    const visible = p && !p.classList.contains("hidden");
    return { visible, overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      fields: [...(p?.querySelectorAll(".field span") || [])].map(s => s.textContent.trim().slice(0, 24)) };
  });
  console.log("  開啟:", st.visible, " 破版:", st.overflowX);
  console.log("  fields:", JSON.stringify(st.fields));

  // ===== 各模式 375px 文字溢出/裁切快掃 =====
  console.log("\n== 各模式手機渲染快掃 ==");
  await page.evaluate(() => document.getElementById("settingsClose")?.click());
  for (const r of ["home", "shadowing", "dictation", "conversation", "flashcard", "grammar"]) {
    await page.evaluate((rt) => document.querySelector(`.tab[data-route="${rt}"]`)?.click(), r);
    await sleep(300);
    const info = await page.evaluate(() => {
      const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
      // 偵測有無元素橫向超出視窗（破版）
      let clipped = 0;
      document.querySelectorAll(".view *").forEach(e => { if (e.getBoundingClientRect().right > window.innerWidth + 2) clipped++; });
      return { overflowX, clipped };
    });
    console.log(`  ${r.padEnd(13)} 橫向溢出:${info.overflowX} 超界元素數:${info.clipped}`);
  }

  console.log("\nconsole error 基線:", errs.length, errs.slice(0, 5));
  console.log("console warning 基線:", warns.length, warns.slice(0, 8));
} finally { await browser.close(); }
