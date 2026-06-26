// ============ Web Speech API 封裝 ============
// SpeechSynthesis：示範朗讀；SpeechRecognition：聽取學生發音。

const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

export const speechSupport = {
  tts: typeof window.speechSynthesis !== "undefined",
  stt: !!SR,
};

// ---------- 朗讀 (TTS) ----------
let voices = [];
function loadVoices() {
  if (!speechSupport.tts) return [];
  voices = window.speechSynthesis.getVoices() || [];
  return voices;
}
if (speechSupport.tts) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function getEnglishVoices() {
  const all = voices.length ? voices : loadVoices();
  return all.filter((v) => /^en(-|_|$)/i.test(v.lang));
}

let preferredVoiceURI = localStorage.getItem("voiceURI") || "";
let speakRate = parseFloat(localStorage.getItem("rate") || "0.95");

export function setVoice(uri) { preferredVoiceURI = uri; localStorage.setItem("voiceURI", uri); }
export function setRate(r) { speakRate = r; localStorage.setItem("rate", String(r)); }
export function getRate() { return speakRate; }

function pickVoice() {
  const en = getEnglishVoices();
  if (!en.length) return null;
  if (preferredVoiceURI) {
    const m = en.find((v) => v.voiceURI === preferredVoiceURI);
    if (m) return m;
  }
  // 優先挑較自然的英美語音
  return (
    en.find((v) => /Google US English|Samantha|Aaron|Microsoft (Aria|Jenny|Guy)/i.test(v.name)) ||
    en.find((v) => /en-US/i.test(v.lang)) ||
    en[0]
  );
}

// 朗讀一段文字；回傳 Promise 於結束時 resolve
export function speak(text, { rate, onWord } = {}) {
  return new Promise((resolve) => {
    if (!speechSupport.tts) { resolve(); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = pickVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = "en-US"; }
    u.rate = rate || speakRate;
    u.pitch = 1;
    if (onWord) {
      u.onboundary = (e) => { if (e.name === "word" || e.charIndex != null) onWord(e.charIndex); };
    }
    u.onend = () => resolve();
    u.onerror = () => resolve();
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (speechSupport.tts) window.speechSynthesis.cancel();
}

// ---------- 辨識 (STT) ----------
// 回傳一個控制器：start()/stop()/abort()，以 callback 回報結果
export function createRecognizer({ onResult, onInterim, onError, onEnd, lang = "en-US" } = {}) {
  if (!SR) return null;
  const rec = new SR();
  rec.lang = lang;
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 3;

  let finalTranscript = "";
  let bestConfidence = 0;

  rec.onresult = (e) => {
    let interim = "";
    for (let i = e.resultIndex; i < e.results.length; i++) {
      const res = e.results[i];
      if (res.isFinal) {
        finalTranscript += res[0].transcript + " ";
        bestConfidence = Math.max(bestConfidence, res[0].confidence || 0);
      } else {
        interim += res[0].transcript;
      }
    }
    if (interim && onInterim) onInterim(interim.trim());
  };
  rec.onerror = (e) => { if (onError) onError(e.error || "error"); };
  rec.onend = () => { if (onEnd) onEnd(finalTranscript.trim(), bestConfidence); };

  return {
    start() {
      finalTranscript = ""; bestConfidence = 0;
      try { rec.start(); } catch (_) { /* 重複 start 會丟錯，忽略 */ }
    },
    stop() { try { rec.stop(); } catch (_) {} },
    abort() { try { rec.abort(); } catch (_) {} },
  };
}
