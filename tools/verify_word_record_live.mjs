// 對線上正式站 https://english-tutor-ai.pages.dev 真機端到端驗「單字 drill 逐字錄音對照」。
// fake 音訊裝置開真實 getUserMedia→MediaRecorder；fake STT 走真實 evaluate→drill→單字錄音對照。0 console error / 375px。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://english-tutor-ai.pages.dev/";
const results = [];
const ok = (n, c, extra = "") => results.push({ n, pass: !!c, extra });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

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

  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#micBtn:not([disabled])", { timeout: 10000 });
  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));
  await page.evaluate((t) => { window.__FAKE_TRANSCRIPT__ = t; }, target.split(" ")[0]);
  await page.click("#micBtn");
  await page.waitForSelector("#result .ring", { timeout: 10000 });
  await page.waitForSelector(".drill-card", { timeout: 5000 }).catch(() => {});
  ok("評分後出現逐音 drill 卡", await page.evaluate(() => !!document.querySelector(".drill-card")));

  const recBtns = await page.evaluate(() => {
    const items = [...document.querySelectorAll(".drill-item")];
    return { total: items.length, withRec: items.filter((it) => it.querySelector(".drill-rec")).length };
  });
  ok("每個 drill 字都有「🎤 跟我唸」鈕", recBtns.total > 0 && recBtns.total === recBtns.withRec, JSON.stringify(recBtns));

  await page.evaluate(() => { document.querySelector(".drill-item .drill-rec")?.scrollIntoView({ block: "center" }); });
  await page.evaluate(() => document.querySelector(".drill-item .drill-rec")?.click());
  await sleep(400);
  ok("點「🎤 跟我唸」→ 錄音中", await page.evaluate(() => /錄音中/.test(document.querySelector(".drill-item .drill-rec")?.textContent || "")));

  await sleep(3200);
  const afterRec = await page.evaluate(() => {
    const it = document.querySelector(".drill-item");
    const cmp = it?.querySelector(".drill-cmp");
    return {
      btn: it?.querySelector(".drill-rec")?.textContent || "",
      cmpShown: !!cmp && !cmp.hidden,
      model: !!cmp?.querySelector(".drill-cmp-model"),
      mine: !!cmp?.querySelector(".drill-cmp-mine"),
    };
  });
  ok("錄完自動停、鈕變「重錄這個字」", /重錄/.test(afterRec.btn), afterRec.btn);
  ok("出現單字對照（drill-cmp 顯示）", afterRec.cmpShown);
  ok("對照有「🔊 示範」鈕", afterRec.model);
  ok("對照有「🎧 我的錄音」鈕", afterRec.mine);

  ok("點「🎧 我的錄音」回放（無錯誤）", await page.evaluate(() => {
    const b = document.querySelector(".drill-item .drill-cmp-mine"); if (!b) return false; b.click(); return true;
  }));
  await sleep(250);
  ok("點「🔊 示範」（無錯誤）", await page.evaluate(() => {
    const b = document.querySelector(".drill-item .drill-cmp-model"); if (!b) return false; b.click(); return true;
  }));
  await sleep(250);

  ok("句子層對照卡仍正常（無回歸）", await page.evaluate(() => !!document.querySelector(".compare-card")));

  await page.evaluate(() => document.querySelector("#nextBtn")?.click());
  await sleep(300);
  ok("換句後單字對照清除（不殘留）", await page.evaluate(() =>
    !document.querySelector(".drill-cmp:not([hidden])") && !document.querySelector(".compare-card")));

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 線上：單字 drill 逐字錄音對照 驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
}
