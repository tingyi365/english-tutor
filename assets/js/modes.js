// ============ 各學習模式 ============
import { SENTENCES, VOCAB, DIALOGUES, GRAMMAR } from "./data.js";
import { speak, stopSpeaking, createRecognizer, speechSupport } from "./speech.js";
import { alignAndScore, finalScore, gradeLabel, buildFeedback, tokenize, wordDrills } from "./scoring.js";
import { addStat, getStrictness, getDaily, getStreak, getDailyGoal, addMistake, removeMistake, getMistakes, getMistakeCount, promoteMistake, demoteMistake, MAX_BOX, getVocabSrs, getVocabBox, rateVocab, getStreakBadges, STREAK_MILESTONES, navigate } from "./app.js";

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
        <div class="streak-badges">
          ${badges.map((b) => `<span class="sbadge" title="連續 ${b.n} 天里程碑">${b.ico}<i>${b.n}</i></span>`).join("")}
          ${nextMilestone ? `<span class="sbadge sbadge-next" title="下一個里程碑">🎯<i>${nextMilestone}天</i></span>` : ""}
        </div>` : ""}
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
  const grid = $("#modeGrid", view);
  modes.forEach((m) => {
    const c = el(`<div class="mode-card"><div class="mc-ico">${m.ico}</div><h3>${m.t}</h3><p>${m.d}</p></div>`);
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

  // 停掉錄音、把錄到的音檔轉成可回放的 URL；回傳該 URL（無錄音則 null）
  function finishRecording() {
    if (!recHandle) return Promise.resolve(null);
    const h = recHandle; recHandle = null;
    return h.stop().then((blob) => {
      if (!blob) return null;
      if (recordedUrl) URL.revokeObjectURL(recordedUrl);
      recordedUrl = URL.createObjectURL(blob);
      return recordedUrl;
    }).catch(() => null);
  }

  function clearRecording() {
    if (recHandle) { try { recHandle.stop(); } catch (_) {} recHandle = null; }
    if (myAudio) { try { myAudio.pause(); } catch (_) {} myAudio = null; }
    if (recordedUrl) { URL.revokeObjectURL(recordedUrl); recordedUrl = null; }
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
            <button class="btn btn-mic" id="micBtn" ${speechSupport.stt ? "" : "disabled"}>🎙️ 開口跟讀</button>
          </div>
          <div class="read-hint">🎯 按「聽示範」時，老師唸到哪個字就會<b>點亮哪個字</b> — 跟著亮起來的字一起唸，最容易上口。</div>
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
    $("#prevBtn", view).onclick = () => { clearRecording(); idx = (idx - 1 + SENTENCES.length) % SENTENCES.length; persist(); draw(); };
    $("#nextBtn", view).onclick = () => { clearRecording(); idx = (idx + 1) % SENTENCES.length; persist(); draw(); };
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
    if (!box) { speak(text, { rate }); return; }
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
    speak(text, { rate, onWord }).then(clear);
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
        finishRecording().then((myUrl) => {
          if (!finalText) { heard.innerHTML = `<span style="color:#fcd34d">沒聽清楚，再試一次 🙂</span>`; return; }
          heard.innerHTML = `你說：<b>${esc(finalText)}</b>`;
          evaluate(finalText, conf, myUrl);
        });
      },
    });
    recognizer.start();
    // best-effort 錄音：在 recognizer 啟動後才開，確保即使錄音失敗也不影響既有評分
    if (recordedUrl) { URL.revokeObjectURL(recordedUrl); recordedUrl = null; }
    startRecording().then((h) => { recHandle = h; }).catch(() => {});
  }

  function evaluate(heardText, conf, myUrl) {
    const s = SENTENCES[idx];
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
        </div>`);
      const playMine = () => {
        stopSpeaking();
        if (myAudio) { try { myAudio.pause(); } catch (_) {} }
        myAudio = new Audio(myUrl);
        myAudio.play().catch(() => {});
      };
      $(".cmp-model", cmpCard).onclick = () => { if (myAudio) { try { myAudio.pause(); } catch (_) {} } readAlong(s.en); };
      $(".cmp-mine", cmpCard).onclick = playMine;
      resBox.append(cmpCard);
    }

    // 逐音 drill：把唸錯/近音/漏唸的字逐一列出，給「更細的音」提示＋可重聽單字示範(正常/慢速)，
    // 讓回饋從「診斷」變「能立刻照做的修正」（借鏡 ELSA：鎖定錯的音、無限重聽正確示範）。
    const drills = wordDrills(result);
    if (drills.length) {
      const stLabel = { bad: "再加強", near: "接近了", miss: "漏唸" };
      const drillCard = el(`
        <div class="card mt drill-card">
          <div class="drill-head">🎯 重點練這幾個音 — 點 🔊 聽<b>單字正確示範</b>，跟著慢慢唸到順為止</div>
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
            </div>
          </div>`);
        $(".drill-say", item).onclick = () => speak(d.word);
        $(".drill-slow", item).onclick = () => speak(d.word, { rate: 0.5 });
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
  let dIdx = 0, turn = 0, recognizer = null, listening = false;

  function draw() {
    const d = DIALOGUES[dIdx];
    view.innerHTML = "";
    view.append(el(`
      <div>
        ${micWarning()}
        <div class="lesson-head">
          <div class="ttl">💬 情境對話</div>
          <span class="pill pill-lv">${dIdx + 1}/${DIALOGUES.length}</span>
        </div>
        <div class="card">
          <b>${esc(d.title)}</b>
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
    $("#switchBtn", view).onclick = () => { dIdx = (dIdx + 1) % DIALOGUES.length; draw(); };
    nextTurn();
  }

  function pushBubble(side, text, sub) {
    const chat = $("#chat", view);
    chat.append(el(`<div class="bubble b-${side}">${esc(text)}${sub ? `<small>${esc(sub)}</small>` : ""}</div>`));
    chat.lastElementChild.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function nextTurn() {
    const d = DIALOGUES[dIdx];
    if (turn >= d.turns.length) {
      $("#convCtl", view).innerHTML = `<div class="card center mt">🎉 對話完成！你完成了「${esc(d.title)}」。<div class="btn-row mt"><button class="btn btn-primary btn-block" id="againConv">再練一次</button></div></div>`;
      $("#againConv", view).onclick = draw;
      addStat({ practiced: 1 });
      return;
    }
    const t = d.turns[turn];
    pushBubble("ai", t.ai);
    setTimeout(() => speak(t.ai), 200);
    renderControls(t);
  }

  function renderControls(t) {
    const ctl = $("#convCtl", view);
    ctl.innerHTML = `
      <div class="suggest-line">💡 建議這樣回答：<b>${esc(t.hint)}</b>（${esc(t.zh)}）</div>
      <div class="btn-row">
        <button class="btn btn-ghost" id="hearHint">🔊 聽建議句</button>
        <button class="btn btn-mic" id="speakBtn" ${speechSupport.stt ? "" : "disabled"}>🎙️ 換我說</button>
        <button class="btn btn-ghost" id="skipBtn">略過 →</button>
      </div>
      <div class="heard mt" id="convHeard"><span class="muted">點「換我說」開口回應…</span></div>`;
    $("#hearHint", ctl).onclick = () => speak(t.hint);
    $("#skipBtn", ctl).onclick = () => { turn++; nextTurn(); };
    $("#speakBtn", ctl).onclick = () => speakTurn(t);
  }

  function speakTurn(t) {
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
        turn++;
        setTimeout(nextTurn, 600);
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
  // 弱點優先：沒評過(box 0)與「不熟」(box 1) 的單字排最前面先複習，「認識」的排後面（Leitner）
  const order = VOCAB.map((_, idx) => idx)
    .sort((a, b) => getVocabBox(VOCAB[a].word) - getVocabBox(VOCAB[b].word));
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
