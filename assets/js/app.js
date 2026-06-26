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

  document.getElementById("resetProgress").onclick = () => {
    localStorage.removeItem("stats");
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
