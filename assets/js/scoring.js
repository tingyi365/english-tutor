// ============ 發音 / 句子比對與評分引擎 ============
// 純前端啟發式：以辨識文字 vs 目標句做逐詞對齊，產生高亮、分數與糾正建議。

export function normalizeWord(w) {
  return w.toLowerCase().replace(/[^a-z0-9']/g, "").replace(/^'+|'+$/g, "");
}

export function tokenize(text) {
  return text.split(/\s+/).map(normalizeWord).filter(Boolean);
}

// 常見近音 / 易混淆字組，命中時視為「接近」而非全錯，並給針對性提示
const CONFUSABLE = [
  ["thank", "tank", "sank"], ["three", "tree", "free"], ["this", "dis", "zis"],
  ["coffee", "copy", "coffi"], ["very", "berry", "wery"], ["work", "walk"],
  ["live", "leave"], ["ship", "sheep"], ["full", "fool"], ["bad", "bed"],
  ["right", "light"], ["rice", "lice"], ["read", "lead"], ["vest", "west", "best"],
  ["would", "wood"], ["where", "wear"], ["been", "bin", "ben"], ["please", "police"],
];

function areConfusable(a, b) {
  return CONFUSABLE.some((g) => g.includes(a) && g.includes(b));
}

// Levenshtein 距離（字元層級），用於判斷近似度
function lev(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++)
    for (let j = 1; j <= n; j++)
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
  return dp[m][n];
}

// 字詞相似度 0~1
function wordSim(a, b) {
  if (a === b) return 1;
  const d = lev(a, b);
  const maxLen = Math.max(a.length, b.length) || 1;
  return 1 - d / maxLen;
}

const STRICT_THRESHOLD = { lenient: 0.55, normal: 0.7, strict: 0.85 };

// 以動態規劃對齊 target 與 heard，標記每個 target 詞為 ok / near / bad / miss，
// 並偵測多唸的字 (extra)。回傳對齊結果與統計。
export function alignAndScore(targetText, heardText, strictness = "normal") {
  const T = tokenize(targetText);
  const H = tokenize(heardText);
  const thr = STRICT_THRESHOLD[strictness] || 0.7;

  const m = T.length, n = H.length;
  // 編輯距離 DP，cost：相似則低
  const dp = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(0));
  const bt = Array.from({ length: m + 1 }, () => new Array(n + 1).fill(""));
  for (let i = 1; i <= m; i++) { dp[i][0] = i; bt[i][0] = "del"; }
  for (let j = 1; j <= n; j++) { dp[0][j] = j; bt[0][j] = "ins"; }
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sim = wordSim(T[i - 1], H[j - 1]);
      const subCost = 1 - sim; // 0(完全相同)~1
      const cand = [
        { c: dp[i - 1][j - 1] + subCost, op: "sub" },
        { c: dp[i - 1][j] + 1, op: "del" },
        { c: dp[i][j - 1] + 1, op: "ins" },
      ].sort((a, b) => a.c - b.c)[0];
      dp[i][j] = cand.c; bt[i][j] = cand.op;
    }
  }

  // 回溯
  const tStatus = new Array(m).fill(null); // 每個 target 詞的狀態
  const extras = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    const op = i === 0 ? "ins" : j === 0 ? "del" : bt[i][j];
    if (op === "sub") {
      const sim = wordSim(T[i - 1], H[j - 1]);
      let st;
      if (sim >= thr) st = "ok";
      else if (sim >= 0.45 || areConfusable(T[i - 1], H[j - 1])) st = "near";
      else st = "bad";
      tStatus[i - 1] = { status: st, heard: H[j - 1], sim };
      i--; j--;
    } else if (op === "del") {
      tStatus[i - 1] = { status: "miss", heard: null, sim: 0 };
      i--;
    } else { // ins：多唸的字
      extras.unshift(H[j - 1]); j--;
    }
  }

  // 統計
  let ok = 0, near = 0, bad = 0, miss = 0;
  tStatus.forEach((s) => {
    if (!s) return;
    if (s.status === "ok") ok++;
    else if (s.status === "near") near++;
    else if (s.status === "bad") bad++;
    else if (s.status === "miss") miss++;
  });

  // 準確度分數：ok=1, near=0.6, 其餘 0；多唸字輕微扣分
  const raw = (ok + near * 0.6) / (m || 1);
  const extraPenalty = Math.min(extras.length * 0.05, 0.2);
  const accuracy = Math.max(0, Math.min(1, raw - extraPenalty));

  return {
    targetWords: T,
    tStatus,
    extras,
    stats: { ok, near, bad, miss, total: m, extras: extras.length },
    accuracy, // 0~1
  };
}

// 綜合評分：結合對齊準確度與辨識信心
export function finalScore(accuracy, confidence) {
  const conf = confidence > 0 ? confidence : 0.75; // 部分瀏覽器不給信心值
  const score = Math.round((accuracy * 0.82 + conf * 0.18) * 100);
  return Math.max(0, Math.min(100, score));
}

export function gradeLabel(score) {
  if (score >= 92) return { label: "完美！Native-like 🎉", color: "#22c55e" };
  if (score >= 80) return { label: "很棒，幾乎全對 👍", color: "#22c55e" };
  if (score >= 65) return { label: "不錯，再修幾個音", color: "#84cc16" };
  if (score >= 45) return { label: "及格，多練幾次", color: "#f59e0b" };
  return { label: "再試一次，慢慢來", color: "#f43f5e" };
}

// 產生具體的中文糾正建議（最多數條）
export function buildFeedback(result, score) {
  const fb = [];
  const { tStatus, targetWords, stats, extras } = result;

  if (score >= 80 && stats.bad === 0 && stats.miss === 0) {
    fb.push({ kind: "good", text: "發音清楚、字詞完整，繼續保持這個節奏！" });
  }

  // 漏唸
  const missed = targetWords.filter((_, idx) => tStatus[idx]?.status === "miss");
  if (missed.length) {
    fb.push({ kind: "warn", text: `漏唸了：「${missed.join("、")}」，記得每個字都要發出來。` });
  }

  // 唸錯 / 近音
  const wrong = [];
  tStatus.forEach((s, idx) => {
    if (!s) return;
    if (s.status === "bad" || s.status === "near") {
      const tip = pronunHint(targetWords[idx]);
      wrong.push(`「${targetWords[idx]}」` + (s.heard ? `（聽起來像 "${s.heard}"）` : "") + (tip ? ` ${tip}` : ""));
    }
  });
  if (wrong.length) {
    fb.push({ kind: "warn", text: `這幾個字再加強：${wrong.slice(0, 3).join("；")}` });
  }

  // 多唸
  if (extras.length) {
    fb.push({ kind: "warn", text: `多唸了 ${extras.length} 個字（${extras.slice(0, 3).join("、")}…），試著貼齊目標句。` });
  }

  if (!fb.length) {
    fb.push({ kind: "good", text: "整體不錯！點「再聽示範」對照語調與重音。" });
  }
  return fb;
}

// 針對特定單字的發音小提示（先查精選表，查無則用規則式音素提示，確保每個字都給得出建議）
export function pronunHint(w) {
  const hints = {
    thank: "注意 th 要咬舌 /θ/，不是 /t/。",
    three: "th /θ/ + 捲舌 r，別唸成 tree。",
    this: "th 用濁音 /ð/，舌頭輕觸上齒。",
    coffee: "重音在前 /ˈkɔː-fi/，尾音別吃掉。",
    very: "v 上齒咬下唇震動，別唸成 w。",
    work: "母音 /ɜːr/，和 walk /ɔː/ 不同。",
    please: "pl 連音 + 長音 /iː/。",
    would: "w 圓唇起音，l 輕帶過。",
    appreciate: "重音在第二音節 /əˈpriː-/。",
    schedule: "美音 /ˈskɛ-dʒuːl/。",
  };
  return hints[w] || phoneticHint(w);
}

// 規則式音素提示：依拼字特徵，針對華語母語者常見難點給「更細的音」建議。
// 不做真音素辨識（Web Speech 只給文字），但以拼字訊號提供可立刻照做的咬字指引。
const SILENT_LETTER = {
  know: "k 不發音", knee: "k 不發音", knife: "k 不發音", knock: "k 不發音", knew: "k 不發音",
  write: "w 不發音", wrong: "w 不發音", answer: "w 不發音",
  hour: "h 不發音", honest: "h 不發音",
  comb: "b 不發音", climb: "b 不發音", thumb: "b 不發音", lamb: "b 不發音",
  island: "s 不發音", listen: "t 不發音", castle: "t 不發音", often: "t 通常不發音",
  half: "l 不發音", talk: "l 不發音", walk: "l 不發音", calm: "l 不發音",
  could: "l 不發音", should: "l 不發音", muscle: "c 不發音",
};

function phoneticHint(w) {
  const x = (w || "").toLowerCase();
  if (!x) return "放慢、跟著慢速示範一個音節一個音節對著唸。";
  if (SILENT_LETTER[x]) return `有不發音的字母：${SILENT_LETTER[x]}，別把它唸出來。`;
  if (/^kn/.test(x)) return "kn 開頭的 k 不發音，直接從 n 開始唸。";
  if (/^wr/.test(x)) return "wr 開頭的 w 不發音，直接唸 r。";
  if (/th/.test(x)) return "th 要咬舌：清音 /θ/(think) 或濁音 /ð/(this)，別發成 /s/ 或 /d/。";
  if (/ght/.test(x)) return "gh 不發音，ght 直接收成 /t/（如 night、right）。";
  if (/tion$|sion$/.test(x)) return "字尾 -tion/-sion 唸 /ʃən/（近似「遜」），重音落在它前一個音節。";
  if (/v/.test(x)) return "v：上齒輕咬下唇並震動，別發成 w 或 b。";
  if (/r/.test(x) && /l/.test(x)) return "分清 r（捲舌、舌尖不碰口腔頂）與 l（舌尖頂上齒齦）。";
  if (/^r/.test(x)) return "r 開頭：舌頭捲起但不碰到上顎，別唸成 l。";
  if (/(ee|ea|ie)/.test(x)) return "母音拉長成 /iː/，和短音 /ɪ/（如 ship）要分清楚。";
  if (/oo/.test(x)) return "oo 有長短：food /uː/ 拉長、book /ʊ/ 短促，看字選對。";
  if (/ed$/.test(x) && x.length > 3) return "字尾 -ed：清音後唸 /t/、濁音/母音後唸 /d/、t·d 後才唸 /ɪd/。";
  if (/(s|z|x|sh|ch|ge)es$/.test(x)) return "字尾 -es 多唸成 /ɪz/（多一個音節）。";
  if (/s$/.test(x)) return "記得把字尾的 /s/ 或 /z/ 清楚發出來，別吞音。";
  if (/[bcdfgkpt]$/.test(x)) return `把字尾子音「${x.slice(-1)}」清楚收音，別整個吞掉。`;
  return "放慢、跟著慢速示範一個音節一個音節對著唸，先求準再求快。";
}

// ============ 音節拆分 + 重音標記（借鏡 ELSA Word Stress：讓初學者「看得到重音在哪」）============
// 重音是華語母語者最易忽略、卻最影響聽感的點。把字拆成音節、標出該重讀的那一節，
// 配合既有的「🔊 正常 / 🐢 慢速」示範音，把抽象的「唸對重音」變成看得見、跟得上的小步驟。

// 精選字典：app 內 SENTENCES + VOCAB 實際出現的多音節字，音節切分對學習者友善、
// 重音(stress=以 0 起算的音節索引)逐字對 data.js 的 IPA 主重音校正過，確保顯示正確。
const STRESS_DICT = {
  // —— VOCAB ——
  appreciate: { syl: ["ap", "pre", "ci", "ate"], stress: 1 },
  improve: { syl: ["im", "prove"], stress: 1 },
  confident: { syl: ["con", "fi", "dent"], stress: 0 },
  schedule: { syl: ["sched", "ule"], stress: 0 },
  available: { syl: ["a", "vail", "a", "ble"], stress: 1 },
  decision: { syl: ["de", "ci", "sion"], stress: 1 },
  recommend: { syl: ["rec", "om", "mend"], stress: 2 },
  opportunity: { syl: ["op", "por", "tu", "ni", "ty"], stress: 2 },
  convenient: { syl: ["con", "ve", "ni", "ent"], stress: 1 },
  experience: { syl: ["ex", "pe", "ri", "ence"], stress: 1 },
  necessary: { syl: ["nec", "es", "sar", "y"], stress: 0 },
  particular: { syl: ["par", "tic", "u", "lar"], stress: 1 },
  manage: { syl: ["man", "age"], stress: 0 },
  managed: { syl: ["man", "aged"], stress: 0 },
  obvious: { syl: ["ob", "vi", "ous"], stress: 0 },
  encourage: { syl: ["en", "cour", "age"], stress: 1 },
  encourages: { syl: ["en", "cour", "ag", "es"], stress: 1 },
  purpose: { syl: ["pur", "pose"], stress: 0 },
  reduce: { syl: ["re", "duce"], stress: 1 },
  familiar: { syl: ["fa", "mil", "iar"], stress: 1 },
  achieve: { syl: ["a", "chieve"], stress: 1 },
  complain: { syl: ["com", "plain"], stress: 1 },
  polite: { syl: ["po", "lite"], stress: 1 },
  suggest: { syl: ["sug", "gest"], stress: 1 },
  // —— SENTENCES 高頻多音節字 ——
  morning: { syl: ["morn", "ing"], stress: 0 },
  today: { syl: ["to", "day"], stress: 1 },
  coffee: { syl: ["cof", "fee"], stress: 0 },
  nearest: { syl: ["near", "est"], stress: 0 },
  station: { syl: ["sta", "tion"], stress: 0 },
  very: { syl: ["ver", "y"], stress: 0 },
  little: { syl: ["lit", "tle"], stress: 0 },
  slowly: { syl: ["slow", "ly"], stress: 0 },
  forward: { syl: ["for", "ward"], stress: 0 },
  seeing: { syl: ["see", "ing"], stress: 0 },
  weather: { syl: ["weath", "er"], stress: 0 },
  supposed: { syl: ["sup", "posed"], stress: 1 },
  better: { syl: ["bet", "ter"], stress: 0 },
  tomorrow: { syl: ["to", "mor", "row"], stress: 1 },
  anything: { syl: ["an", "y", "thing"], stress: 0 },
  difficulties: { syl: ["dif", "fi", "cul", "ties"], stress: 0 },
  remarkable: { syl: ["re", "mark", "a", "ble"], stress: 1 },
  ability: { syl: ["a", "bil", "i", "ty"], stress: 1 },
  explain: { syl: ["ex", "plain"], stress: 1 },
  complex: { syl: ["com", "plex"], stress: 0 },
  ideas: { syl: ["i", "de", "as"], stress: 1 },
  idea: { syl: ["i", "de", "a"], stress: 1 },
  clearly: { syl: ["clear", "ly"], stress: 0 },
  excuse: { syl: ["ex", "cuse"], stress: 1 },
  repeat: { syl: ["re", "peat"], stress: 1 },
  understand: { syl: ["un", "der", "stand"], stress: 2 },
  opening: { syl: ["o", "pen", "ing"], stress: 0 },
  whether: { syl: ["wheth", "er"], stress: 0 },
  decided: { syl: ["de", "cid", "ed"], stress: 1 },
  another: { syl: ["an", "oth", "er"], stress: 1 },
  city: { syl: ["cit", "y"], stress: 0 },
  earlier: { syl: ["ear", "li", "er"], stress: 0 },
  differently: { syl: ["dif", "fer", "ent", "ly"], stress: 0 },
  different: { syl: ["dif", "fer", "ent"], stress: 0 },
  committee: { syl: ["com", "mit", "tee"], stress: 1 },
  considering: { syl: ["con", "sid", "er", "ing"], stress: 1 },
  several: { syl: ["sev", "er", "al"], stress: 0 },
  alternative: { syl: ["al", "ter", "na", "tive"], stress: 1 },
  proposals: { syl: ["pro", "pos", "als"], stress: 1 },
  argument: { syl: ["ar", "gu", "ment"], stress: 0 },
  compelling: { syl: ["com", "pel", "ling"], stress: 1 },
  solid: { syl: ["sol", "id"], stress: 0 },
  evidence: { syl: ["ev", "i", "dence"], stress: 0 },
  learning: { syl: ["learn", "ing"], stress: 0 },
  english: { syl: ["eng", "lish"], stress: 0 },
  window: { syl: ["win", "dow"], stress: 0 },
  report: { syl: ["re", "port"], stress: 1 },
  friday: { syl: ["fri", "day"], stress: 0 },
  restaurant: { syl: ["res", "tau", "rant"], stress: 0 },
  // —— 其他高頻多音節字 ——
  about: { syl: ["a", "bout"], stress: 1 },
  because: { syl: ["be", "cause"], stress: 1 },
  people: { syl: ["peo", "ple"], stress: 0 },
  really: { syl: ["real", "ly"], stress: 0 },
  water: { syl: ["wa", "ter"], stress: 0 },
  money: { syl: ["mon", "ey"], stress: 0 },
  problem: { syl: ["prob", "lem"], stress: 0 },
  question: { syl: ["ques", "tion"], stress: 0 },
  answer: { syl: ["an", "swer"], stress: 0 },
  beautiful: { syl: ["beau", "ti", "ful"], stress: 0 },
  family: { syl: ["fam", "i", "ly"], stress: 0 },
  important: { syl: ["im", "por", "tant"], stress: 1 },
  example: { syl: ["ex", "am", "ple"], stress: 1 },
  follow: { syl: ["fol", "low"], stress: 0 },
  happen: { syl: ["hap", "pen"], stress: 0 },
  evening: { syl: ["eve", "ning"], stress: 0 },
  hello: { syl: ["hel", "lo"], stress: 1 },
  again: { syl: ["a", "gain"], stress: 1 },
  number: { syl: ["num", "ber"], stress: 0 },
  practice: { syl: ["prac", "tice"], stress: 0 },
  quickly: { syl: ["quick", "ly"], stress: 0 },
};

const VOWELS = "aeiouy";

// 啟發式拆音節（精選字典查無時的後備）：以母音群為核心切分。
// 不追求語音學完美，但能給出合理的音節數與重音位置作「參考」，且有真人示範音可對照。
export function syllabify(word) {
  const w = (word || "").toLowerCase().replace(/[^a-z]/g, "");
  if (w.length <= 3) return w ? [w] : [];
  const isV = (c) => VOWELS.includes(c);
  // 找母音群（nucleus）；word-initial 的 y 視為子音
  const nuclei = [];
  let i = 0;
  while (i < w.length) {
    if (isV(w[i]) && !(w[i] === "y" && i === 0)) {
      let j = i;
      while (j < w.length && isV(w[j])) j++;
      nuclei.push([i, j - 1]);
      i = j;
    } else i++;
  }
  // 字尾 silent e（如 -ve, -te, -se；但 -le 自成一節）→ 與前一核合併，避免多算一節
  if (nuclei.length >= 2 && w.endsWith("e")) {
    const last = nuclei[nuclei.length - 1];
    const isLe = w.length >= 2 && w[w.length - 2] === "l";
    if (last[0] === last[1] && last[0] === w.length - 1 && !isLe) nuclei.pop();
  }
  if (nuclei.length <= 1) return [w];
  // 依相鄰核之間的子音數決定切點（V-CV / VC-CV，常見雙字母不拆開）
  const cuts = [0];
  const DIGRAPH = ["th", "sh", "ch", "ph", "wh", "gh", "ck", "ng", "qu", "bl", "br", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "pl", "pr", "sl", "sm", "sn", "sp", "st", "sw", "tr", "tw"];
  for (let k = 0; k < nuclei.length - 1; k++) {
    const endV = nuclei[k][1];
    const startNextV = nuclei[k + 1][0];
    const consCount = startNextV - endV - 1;
    let cut;
    if (consCount <= 0) cut = endV + 1;
    else if (consCount === 1) cut = startNextV; // 單子音歸下一節（開音節）
    else {
      const c1 = endV + 1;
      cut = c1 + 1; // 預設第一個子音留前一節
      if (DIGRAPH.includes(w.slice(c1, c1 + 2))) cut = c1; // 雙字母整組歸下一節
    }
    cuts.push(cut);
  }
  const out = [];
  for (let k = 0; k < cuts.length; k++) {
    const start = cuts[k];
    const end = k + 1 < cuts.length ? cuts[k + 1] : w.length;
    if (end > start) out.push(w.slice(start, end));
  }
  return out.length ? out : [w];
}

// 啟發式重音位置：以字尾規則為主（這些規則相對可靠），其餘用「雙音節重前、多音節重倒數第三」近似。
function guessStress(word, syl) {
  const x = (word || "").toLowerCase();
  const n = syl.length;
  if (n <= 1) return 0;
  // -tion/-sion/-cion/-ic/-ical/-ity/-ial/-ious：主重音落在字尾音節的前一節
  if (/(tion|sion|cion|ical|ity|ety|ial|ious|graphy|ology|omy|ic)$/.test(x)) {
    return Math.max(0, n - 2);
  }
  // -ee/-eer/-ese/-ade/-oon 等強字尾：重音在最後一節
  if (/(ee|eer|ese|ade|oon|aire|esque)$/.test(x)) return n - 1;
  // 雙音節：多數名詞/形容詞重前 → 預設重第一節（最常見、對初學者最安全）
  if (n === 2) return 0;
  // 多音節預設倒數第三（antepenultimate，英語常態）
  return Math.max(0, n - 3);
}

// 對外：取得某字的「音節 + 重音」資訊；單音節 / 過短 → 回 null（不顯示，免增負擔）。
export function syllableStress(word) {
  const w = normalizeWord(word || "");
  if (!w) return null;
  const hit = STRESS_DICT[w];
  if (hit) {
    const stress = Math.min(Math.max(hit.stress, 0), hit.syl.length - 1);
    return { syllables: hit.syl.slice(), stress, source: "dict" };
  }
  const syl = syllabify(w);
  if (syl.length < 2) return null; // 單音節不需重音指引
  return { syllables: syl, stress: guessStress(w, syl), source: "guess" };
}

// ============ 句子層級「句重音 / 節奏」標記（借鏡 ELSA Sentence Stress：教使用者該重讀哪幾個字）============
// 英文是「重音節拍(stress-timed)」語言：實詞(content words)唸重、長、清楚，虛詞(function words)弱化、快、含糊。
// 華語是「音節節拍(syllable-timed)」——每個字平均出力，所以華語母語者最常見的不道地點，就是「每個字都唸一樣重」。
// 把句子裡「該重讀的實詞」標大、把「該弱化的虛詞」標灰，初學者一眼看到節奏在哪，跟著唸就自然有英文的抑揚＝更容易學、更聽得懂。

// 虛詞(function words)：冠詞/代名詞/介系詞/連接詞/助動詞 — 句中通常弱化、不重讀。
// 不在此表的字一律視為實詞(名詞/動詞/形容詞/副詞/疑問詞/數詞/否定詞)→ 重讀。
const FUNCTION_WORDS = new Set([
  // 冠詞
  "a", "an", "the",
  // 人稱 / 所有格代名詞
  "i", "you", "he", "she", "it", "we", "they",
  "me", "him", "her", "us", "them",
  "my", "your", "his", "its", "our", "their",
  "mine", "yours", "hers", "ours", "theirs",
  // be / 助動詞 / 情態（句中通常弱化）
  "am", "is", "are", "was", "were", "be", "been", "being",
  "do", "does", "did", "have", "has", "had",
  "will", "would", "shall", "should", "can", "could", "may", "might", "must",
  // 連接詞 / 從屬詞
  "and", "or", "but", "nor", "so", "yet", "as", "if", "than", "that", "whether",
  // 介系詞（核心、句中常弱化）
  "in", "on", "at", "to", "of", "for", "with", "from", "by",
  "into", "about", "than",
  // 其他常見虛詞
  "there",
]);

// 判斷單一字（含縮寫/標點）是否為「弱化的虛詞」。否定詞(n't)永遠重讀。
export function isFunctionWord(raw) {
  let w = (raw || "").toLowerCase().replace(/[^a-z'’]/g, "").replace(/^['’]+|['’]+$/g, "");
  if (!w) return false;
  if (/n['’]?t$/.test(w)) return false;        // don't / can't / won't … 否定要重讀
  w = w.replace(/['’](s|re|ve|ll|d|m)$/, "");   // it's→it、they're→they、i'm→i
  return FUNCTION_WORDS.has(w);
}

// 對外：把句子標成「逐字 + 是否重讀」。stressed=true 代表實詞(該唸重)。
export function sentenceStress(text) {
  return (text || "").split(/\s+/).filter(Boolean).map((word) => ({
    word,
    stressed: !isFunctionWord(word),
  }));
}

// 從評分結果挑出需要重點練的字（唸錯/近音/漏唸），附音素提示，供「逐音 drill」用。
// 去重、最多 4 個，避免一次給太多造成壓力（小批次＝容易學）。
export function wordDrills(result) {
  const { tStatus, targetWords } = result;
  const out = [];
  tStatus.forEach((s, idx) => {
    if (!s) return;
    if (s.status === "bad" || s.status === "near" || s.status === "miss") {
      const w = targetWords[idx];
      if (!w || out.some((o) => o.word === w)) return;
      out.push({ word: w, status: s.status, heard: s.heard || null, tip: pronunHint(w), syl: syllableStress(w) });
    }
  });
  return out.slice(0, 4);
}
