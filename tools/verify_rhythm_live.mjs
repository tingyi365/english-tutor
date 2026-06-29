// 線上正式站 https://english-tutor-ai.pages.dev 真機端到端驗「句子節奏/句重音」。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://english-tutor-ai.pages.dev/";
const results = [];
const ok = (n, c, extra = "") => results.push({ n, pass: !!c, extra });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("onboarded", "1"); localStorage.setItem("shadowIdx", "0"); } catch (e) {}
    try { window.speechSynthesis.speak = function (u) { setTimeout(() => { if (u.onboundary) u.onboundary({ charIndex: 0, name: "word" }); }, 5); setTimeout(() => { if (u.onend) u.onend(); }, 15); }; } catch (e) {}
  });
  await page.goto(BASE, { waitUntil: "networkidle0", timeout: 30000 });
  await page.waitForSelector(".mode-card", { timeout: 12000 });
  ok("線上首頁渲染", true);
  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#rhythmBtn", { timeout: 12000 });
  ok("線上跟讀頁有節奏鈕", true);
  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));
  await page.click("#rhythmBtn");
  await page.waitForSelector(".rhythm-card", { timeout: 12000 });
  const panel = await page.evaluate(() => {
    const card = document.querySelector(".rhythm-card");
    return {
      beats: [...card.querySelectorAll(".beat")].map((b) => ({ word: (b.querySelector(".beat-w")?.textContent || "").trim(), strong: b.classList.contains("beat-strong") })),
      tip: card.querySelector(".rhythm-tip")?.textContent || "",
      hasPlay: !!card.querySelector("#rhythmPlay"),
    };
  });
  ok("線上節奏卡渲染逐字標記", panel.beats.length === target.split(" ").length, panel.beats.map((b) => (b.strong ? b.word.toUpperCase() : b.word)).join(" "));
  ok("線上同時有實詞重/虛詞弱", panel.beats.some((b) => b.strong) && panel.beats.some((b) => !b.strong));
  ok("線上含教學文案", /重音節拍/.test(panel.tip));
  await page.click("#rhythmPlay");
  await new Promise((r) => setTimeout(r, 120));
  ok("線上播放節奏無錯", true);
  await page.click("#rhythmBtn");
  await new Promise((r) => setTimeout(r, 60));
  ok("線上可收合", (await page.$eval("#rhythm", (e) => e.innerHTML.trim())) === "");
  ok("0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));
  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 線上句子節奏 真機驗證 ====\n句子:", target);
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally { await browser.close(); }
