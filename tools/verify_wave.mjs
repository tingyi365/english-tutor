// 本機真 Chrome 端到端驗「我的聲音波形 + 速度對照」：
// fake 音訊裝置開真實 getUserMedia→MediaRecorder→真實 decodeAudioData 出波形；
// 受控 fake TTS(固定示範時長)走真實「量測老師示範播放時長 → renderPace」路徑。
// 驗：錄到音→出對照卡→波形 canvas 真畫出像素→pace-hint 顯示我的秒數→點老師示範→出速度對照條(老師/你)+判語→
//     既有 drill 不被破壞→換句清掉→0 console error / 375px。
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
    // 假 STT：start() 後 ~600ms 回 final，留時間給真實錄音
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
    // 受控 fake TTS：固定示範朗讀 ~480ms 才 onend → app 量到的 refDur≈0.48s（決定性驗 renderPace 真實量測路徑）
    const fakeTTS = {
      getVoices: () => [{ name: "FakeEN", lang: "en-US", voiceURI: "fake", default: true, localService: true }],
      speak: (u) => { setTimeout(() => { try { u.onend && u.onend(); } catch (e) {} }, 480); },
      cancel: () => {},
      onvoiceschanged: null,
    };
    Object.defineProperty(window, "speechSynthesis", { value: fakeTTS, configurable: true });
    window.SpeechSynthesisUtterance = function (text) { this.text = text; this.onend = null; this.onerror = null; this.onboundary = null; };
  });

  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  ok("首頁 mode-card 渲染（無致命錯誤）", true);

  // 探活：fake 裝置真能錄到 bytes
  const recProbe = await page.evaluate(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const done = new Promise((res) => { rec.onstop = () => res(new Blob(chunks).size); });
      rec.start();
      await new Promise((r) => setTimeout(r, 500));
      rec.stop();
      const size = await done;
      stream.getTracks().forEach((t) => t.stop());
      return size;
    } catch (e) { return "ERR:" + e.message; }
  });
  ok("fake 裝置 getUserMedia+MediaRecorder 能錄到 bytes", typeof recProbe === "number" && recProbe > 0, String(recProbe));

  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#micBtn:not([disabled])", { timeout: 8000 });
  ok("跟讀模式 mic 可用", true);
  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));

  // 唸錯（只唸第一個字）→ 評分 + drill + 對照卡
  await page.evaluate((t) => { window.__FAKE_TRANSCRIPT__ = t; }, target.split(" ")[0]);
  await page.click("#micBtn");
  await page.waitForSelector("#result .ring", { timeout: 8000 });
  ok("評分結果(分數環)出現", true);

  await page.waitForSelector(".compare-card", { timeout: 4000 }).catch(() => {});
  ok("出現「範例 vs 我的錄音」對照卡", await page.evaluate(() => !!document.querySelector(".compare-card")));

  // 波形 canvas：存在且真的畫出像素（讀 alpha 通道總和 > 0）
  await page.waitForSelector(".wave-cv", { timeout: 4000 }).catch(() => {});
  const wave = await page.evaluate(() => {
    const cv = document.querySelector(".wave-cv");
    if (!cv) return { has: false };
    const ctx = cv.getContext("2d");
    const d = ctx.getImageData(0, 0, cv.width, cv.height).data;
    let alpha = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i] > 0) alpha++;
    return { has: true, drawnPixels: alpha };
  });
  ok("波形 canvas 存在", wave.has);
  ok("波形真的畫出像素（非空白）", wave.has && wave.drawnPixels > 50, "drawn=" + (wave.drawnPixels || 0));

  // pace-hint：顯示我這次唸的秒數
  const hint = await page.evaluate(() => {
    const h = document.querySelector(".pace-hint");
    return h ? h.textContent : "";
  });
  ok("速度提示顯示我的錄音秒數", /秒/.test(hint), hint.replace(/\s+/g, " ").slice(0, 60));

  // 點「老師示範」→ 量測示範時長 → 渲染速度對照條
  await page.evaluate(() => { const b = document.querySelector(".cmp-model"); if (b) b.click(); });
  await page.waitForSelector(".pace-bars", { timeout: 4000 }).catch(() => {});
  const pace = await page.evaluate(() => {
    const box = document.querySelector("#pace");
    if (!box) return { has: false };
    const rows = [...box.querySelectorAll(".pace-row")].map((r) => r.querySelector(".pace-tag")?.textContent);
    const v = box.querySelector(".pace-verdict");
    const bars = [...box.querySelectorAll(".pace-bar > i")].map((i) => i.style.width);
    return { has: !!box.querySelector(".pace-bars"), rows, verdict: v ? v.textContent.trim() : "", vcls: v ? v.className : "", bars };
  });
  ok("點老師示範後出現速度對照條(pace-bars)", pace.has);
  ok("對照條有「老師」與「你」兩列", pace.rows && pace.rows.includes("老師") && pace.rows.includes("你"), JSON.stringify(pace.rows));
  ok("速度條有非零寬度", pace.bars && pace.bars.some((w) => parseFloat(w) > 0), JSON.stringify(pace.bars));
  ok("有速度判語(太快/太慢/差不多)", /pace-(ok|slow|fast)/.test(pace.vcls || ""), pace.vcls + " | " + pace.verdict.slice(0, 30));

  // 點「我的錄音」回放不丟錯
  ok("點「🎧 我的錄音」回放（無錯誤）", await page.evaluate(() => { const b = document.querySelector(".cmp-mine"); if (!b) return false; b.click(); return true; }));
  await new Promise((r) => setTimeout(r, 200));

  // 回歸：既有 drill 卡仍在
  ok("既有逐音 drill 卡仍正常出現（無回歸）", await page.evaluate(() => !!document.querySelector(".drill-card")));

  // 換下一句 → 對照卡(含波形/速度)清掉
  await page.evaluate(() => document.querySelector("#nextBtn")?.click());
  await new Promise((r) => setTimeout(r, 300));
  const after = await page.evaluate(() => ({
    hasCard: !!document.querySelector(".compare-card"),
    hasWave: !!document.querySelector(".wave-cv"),
    resultEmpty: (document.querySelector("#result")?.innerHTML || "").trim().length === 0,
  }));
  ok("換句後對照卡/波形清除（不殘留）", !after.hasCard && !after.hasWave, JSON.stringify(after));

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 我的聲音波形 + 速度對照 驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
