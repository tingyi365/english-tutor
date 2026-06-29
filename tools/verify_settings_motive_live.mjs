// 線上正式站真 Chrome 端到端驗「設定面板可單獨重選學習動機」：
// https://english-tutor-ai.pages.dev — ⚙️設定 直接改學習動機 → 即時更新首頁推薦緞帶 + 跨次持久化 + 可清未設定。
// 0 console error / 375px 手機。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://english-tutor-ai.pages.dev/";

const results = [];
const ok = (n, c, extra = "") => results.push({ n, pass: !!c, extra });
const tap = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); }, sel);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function setMotiveAndReadHome(page, val) {
  await tap(page, "#settingsBtn"); await sleep(150);
  await page.select("#motiveSelect", val); await sleep(220);
  await tap(page, "#settingsClose"); await sleep(150);
  return page.evaluate(() => {
    const rec = document.querySelector(".mode-card.mc-rec");
    return {
      motive: localStorage.getItem("learnMotive"),
      recCount: document.querySelectorAll(".mode-card.mc-rec").length,
      recTitle: rec?.querySelector("h3")?.textContent.trim() || "",
      firstTitle: document.querySelector(".mode-card")?.querySelector("h3")?.textContent.trim() || "",
    };
  });
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  ok("線上老用戶不出 onboarding", await page.evaluate(() => !document.getElementById("onboarding")));

  await tap(page, "#settingsBtn"); await sleep(180);
  const sel = await page.evaluate(() => {
    const s = document.getElementById("motiveSelect");
    if (!s) return null;
    return { exists: true, optCount: s.options.length, optVals: [...s.options].map((o) => o.value),
             firstLabel: s.options[0]?.textContent.trim() || "", curVal: s.value };
  });
  ok("線上設定面板有 #motiveSelect", !!sel?.exists, JSON.stringify(sel));
  ok("線上選項=未設定+4動機（共5）", sel?.optCount === 5, `count=${sel?.optCount}`);
  ok("線上選項值齊", JSON.stringify(sel?.optVals) === JSON.stringify(["", "travel", "work", "exam", "daily"]), JSON.stringify(sel?.optVals));
  ok("線上首項為未設定", /未設定/.test(sel?.firstLabel || ""), sel?.firstLabel);
  ok("線上初始空值", sel?.curVal === "", `cur=${sel?.curVal}`);
  await tap(page, "#settingsClose"); await sleep(120);
  ok("線上初始首頁無推薦緞帶", await page.evaluate(() => document.querySelectorAll(".mode-card.mc-rec").length === 0));

  const work = await setMotiveAndReadHome(page, "work");
  ok("線上改工作 → learnMotive=work", work.motive === "work", `m=${work.motive}`);
  ok("線上改工作 → 推薦卡=跟讀糾音、排最前、僅1張", work.recTitle === "跟讀糾音" && work.firstTitle === "跟讀糾音" && work.recCount === 1, JSON.stringify(work));

  const travel = await setMotiveAndReadHome(page, "travel");
  ok("線上改旅遊 → 推薦卡=情境對話（即時切換不殘留）", travel.recTitle === "情境對話" && travel.recCount === 1, JSON.stringify(travel));

  const exam = await setMotiveAndReadHome(page, "exam");
  ok("線上改考試 → 推薦卡=文法填空", exam.recTitle === "文法填空", exam.recTitle);

  const none = await setMotiveAndReadHome(page, "");
  ok("線上清未設定 → learnMotive 移除、無推薦緞帶", none.motive === null && none.recCount === 0, JSON.stringify(none));

  await setMotiveAndReadHome(page, "daily");
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  await tap(page, "#settingsBtn"); await sleep(180);
  const persist = await page.evaluate(() => ({
    selVal: document.getElementById("motiveSelect")?.value,
    stored: localStorage.getItem("learnMotive"),
    recTitle: document.querySelector(".mode-card.mc-rec h3")?.textContent.trim() || "",
  }));
  ok("線上跨次持久化：reload 後 learnMotive=daily", persist.stored === "daily", `s=${persist.stored}`);
  ok("線上跨次持久化：設定回讀 motiveSelect=daily", persist.selVal === "daily", `v=${persist.selVal}`);
  ok("線上跨次持久化：首頁推薦=跟讀糾音", persist.recTitle === "跟讀糾音", persist.recTitle);

  ok("線上 0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 線上：設定面板單獨重選學習動機 真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
}
