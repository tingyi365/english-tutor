// 線上正式站真機端到端驗「深色／淺色主題切換」（第25輪）：english-tutor-ai.pages.dev、375px、0 console error。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] || "https://english-tutor-ai.pages.dev/";

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
  await page.goto(BASE, { waitUntil: "networkidle0" });

  const html = await page.content();
  ok("線上 index 含開畫前套主題 inline script（不閃）", /localStorage\.getItem\("theme"\)==="light"/.test(html), "");

  let st = await page.evaluate(() => ({
    theme: document.documentElement.dataset.theme || null,
    bodyBg: getComputedStyle(document.body).backgroundColor,
    btn: document.getElementById("themeToggle")?.textContent,
    modeCards: document.querySelectorAll(".mode-card").length,
  }));
  ok("線上 預設無 data-theme（深色）", st.theme === null, `theme=${st.theme}`);
  ok("線上 預設深底（亮度<0.3）", lum(rgb(st.bodyBg)) < 0.3, `${st.bodyBg}`);
  ok("線上 切換鈕顯示 🌙", st.btn === "🌙", `btn=${st.btn}`);
  ok("線上 首頁 mode-card 渲染", st.modeCards >= 5, `n=${st.modeCards}`);

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
  ok("線上 切淺色 → data-theme=light", st.theme === "light", `theme=${st.theme}`);
  ok("線上 切淺色 → localStorage=light", st.ls === "light", `ls=${st.ls}`);
  ok("線上 切淺色 → 鈕 ☀️", st.btn === "☀️", `btn=${st.btn}`);
  ok("線上 切淺色 → meta theme-color 淺", st.meta === "#f3f5fb", `meta=${st.meta}`);
  ok("線上 淺色亮底（亮度>0.85）", lum(rgb(st.bodyBg)) > 0.85, `${st.bodyBg}`);
  ok("線上 淺色深字（亮度<0.3）", lum(rgb(st.text)) < 0.3, `${st.text}`);

  const probes = await page.evaluate(() => {
    const view = document.querySelector(".view");
    const specs = [
      ["w-ok", "<span class='w w-ok'>x</span>"], ["w-bad", "<span class='w w-bad'>x</span>"],
      ["w-miss", "<span class='w w-miss'>x</span>"], ["opt.correct", "<button class='opt correct'>x</button>"],
      ["drill-near", "<span class='drill-st drill-near'>x</span>"], ["pace-ok", "<div class='pace-verdict pace-ok'>x</div>"],
      ["into-arrow", "<div class='into-fall'><span class='into-arrow'>x</span></div>"], ["phonetic", "<div class='phonetic'>x</div>"],
    ];
    const out = {}; const box = document.createElement("div"); view.appendChild(box);
    for (const [k, h] of specs) { box.innerHTML = h; const el = box.querySelector(".w-ok,.w-bad,.w-miss,.correct,.drill-near,.pace-ok,.into-arrow,.phonetic") || box.firstElementChild; out[k] = getComputedStyle(el).color; }
    box.remove(); return out;
  });
  for (const [k, c] of Object.entries(probes)) ok(`線上 淺色 ${k} 文字夠深（亮度<0.55）`, lum(rgb(c)) < 0.55, `${c}`);

  await page.reload({ waitUntil: "networkidle0" });
  st = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme || null, btn: document.getElementById("themeToggle")?.textContent }));
  ok("線上 重整持久化仍淺色", st.theme === "light", `theme=${st.theme}`);
  ok("線上 重整鈕仍 ☀️", st.btn === "☀️", `btn=${st.btn}`);

  for (const r of ["home", "shadowing", "dictation", "conversation", "flashcard", "grammar"]) {
    await page.click(`.tab[data-route="${r}"]`);
    await sleep(160);
    const m = await page.evaluate(() => { const v = document.querySelector(".view"); return { has: v.children.length > 0, color: getComputedStyle(v).color }; });
    ok(`線上 淺色 ${r} 渲染+內文深`, m.has && lum(rgb(m.color)) < 0.35, `${m.color}`);
  }

  await page.click('.tab[data-route="home"]');
  await sleep(120);
  await page.click("#themeToggle");
  await sleep(120);
  st = await page.evaluate(() => ({ theme: document.documentElement.dataset.theme || null, ls: localStorage.getItem("theme"), btn: document.getElementById("themeToggle")?.textContent }));
  ok("線上 切回深色 → 無 data-theme", st.theme === null, `theme=${st.theme}`);
  ok("線上 切回深色 → localStorage=dark", st.ls === "dark", `ls=${st.ls}`);
  ok("線上 切回深色 → 鈕 🌙", st.btn === "🌙", `btn=${st.btn}`);

  ok("線上 全程 0 console error", errors.length === 0, errors.slice(0, 3).join(" | "));
} finally { await browser.close(); }

const pass = results.filter((r) => r.pass).length;
for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  — " + r.extra : ""}`);
console.log(`\n${pass}/${results.length} PASS`);
process.exit(pass === results.length ? 0 : 1);
