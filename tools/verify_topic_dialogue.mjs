// 本機真 Chrome 端到端驗「對話依動機分主題 + 難度分級 + 可自由跳級」（第22輪）：
// 依第20輪 onboarding 的學習動機，情境對話預設聚焦對應主題、可用 chip 自由切主題（不鎖進度門），
// 每個對話標難度（初級/中級）；單字卡同熟練度下對應主題字優先。讓「為你推薦」連對話/單字也名副其實＝容易學。
// 走真實模組 app.js/modes.js/data.js + 真實渲染。0 console error / 375px 手機。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8836;
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
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  await page.goto(BASE, { waitUntil: "networkidle0" });

  // ===== 資料層：對話皆有 topic+level；work 主題已補；各主題 ≥2 =====
  const dstat = await page.evaluate(async () => {
    const d = await import("/assets/js/data.js");
    const t = {}; let allTagged = true; const levels = new Set();
    d.DIALOGUES.forEach((x) => { t[x.topic] = (t[x.topic] || 0) + 1; if (!x.topic || !x.level) allTagged = false; levels.add(x.level); });
    const v = {}; let vAll = true;
    d.VOCAB.forEach((x) => { v[x.topic] = (v[x.topic] || 0) + 1; if (!x.topic) vAll = false; });
    return { t, allTagged, levels: [...levels], total: d.DIALOGUES.length, v, vAll };
  });
  ok("對話全部有 topic+level 標籤", dstat.allTagged, JSON.stringify(dstat.t));
  ok("對話含 work 主題（新增、補齊工作）", (dstat.t.work || 0) >= 2, `work=${dstat.t.work}`);
  ok("對話 travel/daily 主題各 ≥2", (dstat.t.travel || 0) >= 2 && (dstat.t.daily || 0) >= 2, JSON.stringify(dstat.t));
  ok("對話有難度分級（初級+中級）", dstat.levels.includes("初級") && dstat.levels.includes("中級"), dstat.levels.join("/"));
  ok("單字全部有 topic 標籤", dstat.vAll, JSON.stringify(dstat.v));
  ok("單字 4 主題皆有（travel/work/exam/daily）", ["travel", "work", "exam", "daily"].every((k) => (dstat.v[k] || 0) > 0), JSON.stringify(dstat.v));

  // 工具：取目前對話的 topic（用畫面 active chip + 卡片標題對回 data）
  const convState = async () => page.evaluate(async () => {
    const d = await import("/assets/js/data.js");
    const onChip = document.querySelector(".conv-chip.on");
    const title = (document.querySelector(".card b")?.textContent || "").replace(/^[^一-龥A-Za-z]+/, "").trim();
    const found = d.DIALOGUES.find((x) => title.includes(x.title));
    const pill = document.querySelector(".pill-lv")?.textContent || "";
    return { filter: onChip?.dataset.f || null, chipCount: document.querySelectorAll(".conv-chip").length,
             curTopic: found?.topic || null, curLevel: found?.level || null, pill, title };
  });

  // ===== 動機=工作：對話預設聚焦 work 主題 + 顯示難度 =====
  await page.evaluate(async () => {
    localStorage.clear();
    localStorage.setItem("learnMotive", "work");
    const app = await import("/assets/js/app.js");
    app.navigate("conversation");
  });
  await page.waitForSelector(".conv-chip", { timeout: 5000 });
  let cs = await convState();
  ok("動機=工作 → 對話預設聚焦 work 主題（chip on）", cs.filter === "work", `filter=${cs.filter}`);
  ok("動機=工作 → 目前對話 topic=work（推薦名副其實）", cs.curTopic === "work", `curTopic=${cs.curTopic} title=${cs.title}`);
  ok("難度徽章顯示（pill 含 初級/中級）", /初級|中級/.test(cs.pill), `pill=${cs.pill}`);
  ok("主題 chip 列出現（全部+各主題）", cs.chipCount >= 4, `chips=${cs.chipCount}`);

  // ===== 可自由跳級：點「旅遊」chip → 目前對話 topic=travel =====
  await page.evaluate(() => {
    const c = [...document.querySelectorAll(".conv-chip")].find((b) => b.dataset.f === "travel");
    c && c.click();
  });
  await sleep(150);
  cs = await convState();
  ok("點旅遊 chip → 切到 travel 主題（自由跳級不鎖門）", cs.filter === "travel" && cs.curTopic === "travel", `filter=${cs.filter} topic=${cs.curTopic}`);

  // 換情境：仍停在 travel 主題內（過濾後循環）
  await page.evaluate(() => document.querySelector("#switchBtn")?.click());
  await sleep(150);
  cs = await convState();
  ok("換情境 → 仍在 travel 主題內循環", cs.curTopic === "travel", `topic=${cs.curTopic} title=${cs.title}`);

  // 點「全部」chip → filter=all、chip 數含全部
  await page.evaluate(() => {
    const c = [...document.querySelectorAll(".conv-chip")].find((b) => b.dataset.f === "all");
    c && c.click();
  });
  await sleep(150);
  cs = await convState();
  ok("點全部 chip → filter=all", cs.filter === "all", `filter=${cs.filter}`);

  // ===== 未選動機：預設 filter=all、對話照常可用（零摩擦不強迫，無回歸） =====
  await page.evaluate(async () => {
    localStorage.clear();
    const app = await import("/assets/js/app.js");
    app.navigate("conversation");
  });
  await page.waitForSelector(".conv-chip", { timeout: 5000 });
  cs = await convState();
  ok("未選動機 → 對話預設 filter=all（不強迫）", cs.filter === "all", `filter=${cs.filter}`);
  ok("未選動機 → 對話仍正常渲染（標題+難度）", !!cs.title && /初級|中級/.test(cs.pill), `title=${cs.title} pill=${cs.pill}`);

  // ===== 單字卡：動機=旅遊 → 同熟練度下 travel 主題字優先（第一張 topic=travel） =====
  const firstVocabTopic = await page.evaluate(async () => {
    localStorage.clear();
    localStorage.setItem("learnMotive", "travel");
    const app = await import("/assets/js/app.js");
    app.navigate("flashcard");
    await new Promise((r) => setTimeout(r, 120));
    const d = await import("/assets/js/data.js");
    const word = (document.querySelector(".word")?.textContent || "").trim();
    const v = d.VOCAB.find((x) => x.word === word);
    return { word, topic: v?.topic || null };
  });
  ok("單字卡：動機=旅遊 → 第一張為 travel 主題字（弱點同級下動機優先）", firstVocabTopic.topic === "travel", JSON.stringify(firstVocabTopic));

  // ===== 回歸：首頁第20輪推薦緞帶 + 第21輪精選句卡仍在 =====
  const home = await page.evaluate(async () => {
    localStorage.clear();
    localStorage.setItem("learnMotive", "travel");
    const app = await import("/assets/js/app.js");
    app.navigate("home");
    await new Promise((r) => setTimeout(r, 120));
    return { rec: document.querySelector(".mode-card.mc-rec h3")?.textContent.trim() || "",
             goalCard: !!document.querySelector(".goal-card"),
             goalItems: document.querySelectorAll(".goal-item").length };
  });
  ok("回歸：第20輪推薦緞帶仍在（旅遊→情境對話）", home.rec === "情境對話", `rec=${home.rec}`);
  ok("回歸：第21輪目標精選句卡仍在", home.goalCard && home.goalItems > 0, `goalItems=${home.goalItems}`);

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 對話依動機分主題 + 難度分級 + 自由跳級 真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
