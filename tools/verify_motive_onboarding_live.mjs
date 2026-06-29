// 線上正式站真機驗「學習動機 onboarding → 推薦起始模式」：直接打 https://english-tutor-ai.pages.dev。
// 新手第3步問動機→第4步推薦+直接開始→首頁推薦緞帶。0 console error / 375px 手機。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://english-tutor-ai.pages.dev/";
const results = [];
const ok = (n, c, extra = "") => results.push({ n, pass: !!c, extra });
const tap = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); }, sel);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.goto(BASE, { waitUntil: "networkidle0" });
  // 確保乾淨新手狀態
  await page.evaluate(() => localStorage.clear());
  await page.reload({ waitUntil: "networkidle0" });
  await page.waitForSelector("#onboarding", { timeout: 10000 });
  ok("線上新手首訪出現 onboarding", true);
  await page.evaluate(async () => { window.__app = await import("/assets/js/app.js"); });

  const dots = await page.evaluate(() => document.querySelectorAll("#onboarding .onb-dots i").length);
  ok("線上 onboarding 共 4 步", dots === 4, `dots=${dots}`);
  await tap(page, "#onbNext"); await sleep(80); // goal
  await tap(page, "#onbNext"); await sleep(80); // motive
  const motiveCount = await page.evaluate(() => document.querySelectorAll("#onbMotives .onb-motive").length);
  ok("線上動機步 4 選項", motiveCount === 4, `count=${motiveCount}`);
  await tap(page, '.onb-motive[data-k="work"]'); await sleep(60);
  await tap(page, "#onbNext"); await sleep(120);
  const rec = await page.evaluate(() => ({ txt: document.querySelector(".onb-body").textContent.replace(/\s+/g, " ").trim(),
    hasGo: !!document.querySelector("#onbRecGo") }));
  ok("線上推薦（工作→跟讀糾音）", /為你推薦.*跟讀糾音/.test(rec.txt), rec.txt.slice(0, 40));
  ok("線上有直接開始鈕", rec.hasGo);
  await tap(page, "#onbRecGo"); await sleep(300);
  const after = await page.evaluate(() => ({ onbGone: !document.getElementById("onboarding"),
    motive: localStorage.getItem("learnMotive"), rec: window.__app.getRecommendedMode(), hash: location.hash }));
  ok("線上直接開始 → onboarding 清乾淨", after.onbGone);
  ok("線上 learnMotive=work、推薦 shadowing", after.motive === "work" && after.rec === "shadowing", JSON.stringify(after));
  ok("線上導向跟讀糾音（#shadowing）", after.hash === "#shadowing", after.hash);

  await page.evaluate(() => window.__app.navigate("home"));
  await page.waitForSelector(".mode-card", { timeout: 6000 });
  const home = await page.evaluate(() => {
    const recCard = document.querySelector(".mode-card.mc-rec");
    return { tag: recCard?.querySelector(".mc-rec-tag")?.textContent.trim() || "",
      title: recCard?.querySelector("h3")?.textContent.trim() || "",
      first: document.querySelector(".mode-card h3")?.textContent.trim() || "" };
  });
  ok("線上首頁推薦緞帶=跟讀糾音、排最前", /為你推薦/.test(home.tag) && home.title === "跟讀糾音" && home.first === "跟讀糾音", JSON.stringify(home));

  ok("線上 0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 線上正式站 學習動機 onboarding 真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally { await browser.close(); }
