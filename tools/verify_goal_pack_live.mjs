// 線上正式站真機驗「目標精選句」（第21輪）：直接打 https://english-tutor-ai.pages.dev。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://english-tutor-ai.pages.dev/";
const results = [];
const ok = (n, c, extra = "") => results.push({ n, pass: !!c, extra });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.goto(BASE, { waitUntil: "networkidle0" });

  // 動機=旅遊 → 精選句卡
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); localStorage.setItem("learnMotive", "travel"); });
  await page.evaluate(async () => { const app = await import("/assets/js/app.js"); window.__app = app; app.navigate("home"); });
  await page.waitForSelector(".goal-card", { timeout: 6000 });
  const card = await page.evaluate(() => {
    const items = [...document.querySelectorAll(".goal-item")];
    return { title: document.querySelector(".goal-head-txt b")?.textContent.trim() || "",
             count: items.length, idxs: items.map((b) => parseInt(b.dataset.idx, 10)),
             en0: items[0]?.querySelector(".gi-en")?.textContent.trim() || "" };
  });
  ok("線上：旅遊精選句卡標題正確", /為「旅遊出國」精選句/.test(card.title), card.title);
  ok("線上：精選 1~3 句", card.count >= 1 && card.count <= 3, `count=${card.count}`);
  const allTravel = await page.evaluate(async (idxs) => {
    const d = await import("/assets/js/data.js");
    return idxs.every((i) => d.SENTENCES[i].topic === "travel");
  }, card.idxs);
  ok("線上：卡內每句 topic 都=travel", allTravel, JSON.stringify(card.idxs));

  // 點第一句 → 進跟讀 + 顯示該句
  const tIdx = card.idxs[0], tEn = card.en0;
  await page.evaluate(() => document.querySelector(".goal-item").click());
  await sleep(400);
  const after = await page.evaluate(() => ({ hash: location.hash, shadowIdx: localStorage.getItem("shadowIdx"), body: document.body.textContent }));
  ok("線上：點精選句 → #shadowing", after.hash === "#shadowing", after.hash);
  ok("線上：shadowIdx 寫成該句索引", after.shadowIdx === String(tIdx), `shadowIdx=${after.shadowIdx}`);
  ok("線上：跟讀頁顯示該精選句", after.body.includes(tEn), tEn.slice(0, 40));

  // 未選動機 → 無卡（無回歸）
  await page.evaluate(async () => { localStorage.removeItem("learnMotive"); const app = await import("/assets/js/app.js"); app.navigate("home"); });
  await page.waitForSelector(".mode-grid", { timeout: 6000 });
  const noM = await page.evaluate(() => ({ goal: document.querySelectorAll(".goal-card").length, modes: document.querySelectorAll(".mode-card").length }));
  ok("線上：未選動機 → 無精選句卡", noM.goal === 0, `goal=${noM.goal}`);
  ok("線上：未選動機 → 5 模式照常（無回歸）", noM.modes === 5, `modes=${noM.modes}`);

  ok("線上：0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 線上正式站 目標精選句 真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally { await browser.close(); }
