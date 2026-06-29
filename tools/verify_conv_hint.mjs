// 第34輪：本機/線上真 Chrome 端到端驗「情境對話補首屏操作指示 read-hint」(純加一行、零 CSS)。
// 真機稽核(diag_audit_r34)發現：五模式唯一首屏無「怎麼操作」引導者＝conversation；本輪補上完成第32輪「五模式皆有首屏指示」。
// 驗：①對話首屏出現 .read-hint 且文案正確 ②read-hint 在 chat 之前（DOM 順序＝落地即看見）③對話仍正常運作(chips/AI氣泡/控制/完成態)
//     ④零回歸(shadowing、grammar 既有 read-hint 仍在；對話分支/完成態未壞) ⑤0 console error ⑥375px 手機 0 橫向溢出。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ROOT = process.cwd();
const PORT = 8843;
const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".webmanifest": "application/manifest+json; charset=utf-8",
  ".png": "image/png", ".svg": "image/svg+xml",
};
const LIVE = process.argv[2];
const server = LIVE ? null : createServer(async (req, res) => {
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
if (server) await new Promise((r) => server.listen(PORT, "127.0.0.1", r));
const BASE = LIVE || `http://127.0.0.1:${PORT}/`;

const results = [];
const ok = (n, c, extra = "") => results.push({ n, pass: !!c, extra });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  await page.goto(BASE, { waitUntil: "networkidle0" });

  // ===== ① 進對話模式，首屏出現 read-hint 且文案正確 =====
  await page.evaluate(async () => {
    localStorage.clear(); localStorage.setItem("onboarded", "1");
    const app = await import("/assets/js/app.js");
    app.navigate("conversation");
  });
  await page.waitForSelector(".conv-chip", { timeout: 6000 });
  await sleep(300);
  const hint = await page.evaluate(() => {
    const h = document.querySelector(".view .read-hint");
    return {
      exists: !!h,
      text: h ? h.innerText : "",
      hasBold: h ? !!h.querySelector("b") : false,
    };
  });
  ok("對話首屏出現 .read-hint 操作指示", hint.exists, hint.text.slice(0, 60));
  ok("read-hint 文案含『老師會先說一句』『換我說』『略過』『敢開口』",
     /老師會先說一句/.test(hint.text) && /換我說/.test(hint.text) && /略過/.test(hint.text) && /敢開口/.test(hint.text),
     hint.text.slice(0, 90));
  ok("read-hint 內有強調 <b>（建議句）", hint.hasBold);

  // ===== ② DOM 順序：read-hint 在 #chat 之前（落地即看見，先讀指示再對話）=====
  const order = await page.evaluate(() => {
    const h = document.querySelector(".view .read-hint");
    const chat = document.querySelector(".view #chat");
    if (!h || !chat) return -1;
    // compareDocumentPosition: 4 = h 在 chat 之前
    return (h.compareDocumentPosition(chat) & Node.DOCUMENT_POSITION_FOLLOWING) ? 1 : 0;
  });
  ok("read-hint 排在對話 #chat 之前（先看指示再對話）", order === 1, `cmp=${order}`);

  // ===== ③ 對話仍正常：chips 在、AI 氣泡出、控制出、可走到完成態 =====
  const chips = await page.evaluate(() => document.querySelectorAll(".conv-chip").length);
  ok("主題 chips 仍正常渲染（零回歸）", chips >= 2, `chips=${chips}`);
  await sleep(400);
  const firstBubble = await page.evaluate(() => document.querySelectorAll("#chat .bubble").length);
  ok("AI 開場氣泡正常出現", firstBubble >= 1, `bubbles=${firstBubble}`);

  let done = false;
  for (let i = 0; i < 16; i++) {
    await sleep(300);
    const st = await page.evaluate(() => ({
      fin: /對話完成/.test(document.querySelector("#convCtl")?.innerText || ""),
      hasChoice: document.querySelectorAll("#convCtl .conv-choice").length > 0,
      hasSkip: !!document.querySelector("#convCtl #skipBtn"),
    }));
    if (st.fin) { done = true; break; }
    if (st.hasChoice) { await page.evaluate(() => document.querySelector("#convCtl .conv-choice")?.click()); await sleep(200); continue; }
    if (st.hasSkip) { await page.evaluate(() => document.querySelector("#convCtl #skipBtn")?.click()); continue; }
  }
  ok("對話可一路走到「🎉 對話完成」完成態（功能零回歸）", done);

  // ===== ③.5 防呆：對話中點「略過」(排程下一句)後立刻切走 → 不應拋 console error =====
  await page.evaluate(async () => { const app = await import("/assets/js/app.js"); app.navigate("conversation"); });
  await page.waitForSelector("#convCtl #skipBtn", { timeout: 5000 }).catch(() => {});
  const errBefore = errors.length;
  await page.evaluate(() => document.querySelector("#convCtl #skipBtn")?.click()); // advance → setTimeout(nextTurn ~900ms)
  await page.evaluate(async () => { const app = await import("/assets/js/app.js"); app.navigate("home"); }); // 立刻切走
  await sleep(1300); // 等排程的 nextTurn 觸發（已被 guard 擋）
  ok("對話中點略過後立刻切走 → guard 擋住、不拋 console error", errors.length === errBefore, `新增錯誤=${errors.length - errBefore}`);

  // ===== ④ 零回歸：shadowing / grammar 既有 read-hint 仍在 =====
  await page.evaluate(async () => { const app = await import("/assets/js/app.js"); app.navigate("shadowing"); });
  await sleep(500);
  const shHint = await page.evaluate(() => /聽示範/.test(document.querySelector(".view .read-hint")?.innerText || ""));
  ok("跟讀 shadowing 既有 read-hint 仍在（零回歸）", shHint);

  await page.evaluate(async () => { const app = await import("/assets/js/app.js"); app.navigate("grammar"); });
  await sleep(500);
  const grHint = await page.evaluate(() => /挑出空格/.test(document.querySelector(".view .read-hint")?.innerText || ""));
  ok("文法 grammar 既有 read-hint 仍在（零回歸）", grHint);

  // ===== ⑤ 375px 對話模式 0 橫向溢出 =====
  await page.evaluate(async () => { const app = await import("/assets/js/app.js"); app.navigate("conversation"); });
  await sleep(500);
  const overflowX = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  ok("375px 手機 對話模式 0 橫向溢出", overflowX <= 1, `overflowX=${overflowX}px`);

  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n==== 對話首屏操作指示 真機驗證 (${LIVE ? "線上 " + LIVE : "本機"}) ====`);
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally {
  await browser.close();
  if (server) server.close();
}
