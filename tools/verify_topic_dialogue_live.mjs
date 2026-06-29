// 線上正式站真機驗「對話依動機分主題 + 難度分級 + 自由跳級」（第22輪）。
// 直接打 https://english-tutor-ai.pages.dev，走線上真實模組 + 真實渲染。0 console error / 375px 手機。
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

  const O = new URL(BASE).origin;
  const dstat = await page.evaluate(async (o) => {
    const d = await import(o + "/assets/js/data.js");
    const t = {}; let allTagged = true;
    d.DIALOGUES.forEach((x) => { t[x.topic] = (t[x.topic] || 0) + 1; if (!x.topic || !x.level) allTagged = false; });
    const v = {}; let vAll = true;
    d.VOCAB.forEach((x) => { v[x.topic] = (v[x.topic] || 0) + 1; if (!x.topic) vAll = false; });
    return { t, allTagged, v, vAll };
  }, O);
  ok("線上對話全部有 topic+level", dstat.allTagged && (dstat.t.work || 0) >= 2, JSON.stringify(dstat.t));
  ok("線上單字全部有 topic（4 主題齊）", dstat.vAll && ["travel", "work", "exam", "daily"].every((k) => (dstat.v[k] || 0) > 0), JSON.stringify(dstat.v));

  const convState = async () => page.evaluate(async (o) => {
    const d = await import(o + "/assets/js/data.js");
    const onChip = document.querySelector(".conv-chip.on");
    const title = (document.querySelector(".card b")?.textContent || "").replace(/^[^一-龥A-Za-z]+/, "").trim();
    const found = d.DIALOGUES.find((x) => title.includes(x.title));
    return { filter: onChip?.dataset.f || null, chipCount: document.querySelectorAll(".conv-chip").length,
             curTopic: found?.topic || null, pill: document.querySelector(".pill-lv")?.textContent || "", title };
  }, O);

  await page.evaluate(async (o) => {
    localStorage.clear(); localStorage.setItem("learnMotive", "work");
    const app = await import(o + "/assets/js/app.js"); app.navigate("conversation");
  }, O);
  await page.waitForSelector(".conv-chip", { timeout: 8000 });
  let cs = await convState();
  ok("線上 動機=工作 → 對話聚焦 work", cs.filter === "work" && cs.curTopic === "work", `filter=${cs.filter} topic=${cs.curTopic}`);
  ok("線上 難度徽章顯示", /初級|中級/.test(cs.pill), cs.pill);
  ok("線上 主題 chip 列出現", cs.chipCount >= 4, `chips=${cs.chipCount}`);

  await page.evaluate(() => { const c = [...document.querySelectorAll(".conv-chip")].find((b) => b.dataset.f === "travel"); c && c.click(); });
  await sleep(200);
  cs = await convState();
  ok("線上 點旅遊 chip → 切 travel（自由跳級）", cs.filter === "travel" && cs.curTopic === "travel", `filter=${cs.filter} topic=${cs.curTopic}`);

  await page.evaluate(async (o) => {
    localStorage.clear();
    const app = await import(o + "/assets/js/app.js"); app.navigate("conversation");
  }, O);
  await page.waitForSelector(".conv-chip", { timeout: 8000 });
  cs = await convState();
  ok("線上 未選動機 → filter=all 且對話正常", cs.filter === "all" && !!cs.title, `filter=${cs.filter} title=${cs.title}`);

  const fv = await page.evaluate(async (o) => {
    localStorage.clear(); localStorage.setItem("learnMotive", "travel");
    const app = await import(o + "/assets/js/app.js"); app.navigate("flashcard");
    await new Promise((r) => setTimeout(r, 150));
    const d = await import(o + "/assets/js/data.js");
    const word = (document.querySelector(".word")?.textContent || "").trim();
    return { word, topic: d.VOCAB.find((x) => x.word === word)?.topic || null };
  }, O);
  ok("線上 單字卡 動機=旅遊 → 第一張 travel 字", fv.topic === "travel", JSON.stringify(fv));

  const home = await page.evaluate(async (o) => {
    localStorage.clear(); localStorage.setItem("learnMotive", "travel");
    const app = await import(o + "/assets/js/app.js"); app.navigate("home");
    await new Promise((r) => setTimeout(r, 150));
    return { rec: document.querySelector(".mode-card.mc-rec h3")?.textContent.trim() || "",
             goalItems: document.querySelectorAll(".goal-item").length };
  }, O);
  ok("線上 回歸：推薦緞帶+精選句卡仍在", home.rec === "情境對話" && home.goalItems > 0, JSON.stringify(home));

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 線上：對話依動機分主題 + 難度分級 + 自由跳級 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
}
