// 對線上正式站 https://english-tutor-ai.pages.dev 真機端到端驗「範例 vs 我的錄音對照」。
// fake 音訊裝置開真實 getUserMedia→MediaRecorder；fake STT 走真實 evaluate→對照卡。0 console error / 375px。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://english-tutor-ai.pages.dev/";
const results = [];
const ok = (n, c, extra = "") => results.push({ n, pass: !!c, extra });

const browser = await puppeteer.launch({
  executablePath: CHROME, headless: "new",
  args: ["--no-sandbox", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"],
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("onboarded", "1"); } catch (e) {}
    class FakeSR {
      constructor() { this.interimResults = true; this.maxAlternatives = 3; }
      start() { this._t = setTimeout(() => {
        const transcript = window.__FAKE_TRANSCRIPT__ || "";
        const results = { 0: { 0: { transcript, confidence: 0.9 }, isFinal: true, length: 1 }, length: 1 };
        if (this.onresult) this.onresult({ resultIndex: 0, results });
        if (this.onend) this.onend();
      }, 600); }
      stop() { clearTimeout(this._t); if (this.onend) this.onend(); }
      abort() { clearTimeout(this._t); }
    }
    window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  });

  const resp = await page.goto(BASE, { waitUntil: "networkidle0" });
  ok("線上站 HTTP 200", resp.status() === 200, String(resp.status()));
  await page.waitForSelector(".mode-card", { timeout: 10000 });
  ok("首頁 mode-card 渲染", true);

  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#micBtn:not([disabled])", { timeout: 10000 });
  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));
  await page.evaluate((t) => { window.__FAKE_TRANSCRIPT__ = t; }, target.split(" ")[0]);
  await page.click("#micBtn");
  await page.waitForSelector("#result .ring", { timeout: 10000 });
  ok("評分結果出現", true);

  await page.waitForSelector(".compare-card", { timeout: 4000 }).catch(() => {});
  const cmp = await page.evaluate(() => {
    const c = document.querySelector(".compare-card");
    return c ? { has: true, model: !!c.querySelector(".cmp-model"), mine: !!c.querySelector(".cmp-mine") } : { has: false };
  });
  ok("錄到音 → 出現對照卡", cmp.has);
  ok("有「🔊 老師示範」鈕", cmp.model);
  ok("有「🎧 我的錄音」鈕", cmp.mine);
  ok("點「🎧 我的錄音」回放（無錯誤）", await page.evaluate(() => { const b = document.querySelector(".cmp-mine"); if (!b) return false; b.click(); return true; }));
  await new Promise((r) => setTimeout(r, 250));
  ok("點「🔊 老師示範」（無錯誤）", await page.evaluate(() => { const b = document.querySelector(".cmp-model"); if (!b) return false; b.click(); return true; }));
  await new Promise((r) => setTimeout(r, 250));
  ok("既有逐音 drill 卡仍正常（無回歸）", await page.evaluate(() => !!document.querySelector(".drill-card")));
  await page.evaluate(() => document.querySelector("#nextBtn")?.click());
  await new Promise((r) => setTimeout(r, 300));
  ok("換句後對照卡清除", await page.evaluate(() => !document.querySelector(".compare-card")));
  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 線上站 範例 vs 我的錄音對照 驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally { await browser.close(); }
