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

// 針對特定單字的發音小提示
function pronunHint(w) {
  const hints = {
    thank: "注意 th 要咬舌 /θ/，不是 /t/。",
    three: "th /θ/ + 捲舌 r，別唸成 tree。",
    this: "th 用濁音 /ð/，舌頭輕觸上齒。",
    coffee: "重音在前 /ˈkɔː-fi/，尾音別吃掉。",
    very: "v 上齒咬下唇震動，別唸成 w。",
    work: "母音 /ɜːr/，和 walk /ɔː/ 不同。",
    please: "pl 連音 + 長音 /iː/。",
    would: "w 圓唇起音，l 輕帶過。",
    coffee_: "",
    appreciate: "重音在第二音節 /əˈpriː-/。",
    schedule: "美音 /ˈskɛ-dʒuːl/。",
  };
  return hints[w] || "";
}
