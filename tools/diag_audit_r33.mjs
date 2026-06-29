// 第33輪真機稽核：五大層皆飽和。依 🔴pin 先真機走全模式找真實摩擦；
// 找不到才做低風險內容擴充 append-only，禁為改而改。
// 本輪重點：①首訪 onboarding 是否正常（首次進站體驗）②各主題對話量是否均衡（內容單薄處）
//          ③空狀態(複習無錯題)是否有引導 ④375px 破版 ⑤console。
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

  // ===== ① 首訪 onboarding（全清空，模擬第一次進站）=====
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await sleep(700);
  const ob = await page.evaluate(() => {
    const v = document.querySelector(".view, body");
    const txt = (v?.innerText || "").replace(/\n+/g, "|");
    return {
      hasOnboard: /歡迎|開始|起步|為你|動機|旅遊|工作|考試|日常/.test(txt),
      hasBtn: document.querySelectorAll("button").length,
      overflowX: document.documentElement.scrollWidth > window.innerWidth + 1,
      head: txt.slice(0, 260),
    };
  });
  console.log("== ① 首訪 onboarding ==");
  console.log("  有引導文字:", ob.hasOnboard, " 按鈕數:", ob.hasBtn, " 破版:", ob.overflowX);
  console.log("  首屏:", JSON.stringify(ob.head));

  // ===== ② 各主題對話量（內容是否均衡）=====
  await page.evaluate(() => { localStorage.setItem("onboarded", "1"); localStorage.setItem("learnMotive", "daily"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  await page.evaluate(() => document.querySelector(`.tab[data-route="conversation"]`)?.click());
  await sleep(450);
  const conv = await page.evaluate(() => {
    const chips = [...document.querySelectorAll(".conv-chip")];
    const counts = {};
    // 逐 chip 點，讀 pill 的 x/N
    return chips.map(c => c.textContent.trim());
  });
  console.log("\n== ② 對話主題 chips ==", JSON.stringify(conv));
  // 逐主題點開讀總數
  const topicCounts = {};
  for (const label of conv) {
    await page.evaluate((lb) => {
      const c = [...document.querySelectorAll(".conv-chip")].find(x => x.textContent.trim() === lb);
      c?.click();
    }, label);
    await sleep(350);
    const n = await page.evaluate(() => {
      const t = (document.querySelector(".view")?.innerText || "").match(/(\d+)\s*\/\s*(\d+)/);
      return t ? t[2] : "?";
    });
    topicCounts[label] = n;
  }
  console.log("  各主題對話數:", JSON.stringify(topicCounts));

  // ===== ③ 複習空狀態（無錯題時是否有引導）=====
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => { localStorage.setItem("onboarded", "1"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  const reviewCard = await page.evaluate(() => !!document.querySelector("#reviewCard, [class*='review']"));
  console.log("\n== ③ 複習入口卡（無錯題時）出現:", reviewCard, "（不出現＝設計合理，無空狀態摩擦）");

  console.log("\nconsole error 基線:", errs.length, errs.slice(0, 5));
  console.log("console warning 基線:", warns.length, warns.slice(0, 8));
} finally { await browser.close(); }
