// 本機真 Chrome 端到端驗「對話分支選項」（第23輪）：
// 借鏡 Babbel 的「自己選想怎麼回應」——情境對話某些輪會給 2-3 種說法，挑一種練習，
// 對方依你的選擇給不同回應(reply)再續，讓對話更像真實互動＝更容易開口。向後相容：無 choices 的輪維持原樣。
// 走真實模組 app.js/modes.js/data.js + 真實渲染。0 console error / 375px 手機。skip 路徑驗 advance+reply（免麥克風）。
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

  // ===== 資料層：至少 3 則對話含分支 choices，每個 choice 欄位完整 =====
  const dstat = await page.evaluate(async () => {
    const d = await import("/assets/js/data.js");
    let withChoices = 0, badChoice = 0, totalChoices = 0;
    d.DIALOGUES.forEach((dl) => {
      let has = false;
      dl.turns.forEach((t) => {
        if (Array.isArray(t.choices) && t.choices.length) {
          has = true;
          t.choices.forEach((c) => {
            totalChoices++;
            if (!c.label || !c.en || !c.zh || !c.reply) badChoice++;
          });
        }
      });
      if (has) withChoices++;
    });
    return { withChoices, badChoice, totalChoices };
  });
  ok("至少 3 則對話含分支選項", dstat.withChoices >= 3, `withChoices=${dstat.withChoices}`);
  ok("每個分支選項欄位完整(label/en/zh/reply)", dstat.badChoice === 0 && dstat.totalChoices >= 6, `bad=${dstat.badChoice} total=${dstat.totalChoices}`);

  const chatText = () => page.evaluate(() => document.querySelector("#chat")?.textContent || "");
  const choiceCount = () => page.evaluate(() => document.querySelectorAll(".conv-choice").length);

  // 跳到「認識新朋友」(daily) — 最後一輪是 3 選分支
  await page.evaluate(async () => {
    localStorage.clear();
    localStorage.setItem("learnMotive", "daily");
    const app = await import("/assets/js/app.js");
    app.navigate("conversation");
  });
  await page.waitForSelector("#convCtl", { timeout: 5000 });
  let title = await page.evaluate(() => document.querySelector(".card b")?.textContent || "");
  ok("動機=daily → 首對話為「認識新朋友」", title.includes("認識新朋友"), `title=${title}`);

  // 非分支輪：skip 推進（turn0→1→2），驗證一般對話路徑無回歸
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => document.querySelector("#skipBtn")?.click());
    await sleep(120);
  }
  const cc = await choiceCount();
  ok("推進到分支輪 → 出現 3 個分支選項按鈕", cc === 3, `choices=${cc}`);
  const choiceLabels = await page.evaluate(() => [...document.querySelectorAll(".conv-choice .cc-label")].map((e) => e.textContent.trim()));
  ok("分支選項顯示中文標籤(工作/旅遊/考試)", choiceLabels.length === 3 && choiceLabels.some((l) => l.includes("工作")), choiceLabels.join("/"));

  // 點第一個分支(為了工作) → 轉成可練習回應句 + 出現換我說/略過
  await page.evaluate(() => document.querySelector(".conv-choice")?.click());
  await sleep(120);
  const afterPick = await page.evaluate(() => ({
    suggest: document.querySelector(".suggest-line")?.textContent || "",
    hasSpeak: !!document.querySelector("#speakBtn"),
    hasSkip: !!document.querySelector("#skipBtn"),
    noChoices: document.querySelectorAll(".conv-choice").length === 0,
  }));
  ok("選分支後 → 顯示該說法練習句", afterPick.suggest.includes("improve my speaking for work") || afterPick.suggest.includes("照這句練習"), afterPick.suggest.slice(0, 40));
  ok("選分支後 → 出現換我說/略過控制 + 選項消失", afterPick.hasSpeak && afterPick.hasSkip && afterPick.noChoices, JSON.stringify(afterPick));

  // skip → 對方依選擇回應(reply) 出現 → 該對話為最後一輪故進完成卡
  await page.evaluate(() => document.querySelector("#skipBtn")?.click());
  await sleep(1100);
  const txt = await chatText();
  ok("選工作分支 → 對方回應(reply)出現「great goal...career」", /great goal/i.test(txt) && /career/i.test(txt), txt.slice(-80));
  const done = await page.evaluate(() => !!document.querySelector("#againConv"));
  ok("分支在最後一輪 → 回應後進「對話完成」卡", done, `done=${done}`);

  // ===== 分支後可續接下一輪（rejoin）：work「跟同事約開會」turn1 分支，選後續到 turn2 =====
  await page.evaluate(async () => {
    localStorage.clear();
    localStorage.setItem("learnMotive", "work");
    const app = await import("/assets/js/app.js");
    app.navigate("conversation");
  });
  await page.waitForSelector("#convCtl", { timeout: 5000 });
  title = await page.evaluate(() => document.querySelector(".card b")?.textContent || "");
  ok("動機=work → 首對話為「跟同事約開會」", title.includes("跟同事約開會"), `title=${title}`);
  // turn0 非分支 → skip 到 turn1 分支
  await page.evaluate(() => document.querySelector("#skipBtn")?.click());
  await sleep(150);
  const cc2 = await choiceCount();
  ok("work 對話 turn1 → 出現 2 個分支選項", cc2 === 2, `choices=${cc2}`);
  // 選「✅ 可以」→ skip → reply「book a meeting room」+ 續接 turn2「send you a meeting invite」
  await page.evaluate(() => document.querySelector(".conv-choice")?.click());
  await sleep(120);
  await page.evaluate(() => document.querySelector("#skipBtn")?.click());
  await sleep(1200);
  const txt2 = await chatText();
  ok("work 分支 → 對方回應「book a meeting room」出現", /book a meeting room/i.test(txt2), txt2.slice(-100));
  ok("work 分支後 → 續接下一輪「send you a meeting invite」(rejoin 不中斷)", /send you a meeting invite/i.test(txt2), txt2.slice(-100));
  const notDone = await page.evaluate(() => !document.querySelector("#againConv"));
  ok("work 分支非最後輪 → 對話續行未提前完成", notDone, `notDone=${notDone}`);

  // ===== 回歸：未選動機 → 對話照常、咖啡廳分支存在但一般輪不受影響 =====
  await page.evaluate(async () => {
    localStorage.clear();
    const app = await import("/assets/js/app.js");
    app.navigate("conversation");
  });
  await page.waitForSelector("#convCtl", { timeout: 5000 });
  const reg = await page.evaluate(() => ({
    hasSuggest: !!document.querySelector(".suggest-line"),
    chips: document.querySelectorAll(".conv-chip").length,
    title: document.querySelector(".card b")?.textContent || "",
  }));
  ok("未選動機 → 對話仍正常渲染(建議句+主題chip)", reg.hasSuggest && reg.chips >= 4 && !!reg.title, JSON.stringify(reg));

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 對話分支選項 真機驗證（第23輪）====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
