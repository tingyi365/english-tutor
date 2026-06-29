// 線上正式站真機驗「我的聲音波形 + 速度對照」@ english-tutor-ai.pages.dev (https=安全內容環境可錄音)。
// fake 音訊裝置→真實錄音→真實 decodeAudioData 出波形；受控 fake TTS 走真實量測示範時長→renderPace。
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
      constructor() { this.lang = ""; this.continuous = false; this.interimResults = true; this.maxAlternatives = 3; }
      start() {
        this._t = setTimeout(() => {
          const transcript = window.__FAKE_TRANSCRIPT__ || "";
          const results = { 0: { 0: { transcript, confidence: 0.9 }, isFinal: true, length: 1 }, length: 1 };
          if (this.onresult) this.onresult({ resultIndex: 0, results });
          if (this.onend) this.onend();
        }, 600);
      }
      stop() { clearTimeout(this._t); if (this.onend) this.onend(); }
      abort() { clearTimeout(this._t); }
    }
    window.SpeechRecognition = FakeSR;
    window.webkitSpeechRecognition = FakeSR;
    const fakeTTS = {
      getVoices: () => [{ name: "FakeEN", lang: "en-US", voiceURI: "fake", default: true, localService: true }],
      speak: (u) => { setTimeout(() => { try { u.onend && u.onend(); } catch (e) {} }, 480); },
      cancel: () => {}, onvoiceschanged: null,
    };
    Object.defineProperty(window, "speechSynthesis", { value: fakeTTS, configurable: true });
    window.SpeechSynthesisUtterance = function (text) { this.text = text; this.onend = null; this.onerror = null; this.onboundary = null; };
  });

  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForSelector(".mode-card", { timeout: 10000 });
  ok("線上首頁渲染", true);

  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#micBtn:not([disabled])", { timeout: 8000 });
  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));
  await page.evaluate((t) => { window.__FAKE_TRANSCRIPT__ = t; }, target.split(" ")[0]);
  await page.click("#micBtn");
  await page.waitForSelector("#result .ring", { timeout: 8000 });
  ok("評分結果出現", true);

  await page.waitForSelector(".wave-cv", { timeout: 5000 }).catch(() => {});
  const wave = await page.evaluate(() => {
    const cv = document.querySelector(".wave-cv");
    if (!cv) return { has: false };
    const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
    let a = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 0) a++;
    return { has: true, drawn: a };
  });
  ok("波形 canvas 真畫出像素", wave.has && wave.drawn > 50, "drawn=" + (wave.drawn || 0));
  ok("速度提示顯示秒數", await page.evaluate(() => /秒/.test(document.querySelector(".pace-hint")?.textContent || "")));

  await page.evaluate(() => document.querySelector(".cmp-model")?.click());
  await page.waitForSelector(".pace-bars", { timeout: 5000 }).catch(() => {});
  const pace = await page.evaluate(() => {
    const box = document.querySelector("#pace");
    if (!box) return { has: false };
    const rows = [...box.querySelectorAll(".pace-tag")].map((t) => t.textContent);
    const v = box.querySelector(".pace-verdict");
    return { has: !!box.querySelector(".pace-bars"), rows, vcls: v ? v.className : "" };
  });
  ok("出現速度對照條", pace.has);
  ok("有「老師」「你」兩列 + 速度判語", pace.rows.includes("老師") && pace.rows.includes("你") && /pace-(ok|slow|fast)/.test(pace.vcls), JSON.stringify(pace.rows) + " " + pace.vcls);
  ok("既有 drill 卡無回歸", await page.evaluate(() => !!document.querySelector(".drill-card")));
  ok("0 console error", errors.length === 0, errors.slice(0, 4).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 線上波形+速度對照 驗證 @ " + BASE + " ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
}
