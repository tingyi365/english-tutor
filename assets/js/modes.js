// ============ 各學習模式 ============
import { SENTENCES, VOCAB, DIALOGUES, GRAMMAR } from "./data.js";
import { speak, stopSpeaking, createRecognizer, speechSupport } from "./speech.js";
import { alignAndScore, finalScore, gradeLabel, buildFeedback, tokenize, wordDrills, sentenceStress, sentenceIntonation } from "./scoring.js";
import { addStat, getStrictness, getDaily, getStreak, getDailyGoal, addMistake, removeMistake, getMistakes, getMistakeCount, promoteMistake, demoteMistake, MAX_BOX, getVocabSrs, getVocabBox, rateVocab, getStreakBadges, STREAK_MILESTONES, freezesToNext, FREEZE_EARN_EVERY, showAchievementWall, getRecommendedMode, getLearnMotive, LEARN_MOTIVES, navigate } from "./app.js";

const $ = (sel, root = document) => root.querySelector(sel);
const el = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function micWarning() {
  if (speechSupport.stt) return "";
  return `<div class="tip-banner">⚠️ 此瀏覽器不支援語音辨識，無法評分發音。請改用 <b>桌面版 Chrome</b> 或 <b>Android Chrome</b>。其他功能（朗讀、聽寫打字、單字、文法）仍可使用。</div>`;
}

// ====================================================
// 首頁
// ====================================================
export function renderHome(view, navigate) {
  const stats = JSON.parse(localStorage.getItem("stats") || "{}");
  const daily = getDaily();
  const streak = getStreak();
  const goal = getDailyGoal();
  const pct = Math.min(100, Math.round((daily.count / goal) * 100));
  const reached = daily.count >= goal;
  const remain = Math.max(0, goal - daily.count);
  const mistakeCount = getMistakeCount();
  const badges = getStreakBadges();
  const nextMilestone = STREAK_MILESTONES.find((n) => n > streak.count);
  // 連續保護（streak freeze）狀態：有保護就秀盾牌＋安心文案；沒有就秀「再 X 天解鎖」當動力
  const freezes = streak.freezes;
  const freezeToNext = freezesToNext();
  const freezeHtml = freezes > 0
    ? `<div class="streak-freeze has" title="漏一天也不會中斷，會自動補上缺口">
         <span class="sf-ico">🛡️</span>
         <div class="sf-txt"><b>連續保護 ×${freezes}</b><span>漏一天也不中斷・自動補上缺口</span></div>
       </div>`
    : (streak.count > 0 && freezeToNext > 0
      ? `<div class="streak-freeze" title="連續練習每 ${FREEZE_EARN_EVERY} 天賺 1 張連續保護">
           <span class="sf-ico sf-dim">🛡️</span>
           <div class="sf-txt"><b>再 ${freezeToNext} 天解鎖連續保護</b><span>保護能讓你漏一天也不中斷</span></div>
         </div>`
      : "");
  // 依學習動機（第20輪 onboarding 問的「為什麼學」）精選對應主題的句子，
  // 讓「為你推薦」不只推模式、也直接給用得到的內容（借鏡 Babbel：依目標先學最實用的句子＝容易學）。
  const motiveKey = getLearnMotive();
  const motive = motiveKey ? LEARN_MOTIVES[motiveKey] : null;
  const goalPickIdx = motive
    ? SENTENCES.map((s, i) => ({ s, i })).filter((o) => o.s.topic === motiveKey).slice(0, 3).map((o) => o.i)
    : [];
  const modes = [
    { r: "shadowing", ico: "🎤", t: "跟讀糾音", d: "聽老師示範，開口跟讀，逐字即時糾正發音。" },
    { r: "dictation", ico: "✍️", t: "聽寫練習", d: "只聽聲音，把句子打出來，訓練聽力與拼寫。" },
    { r: "conversation", ico: "💬", t: "情境對話", d: "真實情境一來一往，開口練習日常英語口說。" },
    { r: "flashcard", ico: "🃏", t: "單字卡", d: "翻卡記單字，點一下聽發音與例句。" },
    { r: "grammar", ico: "📝", t: "文法填空", d: "單選題練文法，附中文解析立刻搞懂。" },
  ];
  view.innerHTML = "";
  view.append(el(`
    <div>
      <div class="hero card">
        <div style="font-size:40px">🗣️</div>
        <h1>像真人老師一樣陪你練英文</h1>
        <p>核心是<b>語音聽說即時糾正</b>：開口說，老師立刻逐字標出對與錯，給你具體的發音建議。</p>
        <p>共 5 種學習方式，純前端、免註冊、免金鑰。建議用 <b>Chrome</b> 開啟並允許麥克風。</p>
        <div class="stat-row">
          <div class="stat"><b>${stats.practiced || 0}</b><span>練習次數</span></div>
          <div class="stat"><b>${stats.best || 0}</b><span>最高分</span></div>
          <div class="stat"><b>${stats.words || 0}</b><span>看過單字</span></div>
        </div>
      </div>

      <div class="card daily-card">
        <div class="daily-top">
          <div class="streak ${streak.count > 0 ? "streak-on" : ""}">
            <span class="flame">🔥</span>
            <div class="streak-num"><b>${streak.count}</b><span>連續天數</span></div>
          </div>
          <div class="daily-label">${reached ? "🎉 今日目標達成！" : `今日目標 <b>${daily.count}/${goal}</b>`}</div>
        </div>
        <div class="progress daily-prog"><i style="width:${pct}%"></i></div>
        <div class="daily-hint">${reached
          ? `做得好！明天再回來就能把連續天數變成 ${streak.count + 1} 天 💪`
          : `今天再完成 <b>${remain}</b> 個練習就達標 — 任何一種學習方式都算數，現在就開始吧！`}${streak.best > 1 ? `　·　最佳紀錄 ${streak.best} 天` : ""}</div>
        ${(badges.length || nextMilestone) ? `
        <div class="streak-badges" id="streakBadges" role="button" tabindex="0" title="點開成就牆，看看所有成就">
          ${badges.map((b) => `<span class="sbadge" title="連續 ${b.n} 天里程碑">${b.ico}<i>${b.n}</i></span>`).join("")}
          ${nextMilestone ? `<span class="sbadge sbadge-next" title="下一個里程碑">🎯<i>${nextMilestone}天</i></span>` : ""}
          <span class="sbadge-more">🏅 成就牆 →</span>
        </div>` : ""}
        ${freezeHtml}
      </div>

      ${mistakeCount > 0 ? `
      <div class="card review-card" id="reviewCard" role="button" tabindex="0">
        <div class="review-ico">📒</div>
        <div class="review-body">
          <b>複習錯題 ${mistakeCount} 題</b>
          <span>最不熟的先練，連續答對 ${MAX_BOX} 次才畢業 — 弱點優先最有效率</span>
        </div>
        <div class="review-go">→</div>
      </div>` : ""}

      ${(motive && goalPickIdx.length) ? `
      <div class="card goal-card">
        <div class="goal-head">
          <span class="goal-ico">${motive.ico}</span>
          <div class="goal-head-txt"><b>為「${motive.t}」精選句</b><span>跟你的目標最相關 — 直接開口練最用得到的句子</span></div>
        </div>
        <div class="goal-list">
          ${goalPickIdx.map((i) => `
          <button type="button" class="goal-item" data-idx="${i}">
            <span class="gi-txt"><span class="gi-en">${SENTENCES[i].en}</span><span class="gi-zh">${SENTENCES[i].zh}</span></span>
            <span class="gi-go">🎤 開口練</span>
          </button>`).join("")}
        </div>
      </div>` : ""}

      <div class="section-title">選一種學習方式</div>
      <div class="mode-grid" id="modeGrid"></div>
    </div>
  `));
  if (mistakeCount > 0) {
    const rc = $("#reviewCard", view);
    const go = () => navigate("review");
    rc.addEventListener("click", go);
    rc.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); go(); } });
  }
  const sb = $("#streakBadges", view);
  if (sb) {
    const openWall = () => showAchievementWall();
    sb.addEventListener("click", openWall);
    sb.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openWall(); } });
  }
  // 目標精選句：點一句 → 設定跟讀索引並直接進跟讀糾音，開口練該句（只寫 shadowIdx，不動任何錯題/索引語意）。
  if (motive && goalPickIdx.length) {
    view.querySelectorAll(".goal-item").forEach((btn) => {
      btn.addEventListener("click", () => {
        localStorage.setItem("shadowIdx", btn.dataset.idx);
        navigate("shadowing");
      });
    });
  }
  const grid = $("#modeGrid", view);
  // 依學習動機推薦的起始模式：在對應卡片掛「👍 為你推薦」緞帶＋排到最前，降低每次回來「從哪開始」的猶豫。
  const recMode = getRecommendedMode();
  const ordered = recMode ? [...modes].sort((a, b) => (a.r === recMode ? -1 : b.r === recMode ? 1 : 0)) : modes;
  ordered.forEach((m) => {
    const isRec = m.r === recMode;
    const c = el(`<div class="mode-card${isRec ? " mc-rec" : ""}">${isRec ? `<span class="mc-rec-tag">👍 為你推薦</span>` : ""}<div class="mc-ico">${m.ico}</div><h3>${m.t}</h3><p>${m.d}</p></div>`);
    c.addEventListener("click", () => navigate(m.r));
    grid.append(c);
  });
}

// ====================================================
// 跟讀糾音（核心語音糾正）
// ====================================================
export function renderShadowing(view) {
  let idx = parseInt(localStorage.getItem("shadowIdx") || "0", 10) % SENTENCES.length;
  let recognizer = null, listening = false;
  // 「範例 vs 我的錄音」對照：用 MediaRecorder 錄下學生跟讀的聲音，評分後可回放跟老師示範對比。
  // 全程 best-effort，不影響既有 STT/評分（先讓 recognizer 啟動，再開錄音；任何失敗都靜默略過、不出對照卡）。
  let recHandle = null, recordedUrl = null, myAudio = null;
  // 單字逐字錄音對照：drill 卡裡每個唸錯的字可「🎤 跟我唸」錄下單字、跟老師示範 A/B 比對，
  // 把第 9/13 輪的「句子層錄音對照」下沉到「單字層」——初學者鎖定那個難字、聽出差異最快改對（容易學）。
  let drillRecHandle = null, drillAudio = null;
  const drillUrls = [];
  // 節拍器（跟著重音節拍唸）：英文是 stress-timed 語言，重音落在規律的拍點上。
  // 用穩定的「咑」聲＋亮點打在每個實詞重音上，讓初學者用耳朵+眼睛抓到節奏，跟著拍子開口練。
  let metroTimer = null, metroCtx = null, metroSlow = false;
  // 節拍器拍距（ms）：標準≈94BPM、慢速≈64BPM。初學者跟不上標準拍 → 先用慢速把節奏唸穩，再切標準。
  const METRO_MS = { std: 640, slow: 940 };
  const metroMs = () => (metroSlow ? METRO_MS.slow : METRO_MS.std);
  const readAlongRate = () => (metroSlow ? 0.62 : 0.8);
  const canRecord = () =>
    typeof MediaRecorder !== "undefined" && !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);

  function startRecording() {
    if (!canRecord()) return Promise.resolve(null);
    return navigator.mediaDevices.getUserMedia({ audio: true }).then((stream) => {
      const chunks = [];
      let rec;
      try { rec = new MediaRecorder(stream); }
      catch (_) { stream.getTracks().forEach((t) => t.stop()); return null; }
      rec.ondataavailable = (e) => { if (e.data && e.data.size) chunks.push(e.data); };
      const stopped = new Promise((resolve) => {
        rec.onstop = () => {
          stream.getTracks().forEach((t) => t.stop());
          const blob = new Blob(chunks, { type: rec.mimeType || "audio/webm" });
          resolve(blob.size ? blob : null);
        };
      });
      try { rec.start(); } catch (_) { stream.getTracks().forEach((t) => t.stop()); return null; }
      return { stop() { try { rec.stop(); } catch (_) {} return stopped; } };
    }).catch(() => null);
  }

  // 把錄到的音檔解碼成「時長 + 波形包絡」，讓學生看得到自己的節奏、比得出快慢（借鏡 Oxford「Say It」聲波圖）。
  // 全程 best-effort：不支援/解碼失敗 → 回 {dur:null, peaks:null}，照舊只回放、不出波形/速度卡。
  function envelope(buf, n = 48) {
    try {
      const data = buf.getChannelData(0);
      const block = Math.floor(data.length / n) || 1;
      const peaks = []; let max = 0;
      for (let i = 0; i < n; i++) {
        let sum = 0; const start = i * block;
        for (let j = 0; j < block; j++) { const v = data[start + j] || 0; sum += v * v; }
        const rms = Math.sqrt(sum / block);
        peaks.push(rms); if (rms > max) max = rms;
      }
      return max > 0 ? peaks.map((p) => p / max) : peaks;
    } catch (_) { return null; }
  }
  function decodeRecording(blob) {
    return new Promise((resolve) => {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC || !blob.arrayBuffer) { resolve({ dur: null, peaks: null }); return; }
        blob.arrayBuffer().then((ab) => {
          const ctx = new AC();
          const done = (out) => { try { ctx.close(); } catch (_) {} resolve(out); };
          ctx.decodeAudioData(
            ab.slice(0),
            (b) => done({ dur: b.duration, peaks: envelope(b) }),
            () => done({ dur: null, peaks: null })
          );
        }).catch(() => resolve({ dur: null, peaks: null }));
      } catch (_) { resolve({ dur: null, peaks: null }); }
    });
  }
  // 從波形包絡偵測「內部停頓段」：連續低能量 bin（排除頭尾靜音）＝唸到一半停頓/猶豫，標出來讓學生看到要把字連起來。
  function detectPauses(peaks, thr = 0.1, minRun = 3) {
    const n = peaks.length;
    let lo = 0, hi = n - 1;
    while (lo < n && peaks[lo] < thr) lo++;          // 頭尾靜音（還沒開口/收尾）不算停頓
    while (hi >= 0 && peaks[hi] < thr) hi--;
    const out = []; let s = -1;
    for (let i = lo; i <= hi; i++) {
      if (peaks[i] < thr) { if (s < 0) s = i; }
      else { if (s >= 0 && i - s >= minRun) out.push({ start: s, end: i }); s = -1; }
    }
    return out;
  }
  // 把句子「實詞重、虛詞輕」的節奏（借第11輪 sentenceStress）轉成示範參考包絡：實詞=高、虛詞=低，依字序由左到右。
  function stressEnvelope(text) {
    try {
      const marks = sentenceStress(text);
      if (!marks || !marks.length) return null;
      return marks.map((m) => ({ word: m.word, v: m.stressed ? 1 : 0.36, strong: !!m.stressed }));
    } catch (_) { return null; }
  }
  // 畫聲波圖：①灰帶標出停頓段（我的真實錄音）②青柱＝我的聲音 ③琥珀階梯線＝示範該使勁的重音字（參考）。回傳停頓次數。
  function drawWave(canvas, peaks, ref) {
    try {
      const ctx = canvas.getContext("2d");
      const W = canvas.width, H = canvas.height, n = peaks.length, bw = W / n;
      ctx.clearRect(0, 0, W, H);
      const pauses = detectPauses(peaks);
      ctx.fillStyle = "rgba(148,163,184,0.22)";                       // 停頓段灰帶
      pauses.forEach((p) => ctx.fillRect(p.start * bw, 0, (p.end - p.start) * bw, H));
      ctx.fillStyle = "#38bdf8";                                      // 我的聲音波形
      peaks.forEach((p, i) => {
        const h = Math.max(2, p * (H - 6));
        ctx.fillRect(i * bw + bw * 0.15, (H - h) / 2, bw * 0.7, h);
      });
      if (ref && ref.length) {                                        // 示範重音參考線（實詞高、虛詞低）
        const seg = W / ref.length;
        ctx.strokeStyle = "#f59e0b"; ctx.lineWidth = 2;
        ctx.lineJoin = "round"; ctx.beginPath();
        ref.forEach((r, i) => {
          const x0 = i * seg, x1 = (i + 1) * seg, y = H - 3 - r.v * (H - 8);
          if (i === 0) ctx.moveTo(x0, y); else ctx.lineTo(x0, y);
          ctx.lineTo(x1, y);
        });
        ctx.stroke();
        ctx.fillStyle = "#fbbf24";                                    // 重音字落點小圓點
        ref.forEach((r, i) => { if (r.strong) { const x = (i + 0.5) * seg, y = H - 3 - r.v * (H - 8); ctx.beginPath(); ctx.arc(x, y, 2.6, 0, 7); ctx.fill(); } });
      }
      return pauses.length;
    } catch (_) { return 0; }
  }

  // 停掉錄音、轉成可回放 URL，並解碼出時長/波形；回傳 {url, dur, peaks}（無錄音則 null）
  function finishRecording() {
    if (!recHandle) return Promise.resolve(null);
    const h = recHandle; recHandle = null;
    return h.stop().then((blob) => {
      if (!blob) return null;
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      recordedUrl = URL.createObjectURL(blob);
      return decodeRecording(blob).then((info) => ({ url: recordedUrl, dur: info.dur, peaks: info.peaks }));
    }).catch(() => null);
  }

  function clearRecording() {
    if (recHandle) { try { recHandle.stop(); } catch (_) {} recHandle = null; }
    if (myAudio) { try { myAudio.pause(); } catch (_) {} myAudio = null; }
    if (recordedUrl) { URL.revokeObjectURL(recordedUrl); recordedUrl = null; }
    clearDrillRecordings();
  }

  // 清掉所有單字 drill 錄音（換句/換頁/重新評分前呼叫），釋放麥克風與 blob URL、不殘留不洩漏
  function clearDrillRecordings() {
    if (drillRecHandle) { try { drillRecHandle.stop(); } catch (_) {} drillRecHandle = null; }
    if (drillAudio) { try { drillAudio.pause(); } catch (_) {} drillAudio = null; }
    while (drillUrls.length) { try { URL.revokeObjectURL(drillUrls.pop()); } catch (_) {} }
  }

  // 給一個 drill 字接上「🎤 跟我唸」單字錄音 → 錄 3 秒自動停 → 顯示「🔊 示範 / 🎧 我的錄音」A/B 對照。
  // 全程 best-effort：不支援/失敗一律靜默，不影響評分、drill、句子錄音對照等既有功能。
  function wireDrillRecord(item, word) {
    const recBtn = $(".drill-rec", item);
    const cmp = $(".drill-cmp", item);
    if (!recBtn || !cmp) return;
    let myUrl = null;
    const playMine = () => {
      if (!myUrl) return;
      stopSpeaking();
      if (drillAudio) { try { drillAudio.pause(); } catch (_) {} }
      drillAudio = new Audio(myUrl);
      drillAudio.play().catch(() => {});
    };
    recBtn.onclick = () => {
      if (recBtn.dataset.busy === "1") return;            // 防連點
      if (drillRecHandle) { try { drillRecHandle.stop(); } catch (_) {} drillRecHandle = null; } // 停掉別字正在錄的
      stopSpeaking();
      recBtn.dataset.busy = "1";
      recBtn.textContent = "🔴 錄音中…唸這個字";
      startRecording().then((h) => {
        if (!h) { recBtn.textContent = "此裝置無法錄音"; recBtn.disabled = true; recBtn.dataset.busy = ""; return; }
        drillRecHandle = h;
        setTimeout(() => {
          if (drillRecHandle !== h) { recBtn.dataset.busy = ""; recBtn.textContent = "🎤 跟我唸"; return; } // 已被別字搶錄
          drillRecHandle = null;
          h.stop().then((blob) => {
            recBtn.dataset.busy = "";
            if (!blob) { recBtn.textContent = "🎤 再試一次"; return; }
            if (myUrl) { try { URL.revokeObjectURL(myUrl); } catch (_) {} }
            myUrl = URL.createObjectURL(blob); drillUrls.push(myUrl);
            recBtn.textContent = "🎤 重錄這個字";
            cmp.hidden = false;
            cmp.innerHTML = `
              <div class="drill-cmp-tip">🎧 比一比：先點 <b>🔊 示範</b>，再點 <b>🎧 我的錄音</b>，聽出哪裡不一樣，最快改對。</div>
              <div class="drill-cmp-row">
                <button class="btn btn-ghost drill-cmp-model">🔊 示範</button>
                <button class="btn btn-ghost drill-cmp-mine">🎧 我的錄音</button>
              </div>`;
            $(".drill-cmp-model", cmp).onclick = () => speak(word);
            $(".drill-cmp-mine", cmp).onclick = playMine;
          }).catch(() => { recBtn.dataset.busy = ""; recBtn.textContent = "🎤 再試一次"; });
        }, 3000);
      }).catch(() => { recBtn.dataset.busy = ""; recBtn.textContent = "🎤 跟我唸"; });
    };
  }

  function draw() {
    const s = SENTENCES[idx];
    view.innerHTML = "";
    view.append(el(`
      <div>
        ${micWarning()}
        <div class="lesson-head">
          <div class="ttl">🎤 跟讀糾音</div>
          <span class="pill pill-lv">${s.lv}・${idx + 1}/${SENTENCES.length}</span>
        </div>
        <div class="progress"><i style="width:${((idx + 1) / SENTENCES.length) * 100}%"></i></div>

        <div class="card">
          <div class="target-sentence" id="sentence"></div>
          <div class="translation">${esc(s.zh)}</div>
          <div class="phonetic">${esc(s.ipa)}</div>
          <div class="btn-row mt">
            <button class="btn btn-ghost" id="listenBtn">🔊 聽示範</button>
            <button class="btn btn-ghost" id="slowBtn">🐢 慢速</button>
            <button class="btn btn-ghost" id="rhythmBtn">🎵 句子節奏</button>
            <button class="btn btn-ghost" id="intonBtn">🎶 句尾語調</button>
            <button class="btn btn-mic" id="micBtn" ${speechSupport.stt ? "" : "disabled"}>🎙️ 開口跟讀</button>
          </div>
          <div class="read-hint">🎯 按「聽示範」時，老師唸到哪個字就會<b>點亮哪個字</b> — 跟著亮起來的字一起唸，最容易上口。</div>
          <div id="rhythm"></div>
          <div id="inton"></div>
          <div class="heard mt" id="heard"><span class="muted">點「開口跟讀」後，這裡會顯示聽到的內容…</span></div>
        </div>

        <div id="result"></div>

        <div class="btn-row mt">
          <button class="btn btn-ghost" id="prevBtn">← 上一句</button>
          <button class="btn btn-primary" id="nextBtn">下一句 →</button>
        </div>
      </div>
    `));
    renderSentence(SENTENCES[idx].en, null);

    $("#listenBtn", view).onclick = () => readAlong(s.en);
    $("#slowBtn", view).onclick = () => readAlong(s.en, 0.6);
    $("#rhythmBtn", view).onclick = () => toggleRhythm(s.en);
    $("#intonBtn", view).onclick = () => toggleIntonation(s.en);
    $("#prevBtn", view).onclick = () => { stopMetronome(); clearRecording(); idx = (idx - 1 + SENTENCES.length) % SENTENCES.length; persist(); draw(); };
    $("#nextBtn", view).onclick = () => { stopMetronome(); clearRecording(); idx = (idx + 1) % SENTENCES.length; persist(); draw(); };
    $("#micBtn", view).onclick = toggleMic;
  }

  function persist() { localStorage.setItem("shadowIdx", String(idx)); }

  // 將句子各詞依狀態上色
  function renderSentence(text, tStatus) {
    const box = $("#sentence", view);
    if (!box) return;
    const words = text.split(/\s+/);
    const tIdx = tokenize(text); // 對齊用的正規化序列長度相同
    box.innerHTML = "";
    words.forEach((w, i) => {
      const span = document.createElement("span");
      span.className = "w";
      span.textContent = w + " ";
      if (tStatus && tStatus[i]) {
        const st = tStatus[i].status;
        span.classList.add(st === "ok" ? "w-ok" : st === "miss" ? "w-miss" : st === "near" ? "w-ok" : "w-bad");
      }
      box.append(span);
    });
  }

  // 逐詞高亮「跟讀」(karaoke read-along)：聽示範時，老師唸到哪個字就把哪個字點亮，
  // 讓初學者把「聲音」對到「文字」，降低聽不懂、跟不上的摩擦（更容易學）。
  // charIndex 來自 SpeechSynthesis 的 onboundary，對應原字串位置 → 換算成第幾個詞。
  function wordOffsets(text) {
    const offs = [];
    const re = /\S+/g; let mm;
    while ((mm = re.exec(text))) offs.push({ start: mm.index, end: mm.index + mm[0].length });
    return offs;
  }
  function readAlong(text, rate) {
    const box = $("#sentence", view);
    if (!box) { return speak(text, { rate }); }
    const spans = [...box.querySelectorAll(".w")];
    const offs = wordOffsets(text);
    let cur = -1;
    const clear = () => { if (cur >= 0 && spans[cur]) spans[cur].classList.remove("w-now"); cur = -1; };
    const onWord = (charIndex) => {
      if (charIndex == null) return;
      let wi = offs.findIndex((o) => charIndex >= o.start && charIndex < o.end);
      if (wi < 0) { for (let i = offs.length - 1; i >= 0; i--) { if (charIndex >= offs[i].start) { wi = i; break; } } }
      if (wi < 0 || wi === cur) return;
      if (cur >= 0 && spans[cur]) spans[cur].classList.remove("w-now");
      cur = wi; if (spans[wi]) spans[wi].classList.add("w-now");
    };
    return speak(text, { rate, onWord }).then(clear);
  }

  // 句子節奏 / 句重音導覽（借鏡 ELSA Sentence Stress）：把該重讀的實詞放大、該弱化的虛詞縮灰，
  // 讓「英文是重音節拍語言」這件抽象的事變成看得見的小步驟＝更容易學、唸起來更道地。
  function toggleRhythm(text) {
    const box = $("#rhythm", view);
    if (!box) return;
    if (box.dataset.open === "1") { stopMetronome(); box.innerHTML = ""; box.dataset.open = ""; return; }
    const marks = sentenceStress(text);
    const chips = marks.map((m) => {
      const cls = m.stressed ? "beat beat-strong" : "beat beat-weak";
      const dot = m.stressed ? "●" : "·";
      return `<span class="${cls}"><span class="beat-dot">${dot}</span><span class="beat-w">${esc(m.word)}</span></span>`;
    }).join("");
    box.innerHTML = `
      <div class="rhythm-card">
        <div class="rhythm-tip">🎵 英文是<b>重音節拍</b>語言：<b class="rhythm-hi">放大的實詞</b>（名詞／動詞／形容詞）唸得<b>重、長、清楚</b>，<span class="muted">灰色虛詞（the／a／to／of…）輕輕快快帶過</span>，整句就有道地的抑揚。</div>
        <div class="rhythm-line">${chips}</div>
        <div class="metro-tip">🥁 按下節拍器，<b>每聲「咑」就是一個重音</b>——跟著拍子把放大的字唸出來、虛詞輕輕滑過，自然唸出英文的節奏感。<span class="muted">跟不上？先切<b>🐢 慢速</b>把節奏唸穩，再回標準。</span></div>
        <div class="tempo-row">
          <span class="tempo-lbl">速度</span>
          <button class="tempo-opt${metroSlow ? "" : " on"}" data-tempo="std">🥁 標準</button>
          <button class="tempo-opt${metroSlow ? " on" : ""}" data-tempo="slow">🐢 慢速</button>
        </div>
        <div class="btn-row mt">
          <button class="btn btn-ghost" id="metroBtn">🥁 打節拍跟著唸</button>
          <button class="btn btn-ghost" id="rhythmPlay">🔊 跟著節奏唸一次</button>
        </div>
      </div>`;
    box.dataset.open = "1";
    const play = $("#rhythmPlay", box);
    if (play) play.onclick = () => readAlong(text, readAlongRate());
    const metro = $("#metroBtn", box);
    if (metro) metro.onclick = () => playMetronome(text, metro);
    // 調速：切換慢/標準；若節拍器正在打，立即以新速度重啟，跟得上。
    box.querySelectorAll(".tempo-opt").forEach((opt) => {
      opt.onclick = () => {
        const slow = opt.dataset.tempo === "slow";
        if (slow === metroSlow) return;
        metroSlow = slow;
        box.querySelectorAll(".tempo-opt").forEach((o) => o.classList.toggle("on", o.dataset.tempo === opt.dataset.tempo));
        if (metroTimer) { stopMetronome(); playMetronome(text, $("#metroBtn", box)); } // 邊打邊調速：無縫重啟
      };
    });
  }

  // 句尾語調（升降調 intonation）導覽：把句子的「高低起伏(melody)」變成看得見的旋律線＋一句話講清楚
  // 「為什麼這裡該上揚 ↗／下降 ↘」，再用「🔊 聽語調示範」讓 TTS 自然示範（問句自然上揚、直述句下降）。
  // 這是初學者最常忽略卻很影響「聽起來自不自然」的一塊；看懂+跟著模仿＝最容易學會語調。
  function intonCurveSVG(dir) {
    const rise = dir === "rise";
    const path = rise
      ? "M3,27 C22,25 36,23 44,20 C52,17 57,12 60,5"
      : "M3,7 C22,9 36,11 44,14 C52,17 57,22 60,29";
    const head = rise ? "55,9 60,2 65,11" : "55,25 60,32 65,23";
    return `<svg class="into-curve" viewBox="0 0 68 34" preserveAspectRatio="none" aria-hidden="true">
      <path class="into-line" d="${path}"/>
      <polygon class="into-pt" points="${head}"/>
    </svg>`;
  }
  function toggleIntonation(text) {
    const box = $("#inton", view);
    if (!box) return;
    if (box.dataset.open === "1") { box.innerHTML = ""; box.dataset.open = ""; return; }
    const clauses = sentenceIntonation(text);
    if (!clauses || !clauses.length) return;
    const rows = clauses.map((c) => {
      const arrow = c.dir === "rise" ? "↗" : "↘";
      const dirLbl = c.dir === "rise" ? "上揚" : "下降";
      return `
        <div class="into-clause into-${c.dir}">
          ${intonCurveSVG(c.dir)}
          <div class="into-body">
            <div class="into-text">${esc(c.text)} <span class="into-arrow">${arrow}</span></div>
            <div class="into-reason"><b class="into-${c.dir}-c">句尾${dirLbl} ${arrow}</b> — ${c.reason}</div>
          </div>
        </div>`;
    }).join("");
    box.innerHTML = `
      <div class="inton-card">
        <div class="inton-tip">🎶 語調＝句子的<b>高低起伏</b>。光把字唸對還不夠，<b>句尾往上揚 ↗ 還是往下降 ↘</b>會改變整句的口氣 — 看懂下面的旋律線，再按「🔊 聽語調示範」跟著模仿。</div>
        ${rows}
        <div class="btn-row mt">
          <button class="btn btn-ghost" id="intonPlay">🔊 聽語調示範</button>
        </div>
        <div class="inton-foot">💡 聽示範時<b>專心聽句尾的高低</b>：問人 Yes/No 多半<b>往上揚 ↗</b>（像在徵詢），把話講完或問具體資訊（Wh-）多半<b>往下降 ↘</b>（語氣肯定）。跟著模仿，語調最容易上手。</div>
      </div>`;
    box.dataset.open = "1";
    const play = $("#intonPlay", box);
    if (play) play.onclick = () => readAlong(text);
  }

  // 節拍器：best-effort WebAudio「咑」聲，每個重音一拍，視覺亮點同步打在實詞上。
  // 不支援/被擋一律靜默略過、不影響任何既有功能。
  function click(strong) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      if (!metroCtx) metroCtx = new AC();
      if (metroCtx.state === "suspended") metroCtx.resume();
      const t = metroCtx.currentTime;
      const osc = metroCtx.createOscillator();
      const g = metroCtx.createGain();
      osc.frequency.value = strong ? 1150 : 760;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(strong ? 0.3 : 0.14, t + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
      osc.connect(g).connect(metroCtx.destination);
      osc.start(t); osc.stop(t + 0.13);
    } catch (_) { /* 靜默：節拍器是加分項，不可影響練習 */ }
  }

  function stopMetronome() {
    if (metroTimer) { clearInterval(metroTimer); metroTimer = null; }
    const box = $("#rhythm", view);
    if (box) box.querySelectorAll(".beat-now, .beat-pass").forEach((n) => n.classList.remove("beat-now", "beat-pass"));
    const btn = box && $("#metroBtn", box);
    if (btn) btn.textContent = "🥁 打節拍跟著唸";
  }

  function playMetronome(text, btn) {
    if (metroTimer) { stopMetronome(); return; } // 再按一次=停
    const box = $("#rhythm", view);
    if (!box) return;
    const marks = sentenceStress(text);
    const chips = [...box.querySelectorAll(".beat")];
    let beats = marks.map((m, i) => (m.stressed ? i : -1)).filter((i) => i >= 0);
    if (!beats.length) beats = marks.map((_, i) => i); // 保底：無實詞則每字一拍
    const seq = [-2, -1, ...beats]; // 先兩拍預備（弱音），再正式開打
    btn.textContent = "⏹️ 停止節拍";
    let k = 0, prev = -1;
    const step = () => {
      if (!box.isConnected || k >= seq.length) { stopMetronome(); return; } // 換頁/換句自動收
      const v = seq[k++];
      if (v < 0) { click(false); return; } // 預備拍
      click(true);
      for (let j = prev + 1; j < v; j++) { // 重音之間的虛詞：快速一閃，示意「輕快滑過」
        const c = chips[j];
        if (c && !c.classList.contains("beat-strong")) { c.classList.add("beat-pass"); setTimeout(() => c && c.classList.remove("beat-pass"), 200); }
      }
      chips.forEach((c) => c.classList.remove("beat-now"));
      const cur = chips[v];
      if (cur) { cur.classList.add("beat-now"); setTimeout(() => cur && cur.classList.remove("beat-now"), 340); }
      prev = v;
    };
    step(); // 立刻打第一拍（預備拍）
    metroTimer = setInterval(step, metroMs());
  }

  function toggleMic() {
    if (listening) { recognizer && recognizer.stop(); return; }
    const micBtn = $("#micBtn", view);
    const heard = $("#heard", view);
    stopSpeaking();
    heard.innerHTML = `<span class="listening"><span class="dot-pulse"></span> 聆聽中…請開口唸出上方句子</span>`;
    listening = true; micBtn.textContent = "⏹️ 停止";

    recognizer = createRecognizer({
      onInterim: (t) => { heard.innerHTML = `<span class="muted">…</span> ${esc(t)}`; },
      onError: (err) => {
        listening = false; micBtn.textContent = "🎙️ 開口跟讀";
        finishRecording(); // 釋放麥克風，不顯示對照卡
        const msg = err === "not-allowed" ? "麥克風被拒絕，請在網址列允許麥克風權限。"
          : err === "no-speech" ? "沒聽到聲音，請靠近麥克風再試一次。"
          : "辨識發生問題，請重試。";
        heard.innerHTML = `<span style="color:#fda4af">⚠️ ${msg}</span>`;
      },
      onEnd: (finalText, conf) => {
        listening = false; micBtn.textContent = "🎙️ 開口跟讀";
        finishRecording().then((my) => {
          if (!finalText) { heard.innerHTML = `<span style="color:#fcd34d">沒聽清楚，再試一次 🙂</span>`; return; }
          heard.innerHTML = `你說：<b>${esc(finalText)}</b>`;
          evaluate(finalText, conf, my);
        });
      },
    });
    recognizer.start();
    // best-effort 錄音：在 recognizer 啟動後才開，確保即使錄音失敗也不影響既有評分
    if (recordedUrl) { URL.revokeObjectURL(recordedUrl); recordedUrl = null; }
    startRecording().then((h) => { recHandle = h; }).catch(() => {});
  }

  function evaluate(heardText, conf, my) {
    const s = SENTENCES[idx];
    const myUrl = my && my.url;
    const result = alignAndScore(s.en, heardText, getStrictness());
    renderSentence(s.en, result.tStatus);
    const score = finalScore(result.accuracy, conf);
    const grade = gradeLabel(score);
    const fb = buildFeedback(result, score);
    addStat({ practiced: 1, best: score });

    const resBox = $("#result", view);
    resBox.innerHTML = "";
    resBox.append(el(`
      <div class="card mt">
        <div class="score-ring">
          <div class="ring" style="--p:${score}; --ringc:${grade.color}"><b>${score}</b></div>
          <div class="score-meta">
            <div class="lvl" style="color:${grade.color}">${grade.label}</div>
            <div class="sub">準確 ${result.stats.ok}/${result.stats.total}・近音 ${result.stats.near}・漏字 ${result.stats.miss}・多唸 ${result.stats.extras}</div>
          </div>
        </div>
        <div class="feedback" id="fb"></div>
        <div class="btn-row mt">
          <button class="btn btn-ghost" id="againBtn">🔁 再試一次</button>
          <button class="btn btn-ghost" id="cmpBtn">🔊 再聽示範</button>
        </div>
      </div>
    `));
    const fbBox = $("#fb", resBox);
    fb.forEach((f) => fbBox.append(el(
      `<div class="fb-item ${f.kind === "good" ? "fb-good" : "fb-warn"}"><span class="ico">${f.kind === "good" ? "✅" : "💡"}</span><span>${esc(f.text)}</span></div>`
    )));

    // 範例 vs 我的錄音對照（借鏡 ELSA：回放自己的聲音、緊接老師示範對比，靠「聽出差異」最快自我修正＝容易學）。
    // 只有真的錄到音才出卡；錄音不支援/失敗時靜默不顯示，不增負擔、不影響評分。
    if (myUrl) {
      const cmpCard = el(`
        <div class="card mt compare-card">
          <div class="compare-head">🎧 對照一下 — 先聽<b>老師示範</b>，再聽<b>你剛剛的錄音</b>，聽出哪裡不一樣，進步最快</div>
          <div class="compare-row">
            <button class="btn btn-ghost cmp-model">🔊 老師示範</button>
            <button class="btn btn-ghost cmp-mine">🎧 我的錄音</button>
          </div>
          ${my.peaks ? `<div class="wave-wrap">
            <div class="wave-label">🎙️ 你的聲音波形 vs <b>示範重音參考線</b>（高＝該使勁的字）</div>
            <canvas class="wave-cv" width="320" height="58"></canvas>
            <div class="wave-legend"><span class="wl wl-mine">你的聲音</span><span class="wl wl-ref">示範重音字</span><span class="wl wl-pause">你的停頓</span></div>
            <div class="wave-tip" id="waveTip"></div>
          </div>` : ""}
          ${my.dur ? `<div class="pace" id="pace">
            <div class="pace-hint">⏱️ 你這次唸了 <b>${my.dur.toFixed(1)} 秒</b>。點上方「🔊 老師示範」，自動幫你比快慢。</div>
          </div>` : ""}
        </div>`);
      const playMine = () => {
        stopSpeaking();
        if (myAudio) { try { myAudio.pause(); } catch (_) {} }
        myAudio = new Audio(myUrl);
        myAudio.play().catch(() => {});
      };
      // 我的聲音波形 + 示範重音參考線 + 停頓段標記：讓初學者一眼看到「我把勁使在對的字上了嗎、哪裡卡住停頓」（借鏡 Oxford Say It／ELSA 停頓偵測）。
      if (my.peaks) {
        const cv = $(".wave-cv", cmpCard);
        const ref = stressEnvelope(s.en);
        const nPause = cv ? drawWave(cv, my.peaks, ref) : 0;
        const tip = $(".wave-tip", cmpCard);
        if (tip) {
          tip.innerHTML = nPause > 0
            ? `⏸️ 中間偵測到你<b>停頓了 ${nPause} 次</b>（灰色段）——把字<b>連起來</b>唸會更順。對著<b class="wt-ref">琥珀線</b>：線高的字（實詞）使勁唸重，線低的虛詞輕輕滑過。`
            : `👍 中間很連貫、沒明顯停頓！對著<b class="wt-ref">琥珀線</b>練：線高的字（實詞）唸得<b>重、長、清楚</b>，線低的虛詞輕輕帶過。`;
        }
      }
      // 速度對照：量測老師示範的真實播放時長，與我的錄音並列成長短條，直觀看出唸太快/太慢/剛好。
      let refDur = 0;
      const now = () => (window.performance && performance.now) ? performance.now() : Date.now();
      const renderPace = () => {
        const box = $("#pace", cmpCard);
        if (!box || !my.dur || !refDur) return;
        const mx = Math.max(my.dur, refDur);
        const ratio = my.dur / refDur;
        let verdict, vcls;
        if (ratio > 1.25) { verdict = "你唸得比示範<b>慢</b> — 試著稍微加快、把字連起來，整句會更自然流暢。"; vcls = "pace-slow"; }
        else if (ratio < 0.8) { verdict = "你唸得比示範<b>快</b> — 放慢一點點，把重音字唸足，聽起來更清楚。"; vcls = "pace-fast"; }
        else { verdict = "速度跟示範<b>差不多</b>，節奏抓得很好！👍"; vcls = "pace-ok"; }
        box.innerHTML = `
          <div class="pace-bars">
            <div class="pace-row"><span class="pace-tag">老師</span><span class="pace-bar"><i style="width:${(refDur / mx * 100).toFixed(0)}%"></i></span><span class="pace-sec">${refDur.toFixed(1)}s</span></div>
            <div class="pace-row"><span class="pace-tag">你</span><span class="pace-bar pace-mine"><i style="width:${(my.dur / mx * 100).toFixed(0)}%"></i></span><span class="pace-sec">${my.dur.toFixed(1)}s</span></div>
          </div>
          <div class="pace-verdict ${vcls}">${verdict}</div>`;
      };
      $(".cmp-model", cmpCard).onclick = () => {
        if (myAudio) { try { myAudio.pause(); } catch (_) {} }
        const t0 = now();
        const p = readAlong(s.en);
        if (p && p.then) p.then(() => { const d = (now() - t0) / 1000; if (d > 0.3 && my.dur) { refDur = d; renderPace(); } });
      };
      $(".cmp-mine", cmpCard).onclick = playMine;
      resBox.append(cmpCard);
    }

    // 逐音 drill：把唸錯/近音/漏唸的字逐一列出，給「更細的音」提示＋可重聽單字示範(正常/慢速)，
    // 讓回饋從「診斷」變「能立刻照做的修正」（借鏡 ELSA：鎖定錯的音、無限重聽正確示範）。
    clearDrillRecordings(); // 重新評分前先清掉上一輪 drill 錄音，避免 blob URL 殘留
    const drills = wordDrills(result);
    const recCap = canRecord(); // 能錄音才顯示「🎤 跟我唸」單字對照
    if (drills.length) {
      const stLabel = { bad: "再加強", near: "接近了", miss: "漏唸" };
      const drillCard = el(`
        <div class="card mt drill-card">
          <div class="drill-head">🎯 重點練這幾個音 — 點 🔊 聽<b>單字正確示範</b>${recCap ? "、按 🎤 <b>錄自己唸這個字</b>跟示範比一比" : ""}，跟著慢慢唸到順為止</div>
          <div class="drill-list"></div>
        </div>`);
      const list = $(".drill-list", drillCard);
      drills.forEach((d) => {
        // 音節 + 重音標記（看得到重音在哪 → 跟著慢速示範把那一節唸得更長、更大聲）
        let stressHtml = "";
        if (d.syl && d.syl.syllables.length >= 2) {
          const chips = d.syl.syllables
            .map((sy, k) => `<span class="syl-chip${k === d.syl.stress ? " syl-stress" : ""}">${esc(sy)}</span>`)
            .join('<span class="syl-dot">·</span>');
          const ord = ["第一", "第二", "第三", "第四", "第五"][d.syl.stress] || `第 ${d.syl.stress + 1}`;
          stressHtml = `
            <div class="drill-syl">
              <div class="syl-row">${chips}</div>
              <div class="syl-tip">重音在<b>${ord}音節「${esc(d.syl.syllables[d.syl.stress])}」</b>：這一節唸得更<b>大聲、更長、音調略高</b>。</div>
            </div>`;
        }
        const item = el(`
          <div class="drill-item">
            <div class="drill-row">
              <span class="drill-w">${esc(d.word)}</span>
              <span class="drill-st drill-${d.status}">${stLabel[d.status] || ""}</span>
              ${d.heard ? `<span class="drill-heard">聽起來像 "${esc(d.heard)}"</span>` : ""}
            </div>
            <div class="drill-tip">${esc(d.tip)}</div>
            ${stressHtml}
            <div class="drill-btns">
              <button class="btn btn-ghost drill-say">🔊 正常</button>
              <button class="btn btn-ghost drill-slow">🐢 慢速</button>
              ${recCap ? `<button class="btn btn-ghost drill-rec">🎤 跟我唸</button>` : ""}
            </div>
            ${recCap ? `<div class="drill-cmp" hidden></div>` : ""}
          </div>`);
        $(".drill-say", item).onclick = () => speak(d.word);
        $(".drill-slow", item).onclick = () => speak(d.word, { rate: 0.5 });
        if (recCap) wireDrillRecord(item, d.word);
        list.append(item);
      });
      resBox.append(drillCard);
    }

    $("#againBtn", resBox).onclick = toggleMic;
    $("#cmpBtn", resBox).onclick = () => readAlong(s.en);
    resBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  draw();
}

// ====================================================
// 聽寫
// ====================================================
export function renderDictation(view) {
  let idx = 0, revealed = false;

  function draw() {
    const s = SENTENCES[idx];
    view.innerHTML = "";
    view.append(el(`
      <div>
        <div class="lesson-head">
          <div class="ttl">✍️ 聽寫練習</div>
          <span class="pill pill-lv">${s.lv}・${idx + 1}/${SENTENCES.length}</span>
        </div>
        <div class="progress"><i style="width:${((idx + 1) / SENTENCES.length) * 100}%"></i></div>
        <div class="card">
          <p class="translation">先聽聲音，把聽到的英文句子打出來：</p>
          <div class="btn-row">
            <button class="btn btn-primary" id="playBtn">🔊 播放</button>
            <button class="btn btn-ghost" id="slowBtn">🐢 慢速</button>
          </div>
          <input class="input-line mt" id="answer" placeholder="在這裡輸入你聽到的句子…" autocomplete="off" autocapitalize="off" />
          <div class="btn-row mt">
            <button class="btn btn-ok btn-block" id="checkBtn">✓ 對答案</button>
          </div>
          <div id="dictResult"></div>
        </div>
        <div class="btn-row mt">
          <button class="btn btn-ghost" id="prevBtn">← 上一句</button>
          <button class="btn btn-primary" id="nextBtn">下一句 →</button>
        </div>
      </div>
    `));
    revealed = false;
    setTimeout(() => speak(s.en), 250);
    $("#playBtn", view).onclick = () => speak(s.en);
    $("#slowBtn", view).onclick = () => speak(s.en, { rate: 0.6 });
    $("#checkBtn", view).onclick = check;
    $("#answer", view).addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
    $("#prevBtn", view).onclick = () => { idx = (idx - 1 + SENTENCES.length) % SENTENCES.length; draw(); };
    $("#nextBtn", view).onclick = () => { idx = (idx + 1) % SENTENCES.length; draw(); };
  }

  function check() {
    const s = SENTENCES[idx];
    const ans = $("#answer", view).value.trim();
    if (!ans) { $("#answer", view).focus(); return; }
    const result = alignAndScore(s.en, ans, "normal");
    const score = Math.round(result.accuracy * 100);
    const grade = gradeLabel(score);
    addStat({ practiced: 1, best: score });
    if (score < 60) addMistake({ key: `d${idx}`, type: "dictation", sIndex: idx });

    const words = s.en.split(/\s+/);
    let html = '<div class="target-sentence" style="font-size:20px">';
    words.forEach((w, i) => {
      const st = result.tStatus[i]?.status;
      const cls = st === "ok" || st === "near" ? "w-ok" : st === "miss" ? "w-miss" : "w-bad";
      html += `<span class="w ${cls}">${esc(w)} </span>`;
    });
    html += "</div>";

    $("#dictResult", view).innerHTML = `
      <div class="explain mt">
        <div class="row"><b style="color:${grade.color};font-size:18px">${score} 分</b><span class="spacer"></span><span>${grade.label}</span></div>
        <div class="mt" style="color:var(--muted)">正解：</div>
        ${html}
        <div class="translation">${esc(s.zh)}</div>
      </div>`;
    revealed = true;
  }
  draw();
}

// ====================================================
// 情境對話
// ====================================================
export function renderConversation(view) {
  let turn = 0, recognizer = null, listening = false;
  // 依動機分主題 + 難度分級 + 可自由跳級（借鏡 Babbel：依目標分主題、難度可自由跳、不鎖進度門＝容易學）。
  // 主題篩選 chip：「全部」＋實際存在的主題；選了學習動機就預設聚焦對應主題，讓「為你推薦」連對話內容也名副其實。
  const TOPIC_META = { travel: { ico: "✈️", t: "旅遊" }, work: { ico: "💼", t: "工作" }, daily: { ico: "🗣️", t: "日常" }, exam: { ico: "📖", t: "考試" } };
  const presentTopics = [...new Set(DIALOGUES.map((d) => d.topic).filter(Boolean))];
  const motiveKey = getLearnMotive();
  // 動機對應主題有對話才預設聚焦，否則「全部」（如動機=考試但對話無考試主題 → 全部，零摩擦不強迫）。
  let filter = (motiveKey && presentTopics.includes(motiveKey)) ? motiveKey : "all";
  const listFor = (f) => DIALOGUES.map((d, i) => ({ d, i })).filter((o) => f === "all" || o.d.topic === f).map((o) => o.i);
  let list = listFor(filter);
  let fpos = 0;

  function chipsHtml() {
    const chip = (key, label) =>
      `<button type="button" class="conv-chip${filter === key ? " on" : ""}" data-f="${key}">${label}</button>`;
    return `<div class="conv-chips" id="convChips">
      ${chip("all", "全部")}
      ${presentTopics.map((tp) => chip(tp, `${TOPIC_META[tp].ico} ${TOPIC_META[tp].t}`)).join("")}
    </div>`;
  }

  function draw() {
    const d = DIALOGUES[list[fpos]];
    view.innerHTML = "";
    view.append(el(`
      <div>
        ${micWarning()}
        <div class="lesson-head">
          <div class="ttl">💬 情境對話</div>
          <span class="pill pill-lv">${esc(d.level || "初級")}・${fpos + 1}/${list.length}</span>
        </div>
        ${chipsHtml()}
        <div class="card">
          <b>${TOPIC_META[d.topic] ? TOPIC_META[d.topic].ico + " " : ""}${esc(d.title)}</b>
          <p class="translation">${esc(d.scene)}</p>
        </div>
        <div class="chat mt" id="chat"></div>
        <div id="convCtl"></div>
        <div class="btn-row mt">
          <button class="btn btn-ghost" id="switchBtn">🔀 換情境</button>
        </div>
      </div>
    `));
    turn = 0;
    // 主題 chip：自由跳級（不鎖進度門），切主題即重建清單並回到該主題第一個對話。
    view.querySelectorAll(".conv-chip").forEach((c) => {
      c.onclick = () => {
        const f = c.dataset.f;
        if (f === filter) return;
        filter = f; list = listFor(filter); fpos = 0; draw();
      };
    });
    $("#switchBtn", view).onclick = () => { fpos = (fpos + 1) % list.length; draw(); };
    nextTurn();
  }

  function pushBubble(side, text, sub) {
    const chat = $("#chat", view);
    chat.append(el(`<div class="bubble b-${side}">${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ""}</div>`));
    chat.lastElementChild.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function nextTurn() {
    const d = DIALOGUES[list[fpos]];
    if (turn >= d.turns.length) {
      $("#convCtl", view).innerHTML = `<div class="card center mt">🎉 對話完成！你完成了「${esc(d.title)}」。<div class="btn-row mt"><button class="btn btn-primary btn-block" id="againConv">再練一次</button></div></div>`;
      $("#againConv", view).onclick = draw;
      addStat({ practiced: 1 });
      return;
    }
    const t = d.turns[turn];
    pushBubble("ai", t.ai);
    setTimeout(() => speak(t.ai), 200);
    // 分支對話（借鏡 Babbel：自己選想怎麼回應 → 對話更像真實互動＝更容易開口）。
    // 有 choices 就先讓使用者挑一種說法；沒有就維持原本單一建議句路徑（向後相容）。
    if (t.choices && t.choices.length) renderChoices(t);
    else renderControls(t);
  }

  // 分支選擇：列出 2-3 種回應方式，挑一種後轉成可練習的回應句（沿用 renderControls）。
  function renderChoices(t) {
    const ctl = $("#convCtl", view);
    ctl.innerHTML = `
      <div class="suggest-line">💬 你想怎麼回應？選一種說法練習：</div>
      <div class="conv-choices" id="convChoices">
        ${t.choices.map((c, ci) => `
          <button type="button" class="conv-choice" data-ci="${ci}">
            <span class="cc-label">${esc(c.label)}</span>
            <span class="cc-en">${esc(c.en)}</span>
            <span class="cc-zh">${esc(c.zh)}</span>
          </button>`).join("")}
      </div>`;
    view.querySelectorAll(".conv-choice").forEach((b) => {
      b.onclick = () => {
        const c = t.choices[+b.dataset.ci];
        renderControls({ hint: c.en, zh: c.zh }, c.reply);
      };
    });
  }

  // 推進到下一輪；branch 選擇有對方回應(reply)時，先把回應 bubble 推出再續。
  function advance(reply, delay) {
    if (reply) {
      pushBubble("ai", reply);
      setTimeout(() => speak(reply), 250);
    }
    turn++;
    setTimeout(nextTurn, reply ? Math.max(delay || 0, 900) : (delay || 0));
  }

  function renderControls(t, reply) {
    const ctl = $("#convCtl", view);
    ctl.innerHTML = `
      <div class="suggest-line">💡 ${reply ? "就照這句練習：" : "建議這樣回答："}<b>${esc(t.hint)}</b>（${esc(t.zh)}）</div>
      <div class="btn-row">
        <button class="btn btn-ghost" id="hearHint">🔊 聽建議句</button>
        <button class="btn btn-mic" id="speakBtn" ${speechSupport.stt ? "" : "disabled"}>🎙️ 換我說</button>
        <button class="btn btn-ghost" id="skipBtn">略過 →</button>
      </div>
      <div class="heard mt" id="convHeard"><span class="muted">點「換我說」開口回應…</span></div>`;
    $("#hearHint", ctl).onclick = () => speak(t.hint);
    $("#skipBtn", ctl).onclick = () => advance(reply, 0);
    $("#speakBtn", ctl).onclick = () => speakTurn(t, reply);
  }

  function speakTurn(t, reply) {
    if (listening) { recognizer && recognizer.stop(); return; }
    const heard = $("#convHeard", view);
    const btn = $("#speakBtn", view);
    stopSpeaking();
    heard.innerHTML = `<span class="listening"><span class="dot-pulse"></span> 聆聽中…</span>`;
    listening = true; btn.textContent = "⏹️ 停止";
    recognizer = createRecognizer({
      onInterim: (x) => heard.innerHTML = `<span class="muted">…</span> ${esc(x)}`,
      onError: () => { listening = false; btn.textContent = "🎙️ 換我說"; heard.innerHTML = `<span style="color:#fda4af">⚠️ 沒聽清楚，再試一次</span>`; },
      onEnd: (finalText, conf) => {
        listening = false; btn.textContent = "🎙️ 換我說";
        if (!finalText) { heard.innerHTML = `<span style="color:#fcd34d">沒聽到，再試一次</span>`; return; }
        const result = alignAndScore(t.hint, finalText, getStrictness());
        const score = finalScore(result.accuracy, conf);
        const grade = gradeLabel(score);
        pushBubble("me", finalText, `發音 ${score} 分・${grade.label}`);
        addStat({ practiced: 1, best: score });
        advance(reply, 600);
      },
    });
    recognizer.start();
  }
  draw();
}

// ====================================================
// 單字卡
// ====================================================
export function renderFlashcard(view) {
  // 弱點優先：沒評過(box 0)與「不熟」(box 1) 的單字排最前面先複習，「認識」的排後面（Leitner）。
  // 次要排序：選了學習動機 → 同熟練度下，對應主題（旅遊/工作/考試/日常）的字優先排前（讓「為你推薦」連單字也貼動機＝容易學）。
  const motiveKey = getLearnMotive();
  const order = VOCAB.map((_, idx) => idx)
    .sort((a, b) => {
      const bd = getVocabBox(VOCAB[a].word) - getVocabBox(VOCAB[b].word);
      if (bd !== 0) return bd;
      if (motiveKey) {
        const am = VOCAB[a].topic === motiveKey ? 0 : 1;
        const bm = VOCAB[b].topic === motiveKey ? 0 : 1;
        if (am !== bm) return am - bm;
      }
      return 0;
    });
  let pos = 0;
  const len = order.length;
  const dots = (box) => "●".repeat(box) + "○".repeat(Math.max(0, MAX_BOX - box));
  const tag = (box) => box === 0 ? "🆕 新字" : box >= MAX_BOX ? "🟢 已熟" : "🟡 複習中";

  function draw() {
    bumpWords();
    const i = order[pos];
    const v = VOCAB[i];
    const box = getVocabBox(v.word);
    view.innerHTML = "";
    view.append(el(`
      <div>
        <div class="lesson-head">
          <div class="ttl">🃏 單字卡</div>
          <span class="pill pill-lv">${pos + 1}/${len}</span>
        </div>
        <div class="progress"><i style="width:${((pos + 1) / len) * 100}%"></i></div>
        <div class="flash-wrap">
          <div class="flash" id="flash">
            <div class="flash-face flash-front">
              <div class="vocab-tag">${tag(box)} <span class="mastery-dots">${dots(box)}</span></div>
              <div class="word">${esc(v.word)}</div>
              <div class="phonetic">${esc(v.ipa)} ・ ${esc(v.pos)}</div>
              <button class="btn btn-ghost" id="sayBtn">🔊 發音</button>
              <div class="translation">點卡片看中文與例句</div>
            </div>
            <div class="flash-face flash-back">
              <div class="mean">${esc(v.zh)}</div>
              <div class="ex">${esc(v.ex)}<br><span class="translation">${esc(v.exZh)}</span></div>
              <button class="btn btn-ghost" id="sayExBtn">🔊 唸例句</button>
            </div>
          </div>
        </div>
        <div class="rate-row">
          <button class="btn btn-rate btn-unknown" id="rateUnknown">🤔 還不熟</button>
          <button class="btn btn-rate btn-known" id="rateKnown">👍 認識了</button>
        </div>
        <div class="rate-hint">先翻卡看答案，再誠實點選 — 不熟的會優先排到前面多複習</div>
        <div class="btn-row mt">
          <button class="btn btn-ghost" id="prevBtn">← 上一張</button>
          <button class="btn btn-ghost" id="nextBtn">略過 →</button>
        </div>
      </div>
    `));
    const flash = $("#flash", view);
    flash.onclick = (e) => { if (e.target.closest("button")) return; flash.classList.toggle("flipped"); };
    $("#sayBtn", view).onclick = () => speak(v.word);
    $("#sayExBtn", view).onclick = () => speak(v.ex);
    $("#rateKnown", view).onclick = () => { rateVocab(v.word, true); advance(); };
    $("#rateUnknown", view).onclick = () => { rateVocab(v.word, false); advance(); };
    $("#prevBtn", view).onclick = () => { pos = (pos - 1 + len) % len; draw(); };
    $("#nextBtn", view).onclick = () => { advance(); };
    setTimeout(() => speak(v.word), 200);
  }
  function advance() { pos = (pos + 1) % len; draw(); }
  function bumpWords() { addStat({ words: 1 }); }
  draw();
}

// ====================================================
// 文法填空
// ====================================================
export function renderGrammar(view) {
  let i = 0, answered = false;
  function draw() {
    const q = GRAMMAR[i];
    answered = false;
    const parts = q.prompt.split("___");
    view.innerHTML = "";
    view.append(el(`
      <div>
        <div class="lesson-head">
          <div class="ttl">📝 文法填空</div>
          <span class="pill pill-lv">${q.lv}・${i + 1}/${GRAMMAR.length}</span>
        </div>
        <div class="progress"><i style="width:${((i + 1) / GRAMMAR.length) * 100}%"></i></div>
        <div class="card">
          <div class="gap-sentence">${esc(parts[0])}<span class="gap-blank" id="blank">____</span>${esc(parts[1] || "")}</div>
          <div class="translation mb">${esc(q.zh)}</div>
          <div class="opt-grid" id="opts"></div>
          <div id="gramResult"></div>
        </div>
        <div class="btn-row mt">
          <button class="btn btn-primary btn-block" id="nextBtn">下一題 →</button>
        </div>
      </div>
    `));
    const opts = $("#opts", view);
    q.options.forEach((o, oi) => {
      const b = el(`<button class="opt">${String.fromCharCode(65 + oi)}. ${esc(o)}</button>`);
      b.onclick = () => choose(oi, b);
      opts.append(b);
    });
    $("#nextBtn", view).onclick = () => { i = (i + 1) % GRAMMAR.length; draw(); };
  }
  function choose(oi, btn) {
    if (answered) return;
    answered = true;
    const q = GRAMMAR[i];
    const all = [...view.querySelectorAll(".opt")];
    all.forEach((b, bi) => {
      b.disabled = true;
      if (bi === q.answer) b.classList.add("correct");
      else if (bi === oi) b.classList.add("wrong");
    });
    const ok = oi === q.answer;
    $("#blank", view).textContent = q.options[q.answer];
    speak(q.prompt.replace("___", q.options[q.answer]));
    addStat({ practiced: 1, best: ok ? 100 : 0 });
    if (!ok) addMistake({ key: `g${i}`, type: "grammar", qIndex: i });
    $("#gramResult", view).innerHTML = `<div class="explain mt"><b>${ok ? "✅ 答對了！" : "❌ 再想想"}</b>　${esc(q.explain)}${ok ? "" : `<div class="muted mt" style="font-size:13px">📒 已加入錯題本，稍後可在首頁「複習錯題」再練。</div>`}</div>`;
  }
  draw();
}

// ====================================================
// 複習錯題（容易學：主動回憶 retrieval + Leitner 間隔重複）
//  · 弱點優先：依 Leitner 盒號升序排，最不熟的(第 1 盒)排最前先練。
//  · 精熟門檻：答對升一盒、答錯歸第 1 盒；連續答對到頂盒才畢業(答對 MAX_BOX 次)。
//  · 一次一題、低壓力小批次。
// ====================================================
export function renderReview(view) {
  const startKeys = new Set(getMistakes().map((m) => m.key)); // 本次進來時的錯題集（算進度用）
  const startTotal = startKeys.size;
  let lastKey = null; // 避免同一題連續出現兩次

  // 弱點優先：盒號小(最不熟)排最前，同盒看加入時間
  function currentMistake() {
    const live = getMistakes().slice().sort((a, b) => (a.box - b.box) || (a.ts - b.ts));
    if (!live.length) return null;
    return live.find((m) => m.key !== lastKey) || live[0];
  }
  // 答對：升盒/畢業後續下一題
  function graduateAdvance(key) { lastKey = key; promoteMistake(key); draw(); }
  // 答錯：歸第 1 盒後續下一題
  function keepAdvance(key) { lastKey = key; demoteMistake(key); draw(); }

  // 熟練度小點：已答對的盒數 / 需答對 MAX_BOX 次
  function masteryDots(box) {
    return "●".repeat(box) + "○".repeat(Math.max(0, MAX_BOX - box));
  }

  function draw() {
    view.innerHTML = "";
    const m = currentMistake();
    const remaining = getMistakes().length;
    if (!m) {
      view.append(el(`
        <div>
          <div class="lesson-head"><div class="ttl">📒 複習錯題</div></div>
          <div class="card center">
            <div style="font-size:40px">🎉</div>
            <b>${startTotal > 0 ? "錯題全部複習完，太棒了！" : "目前沒有錯題"}</b>
            <p class="translation">答錯的文法 / 聽寫題會自動收進這裡，最不熟的優先排前面；連續答對 ${MAX_BOX} 次就畢業。</p>
            <div class="btn-row mt"><button class="btn btn-primary btn-block" id="goHome">回首頁</button></div>
          </div>
        </div>`));
      $("#goHome", view).onclick = () => navigate("home");
      return;
    }
    const done = startTotal - remaining;
    view.append(el(`
      <div>
        <div class="lesson-head">
          <div class="ttl">📒 複習錯題</div>
          <span class="pill pill-lv">剩 ${remaining} 題</span>
        </div>
        <div class="progress"><i style="width:${startTotal ? Math.round((done / startTotal) * 100) : 0}%"></i></div>
        <div class="mastery-line">熟練度 <b class="mastery-dots">${masteryDots(m.box)}</b><span class="mastery-tip">　連續答對 ${MAX_BOX} 次就畢業</span></div>
        <div class="card" id="reviewBody"></div>
      </div>`));
    const body = $("#reviewBody", view);
    if (m.type === "grammar") drawGrammarReview(body, m);
    else if (m.type === "dictation") drawDictationReview(body, m);
    else { removeMistake(m.key); draw(); }
  }

  function drawGrammarReview(body, m) {
    const q = GRAMMAR[m.qIndex];
    if (!q) { removeMistake(m.key); return draw(); }
    let answered = false;
    const parts = q.prompt.split("___");
    body.innerHTML = `
      <div class="gap-sentence">${esc(parts[0])}<span class="gap-blank" id="rblank">____</span>${esc(parts[1] || "")}</div>
      <div class="translation mb">${esc(q.zh)}</div>
      <div class="opt-grid" id="ropts"></div>
      <div id="rresult"></div>`;
    const opts = $("#ropts", body);
    q.options.forEach((o, oi) => {
      const b = el(`<button class="opt">${String.fromCharCode(65 + oi)}. ${esc(o)}</button>`);
      b.onclick = () => {
        if (answered) return; answered = true;
        [...body.querySelectorAll(".opt")].forEach((bb, bi) => {
          bb.disabled = true;
          if (bi === q.answer) bb.classList.add("correct");
          else if (bi === oi) bb.classList.add("wrong");
        });
        const ok = oi === q.answer;
        const willGraduate = ok && m.box >= MAX_BOX;
        $("#rblank", body).textContent = q.options[q.answer];
        speak(q.prompt.replace("___", q.options[q.answer]));
        addStat({ practiced: 1 });
        const msg = willGraduate ? "✅ 答對，這題畢業！" : ok ? `✅ 答對！再連對 ${MAX_BOX - m.box} 次就畢業` : "❌ 還不熟，歸回第 1 盒重練";
        $("#rresult", body).innerHTML = `
          <div class="explain mt"><b>${msg}</b>　${esc(q.explain)}</div>
          <div class="btn-row mt"><button class="btn btn-primary btn-block" id="rnext">${ok ? "下一題 →" : "先練下一題 →"}</button></div>`;
        $("#rnext", body).onclick = () => (ok ? graduateAdvance(m.key) : keepAdvance(m.key));
      };
      opts.append(b);
    });
  }

  function drawDictationReview(body, m) {
    const s = SENTENCES[m.sIndex];
    if (!s) { removeMistake(m.key); return draw(); }
    body.innerHTML = `
      <p class="translation">再聽一次，把句子打出來（答對 80 分以上就畢業）：</p>
      <div class="btn-row">
        <button class="btn btn-primary" id="rplay">🔊 播放</button>
        <button class="btn btn-ghost" id="rslow">🐢 慢速</button>
      </div>
      <input class="input-line mt" id="rans" placeholder="輸入你聽到的句子…" autocomplete="off" autocapitalize="off" />
      <div class="btn-row mt"><button class="btn btn-ok btn-block" id="rcheck">✓ 對答案</button></div>
      <div id="rdict"></div>`;
    setTimeout(() => speak(s.en), 250);
    $("#rplay", body).onclick = () => speak(s.en);
    $("#rslow", body).onclick = () => speak(s.en, { rate: 0.6 });
    const check = () => {
      const ans = $("#rans", body).value.trim();
      if (!ans) { $("#rans", body).focus(); return; }
      const result = alignAndScore(s.en, ans, "normal");
      const score = Math.round(result.accuracy * 100);
      const grade = gradeLabel(score);
      const ok = score >= 80;
      const willGraduate = ok && m.box >= MAX_BOX;
      addStat({ practiced: 1 });
      const words = s.en.split(/\s+/);
      let html = '<div class="target-sentence" style="font-size:20px">';
      words.forEach((w, i) => {
        const st = result.tStatus[i]?.status;
        const cls = st === "ok" || st === "near" ? "w-ok" : st === "miss" ? "w-miss" : "w-bad";
        html += `<span class="w ${cls}">${esc(w)} </span>`;
      });
      html += "</div>";
      const stat = willGraduate ? "✅ 畢業！" : ok ? `✅ 答對！再連對 ${MAX_BOX - m.box} 次畢業` : "歸回第 1 盒再練";
      $("#rdict", body).innerHTML = `
        <div class="explain mt">
          <div class="row"><b style="color:${grade.color};font-size:18px">${score} 分</b><span class="spacer"></span><span>${stat}</span></div>
          <div class="mt" style="color:var(--muted)">正解：</div>
          ${html}
          <div class="translation">${esc(s.zh)}</div>
          <div class="btn-row mt"><button class="btn btn-primary btn-block" id="rnext">${ok ? "下一題 →" : "先練下一題 →"}</button></div>
        </div>`;
      $("#rnext", body).onclick = () => (ok ? graduateAdvance(m.key) : keepAdvance(m.key));
    };
    $("#rcheck", body).onclick = check;
    $("#rans", body).addEventListener("keydown", (e) => { if (e.key === "Enter") check(); });
  }

  draw();
}
