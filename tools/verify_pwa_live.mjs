// 對線上正式站做真 Chrome 端到端 PWA 驗證
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const BASE = process.argv[2] || "https://english-tutor-ai.pages.dev/";
const results = [];
const ok = (n, c, extra = "") => results.push({ n, pass: !!c, extra });

const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  const errors = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));

  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 10000 });
  ok("線上首頁 mode-card 渲染", true);

  const manifestHref = await page.$eval('link[rel="manifest"]', (l) => l.href);
  const man = await page.evaluate(async (h) => { const r = await fetch(h); return { status: r.status, json: await r.json() }; }, manifestHref);
  ok("線上 manifest 200+解析+standalone", man.status === 200 && man.json.display === "standalone" && man.json.name === "AI 英語口說老師");
  const iconStatuses = await page.evaluate(async (icons, base) => {
    const out = []; for (const ic of icons) { const r = await fetch(new URL(ic.src, base)); out.push(r.status); } return out;
  }, man.json.icons, manifestHref);
  ok("線上 icons 全 200", iconStatuses.every((s) => s === 200), iconStatuses.join(","));

  const swState = await page.evaluate(async () => { const reg = await navigator.serviceWorker.ready; return reg.active ? reg.active.state : "none"; });
  ok("線上 SW activated", swState === "activated", swState);

  const banner = await page.evaluate(async () => new Promise((resolve) => {
    let prompted = false;
    const ev = new Event("beforeinstallprompt");
    ev.prompt = () => { prompted = true; };
    ev.userChoice = Promise.resolve({ outcome: "accepted" });
    window.dispatchEvent(ev);
    setTimeout(() => {
      const el = document.getElementById("pwaInstall");
      const shown = !!el && el.classList.contains("show");
      document.getElementById("pwaGo")?.click();
      setTimeout(() => resolve({ shown, prompted, removed: !document.getElementById("pwaInstall") }), 200);
    }, 150);
  }));
  ok("線上 安裝橫幅出現+可點安裝+移除", banner.shown && banner.prompted && banner.removed);

  await page.setOfflineMode(true);
  await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
  const offlineOk = await page.waitForSelector(".mode-card", { timeout: 10000 }).then(() => true).catch(() => false);
  ok("線上 離線 reload 仍可渲染", offlineOk);
  await page.setOfflineMode(false);

  ok("線上 0 console error", errors.length === 0, errors.slice(0, 5).join(" | "));

  const passed = results.filter((r) => r.pass).length;
  console.log(`\n==== 線上 PWA 驗證 ${BASE} ====`);
  for (const r of results) console.log(`${r.pass ? "PASS" : "FAIL"}  ${r.n}${r.extra ? "  [" + r.extra + "]" : ""}`);
  console.log(`\n總計 ${passed}/${results.length} PASS`);
  process.exitCode = passed === results.length ? 0 : 1;
} finally { await browser.close(); }
