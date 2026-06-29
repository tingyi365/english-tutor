// 本機真 Chrome 端到端驗「範例 vs 我的錄音對照」：
// 用 fake 音訊裝置開真實 getUserMedia→MediaRecorder 錄音；fake STT 走真實 evaluate→對照卡渲染路徑。
// 驗：錄到音→出對照卡(老師示範/我的錄音兩鈕)→點兩鈕不丟錯→既有 drill 不被破壞→換句清掉→0 console error / 375px。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8817;
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

  // 假 STT：start() 後 ~600ms 才回 final，留時間給 getUserMedia/MediaRecorder 真實錄到音
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
  });

  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  ok("首頁 mode-card 渲染（無致命錯誤）", true);

  // 探活：確認 fake 裝置下 getUserMedia + MediaRecorder 真能錄到 bytes
  const recProbe = await page.evaluate(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = [];
      const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const done = new Promise((res) => { rec.onstop = () => res(new Blob(chunks).size); });
      rec.start();
      await new Promise((r) => setTimeout(r, 400));
      rec.stop();
      const size = await done;
      stream.getTracks().forEach((t) => t.stop());
      return size;
    } catch (e) { return "ERR:" + e.message; }
  });
  ok("fake 裝置 getUserMedia+MediaRecorder 能錄到 bytes", typeof recProbe === "number" && recProbe > 0, String(recProbe));

  // 進跟讀糾音
  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#micBtn:not([disabled])", { timeout: 8000 });
  ok("跟讀模式 mic 可用", true);
  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));

  // 唸錯（只唸第一個字）→ 應出評分 + drill + 對照卡
  await page.evaluate((t) => { window.__FAKE_TRANSCRIPT__ = t; }, target.split(" ")[0]);
  await page.click("#micBtn");
  await page.waitForSelector("#result .ring", { timeout: 8000 });
  ok("評分結果(分數環)出現", true);

  // 對照卡（核心）
  await page.waitForSelector(".compare-card", { timeout: 4000 }).catch(() => {});
  const cmp = await page.evaluate(() => {
    const c = document.querySelector(".compare-card");
    if (!c) return { has: false };
    return { has: true, model: !!c.querySelector(".cmp-model"), mine: !!c.querySelector(".cmp-mine") };
  });
  ok("錄到音 → 出現「範例 vs 我的錄音」對照卡", cmp.has);
  ok("對照卡有「🔊 老師示範」鈕", cmp.model);
  ok("對照卡有「🎧 我的錄音」鈕", cmp.mine);

  // 點「我的錄音」→ 不丟錯（會建 Audio 回放）
  const clickMine = await page.evaluate(() => { const b = document.querySelector(".cmp-mine"); if (!b) return false; b.click(); return true; });
  ok("點「🎧 我的錄音」回放（無錯誤）", clickMine);
  await new Promise((r) => setTimeout(r, 250));
  // 點「老師示範」→ 不丟錯
  const clickModel = await page.evaluate(() => { const b = document.querySelector(".cmp-model"); if (!b) return false; b.click(); return true; });
  ok("點「🔊 老師示範」（無錯誤）", clickModel);
  await new Promise((r) => setTimeout(r, 250));

  // 回歸：既有 drill 卡仍在（沒被破壞）
  ok("既有逐音 drill 卡仍正常出現（無回歸）", await page.evaluate(() => !!document.querySelector(".drill-card")));

  // 換下一句 → 對照卡應清掉（不殘留）
  const beforeNext = await page.$eval("#sentence", (e) => e.textContent.trim().slice(0, 30));
  await page.evaluate(() => document.querySelector("#nextBtn")?.click());
  await new Promise((r) => setTimeout(r, 300));
  const afterNext = await page.evaluate(() => ({
    hasCard: !!document.querySelector(".compare-card"),
    sentence: (document.querySelector("#sentence")?.textContent || "").trim().slice(0, 30),
    resultEmpty: (document.querySelector("#result")?.innerHTML || "").trim().length === 0,
  }));
  ok("換句後對照卡清除（不殘留）", !afterNext.hasCard, `before=${beforeNext} | ${JSON.stringify(afterNext)}`);

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 範例 vs 我的錄音對照 驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
