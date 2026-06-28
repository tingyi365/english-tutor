// ============ 主程式：路由 / 設定 / 狀態 ============
import { speechSupport, getEnglishVoices, setVoice, setRate, getRate } from "./speech.js";
import { renderHome, renderShadowing, renderDictation, renderConversation, renderFlashcard, renderGrammar } from "./modes.js";

const view = document.getElementById("view");
const tabbar = document.getElementById("tabbar");

const ROUTES = {
  home: renderHome,
  shadowing: renderShadowing,
  dictation: renderDictation,
  conversation: renderConversation,
  flashcard: renderFlashcard,
  grammar: renderGrammar,
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

  document.getElementById("resetProgress").onclick = () => {
    localStorage.removeItem("stats");
    localStorage.removeItem("daily");
    localStorage.removeItem("streak");
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
}

init();
