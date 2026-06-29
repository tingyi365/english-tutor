// 第36輪驗證：exam 句 append-only 擴充 4→6（內容矩陣 exam 為跨模式最單薄動機；補2句中級口說考常用句給較親和 on-ramp）。
// 真 Chrome、375px 手機、真實模組+真實渲染。用法：node tools/verify_exam_sentence.mjs [URL]
import http from "http"; import fs from "fs"; import path from "path";
import puppeteer from "file:///C:/Users/TingYi/Desktop/AIWORK/_aiworkflow/webui-v2/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const ROOT = path.resolve("."); const ARG = process.argv[2];
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".webmanifest": "application/manifest+json" };

let server = null, BASE = ARG;
if (!ARG) {
  server = http.createServer((req, res) => {
    let f = decodeURIComponent(req.url.split("?")[0]); if (f === "/") f = "/index.html";
    const fp = path.join(ROOT, f);
    if (!fp.startsWith(ROOT) || !fs.existsSync(fp)) { res.writeHead(404); return res.end("nf"); }
    res.writeHead(200, { "Content-Type": MIME[path.extname(fp)] || "text/plain" }); res.end(fs.readFileSync(fp));
  });
  await new Promise((r) => server.listen(0, "127.0.0.1", r));
  BASE = `http://127.0.0.1:${server.address().port}`;
}

const results = []; const ok = (n, c) => results.push([c ? "PASS" : "FAIL", n]);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--no-sandbox"] });
const errs = [];
const NEW_ZH = "讓我先想一下再回答";
const NEW_EN = "Let me think about that for a moment before I answer.";
try {
  const page = await browser.newPage();
  page.on("console", (m) => { if (m.type() === "error") errs.push(m.text()); });
  page.on("pageerror", (e) => errs.push("PAGEERR " + e.message));
  await page.setViewport({ width: 375, height: 720, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await page.goto(BASE, { waitUntil: "networkidle0" });

  // 1) 資料層：SENTENCES 總數 30、exam=6、新增2句在末端且結構合法、既有索引0~27不變
  const data = await page.evaluate(async (base) => {
    const m = await import(base + "/assets/js/data.js");
    const s = m.SENTENCES;
    const counts = {}; s.forEach((x) => counts[x.topic] = (counts[x.topic] || 0) + 1);
    const valid = (x) => x.en && x.zh && x.ipa && x.topic && x.lv;
    const last2 = s.slice(-2);
    return {
      len: s.length, counts,
      allValid: s.every(valid),
      idx0en: s[0].en, idx27: s[27]?.en, idx27topic: s[27]?.topic,
      last2Exam: last2.every((x) => x.topic === "exam" && x.lv === "中級" && valid(x)),
      last2en: last2.map((x) => x.en),
      lvOfExam: s.filter((x) => x.topic === "exam").map((x) => x.lv),
    };
  }, BASE);
  ok("SENTENCES 總數 = 30（28+新增2）", data.len === 30);
  ok("exam 句補至 6（原4→6）", data.counts.exam === 6);
  ok("其他主題未動：daily10/travel6/work8", data.counts.daily === 10 && data.counts.travel === 6 && data.counts.work === 8);
  ok("四大主題皆有句", ["travel", "work", "exam", "daily"].every((k) => data.counts[k] > 0));
  ok("全部句結構合法（en/zh/ipa/topic/lv）", data.allValid);
  ok("既有索引未動：SENTENCES[0] 仍為原 daily 早安句", /Good morning/.test(data.idx0en));
  ok("既有末端索引未動：SENTENCES[27] 仍為原 exam 進階句", /author's main point/.test(data.idx27) && data.idx27topic === "exam");
  ok("新增2句皆 exam + 中級 + 結構合法", data.last2Exam);
  ok("exam 句現含中級（原全進階→補上 on-ramp）", data.lvOfExam.includes("中級") && data.lvOfExam.includes("進階"));
  console.log("  topic 分佈:", JSON.stringify(data.counts), " exam 等級:", JSON.stringify(data.lvOfExam), " 新句:", JSON.stringify(data.last2en));

  // 2) 真機渲染：聽寫模式走到最後一句（30/30）＝新 exam 句，輸入答案對答案後顯示其正解中文＝新句真的在線可練
  await page.evaluate(() => { localStorage.clear(); localStorage.setItem("onboarded", "1"); localStorage.setItem("learnMotive", "exam"); });
  await page.goto(BASE, { waitUntil: "networkidle0" });
  await page.waitForSelector(".mode-card", { timeout: 8000 });
  await page.evaluate(() => document.querySelector(`.tab[data-route="dictation"]`)?.click());
  await page.waitForSelector("#nextBtn", { timeout: 8000 });
  const total = await page.evaluate(() => parseInt(document.querySelector(".pill-lv").textContent.split("/")[1]));
  ok("聽寫總句數 = 30", total === 30);
  // 走到最後一句（idx 29 = 30/30）
  for (let k = 0; k < 29; k++) {
    await page.evaluate(() => document.querySelector("#nextBtn")?.click());
    await sleep(20);
  }
  const cur = await page.evaluate(() => document.querySelector(".pill-lv")?.textContent || "");
  ok("可走到第 30/30 句", /30\/30/.test(cur));
  // 輸入一個答案後對答案 → dictResult 顯示該句正解中文
  await page.evaluate((en) => { const i = document.querySelector("#answer"); i.value = en; }, NEW_EN);
  await page.evaluate(() => document.querySelector("#checkBtn")?.click());
  await sleep(150);
  const resZh = await page.evaluate(() => document.querySelector("#dictResult .translation")?.textContent || "");
  ok("第30句為新 exam 句（對答案後顯示其正解中文「讓我先想一下再回答」）", resZh.includes(NEW_ZH));

  // 3) 完成本回合 → 顯示總結卡（第29輪聽寫收尾未被破壞，回歸）
  const lastBtn = await page.evaluate(() => document.querySelector("#nextBtn")?.textContent || "");
  ok("最後一句按鈕為「完成本回合 →」", /完成本回合/.test(lastBtn));
  await page.evaluate(() => document.querySelector("#nextBtn")?.click());
  await sleep(150);
  const summaryShown = await page.evaluate(() => /聽寫|本回合|平均|再來一輪|回首頁/.test(document.querySelector(".view")?.innerText || ""));
  ok("完成本回合顯示總結卡（第29輪收尾回歸）", summaryShown);

  ok("0 console error", errs.length === 0);

  console.log("\n--- 結果 ---");
  results.forEach(([s, n]) => console.log(`  [${s}] ${n}`));
  const pass = results.filter((r) => r[0] === "PASS").length;
  console.log(`\n${pass}/${results.length} PASS, console errors: ${errs.length}`, errs.slice(0, 5));
  process.exitCode = pass === results.length && errs.length === 0 ? 0 : 1;
} finally { await browser.close(); if (server) server.close(); }
