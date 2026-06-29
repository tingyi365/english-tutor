// 線上正式站真機驗：音節+重音標記。指向 https://english-tutor-ai.pages.dev，注入假 STT 走真實渲染路徑。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://english-tutor-ai.pages.dev/";
const results = [];
const ok = (n, c, e = "") => results.push({ n, pass: !!c, e });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("onboarded", "1"); localStorage.setItem("shadowIdx", "0"); } catch (e) {}
    class FakeSR { constructor(){this.maxAlternatives=3;} start(){ setTimeout(()=>{ const t=window.__FAKE_TRANSCRIPT__||""; const results={0:{0:{transcript:t,confidence:0.9},isFinal:true,length:1},length:1}; if(this.onresult)this.onresult({resultIndex:0,results}); if(this.onend)this.onend(); },20);} stop(){if(this.onend)this.onend();} abort(){} }
    window.SpeechRecognition = FakeSR; window.webkitSpeechRecognition = FakeSR;
  });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 12000 });
  ok("線上首頁渲染", true);
  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#micBtn:not([disabled])", { timeout: 12000 });
  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));
  ok("含 morning 的句子", /morning/i.test(target), target);
  await page.evaluate((t) => { window.__FAKE_TRANSCRIPT__ = t.split(" ")[0]; }, target);
  await page.click("#micBtn");
  await page.waitForSelector(".drill-card", { timeout: 12000 });
  const m = await page.evaluate(() => {
    const it = [...document.querySelectorAll(".drill-card .drill-item")].find((i)=>(i.querySelector(".drill-w")?.textContent||"").trim().toLowerCase()==="morning");
    if(!it) return null;
    const syl=it.querySelector(".drill-syl");
    return { hasSyl:!!syl, chips:[...syl.querySelectorAll(".syl-chip")].map(c=>({t:c.textContent,s:c.classList.contains("syl-stress")})), tip:syl.querySelector(".syl-tip")?.textContent };
  });
  ok("morning 音節卡上線", m && m.hasSyl, JSON.stringify(m));
  ok("morning 音節 morn·ing + 重音 morn", m && m.chips.map(c=>c.t).join("·")==="morn·ing" && m.chips.filter(c=>c.s).length===1 && m.chips.find(c=>c.s).t==="morn", m&&JSON.stringify(m.chips));
  ok("指引文案正確", m && /重音在.*第一音節.*morn/.test(m.tip), m&&m.tip);
  ok("0 console error", errors.length === 0, errors.slice(0,3).join(" | "));
  const passed = results.filter(r=>r.pass).length;
  console.log("\n==== 線上正式站 音節+重音 真機驗證 ====");
  for (const r of results) console.log(`${r.pass?"PASS":"FAIL"}  ${r.n}${r.e?"  ["+r.e+"]":""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed===results.length?0:1;
} finally { await browser.close(); }
