// 診斷：sticky 底部導覽列是否遮住長頁 .view 內容（375px 手機，線上站）。
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] || "https://english-tutor-ai.pages.dev/";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); });

  const probe = async (label, navTo) => {
    await page.evaluate(async (n) => {
      const app = await import("/assets/js/app.js?diag=1");
      app.navigate(n);
      window.scrollTo(0, document.body.scrollHeight);
    }, navTo);
    await sleep(400);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await sleep(200);
    const m = await page.evaluate(() => {
      const tabbar = document.querySelector(".tabbar");
      const view = document.querySelector(".view");
      const tb = tabbar.getBoundingClientRect();
      // last interactive / content element inside view
      const kids = [...view.querySelectorAll("button,.btn,.card,.mode-card,.tab,input,select,a,p,li,b")]
        .filter(e => e.offsetParent !== null);
      const last = kids[kids.length - 1];
      const lr = last ? last.getBoundingClientRect() : null;
      const vr = view.getBoundingClientRect();
      // how much of view's bottom content sits behind tabbar
      const overlapPx = lr ? Math.max(0, lr.bottom - tb.top) : null;
      return {
        scrollH: document.body.scrollHeight, innerH: window.innerHeight,
        scrollable: document.body.scrollHeight > window.innerHeight + 2,
        tabTop: Math.round(tb.top), tabH: Math.round(tb.height),
        viewBottom: Math.round(vr.bottom),
        lastTag: last ? (last.className || last.tagName) : null,
        lastBottom: lr ? Math.round(lr.bottom) : null,
        overlapPx: overlapPx == null ? null : Math.round(overlapPx),
        viewPadBottom: getComputedStyle(view).paddingBottom,
      };
    });
    console.log(`[${label}] scrollable=${m.scrollable} tabTop=${m.tabTop} tabH=${m.tabH} viewBottom=${m.viewBottom} lastTag=${m.lastTag} lastBottom=${m.lastBottom} overlapBehindBar=${m.overlapPx}px padBottom=${m.viewPadBottom}`);
    return m;
  };

  for (const [label, nav] of [["home","home"],["shadowing","shadowing"],["grammar","grammar"],["dictation","dictation"],["flashcard","flashcard"],["conversation","conversation"]]) {
    try { await probe(label, nav); } catch (e) { console.log(`[${label}] ERR ${e.message}`); }
  }
} finally { await browser.close(); }
