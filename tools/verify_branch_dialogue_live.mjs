// 線上正式站真機驗「對話分支選項」（第23輪）。
// 直接打 https://english-tutor-ai.pages.dev，走線上真實模組 + 真實渲染。0 console error / 375px 手機。
// 驗：分支選項渲染、選一種說法→轉練習句、skip→對方依選擇回應(reply)、分支可續接下一輪或進完成卡、一般輪無回歸。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://english-tutor-ai.pages.dev/";
const O = new URL(BASE).origin;
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

  const dstat = await page.evaluate(async (o) => {
    const d = await import(o + "/assets/js/data.js");
    let withChoices = 0, badChoice = 0, totalChoices = 0;
    d.DIALOGUES.forEach((dl) => {
      let has = false;
      dl.turns.forEach((t) => {
        if (Array.isArray(t.choices) && t.choices.length) {
          has = true;
          t.choices.forEach((c) => { totalChoices++; if (!c.label || !c.en || !c.zh || !c.reply) badChoice++; });
        }
      });
      if (has) withChoices++;
    });
    return { withChoices, badChoice, totalChoices };
  }, O);
  ok("線上：≥3 則對話含分支、欄位完整", dstat.withChoices >= 3 && dstat.badChoice === 0 && dstat.totalChoices >= 6, JSON.stringify(dstat));

  const chatText = () => page.evaluate(() => document.querySelector("#chat")?.textContent || "");
  const choiceCount = () => page.evaluate(() => document.querySelectorAll(".conv-choice").length);

  // daily「認識新朋友」最後一輪 3 選分支
  await page.evaluate(async (o) => {
    localStorage.clear(); localStorage.setItem("learnMotive", "daily");
    const app = await import(o + "/assets/js/app.js"); app.navigate("conversation");
  }, O);
  await page.waitForSelector("#convCtl", { timeout: 8000 });
  let title = await page.evaluate(() => document.querySelector(".card b")?.textContent || "");
  ok("線上動機=daily → 首對話「認識新朋友」", title.includes("認識新朋友"), title);
  for (let i = 0; i < 3; i++) { await page.evaluate(() => document.querySelector("#skipBtn")?.click()); await sleep(150); }
  ok("線上：推進到分支輪出現 3 選項", (await choiceCount()) === 3, `choices=${await choiceCount()}`);
  await page.evaluate(() => document.querySelector(".conv-choice")?.click());
  await sleep(150);
  const sg = await page.evaluate(() => document.querySelector(".suggest-line")?.textContent || "");
  ok("線上：選分支→顯示練習句+選項消失", sg.includes("for work") && (await page.evaluate(() => document.querySelectorAll(".conv-choice").length === 0)), sg.slice(0, 40));
  await page.evaluate(() => document.querySelector("#skipBtn")?.click());
  await sleep(1200);
  let txt = await chatText();
  ok("線上：選工作分支→對方回應 great goal/career", /great goal/i.test(txt) && /career/i.test(txt), txt.slice(-70));
  ok("線上：分支最後輪→進完成卡", await page.evaluate(() => !!document.querySelector("#againConv")), "");

  // work「跟同事約開會」turn1 分支 → 續接 turn2（rejoin）
  await page.evaluate(async (o) => {
    localStorage.clear(); localStorage.setItem("learnMotive", "work");
    const app = await import(o + "/assets/js/app.js"); app.navigate("conversation");
  }, O);
  await page.waitForSelector("#convCtl", { timeout: 8000 });
  await page.evaluate(() => document.querySelector("#skipBtn")?.click());
  await sleep(180);
  ok("線上：work 對話 turn1 出現 2 選項", (await choiceCount()) === 2, `choices=${await choiceCount()}`);
  await page.evaluate(() => document.querySelector(".conv-choice")?.click());
  await sleep(150);
  await page.evaluate(() => document.querySelector("#skipBtn")?.click());
  await sleep(1300);
  txt = await chatText();
  ok("線上：work 分支→reply+續接下一輪(rejoin)", /book a meeting room/i.test(txt) && /send you a meeting invite/i.test(txt), txt.slice(-90));

  // 回歸：未選動機對話照常
  await page.evaluate(async (o) => {
    localStorage.clear(); const app = await import(o + "/assets/js/app.js"); app.navigate("conversation");
  }, O);
  await page.waitForSelector("#convCtl", { timeout: 8000 });
  const reg = await page.evaluate(() => ({ hasSuggest: !!document.querySelector(".suggest-line"), chips: document.querySelectorAll(".conv-chip").length }));
  ok("線上回歸：未選動機對話照常(建議句+chip)", reg.hasSuggest && reg.chips >= 4, JSON.stringify(reg));

  ok("線上 0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 線上正式站 對話分支選項 真機驗證（第23輪）====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
}
