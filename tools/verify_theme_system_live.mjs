// 線上正式站真機驗「主題跟隨系統 prefers-color-scheme」（第27輪）：375px 手機、0 console error。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://english-tutor-ai.pages.dev/";
const results = [];
const ok = (n, c, extra = "") => results.push({ n, pass: !!c, extra });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const rgb = (str) => (str.match(/\d+/g) || [0, 0, 0]).slice(0, 3).map(Number);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  await page.evaluateOnNewDocument(() => { try { if (!localStorage.getItem("onboarded")) localStorage.setItem("onboarded", "1"); } catch {} });
  const state = () => page.evaluate(() => ({
    theme: document.documentElement.dataset.theme || null, pref: localStorage.getItem("theme"),
    btn: document.getElementById("themeToggle")?.textContent, sel: document.getElementById("themeSelect")?.value,
    bodyBg: getComputedStyle(document.body).backgroundColor }));
  const tap = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); }, sel);
  const pickTheme = async (v) => { await tap("#settingsBtn"); await sleep(150); await page.select("#themeSelect", v); await sleep(220); await tap("#settingsClose"); await sleep(100); };
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await page.goto(BASE, { waitUntil: "networkidle0" });
  let s = await state();
  ok("線上預設深色(零回歸)", s.theme === null && s.pref === null, `theme=${s.theme} pref=${s.pref}`);
  ok("線上預設選單值=dark", s.sel === "dark", `sel=${s.sel}`);
  await tap("#settingsBtn"); await sleep(150);
  const opts = await page.$$eval("#themeSelect option", (os) => os.map((o) => o.value));
  ok("線上 themeSelect 三態", JSON.stringify(opts) === JSON.stringify(["system","light","dark"]), opts.join(","));
  await tap("#settingsClose"); await sleep(100);
  await pickTheme("system");
  s = await state();
  ok("線上選 system → pref=system + OS深→深 + 鈕🌗", s.pref === "system" && s.theme === null && s.btn === "🌗", `pref=${s.pref} theme=${s.theme} btn=${s.btn}`);
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]); await sleep(250);
  s = await state();
  ok("線上 system + OS淺 → 即時變淺", s.theme === "light" && lum(rgb(s.bodyBg)) > 0.7, `theme=${s.theme} ${s.bodyBg}`);
  ok("線上 OS 變動不改偏好(pref仍system)", s.pref === "system", `pref=${s.pref}`);
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  const fp = await page.evaluate(() => document.documentElement.dataset.theme || null);
  ok("線上 reload(system+OS淺) 開畫即淺(防閃)", fp === "light", `firstPaint=${fp}`);
  await page.waitForSelector(".mode-card"); await sleep(120);
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]); await sleep(200);
  s = await state();
  ok("線上 system + OS切回深 → 即時變深", s.theme === null, `theme=${s.theme}`);
  await pickTheme("light");
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]); await sleep(200);
  s = await state();
  ok("線上固定淺色不受OS影響", s.theme === "light" && s.pref === "light" && s.btn === "☀️", `theme=${s.theme} pref=${s.pref}`);
  await pickTheme("dark");
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]); await sleep(200);
  s = await state();
  ok("線上固定深色不受OS影響", s.theme === null && s.pref === "dark" && s.btn === "🌙", `theme=${s.theme} pref=${s.pref}`);
  await pickTheme("system");
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]); await sleep(150);
  await tap("#themeToggle"); await sleep(180);
  s = await state();
  ok("線上 system 點鈕脫離成固定+選單同步", (s.pref === "light" || s.pref === "dark") && s.sel === s.pref, `pref=${s.pref} sel=${s.sel}`);
  ok("線上 0 console error", errors.length === 0, errors.slice(0,3).join(" | "));
} finally { await browser.close(); }
const pass = results.filter((r) => r.pass).length;
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  ["+r.extra+"]" : ""}`);
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
