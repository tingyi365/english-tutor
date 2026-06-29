// 本機真 Chrome 端到端驗「句尾語調（升降調 intonation）」功能（走真實 DOM 渲染，非只看檔案在）。
// 點「🎶 句尾語調」→ 驗語調卡出現、子句切分正確、升/降旋律線(SVG)+箭頭+理由正確、可聽示範、可收合、切句不殘留。0 console error / 375px 手機。
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
// 用元素自身 click() 觸發，避開 375px sticky 底部導覽列蓋住座標、puppeteer 座標點擊被攔截的問題
const tap = (page, sel) => page.evaluate((s) => { const e = document.querySelector(s); if (e) e.click(); }, sel);

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.evaluateOnNewDocument(() => {
    // idx 15 = "I don't understand. Can you repeat that?" → 直述句(↘) + Yes/No 問句(↗)，一句涵蓋升+降兩種旋律
    try { localStorage.setItem("onboarded", "1"); localStorage.setItem("shadowIdx", "15"); } catch (e) {}
    try {
      window.speechSynthesis.speak = function (u) {
        setTimeout(() => { if (u.onboundary) u.onboundary({ charIndex: 0, name: "word" }); }, 5);
        setTimeout(() => { if (u.onend) u.onend(); }, 15);
      };
    } catch (e) {}
  });

  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  ok("首頁 mode-card 渲染（無致命錯誤）", true);

  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#sentence", { timeout: 8000 });
  await page.waitForSelector("#intonBtn", { timeout: 8000 });
  ok("跟讀頁有『🎶 句尾語調』按鈕", true);

  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));
  ok("測試句為含升+降的多子句句", /understand/i.test(target) && /repeat/i.test(target), target);

  // 預設收合
  const before = await page.$eval("#inton", (e) => e.innerHTML.trim());
  ok("語調面板預設收合（不增干擾）", before === "");

  // 點開
  await tap(page, "#intonBtn");
  await page.waitForSelector(".inton-card", { timeout: 8000 });
  ok("點按後出現語調卡", true);

  const panel = await page.evaluate(() => {
    const card = document.querySelector(".inton-card");
    const clauses = [...card.querySelectorAll(".into-clause")].map((c) => ({
      rise: c.classList.contains("into-rise"),
      fall: c.classList.contains("into-fall"),
      text: (c.querySelector(".into-text")?.textContent || "").trim(),
      arrow: (c.querySelector(".into-arrow")?.textContent || "").trim(),
      reason: (c.querySelector(".into-reason")?.textContent || "").trim(),
      // 旋律線 SVG：path 有 d、polygon 有 points（畫得出曲線+箭頭）
      hasPath: !!(c.querySelector(".into-curve .into-line")?.getAttribute("d")),
      hasHead: !!(c.querySelector(".into-curve .into-pt")?.getAttribute("points")),
      lineStroke: getComputedStyle(c.querySelector(".into-line")).stroke,
    }));
    return {
      tip: card.querySelector(".inton-tip")?.textContent || "",
      foot: card.querySelector(".inton-foot")?.textContent || "",
      hasPlay: !!card.querySelector("#intonPlay"),
      clauses,
    };
  });

  ok("切出 2 個子句", panel.clauses.length === 2, `n=${panel.clauses.length}`);
  const c0 = panel.clauses[0] || {}, c1 = panel.clauses[1] || {};
  ok("第1子句=直述句→下降 ↘", c0.fall === true && c0.arrow === "↘", `${c0.text} ${c0.arrow}`);
  ok("第2子句=Yes/No 問句→上揚 ↗", c1.rise === true && c1.arrow === "↗", `${c1.text} ${c1.arrow}`);
  ok("每子句都畫得出旋律線(path)+箭頭(polygon)",
    panel.clauses.every((c) => c.hasPath && c.hasHead),
    panel.clauses.map((c) => `${c.hasPath}/${c.hasHead}`).join(","));
  ok("升/降旋律線顏色不同（綠↗ vs 藍↘，看得出區別）",
    c0.lineStroke && c1.lineStroke && c0.lineStroke !== c1.lineStroke,
    `fall=${c0.lineStroke} rise=${c1.lineStroke}`);
  ok("每子句都有『為何升/降』的白話理由",
    panel.clauses.every((c) => c.reason.length > 8),
    panel.clauses.map((c) => c.reason.slice(0, 16)).join(" | "));
  ok("語調卡含『高低起伏』教學文案", /高低起伏/.test(panel.tip), panel.tip.slice(0, 30));
  ok("底部含『句尾的高低』模仿引導", /句尾/.test(panel.foot), panel.foot.slice(0, 30));
  ok("有『🔊 聽語調示範』鈕", panel.hasPlay);

  // 點聽示範不丟錯
  await tap(page, "#intonPlay");
  await new Promise((r) => setTimeout(r, 120));
  ok("點『聽語調示範』（無錯誤）", true);

  // 再點收合
  await tap(page, "#intonBtn");
  await new Promise((r) => setTimeout(r, 60));
  const after = await page.$eval("#inton", (e) => e.innerHTML.trim());
  ok("再點可收合語調面板", after === "");

  // 切下一句後語調面板重置（draw 重建）— 下一句 idx16 "Let's meet..." 為直述句
  await tap(page, "#nextBtn");
  await page.waitForSelector("#intonBtn", { timeout: 8000 });
  await new Promise((r) => setTimeout(r, 60));
  const afterNext = await page.$eval("#inton", (e) => e.innerHTML.trim());
  ok("切句後語調面板乾淨（不殘留）", afterNext === "");

  // 切句後重開，驗證純直述句也正確（全下降）
  await tap(page, "#intonBtn");
  await page.waitForSelector(".inton-card", { timeout: 8000 });
  const next = await page.evaluate(() => {
    const cs = [...document.querySelectorAll(".into-clause")];
    return { n: cs.length, allFall: cs.length > 0 && cs.every((c) => c.classList.contains("into-fall")) };
  });
  ok("下一句(直述句)語調全下降 ↘", next.allFall, `n=${next.n}`);

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 句尾語調（升降調）真機驗證 ====");
  console.log("句子:", target);
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  server.close();
}
