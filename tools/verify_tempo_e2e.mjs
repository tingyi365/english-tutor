// 本機真 Chrome 端到端驗「節拍器調速（慢速/標準）」（走真實 DOM + 真 WebAudio，量測真實拍距）。
// 切「🐢 慢速」後拍距應明顯變寬（≈940ms）vs 標準（≈640ms）；邊打邊調速可無縫重啟。0 console error / 375px 手機。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8826;
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
// 量測一段時間內 osc.start 的時間戳，回中位數拍距（過濾掉 -0.13 stop 的影響，只看 start 間距）
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };

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
    window.__beats = []; // 每次 osc.start 推一個 performance.now()
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) {
        const origOsc = AC.prototype.createOscillator;
        AC.prototype.createOscillator = function () {
          const o = origOsc.call(this);
          const s = o.start.bind(o);
          o.start = function (...a) { window.__beats.push(performance.now()); return s(...a); };
          return o;
        };
      }
    } catch (e) {}
  });

  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#rhythmBtn", { timeout: 8000 });
  await page.click("#rhythmBtn");
  await page.waitForSelector(".rhythm-card", { timeout: 8000 });

  // 調速 UI 存在、預設「標準」選中
  ok("節奏卡出現調速列（速度 標準/慢速）", await page.$(".tempo-row") !== null);
  const defState = await page.evaluate(() => ({
    std: document.querySelector('.tempo-opt[data-tempo="std"]')?.classList.contains("on"),
    slow: document.querySelector('.tempo-opt[data-tempo="slow"]')?.classList.contains("on"),
  }));
  ok("預設選中『🥁 標準』、未選『🐢 慢速』", defState.std === true && defState.slow === false, JSON.stringify(defState));

  // —— 量標準速拍距 ——
  async function measure(seconds) {
    await page.evaluate(() => { window.__beats = []; });
    await page.evaluate(() => document.querySelector("#metroBtn").scrollIntoView({ block: "center" }));
    await sleep(60);
    await page.click("#metroBtn"); // 開始
    await sleep(seconds * 1000);
    const beats = await page.evaluate(() => window.__beats.slice());
    // 還在打就停
    const lbl = await page.$eval("#metroBtn", (e) => e.textContent);
    if (/停止節拍/.test(lbl)) await page.click("#metroBtn");
    await sleep(150);
    // 計相鄰 start 間距（預備拍也算等距，整體中位數即拍距）
    const gaps = [];
    for (let i = 1; i < beats.length; i++) gaps.push(beats[i] - beats[i - 1]);
    return { n: beats.length, med: Math.round(median(gaps)), gaps: gaps.map((g) => Math.round(g)) };
  }

  const std = await measure(2.4);
  ok("標準速：拍距中位數 ≈640ms（550–760）", std.med >= 550 && std.med <= 760, `med=${std.med} n=${std.n}`);

  // —— 切慢速 ——
  await page.click('.tempo-opt[data-tempo="slow"]');
  const slowState = await page.evaluate(() => ({
    std: document.querySelector('.tempo-opt[data-tempo="std"]')?.classList.contains("on"),
    slow: document.querySelector('.tempo-opt[data-tempo="slow"]')?.classList.contains("on"),
  }));
  ok("點『🐢 慢速』後高亮切到慢速、標準取消", slowState.slow === true && slowState.std === false, JSON.stringify(slowState));

  const slow = await measure(3.2);
  ok("慢速：拍距中位數 ≈940ms（820–1080）", slow.med >= 820 && slow.med <= 1080, `med=${slow.med} n=${slow.n}`);
  ok("慢速拍距明顯比標準寬（差 ≥150ms）", slow.med - std.med >= 150, `slow=${slow.med} - std=${std.med} = ${slow.med - std.med}`);

  // —— 邊打邊調速：標準起打，中途切慢速應無縫重啟並變寬 ——
  await page.click('.tempo-opt[data-tempo="std"]'); // 先回標準
  await sleep(80);
  await page.evaluate(() => { window.__beats = []; });
  await page.evaluate(() => document.querySelector("#metroBtn").scrollIntoView({ block: "center" }));
  await page.click("#metroBtn"); // 標準起打
  await sleep(1400);
  const playingBefore = /停止節拍/.test(await page.$eval("#metroBtn", (e) => e.textContent));
  await page.click('.tempo-opt[data-tempo="slow"]'); // 邊打邊切慢速
  await sleep(150);
  const stillPlaying = /停止節拍/.test(await page.$eval("#metroBtn", (e) => e.textContent));
  ok("邊打邊調速：切換後節拍器仍在運作（無縫重啟）", playingBefore && stillPlaying, `before=${playingBefore} after=${stillPlaying}`);
  await page.evaluate(() => { window.__beats = []; });
  await sleep(2000);
  const afterBeats = await page.evaluate(() => window.__beats.slice());
  const afterGaps = []; for (let i = 1; i < afterBeats.length; i++) afterGaps.push(afterBeats[i] - afterBeats[i - 1]);
  const afterMed = Math.round(median(afterGaps));
  ok("調速後拍距已套用慢速（>800ms）", afterMed > 800, `afterMed=${afterMed}`);
  const lbl2 = await page.$eval("#metroBtn", (e) => e.textContent);
  if (/停止節拍/.test(lbl2)) await page.click("#metroBtn");

  // —— 切句後慢速設定不殘留亮點/孤兒 timer（沿用既有收乾淨保證）——
  await page.evaluate(() => document.querySelector("#nextBtn").click());
  await page.waitForSelector("#rhythmBtn", { timeout: 8000 });
  await sleep(700);
  const clean = await page.evaluate(() => ({
    open: document.querySelector("#rhythm").dataset.open,
    nowGone: !document.querySelector(".beat-now"),
  }));
  ok("切句後面板收合、無殘留亮點/孤兒 timer", clean.open !== "1" && clean.nowGone);

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 節拍器調速（慢速/標準）真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
