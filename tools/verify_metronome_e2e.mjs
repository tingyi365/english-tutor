// 本機真 Chrome 端到端驗「節拍器（打節拍跟著唸）」功能（走真實 DOM 渲染 + 真 WebAudio）。
// 點「🎵 句子節奏」→「🥁 打節拍跟著唸」→ 驗節拍器啟動、重音亮點(beat-now)逐拍移動、可停、切句不殘留。0 console error / 375px 手機。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8821;
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

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new",
  args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("onboarded", "1"); localStorage.setItem("shadowIdx", "0"); } catch (e) {}
    // 記錄 AudioContext 是否真的被建立 + osc.start 觸發次數（證明「咑」聲真有發出）
    window.__clicks = 0;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const origOsc = AC.prototype.createOscillator;
        AC.prototype.createOscillator = function () {
          const o = origOsc.call(this);
          const s = o.start.bind(o);
          o.start = function (...a) { window.__clicks++; return s(...a); };
          return o;
        };
      }
    } catch (e) {}
  });

  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  ok("首頁 mode-card 渲染（無致命錯誤）", true);

  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#rhythmBtn", { timeout: 8000 });
  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));

  await page.click("#rhythmBtn");
  await page.waitForSelector(".rhythm-card", { timeout: 8000 });
  ok("展開節奏卡後出現『🥁 打節拍跟著唸』鈕", await page.$("#metroBtn") !== null);
  ok("節奏卡含節拍器教學文案（每聲咑＝一個重音）",
    await page.$eval(".metro-tip", (e) => /每聲.*咑.*重音|節拍/.test(e.textContent)).catch(() => false));

  const strongCount = await page.$$eval(".beat.beat-strong", (a) => a.length);
  ok("句中有可打拍的重音實詞", strongCount >= 1, `strong=${strongCount}`);

  // 啟動節拍器（先把鈕捲到畫面中央＝模擬真實使用者點按；真實 page.click 觸發 onclick）
  await page.evaluate(() => document.querySelector("#metroBtn").scrollIntoView({ block: "center" }));
  await sleep(80);
  await page.click("#metroBtn");
  const label = await page.$eval("#metroBtn", (e) => e.textContent);
  ok("真實點按後鈕文字變『停止節拍』（節拍器啟動）", /停止節拍/.test(label), label);

  // 預備兩拍(-2,-1)後開始打到重音上：等幾拍，抓 beat-now 是否曾經出現在「實詞」上
  let sawNowOnStrong = false, maxClicks = 0;
  for (let i = 0; i < 8; i++) {
    await sleep(320);
    const snap = await page.evaluate(() => {
      const now = document.querySelector(".beat-now");
      return { onStrong: !!(now && now.classList.contains("beat-strong")), clicks: window.__clicks };
    });
    if (snap.onStrong) sawNowOnStrong = true;
    maxClicks = Math.max(maxClicks, snap.clicks);
  }
  ok("節拍亮點(beat-now)有打在重音實詞上", sawNowOnStrong);
  ok("WebAudio『咑』聲真有發出（osc.start 觸發）", maxClicks >= 2, `clicks=${maxClicks}`);

  // 等節拍器自然跑完（句子拍數有限），鈕應恢復原字
  await sleep(2600);
  const labelAfter = await page.$eval("#metroBtn", (e) => e.textContent).catch(() => "");
  ok("整句打完後自動停、鈕恢復『打節拍跟著唸』", /打節拍跟著唸/.test(labelAfter), labelAfter);
  const nowGone = await page.$(".beat-now");
  ok("停止後亮點清除（不殘留）", nowGone === null);

  // 手動 toggle：開→再按一次停
  await page.click("#metroBtn");
  await sleep(200);
  const onLabel = await page.$eval("#metroBtn", (e) => e.textContent);
  await page.click("#metroBtn");
  await sleep(120);
  const offLabel = await page.$eval("#metroBtn", (e) => e.textContent);
  ok("再按一次可手動停止節拍器", /停止節拍/.test(onLabel) && /打節拍跟著唸/.test(offLabel), `${onLabel}→${offLabel}`);

  // 節拍器跑著時切下一句：應自動停、無殘留亮點、面板重置
  // 用 .click() 直接觸發（避開 puppeteer 在 CSS transition 進行中 page.click 的 actionability flakiness；
  // 真實使用者點按不受其他元素動畫影響。重點驗的是切句後 handler 是否正確收乾淨）。
  await page.click("#metroBtn");
  await sleep(150);
  await page.evaluate(() => document.querySelector("#nextBtn").click());
  await page.waitForSelector("#rhythmBtn", { timeout: 8000 });
  await sleep(750); // 超過一拍：若 timer 沒清，亮點/clicks 會繼續動
  const afterNav = await page.evaluate(() => ({
    rhythm: document.querySelector("#rhythm").innerHTML.trim(),
    nowGone: !document.querySelector(".beat-now"),
    open: document.querySelector("#rhythm").dataset.open,
    sentence: (document.querySelector("#sentence")?.textContent || "").trim(),
  }));
  ok("切句後確實換到新句、面板收合（open 重置）", afterNav.open !== "1" && afterNav.sentence !== target, "sentence=" + afterNav.sentence);
  ok("切句後節奏面板乾淨收合（不殘留）", afterNav.rhythm === "", "rhythm=[" + afterNav.rhythm.slice(0, 80) + "]");
  ok("切句後節拍器已停（無殘留亮點/孤兒 timer）", afterNav.nowGone);

  // 收合面板也應停掉節拍器
  await page.click("#rhythmBtn"); // 重新展開
  await page.waitForSelector("#metroBtn", { timeout: 8000 });
  await page.click("#metroBtn"); // 開始
  await sleep(150);
  await page.evaluate(() => document.querySelector("#rhythmBtn").click()); // 收合
  await sleep(120);
  const collapsed = await page.$eval("#rhythm", (e) => e.innerHTML.trim());
  ok("收合面板時節拍器一併停止、面板清空", collapsed === "", "collapsed=[" + collapsed.slice(0, 80) + "]");

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 節拍器（打節拍跟著唸）真機驗證 ====");
  console.log("句子:", target);
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
