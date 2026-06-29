// 線上正式站真機端到端驗「補實 exam 主題對話量」（第24輪）：english-tutor-ai.pages.dev。
// 0 console error / 375px 手機。
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

  const dstat = await page.evaluate(async () => {
    const d = await import("/assets/js/data.js?live=1");
    const t = {};
    d.DIALOGUES.forEach((x) => { t[x.topic] = (t[x.topic] || 0) + 1; });
    return { t, total: d.DIALOGUES.length };
  });
  ok("線上 exam 對話 ≥3", (dstat.t.exam || 0) >= 3, `exam=${dstat.t.exam}`);
  ok("線上 work 對話 ≥4", (dstat.t.work || 0) >= 4, `work=${dstat.t.work}`);
  ok("線上四主題對話皆 ≥2", ["travel", "work", "exam", "daily"].every((k) => (dstat.t[k] || 0) >= 2), JSON.stringify(dstat.t));

  const convState = async () => page.evaluate(async () => {
    const d = await import("/assets/js/data.js?live=1");
    const onChip = document.querySelector(".conv-chip.on");
    const title = (document.querySelector(".card b")?.textContent || "").replace(/^[^一-龥A-Za-z]+/, "").trim();
    const found = d.DIALOGUES.find((x) => title.includes(x.title));
    const pill = document.querySelector(".pill-lv")?.textContent || "";
    return { filter: onChip?.dataset.f || null, curTopic: found?.topic || null, pill, title,
             chips: [...document.querySelectorAll(".conv-chip")].map((c) => c.dataset.f) };
  });

  await page.evaluate(async () => {
    localStorage.clear();
    localStorage.setItem("learnMotive", "exam");
    const app = await import("/assets/js/app.js?live=1");
    app.navigate("conversation");
  });
  await page.waitForSelector(".conv-chip", { timeout: 8000 });
  let cs = await convState();
  ok("線上 動機=考試 → 聚焦 exam（不再退 all）", cs.filter === "exam", `filter=${cs.filter}`);
  ok("線上 動機=考試 → 目前對話 topic=exam", cs.curTopic === "exam", `topic=${cs.curTopic} title=${cs.title}`);
  ok("線上 exam chip 出現", cs.chips.includes("exam"), `chips=${cs.chips.join(",")}`);
  ok("線上 難度徽章顯示", /初級|中級/.test(cs.pill), `pill=${cs.pill}`);

  await page.evaluate(() => document.querySelector("#switchBtn")?.click());
  await sleep(200);
  cs = await convState();
  ok("線上 換情境 → 仍在 exam 內循環", cs.curTopic === "exam", `topic=${cs.curTopic} title=${cs.title}`);

  // 未選動機無回歸
  await page.evaluate(async () => {
    localStorage.clear();
    const app = await import("/assets/js/app.js?live=1");
    app.navigate("conversation");
  });
  await page.waitForSelector(".conv-chip", { timeout: 8000 });
  cs = await convState();
  ok("線上 未選動機 → filter=all 對話照常", cs.filter === "all" && !!cs.title, `filter=${cs.filter} title=${cs.title}`);

  ok("線上 0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 第24輪 線上正式站真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
}
