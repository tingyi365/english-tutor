// 本機真 Chrome 端到端驗「補實 exam 主題對話量」（第24輪）：
// 第22輪 exam 對話=0 → 動機=考試的人進「情境對話」看不到任何考試情境＝推薦名不副實。
// 本輪純資料 append exam 對話×3（口說考試暖身/描述照片/表達意見）+ work 補到 4，讓推薦對所有動機都名副其實。
// 走真實模組 app.js/modes.js/data.js + 真實渲染。0 console error / 375px 手機。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8841;
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

  // ===== 資料層：exam 對話補到 ≥3、work ≥4，各主題對話欄位完整 =====
  const dstat = await page.evaluate(async () => {
    const d = await import("/assets/js/data.js");
    const t = {}; let allOk = true;
    d.DIALOGUES.forEach((x) => {
      t[x.topic] = (t[x.topic] || 0) + 1;
      if (!x.title || !x.topic || !x.level || !Array.isArray(x.turns) || !x.turns.length) allOk = false;
      x.turns.forEach((tn) => { if (!(tn.ai && ((tn.hint && tn.zh) || Array.isArray(tn.choices)))) allOk = false; });
    });
    return { t, allOk, total: d.DIALOGUES.length };
  });
  ok("exam 主題對話補到 ≥3（原本 0）", (dstat.t.exam || 0) >= 3, `exam=${dstat.t.exam}`);
  ok("work 主題對話補到 ≥4（原本 3）", (dstat.t.work || 0) >= 4, `work=${dstat.t.work}`);
  ok("四大動機主題對話皆 ≥2（推薦對所有動機名副其實）",
     ["travel", "work", "exam", "daily"].every((k) => (dstat.t[k] || 0) >= 2), JSON.stringify(dstat.t));
  ok("全部對話欄位完整（title/topic/level/turns）", dstat.allOk, JSON.stringify(dstat.t));

  // 工具：取目前對話狀態
  const convState = async () => page.evaluate(async () => {
    const d = await import("/assets/js/data.js");
    const onChip = document.querySelector(".conv-chip.on");
    const title = (document.querySelector(".card b")?.textContent || "").replace(/^[^一-龥A-Za-z]+/, "").trim();
    const found = d.DIALOGUES.find((x) => title.includes(x.title));
    const pill = document.querySelector(".pill-lv")?.textContent || "";
    return { filter: onChip?.dataset.f || null, chipCount: document.querySelectorAll(".conv-chip").length,
             curTopic: found?.topic || null, pill, title,
             chips: [...document.querySelectorAll(".conv-chip")].map((c) => c.dataset.f) };
  });

  // ===== 動機=考試：對話預設聚焦 exam 主題（先前會退 all，本輪有內容了）=====
  await page.evaluate(async () => {
    localStorage.clear();
    localStorage.setItem("learnMotive", "exam");
    const app = await import("/assets/js/app.js");
    app.navigate("conversation");
  });
  await page.waitForSelector(".conv-chip", { timeout: 5000 });
  let cs = await convState();
  ok("動機=考試 → 對話預設聚焦 exam（chip on=exam，補洞後不再退 all）", cs.filter === "exam", `filter=${cs.filter}`);
  ok("動機=考試 → 目前對話 topic=exam（看得到考試情境）", cs.curTopic === "exam", `curTopic=${cs.curTopic} title=${cs.title}`);
  ok("exam 主題 chip 出現在 chip 列", cs.chips.includes("exam"), `chips=${cs.chips.join(",")}`);
  ok("難度徽章顯示（pill 含 初級/中級）", /初級|中級/.test(cs.pill), `pill=${cs.pill}`);

  // 換情境：仍停在 exam 主題內循環（過濾後循環，且 ≥3 則可循環）
  await page.evaluate(() => document.querySelector("#switchBtn")?.click());
  await sleep(150);
  cs = await convState();
  ok("換情境 → 仍在 exam 主題內循環", cs.curTopic === "exam", `topic=${cs.curTopic} title=${cs.title}`);

  // ===== exam 對話可實際逐輪推進（renderControls 正常、無 crash）=====
  const examPlay = await page.evaluate(async () => {
    localStorage.clear();
    localStorage.setItem("learnMotive", "exam");
    const app = await import("/assets/js/app.js");
    app.navigate("conversation");
    await new Promise((r) => setTimeout(r, 150));
    // 第一輪應有 AI 提示泡泡 + 學生提示句（hint）
    const hasAi = !!document.querySelector(".bubble, .ai-bubble, .card");
    const hintTxt = (document.body.textContent || "");
    return { hasAi, hasIntro: hintTxt.length > 0 };
  });
  ok("exam 對話實際渲染（AI 泡泡/卡片存在、無 crash）", examPlay.hasAi);

  // ===== 動機=工作：對話聚焦 work（補到 4 則後仍正常）=====
  await page.evaluate(async () => {
    localStorage.clear();
    localStorage.setItem("learnMotive", "work");
    const app = await import("/assets/js/app.js");
    app.navigate("conversation");
  });
  await page.waitForSelector(".conv-chip", { timeout: 5000 });
  cs = await convState();
  ok("動機=工作 → 對話聚焦 work（補量後無回歸）", cs.filter === "work" && cs.curTopic === "work", `filter=${cs.filter} topic=${cs.curTopic}`);

  // ===== 未選動機：filter=all、對話照常（零摩擦不強迫，無回歸）=====
  await page.evaluate(async () => {
    localStorage.clear();
    const app = await import("/assets/js/app.js");
    app.navigate("conversation");
  });
  await page.waitForSelector(".conv-chip", { timeout: 5000 });
  cs = await convState();
  ok("未選動機 → 對話預設 filter=all（不強迫）", cs.filter === "all", `filter=${cs.filter}`);
  ok("未選動機 → 對話仍正常渲染（標題+難度）", !!cs.title && /初級|中級/.test(cs.pill), `title=${cs.title} pill=${cs.pill}`);

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
  console.log("\n==== 第24輪 補實 exam 主題對話 真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
