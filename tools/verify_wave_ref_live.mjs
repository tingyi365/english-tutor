// 線上正式站真機驗第16輪「波形疊示範參考線 + 停頓標記」：直接打 english-tutor-ai.pages.dev
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = "https://english-tutor-ai.pages.dev/";
const results = [];
const ok = (n, c, e = "") => results.push({ n, pass: !!c, e });
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new",
  args: ["--no-sandbox", "--use-fake-device-for-media-stream", "--use-fake-ui-for-media-stream", "--autoplay-policy=no-user-gesture-required"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
  await page.evaluateOnNewDocument(() => {
    try { localStorage.setItem("onboarded", "1"); } catch (e) {}
    class FakeSR { constructor(){this.lang="";this.interimResults=true;this.maxAlternatives=3;}
      start(){this._t=setTimeout(()=>{const transcript=window.__T__||"";const results={0:{0:{transcript,confidence:0.9},isFinal:true,length:1},length:1};if(this.onresult)this.onresult({resultIndex:0,results});if(this.onend)this.onend();},600);}
      stop(){clearTimeout(this._t);if(this.onend)this.onend();} abort(){clearTimeout(this._t);} }
    window.SpeechRecognition=FakeSR; window.webkitSpeechRecognition=FakeSR;
    const t={getVoices:()=>[{name:"F",lang:"en-US",voiceURI:"f",default:true,localService:true}],speak:(u)=>{setTimeout(()=>{try{u.onend&&u.onend();}catch(e){}},480);},cancel:()=>{},onvoiceschanged:null};
    Object.defineProperty(window,"speechSynthesis",{value:t,configurable:true});
    window.SpeechSynthesisUtterance=function(x){this.text=x;this.onend=null;this.onerror=null;this.onboundary=null;};
  });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 12000 });
  ok("線上首頁渲染", true);
  await page.click('.tab[data-route="shadowing"]');
  await page.waitForSelector("#micBtn:not([disabled])", { timeout: 10000 });
  const target = await page.$eval("#sentence", (e) => e.textContent.trim().replace(/\s+/g, " "));
  await page.evaluate((t) => { window.__T__ = t; }, target.split(" ")[0]);
  await page.click("#micBtn");
  await page.waitForSelector("#result .ring", { timeout: 10000 });
  await page.waitForSelector(".wave-cv", { timeout: 5000 }).catch(() => {});
  const px = await page.evaluate(() => {
    const cv = document.querySelector(".wave-cv"); if (!cv) return { has: false };
    const d = cv.getContext("2d").getImageData(0,0,cv.width,cv.height).data;
    let cyan=0, amber=0;
    for (let i=0;i<d.length;i+=4){const r=d[i],g=d[i+1],b=d[i+2],a=d[i+3];
      if(a>0&&b>180&&g>140&&r<120)cyan++; if(a>0&&r>200&&g>120&&g<200&&b<100)amber++;}
    return { has:true, cyan, amber };
  });
  ok("線上畫出青色我的聲音波柱", px.has && px.cyan > 20, "cyan=" + (px.cyan||0));
  ok("線上畫出琥珀示範重音參考線", px.has && px.amber > 20, "amber=" + (px.amber||0));
  const leg = await page.evaluate(() => { const w=document.querySelector(".wave-legend"); return w?{m:!!w.querySelector(".wl-mine"),r:!!w.querySelector(".wl-ref"),p:!!w.querySelector(".wl-pause")}:null; });
  ok("線上圖例三項齊", leg && leg.m && leg.r && leg.p, JSON.stringify(leg));
  const tip = await page.evaluate(() => { const t=document.querySelector(".wave-tip"); return t?t.textContent.trim():""; });
  ok("線上 wave-tip 教學文案", /停頓了 \d+ 次|很連貫/.test(tip) && /琥珀線/.test(tip), tip.slice(0,40));
  ok("線上既有 drill 卡無回歸", await page.evaluate(() => !!document.querySelector(".drill-card")));
  ok("0 console error", errors.length === 0, errors.slice(0,4).join(" | "));
  const passed = results.filter((r) => r.pass).length;
  console.log("\n==== 線上波形參考線+停頓 驗證 ====");
  for (const r of results) console.log(`${r.pass?"PASS":"FAIL"}  ${r.n}${r.e?"  ["+r.e+"]":""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally { await browser.close(); }
