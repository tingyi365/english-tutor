// 線上正式站真機端到端驗「節拍器調速」：量測線上拍距 標準≈640 vs 慢速≈940、邊打邊調速。0 console error。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://english-tutor-ai.pages.dev/";
const results = []; const ok = (n, c, e = "") => results.push({ n, pass: !!c, e });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const median = (a) => { const s = [...a].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox", "--autoplay-policy=no-user-gesture-required"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("onboarded", "1"); localStorage.setItem("shadowIdx", "0"); } catch (e) {}
    window.__beats = [];
    try { const AC = window.AudioContext || window.webkitAudioContext;
      if (AC) { const o0 = AC.prototype.createOscillator;
        AC.prototype.createOscillator = function () { const o = o0.call(this); const s = o.start.bind(o); o.start = function (...a) { window.__beats.push(performance.now()); return s(...a); }; return o; }; } } catch (e) {}
  });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 12000 });
  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#rhythmBtn", { timeout: 10000 });
  await page.click("#rhythmBtn");
  await page.waitForSelector(".rhythm-card", { timeout: 10000 });
  ok("線上節奏卡含調速列", await page.$(".tempo-row") !== null);
  async function measure(sec) {
    await page.evaluate(() => { window.__beats = []; });
    await page.evaluate(() => document.querySelector("#metroBtn").scrollIntoView({ block: "center" }));
    await sleep(60); await page.click("#metroBtn"); await sleep(sec * 1000);
    const b = await page.evaluate(() => window.__beats.slice());
    if (/停止節拍/.test(await page.$eval("#metroBtn", (e) => e.textContent))) await page.click("#metroBtn");
    await sleep(150); const g = []; for (let i = 1; i < b.length; i++) g.push(b[i] - b[i - 1]);
    return { n: b.length, med: Math.round(median(g)) };
  }
  const std = await measure(2.4);
  ok("線上標準速拍距 ≈640ms", std.med >= 550 && std.med <= 760, `med=${std.med} n=${std.n}`);
  await page.click('.tempo-opt[data-tempo="slow"]');
  ok("線上點慢速高亮切換", await page.$eval('.tempo-opt[data-tempo="slow"]', (e) => e.classList.contains("on")));
  const slow = await measure(3.2);
  ok("線上慢速拍距 ≈940ms", slow.med >= 820 && slow.med <= 1080, `med=${slow.med} n=${slow.n}`);
  ok("線上慢速明顯比標準寬(≥150ms)", slow.med - std.med >= 150, `${slow.med}-${std.med}=${slow.med - std.med}`);
  ok("0 console error", errors.length === 0, errors.slice(0, 4).join(" | "));
  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 線上 節拍器調速 真機驗證 ====");
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.e ? "  [" + r.e + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally { await browser.close(); }
