// 本機真 Chrome 端到端驗「句子節奏 / 句重音」功能（走真實 DOM 渲染，非只看檔案在）。
// 點「🎵 句子節奏」→ 驗節奏卡出現、實詞 beat-strong/虛詞 beat-weak 分類正確、可播放、可收合。0 console error / 375px 手機。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8819;
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

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("onboarded", "1"); localStorage.setItem("shadowIdx", "0"); } catch (e) {}
    // 攔截 speechSynthesis.speak，避免真播放卡住，但保證 onWord/onend 有觸發
    try {
      window.speechSynthesis.speak = function (u) {
        setTimeout(() => { if (u.onboundary) u.onboundary({ charIndex: 0, name: "word" }); }, 5);
        setTimeout(() => { if (u.onend) u.onend(); }, 15);
      };
    } catch (e) {}
  });

  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  ok("首頁 mode-card 渲染（無致命錯誤）", true);

  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#sentence", { timeout: 8000 });
  await page.waitForSelector("#rhythmBtn", { timeout: 8000 });
  ok("跟讀頁有『🎵 句子節奏』按鈕", true);

  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));

  // 節奏面板預設不展開
  const before = await page.$eval("#rhythm", (e) => e.innerHTML.trim());
  ok("節奏面板預設收合（不增干擾）", before === "");

  // 點開
  await page.click("#rhythmBtn");
  await page.waitForSelector(".rhythm-card", { timeout: 8000 });
  ok("點按後出現節奏卡", true);

  const panel = await page.evaluate(() => {
    const card = document.querySelector(".rhythm-card");
    const beats = [...card.querySelectorAll(".beat")].map((b) => ({
      word: (b.querySelector(".beat-w")?.textContent || "").trim(),
      strong: b.classList.contains("beat-strong"),
    }));
    return {
      tip: card.querySelector(".rhythm-tip")?.textContent || "",
      beats,
      hasPlay: !!card.querySelector("#rhythmPlay"),
    };
  });

  // 詞數與句子一致
  ok("逐字節奏標記，詞數與句子一致",
    panel.beats.length === target.split(" ").length,
    `panel=${panel.beats.length} sentence=${target.split(" ").length}`);

  // 同時有實詞(重)與虛詞(弱)
  ok("句中同時有重讀實詞與弱化虛詞",
    panel.beats.some((b) => b.strong) && panel.beats.some((b) => !b.strong),
    panel.beats.map((b) => (b.strong ? b.word.toUpperCase() : b.word)).join(" "));

  // 抽樣語意正確性：常見虛詞應弱化、常見實詞應重讀（若該句出現）
  const byWord = {};
  panel.beats.forEach((b) => { byWord[b.word.toLowerCase().replace(/[^a-z']/g, "")] = b.strong; });
  const FUNC = ["the", "a", "an", "to", "of", "for", "is", "are", "i", "you", "and", "in", "on", "at"];
  const funcSeen = FUNC.filter((w) => w in byWord);
  ok("出現的常見虛詞皆判為弱化",
    funcSeen.length === 0 || funcSeen.every((w) => byWord[w] === false),
    funcSeen.map((w) => w + ":" + byWord[w]).join(","));

  ok("節奏卡含『重音節拍』教學文案", /重音節拍/.test(panel.tip), panel.tip.slice(0, 40));
  ok("節奏卡有『跟著節奏唸一次』播放鈕", panel.hasPlay);

  // 點播放不丟錯（先把鈕捲到畫面中央＝模擬真實使用者操作；避免被 sticky 底部導覽列蓋住的座標誤點）
  await page.evaluate(() => document.querySelector("#rhythmPlay").scrollIntoView({ block: "center" }));
  await new Promise((r) => setTimeout(r, 80));
  await page.click("#rhythmPlay");
  await new Promise((r) => setTimeout(r, 120));
  ok("點播放節奏（無錯誤）", true);

  // 再點一次收合
  await page.evaluate(() => document.querySelector("#rhythmBtn").scrollIntoView({ block: "center" }));
  await new Promise((r) => setTimeout(r, 60));
  await page.click("#rhythmBtn");
  await new Promise((r) => setTimeout(r, 60));
  const after = await page.$eval("#rhythm", (e) => e.innerHTML.trim());
  ok("再點可收合節奏面板", after === "");

  // 切下一句後節奏面板重置（draw 重建）
  await page.click("#nextBtn");
  await page.waitForSelector("#rhythmBtn", { timeout: 8000 });
  const afterNext = await page.$eval("#rhythm", (e) => e.innerHTML.trim());
  ok("切句後節奏面板乾淨（不殘留）", afterNext === "");

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 句子節奏 / 句重音 真機驗證 ====");
  console.log("句子:", target);
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
