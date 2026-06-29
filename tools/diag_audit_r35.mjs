// 第35輪真機稽核：五大層皆飽和、五模式首屏指示全補齊（跟讀/聽寫/單字卡/文法32/對話34）。
// 依 🔴pin：先真機走全模式找真實摩擦；找不到才做低風險 append-only 內容擴充，禁為改而改。
// 本輪特別查 R34 backlog #2(b)：「其他模式若有類似切換離開排程觸發的 console 風險」——
//   逐模式做「啟動排程動作(錄音/節拍器/朗讀)後 0.3s 內切走別的 tab」壓力測試，看是否拋 console error。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] || "https://english-tutor-ai.pages.dev";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const errs = [], warns = [];
const ROUTES = ["home", "shadowing", "dictation", "conversation", "flashcard", "grammar"];

async function gotoMode(page, rt) {
  await page.evaluate((r) => { const t = document.querySelector(`.tab[data-route="${r}"]`); if (t) t.click(); }, rt);
  await sleep(450);
}

async function walk(page, label) {
  console.log(`\n===== ${label} =====`);
  for (const r of ROUTES) {
    await gotoMode(page, r);
    const info = await page.evaluate(() => {
      const root = document.documentElement;
      const overflowX = root.scrollWidth - window.innerWidth;
      let offenders = 0;
      document.querySelectorAll(".view *").forEach((el) => {
        const rc = el.getBoundingClientRect();
        if (rc.right > window.innerWidth + 2 && rc.width > 0 && rc.height > 0) offenders++;
      });
      const v = document.querySelector(".view");
      const txt = (v?.innerText || "").replace(/\n+/g, "|");
      const hasHint = !!document.querySelector(".read-hint") || /🎯|🎤|✍️|🔊|📒|點|選|讀|錄|聽/.test(txt.slice(0, 140));
      return { overflowX, offenders, len: txt.length, head: txt.slice(0, 120), hasHint };
    });
    console.log(`  [${r}] overflowX=${info.overflowX}px offenders=${info.offenders} hint=${info.hasHint} len=${info.len}`);
  }
}

// 排程壓力測試：在某模式點一個「會排程 setTimeout/setInterval」的按鈕，0.3s 後切到別的 tab，看是否拋錯
async function navAwayStress(page, mode, btnSel, btnDesc, awayRoute) {
  const before = errs.length;
  await gotoMode(page, mode);
  const clicked = await page.evaluate((sel) => {
    const b = document.querySelector(sel);
    if (b) { b.click(); return true; }
    return false;
  }, btnSel);
  await sleep(300);                 // 排程已啟動、callback 尚未觸發
  await gotoMode(page, awayRoute);  // 切走 → view.innerHTML 被清空
  await sleep(1400);                // 等所有排程 callback 觸發完
  const added = errs.length - before;
  console.log(`  [stress] ${mode} 點「${btnDesc}」(${clicked ? "命中" : "未找到按鈕"}) 後切到 ${awayRoute} → 新增 console error: ${added}`);
  return added;
}

try {
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); if (m.type() === "warning") warns.push(m.text()); });
  page.on("pageerror", (e) => errs.push("PAGEERR " + e.message));

  // 手機 375px
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); localStorage.setItem("learnMotive", "daily"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card, .tab", { timeout: 8000 });
  await walk(page, "手機 375px");

  // 桌面
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card, .tab", { timeout: 8000 });
  await walk(page, "桌面 1280px");

  // ===== R34 backlog #2(b)：排程切走壓力測試 =====
  console.log("\n== 切走排程壓力測試（找 R34 backlog #2(b) 其他模式 console 風險）==");
  // 跟讀：🔊 聽示範（speak 排程）
  await navAwayStress(page, "shadowing", "#listenBtn", "🔊 聽示範", "home");
  // 節拍器：跟讀模式的 🥁 打節拍（setInterval）
  await navAwayStress(page, "shadowing", "#metroBtn", "🥁 打節拍", "grammar");
  // 單字卡：🔊 發音（speak 排程）
  await navAwayStress(page, "flashcard", "#sayBtn", "🔊 發音", "home");
  // 聽寫：🔊 播放（speak 排程）
  await navAwayStress(page, "dictation", "#playBtn", "🔊 播放", "home");
  // 對話：略過（nextTurn 排程，R34 已修，回歸驗證應=0）
  await gotoMode(page, "conversation");
  await page.evaluate(() => { const b = [...document.querySelectorAll("button")].find(x => /略過|換我說|聽建議/.test(x.textContent)); if (b) b.click(); });
  await sleep(300);
  { const before = errs.length; await gotoMode(page, "home"); await sleep(1400);
    console.log(`  [stress] conversation 對話中切走(R34已修) → 新增 console error: ${errs.length - before}`); }

  console.log("\n========================================");
  console.log("console error 總計:", errs.length, errs.slice(0, 8));
  console.log("console warning 總計:", warns.length, warns.slice(0, 10));
} finally { await browser.close(); }
