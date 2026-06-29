// 本機真 Chrome 端到端驗「主題跟隨系統 prefers-color-scheme」（第27輪）：375px 手機、0 console error。
// 驗：預設仍深色(零回歸) / 設定可選 跟隨系統｜淺色｜深色 / system 依 OS 即時切換(matchMedia change) /
//     固定淺·深不受 OS 影響 / reload 開畫即正確配色(防閃 inline script 認得 system) / topbar 鈕脫離 system 變固定 / 跨次持久化。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8826;
const TYPES = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml" };
const server = createServer(async (req, res) => {
  try { let p = decodeURIComponent(req.url.split("?")[0]); if (p === "/") p = "/index.html";
    const fp = normalize(join(ROOT, p)); if (!fp.startsWith(ROOT)) return res.writeHead(403).end();
    const s = await stat(fp).catch(() => null); if (!s || !s.isFile()) return res.writeHead(404).end("nf");
    res.writeHead(200, { "Content-Type": TYPES[extname(fp)] || "application/octet-stream" }); res.end(await readFile(fp));
  } catch { res.writeHead(500).end(); }
});
await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const BASE = `http://127.0.0.1:${PORT}/`;

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
    theme: document.documentElement.dataset.theme || null,
    pref: localStorage.getItem("theme"),
    btn: document.getElementById("themeToggle")?.textContent,
    sel: document.getElementById("themeSelect")?.value,
    bodyBg: getComputedStyle(document.body).backgroundColor,
  }));
  const tap = (sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); }, sel);
  const openSettings = async () => { await tap("#settingsBtn"); await sleep(120); };
  const pickTheme = async (v) => { await openSettings(); await page.select("#themeSelect", v); await sleep(180);
    await tap("#settingsClose"); await sleep(80); };

  // 0) 起始 OS = 深色
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await page.goto(BASE, { waitUntil: "networkidle0" });

  // 1) 防閃 inline script 認得 system + light
  const html = await (await fetch(BASE)).text();
  ok("防閃 inline script 含 prefers-color-scheme + 讀 theme", /prefers-color-scheme/.test(html) && /localStorage\.getItem\("theme"\)/.test(html));
  ok("inline script 在 stylesheet 前（不閃）", html.indexOf('dataset.theme="light"') < html.indexOf('rel="stylesheet"'));

  // 2) 設定面板含三態主題選單
  await openSettings();
  const opts = await page.$$eval("#themeSelect option", (os) => os.map((o) => o.value));
  ok("themeSelect 含 system/light/dark 三態", JSON.stringify(opts) === JSON.stringify(["system", "light", "dark"]), opts.join(","));
  await tap("#settingsClose"); await sleep(80);

  // 3) 預設零回歸：fresh 無偏好 → 深色
  let s = await state();
  ok("預設無 data-theme（深色，零回歸）", s.theme === null, `theme=${s.theme}`);
  ok("預設 pref 為空（未寫入）", s.pref === null, `pref=${s.pref}`);
  ok("預設 body 深底（亮度<0.3）", lum(rgb(s.bodyBg)) < 0.3, `${s.bodyBg} lum=${lum(rgb(s.bodyBg)).toFixed(2)}`);
  ok("預設選單值=dark", s.sel === "dark", `sel=${s.sel}`);

  // 4) 選「跟隨系統」+ OS 深 → 深色、鈕 🌗、pref=system
  await pickTheme("system");
  s = await state();
  ok("選 system 後 pref=system", s.pref === "system", `pref=${s.pref}`);
  ok("system + OS深 → 深色(data-theme null)", s.theme === null, `theme=${s.theme}`);
  ok("system 鈕顯示 🌗", s.btn === "🌗", `btn=${s.btn}`);

  // 5) OS 切淺色（pref 仍 system）→ 即時變淺（matchMedia change 監聽）
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await sleep(200);
  s = await state();
  ok("system + OS淺 → 即時變淺色(data-theme=light)", s.theme === "light", `theme=${s.theme}`);
  ok("OS淺 body 亮底（亮度>0.7）", lum(rgb(s.bodyBg)) > 0.7, `${s.bodyBg} lum=${lum(rgb(s.bodyBg)).toFixed(2)}`);
  ok("pref 仍 system（OS 變動不改偏好）", s.pref === "system", `pref=${s.pref}`);

  // 6) OS 切回深 → 即時變深
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await sleep(200);
  s = await state();
  ok("system + OS深(切回) → 即時變深(data-theme null)", s.theme === null, `theme=${s.theme}`);

  // 7) reload（pref=system、OS=淺）→ 開畫即淺色（防閃 inline script 認得 system）
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await page.goto(BASE, { waitUntil: "domcontentloaded" });
  const firstPaint = await page.evaluate(() => document.documentElement.dataset.theme || null);
  ok("reload(system+OS淺) 開畫即 data-theme=light（防閃）", firstPaint === "light", `firstPaint=${firstPaint}`);
  await page.waitForSelector(".mode-card"); await sleep(120);
  s = await state();
  ok("reload 後 system 持久化（pref=system）", s.pref === "system", `pref=${s.pref}`);

  // 8) 固定淺色：不受 OS 影響（OS 切深仍淺）
  await pickTheme("light");
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]);
  await sleep(200);
  s = await state();
  ok("固定淺色 + OS深 → 仍淺(data-theme=light)", s.theme === "light", `theme=${s.theme}`);
  ok("固定淺色 鈕 ☀️", s.btn === "☀️", `btn=${s.btn}`);
  ok("固定淺色 pref=light", s.pref === "light", `pref=${s.pref}`);

  // 9) 固定深色：不受 OS 影響（OS 切淺仍深）
  await pickTheme("dark");
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await sleep(200);
  s = await state();
  ok("固定深色 + OS淺 → 仍深(data-theme null)", s.theme === null, `theme=${s.theme}`);
  ok("固定深色 鈕 🌙", s.btn === "🌙", `btn=${s.btn}`);

  // 10) topbar 鈕脫離 system：先設 system，再點鈕 → 變固定（light/dark）非 system
  await pickTheme("system");
  await page.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "dark" }]); // system → 深
  await sleep(150);
  await tap("#themeToggle"); await sleep(150); // 點鈕 → 由深切淺(固定)
  s = await state();
  ok("system 點 topbar 鈕 → 脫離 system 成固定", s.pref === "light" || s.pref === "dark", `pref=${s.pref}`);
  ok("脫離後選單同步（非 system）", s.sel === s.pref, `sel=${s.sel} pref=${s.pref}`);

  // 11) 全程 0 console error
  ok("0 console error", errors.length === 0, errors.slice(0, 3).join(" | "));
} finally {
  await browser.close();
  server.close();
}

const pass = results.filter((r) => r.pass).length;
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
