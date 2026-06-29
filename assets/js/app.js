// ============ 主程式：路由 / 設定 / 狀態 ============
import { speechSupport, getEnglishVoices, setVoice, setRate, getRate } from "./speech.js";
import { renderHome, renderShadowing, renderDictation, renderConversation, renderFlashcard, renderGrammar, renderReview } from "./modes.js";

const view = document.getElementById("view");
const tabbar = document.getElementById("tabbar");

const ROUTES = {
  home: renderHome,
  shadowing: renderShadowing,
  dictation: renderDictation,
  conversation: renderConversation,
  flashcard: renderFlashcard,
  grammar: renderGrammar,
  review: renderReview,
};

let current = "";

export function navigate(route) {
  if (!ROUTES[route]) route = "home";
  current = route;
  location.hash = route;
  // 高亮對應 tab
  [...tabbar.querySelectorAll(".tab")].forEach((t) =>
    t.classList.toggle("active", t.dataset.route === route)
  );
  view.innerHTML = "";
  window.scrollTo(0, 0);
  if (route === "home") renderHome(view, navigate);
  else ROUTES[route](view);
}

// 統計（給各模式呼叫）
export function addStat({ practiced = 0, best = 0, words = 0 } = {}) {
  const s = JSON.parse(localStorage.getItem("stats") || "{}");
  s.practiced = (s.practiced || 0) + practiced;
  s.words = (s.words || 0) + words;
  if (best > (s.best || 0)) s.best = best;
  localStorage.setItem("stats", JSON.stringify(s));
  const reps = practiced + words;
  if (reps > 0) bumpDaily(reps);
}

// ---------- 每日目標 / 連續天數（容易學：低門檻、每天看得到進步） ----------
const DAILY_GOALS = { easy: 5, normal: 10, serious: 20 };
export function getDailyGoalLevel() { return localStorage.getItem("dailyGoalLevel") || "normal"; }
export function setDailyGoalLevel(k) { if (DAILY_GOALS[k]) localStorage.setItem("dailyGoalLevel", k); }
export function getDailyGoal() { return DAILY_GOALS[getDailyGoalLevel()] || 10; }

function todayKey(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function isYesterday(prev, today) {
  if (!prev) return false;
  const y = new Date(today + "T00:00:00"); y.setDate(y.getDate() - 1);
  return todayKey(y) === prev;
}
export function getDaily() {
  const today = todayKey();
  let d = JSON.parse(localStorage.getItem("daily") || "{}");
  if (d.date !== today) d = { date: today, count: 0 };
  return d;
}
export function getStreak() {
  const s = JSON.parse(localStorage.getItem("streak") || "{}");
  return { count: s.count || 0, best: s.best || 0, lastDay: s.lastDay || "" };
}
function bumpDaily(reps) {
  const today = todayKey();
  // 今日進度
  let d = JSON.parse(localStorage.getItem("daily") || "{}");
  if (d.date !== today) d = { date: today, count: 0 };
  d.count += reps;
  localStorage.setItem("daily", JSON.stringify(d));
  // 連續天數：當天首次學習就接續（只要每天出現就不斷連，門檻最低、最容易維持）
  let s = JSON.parse(localStorage.getItem("streak") || "{}");
  s.count = s.count || 0; s.best = s.best || 0;
  if (s.lastDay !== today) {
    s.count = isYesterday(s.lastDay, today) ? s.count + 1 : 1;
    s.lastDay = today;
    if (s.count > s.best) s.best = s.count;
    localStorage.setItem("streak", JSON.stringify(s));
  }
}

export function getStrictness() {
  return localStorage.getItem("strictness") || "normal";
}

// ---------- 錯題本 + Leitner 間隔重複（容易學：主動回憶 + 弱點優先 + 精熟門檻） ----------
// Leitner 盒：答錯歸第 1 盒，答對升一盒；連續答對升到頂盒以上才「畢業」(= 答對 MAX_BOX 次才精熟)。
// 複習時依盒號升序排（最不熟的排最前），把弱點優先練。
export const MAX_BOX = 3;
export function getMistakes() {
  try {
    const list = JSON.parse(localStorage.getItem("mistakes") || "[]");
    return list.map((m) => ({ box: 1, ...m })); // 舊資料無 box → 視為第 1 盒
  } catch { return []; }
}
export function getMistakeCount() { return getMistakes().length; }
function saveMistakes(list) { localStorage.setItem("mistakes", JSON.stringify(list)); }
export function addMistake(item) {
  if (!item || !item.key) return;
  const list = getMistakes();
  if (list.some((m) => m.key === item.key)) return; // 同題不重複收集
  list.push({ ...item, box: 1, ts: Date.now() });
  saveMistakes(list);
}
export function removeMistake(key) {
  saveMistakes(getMistakes().filter((m) => m.key !== key));
}
// 答對：升一盒；若已在頂盒 → 畢業（移出錯題本）。回傳 true=已畢業
export function promoteMistake(key) {
  const list = getMistakes();
  const m = list.find((x) => x.key === key);
  if (!m) return true;
  if (m.box >= MAX_BOX) { saveMistakes(list.filter((x) => x.key !== key)); return true; }
  m.box += 1; saveMistakes(list);
  return false;
}
// 答錯：歸第 1 盒重練
export function demoteMistake(key) {
  const list = getMistakes();
  const m = list.find((x) => x.key === key);
  if (!m) return;
  m.box = 1; saveMistakes(list);
}

// ---------- 單字卡 Leitner（認識/不熟 → 弱字優先複習） ----------
export function getVocabSrs() {
  try { return JSON.parse(localStorage.getItem("vocabSrs") || "{}"); } catch { return {}; }
}
export function getVocabBox(word) { return getVocabSrs()[word]?.box || 0; } // 0 = 還沒評過
// known=true 認識→升盒(上限 MAX_BOX)；known=false 不熟→歸第 1 盒
export function rateVocab(word, known) {
  if (!word) return;
  const srs = getVocabSrs();
  const cur = srs[word]?.box || 0;
  srs[word] = { box: known ? Math.min(MAX_BOX, cur + 1) : 1, ts: Date.now() };
  localStorage.setItem("vocabSrs", JSON.stringify(srs));
}

// ---------- 首次進站引導 onboarding（容易學：降低第一次的陌生與不知所措） ----------
// 借鏡 Duolingo：先用親切歡迎降低焦慮 → 讓使用者設一個低門檻的每天目標 → 立刻知道怎麼開始。
// 只在第一次出現（localStorage `onboarded`）；設定面板可重看。
export function hasOnboarded() { return localStorage.getItem("onboarded") === "1"; }
export function showOnboarding() {
  if (document.getElementById("onboarding")) return;
  let step = 0;
  let pickedGoal = getDailyGoalLevel(); // 預設沿用現有；新使用者預設 normal
  const steps = [
    {
      html: `<div class="onb-ico">👋</div>
             <h2>歡迎！我是你的 AI 英語老師</h2>
             <p>開口說英文，我會<b>逐字</b>標出對與錯，給你具體的發音建議。</p>
             <p class="onb-sub">免註冊、免費、不用任何金鑰 — 打開就能練。</p>`,
    },
    {
      html: `<div class="onb-ico">🎯</div>
             <h2>先設一個每天小目標</h2>
             <p class="onb-sub">目標小一點，最容易養成每天打開的習慣 — 之後隨時能在設定調整。</p>
             <div class="onb-goals" id="onbGoals"></div>`,
      goal: true,
    },
    {
      html: `<div class="onb-ico">🚀</div>
             <h2>挑一種方式，現在就開始</h2>
             <div class="onb-modes">
               <div>🎤 <b>跟讀糾音</b> — 開口跟讀，即時糾正發音（核心）</div>
               <div>✍️ <b>聽寫</b> — 只聽聲音把句子打出來</div>
               <div>💬 <b>情境對話</b>　🃏 <b>單字卡</b>　📝 <b>文法填空</b></div>
             </div>
             <p class="onb-sub">每天完成一點點就會進步，連續天數別中斷喔 🔥</p>`,
    },
  ];

  const overlay = document.createElement("div");
  overlay.id = "onboarding";
  overlay.className = "onb";
  overlay.innerHTML = `
    <div class="onb-card" role="dialog" aria-modal="true">
      <div class="onb-body"></div>
      <div class="onb-dots"></div>
      <div class="onb-actions">
        <button class="btn btn-ghost" id="onbSkip" type="button">略過</button>
        <button class="btn btn-primary" id="onbNext" type="button">下一步</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);

  const body = overlay.querySelector(".onb-body");
  const dots = overlay.querySelector(".onb-dots");
  const nextBtn = overlay.querySelector("#onbNext");
  const skipBtn = overlay.querySelector("#onbSkip");

  const GOAL_OPTS = [
    { k: "easy", t: "輕鬆", d: "每天 5 個練習", tag: "推薦新手" },
    { k: "normal", t: "標準", d: "每天 10 個練習", tag: "" },
    { k: "serious", t: "認真", d: "每天 20 個練習", tag: "" },
  ];

  function draw() {
    body.innerHTML = steps[step].html;
    dots.innerHTML = steps.map((_, i) => `<i class="${i === step ? "on" : ""}"></i>`).join("");
    nextBtn.textContent = step === steps.length - 1 ? "開始學習 →" : "下一步";
    skipBtn.style.visibility = step === steps.length - 1 ? "hidden" : "visible";
    if (steps[step].goal) {
      const wrap = body.querySelector("#onbGoals");
      wrap.innerHTML = GOAL_OPTS.map((g) =>
        `<button type="button" class="onb-goal ${g.k === pickedGoal ? "on" : ""}" data-k="${g.k}">
           <b>${g.t}</b><span>${g.d}</span>${g.tag ? `<em>${g.tag}</em>` : ""}
         </button>`
      ).join("");
      wrap.querySelectorAll(".onb-goal").forEach((btn) => {
        btn.addEventListener("click", () => {
          pickedGoal = btn.dataset.k;
          wrap.querySelectorAll(".onb-goal").forEach((b) => b.classList.toggle("on", b.dataset.k === pickedGoal));
        });
      });
    }
  }
  function finish() {
    setDailyGoalLevel(pickedGoal);
    localStorage.setItem("onboarded", "1");
    overlay.remove();
    if (current === "home") navigate("home");
  }
  nextBtn.addEventListener("click", () => { if (step < steps.length - 1) { step++; draw(); } else finish(); });
  skipBtn.addEventListener("click", finish);
  draw();
}

// ---------- 語音狀態徽章 ----------
function updateVoiceBadge() {
  const badge = document.getElementById("voiceBadge");
  if (speechSupport.stt && speechSupport.tts) {
    badge.textContent = "✓ 語音就緒"; badge.className = "badge badge-ok";
  } else if (speechSupport.tts && !speechSupport.stt) {
    badge.textContent = "僅朗讀（請用 Chrome）"; badge.className = "badge badge-warn";
  } else {
    badge.textContent = "語音不支援"; badge.className = "badge badge-bad";
  }
}

// ---------- 設定面板 ----------
function initSettings() {
  const panel = document.getElementById("settingsPanel");
  const open = () => { fillVoices(); panel.classList.remove("hidden"); };
  const close = () => panel.classList.add("hidden");
  document.getElementById("settingsBtn").onclick = open;
  document.getElementById("settingsClose").onclick = close;
  panel.addEventListener("click", (e) => { if (e.target === panel) close(); });

  const voiceSel = document.getElementById("voiceSelect");
  function fillVoices() {
    const vs = getEnglishVoices();
    if (!vs.length) { voiceSel.innerHTML = `<option>（此瀏覽器尚未提供英語語音）</option>`; return; }
    const saved = localStorage.getItem("voiceURI") || "";
    voiceSel.innerHTML = vs.map((v) =>
      `<option value="${v.voiceURI}" ${v.voiceURI === saved ? "selected" : ""}>${v.name}（${v.lang}）</option>`
    ).join("");
  }
  voiceSel.onchange = () => setVoice(voiceSel.value);
  if (speechSupport.tts) window.speechSynthesis.onvoiceschanged = () => { updateVoiceBadge(); fillVoices(); };

  const rateRange = document.getElementById("rateRange");
  const rateVal = document.getElementById("rateVal");
  rateRange.value = getRate();
  rateVal.textContent = (+getRate()).toFixed(2);
  rateRange.oninput = () => { setRate(parseFloat(rateRange.value)); rateVal.textContent = (+rateRange.value).toFixed(2); };

  const strictSel = document.getElementById("strictSelect");
  strictSel.value = getStrictness();
  strictSel.onchange = () => localStorage.setItem("strictness", strictSel.value);

  const goalSel = document.getElementById("goalSelect");
  if (goalSel) {
    goalSel.value = getDailyGoalLevel();
    goalSel.onchange = () => { setDailyGoalLevel(goalSel.value); if (current === "home") navigate("home"); };
  }

  const replayBtn = document.getElementById("replayOnboarding");
  if (replayBtn) replayBtn.onclick = () => { close(); showOnboarding(); };

  document.getElementById("resetProgress").onclick = () => {
    localStorage.removeItem("stats");
    localStorage.removeItem("daily");
    localStorage.removeItem("streak");
    localStorage.removeItem("mistakes");
    localStorage.removeItem("vocabSrs");
    close();
    if (current === "home") navigate("home");
    alert("學習進度已清除。");
  };
}

// ---------- 啟動 ----------
function init() {
  updateVoiceBadge();
  initSettings();
  tabbar.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => navigate(t.dataset.route)));
  document.getElementById("brandHome").addEventListener("click", () => navigate("home"));
  window.addEventListener("hashchange", () => {
    const r = location.hash.replace("#", "");
    if (r && r !== current) navigate(r);
  });
  const initial = location.hash.replace("#", "") || "home";
  navigate(initial);
  if (!hasOnboarded()) showOnboarding();
}

init();
