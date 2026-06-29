// 本機真 Chrome 端到端驗「成就牆 + 達標音效」：
// 由現有 stats/streakBadges 衍生成就，已解鎖+未解鎖看得到進度；首頁徽章列點開、設定也可開；音效預設開可關。
// 走真實模組 app.js（dynamic import 既載入實例）＋首頁真實渲染。0 console error / 375px 手機。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8829;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml",
};
const server = createServer(async (req, res) => {
  try {
    let p = decodeURIComponent(req.url.split("?")[0]);
    if (p === "/") p = "/index.html";
    const fp = normalize(join(ROOT, p));
    if (!fp.startsWith(ROOT)) { res.writeHead(403).end(); return; }
    const s = await stat(fp).catch(() => null);
    if (!s || !s.isFile()) { res.writeHead(404).end("nf"); return; }
    const buf = await readFile(fp);
    res.writeHead(200, { "Content-Type": TYPES[extname(fp)] || "application/octet-stream" });
    res.end(buf);
  } catch { res.writeHead(500).end(); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${PORT}/`;

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
  // 已 onboarded + 種一組成就資料：練習60次/看60字/最高90分、連續里程碑徽章已得 3、7
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem("onboarded", "1");
      localStorage.setItem("stats", JSON.stringify({ practiced: 60, words: 60, best: 90 }));
      localStorage.setItem("streakBadges", JSON.stringify([3, 7]));
      const today = (() => { const d = new Date(); const p = (n) => String(n).padStart(2, "0");
        return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`; })();
      localStorage.setItem("streak", JSON.stringify({ count: 8, best: 8, lastDay: today, freezes: 0 }));
    } catch (e) {}
  });

  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  ok("首頁渲染（無致命錯誤）", true);

  // 取得 app.js 真實模組 + 新 export
  const imp = await page.evaluate(async () => {
    try {
      window.__app = await import("/assets/js/app.js");
      const k = Object.keys(window.__app);
      return ["getAchievements", "showAchievementWall", "isSoundOn", "setSoundOn"].every((x) => k.includes(x));
    } catch (e) { return "ERR:" + e.message; }
  });
  ok("app.js 新 export 齊（getAchievements/showAchievementWall/isSoundOn/setSoundOn）", imp === true, String(imp));

  // getAchievements 結構：total=6+4+3+3=16；本資料應解鎖 連續(3/7/8→3 個:3,7,但8未達14→只3、7、…streakProg=8→3,7 達；其餘鎖)
  // 連續達標: 3,7 (8>=3,8>=7) =2；練習60→10,50 達=2；單字60→20,50 達=2；分數90→70,85 達=2 → earned=8
  const ach = await page.evaluate(() => window.__app.getAchievements());
  ok("getAchievements 總數 16（6+4+3+3）", ach.total === 16, `total=${ach.total}`);
  ok("getAchievements 已解鎖數正確（本資料=8）", ach.earned === 8, `earned=${ach.earned}`);
  ok("getAchievements 分 4 組", Array.isArray(ach.groups) && ach.groups.length === 4, `groups=${ach.groups?.length}`);
  const locked = ach.groups.flatMap((g) => g.items).find((i) => !i.earned);
  ok("未解鎖項含進度 pct（0-100）", locked && locked.pct >= 0 && locked.pct <= 100, JSON.stringify(locked));

  // 首頁徽章列有「🏅 成就牆 →」chip
  const hasMore = await page.evaluate(() => {
    const e = document.querySelector(".streak-badges .sbadge-more");
    return e ? e.textContent.trim() : "";
  });
  ok("首頁徽章列顯示『🏅 成就牆 →』入口", /成就牆/.test(hasMore), hasMore);

  // 點首頁徽章列 → 開成就牆
  await tap(page, "#streakBadges");
  await page.waitForSelector("#achievementWall", { timeout: 5000 });
  ok("點首頁徽章列開出成就牆 overlay", true);

  const wall = await page.evaluate(() => {
    const o = document.getElementById("achievementWall");
    return {
      head: o.querySelector(".aw-head .onb-sub")?.textContent.replace(/\s+/g, " ").trim() || "",
      earnedCells: o.querySelectorAll(".aw-cell.earned").length,
      lockedCells: o.querySelectorAll(".aw-cell.locked").length,
      groups: o.querySelectorAll(".aw-group").length,
      doneTxt: o.querySelector(".aw-cell.earned .aw-c-s.done")?.textContent.trim() || "",
      bar: !!o.querySelector(".aw-cell.locked .aw-c-bar i"),
      curTarget: o.querySelector(".aw-cell.locked .aw-c-s")?.textContent.trim() || "",
    };
  });
  ok("成就牆標題顯示『已解鎖 8 / 16』", /已解鎖\s*8\s*\/\s*16/.test(wall.head), wall.head);
  ok("成就牆同時有 已解鎖 + 未解鎖 cell", wall.earnedCells === 8 && wall.lockedCells === 8, `earned=${wall.earnedCells} locked=${wall.lockedCells}`);
  ok("成就牆分 4 組顯示", wall.groups === 4, `groups=${wall.groups}`);
  ok("已解鎖 cell 顯示『✓ 已解鎖』", /已解鎖/.test(wall.doneTxt), wall.doneTxt);
  ok("未解鎖 cell 有進度條 + cur/target", wall.bar && /\d+\/\d+/.test(wall.curTarget), `bar=${wall.bar} ${wall.curTarget}`);

  // 關閉成就牆（完成鈕）→ overlay 移除
  await tap(page, "#awClose");
  await new Promise((r) => setTimeout(r, 120));
  const closed = await page.evaluate(() => !document.getElementById("achievementWall"));
  ok("點『完成』關閉成就牆、overlay 清乾淨", closed);

  // 設定面板也能開成就牆
  await tap(page, "#settingsBtn");
  await page.waitForSelector("#openWall", { timeout: 5000 });
  await tap(page, "#openWall");
  await page.waitForSelector("#achievementWall", { timeout: 5000 });
  ok("設定面板『🏅 成就牆』也能開出成就牆", true);
  await tap(page, "#awClose");
  await new Promise((r) => setTimeout(r, 120));

  // 音效設定：預設開；toggle 取消 → soundOff=1 → isSoundOn false；勾回 → 開
  const sound = await page.evaluate(() => {
    const def = window.__app.isSoundOn();              // 預設應為 true
    window.__app.setSoundOn(false);
    const off = window.__app.isSoundOn();              // 應 false
    const lsOff = localStorage.getItem("soundOff");    // 應 "1"
    window.__app.setSoundOn(true);
    const on = window.__app.isSoundOn();               // 應 true
    return { def, off, lsOff, on };
  });
  ok("音效預設開（isSoundOn 預設 true）", sound.def === true, JSON.stringify(sound));
  ok("關閉音效 → isSoundOn false 且 localStorage soundOff=1", sound.off === false && sound.lsOff === "1", JSON.stringify(sound));
  ok("重新開啟音效 → isSoundOn true", sound.on === true, JSON.stringify(sound));

  // 設定面板音效勾選框反映目前狀態
  await tap(page, "#settingsBtn");
  await page.waitForSelector("#soundToggle", { timeout: 5000 });
  const tg = await page.evaluate(() => document.getElementById("soundToggle").checked);
  ok("設定音效勾選框反映目前狀態（開）", tg === true, `checked=${tg}`);
  // 取消勾選 → 寫入關閉
  await page.evaluate(() => { const c = document.getElementById("soundToggle"); c.checked = false; c.dispatchEvent(new Event("change")); });
  const afterUncheck = await page.evaluate(() => window.__app.isSoundOn());
  ok("取消勾選音效框 → isSoundOn false", afterUncheck === false, `isSoundOn=${afterUncheck}`);
  // 回復開啟，避免污染後續
  await page.evaluate(() => { const c = document.getElementById("soundToggle"); c.checked = true; c.dispatchEvent(new Event("change")); });

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 成就牆 + 達標音效 真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
