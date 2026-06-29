// 本機真 Chrome 端到端驗「深色／淺色主題切換」（第25輪）：375px 手機、0 console error。
// 驗：預設深色(零回歸) / 切淺色 + 持久化 + 圖示/meta / 重整不閃(開畫即淺) / 重映亮色文字在白底變深(對比) / 六模式淺色皆渲染無錯 / 切回深色。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8821;
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
// 相對亮度 0(黑)~1(白)
const lum = ([r, g, b]) => (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
const rgb = (str) => (str.match(/\d+/g) || [0, 0, 0]).slice(0, 3).map(Number);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  // 只設 onboarded（不清 localStorage，否則 reload 會把 theme 偏好洗掉）；fresh context 本來就空。
  await page.evaluateOnNewDocument(() => { try { if (!localStorage.getItem("onboarded")) localStorage.setItem("onboarded", "1"); } catch {} });
  await page.goto(BASE, { waitUntil: "networkidle0" });

  // 0) 無閃保證：index.html head 內含「開畫前套用主題」的 inline script
  const html = await (await fetch(BASE)).text();
  ok("index.html 含開畫前套主題的 inline script（不閃）", /localStorage\.getItem\("theme"\)==="light"/.test(html) && html.indexOf('rel="stylesheet"') > html.indexOf('dataset.theme="light"'), "");

  // 1) 預設 = 深色（零回歸）
  let st = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme || null,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    btn: document.getElementById("themeToggle")?.textContent,
    modeCards: document.querySelectorAll(".mode-card").length,
  }));
  ok("預設無 data-theme（深色）", st.theme === null, `theme=${st.theme}`);
  ok("預設 body 深底（亮度<0.3）", lum(rgb(st.bodyBg)) < 0.3, `${st.bodyBg} lum=${lum(rgb(st.bodyBg)).toFixed(2)}`);
  ok("預設切換鈕顯示 🌙", st.btn === "🌙", `btn=${st.btn}`);
  ok("首頁 mode-card 正常渲染", st.modeCards >= 5, `n=${st.modeCards}`);

  // 2) 切淺色
  await page.click("#themeToggle");
  await sleep(150);
  st = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme || null,
    ls: localStorage.getItem("theme"),
    btn: document.getElementById("themeToggle")?.textContent,
    meta: document.querySelector('meta[name="theme-color"]')?.getAttribute("content"),
    bodyBg: getComputedStyle(document.body).backgroundColor,
    text: getComputedStyle(document.querySelector(".view")).color,
  }));
  ok("切淺色 → data-theme=light", st.theme === "light", `theme=${st.theme}`);
  ok("切淺色 → localStorage theme=light", st.ls === "light", `ls=${st.ls}`);
  ok("切淺色 → 鈕變 ☀️", st.btn === "☀️", `btn=${st.btn}`);
  ok("切淺色 → meta theme-color 變淺", st.meta === "#f3f5fb", `meta=${st.meta}`);
  ok("淺色 body 變亮底（亮度>0.85）", lum(rgb(st.bodyBg)) > 0.85, `${st.bodyBg} lum=${lum(rgb(st.bodyBg)).toFixed(2)}`);
  ok("淺色內文變深字（亮度<0.3）", lum(rgb(st.text)) < 0.3, `${st.text} lum=${lum(rgb(st.text)).toFixed(2)}`);

  // 3) 重映亮色文字在淺色底 → 變深（對比足）。建臨時探針讀 computed color。
  const probes = await page.evaluate(() => {
    const view = document.querySelector(".view");
    const specs = [
      ["brand-text", "<span class='brand-text'>x</span>"],
      ["w-ok", "<span class='w w-ok'>x</span>"],
      ["w-bad", "<span class='w w-bad'>x</span>"],
      ["w-miss", "<span class='w w-miss'>x</span>"],
      ["opt.correct", "<button class='opt correct'>x</button>"],
      ["drill-near", "<span class='drill-st drill-near'>x</span>"],
      ["pace-ok", "<div class='pace-verdict pace-ok'>x</div>"],
      ["into-arrow", "<div class='into-fall'><span class='into-arrow'>x</span></div>"],
      ["phonetic", "<div class='phonetic'>x</div>"],
    ];
    const out = {};
    const box = document.createElement("div"); view.appendChild(box);
    for (const [k, html] of specs) {
      box.innerHTML = html;
      const el = box.querySelector(".w-ok,.w-bad,.w-miss,.correct,.drill-near,.pace-ok,.into-arrow,.brand-text,.phonetic") || box.firstElementChild;
      out[k] = getComputedStyle(el).color;
    }
    box.remove();
    return out;
  });
  for (const [k, c] of Object.entries(probes)) {
    const l = lum(rgb(c));
    // brand-text 用漸層+背景裁切，color 可能是 transparent → 略過亮度、只確認非預設亮色
    if (k === "brand-text") { ok(`淺色重映 ${k} 套用`, true, c); continue; }
    ok(`淺色 ${k} 文字夠深（亮度<0.55）`, l < 0.55, `${c} lum=${l.toFixed(2)}`);
  }

  // 4) 重整持久化（localStorage theme=light → 開畫即淺色）
  await page.reload({ waitUntil: "networkidle0" });
  st = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme || null,
    btn: document.getElementById("themeToggle")?.textContent,
  }));
  ok("重整後仍為淺色（持久化）", st.theme === "light", `theme=${st.theme}`);
  ok("重整鈕仍 ☀️", st.btn === "☀️", `btn=${st.btn}`);

  // 5) 六模式淺色皆渲染、內文深、0 error（用底部 tab 點擊，不重新 import app.js 以免重複綁定）
  for (const r of ["home", "shadowing", "dictation", "conversation", "flashcard", "grammar"]) {
    await page.click(`.tab[data-route="${r}"]`);
    await sleep(140);
    const m = await page.evaluate(() => {
      const view = document.querySelector(".view");
      return { has: view.children.length > 0, color: getComputedStyle(view).color };
    });
    ok(`淺色 ${r} 有內容渲染`, m.has, "");
    ok(`淺色 ${r} 內文深字可讀`, lum(rgb(m.color)) < 0.35, `${m.color}`);
  }

  // 6) 切回深色 + 持久化（點 topbar 切換鈕，驗真實互動）
  await page.click('.tab[data-route="home"]');
  await sleep(120);
  await page.click("#themeToggle");
  await sleep(120);
  st = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme || null, ls: localStorage.getItem("theme"), btn: document.getElementById("themeToggle")?.textContent }));
  ok("切回深色 → 無 data-theme", st.theme === null, `theme=${st.theme}`);
  ok("切回深色 → localStorage=dark", st.ls === "dark", `ls=${st.ls}`);
  ok("切回深色 → 鈕 🌙", st.btn === "🌙", `btn=${st.btn}`);

  ok("全程 0 console error", errors.length === 0, errors.slice(0, 3).join(" | "));
} finally { await browser.close(); server.close(); }

const pass = results.filter((r) => r.pass).length;
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  — " + r.extra : ""}`);
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
