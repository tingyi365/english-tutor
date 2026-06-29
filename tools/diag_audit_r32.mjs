// 第32輪真機稽核：五大層皆飽和(口說8–17/動力18–20/內容分主題21–24+31/深淺主題25–27/三練習收尾28–30)。
// 本輪先真機走全模式找「真實摩擦」；找不到才做低風險內容擴充/微文案，禁為改而改。
// 重點掃：各模式內容量(是否單薄)、首頁推薦緞帶、對話完成態、文案是否清楚、375px 破版、console。
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

  // 設定動機=旅遊(看推薦緞帶)、已 onboarded
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); localStorage.setItem("learnMotive", "travel"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });

  // ===== 首頁：推薦緞帶 + 精選句卡 + 模式卡文案 =====
  console.log("== 首頁 (動機=travel) ==");
  const home = await page.evaluate(() => {
    const v = document.querySelector(".view");
    return {
      reco: !!document.querySelector(".reco-ribbon, .reco, [class*='reco']"),
      goalCard: !!document.querySelector(".goal-card, [class*='goal']"),
      modeCards: document.querySelectorAll(".mode-card").length,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      text: (v?.innerText || "").replace(/\n+/g, "|").slice(0, 400),
    };
  });
  console.log("  推薦緞帶:", home.reco, " 目標卡:", home.goalCard, " 模式卡數:", home.modeCards, " 破版:", home.overflowX);
  console.log("  首頁文字:", JSON.stringify(home.text));

  // ===== 各內容模式：內容量 + 首屏文案是否清楚有引導 =====
  const modes = ["shadowing", "dictation", "flashcard", "grammar", "conversation"];
  for (const r of modes) {
    await page.evaluate((rt) => document.querySelector(`.tab[data-route="${rt}"]`)?.click(), r);
    await sleep(450);
    const info = await page.evaluate(() => {
      const v = document.querySelector(".view");
      const txt = (v?.innerText || "").replace(/\n+/g, "|");
      // 進度指示 (1/N) 抓總題數
      const m = txt.match(/(\d+)\s*\/\s*(\d+)/);
      let clipped = 0;
      document.querySelectorAll(".view *").forEach(e => { if (e.getBoundingClientRect().right > window.innerWidth + 2) clipped++; });
      return {
        total: m ? m[2] : "?",
        hasHint: /點|按|錄|聽|選|翻|說|讀/.test(txt),  // 首屏是否有操作提示
        overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
        clipped,
        head: txt.slice(0, 220),
      };
    });
    console.log(`\n== ${r} ==`);
    console.log(`  總題數/輪:${info.total} 有操作提示:${info.hasHint} 破版:${info.overflowX} 超界:${info.clipped}`);
    console.log("  首屏:", JSON.stringify(info.head));
  }

  // ===== conversation 走到底完成態 + 各主題 chip 內容量 =====
  console.log("\n== conversation 主題與完成態 ==");
  await page.evaluate(() => document.querySelector(`.tab[data-route="conversation"]`)?.click());
  await sleep(450);
  const conv = await page.evaluate(() => {
    const chips = [...document.querySelectorAll(".conv-chips .chip, .conv-chips button, [class*='conv'] button")].map(c => c.textContent.trim());
    return { chips };
  });
  console.log("  主題 chips:", JSON.stringify(conv.chips));

  console.log("\nconsole error 基線:", errs.length, errs.slice(0, 5));
  console.log("console warning 基線:", warns.length, warns.slice(0, 8));
} finally { await browser.close(); }
