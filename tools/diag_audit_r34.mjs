// 第34輪真機稽核：五大層皆飽和（口說8–17／動力18–20／內容分主題21–24+31／深淺主題25–27／三練習收尾28–30＋文法指示32＋daily對話33）。
// 依 🔴pin：先真機走「全部模式」找真實摩擦；找不到才做低風險 append-only 內容擴充，禁為改而改。
// 本輪聚焦：①各模式 375px 手機 + 桌面 是否破版/console error/warn ②首頁「進度可見性」（北極星：看得見進度＝初學者建立信心）
//          ③各模式首屏操作指示是否齊 ④內容量是否仍有單薄處（可量化的內容擴充缺口）。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] || "https://english-tutor-ai.pages.dev";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const errs = [], warns = [];
const ROUTES = ["home", "shadowing", "dictation", "conversation", "flashcard", "grammar"];

async function walk(page, label) {
  console.log(`\n===== ${label} =====`);
  for (const r of ROUTES) {
    await page.evaluate((rt) => window.location.hash = "", r);
    await page.evaluate((rt) => {
      const t = document.querySelector(`.tab[data-route="${rt}"]`);
      if (t) t.click();
    }, r);
    await sleep(550);
    const info = await page.evaluate(() => {
      const root = document.documentElement;
      const overflowX = root.scrollWidth - window.innerWidth;
      // 找超出視窗右界的元素
      let offenders = 0;
      document.querySelectorAll(".view *").forEach((el) => {
        const rc = el.getBoundingClientRect();
        if (rc.right > window.innerWidth + 2 && rc.width > 0 && rc.height > 0) offenders++;
      });
      const v = document.querySelector(".view");
      const txt = (v?.innerText || "").replace(/\n+/g, "|");
      // 首屏是否有操作指示（read-hint / 提示類）
      const hasHint = !!document.querySelector(".read-hint") || /🎯|🎤|✍️|🔊|📒|點|選|讀|錄|聽/.test(txt.slice(0, 120));
      return { overflowX, offenders, len: txt.length, head: txt.slice(0, 150), hasHint };
    });
    console.log(`  [${r}] overflowX=${info.overflowX}px offenders=${info.offenders} hint=${info.hasHint} len=${info.len}`);
    console.log(`     head: ${JSON.stringify(info.head)}`);
  }
}

try {
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); if (m.type() === "warning") warns.push(m.text()); });
  page.on("pageerror", (e) => errs.push("PAGEERR " + e.message));

  // ===== 手機 375px =====
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); localStorage.setItem("learnMotive", "daily"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card, .tab", { timeout: 8000 });
  await walk(page, "手機 375px");

  // ===== 首頁「進度可見性」稽核（北極星：看得見進度）=====
  await page.evaluate(() => { const t = document.querySelector(`.tab[data-route="home"]`); if (t) t.click(); });
  await sleep(500);
  const home = await page.evaluate(() => {
    const v = document.querySelector(".view");
    const txt = (v?.innerText || "");
    return {
      hasStreak: /連續|streak|🔥/.test(txt),
      hasGoal: /目標|今日|進度/.test(txt),
      hasRecommend: /為你推薦|推薦/.test(txt),
      // 是否有「整體掌握程度／學了多少」的總覽（北極星缺口候選）
      hasMastery: /掌握|熟|學會|累積|總共|已學|程度|level|等級/i.test(txt),
      modeCards: document.querySelectorAll(".mode-card").length,
      full: txt.replace(/\n{2,}/g, "\n").slice(0, 600),
    };
  });
  console.log("\n== 首頁進度可見性 ==");
  console.log("  streak:", home.hasStreak, " 每日目標:", home.hasGoal, " 為你推薦:", home.hasRecommend, " 整體掌握總覽:", home.hasMastery, " 模式卡:", home.modeCards);
  console.log("  首頁全文:\n" + home.full);

  // ===== 桌面 =====
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card, .tab", { timeout: 8000 });
  await walk(page, "桌面 1280px");

  console.log("\n========================================");
  console.log("console error 總計:", errs.length, errs.slice(0, 6));
  console.log("console warning 總計:", warns.length, warns.slice(0, 10));
} finally { await browser.close(); }
