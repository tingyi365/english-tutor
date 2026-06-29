// 本機真 Chrome 端到端驗「單字 drill 逐字錄音對照」：
// fake 音訊裝置開真實 getUserMedia→MediaRecorder；fake STT 走真實 evaluate→drill 渲染路徑。
// 驗：drill 卡每字有「🎤 跟我唸」→真實點按錄音 3 秒自動停→出「🔊 示範 / 🎧 我的錄音」對照→點兩鈕不丟錯
//     →句子層對照卡(第9/13輪)無回歸→換句清乾淨不殘留→0 console error / 375px。
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
  });

  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  ok("首頁 mode-card 渲染（無致命錯誤）", true);

  // 探活：fake 裝置下 getUserMedia + MediaRecorder 真能錄到 bytes
  const recProbe = await page.evaluate(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const chunks = []; const rec = new MediaRecorder(stream);
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const done = new Promise((res) => { rec.onstop = () => res(new Blob(chunks).size); });
      rec.start(); await new Promise((r) => setTimeout(r, 400)); rec.stop();
      const size = await done; stream.getTracks().forEach((t) => t.stop()); return size;
    } catch (e) { return "ERR:" + e.message; }
  });
  ok("fake 裝置 getUserMedia+MediaRecorder 能錄到 bytes", typeof recProbe === "number" && recProbe > 0, String(recProbe));

  // 進跟讀糾音
  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#micBtn:not([disabled])", { timeout: 8000 });
  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));

  // 唸錯（只唸第一個字）→ 應出評分 + drill 卡
  await page.evaluate((t) => { window.__FAKE_TRANSCRIPT__ = t; }, target.split(" ")[0]);
  await page.click("#micBtn");
  await page.waitForSelector("#result .ring", { timeout: 8000 });
  await page.waitForSelector(".drill-card", { timeout: 4000 }).catch(() => {});
  ok("評分後出現逐音 drill 卡", await page.evaluate(() => !!document.querySelector(".drill-card")));

  // 每個 drill 字都有「🎤 跟我唸」鈕
  const recBtns = await page.evaluate(() => {
    const items = [...document.querySelectorAll(".drill-item")];
    return { total: items.length, withRec: items.filter((it) => it.querySelector(".drill-rec")).length };
  });
  ok("每個 drill 字都有「🎤 跟我唸」鈕", recBtns.total > 0 && recBtns.total === recBtns.withRec, JSON.stringify(recBtns));

  // 對照卡尚未出現（還沒錄）
  ok("錄音前不顯示對照（drill-cmp 隱藏）", await page.evaluate(() => {
    const c = document.querySelector(".drill-item .drill-cmp");
    return !c || c.hidden;
  }));

  // 真實點第一個字的「🎤 跟我唸」→ 進入錄音中
  await page.evaluate(() => { document.querySelector(".drill-item .drill-rec")?.scrollIntoView({ block: "center" }); });
  await page.evaluate(() => document.querySelector(".drill-item .drill-rec")?.click());
  await sleep(400);
  ok("點「🎤 跟我唸」→ 進入錄音中狀態", await page.evaluate(() => {
    const b = document.querySelector(".drill-item .drill-rec");
    return !!b && /錄音中/.test(b.textContent);
  }), await page.evaluate(() => document.querySelector(".drill-item .drill-rec")?.textContent || ""));

  // 等錄音 3 秒自動停 + 解碼
  await sleep(3200);
  const afterRec = await page.evaluate(() => {
    const it = document.querySelector(".drill-item");
    const b = it?.querySelector(".drill-rec");
    const cmp = it?.querySelector(".drill-cmp");
    return {
      btn: b?.textContent || "",
      cmpShown: !!cmp && !cmp.hidden,
      model: !!cmp?.querySelector(".drill-cmp-model"),
      mine: !!cmp?.querySelector(".drill-cmp-mine"),
    };
  });
  ok("錄完 3 秒自動停、鈕變「重錄這個字」", /重錄/.test(afterRec.btn), afterRec.btn);
  ok("出現單字對照（drill-cmp 顯示）", afterRec.cmpShown);
  ok("對照有「🔊 示範」鈕", afterRec.model);
  ok("對照有「🎧 我的錄音」鈕", afterRec.mine);

  // 點「我的錄音」回放 → 不丟錯
  ok("點「🎧 我的錄音」回放（無錯誤）", await page.evaluate(() => {
    const b = document.querySelector(".drill-item .drill-cmp-mine"); if (!b) return false; b.click(); return true;
  }));
  await sleep(250);
  // 點「示範」 → 不丟錯
  ok("點「🔊 示範」（無錯誤）", await page.evaluate(() => {
    const b = document.querySelector(".drill-item .drill-cmp-model"); if (!b) return false; b.click(); return true;
  }));
  await sleep(250);

  // 回歸：句子層「範例 vs 我的錄音」對照卡仍在（第9/13輪沒被破壞）
  ok("句子層對照卡仍正常（無回歸）", await page.evaluate(() => !!document.querySelector(".compare-card")));

  // 換下一句 → drill-cmp 與句子對照卡都清掉、不殘留
  const beforeNext = await page.$eval("#sentence", (e) => e.textContent.trim().slice(0, 30));
  await page.evaluate(() => document.querySelector("#nextBtn")?.click());
  await sleep(300);
  const afterNext = await page.evaluate(() => ({
    hasDrillCmp: !!document.querySelector(".drill-cmp:not([hidden])"),
    hasCompare: !!document.querySelector(".compare-card"),
    resultEmpty: (document.querySelector("#result")?.innerHTML || "").trim().length === 0,
    sentence: (document.querySelector("#sentence")?.textContent || "").trim().slice(0, 30),
  }));
  ok("換句後單字對照與結果清除（不殘留）", !afterNext.hasDrillCmp && !afterNext.hasCompare && afterNext.resultEmpty,
    `before=${beforeNext} | ${JSON.stringify(afterNext)}`);

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 單字 drill 逐字錄音對照 驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
