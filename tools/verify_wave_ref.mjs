// 本機真 Chrome 端到端驗第16輪「波形疊示範參考線 + 標出停頓段」：
// fake 音訊裝置開真實 getUserMedia→MediaRecorder→真實 decodeAudioData 出波形；走真實 evaluate→對照卡→drawWave 路徑。
// 驗：①波形 canvas 畫出青柱(我的聲音) ②畫出「琥珀色示範重音參考線」像素 ③圖例(你的聲音/示範重音字/你的停頓)在
//     ④wave-tip 顯示「連貫」或「停頓 N 次」教學文案 ⑤sentenceStress 真給該句實詞/虛詞(參考線資料源正確)
//     ⑥既有 drill / 速度對照無回歸 ⑦換句清乾淨 ⑧0 console error / 375px。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { sentenceStress } from "../assets/js/scoring.js";

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

  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  ok("首頁 mode-card 渲染（無致命錯誤）", true);

  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#micBtn:not([disabled])", { timeout: 8000 });
  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));

  // node 端：sentenceStress 真給該句實詞/虛詞（=參考線資料源），且同時含強拍與弱拍
  const marks = sentenceStress(target);
  ok("sentenceStress 解析目標句（參考線資料源）", Array.isArray(marks) && marks.length > 0, target.slice(0, 40));
  ok("參考線同時含實詞(高)與虛詞(低)", marks.some((m) => m.stressed) && marks.some((m) => !m.stressed),
    "strong=" + marks.filter((m) => m.stressed).length + " weak=" + marks.filter((m) => !m.stressed).length);

  // 唸錯（只唸第一字）→ 評分 + 對照卡 + 波形
  await page.evaluate((t) => { window.__FAKE_TRANSCRIPT__ = t; }, target.split(" ")[0]);
  await page.click("#micBtn");
  await page.waitForSelector("#result .ring", { timeout: 8000 });
  await page.waitForSelector(".compare-card", { timeout: 4000 }).catch(() => {});
  ok("出現「範例 vs 我的錄音」對照卡", await page.evaluate(() => !!document.querySelector(".compare-card")));

  await page.waitForSelector(".wave-cv", { timeout: 4000 }).catch(() => {});
  // 像素分析：青柱(我的聲音) + 琥珀參考線(示範重音) 都真的畫出
  const px = await page.evaluate(() => {
    const cv = document.querySelector(".wave-cv");
    if (!cv) return { has: false };
    const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
    let alpha = 0, cyan = 0, amber = 0;
    for (let i = 0; i < d.length; i += 4) {
      const r = d[i], g = d[i + 1], b = d[i + 2], a = d[i + 3];
      if (a > 0) alpha++;
      if (a > 0 && b > 180 && g > 140 && r < 120) cyan++;           // #38bdf8 青
      if (a > 0 && r > 200 && g > 120 && g < 200 && b < 100) amber++; // #f59e0b 琥珀
    }
    return { has: true, alpha, cyan, amber };
  });
  ok("波形畫出像素（非空白）", px.has && px.alpha > 50, "alpha=" + (px.alpha || 0));
  ok("畫出青色「我的聲音」波柱", px.has && px.cyan > 20, "cyan=" + (px.cyan || 0));
  ok("畫出琥珀色「示範重音參考線」", px.has && px.amber > 20, "amber=" + (px.amber || 0));

  // 圖例三項
  const legend = await page.evaluate(() => {
    const w = document.querySelector(".wave-legend");
    if (!w) return { has: false };
    return { has: true, mine: !!w.querySelector(".wl-mine"), ref: !!w.querySelector(".wl-ref"), pause: !!w.querySelector(".wl-pause") };
  });
  ok("圖例含「你的聲音/示範重音字/你的停頓」三項", legend.has && legend.mine && legend.ref && legend.pause, JSON.stringify(legend));

  // wave-tip：顯示「連貫」或「停頓 N 次」其一 + 提到琥珀線
  const tip = await page.evaluate(() => {
    const t = document.querySelector(".wave-tip");
    return t ? { txt: t.textContent.trim(), refSpan: !!t.querySelector(".wt-ref") } : { txt: "", refSpan: false };
  });
  ok("wave-tip 顯示停頓/連貫教學文案", /停頓了 \d+ 次|很連貫/.test(tip.txt), tip.txt.slice(0, 50));
  ok("wave-tip 引導對照琥珀參考線", tip.refSpan && /琥珀線/.test(tip.txt));

  // 回歸：速度對照（點老師示範）
  await page.evaluate(() => { const b = document.querySelector(".cmp-model"); if (b) b.click(); });
  await page.waitForSelector(".pace-bars", { timeout: 4000 }).catch(() => {});
  ok("速度對照條無回歸(pace-bars)", await page.evaluate(() => !!document.querySelector(".pace-bars")));
  // 回歸：drill 卡
  ok("既有逐音 drill 卡無回歸", await page.evaluate(() => !!document.querySelector(".drill-card")));
  // 回歸：我的錄音回放不丟錯
  ok("點「🎧 我的錄音」回放（無錯誤）", await page.evaluate(() => { const b = document.querySelector(".cmp-mine"); if (!b) return false; b.click(); return true; }));
  await new Promise((r) => setTimeout(r, 200));

  // 換句 → 對照卡/波形/圖例/tip 全清
  await page.evaluate(() => document.querySelector("#nextBtn")?.click());
  await new Promise((r) => setTimeout(r, 300));
  const after = await page.evaluate(() => ({
    card: !!document.querySelector(".compare-card"),
    wave: !!document.querySelector(".wave-cv"),
    legend: !!document.querySelector(".wave-legend"),
    tip: !!document.querySelector(".wave-tip"),
    resultEmpty: (document.querySelector("#result")?.innerHTML || "").trim().length === 0,
  }));
  ok("換句後波形/圖例/tip 全清除（不殘留）", !after.card && !after.wave && !after.legend && !after.tip, JSON.stringify(after));

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 波形疊示範參考線 + 停頓標記 驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
