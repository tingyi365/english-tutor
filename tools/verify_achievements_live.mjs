// 線上正式站真機端到端驗「成就牆 + 達標音效」：https://english-tutor-ai.pages.dev
// 0 console error / 375px 手機。種 stats/streakBadges 後驗成就牆渲染、入口、音效設定。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://english-tutor-ai.pages.dev/";
const results = [];
const ok = (n, c, extra = "") => results.push({ n, pass: !!c, extra });
const tap = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); }, sel);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("onboarded", "1");
      localStorage.setItem("stats", JSON.stringify({ practiced: 60, words: 60, best: 90 }));
      localStorage.setItem("streakBadges", JSON.stringify([3, 7]));
      const d = new Date(); const p = (n) => String(n).padStart(2, "0");
      const today = `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
      localStorage.setItem("streak", JSON.stringify({ count: 8, best: 8, lastDay: today, freezes: 0 }));
    } catch (e) {}
  });

  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForSelector(".mode-card", { timeout: 12000 });
  ok("線上首頁渲染（無致命錯誤）", true);

  const imp = await page.evaluate(async () => {
    try {
      const m = await import("/assets/js/app.js");
      return ["getAchievements", "showAchievementWall", "isSoundOn", "setSoundOn"].every((x) => x in m);
    } catch (e) { return "ERR:" + e.message; }
  });
  ok("線上 app.js 新 export 齊", imp === true, String(imp));

  const hasMore = await page.evaluate(() => document.querySelector(".streak-badges .sbadge-more")?.textContent.trim() || "");
  ok("線上首頁徽章列『🏅 成就牆 →』入口", /成就牆/.test(hasMore), hasMore);

  await tap(page, "#streakBadges");
  await page.waitForSelector("#achievementWall", { timeout: 6000 });
  const wall = await page.evaluate(() => {
    const o = document.getElementById("achievementWall");
    return {
      head: o.querySelector(".aw-head .onb-sub")?.textContent.replace(/\s+/g, " ").trim() || "",
      earned: o.querySelectorAll(".aw-cell.earned").length,
      locked: o.querySelectorAll(".aw-cell.locked").length,
      groups: o.querySelectorAll(".aw-group").length,
      done: !!o.querySelector(".aw-cell.earned .aw-c-s.done"),
      bar: !!o.querySelector(".aw-cell.locked .aw-c-bar i"),
    };
  });
  ok("線上成就牆標題『已解鎖 8 / 16』", /已解鎖\s*8\s*\/\s*16/.test(wall.head), wall.head);
  ok("線上成就牆 已解鎖8 + 未解鎖8 cell", wall.earned === 8 && wall.locked === 8, `e=${wall.earned} l=${wall.locked}`);
  ok("線上成就牆分 4 組", wall.groups === 4, `g=${wall.groups}`);
  ok("線上已解鎖 cell 有『✓ 已解鎖』", wall.done);
  ok("線上未解鎖 cell 有進度條", wall.bar);

  await tap(page, "#awClose");
  await new Promise((r) => setTimeout(r, 120));
  ok("線上關閉成就牆 overlay 清乾淨", await page.evaluate(() => !document.getElementById("achievementWall")));

  await tap(page, "#settingsBtn");
  await page.waitForSelector("#openWall", { timeout: 6000 });
  await tap(page, "#openWall");
  await page.waitForSelector("#achievementWall", { timeout: 6000 });
  ok("線上設定面板『🏅 成就牆』可開", true);
  await tap(page, "#awClose");
  await new Promise((r) => setTimeout(r, 120));

  await tap(page, "#settingsBtn");
  await page.waitForSelector("#soundToggle", { timeout: 6000 });
  const sound = await page.evaluate(() => {
    const c = document.getElementById("soundToggle");
    const def = c.checked;
    c.checked = false; c.dispatchEvent(new Event("change"));
    const off = window.localStorage.getItem("soundOff");
    c.checked = true; c.dispatchEvent(new Event("change"));
    return { def, off };
  });
  ok("線上音效預設開、可關（soundOff=1）", sound.def === true && sound.off === "1", JSON.stringify(sound));

  ok("線上 0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 線上 成就牆 + 音效 真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
}
