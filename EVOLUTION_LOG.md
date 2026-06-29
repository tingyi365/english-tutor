# ENG-TUTOR 自進化台帳

每輪開頭先讀此檔，結尾必 append 一筆。

## 正式線上站（往後都驗這個）
- **https://english-tutor-ai.pages.dev**（Cloudflare Pages 專案名 `english-tutor-ai`，乾淨根網址，2026-06-29 第 3 輪遷移到此）
- 註：`english-tutor.pages.dev` 為全域唯一名、已被外部帳號（Voice Recorder）永久佔用，技術上不可取得 → 改用最貼近品牌的乾淨可用名 `english-tutor-ai`。
- legacy alias：`https://english-tutor-e1l.pages.dev`（舊專案 `english-tutor`）保留可用、每輪一併部署不使其壞；驗證以新網址為準。
- GitHub repo：`tingyi365/english-tutor`（main 分支）
- 部署指令（主）：`npx wrangler pages deploy . --project-name=english-tutor-ai --branch=main --commit-dirty=true`，再對 `--project-name=english-tutor` 跑一次更新 legacy alias。

---

## 輪次紀錄

### 第 1 輪 — 2026-06-29（第 0 優先上線 + 內容擴充）
**第 0 優先：Cloudflare Pages 上線 ✅**
- 用本機已 OAuth 登入的 wrangler 部署成功，正式網址 = `https://english-tutor-e1l.pages.dev`。
- 驗證：HTTP 200、Chrome headless 渲染首頁（brand/mode-card 正常）無 JS error。
- 已推 TG 給主腦（chat 845969871，msg 18618）告知新網址。

**本輪進化：學習內容擴充近一倍（純資料層，最低風險）**
- 改動檔：`assets/js/data.js`（僅資料、純加法，可回退）。
- 句子 SENTENCES：13 → 23（新增初/中/進階各數句，含倒裝、條件句等）。
- 單字 VOCAB：12 → 22（manage/obvious/encourage/purpose/reduce/familiar/achieve/complain/polite/suggest）。
- 情境對話 DIALOGUES：3 → 5（新增「餐廳訂位」「看醫生」）。
- 文法 GRAMMAR：8 → 15（補 be 動詞、可數複數、since/for、should、假設語氣、過去完成式、would rather）。

**驗證證據**
- 本機 `node --input-type=module` 匯入 data.js：4 陣列計數正確、欄位完整性檢查全綠（0 issues）。
- git commit a51f997 + push main + wrangler deploy 成功。
- 線上 `data.js` 已更新（新字串 餐廳訂位/看醫生/encourage 皆在）。
- Chrome headless 開 `#grammar`：顯示「/15」（新題庫生效）、gap-sentence/opt-grid 正常渲染、無 JS error。

**下一輪 backlog 想法（優先序建議）**
1. 學習持久化：每日連續天數 streak + 錯題本（文法/聽寫答錯自動收集，localStorage）。
2. 間隔重複(SRS)：單字卡加「認識/不熟」按鈕，依 Leitner 排序複習。
3. 跟讀模式：加「逐詞高亮跟著朗讀」（speak 的 onWord boundary 已備好，尚未用於高亮）。
4. PWA：加 manifest.json + service worker，可安裝離線（純前端、低風險）。
5. 內容再擴充：情境對話加分支選項、文法題加圖解；句子可加「商務/旅遊」主題分類。
6. 無障礙：mode-card 加 role/tabindex/鍵盤操作；對比度檢查。

[小組長 06:48] 督導：站健康(200)、僅第1輪未空轉；但首輪漏做北極星研究、且使用者親指「每日目標」尚未動 → 已在 eng_tutor_evolve_instruction.md 置頂釘「下一輪硬性鎖定每日目標MVP+先做必做研究」導正，靜默不擾人。

---

### 第 2 輪 — 2026-06-29（每日目標 + 連續天數 streak 上線｜使用者親指 backlog #1）
**北極星研究（必做）**
- WebSearch「Duolingo daily goal streak design / habit / gamification UX」。結論借鏡：Duolingo 把抽象的「學語言」拆成**每天一個低門檻小目標**＋**可見的連續天數(streak)**，用 Hooked 迴圈(觸發→低摩擦行動→可變獎勵→投入)與**損失趨避**(辛苦累積的連續天數不想斷)驅動「每天打開」。可落地點子：①每日目標進度條＋達標即時正向回饋 ②連續天數火焰圖示 ③門檻要低（新手選輕鬆檔，先養成習慣再加量）。
- 來源：digia.tech / 925studios.co / medium(@salamprem49 streak breakdown) 等。

**本輪進化：每日目標 + 連續天數（習慣養成層，提升「持續力＝容易學」）**
- 改動檔：`app.js`(+每日/streak 邏輯與 export)、`modes.js`(首頁每日卡)、`style.css`(每日卡樣式)、`index.html`(設定加每日目標選擇)。純加法、低風險、可回退。
- 首頁新增「每日目標卡」：🔥 連續天數（火焰，0 天時灰階、>0 動畫）＋ 今日目標進度條 ＋ 鼓勵文案；達標顯示「🎉 今日目標達成！」與「明天回來把連續變 N+1 天」。
- 每日目標可在設定選：輕鬆 5／標準 10／認真 20（**降門檻**：新手先選輕鬆養成習慣）。
- streak 規則採**最低門檻**：任何學習動作（練習/看單字皆算）當天首次出現即接續，只要每天出現就不斷連 → 最容易維持，最符「容易學」。
- localStorage 持久化（daily / streak）；「清除學習進度」一併清 daily/streak。

**驗證證據**
- git 4d26e09(功能)+541db79(gitignore .wrangler 誤入快取，僅 account id 非金鑰) push main + wrangler deploy 成功(f7fabf4b)。
- 線上 `https://english-tutor-e1l.pages.dev` HTTP 200；app.js 含 bumpDaily/getStreak、style.css 含 daily-card、index.html 含 goalSelect（皆線上實證 True）。
- Chrome headless 渲染首頁：DOM 含 `daily-card` 與 `mode-card`（renderHome 全程跑完才會有 → 無致命 JS error）。
- streak/daily 邏輯多天模擬 4/4 PASS：同日不重複計+daily累加、連續日+1、跨月連續、中斷重置且 best 保留。

**下一輪 backlog 想法**
1. 錯題本：文法/聽寫答錯自動收集到 localStorage，首頁「複習錯題」入口（接續持久化主線）。
2. 間隔重複(SRS)：單字卡加「認識/不熟」，依 Leitner 排序複習。
3. 跟讀逐詞高亮（speak onWord boundary 已備）。
4. PWA：manifest + service worker，可安裝離線。
5. 達標慶祝動畫升級（紙花/音效）強化正向回饋；連續天數里程碑徽章(3/7/30 天)。
6. 內容再擴充：商務/旅遊主題句子分類、對話分支選項。

[小組長 07:1x] 督導：站健康(200)、每日目標/streak 已線上實證(app.js bumpDaily/getStreak/goalSelect)、第2輪確實做了北極星研究+落實使用者親指#1、無空轉 → 已移除已完成的硬性指定區塊、改釘下一輪「錯題本/一鍵複習」為持久化主線導正，靜默不擾人。

---

### 第 3 輪 — 2026-06-29（第 0 優先：網址遷移 english-tutor-ai｜錯題本+一鍵複習上線）
**第 0 優先：Cloudflare Pages 乾淨網址遷移 ✅**
- 使用者指定要 `english-tutor.pages.dev`，但該名為**全域唯一名、已被外部帳號的「Voice Recorder」永久佔用**（curl 實證該網址回傳他站內容），技術上不可取得（`*.pages.dev` 全域唯一，非權限問題）。探測 englishtutor / speak-english / english-coach 亦被占（200）。
- 解法：建新 Pages 專案 `english-tutor-ai`，分得**乾淨無後綴**網址 `https://english-tutor-ai.pages.dev`（最貼品牌的可用名）。舊 `english-tutor-e1l` 保留為 legacy alias，本輪一併部署不使其壞。
- 已同步更新 instruction + 本 log 的網址與部署指令（主→ english-tutor-ai，再→ english-tutor 更新 alias）。

**北極星研究（必做）**
- WebSearch「Duolingo mistakes review / spaced repetition / 降低門檻」。借鏡：①答錯後**課末重練錯題**＋間隔複習 ②強調**主動回憶 retrieval**（從記憶產出答案 > 被動看），有效鞏固 ③**小批次**複習降低壓力。落地點子：錯題自動收集→一鍵只練錯題、複習採「再作答」主動回憶、答對才畢業、一次一題低壓力。
- 來源：blog.duolingo.com/spaced-repetition-for-learning、geiger-wolf.com/archives/24、scrimmage.co 心理學分析。

**本輪進化：錯題本 + 一鍵複習（持久化主線，降低「重學摩擦」＝容易學）**
- 改動檔：`assets/js/app.js`(錯題本 store + review 路由 + reset 清錯題)、`assets/js/modes.js`(文法/聽寫收集錯題 + 首頁複習入口 + renderReview)、`assets/css/style.css`(review-card 樣式)。純加法、低風險、可回退。
- 收集：文法答錯 → 自動入錯題本（key `g{i}`）；聽寫 <60 分 → 入錯題本（key `d{idx}`）；同題不重複。
- 首頁：有錯題時顯示「📒 複習錯題 N 題」入口卡（無錯題自動隱藏，不增負擔）。
- 複習模式 `#review`：**一次一題**（小批次低壓力），文法/聽寫皆以「再作答」**主動回憶**；**答對才畢業**（移出錯題本），答錯輪到隊尾續練；全畢業顯示鼓勵空狀態。
- 「清除學習進度」一併清錯題本。

**驗證證據**
- 線上 `https://english-tutor-ai.pages.dev` HTTP 200、title/data.js/app.js streak 皆線上實證。
- Chrome headless **端到端真機**（375px 手機）全綠、**0 console error**：文法答錯→錯題本存 g0(collected=true)→首頁出現「複習錯題 2 題」卡→進複習答對→g0 畢業(「✅ 答對，這題畢業！」)→聽寫複習打正解→全部畢業→顯示空狀態。
- 舊 alias `english-tutor-e1l` 同步部署、仍 200。

**下一輪 backlog 想法**
1. 間隔重複(SRS) 弱點優先：認識/不熟回饋 + Leitner 盒排序；錯題「答對 N 次才畢業」精熟門檻。
2. 跟讀逐詞高亮（speak onWord boundary 已備）。
3. PWA：manifest + service worker，可安裝離線。
4. 達標慶祝動畫/里程碑徽章(3/7/30 天)。
5. 內容再擴充：商務/旅遊主題分類、對話分支選項。

[小組長 07:51] 督導：兩站皆健康(english-tutor-ai 與 legacy e1l 皆 HTTP 200，app.js 線上實證含 bumpDaily/getStreak/錯題本 review 全到、檔案完整非錯誤頁)；第1-3輪逐輪真朝「容易學」前進(內容→每日目標+streak(使用者親指#1)→錯題本+一鍵複習)，每輪都做北極星研究、無空轉無偏離、每日目標已完成；導正檔頂端硬性指定(第4輪 SRS 弱點優先複習)仍對應未跑輪次、未過時、方向正確 → 不需改 backlog，靜默不擾人。

---

### 第 4 輪 — 2026-06-29（SRS Leitner 間隔重複：弱點優先 + 精熟畢業｜小組長硬性指定）
**北極星研究（必做）**
- WebSearch「Anki / Leitner spaced repetition box system weak-cards-first mastery」。借鏡 Leitner(1972)：①卡片分 3–5 盒，**答對升一盒、答錯降回前面盒**；②**難卡複習更頻繁、熟卡更少**（弱點優先是效率核心）；③Anki 承襲 SM-2「專注你覺得難的卡」。落地 3 點子：①錯題本導入 3 盒 Leitner，連對到頂盒才畢業（=答對 N 次精熟門檻）②複習佇列依盒號升序＝最不熟先練 ③單字卡加「認識/不熟」，弱字優先排前。
- 來源：en.wikipedia.org/wiki/Leitner_system、e-student.org/leitner-system、growexx.com Anki algorithm。

**本輪進化：錯題本 + 單字卡 導入 Leitner 間隔重複（精熟＋弱點優先＝更有效率地容易學）**
- 改動檔：`app.js`(Leitner 盒邏輯：promoteMistake/demoteMistake/MAX_BOX、vocabSrs+rateVocab/getVocabBox、reset 清 vocabSrs)、`modes.js`(renderReview 改盒升序弱點優先+精熟畢業+熟練度●○、renderFlashcard 加認識/不熟+弱字優先排序)、`style.css`(mastery/rate 樣式)。純加法、低風險、可回退、舊資料相容(無 box 視為第1盒)。
- 錯題本精熟門檻：答錯歸第 1 盒、答對升一盒，**連續答對到頂盒(MAX_BOX=3)才畢業**（取代原「答對一次就畢業」）；複習頁顯示「熟練度 ●○○」與「再連對 N 次畢業」。
- 弱點優先：複習佇列依盒號升序排（最不熟的第 1 盒排最前先練），lastKey 防同題連兩次。
- 單字卡：背面新增「👍 認識了 / 🤔 還不熟」回饋（Leitner），沒評過(🆕新字)/不熟的弱字**優先排到前面**先複習；卡面顯示熟練度標籤＋●○點。

**驗證證據**
- 本機 Leitner 規則單元測試 **14/14 PASS**（升盒/畢業/降盒/弱點排序/同題不重複/舊資料相容/單字盒）。
- 線上 `https://english-tutor-ai.pages.dev` HTTP 200；app.js(promoteMistake/rateVocab/MAX_BOX)、modes.js(masteryDots/弱點排序/rateKnown)、style.css(btn-known) 皆線上實證 True。
- Chrome headless **端到端真機**(375px 手機) **15/15 PASS、0 console error**：文法答錯→錯題本 g0 box=1→首頁複習卡→複習頁熟練度●○○→連續答對 box1→2→3→第3次畢業移出(精熟)→空狀態鼓勵；複習答錯 box2→1(降盒)；單字卡認識→box1、不熟→box1、已熟(box3)字不排第一(弱字優先，第一張=confident)。
- legacy alias `english-tutor-e1l` 同步部署、仍 200。

**下一輪 backlog 想法**
1. 跟讀逐詞高亮（speak onWord boundary 已備）。
2. PWA：manifest + service worker，可安裝離線。
3. 達標慶祝動畫/里程碑徽章(3/7/30 天)。
4. 首次進站 onboarding 引導（降門檻）。
5. 內容再擴充：商務/旅遊主題分類、對話分支選項。
6. SRS 進階：依盒設「下次複習日」時間間隔（目前是同 session 內弱點優先排序，未做跨日排程）。

---

### 第 5 輪 — 2026-06-29（首次進站 onboarding 引導｜降低新手第一次的門檻）
**北極星研究（必做）**
- WebSearch「language learning app onboarding first-time UX lower barrier Duolingo/Babbel beginner」。借鏡 Duolingo onboarding：①**價值先行**——先讓人體驗、把註冊延後（我們本來就免註冊，等同把第一道門檻直接砍掉）②**親切歡迎降低焦慮**（吉祥物迎接，讓新手放鬆、敢開始）③**請使用者設一個低門檻的目標 + 問動機**，再放進主畫面開始 bite-sized 課程。落地 3 點子：①第一次進站用親切歡迎卡降低陌生感 ②引導裡直接設「每天小目標」並**預設推薦輕鬆檔**（先養成習慣）③第三步用一句話交代 5 種方式怎麼開始，立刻能動手。
- 來源：goodux.appcues.com/blog/duolingo-user-onboarding、babbel.com/compare-best-language-learning-apps、researchgate（Babbel vs Duolingo UX 比較）。

**本輪進化：首次進站 onboarding 三步引導（降門檻＝容易學）**
- 改動檔：`app.js`（+`showOnboarding/hasOnboarded`、init 首次自動開、設定面板「重看新手導覽」掛勾）、`index.html`（設定加「🧭 重看新手導覽」鈕）、`style.css`（`.onb-*` 引導樣式）。純加法、低風險、可回退（只多一個 localStorage flag `onboarded`）。
- 第 1 步歡迎：👋 親切自介「逐字糾正、免註冊免費」降低新手焦慮與陌生感。
- 第 2 步設每天目標：3 檔可選，**預設推薦「輕鬆 5」**並標「推薦新手」徽章（降門檻、先養成習慣）；選擇即時 highlight，完成時寫入 `dailyGoalLevel`。
- 第 3 步怎麼開始：一句話交代 5 種學習方式 + 鼓勵連續天數，按「開始學習 →」收掉直接進首頁。
- 只第一次自動出現（`onboarded` flag）；非最後一步可「略過」；設定面板可「重看新手導覽」隨時重開。

**驗證證據**
- 本機 `node --check` app.js / modes.js 語法全綠。
- 本機 Chrome 真機（puppeteer-core 驅動真 Chrome、375px 手機）端到端 **17/17 PASS、0 console error**：首訪出現引導→step1 歡迎→3 點進度點→step2 三檔目標→選輕鬆 highlight→step3 開始學習鈕（最後步隱藏略過）→完成 overlay 移除＋`onboarded=1`＋`dailyGoalLevel=easy`＋首頁每日卡顯示 0/5＋5 張 mode-card→重整不再出現→設定「重看新手導覽」可重開。
- 線上部署後 `https://english-tutor-ai.pages.dev` HTTP 200、線上實證 app.js 含 `showOnboarding`、index.html 含 `replayOnboarding`、style.css 含 `.onb-card`；legacy alias `english-tutor-e1l` 同步部署仍 200。

**下一輪 backlog 想法**
1. 跟讀逐詞高亮（speak onWord boundary 已備）。
2. PWA：manifest + service worker，可安裝離線。
3. 達標慶祝動畫/里程碑徽章(3/7/30 天)。
4. SRS 進階：依盒設「下次複習日」跨日排程。
5. 內容再擴充：商務/旅遊主題分類、對話分支選項。
6. onboarding 進階：第 2 步可加「問學習動機（旅遊/工作/考試）」並據此推薦起始模式。

[小組長 08:5x] 督導：兩站皆健康(english-tutor-ai 與 legacy e1l 皆 HTTP 200、size 一致 3780、app.js/modes.js/data.js/style.css 皆 200，onboarding(showOnboarding/hasOnboarded)+SRS(promoteMistake/rateVocab) 線上實證)；第5輪確實落實上一輪硬性指定(首次進站 onboarding 三步引導)，做了北極星研究+17/17 真機 0 console error、無空轉無偏離。發現一個空轉風險：evolve_instruction 的🔴硬性指定區塊在 onboarding 完成後**未被移除**，仍 pin onboarding 給下一輪，會誘導 round 6 重做=空轉。→ 導正動作：移除已完成的 onboarding 硬性指定，改釘下一輪「即時正向回饋：達標慶祝動畫 + 連續天數里程碑徽章(3/7/30 天)」為硬性指定(延續第2輪北極星研究點名的 Hooked 可變獎勵，補足目前缺的成就感/動力持續這一摩擦點)，並重申禁止漂移到 SRS 跨日排程/純內容擴充、跟讀逐詞高亮降為次選。靜默不擾人。

[小組長 08:2x] 督導：兩站皆健康(english-tutor-ai 與 legacy e1l 皆 HTTP 200)；第4輪確實落實導正檔硬性指定(SRS Leitner 弱點優先+精熟畢業)，做了北極星研究、14/14單測+15/15真機0 console error、無空轉無偏離。但觀察到方向風險：第1–4輪持續往「持續/精熟」做深(streak→錯題本→SRS)，新使用者首次落地仍無任何引導＝目前最大「不容易上手」摩擦點，而 backlog 殘留「SRS跨日排程」會誘導再往 power-user 深掘、偏離北極星。→ 導正動作：已移除第4輪已完成的硬性指定區塊，改釘第5輪「首次進站 onboarding 引導(降門檻)」為硬性指定(首次偵測+極簡導覽+可跳過+直送第一個30秒練習)，明令勿跳 SRS跨日排程/純內容擴充。靜默不擾人。

---

### 第 6 輪 — 2026-06-29（即時正向回饋：達標慶祝動畫 + 連續天數里程碑徽章｜小組長 08:5x 硬性指定）
**北極星研究（必做）**
- WebSearch「Duolingo read-along / 即時正向回饋 / 慶祝動畫 gamification」。借鏡 Duolingo：①達成「那一刻」立刻給看得見的慶祝（彩帶/音效），把抽象努力變即時成就感（Hooked 可變獎勵）②連續天數里程碑(3/7/30 天)頒徽章＝損失趨避+收集慾，讓人想明天再回來③獎勵要在「達標瞬間」觸發、不打擾平常操作。落地點子：①剛好達標的那一刻彈彩帶+鼓勵吐司(每天只一次) ②連續天數踩到 3/7/14/30/60/100 天頒里程碑徽章+專屬圖示 ③首頁常駐展示已得徽章+下一個里程碑目標。
- 來源：blog.duolingo.com（streak/沉浸式回饋）、digia.tech / 925studios.co（Hooked 可變獎勵、損失趨避，第 2 輪同源延伸）。
- ※小組長 08:5x 已將本輪硬性指定改為「即時正向回饋」，並把「跟讀逐詞高亮」降為次選。

**本輪進化：即時正向回饋（補足目前缺的「成就感／動力持續」摩擦點＝更容易持續學）**
- 改動檔：`app.js`(達標慶祝 showCelebration/fireConfetti、bumpDaily 達標瞬間觸發+celebrated 旗標、STREAK_MILESTONES 里程碑頒徽 getStreakBadges/badgeIcon、reset 清 streakBadges)、`modes.js`(renderHome 顯示已得里程碑徽章+下一個目標)、`style.css`(.confetti 彩帶/.celebrate-toast 慶祝吐司/.sbadge 徽章；含 prefers-reduced-motion 降載)。純加法、低風險、可回退。
- **達標慶祝**：今日練習數「剛好跨過每日目標的那一刻」彈彩帶(36 顆 CSS 落下)+「🎉 今日目標達成！」鼓勵吐司；`daily.celebrated` 旗標保證每天只慶祝一次，不重複打擾。
- **里程碑徽章**：連續天數踩到 3/7/14/30/60/100 天且未拿過 → 頒徽章(🔥⭐💎👑🏆💯)+里程碑慶祝吐司；徽章存 localStorage `streakBadges`。
- **首頁常駐展示**：每日卡底部顯示已得徽章＋「🎯 下一個里程碑」目標(看得見下一個收集目標→動力)。
- 慶祝層 pointer-events:none 不擋操作；尊重 prefers-reduced-motion(關閉彩帶動畫)。
- 順帶(次選、已驗證低風險)：**跟讀逐詞高亮**——跟讀糾音「聽示範/慢速」時，老師唸到哪個字就點亮哪個字(karaoke read-along)，把聲音對到文字，降低初學者跟不上的摩擦（speak 的 onWord boundary 落實，charIndex→詞 對應）。

**驗證證據**
- 本機 charIndex→詞 對應單元測試 **14/14 PASS**。
- 本機真 Chrome(puppeteer-core 驅動，375px 手機)端到端 **12/12 PASS、0 console error**：
  - 達標：做到 4/5 不慶祝→第 5 練剛好達標→慶祝吐司(含「目標達成」)+36 顆彩帶+`daily.celebrated=true`→續練第 6 不重複觸發。
  - 里程碑：種子連續 2 天(昨天)→今天首練→連續 3 天→里程碑吐司(含「連續學習 3 天」)+`streakBadges=[3]`→首頁顯示徽章「🔥3 / 🎯7天」。
  - 跟讀高亮回歸：聽示範時高亮逐字由左到右移動(亮過 6 詞)、唸完清除。
- 線上 `https://english-tutor-ai.pages.dev` 部署後 HTTP 200、線上實證(待部署後補)；legacy alias `english-tutor-e1l` 一併部署不使其壞。

**下一輪 backlog 想法**
1. PWA：manifest + service worker，可安裝離線（降門檻：像 app 一樣一鍵打開）。
2. 慶祝升級：里程碑徽章可點開看「成就牆」、達標可選輕量音效（尊重靜音）。
3. onboarding 進階：第 2 步問學習動機（旅遊/工作/考試）並推薦起始模式。
4. 內容再擴充：商務/旅遊主題分類、對話分支選項（初學者友善、難度分級）。
5. 發音回饋升級：更細音素提示、可重聽範例、語速微調 UI。

[小組長 09:2x] 督導：兩站皆健康(english-tutor-ai 與 legacy e1l 皆 HTTP 200)；第6輪「即時正向回饋」確實上線實證——app.js 含 showCelebration/fireConfetti/STREAK_MILESTONES/getStreakBadges、style.css 含 confetti/celebrate-toast/sbadge、modes.js 含里程碑徽章，Chrome headless dump-dom 首頁完整渲染(5 mode-card+daily-card+onb-card→renderHome 跑完=無致命 JS error)，補平了 log 內「線上實證待部署後補」的缺口。第1–6輪逐輪真朝「容易學」前進(內容→每日目標/streak→錯題本→SRS→onboarding→即時正向回饋)，每輪都做北極星研究、無空轉無偏離；evolve_instruction 已無殘留🔴硬性指定(第6輪 worker 完成後自清，無誘導 round 7 重做的空轉風險)，自然 backlog 頂端=PWA(可安裝離線/一鍵打開=降低「容易上手/可持續」摩擦)方向正確、未過時。→ 不需改 backlog，靜默不擾人。觀察(供下一輪參考，非硬性):六輪持續疊「習慣/動力」層，產品本名「AI 英語口說老師」的發音回饋核心(backlog #5)較久未動，若 round 7+ 再出現純 gamification 加碼/純內容擴充傾向，將導正回 PWA 或發音核心。

---

### 第 7 輪 — 2026-06-29（PWA：可安裝到主畫面 + 離線可用｜backlog #1，小組長 09:2x 確認方向）
**北極星研究（必做）**
- WebSearch「language learning app PWA installable offline lower barrier Duolingo add to home screen」。借鏡：①付費學習軟體（TalkPal 等）走 PWA 路、**直接從瀏覽器加到主畫面**，把網頁變成像 app 的一鍵入口，降低「找/打開」的門檻 ②Duolingo 等的留存核心是「每天回來」，而把圖示放上主畫面＝最短回訪路徑（承接第 2/6 輪 streak 習慣養成）③離線可用讓弱網/沒網也能練，移除「載入摩擦」。落地 3 點子：①給 manifest+icon 讓它**可安裝** ②service worker 快取 app shell→**離線秒開** ③多數人不會自己「加到主畫面」→**主動彈一個低打擾的安裝邀請橫幅**（可關、不糾纏）。
- 來源：fluentu.com/blog/learn/learn-languages-offline、icanlearn.com/best-android-language-learning-app、pwa.com/apps/duolingo。

**本輪進化：PWA 可安裝 + 離線（降「再次打開」門檻＝更容易持續學）**
- 新增檔：`manifest.webmanifest`（standalone/主題色/192+512+maskable icon）、`sw.js`（service worker）、`assets/icons/icon-{192,512,maskable-512}.png`（用**真 Chrome 光柵化 SVG** 生成，無 build step、不引入影像庫）、`tools/gen_icons.mjs`+`tools/verify_pwa*.mjs`（可重用生成/驗證腳本）。改：`index.html`(link manifest+apple-touch-icon 等 meta)、`app.js`(initPWA：註冊 SW + beforeinstallprompt 攔截 + 安裝邀請橫幅 + appinstalled 清理)、`style.css`(.pwa-install 橫幅樣式)。純加法、低風險、可回退。
- **可安裝**：manifest 齊 name/short_name/standalone/theme_color/三尺寸 icon（含 maskable）→ Chrome/Android 認定可安裝。
- **離線可用**：SW 策略避開 PWA 經典「永遠吃舊版」陷阱——導覽(HTML)走 **network-first**（線上一定拿最新、離線才回退快取 index.html）、靜態資產走 **stale-while-revalidate**（秒回快取+背景更新、自我修復）；每次部署 bump `CACHE_VER`，activate 清舊快取。
- **主動安裝邀請**：攔 `beforeinstallprompt`，底部彈「📲 安裝到主畫面，下次一鍵打開、離線也能練」橫幅，點「安裝」喚原生安裝；可「✕」關閉並記 `pwaInstallDismissed` 不再糾纏；已安裝(standalone)或裝完(appinstalled)自動隱藏。SW 註冊失敗只 warn、不影響一般使用。

**驗證證據**
- 本機真 Chrome(puppeteer-core 23.11.1 驅動、375px 手機、本機 HTTP server 安全內容環境)端到端 **11/11 PASS、0 console error**：首頁渲染／manifest 200+解析+standalone+icons／3 icon 皆 200／SW activated+controller 接管／模擬 beforeinstallprompt→橫幅出現→點安裝觸發 prompt()→橫幅移除／**離線斷網 reload 仍渲染 mode-card**。
- icon PNG 簽章+尺寸驗證：192×192/512×512/512×512 皆 PNG_OK。
- git 677036a push main + wrangler deploy 主(english-tutor-ai 4afb8750)+legacy(english-tutor-e1l 284a0204)皆成功。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 7/7 PASS、0 console error**：首頁渲染／manifest 200(application/manifest+json)+standalone／icons 全 200／SW activated／安裝橫幅出現+可點+移除／**線上離線 reload 仍渲染**。manifest/sw.js/3 icon 線上 curl 皆 200+正確 content-type。
- legacy alias `english-tutor-e1l` 同步部署、仍 200（manifest 亦 200）。

**下一輪 backlog 想法（優先序建議）**
1. **發音回饋核心升級**（小組長點名：產品本名「口說老師」核心久未動）：更細音素提示、可重聽範例音、慢速逐詞對照、跟讀逐詞高亮已備可深化。
2. 慶祝/成就升級：里程碑徽章可點開「成就牆」、達標可選輕量音效（尊重靜音）。
3. onboarding 進階：第 2 步問學習動機（旅遊/工作/考試）→ 推薦起始模式。
4. 內容再擴充：商務/旅遊主題分類、對話分支選項（難度分級、初學者友善）。
5. PWA 進階：離線時的友善提示、安裝後 app 內更新提示（new SW 可用時提醒重整）。

[小組長 09:5x] 督導：兩站皆健康(english-tutor-ai 與 legacy e1l 皆 HTTP 200)、第7輪 PWA 線上實證齊(manifest.webmanifest/sw.js/icon-192 皆 200，app.js 線上含 initPWA+showCelebration+STREAK_MILESTONES+showOnboarding=第5/6/7輪功能全在線)。第1–7輪逐輪真朝「容易學」前進、每輪都做北極星研究、無空轉無偏離；evolve_instruction 第7輪後已自清無殘留🔴(無誘導重做的空轉風險)。導正動作：六/七輪持續疊習慣/動力/離線層，但產品本名「AI 英語口說老師」的**發音/口說核心連7輪未深化**＝對初學者最大的「不容易學」摩擦點(唸得對不對、錯在哪、怎麼修)。→ 已在 evolve_instruction 釘🔴第8輪硬性指定「發音回饋核心升級(以容易學為框架)」：具體哪個音/詞錯而非只給分數、一鍵重聽範例+慢速、跟讀逐詞高亮深化；明令禁漂移到 PWA進階/純gamification/純內容擴充/onboarding加步驟。靜默不擾人。

---

### 第 8 輪 — 2026-06-29（發音回饋核心升級：逐音 drill｜小組長 09:5x 🔴硬性指定 backlog #1）
**北極星研究（必做）**
- WebSearch「ELSA Speak pronunciation feedback design phoneme score beginners」。借鏡 ELSA：①回饋是**音素層級**——指出每個字裡「哪個音」唸錯，而非只給一個總分 ②色彩+分數**視覺化定位錯誤**，看得到要修哪裡 ③**無限重聽/重練**直到唸對，加快回饋迴圈。落地 3 點子：①把唸錯的字逐一列出、針對「那個音」給具體咬字提示 ②每個字可**重聽正確示範**（正常/慢速逐詞對照）③一次只給少量重點字（小批次低壓力）。
- 來源：vn.elsaspeak.com（ELSA Score 五技能/音素級）、medium @elsaspeak、toolworthy.ai/tool/elsa-speak。

**本輪進化：逐音 drill — 把發音回饋從「診斷」升成「能立刻照做的修正」（口說核心＝容易學的本命，正中🔴硬性指定）**
- 改動檔：`scoring.js`（`pronunHint` 改 export 並加規則式 `phoneticHint` + `SILENT_LETTER` 表、新增 `wordDrills` 挑錯字）、`modes.js`（`renderShadowing.evaluate` 評分後渲染 drill 卡）、`style.css`（`.drill-*` 樣式）。純加法、低風險、可回退。
- **規則式音素提示（更細的音）**：以前只有 10 個硬編字有提示、其餘無建議；現在依拼字特徵涵蓋華語母語者常見難點——th 咬舌 /θ//ð/、r vs l、v 咬唇別發 w、silent letter(know/walk…)、kn/wr 開頭、-ed 三讀法、-tion=/ʃən/、ee/ea 長音 vs ɪ 短音、oo 長短、字尾子音收音…查無精選時自動產生，**幾乎每個字都給得出具體咬字建議**（不再只罵分數）。
- **可重聽範例音（慢速逐詞對照）**：每個重點字附 🔊正常 / 🐢慢速 兩鈕，重聽「該單字」的正確發音、對到順為止＝ELSA 式無限重聽。
- **小批次低壓力**：只列唸錯/近音/漏唸的字、去重、**最多 4 個**；**全對則不出卡**，不增無謂負擔。
- 註：跟讀逐詞高亮（karaoke read-along）第 6 輪已上線、本輪維持；本輪聚焦「錯在哪+怎麼修+重聽」的回饋閉環。

**驗證證據**
- 本機 node 單元測試 **15/15 PASS**：規則式提示覆蓋(th/r/silent/長母音/tion/-ed/v…非空且具體)、精選表優先、wordDrills 去重+上限4+狀態合法+全對無 drill。
- 本機真 Chrome（puppeteer-core 驅動、375px 手機、注入假 STT 走**真實 mic→evaluate→drill 渲染路徑**）端到端 **12/12 PASS、0 console error**：唸錯→出 drill 卡(4)+每字有音素提示+🔊正常/🐢慢速鈕+句子上色+點慢速重聽無錯；全對→不出卡。腳本 `tools/verify_shadowing.mjs` 可重跑。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 11/11 PASS、0 console error**；scoring/modes/style 新 token 線上 curl 實證。
- git daf452c push main + wrangler deploy 主(english-tutor-ai b4f60e59)+legacy(english-tutor-e1l 87a8ba68)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
1. 發音核心再深化：**範例 vs 我的錄音對照**（MediaRecorder 錄學生音回放、與示範並列）、單字音節重音標記。
2. 內容再擴充：商務/旅遊主題分類、對話分支選項（難度分級、初學者友善）。
3. 慶祝/成就升級：里程碑徽章點開「成就牆」、達標輕量音效（尊重靜音）。
4. onboarding 進階：第 2 步問學習動機（旅遊/工作/考試）→ 推薦起始模式。
5. PWA 進階：離線友善提示、新版可用時提醒重整。

[小組長 10:2x] 督導：兩站皆健康(english-tutor-ai + legacy e1l 皆 HTTP 200，headless 真機 5 mode-card 渲染、**0 JS error**)；第8輪「發音回饋核心升級」確實上線實證(scoring.js phoneticHint / modes.js drill 線上 curl 在，15/15 單測+12/12 本機真機+線上 11/11 皆 0 console error)，做了北極星研究(ELSA 音素級回饋)、正中上一輪🔴硬性指定(產品本名口說核心、連7輪未深化的最大摩擦點)、無空轉無偏離。**🔴第8輪硬性指定區塊已被 worker 完成後自行移除**——歷輪反覆示警的「殘留🔴誘導下一輪重做」空轉風險本輪未發生，自清機制有效。觀察：稽核時 lock(10:20)新鮮、**第9輪 worker 正在跑、log 尚未產出**，當前無🔴 pin；round8 backlog #1=發音核心再深化(範例 vs 我的錄音對照 MediaRecorder)方向正確、緊扣口說本命。→ 導正動作：本輪不撞跑中 worker、不改 instruction(對當前輪無效且會 race)；靜默不擾人，待第9輪產出後判斷是否漂離口說核心(若漂回 gamification/純內容/PWA 進階則 pin round10 導正回錄音對照或口說深化)。

---

### 第 9 輪 — 2026-06-29（發音核心再深化：範例 vs 我的錄音對照｜backlog #1，緊扣口說本命）
**北極星研究（必做）**
- WebSearch「ELSA Speak / Speechling record yourself compare native pronunciation playback feedback beginners」。借鏡 ELSA：①錄完後可**回放自己的錄音、直接與母語者示範對比**——這正是自我修正最有效的一步(聽出差異)；②色彩+分數**視覺化定位錯誤**(第8輪 drill 已做)；③**無限重聽**加快回饋迴圈。Speechling 亦以「錄自己→比對示範」為核心。落地點子：①跟讀時錄學生音、評分後一鍵回放並列老師示範 ②「先聽範例、再聽自己」的對照引導文案 ③錄音全程 best-effort、不支援就靜默不打擾。
- 來源：elsaspeak.com/en/speech-analyzer、blog.elsaspeak.com、fluentu.com/blog/reviews/elsa-speak。

**本輪進化：範例 vs 我的錄音對照（口說核心＝容易學的本命）**
- 改動檔：`assets/js/modes.js`（renderShadowing 加 `startRecording/finishRecording/clearRecording` 用 MediaRecorder 錄學生跟讀音、evaluate 多收 `myUrl` 參數渲染對照卡、prev/next 清錄音釋放麥克風）、`assets/css/style.css`（`.compare-card/.compare-row` 樣式）。純加法、低風險、可回退。
- **錄音回放對照**：跟讀按「開口跟讀」時，在既有 STT recognizer 啟動後**才**開 MediaRecorder 錄音；評分後出對照卡「🔊 老師示範 / 🎧 我的錄音」兩鈕並列，讓初學者**聽出自己跟範例哪裡不一樣**＝最快自我修正(借鏡 ELSA/Speechling)。
- **絕不破壞既有核心**：錄音全程 best-effort——recognizer 先啟動確保評分不受影響；getUserMedia/MediaRecorder 不支援或失敗 → `finishRecording` 回 null → **靜默不出對照卡**，STT/評分/drill 一切照舊。換句/錯誤時 `clearRecording` 停錄音、revoke blob URL 釋放麥克風，不殘留不洩漏。
- 註：第6輪跟讀逐詞高亮、第8輪逐音 drill 維持；本輪補上「聽自己 vs 聽範例」這塊發音閉環缺口。

**驗證證據**
- 本機真 Chrome（puppeteer-core 驅動、**fake 音訊裝置開真實 getUserMedia→MediaRecorder**、fake STT 走真實 evaluate 路徑、375px 手機）端到端 **12/12 PASS、0 console error**：fake 裝置實測錄到 ~380 bytes 音檔→唸錯出對照卡(老師示範/我的錄音兩鈕)→點兩鈕回放無錯→既有 drill 卡不被破壞(無回歸)→換句對照卡清除(#result 清空)。腳本 `tools/verify_compare.mjs` 可重跑。
- 第8輪 drill regression `tools/verify_shadowing.mjs` **12/12 PASS**（確認無回歸）。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 11/11 PASS、0 console error**（`tools/verify_compare_live.mjs`）；modes.js(compare-card/startRecording/cmp-mine)、style.css(.compare-card) 線上 curl 實證。
- git 936e0d7 push main + wrangler deploy 主(english-tutor-ai 19239106)+legacy(english-tutor-e1l db37db01)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
1. 發音核心再深化：**對照卡可「逐字節重音標記」**(音節點/重音記號)、或錄音與示範**波形/時長對齊**讓差異更直覺；單字 drill 也加「錄我的這個字」對照。
2. 內容再擴充：商務/旅遊主題分類、對話分支選項（難度分級、初學者友善）。
3. 慶祝/成就升級：里程碑徽章點開「成就牆」、達標輕量音效（尊重靜音）。
4. onboarding 進階：第 2 步問學習動機（旅遊/工作/考試）→ 推薦起始模式。
5. PWA 進階：離線友善提示、新版可用時提醒重整。

---

### 第 10 輪 — 2026-06-29（發音核心再深化：逐音 drill 加「拆音節 + 標重音節」｜backlog #1，緊扣口說本命）
**北極星研究（必做）**
- WebSearch「ELSA Speak syllable stress marker / word stress teaching beginners app design」。借鏡 ELSA「Word Stress」模組＋教學界共識：①重音是初學者最易忽略卻最影響聽感與聽得懂的點，唸錯音節＝意思可能被誤解；②**視覺化標出該重讀的音節**（ELSA 用顏色標、教學用「拆音節＋看得到 stress pattern」）讓抽象的重音變看得見；③重讀音節要**更大聲、更長、音調略高**，配合可無限重聽的示範音加快回饋迴圈。落地 3 點子：①把唸錯的字拆成音節、標出重音節 ②一句話講清楚「那一節怎麼唸（更大聲更長更高）」③配既有 🔊正常/🐢慢速 示範音對著練。
- 來源：blog.elsaspeak.com（Word Stress 模組/錯音節標紅）、iastate.pressbooks.pub teachingpronunciation（word stress 視覺教學）、boldvoice.com（stress rules）。

**本輪進化：逐音 drill 加「音節 + 重音標記」（口說核心＝容易學的本命，正中 backlog #1）**
- 改動檔：`assets/js/scoring.js`（`STRESS_DICT` 精選字典 + `syllabify`/`guessStress`/`syllableStress`、`wordDrills` 多帶 `syl` 欄位）、`assets/js/modes.js`（drill 卡渲染音節 chip + 重音節高亮 + 指引文案）、`assets/css/style.css`（`.drill-syl/.syl-chip/.syl-stress/.syl-tip`）。純加法、低風險、可回退。
- **看得到重音在哪**：每個唸錯的多音節字，拆成音節 chip（如 `morn·ing`），把該重讀的音節**高亮成金色放大**，並附一句「重音在第 N 音節「X」：這一節唸得更大聲、更長、音調略高」。配既有 🔊正常/🐢慢速 示範音對著練＝把抽象重音變成看得見、跟得上的小步驟。
- **正確優先**：`STRESS_DICT` 收錄 app 內 SENTENCES + VOCAB 實際會出現的多音節字（~95 字），重音索引**逐字對 data.js 的 IPA 主重音校正**確保顯示正確；字典查無時用啟發式 `syllabify`（母音群切分＋silent-e 合併＋雙字母不拆）+ 字尾規則 `guessStress` 給「參考」音節，且有真人示範音可對照。**單音節字回 null → 不顯示**（不增無謂負擔）。
- 註：第 6 輪跟讀逐詞高亮、第 8 輪逐音 drill、第 9 輪錄音對照維持；本輪補上「重音/音節」這塊發音閉環缺口。

**驗證證據**
- 本機 node 單元測試 **51/51 PASS**：精選字典重音節文字正確(appreciate→pre/recommend→mend/understand→stand…)、大小寫標點正規化、單音節回 null、重音 index 合法範圍、啟發式後備給≥2 音節+合法重音、音節拼回原字不漏不增、wordDrills 帶 syl 欄位。
- 本機真 Chrome（puppeteer-core 驅動、注入假 STT 走**真實 evaluate→drill 渲染路徑**、375px 手機）端到端 **12/12 PASS、0 console error**：固定第一句(含 morning/today)→唸錯逼出 drill→morning 音節 `morn·ing`+唯一重音節 `morn`+指引文案正確→有音節卡的字皆恰 1 重音節+chip 拼回原字→單音節字(how/are/you)不顯示音節卡→點 🐢慢速 無錯。腳本 `tools/verify_stress.mjs` 可重跑。
- 第 8 輪 drill regression `tools/verify_shadowing.mjs` **12/12 PASS**（確認無回歸）。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 6/6 PASS、0 console error**（`tools/verify_stress_live.mjs`）；scoring.js(syllableStress/STRESS_DICT)、modes.js(drill-syl/syl-stress)、style.css(syl-chip) 線上 curl 實證在。
- git cfa4272 push main + wrangler deploy 主(english-tutor-ai cdcbefda)+legacy(english-tutor-e1l 6c81ff7e)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
1. 發音核心再深化：句子層級的**句重音/節奏**標記（哪幾個字該重讀），或單字 drill 加「錄我的這個字 vs 示範」逐字對照（接第 9 輪錄音對照）。
2. 重音教學深化：重音卡可加「拍手/點點」節奏提示，或常見重音規則小卡（-tion 前一節、雙音節名詞重前…）。
3. 內容再擴充：商務/旅遊主題分類、對話分支選項（難度分級、初學者友善）。
4. 慶祝/成就升級：里程碑徽章點開「成就牆」、達標輕量音效（尊重靜音）。
5. onboarding 進階：第 2 步問學習動機（旅遊/工作/考試）→ 推薦起始模式。

[小組長 10:5x] 督導：兩站皆健康(english-tutor-ai 與 legacy e1l 皆 HTTP 200，主站 modes.js 線上 curl 含 compare-card/startRecording=第9輪功能在線)。第9輪「範例 vs 我的錄音對照」確實落實 backlog #1、做了北極星研究(ELSA/Speechling 錄自己→比對示範)、12/12本機+11/11線上真機 0 console error，正中我第7/8輪示警的「口說核心久未深化」最大摩擦點(第8輪逐音 drill→第9輪錄音對照，連兩輪深化口說本命)，無空轉無偏離；evolve_instruction 第9輪後無殘留🔴 pin。→ 導正動作：發現 evolve_instruction 靜態 backlog 仍把「⭐SRS 弱點優先」列最高優先，但 SRS 早在第4輪完成、onboarding(5)/PWA(7)亦完成，殘留會誘導未來輪重做=空轉風險(雖 round5–9 證 worker 實讀 log 新 backlog 未中招)；已將該區塊更新為「已完成清單(第2–9輪逐項標明勿重做)+⭐改釘發音/口說核心再深化為優先(逐音節重音/波形對齊/單字錄音對照)」，與 log 新 backlog 對齊、緊扣產品本命。靜默不擾人。

[小組長 11:21] 督導：兩站皆健康(english-tutor-ai 與 legacy e1l 皆 HTTP 200)；第10輪「逐音 drill 加音節+重音標記」線上實證齊(scoring.js 含 STRESS_DICT/syllableStress、modes.js 含 drill-syl/syl-stress，第9輪 compare-card 亦在線=功能無回退)，做了北極星研究(ELSA Word Stress)、51單測+12本機+6線上真機 0 console error、正中 backlog #1 緊扣口說本命，第8→9→10連三輪深化發音核心、無空轉無偏離。稽核時 lock(11:21:18)新鮮、第11輪 worker 正在跑、log 尚未產出 → 依既定規則不撞跑中 worker、不在 race 中改 instruction；evolve_instruction backlog 已於上輪對齊(已完成清單+⭐發音核心優先)、無殘留🔴 pin、方向正確未過時。靜默不擾人，待第11輪產出後判斷是否漂離口說核心。

---

### 第 11 輪 — 2026-06-29（發音核心再深化：句子節奏／句重音標記｜backlog #1，緊扣口說本命）
**北極星研究（必做）**
- WebSearch「ELSA Speak sentence stress rhythm intonation teaching beginners connected speech」。借鏡 ELSA Sentence Stress＋ESL 超音段(suprasegmentals)教學共識：①ELSA 分析音高與節奏、**標出句中該強調哪些字(sentence stress)**，色彩定位(綠/黃/紅)讓回饋一眼看懂；②英文是 **stress-timed(重音節拍)** 語言——實詞(名詞/動詞/形容詞)唸重、長、清楚，虛詞(冠詞/介系詞/助動詞)弱化帶過；華語是 syllable-timed(每字平均出力)，**這正是華語母語者最常見的不道地點：每個字都唸一樣重**；③stress 可用「在文字上標記重音」的視覺活動內化。落地 3 點子：①把句子裡該重讀的實詞標大、虛詞縮灰 ②一句話講清「實詞唸重、虛詞輕帶」的節奏原則 ③配可跟讀的示範把抽象節奏變成跟得上的小步驟。
- 來源：bridge.edu（teaching suprasegmentals stress/rhythm/intonation）、inenglishwithlove.com（ELSA sentence stress）、elsaspeak.com/en/speech-analyzer。

**本輪進化：句子節奏／句重音標記（口說核心＝容易學的本命，正中 backlog #1）**
- 改動檔：`assets/js/scoring.js`（`FUNCTION_WORDS` 虛詞表 + `isFunctionWord`/`sentenceStress`）、`assets/js/modes.js`（renderShadowing 加「🎵 句子節奏」鈕 + `toggleRhythm` 可收合面板 + 跟讀）、`assets/css/style.css`（`.rhythm-*`/`.beat-*` 樣式）。純加法、低風險、可回退。
- **看得到節奏在哪**：跟讀頁新增「🎵 句子節奏」鈕，點開把該句**逐字標記**——實詞(名詞/動詞/形容詞/疑問詞/否定詞/數詞)放大加粗(beat-strong)、虛詞(the/a/to/of/is/you…)縮小變灰(beat-weak)，每字上方一顆節拍點(●/·)，把「英文是重音節拍語言」這件抽象的事變成一眼看懂的小步驟。
- **教學文案＋可跟讀**：面板附一句「實詞唸重、長、清楚；虛詞輕輕快快帶過，整句就有道地抑揚」，並有「🔊 跟著節奏唸一次」鈕(0.8 倍速 read-along 逐字高亮)對著練。
- **不增負擔**：預設收合、點按才展開、再點收合；切換句子自動重置不殘留。分類用標準 ESL 啟發式(不在虛詞表者皆視為實詞)，正確處理縮寫(it's→it 虛詞、don't/can't 否定永遠重讀)與標點。
- 註：第 6 輪跟讀逐詞高亮、第 8 輪逐音 drill、第 9 輪錄音對照、第 10 輪音節+字重音維持；本輪補上「**句子層級**的重音/節奏」這塊發音閉環缺口(前幾輪聚焦單字層級)。

**驗證證據**
- 本機 node 單元測試 **22/22 PASS**：實詞/虛詞分類正確(like/cup/coffee/please 重、I/would/a/of 弱)、否定縮寫(don't/can't/won't)永遠重讀、縮寫去尾(it's/they're/I'm→虛詞)、標點不影響、疑問詞(what)/否定詞(not)為實詞、詞數一致、句中同時有重弱。
- 本機真 Chrome（puppeteer-core 驅動、375px 手機、走真實 DOM 渲染）端到端 **13/13 PASS、0 console error**（`tools/verify_rhythm_e2e.mjs`）：節奏鈕在、預設收合→點開出節奏卡→「Good morning. How are you today?」標成 GOOD MORNING. HOW are you TODAY?(實詞重/are·you 弱)→出現虛詞皆判弱化→教學文案+播放鈕→點播放無錯→可收合→切句乾淨不殘留。
- 第 8/10 輪 regression `tools/verify_shadowing.mjs`、`tools/verify_stress.mjs` 各 **12/12 PASS**（確認無回歸）。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 8/8 PASS、0 console error**（`tools/verify_rhythm_live.mjs`）；scoring.js(sentenceStress/isFunctionWord)、modes.js(toggleRhythm/rhythmBtn/句子節奏)、style.css(beat-strong/rhythm-card) 線上 curl 實證在。
- git cdc3a83 push main + wrangler deploy 主(english-tutor-ai 6458615e)+legacy(english-tutor-e1l 2d3df44d)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
1. 發音核心再深化：句子節奏可加「拍手/打點」節奏節拍器同步、或錄音與示範**時長/波形對齊**讓快慢差異更直覺(第9輪錄音對照延伸)。
2. 節奏教學深化：常見句重音規則小卡（資訊焦點/對比重音、句尾上揚 vs 下降語調）。
3. 內容再擴充：商務/旅遊主題分類、對話分支選項（難度分級、初學者友善）。
4. 慶祝/成就升級：里程碑徽章點開「成就牆」、達標輕量音效（尊重靜音）。
5. onboarding 進階：第 2 步問學習動機（旅遊/工作/考試）→ 推薦起始模式。

[小組長 11:51] 督導：線上站 e1l HTTP 200(0.07s)健康。第11輪「句子節奏/句重音(實詞重·虛詞弱)標記」做了北極星研究(ELSA Sentence Stress+stress-timed vs syllable-timed=華語母語者最常見不道地點)、22單測+13本機+8線上真機 0 console error、正中 backlog #1，第8→9→10→11連四輪深化發音/口說核心(單字層→句子層閉環)、無空轉無偏離。→ 導正動作：evolve_instruction 的 ✅清單只到第9輪、⭐ pin 仍寫「逐音節重音標記」(第10輪已完成)有誘導重做風險；已補入第10/11輪到已完成清單、⭐改釘真正未做的「波形/時長對齊+單字錄音對照+節拍器同步」並明標第10/11輪勿重做，與 log 對齊。靜默不擾人。

---

### 第 12 輪 — 2026-06-29（句子節奏「節拍器」：每聲咑＝一個重音，跟著拍子開口練｜backlog #1、小組長 11:51 ⭐pin「節拍器同步」）
**北極星研究（必做）**
- WebSearch「ELSA record/waveform compare native」＋「word-stress metronome tap rhythm beginner」。借鏡兩條：①ELSA 用色彩/分數視覺化節奏與重音、可無限重聽對照；②教學界經典做法——**用節拍器把重音打在規律拍點上**（一個重讀音節一拍、≈60bpm），並用「拍手/站起來/敲桌」等**身體節奏**強化，把抽象的「英文節奏」變成耳朵聽得到、身體跟得上的小步驟。落地點子：①給第 11 輪的句子節奏面板加一個**真的會「咑咑」響的節拍器**，每拍打在一個實詞重音上；②視覺亮點同步打在該重音字、虛詞之間快閃帶過＝看得到「重拍落點+虛詞滑過」；③先兩拍預備再開打，可隨時停、不增負擔。
- 來源：speechanalyzer.elsaspeak.com、americanpronunciationcoach.com/english-rhythm（metronome 60bpm 一拍一重音）、betterlanguageskills.com（EAL 用節拍器練句重音）、fluentu.com/blog/english/english-rhythm。

**本輪進化：句子節奏面板加「🥁 打節拍跟著唸」節拍器（口說核心＝容易學的本命，正中 backlog #1／小組長 ⭐pin）**
- 改動檔：`assets/js/modes.js`（renderShadowing 內：`click`(WebAudio 咑聲)、`stopMetronome`、`playMetronome`；toggleRhythm 加節拍器鈕＋教學文案；prev/next/收合面板皆 stopMetronome 收乾淨）、`assets/css/style.css`（`.metro-tip`/`.beat-now`(當前重音金色放大亮點)/`.beat-pass`(虛詞快閃)＋`prefers-reduced-motion` 降載）。純加法、低風險、可回退。
- **聽得到＋看得到的節奏**：點「🥁 打節拍跟著唸」→ best-effort WebAudio 發出穩定「咑」聲（強拍 1150Hz），**每一拍打在一個實詞重音上**（句重音落點＝第 11 輪 sentenceStress 判定的實詞）；同步把該重音字**金色放大亮起**(beat-now)、重音之間的虛詞**快速一閃**(beat-pass) 示意「輕快滑過」。先兩拍預備（弱音）再正式開打，整句打完自動停。
- **不增負擔＋絕不破壞既有**：WebAudio 全程 try/catch，不支援/被擋一律靜默略過，不影響句子節奏面板/跟讀/評分任何既有功能；再按一次=停、切句(prev/next)/收合面板/換頁(box.isConnected 守衛)都會清掉 timer 與亮點、不殘留不發孤兒音。尊重 `prefers-reduced-motion`（關放大動畫）。
- 註：第 6 輪跟讀逐詞高亮、第 8 輪逐音 drill、第 9 輪錄音對照、第 10 輪音節+字重音、第 11 輪句子節奏標記全維持；本輪把第 11 輪「看得到的節奏」升級成「**聽得到、打得出、跟著開口練**」的閉環。

**驗證證據**
- 本機真 Chrome（puppeteer-core 驅動、375px 手機、真 WebAudio：攔 `osc.start` 計數證明咑聲真有發出）端到端 **15/15 PASS、0 console error**（`tools/verify_metronome_e2e.mjs`）：展開出節拍器鈕+教學文案→真實點按鈕變「停止節拍」→節拍亮點(beat-now)打在實詞重音上→osc.start 觸發 5 次(咑聲真響)→整句打完自動停+鈕復原+亮點清除→再按可手動停→**節拍器跑著切下一句自動停、面板收合不殘留(open 重置、句子確實換到 My name is Anna…)**→收合面板一併停。
- regression 全綠、確認無回歸：句子節奏 `verify_rhythm_e2e.mjs` **13/13**、逐音 drill `verify_shadowing.mjs` **12/12**、音節+重音 `verify_stress.mjs` **12/12**，皆 0 console error。
- 過程中發現並修一個既有測試脆弱點（非產品 bug）：節拍器教學文案讓節奏卡變高，puppeteer `page.click` 對被 **sticky 底部導覽列(.tabbar position:sticky;bottom:0)** 蓋住座標的鈕會誤點到 tab→誤導航。實證：把鈕 `scrollIntoView({block:"center"})` 後 hit-test=該鈕本身、真實 page.click 正常運作＝**真實使用者把鈕捲到畫面內即可正常點按**（鈕在頁面中段、下方還有 heard/result/上下句，可自由捲離底列）。已把 verify_rhythm_e2e/verify_metronome 的相關點按改為「先捲到中央再真實點按」＝忠實模擬真人操作。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 15/15 PASS、0 console error**（`tools/verify_metronome_live.mjs`）：真實點按啟動節拍器→WebAudio osc.start 觸發(咑聲真響)→beat-now 打在實詞重音→整句打完自動停→切句(換到 My name is Anna…)/收合皆收乾淨。線上 curl 實證 modes.js(playMetronome/metroBtn/stopMetronome)、style.css(.beat-now/.metro-tip/.beat-pass) 皆在。
- git e19d6b6 push main + wrangler deploy 主(english-tutor-ai a235ad9d)+legacy(english-tutor-e1l 75bd9111)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
1. 發音核心再深化：錄音與示範**時長/波形對齊**讓快慢差異更直覺(第9輪錄音對照延伸)、或節拍器可調速(慢/標準)＋單字 drill 也加「錄我的這個字 vs 示範」逐字對照。
2. 節奏教學深化：常見句重音規則小卡（資訊焦點/對比重音、句尾上揚 vs 下降語調）。
3. 內容再擴充：商務/旅遊主題分類、對話分支選項（難度分級、初學者友善）。
4. 慶祝/成就升級：里程碑徽章點開「成就牆」、達標輕量音效（尊重靜音）。
5. onboarding 進階：第 2 步問學習動機（旅遊/工作/考試）→ 推薦起始模式。
6. UX 體質：sticky 底部導覽列會蓋住長頁底部內容，考慮給 `.view` 補足夠 padding-bottom 讓任何內容都能捲離導覽列（一次性低風險體質改善）。

[小組長 12:21] 督導：兩站皆健康(english-tutor-ai 與 legacy e1l 皆 HTTP 200、size 4263 一致，lock 已釋放=第12輪 worker 已收工無輪次在跑)。第12輪「句子節奏🥁節拍器(每拍一重音、聽得到打得出)」確實上線、正中 backlog #1＋我 11:51 ⭐pin「節拍器同步」，做了北極星研究(ELSA+教學界 60bpm 一拍一重音/身體節奏)、15本機+15線上真機 0 console error、regression 全綠(rhythm13/shadowing12/stress12)，第8→9→10→11→12**連五輪深化發音/口說核心**(單字音素→錄音對照→音節重音→句節奏→節拍器)、無空轉無偏離，產品本命扎實推進。→ 導正動作：發現 evolve_instruction 的 ✅清單只到第11輪、⭐pin 仍寫「節拍器同步」(=第12輪已做)，正是反覆示警的「殘留 pin 誘導下一輪重做＝空轉」風險；已將第12輪節拍器補進已完成清單、⭐pin 改釘真正未做的口說缺口「錄音 vs 示範波形/時長對齊(第9輪延伸)+單字 drill 逐字錄音對照+節拍器調速」並明標第10/11/12輪勿重做，與 log 對齊、緊扣口說本命。靜默不擾人。

---

### 第 13 輪 — 2026-06-29（發音核心再深化：我的聲音波形 + 速度對照條｜backlog #1，正中小組長 12:21 ⭐pin「波形/時長對齊」）
**第 0 優先（網址）：第 3 輪已處理完畢、本輪不需重做**
- `english-tutor.pages.dev` 為全域唯一名、已被外部帳號（Voice Recorder）永久佔用、技術不可取得；第 3 輪已遷至乾淨網址 `english-tutor-ai.pages.dev`，instruction + log 皆同步。本輪開工前雙站健康（HTTP 200），working tree 乾淨。

**北極星研究（必做）**
- WebSearch「ELSA record yourself waveform duration compare native pace too fast/slow」。借鏡：①ELSA 給 fluency 回饋（停頓/猶豫/語速），能判斷你唸得太快/太慢；②**ELSA 本身缺波形視覺化**＝回饋深度受限，而 Oxford University Press「Say It」App **用聲波圖**讓你把自己的發音波形跟母語者對照；③色彩/視覺化定位錯誤對初學者最友善。落地 3 點子：①把學生錄音畫成**聲波圖**，看得到自己的重音落點與停頓 ②量測示範 vs 我的錄音**時長**並列長短條，直觀看出快慢 ③一句話判語（太快/太慢/剛好）給可立即照做的修正。
- 來源：fluentu.com/blog/reviews/elsa-speak、speechanalyzer.elsaspeak.com、blog.elsaspeak.com（advantage of feedback）。

**本輪進化：錄音對照卡加「我的聲音波形 + 速度對照」（口說核心＝容易學的本命，正中 backlog #1／⭐pin）**
- 改動檔：`assets/js/modes.js`（finishRecording 加 `decodeRecording`/`envelope`/`drawWave`、回傳 `{url,dur,peaks}`；evaluate 對照卡渲染波形 canvas + 速度對照條 `renderPace`；readAlong 回傳 promise 供量測示範時長）、`assets/css/style.css`（`.wave-*`/`.pace-*`）。純加法、低風險、可回退。
- **我的聲音波形**：用 WebAudio `decodeAudioData` 解碼錄音、算 48 段 RMS 包絡畫成聲波圖（canvas），把「我唸得重/輕、哪裡停頓」變成**看得見**（借鏡 Oxford Say It）。高=重音/大聲、低/平=輕或停頓，呼應第 10/11/12 輪重音/節奏教學。
- **速度對照條（太快/太慢/剛好）**：量測「🔊 老師示範」的**真實播放時長**（非估計）對比我的錄音時長，並列長短條 + 一句判語——慢(ratio>1.25)→稍微加快連起來、快(ratio<0.8)→放慢把重音字唸足、差不多→節奏抓得好👍。直觀回答「我唸太快/太慢了嗎」。
- **絕不破壞既有＋不增負擔**：全程 best-effort——decode 失敗/不支援 → 不出波形與速度卡，STT/評分/drill/錄音回放一切照舊；換句/換頁 clearRecording 釋放麥克風、revoke URL，波形/速度卡一併清除不殘留。
- 註：第 6 輪逐詞高亮、第 8 輪逐音 drill、第 9 輪錄音對照、第 10 輪音節+字重音、第 11 輪句重音、第 12 輪節拍器全維持；本輪把第 9 輪「聽得到」的錄音對照升級成「**看得到波形、比得出快慢**」。

**驗證證據**
- 本機真 Chrome（puppeteer-core 驅動、fake 音訊裝置→真實 getUserMedia→MediaRecorder→真實 decodeAudioData、受控 fake TTS 走真實量測示範時長→renderPace、375px 手機）端到端 **16/16 PASS、0 console error**（`tools/verify_wave.mjs`）：錄到音(408 bytes)→出對照卡→**波形 canvas 真畫出像素(1106 個非透明)**→速度提示顯示我的秒數(0.6s)→點老師示範→量到示範時長→速度對照條(老師/你兩列+非零寬度+判語 pace-ok)→我的錄音回放無錯→既有 drill 卡無回歸→換句波形/對照卡清除不殘留。
- regression 全綠、確認無回歸：錄音對照 `verify_compare.mjs` **12/12**、節拍器 `verify_metronome_e2e.mjs` **15/15**、句子節奏 `verify_rhythm_e2e.mjs` **13/13**、逐音 drill `verify_shadowing.mjs` **12/12**、音節+重音 `verify_stress.mjs` **12/12**，皆 0 console error。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 8/8 PASS、0 console error**（`tools/verify_wave_live.mjs`）：波形真畫出(1060 像素)、速度對照條(老師/你+判語 pace-ok)、drill 無回歸。線上 curl 實證 modes.js(decodeRecording/drawWave/renderPace)、style.css(.wave-cv/.pace-bars/.pace-verdict) 皆在。
- git e4ca1fc push main + wrangler deploy 主(english-tutor-ai b043b7c8)+legacy(english-tutor-e1l b5715767)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
1. 發音核心再深化：**單字 drill 也加「錄我的這個字 vs 示範」逐字對照**（接本輪錄音對照，下沉到單字層）、或波形上疊示範參考線/標出停頓段。
2. 節奏教學深化：常見句重音規則小卡（資訊焦點/對比重音、句尾上揚 vs 下降語調）。
3. 內容再擴充：商務/旅遊主題分類、對話分支選項（難度分級、初學者友善）。
4. 慶祝/成就升級：里程碑徽章點開「成就牆」、達標輕量音效（尊重靜音）。
5. onboarding 進階：第 2 步問學習動機（旅遊/工作/考試）→ 推薦起始模式。
6. UX 體質：sticky 底部導覽列補 `.view` padding-bottom，讓長頁內容都能捲離導覽列。

[小組長 12:51] 督導：兩站皆健康(english-tutor-ai 0.08s / legacy e1l 0.13s 皆 HTTP 200)。第13輪「我的聲音波形+速度對照條」確實上線(git e4ca1fc 部署 b043b7c8/b5715767)、正中我 12:21 ⭐pin「波形/時長對齊」，做了北極星研究(ELSA fluency/語速+Oxford Say It 聲波圖對照)、16本機+8線上真機 0 console error、regression 全綠(compare12/metronome15/rhythm13/shadowing12/stress12)，第8→9→10→11→12→13**連六輪深化發音/口說核心**(音素→錄音對照→音節重音→句節奏→節拍器→波形速度)、無空轉無偏離，產品本命扎實推進。稽核時 lock(12:51:36)極新鮮=第14輪 worker 正在跑、log 尚未產出。→ 導正動作：發現 evolve_instruction 的 ✅清單只到第12輪、⭐pin 仍把「波形/時長對齊」標為「尚未做＝最該補的缺口」(=第13輪已正中完成)，正是反覆示警的「殘留 pin 誘導下一輪重做＝空轉」風險；已將第13輪波形/速度對照補進已完成清單、⭐pin 改釘真正未做的口說缺口「單字 drill 逐字錄音對照(下沉單字層)+波形疊示範參考線/標停頓段+節拍器調速」並明標第9–13輪勿重做，與 log 對齊、緊扣口說本命。此修正僅校正已完成狀態(嚴格正確、不影響跑中的第14輪、保護第15輪不重做)，非 race。靜默不擾人。

---

### 第 14 輪 — 2026-06-29（發音核心再深化：單字 drill 逐字錄音對照｜backlog #1，正中小組長 12:51 ⭐pin「單字 drill 逐字錄音對照」）
**第 0 優先（網址）：第 3 輪已處理、本輪不需重做**
- 使用者派工提到「換網址 english-tutor.pages.dev」，但該名為全域唯一名、已被外部帳號（Voice Recorder）永久佔用、技術不可取得；第 3 輪已遷至乾淨網址 `english-tutor-ai.pages.dev`，instruction + log 皆同步。開工前雙站健康(HTTP 200)、working tree 乾淨。

**北極星研究（必做）**
- WebSearch「ELSA Speak word level pronunciation feedback record single word compare native beginner」。借鏡 ELSA：①回饋下沉到**單字/音素層級**——指出哪個字、哪個音唸錯，並可**錄自己唸該字、跟母語者示範對比**；②色彩/分數視覺化定位錯誤對初學者最友善；③無限重聽加快回饋迴圈。落地點子：①把第 9/13 輪「句子層」的錄音對照**下沉到單字層**，每個唸錯的 drill 字都能「錄我唸這個字 vs 老師示範」A/B 比對 ②鎖定那個難字、聽出差異最快改對（主動回憶＋對照）③錄音全程 best-effort、不支援就靜默不打擾。
- 來源：fluentu.com/blog/reviews/elsa-speak、talkpal.ai（ELSA word recording/compare）、blog.elsaspeak.com（advantage of feedback）。

**本輪進化：逐音 drill 加「單字逐字錄音對照」（口說核心＝容易學的本命，正中 backlog #1／⭐pin）**
- 改動檔：`assets/js/modes.js`（renderShadowing 加 `wireDrillRecord`/`clearDrillRecordings`、drill 卡每字加「🎤 跟我唸」鈕；clearRecording/重新評分皆清單字錄音）、`assets/css/style.css`（`.drill-rec`/`.drill-cmp*`）。純加法、低風險、可回退。
- **下沉到單字層**：跟讀評分後的逐音 drill 卡，每個唸錯的字（最多 4 個）加「🎤 跟我唸」鈕——按下錄 **3 秒自動停**，接著出「🔊 示範 / 🎧 我的錄音」A/B 對照，初學者**鎖定那個難字、聽出自己跟示範哪裡不一樣**＝最快自我修正（承接第 9 輪句子層錄音對照、第 13 輪波形，下沉到「字」這一層）。可「🎤 重錄這個字」反覆練到順。
- **絕不破壞既有＋不增負擔**：全程 best-effort——`canRecord()` 偵測，不支援 getUserMedia/MediaRecorder 就**不顯示**🎤 鈕、drill/評分/句子層對照一切照舊；錄音失敗靜默回「再試一次」。一次只錄一個字（按別字會先停掉前一個正在錄的、各鈕自我復位），防連點 busy 守衛。換句/換頁/重新評分皆 `clearDrillRecordings` 停錄音、revoke 所有 blob URL、釋放麥克風，不殘留不洩漏。
- 註：第 6 輪逐詞高亮、第 8 輪逐音 drill、第 9 輪句子錄音對照、第 10 輪音節+字重音、第 11 輪句重音、第 12 輪節拍器、第 13 輪波形/速度全維持；本輪補上「**單字層**錄自己 vs 示範」這塊發音閉環缺口。

**驗證證據**
- 本機真 Chrome（puppeteer-core 驅動、fake 音訊裝置→真實 getUserMedia→MediaRecorder、fake STT 走真實 evaluate→drill 渲染、375px 手機）端到端 **15/15 PASS、0 console error**（`tools/verify_word_record.mjs`）：fake 裝置實錄到 bytes→drill 4 字皆有「🎤 跟我唸」→真實點按進入「🔴 錄音中」→3 秒自動停鈕變「🎤 重錄這個字」→出「🔊 示範/🎧 我的錄音」對照→點兩鈕回放無錯→句子層對照卡無回歸→換句單字對照與結果清乾淨不殘留。
- regression 全綠、確認無回歸：句子錄音對照 `verify_compare.mjs` **12/12**、波形/速度 `verify_wave.mjs` **16/16**、逐音 drill `verify_shadowing.mjs` **12/12**、節拍器 `verify_metronome_e2e.mjs` **15/15**，皆 0 console error。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 13/13 PASS、0 console error**（`tools/verify_word_record_live.mjs`）：線上真實錄音→單字對照卡出現可點、句子層無回歸、換句清乾淨。線上 curl 實證 modes.js(`wireDrillRecord`)、style.css(`drill-cmp-mine`) 皆在。
- git 961363e push main + wrangler deploy 主(english-tutor-ai 1d6aaac1)+legacy(english-tutor-e1l c7315a66)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
1. 發音核心再深化：波形上**疊示範參考線/標出停頓段**（讓波形對照更直覺）、或節拍器加**調速（慢/標準）**讓初學者跟得上。
2. 節奏教學深化：常見句重音規則小卡（資訊焦點/對比重音、句尾上揚 vs 下降語調）。
3. 內容再擴充：商務/旅遊主題分類、對話分支選項（難度分級、初學者友善）。
4. 慶祝/成就升級：里程碑徽章點開「成就牆」、達標輕量音效（尊重靜音）。
5. onboarding 進階：第 2 步問學習動機（旅遊/工作/考試）→ 推薦起始模式。
6. UX 體質：sticky 底部導覽列補 `.view` padding-bottom，讓長頁內容都能捲離導覽列。

---

### 第 15 輪 — 2026-06-29（節拍器調速：🐢慢速 / 🥁標準，初學者跟不上先放慢｜backlog #1）
**第 0 優先（網址）：第 3 輪已處理、本輪不需重做**
- 使用者派工提到「換網址 english-tutor.pages.dev」，但該名為全域唯一名、已被外部帳號（Voice Recorder）永久佔用、技術不可取得；第 3 輪已遷至乾淨網址 `english-tutor-ai.pages.dev`，instruction + log 皆同步。開工前雙站健康（HTTP 200）、working tree 乾淨。

**北極星研究（必做）**
- WebSearch「metronome adjustable tempo slow beginner rhythm pronunciation practice keep up」。借鏡音樂/語言節奏教學共識：①**初學者該設比目標更慢的速度**（60–80BPM 起），**準確度優先於速度**——學新材料一律先慢；②「Speed Up / Time Trainer」漸進式訓練＝先在唸得對的慢速站穩，再往上加速；③穩定可調的拍點幫助內化節奏。落地點子：①給第 12 輪固定 94BPM 的節拍器加「慢速」選項（≈64BPM），跟不上的初學者先放慢把節奏唸穩 ②「🔊 跟著節奏唸一次」read-along 同步降速 ③邊打邊調速、立即套用。
- 來源：imusic-school.com/tools/online-metronome、goodmusicacademy.com（learner's guide：start slower, accuracy over speed）、jazzguitar.be / time-trainer（progressive speed-up）。

**本輪進化：句子節奏節拍器加「慢速/標準」調速（口說核心＝容易學的本命，正中 backlog #1）**
- 改動檔：`assets/js/modes.js`（`metroSlow` 狀態 + `METRO_MS{std:640,slow:940}`/`metroMs()`/`readAlongRate()`；toggleRhythm 加「速度 標準/慢速」分段切換鈕＋邊打邊調速無縫重啟；playMetronome 用 `metroMs()`、read-along 用 `readAlongRate()`）、`assets/css/style.css`（`.tempo-row/.tempo-lbl/.tempo-opt(.on)`）。純加法、低風險、可回退。
- **跟不上就放慢**：節奏面板新增「速度：🥁 標準 / 🐢 慢速」分段鈕。慢速＝拍距 940ms(≈64BPM，比標準 640ms/≈94BPM 慢一截)，讓初學者先在「唸得對」的慢速把每個重音字唸足、虛詞滑過，把節奏唸穩了再切標準＝accuracy over speed、progressive speed-up。
- **read-along 同步降速**：「🔊 跟著節奏唸一次」在慢速時用 0.62 倍速（標準 0.8），跟讀示範也跟著放慢、跟得上。
- **邊打邊調速**：節拍器正在打的當下切換速度 → 立即停掉、以新速度無縫重啟（不必先停再開）；預設標準，切句/收合面板沿用既有「收乾淨」保證（停 timer、清亮點、釋放）。
- **不增負擔＋絕不破壞既有**：WebAudio 全程 best-effort try/catch 不變；調速只動拍距常數，不影響重音判定(第11輪)/亮點同步(第12輪)/句子節奏標記/跟讀/評分任何既有功能。
- 註：第 6 輪逐詞高亮、第 8 輪逐音 drill、第 9 輪句子錄音對照、第 10 輪音節+字重音、第 11 輪句重音、第 12 輪節拍器、第 13 輪波形/速度、第 14 輪單字錄音對照全維持；本輪把第 12 輪「聽得到打得出」的節拍器補上「**跟不上就放慢**」這塊初學者友善缺口。

**驗證證據**
- 本機真 Chrome（puppeteer-core 驅動、真 WebAudio 攔 `osc.start` 量測**真實拍距**、375px 手機）端到端 **10/10 PASS、0 console error**（`tools/verify_tempo_e2e.mjs`）：調速列在、預設標準選中→量標準拍距**中位數 642ms**→切慢速高亮切換→量慢速**中位數 948ms**→慢比標準寬 306ms→邊打邊切慢速仍在運作且拍距套用(932ms)→切句收乾淨不殘留。
- regression 全綠、確認無回歸：節拍器 `verify_metronome_e2e.mjs` **15/15**、句子節奏 `verify_rhythm_e2e.mjs` **13/13**、逐音 drill `verify_shadowing.mjs` **12/12**，皆 0 console error。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 6/6 PASS、0 console error**（`tools/verify_tempo_live.mjs`）：線上量到**標準 642ms / 慢速 947ms**、慢比標準寬 305ms、調速高亮切換正常。線上 curl 實證 modes.js(metroSlow/tempo-opt/readAlongRate ×10)、style.css(tempo-opt ×2) 皆在。
- git fd8d836 push main + wrangler deploy 主(english-tutor-ai d034f3fb)+legacy(english-tutor-e1l c6df1c6b)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
1. 發音核心再深化：波形上**疊示範參考線/標出停頓段**（讓波形對照更直覺，第 13 輪波形延伸，尚未做）。
2. 節奏教學深化：常見句重音規則小卡（資訊焦點/對比重音、句尾上揚 vs 下降語調）。
3. 內容再擴充：商務/旅遊主題分類、對話分支選項（難度分級、初學者友善）。
4. 慶祝/成就升級：里程碑徽章點開「成就牆」、達標輕量音效（尊重靜音）。
5. onboarding 進階：第 2 步問學習動機（旅遊/工作/考試）→ 推薦起始模式。
6. UX 體質：sticky 底部導覽列補 `.view` padding-bottom，讓長頁內容都能捲離導覽列。

[小組長 13:52] 督導：兩站皆健康(english-tutor-ai 與 legacy e1l 皆 HTTP 200、size 4263 一致)。第15輪「節拍器調速(🐢慢速/🥁標準，跟不上先放慢)」確實上線(git fd8d836 部署 d034f3fb/c6df1c6b)、正中 backlog #1，做了北極星研究(節奏教學共識：初學者先慢、accuracy over speed、progressive speed-up)、10本機(真 WebAudio 量拍距 標準642/慢速948ms)+6線上真機 0 console error、regression 全綠(metronome15/rhythm13/shadowing12)，第8→9→10→11→12→13→14→15**連八輪深化發音/口說核心**(音素→句錄音→音節重音→句節奏→節拍器→波形速度→單字錄音→節拍器調速)、無空轉無偏離，本命扎實。稽核時 lock(13:52:22)極新鮮=第16輪正在跑、log 未產出。→ 導正：又見「殘留 pin 誘導重做＝空轉」風險——evolve_instruction ✅清單只到第14輪、⭐pin 仍把「節拍器調速(慢/標準)」標為「尚未做」(=第15輪已正中做完)。已把第15輪補進已完成清單、⭐pin 改釘真正未做的口說缺口「波形疊示範參考線/標停頓段(第13輪延伸)」並明標第9–15輪勿重做、補次選清單防口說缺口耗盡時空轉，與 log 對齊、緊扣口說本命。僅校正已完成狀態(嚴格正確、第16輪已讀過不受影響、保護第17輪不重做)，非 race。靜默不擾人。

---

### 第 16 輪 — 2026-06-29（發音核心再深化：波形疊「示範重音參考線」+ 標出停頓段｜backlog #1，正中小組長 13:52 ⭐pin）
**第 0 優先（網址）：第 3 輪已處理、本輪不需重做**
- 使用者派工提到「換網址 english-tutor.pages.dev」，但該名為全域唯一名、已被外部帳號（Voice Recorder）永久佔用、技術不可取得；第 3 輪已遷至乾淨網址 `english-tutor-ai.pages.dev`，instruction + log 皆同步。開工前雙站健康（HTTP 200）、working tree 乾淨。

**北極星研究（必做）**
- WebSearch「ELSA Speak waveform overlay native reference compare pronunciation pause detection beginner feedback」。借鏡 ELSA：①回饋以**色彩/視覺化定位錯誤**對初學者最友善；②**量測停頓/猶豫/語速**判斷流暢度（fluency）——停頓多＝不連貫；③錄完可**與母語者示範並列對照**靠「看出差異」最快自我修正。落地 3 點子：①把學生波形上的**內部停頓段**標出來（看得到自己哪裡卡住），引導「把字連起來唸」；②疊一條**示範重音參考線**（哪些字該使勁＝實詞，借第 11 輪 sentenceStress 的「實詞重·虛詞弱」），讓學生對照「我把勁使在對的字上了嗎」；③一句話判語給可立即照做的修正。
- 來源：blog.elsaspeak.com（advantage of ELSA feedback）、talkpal.ai（ELSA Speech Analyzer 停頓/語速/重音）、skywork.ai（phoneme-level color-coded feedback）。

**本輪進化：波形對照卡升級「示範重音參考線 + 停頓段標記」（口說核心＝容易學的本命，正中 backlog #1／⭐pin）**
- 改動檔：`assets/js/modes.js`（`drawWave` 升級＋新增 `detectPauses`/`stressEnvelope`；對照卡波形區加圖例＋動態 `wave-tip`）、`assets/css/style.css`（`.wave-legend`/`.wl-*`/`.wave-tip`/`.wt-ref`、canvas 高 54→58）。純加法、低風險、可回退。
- **疊示範重音參考線**：在「我的聲音」青柱波形上，疊一條**琥珀色階梯線**——把第 11 輪 `sentenceStress` 判定的句重音（實詞高 1.0／虛詞低 0.36）依字序由左到右畫成參考線、實詞落點加小圓點。學生一眼對照「我把勁使在對的字（線高的實詞）上了嗎？虛詞有沒有輕輕滑過？」誠實標為**示範參考線（理想重音落點）**，非宣稱抓取 TTS 真實音檔（Web Speech API 無法取音）。
- **標出停頓段**：`detectPauses` 從我的**真實錄音包絡**抓連續低能量段（排除頭尾還沒開口/收尾的靜音），用**灰帶**標在波形上＝看得到「我唸到一半在哪裡停頓/猶豫」（時間正確、源自真實錄音）。
- **動態教學文案**：`wave-tip` 依偵測結果給話——有停頓→「中間停頓了 N 次（灰色段）——把字連起來唸會更順」；無停頓→「很連貫！」；兩種都引導「對著琥珀線：線高的實詞使勁、線低的虛詞輕帶」。圖例三色（你的聲音／示範重音字／你的停頓）。
- **絕不破壞既有＋不增負擔**：全程 best-effort——沒錄到音/解碼失敗 → 不出波形卡，STT/評分/drill/速度對照一切照舊；`sentenceStress` try/catch 失敗就只畫波形不畫參考線。換句/換頁沿用既有 clearRecording 釋放、波形/圖例/tip 一併清不殘留。
- 註：第 6 輪逐詞高亮、第 8 輪逐音 drill、第 9 輪句錄音對照、第 10 輪音節+字重音、第 11 輪句重音、第 12 輪節拍器、第 13 輪波形/速度、第 14 輪單字錄音、第 15 輪節拍器調速全維持；本輪把第 13 輪「看得到波形」升級成「**看得出我把勁使在對的字上了嗎、哪裡停頓**」的對照閉環。

**驗證證據**
- 本機真 Chrome（puppeteer-core 驅動、fake 音訊裝置→真實 getUserMedia→MediaRecorder→真實 decodeAudioData、fake STT 走真實 evaluate→drawWave、375px 手機）端到端 **15/15 PASS、0 console error**（`tools/verify_wave_ref.mjs`）：波形 canvas 真畫出**青柱(我的聲音)1076 px + 琥珀參考線 877 px**→圖例三項齊→wave-tip 顯示連貫/停頓教學文案+引導琥珀線→`sentenceStress` 真給目標句實詞 4·虛詞 2(參考線資料源正確)→速度對照/drill 無回歸→換句波形/圖例/tip 全清不殘留。
- regression 全綠、確認無回歸：波形/速度 `verify_wave.mjs` **16/16**、句錄音對照 `verify_compare.mjs` **12/12**、單字錄音 `verify_word_record.mjs` **15/15**、節拍器 `verify_metronome_e2e.mjs` **15/15**、逐音 drill `verify_shadowing.mjs` **12/12**，皆 0 console error。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 7/7 PASS、0 console error**（`tools/verify_wave_ref_live.mjs`）：線上波形青柱 1076+琥珀參考線 877 px、圖例三項齊、wave-tip 教學文案、drill 無回歸。線上 curl 實證 modes.js(detectPauses/stressEnvelope/wave-legend/wave-tip/示範重音參考線)、style.css(wave-legend/wave-tip/wl-ref/wt-ref) 皆在。
- git a3a5c4c push main + wrangler deploy 主(english-tutor-ai 432ab925)+legacy(english-tutor-e1l a48364ab)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
1. 節奏教學深化：常見句重音規則小卡（資訊焦點/對比重音、句尾上揚 vs 下降語調）——口說核心、波形/重音系列已相當完整，可往「語調 intonation」這塊未碰的新缺口走。
2. 內容再擴充：商務/旅遊主題分類、對話分支選項（難度分級、初學者友善）。
3. 慶祝/成就升級：里程碑徽章點開「成就牆」、達標輕量音效（尊重靜音）。
4. onboarding 進階：第 2 步問學習動機（旅遊/工作/考試）→ 推薦起始模式。
5. UX 體質：sticky 底部導覽列補 `.view` padding-bottom，讓長頁內容都能捲離導覽列。
- ※口說核心（音素→句錄音→音節重音→句節奏→節拍器→波形速度→單字錄音→節拍器調速→波形參考線/停頓）已**連九輪**深化、單字層+句子層+波形對照閉環大致補齊；下一輪可考慮往**語調(intonation 升降調)**這塊唯一尚未碰的口說缺口，或回頭補非口說的低門檻體驗（成就牆/動機 onboarding），避免在已飽和的子題上空轉。

[小組長 13:22] 督導：線上站 english-tutor-e1l HTTP 200 健康。第14輪「單字 drill 逐字錄音對照(錄我這個字 vs 示範，下沉單字層)」確實上線(git 961363e 部署 1d6aaac1/c7315a66)、正中我 12:51 ⭐pin，做了北極星研究(ELSA 單字/音素層回饋+錄音對比)、15本機+13線上真機 0 console error、regression 全綠(compare12/wave16/shadowing12/metronome15)，第8→9→10→11→12→13→14**連七輪深化發音/口說核心**(音素→句錄音→音節重音→句節奏→節拍器→波形速度→單字錄音)、無空轉無偏離，本命扎實。稽核時 lock(13:22:19)極新鮮=第15輪正在跑、log 未產出。→ 導正：又見「殘留 pin 誘導重做＝空轉」風險——evolve_instruction ✅清單只到第13輪、⭐pin 仍把「單字 drill 逐字錄音對照」標為「尚未做＝最該補缺口」(=第14輪已正中做完)。已把第14輪補進已完成清單、⭐pin 改釘真正未做缺口「波形疊示範參考線/標停頓段(第13輪延伸)+節拍器調速(慢/標準)」並明標第9–14輪勿重做，與 log 對齊、緊扣口說本命。僅校正已完成狀態(嚴格正確、第15輪已讀過不受影響、保護第16輪不重做)，非 race。靜默不擾人。

[小組長 14:02] 督導：線上站 english-tutor-e1l HTTP 200(0.11s)健康。第16輪「波形疊示範重音參考線+標停頓段」確實上線(git a3a5c4c/802e07b 部署 432ab925/a48364ab)、正中我 13:52 ⭐pin，做了北極星研究(ELSA 視覺化定位錯誤+停頓/語速 fluency)、15本機+7線上真機 0 console error、regression 全綠(wave16/compare12/word15/metronome15/shadowing12)，產品本命扎實。→ 導正(本輪非僅校狀態，含方向轉舵)：①又見「殘留 pin 誘導重做＝空轉」——evolve_instruction ✅清單只到第15輪、⭐pin 仍把「波形疊示範參考線/停頓」標為「尚未做＝最該補缺口」(=第16輪已正中做完)，已補第16輪進已完成清單。②更重要：發音/口說核心已**連九輪(第8–16輪)深化到飽和**(音素→句錄音→音節重音→句節奏→節拍器→波形速度→單字錄音→節拍器調速→波形參考線/停頓)，再鑽波形/節拍器/錄音類微調＝邊際遞減；而北極星「容易學」明列「動力持續/借鏡 Duolingo-Babbel」已久未碰。故 ⭐pin 改為**強制換子題**，二選一導正：(A)語調 intonation 升降調(口說唯一未碰新缺口) 或 (B)動力持續/低門檻(streak 凍結保護/動機 onboarding/成就牆，更貼北極星廣度)，並明標第8–16輪勿重做。此舉防「在已飽和子題上空轉」並把方向拉回北極星廣度。靜默不擾人。

---

### 第 17 輪 — 2026-06-29（句尾語調 intonation 升降調：旋律線 + 升/降箭頭 + 白話理由｜正中小組長 14:02 ⭐pin 選項 A，口說唯一未碰新缺口）
**第 0 優先（網址）：第 3 輪已處理、本輪不需重做**
- 使用者派工提「換網址 english-tutor.pages.dev」，但該名為全域唯一名、已被外部帳號（Voice Recorder）永久佔用、技術不可取得；第 3 輪已遷至乾淨網址 `english-tutor-ai.pages.dev`，instruction + log 皆同步。開工前雙站健康（HTTP 200）、working tree 乾淨。

**北極星研究（必做）**
- WebSearch「teaching English intonation rising/falling beginners app design」＋「ELSA Speak intonation feedback pitch contour visualization」。教學共識：①**Yes/No 問句句尾上揚 ↗**（在徵詢「是/否」）②**Wh- 問句、直述句、命令/感嘆句句尾下降 ↘**（語氣肯定、給的是內容不是是/否）③教初學者要**用簡單句＋大量模仿**，先讓人「察覺」高低變化再跟著唸。ELSA 借鏡：以**色彩/視覺化定位**對初學者最友善、可視化 pitch contour。落地 3 點子：①把每句切子句、自動判句尾該升/降，畫成**看得見的旋律線**②一句白話講「為什麼這裡升/降」③配「🔊 聽語調示範」讓 TTS 自然示範（問句自然上揚、直述句下降），看懂+模仿最容易學。
- 來源：human.libretexts.org（Intonation: Statements and Questions）、englishgrammargenius.com（rising/falling rules）、blog.elsaspeak.com（pitch/energy contour、how L1 intonation affects English）、speechanalyzer.elsaspeak.com。

**本輪進化：句尾語調（升降調）導覽 — 口說核心唯一尚未碰的「melody」缺口（＝容易學的新面向）**
- 改動檔：`assets/js/scoring.js`（新增 `sentenceIntonation(text)`：依句末標點切子句，規則式判句尾升降——Yes/No↗、Wh-/直述/感嘆↘，回 `{text,words,dir,type,reason}`）、`assets/js/modes.js`（renderShadowing 加「🎶 句尾語調」toggle＋`toggleIntonation`/`intonCurveSVG`：每子句畫旋律線 SVG＋升/降箭頭＋白話理由＋「🔊 聽語調示範」）、`assets/css/style.css`（`.inton-*`/`.into-*`：綠↗ vs 藍↘ 色彩區別 melody）。純加法、低風險、可回退。
- **看得見的旋律線**：每個子句畫一條 SVG 旋律線——上揚句尾線往上＋綠色箭頭 ↗、下降句尾線往下＋藍色箭頭 ↘，把抽象的「語調起伏」變成一眼看懂的圖。
- **白話講為何**：每句一行理由（Yes/No 問句＝在徵詢→上揚；Wh-/直述＝語氣肯定→下降），不只標箭頭、還教「為什麼」＝學得起來。
- **聽得到**：「🔊 聽語調示範」用 readAlong（TTS 對含「?」的問句自然上揚、直述句下降），看懂旋律線後跟著模仿；誠實——規則式教學起點，不宣稱偵測真實音高（Web Speech 無法取 TTS 音高曲線）。
- **多子句正確切分**：如「I don't understand. Can you repeat that?」自動切成 直述句↘ ＋ Yes/No 問句↗ 兩條旋律線分別教。
- **不增負擔＋絕不破壞既有**：預設收合（toggle 才出）、切句/換頁 draw 重建自動清空、`sentenceIntonation` 空輸入回 []；不影響第 6–16 輪任何口說功能（逐詞高亮/drill/錄音對照/音節重音/句節奏/節拍器/波形）。

**驗證證據**
- 本機 node 單元測試 **12/12 PASS**：Yes/No↗、Wh-↘、直述↘、感嘆↘、多子句切分、全 23 句句庫覆蓋無爆、空/純標點回 []、語調分佈全句庫人工核對正確。
- 本機真 Chrome（puppeteer-core 驅動、375px 手機、用 idx15「I don't understand. Can you repeat that?」一句涵蓋升+降兩種旋律）端到端 **19/19 PASS、0 console error**（`tools/verify_intonation_e2e.mjs`）：toggle 出語調卡→切 2 子句→第1直述句↘藍、第2 Yes/No↗綠→每子句畫得出旋律線 path＋箭頭 polygon→升/降顏色不同→每句有白話理由→教學文案/底部引導/聽示範鈕齊→點聽示範無錯→收合乾淨→切句不殘留→下一句(直述句)全下降。
- regression 全綠、確認無回歸：句子節奏 `verify_rhythm_e2e.mjs` **13/13**、節拍器 `verify_metronome_e2e.mjs` **15/15**、逐音 drill `verify_shadowing.mjs` **12/12**、波形參考線 `verify_wave_ref.mjs` **15/15**、節拍器調速 `verify_tempo_e2e.mjs` **10/10**，皆 0 console error。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 19/19 PASS、0 console error**（`tools/verify_intonation_live.mjs`）：線上升/降旋律線+箭頭+理由+聽示範全正常。線上 curl 實證 scoring.js(`sentenceIntonation`)、modes.js(`toggleIntonation`/`intonCurveSVG`/`intonBtn` ×5)、style.css(`.inton-card`/`.into-clause`/`.into-line` ×6) 皆在。
- git 3fda41b push main + wrangler deploy 主(english-tutor-ai 2d14854b)+legacy(english-tutor-e1l 571cf82c)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
- ※口說核心已**連十輪(第8–17輪)**深化(音素→句錄音→音節重音→句節奏→節拍器→波形速度→單字錄音→節拍器調速→波形參考線/停頓→**句尾語調**)，單字層+句子層+波形+節奏+語調閉環大致補齊；建議下一輪**換子題回北極星廣度**，勿在已飽和口說子題上空轉。
1. **動力持續/低門檻（更貼北極星廣度，久未碰）**：streak 凍結保護（漏一天不直接歸零、給 1 次救回）、達標輕量音效（尊重靜音）、里程碑徽章點開「成就牆」。
2. onboarding 進階：第 2 步問學習動機（旅遊/工作/考試）→ 推薦起始模式。
3. 內容再擴充：商務/旅遊主題分類、對話分支選項（難度分級、初學者友善）。
4. 語調深化（若回口說）：對比重音/資訊焦點（同句強調不同字＝不同意思）、list 列舉語調（每項上揚、最後一項下降）。
5. UX 體質：sticky 底部導覽列補 `.view` padding-bottom，讓長頁內容都能捲離導覽列。

---

### 第 18 輪 — 2026-06-29（換子題回北極星廣度：連續保護 streak freeze｜小組長 14:02 ⭐pin 選項 B「動力持續」、backlog #1）
**第 0 優先（網址）：第 3 輪已處理、本輪不需重做**
- 使用者派工提「換網址 english-tutor.pages.dev」，但該名為全域唯一名、已被外部帳號（Voice Recorder）永久佔用、技術不可取得；第 3 輪已遷至乾淨網址 `english-tutor-ai.pages.dev`，instruction + log 皆同步。開工前雙站健康（HTTP 200）、working tree 乾淨。
- **本輪正式換子題**：口說核心已連十輪(第8–17輪含第17輪語調)深化到飽和，依小組長 14:02 ⭐pin「強制換子題」之選項 B（動力持續/低門檻、更貼北極星廣度、久未碰），做 backlog #1「streak 凍結保護」。

**北極星研究（必做）**
- WebSearch「Duolingo streak freeze / achievements / 留存 / 降門檻動機」。借鏡 Duolingo：①**streak freeze 是留存最強的單一機制**——保護連續天數不因漏一天而歸零，降低「斷連焦慮」同時保住損失趨避動力；實測**對「即將斷連」的高風險使用者降低 churn 21%**、7 天以上連續使用者留存是無連續者的 2.4×。②設計成**零摩擦、免購買、自動賺得**對初學者最友善（day-one 低門檻成就感）。③保護是「保住投入」而非「免責放縱」，仍維持每天回來的核心迴圈。落地點子：①漏一天有保護→自動補回缺口、連續不歸零，給安心回饋；②持續練習自動賺保護（不需付費/不需找入口）；③首頁看得到保護存量＋「再 X 天解鎖」當動力。
- 來源：trophy.so/blog/duolingo-gamification-case-study、blog.duolingo.com/how-duolingo-streak-builds-habit、trypropel.ai（streak freeze 降 churn 21%）、strivecloud.io。

**本輪進化：連續保護（streak freeze）— 動力持續層，降低「斷連就前功盡棄」的最大放棄點（＝更容易持續學）**
- 改動檔：`assets/js/app.js`（`isDayBeforeYesterday` 判前天、`getStreak` 加 `freezes`、`MAX_FREEZE=2`/`FREEZE_EARN_EVERY=3`/`freezesToNext()`、bumpDaily 改寫連續天數判定：昨天接續／漏一天+有保護補回缺口消耗1張+跳安心 toast／漏≥2天或無保護歸零）、`assets/js/modes.js`（renderHome daily 卡顯示保護狀態列）、`assets/css/style.css`（`.streak-freeze`/`.sf-*`）。純加法、低風險、可回退、舊資料相容（無 freezes 視為 0）。
- **漏一天不歸零**：回來時若「剛好漏掉昨天一天」且有保護 → 消耗 1 張、把缺口補回、連續天數照常 +1（不歸零），並跳「🛡️ 連續保護生效！昨天的缺口已自動補上」安心回饋（鬆一口氣＝動力持續）。
- **保護只擋一天、零摩擦自動賺**：漏 ≥2 天或無保護則正常歸零（保護不被多日缺口消耗）；持續練習**連續每滿 3 天自動 +1 張**（上限 2 張），不需付費、不需找任何入口＝最符「容易學」。
- **首頁看得到**：daily 卡有保護時顯示「🛡️ 連續保護 ×N・漏一天也不中斷」，無保護但有連續時顯示「再 X 天解鎖連續保護」當動力提示；「清除學習進度」一併清（freezes 存在 streak 物件內）。
- 註：第 6–17 輪所有口說功能（逐詞高亮/drill/錄音對照/音節重音/句節奏/節拍器/波形/語調）全維持不動；本輪是**換子題**到動力持續層、不碰口說。

**驗證證據**
- 本機真 Chrome（puppeteer-core 驅動、375px 手機、**dynamic import 既載入的 app.js 真實 addStat→bumpDaily 路徑**而非另寫一份邏輯，用同一日期格式產昨天/前天/前3天 key）端到端 **19/19 PASS、0 console error**（`tools/verify_streak_freeze.mjs`）：昨天接續 4→5 不動保護／漏一天有保護保住 4→5(非1)+消耗1張+安心 toast／漏一天無保護歸零(→1,best 保留)／漏2天即使有保護也歸零且保護不消耗(仍2)／連續滿3天自動賺1張／保護達上限2不溢出／同一天再練不重複累加／getStreak 含 freezes／首頁「🛡️連續保護×2」與「再X天解鎖」狀態列／清除進度 freezes 歸0。
- regression 全綠、確認無回歸：句尾語調 `verify_intonation_e2e.mjs` **19/19**、節拍器 `verify_metronome_e2e.mjs` **15/15**、逐音 drill `verify_shadowing.mjs` **12/12**，皆 0 console error。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 10/10 PASS、0 console error**（`tools/verify_streak_freeze_live.mjs`）：線上保護補回缺口/歸零/自動賺/首頁狀態列全正常。線上 curl 實證 app.js(freezesToNext/FREEZE_EARN_EVERY/isDayBeforeYesterday/連續保護生效)、modes.js(streak-freeze/連續保護 ×)、style.css(streak-freeze/sf-ico) 皆在。
- git 5e4a9d4 push main + wrangler deploy 主(english-tutor-ai e6dedd04)+legacy(english-tutor-e1l c8723e55)皆成功、兩站 HTTP 200（legacy 亦含 freezesToNext）。

**下一輪 backlog 想法（優先序建議）**
- ※動力持續層本輪起步（連續保護）；可續做同層其他低門檻/動機項，或回內容廣度。
1. 動力持續續做：里程碑徽章點開「**成就牆**」（收集慾、看得到所有已得/未解鎖成就）、達標輕量音效（尊重靜音、可關）。
2. onboarding 進階：第 2 步問學習動機（旅遊/工作/考試）→ 推薦起始模式（降門檻、貼北極星）。
3. 內容再擴充：商務/旅遊主題分類、對話分支選項（難度分級、初學者友善）。
4. 語調深化（若回口說）：對比重音/資訊焦點、list 列舉語調。
5. UX 體質：sticky 底部導覽列補 `.view` padding-bottom，讓長頁內容都能捲離導覽列。

[小組長 14:54] 督導：兩站皆健康（english-tutor-ai 與 legacy e1l 皆 HTTP 200、size 4263 一致），第17輪「句尾語調 intonation 升降調」確實上線實證（scoring.js `sentenceIntonation`、modes.js `toggleIntonation`×2 線上 curl 在、JS 全 200），正中我 14:02 ⭐pin 選項 A（口說唯一未碰的 melody 新缺口）、做了北極星研究（升降調教學共識+ELSA pitch contour）、12單測+19本機+19線上真機 0 console error、regression 全綠，本命扎實。稽核時 lock(14:53:24)極新鮮=第18輪正在跑、log 未產出。→ 導正（又見「殘留 pin 誘導重做＝空轉」風險）：evolve_instruction ✅清單只到第16輪、⭐pin 仍把「(A)語調 intonation」標為「口說唯一尚未碰新缺口＝可做」（=第17輪已正中做完），會誘導後續輪以同理由重做。已①把第17輪句尾語調補進已完成清單；②⭐pin 由「二選一(A語調/B動力)」改為**唯一硬性鎖定 (B) 動力持續/低門檻（streak 凍結保護/動機 onboarding/成就牆，借鏡 Duolingo-Babbel）**，並明標「語調已第17輪做完、勿再以口說唯一缺口為由重做」、第8–17輪全列勿重做。理由：口說核心連十輪(第8–17)飽和、北極星「容易學」明列的動力持續/借鏡付費軟體連十七輪幾乎沒碰＝當前最該補的北極星廣度缺口。僅校正已完成狀態(嚴格正確、第18輪已讀過不受影響、保護第19輪不重做)，非 race。靜默不擾人。

[小組長 15:24] 督導：兩站皆健康(english-tutor-ai HTTP 200/0.11s、legacy e1l 200/0.11s)、五大資產(app/modes/scoring/data.js+style.css)皆 200。第18輪「連續保護 streak freeze」確實上線實證(線上 app.js curl 含 freezesToNext/FREEZE_EARN_EVERY/isDayBeforeYesterday)，正中我 14:54 ⭐pin 選項 B「動力持續/低門檻」backlog #1，做了北極星研究(Duolingo streak freeze 降 churn 21%/留存 2.4×)、19本機+10線上真機 0 console error、regression 全綠(intonation19/metronome15/shadowing12)、舊資料相容，成功從連十輪飽和的口說核心換子題回北極星廣度、無空轉無偏離。稽核時 lock(15:24:27)極新鮮=第19輪正在跑、log 未產出。→ 導正(又見「殘留 pin 誘導重做＝空轉」風險)：evolve_instruction ✅清單只到第17輪、🔴pin 仍把「①streak 凍結保護」列為可選項(=第18輪已正中做完)，會誘導第19/20輪重做。已①把第18輪連續保護補進✅已完成清單；②🔴pin 移除已完成的①streak freeze、收斂為真正未碰的二選一「①學習動機 onboarding ②成就牆」，並在「勿重做」清單明標 streak freeze=第18輪已做、勿再以「動力持續起步」為由重做。僅校正已完成狀態(嚴格正確、第19輪已讀過不受影響、保護第20輪不重做)，非 race。靜默不擾人。

---

### 第 19 輪 — 2026-06-29（動力持續層：成就牆 + 達標輕量音效｜正中小組長 15:24 🔴pin 二選一之「②成就牆」）
**第 0 優先（網址）：第 3 輪已處理、本輪不需重做**
- 使用者派工提「換網址 english-tutor.pages.dev」，但該名為全域唯一名、已被外部帳號（Voice Recorder）永久佔用、技術不可取得；第 3 輪已遷至乾淨網址 `english-tutor-ai.pages.dev`，instruction + log 皆同步。開工前雙站健康（HTTP 200）、working tree 乾淨。
- **延續第 18 輪換子題、留在動力持續層**：依小組長 15:24 🔴pin 收斂後的二選一（①動機 onboarding ②成就牆），本輪做 ②成就牆（第 18 輪 backlog #1）。口說核心已連十輪(第8–17)飽和、streak freeze 第18輪已做，不重做。

**北極星研究（必做）**
- WebSearch「Duolingo achievements page collection wall locked unlocked badges motivation gamification」。借鏡 Duolingo 成就系統：①成就像「獎盃陳列在架上」**全部收集在一處**——簡單徽章給新手(加好友)、稀有徽章給堅持者(年度連續)，外加驚喜成就；②**多層級成就**貫穿學習旅程，**即使進度看起來慢也能不斷有小成就感**維持動力；③導入徽章系統後實測**內購 +13%、加好友 +116%**＝收集慾驅動力強。落地 3 點子：①把所有成就攤在「一面牆」、**已解鎖看得到、未解鎖也看得到『再差多少』**(進度條)＝收集慾+看得見下一個目標；②達標/解鎖那一刻補上**輕量音效**強化即時正向回饋(借鏡 Hooked 可變獎勵)，但**尊重靜音**可關；③成就由現有學習數據自動衍生、零額外負擔。
- 來源：blog.duolingo.com/achievement-badges、trophy.so/blog/duolingo-gamification-case-study、strivecloud.io/play/duolingo、nudgenow.com/blogs/duolingo-gamification-strategy。

**本輪進化：成就牆 + 達標輕量音效（動力持續層，補「看得到所有成就/收集慾」這一摩擦點＝更容易持續學）**
- 改動檔：`assets/js/app.js`（新增 `getAchievements`/`showAchievementWall` 成就牆、`isSoundOn`/`setSoundOn`/`playChime` 音效，並在 `showCelebration` 觸發 playChime）、`assets/js/modes.js`（首頁徽章列加 `id/role/tabindex` 可點 + 「🏅 成就牆 →」chip + 開牆事件）、`index.html`（設定面板加「🔊 達標音效」勾選 + 「🏅 成就牆」鈕）、`assets/css/style.css`（`.aw-*` 成就牆 overlay + `.sbadge-more` chip + `.field-row` 勾選列）。純加法、低風險、可回退。
- **成就牆（看得到所有成就）**：全部成就攤在一面牆，分 4 組共 16 項——**連續天數**(3🔥/7⭐/14💎/30👑/60🏆/100💯)、**練習次數**(10/50/100/300 🎯)、**單字探索**(20/50/150 📚)、**高分挑戰**(70/85/100 🌟)。已解鎖＝彩色「✓ 已解鎖」；**未解鎖＝灰階圖示＋進度條＋`cur/target`**(看得見再差多少→收集慾+下一個目標)。標題顯示「已解鎖 N / 16」。
- **零額外狀態**：成就全由**既有 localStorage**(`stats.practiced/words/best` + `streakBadges` + `streak.best`)衍生，不另記資料、不影響任何現有邏輯；進度用 `streak.best`(斷連不歸零)→進度不倒退。
- **兩個入口**：首頁徽章列整列可點(滑鼠/鍵盤 Enter/Space)、設定面板「🏅 成就牆」鈕；overlay 沿用 onboarding 視覺、點遮罩/「完成」關閉並清乾淨。
- **達標輕量音效（尊重靜音）**：達標/里程碑慶祝(`showCelebration`)時播一段短促上揚琶音(C5→E5→G5、WebAudio、~0.5s)，強化「達成那一刻」的即時回饋；**預設開、設定可關**(`soundOff` flag)，全程 best-effort——不支援 WebAudio／被瀏覽器擋就 try/catch 靜默，絕不影響任何功能。
- 註：第 6–18 輪所有功能（逐詞高亮/drill/錄音對照/音節重音/句節奏/節拍器/波形/語調/連續保護）全維持不動；本輪只在動力持續層加「成就牆＋音效」。

**驗證證據**
- 本機真 Chrome（puppeteer-core 驅動、375px 手機、**dynamic import 既載入的 app.js 真實模組**、種 stats/streakBadges 真實渲染）端到端 **21/21 PASS、0 console error**（`tools/verify_achievements.mjs`）：getAchievements 總數16/已解鎖數正確(本資料=8)/分4組/未解鎖含進度pct→首頁「🏅 成就牆 →」chip→點徽章列開牆→標題「已解鎖 8/16」→已解鎖8+未解鎖8 cell→已解鎖「✓ 已解鎖」/未解鎖有進度條+cur/target→「完成」關閉清乾淨→設定鈕也能開→音效預設開/關→soundOff=1/勾選框反映狀態/取消勾選→關閉。
- regression 全綠、確認無回歸：連續保護 `verify_streak_freeze.mjs` **19/19**、逐音 drill `verify_shadowing.mjs` **12/12**，皆 0 console error。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 12/12 PASS、0 console error**（`tools/verify_achievements_live.mjs`）：線上成就牆渲染/兩入口/音效設定全正常。線上 curl 實證 app.js(`showAchievementWall`)、modes.js(`streakBadges`)、style.css(`aw-cell`)、index.html(`openWall`) 皆在；legacy alias `english-tutor-e1l` 同步部署(app.js 含 showAchievementWall)、仍 200。
- git e33beb7 push main + wrangler deploy 主(english-tutor-ai 5be74be2)+legacy(english-tutor-e1l a86fe196)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
- ※動力持續層已做 streak freeze(第18輪)+成就牆/音效(第19輪)；剩同層唯一未碰大項＝**學習動機 onboarding**(15:24 pin 的另一選項①)。
1. **動機 onboarding（動力持續/低門檻，pin 唯一未做選項）**：onboarding 第 2 步問學習動機（旅遊/工作/考試）→ 依動機推薦起始模式 + 套用對應主題內容，降門檻、貼北極星廣度。
2. 內容再擴充：商務/旅遊主題分類、對話分支選項（難度分級、初學者友善）——可與動機 onboarding 綁定。
3. 成就牆深化：解鎖那一刻在牆上高亮新解鎖項、達標彩花同步；非里程碑的「冷門成就」(夜貓子/週末練習)增加收集驚喜。
4. 語調深化（若回口說）：對比重音/資訊焦點、list 列舉語調。
5. UX 體質：sticky 底部導覽列補 `.view` padding-bottom，讓長頁內容都能捲離導覽列。

[小組長 15:54] 督導：兩站皆健康(english-tutor-ai 與 legacy e1l 皆 HTTP 200、size 一致 3981、0.17/0.3s)；第19輪「成就牆+達標輕量音效」確實上線實證(線上 app.js curl 含 showAchievementWall+playChime，第18輪 freezesToNext 仍在=無回歸)，正中我 15:24 🔴pin 二選一之「②成就牆」、做了北極星研究(Duolingo 成就系統+13%內購/+116%加好友、收集慾)、21本機+12線上真機 0 console error、regression 全綠、成就全由既有 localStorage 衍生零額外狀態，續留動力持續層、無空轉無偏離。稽核時 lock(15:54:22)極新鮮=第20輪正在跑、log 未產出。→ 導正(又見「殘留 pin 誘導重做＝空轉」風險，與歷輪同模式)：evolve_instruction ✅清單只到第18輪、🔴pin 仍把「②成就牆」列為可選項(=第19輪已正中做完)，會誘導第20/21輪重做。已①把第19輪成就牆+音效補進✅已完成清單；②🔴pin 移除已完成的②成就牆、收斂為動力持續層唯一尚未碰的大項「學習動機 onboarding(第2步問動機→推薦起始模式+套主題)」，並在「勿重做」清單明標成就牆+音效=第19輪已做、勿再以「動力持續/收集慾」為由重做。僅校正已完成狀態(嚴格正確、第20輪已讀過不受影響、保護第21輪不重做)，非 race。靜默不擾人。

[小組長督導待補]

---

### 第 20 輪 — 2026-06-29（動力持續層：學習動機 onboarding → 推薦起始模式｜小組長 15:24 🔴pin 二選一之「①動機 onboarding」，唯一未做選項）
**第 0 優先（網址）：第 3 輪已處理、本輪不需重做**
- 使用者派工提「換網址 english-tutor.pages.dev」，但該名為全域唯一名、已被外部帳號（Voice Recorder）永久佔用、技術不可取得；第 3 輪已遷至乾淨網址 `english-tutor-ai.pages.dev`，instruction + log 皆同步。開工前雙站健康（HTTP 200）、working tree 乾淨。
- **留在動力持續層、做唯一未碰大項**：依小組長 15:24 🔴pin 收斂後二選一（①動機 onboarding ②成就牆），②成就牆已第 19 輪做完，本輪做①。口說核心連十輪(第8–17)飽和、streak freeze(第18)/成就牆(第19)已做，皆不重做。

**北極星研究（必做）**
- WebSearch「Duolingo / Babbel onboarding ask learning motivation goal recommend course beginner UX」。借鏡 Duolingo onboarding：①只問**最少的關鍵問題**（語言、動機、程度），把次要資料延後，降低初始摩擦；②**問一個「為什麼學」**（Travel / Career / Brain Training）→ 據此個人化後續推薦與 nudge，給使用者一個明確目標＝提升動機與留存；③問完立刻送進核心體驗，不要一次問太多。落地 3 點子：①onboarding 第 2 步後加「為什麼學英文」單一低摩擦問題（旅遊/工作/考試/日常）②據動機推薦最適合的**起始模式**並可一鍵直接開始（少一個選擇障礙）③不選也能照常開始（零摩擦、不強迫）。
- 來源：goodux.appcues.com/blog/duolingo-user-onboarding、userguiding.com/blog/duolingo-onboarding-ux、junoschool.org/article/duolingo-onboarding-experience。

**本輪進化：學習動機 onboarding → 推薦起始模式（動力持續/低門檻層，補「從哪開始」的選擇障礙＝更容易上手）**
- 改動檔：`assets/js/app.js`（新增 `LEARN_MOTIVES` 動機→模式對應表 + `getLearnMotive/setLearnMotive/getRecommendedMode`；onboarding 由 3 步擴為 4 步，新增「動機」步＋動態「推薦」步、`finish(route)` 可直接導向推薦模式、reset 清 `learnMotive`）、`assets/js/modes.js`（renderHome 依 `getRecommendedMode` 給對應模式卡掛「👍 為你推薦」緞帶並排到最前）、`index`（無）、`assets/css/style.css`（`.onb-motives/.onb-motive/.om-ico/.onb-recgo/.onb-recfoot` 動機選項與推薦 CTA、`.mode-card.mc-rec/.mc-rec-tag` 首頁推薦緞帶）。純加法、低風險、可回退、舊資料相容（無 learnMotive 視為未選）。
- **問動機（低摩擦單一問題）**：onboarding 第 3 步「你為什麼想學英文？」4 選項：✈️旅遊出國／💼工作職場／📖準備考試／🗣️日常開口；再點一次可取消（不強迫）。
- **據動機推薦起始模式**：第 4 步動態顯示「為你推薦：X」＋白話理由＋「👉 直接開始『X』」一鍵進該模式。對應：旅遊→💬情境對話、工作→🎤跟讀糾音、考試→📝文法填空、日常→🎤跟讀糾音（皆貼「最直接有用」原則降低學習門檻）。
- **首頁持續推薦**：選過動機後，首頁對應模式卡掛「👍 為你推薦」緞帶＋高亮邊框並排到最前，讓每次回來都少猶豫「從哪開始」。
- **零摩擦不強迫＋絕不破壞既有**：不選動機 → 推薦步退回原本通用模式清單、「開始學習」照常回首頁、首頁無緞帶；第 6–19 輪所有功能（口說全系列/連續保護/成就牆/音效）全維持不動。

**驗證證據**
- 本機真 Chrome（puppeteer-core 驅動、375px 手機、**dynamic import 既載入 app.js 真實模組** + 真實 onboarding/renderHome 渲染）端到端 **30/30 PASS、0 console error**（`tools/verify_motive_onboarding.mjs`）：新手出 onboarding→4 步→動機步 4 選項→選旅遊高亮→推薦『情境對話』+直接開始鈕→點直接開始 onboarding 清乾淨+learnMotive=travel+onboarded=1+導向 #conversation→首頁緞帶『👍 為你推薦』在情境對話且排最前+僅 1 張；路徑 B 不選動機→退回通用清單+無直接開始鈕+開始學習回首頁+learnMotive 空+無緞帶；動機→模式對應表 4/4 正確。
- regression 全綠、確認無回歸：成就牆 `verify_achievements.mjs` **21/21**、連續保護 `verify_streak_freeze.mjs` **19/19**，皆 0 console error。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 10/10 PASS、0 console error**（`tools/verify_motive_onboarding_live.mjs`）：線上新手 onboarding 4 步→動機選工作→推薦跟讀糾音+直接開始→導向 #shadowing+learnMotive=work→首頁推薦緞帶=跟讀糾音排最前。線上 curl 實證 app.js(LEARN_MOTIVES/getRecommendedMode/setLearnMotive ×7)、modes.js(mc-rec/getRecommendedMode ×3)、style.css(onb-motive/mc-rec-tag ×7) 皆在。
- git bc41e4e push main + wrangler deploy 主(english-tutor-ai 8b894cbe)+legacy(english-tutor-e1l edb9177c)皆成功、兩站 HTTP 200（legacy app.js 亦含 LEARN_MOTIVES）。

**下一輪 backlog 想法（優先序建議）**
- ※動力持續/低門檻層三大項已補齊：streak freeze(第18)+成就牆/音效(第19)+動機 onboarding(第20)；可往內容廣度或非口說的低門檻 UX 走，避免在動力層空轉。
1. 內容再擴充（貼動機）：依學習動機分主題內容（旅遊/商務/考試題庫分類）、對話分支選項（難度分級、初學者友善）——可與本輪動機綁定，讓推薦更名副其實。
2. 動機 onboarding 深化：依動機自動套用對應主題內容（非只推薦模式）、設定面板可單獨重選動機（目前靠「重看新手導覽」整套重來）。
3. 成就牆深化：解鎖那一刻在牆上高亮新解鎖項、冷門驚喜成就（夜貓子/週末練習）。
4. 語調深化（若回口說）：對比重音/資訊焦點、list 列舉語調。
5. UX 體質：sticky 底部導覽列補 `.view` padding-bottom，讓長頁內容都能捲離導覽列。

### 第 21 輪 — 2026-06-29（依學習動機推「目標精選句」首頁卡｜讓第20輪推薦名副其實，正中小組長 16:25 🔴pin「內容廣度・依動機分主題」）
**第 0 優先（網址）：第 3 輪已處理、本輪不需重做**
- 使用者派工提「換網址 english-tutor.pages.dev」，但該名為全域唯一名、已被外部帳號（Voice Recorder）永久佔用、技術不可取得；第 3 輪已遷至乾淨網址 `english-tutor-ai.pages.dev`，instruction + log 皆同步。開工前雙站健康（HTTP 200）、working tree 乾淨。
- **換子題到「內容面」、不重做 onboarding 流程**：第20輪 onboarding 問了動機卻只導「模式」、內容仍是同一套通用題庫＝推薦名不副實。本輪把推薦的**內容面補實**（小組長 16:25 🔴pin、第20輪 backlog #1+#2）。動力持續三大項(streak freeze 第18／成就牆+音效 第19／動機 onboarding 第20)已補齊、口說核心連十輪(第8–17)飽和，皆不重做。

**北極星研究（必做）**
- WebSearch「Duolingo/Babbel personalized content by learning goal travel/business lower friction relevance」。借鏡 Babbel：①依**學習目標**給最實用的內容——travel 一進門就教「I'd like a coffee」「Where's the nearest train station」這類**馬上用得到**的句子；②**可跳著學、聚焦個人需求**，把「幾個月練習真的累積成能在真實情境開口」當賣點；③Duolingo 重習慣、Babbel 重「對你的目標有用」。落地點子：①把句庫標上動機主題標籤、依使用者動機在首頁優先推對應主題句；②每句一鍵直接開口練（少一層選擇）；③沒選動機就不出（零摩擦不打擾）。
- 來源：babbel.com/compare-best-language-learning-apps、babbel.com/best-language-learning-apps-for-digital-nomads、polychatapp.com/blog/duolingo-vs-babbel。

**本輪進化：目標精選句（依學習動機推對應主題內容，讓「為你推薦」名副其實＝更容易學）**
- 改動檔：`assets/js/data.js`（SENTENCES 每句加 `topic`(travel/work/exam/daily)＋**append 4 句**補齊各主題 ≥3，append-only 不動既有索引/錯題 key）、`assets/js/modes.js`（renderHome：動機已設→依 `getLearnMotive` 篩出對應主題句最多 3 句，出「為『XX』精選句」卡；點一句→寫 `shadowIdx` 直接進跟讀糾音練該句）、`assets/css/style.css`（`.goal-card/.goal-item/.gi-*`）。純加法、低風險、可回退、舊資料相容。
- **依動機推主題內容**：首頁「📌 為『旅遊出國/工作職場/準備考試/日常開口』精選句」卡，列出**跟你目標最相關**的句子（旅遊→點咖啡/問路/機場、工作→開會/報告/排程、考試→閱讀測驗/選填、日常→寒暄/問句），每句附「🎤 開口練」。借鏡 Babbel「依目標先學最用得到的句子」。
- **一鍵直接練**：點精選句 → `localStorage.shadowIdx` 設成該句索引 + `navigate("shadowing")`，直接在跟讀糾音練那一句（少一層「先進模式再翻句」的摩擦）。**只寫 shadowIdx、不動任何錯題/索引語意**。
- **零摩擦不強迫＋絕不破壞既有**：沒選動機 → 不出卡（首頁 5 模式照常）；topic 主題標籤是純加法欄位，第20輪推薦緞帶、第6–19輪所有功能全維持不動。

**驗證證據**
- 本機真 Chrome（puppeteer-core 驅動、375px 手機、**dynamic import 既載入 app.js/data.js 真實模組** + 真實 renderHome 渲染）端到端 **20/20 PASS、0 console error**（`tools/verify_goal_pack.mjs`）：各主題句 ≥3(travel6/work8/exam4/daily10)／動機=旅遊出精選句卡(標題「為「旅遊出國」精選句」+✈️+3句+每句開口練鈕)+卡內每句 topic 都=travel／點第一句→shadowIdx=2+導向#shadowing+跟讀頁實際顯示「I would like a cup of coffee, please.」／動機=工作→卡切「為「工作職場」精選句」+💼+卡內每句 topic=work（內容隨動機改變）／未選動機→無精選句卡+5模式照常無回歸／回歸第20輪推薦緞帶仍在(旅遊→情境對話排最前)。
- regression 全綠、確認無回歸：動機 onboarding `verify_motive_onboarding.mjs` **30/30**、成就牆 `verify_achievements.mjs` **21/21**，皆 0 console error。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 9/9 PASS、0 console error**（`tools/verify_goal_pack_live.mjs`）：線上旅遊精選句卡/每句 topic=travel/點句→#shadowing+shadowIdx+顯示該句/未選動機無卡無回歸全正常。線上 curl 實證 modes.js(`goal-card`/`getLearnMotive`)、data.js(`topic:`/`airport`)、style.css(`.goal-item`) 皆在。
- git 3704bad push main + wrangler deploy 主(english-tutor-ai 16d7ef88)+legacy(english-tutor-e1l 1bd0aee8)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
- ※動力持續三大項(第18–20)＋本輪內容依動機分主題(第21)已補；可續做內容廣度或非口說低門檻 UX，避免空轉。
1. 內容深化（延續本輪）：依動機也篩**對話/單字**（目前只篩句子）、對話分支選項與難度分級、各主題再擴句量。
2. 設定面板可單獨重選學習動機（目前只能靠「重看新手導覽」整套重來）。
3. 成就牆深化：解鎖那一刻在牆上高亮新解鎖項、冷門驚喜成就（夜貓子/週末練習）。
4. 語調深化（若回口說）：對比重音/資訊焦點、list 列舉語調。
5. UX 體質：sticky 底部導覽列補 `.view` padding-bottom，讓長頁內容都能捲離導覽列。

[小組長督導待補]

---

[小組長 17:26] 督導：雙站皆健康(english-tutor-ai 200/0.077s、legacy e1l 200)。第22輪「對話依動機分主題+難度分級+自由跳級、單字依動機優先」確實上線實證(線上 data.js topic: 標籤 63 處、modes.js conv-chip/getLearnMotive、R18-21 freezesToNext/showAchievementWall/LEARN_MOTIVES/goal-card 全在=無回歸)，正中我 16:55 🔴pin「依動機篩單字+對話＋難度分級」、做了北極星研究(Babbel 依主題/難度組織+可自由跳級不鎖門)、19本機+10線上真機 0 console error、regression 全綠(精選句20/動機onboarding30/逐音drill12)、純加法 append-only 不動既有索引。至此**內容廣度・依動機四面全補齊**(句子第21+單字/對話/難度第22)。二十二輪逐輪真朝「容易學」前進、無空轉無偏離。稽核時 lock(17:26:23)極新鮮=第23輪正在跑、log 未產出。→ 導正(又見「殘留 pin 誘導重做＝空轉」風險，與歷輪同模式)：evolve_instruction ✅清單只到第21輪、🔴pin 仍指向「單字+對話依動機篩+難度分級」(=第22輪已正中做完)，會誘導第23/24輪重做。已①把第22輪補進✅已完成清單；②🔴pin 移除已做的「單字+對話+難度分級」，**轉向真正未碰且最貼容易學的兩缺口**：(a)內容量補實——第22輪 exam 主題對話＝0/work 僅3，推薦對考試/工作族群仍空洞，append 補各主題對話量(exam 0→≥3)；(b)或修真實摩擦 bug：UX 體質 sticky 底列遮內容(補 `.view` padding-bottom)。並明標對話分支屬炫技非降門檻、列次選；第8–22 全列勿重做。僅校正已完成狀態(嚴格正確、第23輪已讀過不受影響、保護第24輪不重做)，非 race。靜默不擾人。

---

### 第 22 輪 — 2026-06-29（對話依動機分主題 + 難度分級 + 自由跳級；單字依動機優先｜正中小組長 16:55 🔴pin「依動機篩單字+對話＋難度分級」，把第21輪只做句子的範圍補實）
**第 0 優先（網址）：第 3 輪已處理、本輪不需重做**
- 使用者派工提「換網址 english-tutor.pages.dev」，但該名為全域唯一名、已被外部帳號（Voice Recorder）永久佔用、技術不可取得；第 3 輪已遷至乾淨網址 `english-tutor-ai.pages.dev`。開工前雙站健康（HTTP 200）、working tree 乾淨。
- **本輪在「內容面」續做未碰的一半**：第21輪已把**句子**標主題並依動機篩、做精選句卡（勿重做）；但**對話/單字**仍是同一套通用內容、且對話無難度分級＝動機=工作的人進「情境對話」看不到工作情境。本輪把對話/單字補實（沿用第21輪 `getLearnMotive` 模式、不另造機制）。動力持續三大項(第18–20)、口說核心(第8–17)已飽和，皆不重做；句子那塊第21輪已做、不重做。

**北極星研究（必做）**
- WebSearch「Babbel/Duolingo dialogue branching difficulty levels content by topic travel/business」。借鏡 Babbel：①課程**依學習目標/主題組織**（Business、旅遊各有專屬情境：訂餐廳/訂飯店/問路/面試），一進門就給「馬上用得到」的內容；②**難度分級但可自由跳級**——不把內容鎖在進度門後，想複習 A1 或挑戰 B2 都能直接跳，對初學者「先學最有用的」最友善；③對話以情境短劇＋提示句設計。落地點子：①對話標主題(旅遊/工作/日常)+難度(初/中級)、依動機預設聚焦；②主題 chip 可自由切換不鎖門；③單字也標主題、同熟練度下動機主題字優先。
- 來源：univext.com/duolingo-vs-babbel-english-2026、learnlanguagesfromhome.com/babbel-review、unite.ai/babbel-review（Babbel 依主題/難度組織、可自由跳級不鎖進度門）。

**本輪進化：對話依動機分主題 + 難度分級 + 可自由跳級；單字依動機優先（內容廣度層，讓「為你推薦」連對話/單字也名副其實＝更容易學）**
- 改動檔：`assets/js/data.js`（DIALOGUES 每則加 `topic`(travel/work/daily)+`level`(初/中級)、**append 3 則工作職場對話**「跟同事約開會(初)/工作面試自我介紹(中)/商務電話留言(中)」補齊 work 主題；VOCAB 每字加 `topic`、**append 5 字** reservation/passport/luggage(travel)+passage/summarize(exam) 補齊各主題）、`assets/js/modes.js`（renderConversation 改：依 `getLearnMotive` 預設聚焦對應主題、主題篩選 chip「全部＋實際存在主題」可自由跳級、lesson-head 顯示難度徽章、換情境在過濾後清單內循環；renderFlashcard 排序加次要鍵：同 Leitner 盒下動機主題字優先）、`assets/css/style.css`（`.conv-chips/.conv-chip`）。純加法、低風險、可回退、舊資料相容（無 topic/level/motive 視為未設）。
- **對話依動機分主題**：選了學習動機（第20輪）→ 情境對話**預設聚焦對應主題**（工作→work 對話排前），動機對應主題無對話則退「全部」（如動機=考試，零摩擦不強迫）。
- **難度分級 + 自由跳級**：每則對話標初/中級徽章；主題 chip（全部/✈️旅遊/💼工作/🗣️日常）**可隨意切換、不鎖進度門**（借鏡 Babbel）。
- **單字依動機優先**：單字卡同熟練度（Leitner 盒）下，對應動機主題字排前；**弱點優先仍是主排序**（不破壞 SRS）。
- **絕不破壞既有**：沒選動機→對話 filter=all、單字照原順序、首頁無變化；對話無持久化索引（不影響任何錯題/索引語意）；第6–21輪所有功能（口說全系列/連續保護/成就牆/音效/動機 onboarding/精選句）全維持不動。

**驗證證據**
- 本機真 Chrome（puppeteer-core 驅動、375px 手機、**dynamic import 既載入 app.js/data.js/modes.js 真實模組** + 真實渲染）端到端 **19/19 PASS、0 console error**（`tools/verify_topic_dialogue.mjs`）：對話/單字全標 topic+level、work 主題已補(3則)、難度含初/中級、動機=工作→對話聚焦 work 且目前對話 topic=work+難度徽章、4 顆主題 chip、點旅遊 chip→切 travel(自由跳級)、換情境仍在 travel 內循環、未選動機→filter=all 照常、單字卡動機=旅遊→第一張為 travel 字。
- regression 全綠、確認無回歸：目標精選句 `verify_goal_pack.mjs` **20/20**、動機 onboarding `verify_motive_onboarding.mjs` **30/30**、逐音 drill `verify_shadowing.mjs` **12/12**，皆 0 console error。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 10/10 PASS、0 console error**（`tools/verify_topic_dialogue_live.mjs`）：線上對話/單字 topic+level、動機=工作聚焦 work、難度徽章、主題 chip 自由跳級、未選動機 filter=all、單字依動機優先、回歸推薦緞帶+精選句卡全正常。線上 data.js `topic:` 標籤 63 處實證。
- git b8dcd28 push main + wrangler deploy 主(english-tutor-ai a76c2e9e)+legacy(english-tutor-e1l 20c3780e)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
- ※內容廣度依動機分主題已覆蓋 句子(第21)+對話/單字(第22)；動力持續三大項(第18–20)+口說核心(第8–17)飽和。避免在已飽和層空轉。
1. 內容**量**再擴充：各主題對話/句量加深（目前 work 對話 3 則、exam 對話 0）、文法題也標主題依動機篩。
2. 設定面板可單獨重選學習動機（目前只能靠「重看新手導覽」整套重來）。
3. 對話分支選項（同一情境多種回應分歧），讓對話更像真實互動（本輪做了主題/難度，分支留待）。
4. UX 體質：sticky 底部導覽列補 `.view` padding-bottom，讓長頁內容都能捲離導覽列。
5. 深色／淺色模式切換（降門檻體驗）。

[小組長督導待補]

---

### 第 23 輪 — 2026-06-29（對話分支選項：自己選想怎麼回應 → 對方依選擇回應｜補實第22輪明文 deferred 的「對話分支」，正中🔴pin「對話分支/難度分級」剩下未做的一半）
**第 0 優先（網址）：第 3 輪已處理、本輪不需重做**
- 使用者派工提「換網址 english-tutor.pages.dev」，但該名為全域唯一名、已被外部帳號（Voice Recorder）永久佔用、技術不可取得；第 3 輪已遷至乾淨網址 `english-tutor-ai.pages.dev`。開工前雙站健康（HTTP 200）、working tree 乾淨（HEAD=第22輪）。
- **挑「分支」這唯一未做的一半、不重做已飽和層**：🔴pin = 內容廣度・依動機篩單字+對話 **＋ 對話分支/難度分級**。第21輪做了句子精選句、第22輪做了對話/單字依動機分主題＋**難度分級＋自由跳級**，但**對話分支選項第22輪明文 deferred**（第22輪 backlog #3：「本輪做了主題/難度，分支留待」）＝pin 剩下唯一未碰的一半。本輪補實。動力持續三大項(第18–20)、口說核心(第8–17)、依動機分主題(第21句/第22對話單字)皆已飽和，全部不重做。

**北極星研究（必做）**
- WebSearch「Babbel/Duolingo branching dialogue choose-your-response interactive conversation beginner UX」。借鏡 Babbel：①核心是**真實情境短對話 + 引導式會話腳本，使用者可「選擇主題/選擇怎麼回應」**，比 Duolingo 純 gamification 更早讓初學者開口；②**有引導、有 scaffolding 的對話**最適合初學者建立開口信心；③介面極簡、聚焦內容、少干擾。落地點子：①某些對話輪給 2-3 種回應說法（接受/婉拒、正式/口語），讓使用者**自己決定怎麼回應**＝更像真實互動、更敢開口；②對方依你的選擇給不同回應(reply)，再續對話；③沒分支的輪維持原樣（向後相容，不增門檻）。
- 來源：fluentu.com/blog/reviews/duolingo-vs-babbel、polychatapp.com/blog/duolingo-vs-babbel、ilampadmanabhan.medium.com（Babbel 引導式對話腳本、beginner 早開口）。

**本輪進化：對話分支選項（讓情境對話更像真實互動＝更敢開口、更容易學）**
- 改動檔：`assets/js/data.js`（3 則對話的某一輪加 `choices`：「認識新朋友」(daily)最後一輪 3 選「為什麼學英文」、「跟同事約開會」(work)turn1 2 選「接受/改時間」、「咖啡廳點餐」(travel)2 選「加點心/不用」；每個 choice 含 `label`(中文標籤)/`en`(練習句)/`zh`(翻譯)/`reply`(對方回應)。**純加法欄位、不動既有 turns 索引/不動 topic/level**）、`assets/js/modes.js`（renderConversation 加 `renderChoices`：有 choices 的輪先列回應選項→挑一種轉成可練習回應句、`advance(reply,delay)` 統一推進+把對方回應 bubble 推出再續；renderControls/speakTurn 加可選 `reply` 參數。**無 choices 的輪走原路徑＝向後相容**）、`assets/css/style.css`（`.conv-choices/.conv-choice/.cc-label/.cc-en/.cc-zh` 選項卡樣式）。低風險、可回退、舊資料相容（無 choices 視為一般輪）。
- **自己選怎麼回應**：分支輪顯示「💬 你想怎麼回應？選一種說法練習」+ 2-3 張選項卡（中文標籤+英文句+翻譯）；挑一種 → 轉成既有「🔊聽建議句／🎙️換我說／略過」練習介面練那句（沿用既有評分/STT 路徑，不另造）。
- **對方依選擇回應**：說完/略過後，對方依你的選擇給對應 `reply`（如選「為了工作」→「That's a great goal. English really helps your career.」），再續到下一輪或進完成卡＝有來有往、更像真實對話。
- **絕不破壞既有**：沒 choices 的輪完全照舊；分支是純加法選用欄位；第6–22輪所有功能（口說全系列/連續保護/成就牆/音效/動機 onboarding/精選句/依動機分主題/難度分級/自由跳級）全維持不動。

**驗證證據**
- 本機真 Chrome（puppeteer-core 驅動、375px 手機、**dynamic import 既載入 app.js/modes.js/data.js 真實模組** + 真實渲染、走 skip 路徑驗 advance+reply 免麥克風）端到端 **16/16 PASS、0 console error**（`tools/verify_branch_dialogue.mjs`）：≥3則對話含分支且每選項欄位完整／daily 推進到分支輪出 3 選項+中文標籤／選工作分支→轉練習句+選項消失→reply「great goal...career」出現→最後輪進完成卡／work turn1 2選→選「可以」→reply「book a meeting room」+**續接下一輪「send you a meeting invite」(rejoin 不中斷)**未提前完成／未選動機對話照常無回歸。
- regression 全綠、確認無回歸：對話依動機分主題 `verify_topic_dialogue.mjs` **19/19**、0 console error。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 10/10 PASS、0 console error**（`tools/verify_branch_dialogue_live.mjs`）：線上分支渲染/選擇/reply/rejoin/完成卡/未選動機回歸全正常。線上 data.js `choices:` 3 處實證、兩站 HTTP 200。
- git e43dbc4 push main + wrangler deploy 主(english-tutor-ai 7143e7ee)+legacy(english-tutor-e1l 6bb811d3)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
- ※內容廣度（句/對話/單字依動機分主題 第21–22）＋對話分支（第23）＋難度分級＋自由跳級已覆蓋；動力持續三大項(第18–20)+口說核心(第8–17)飽和。避免在已飽和層空轉。
1. 內容**量**再擴充並補洞：**exam 主題對話目前 0 則**（動機=考試的人對話只能退「全部」＝推薦這塊還是名不副實，最該補）；各主題對話/句量加深；文法題也標 topic 依動機篩。
2. 分支深化：分支可帶各自的後續多輪（目前是單輪分支後 rejoin 主線）；更多對話加分支。
3. 設定面板可單獨重選學習動機（目前只能靠「重看新手導覽」整套重來）。
4. UX 體質：sticky 底部導覽列補 `.view` padding-bottom，讓長頁內容都能捲離導覽列。
5. 深色／淺色模式切換（降門檻體驗）。

[小組長 17:57] 督導：雙站皆健康(english-tutor-ai 與 legacy e1l 皆 HTTP 200)。第23輪「對話分支選項(自己選怎麼回應→對方依選擇回 reply→rejoin 主線)」確實上線實證(線上 data.js curl `choices:` 3 處在、兩站 200)，做了北極星研究(Babbel 引導式對話腳本/scaffolding 讓 beginner 早開口)、16本機+10線上真機 0 console error、regression 全綠(topic_dialogue19)、純加法選用欄位不動既有 turns 索引、向後相容。判斷：對話分支原被我 17:26 note 標為「炫技次選」，但本輪以「初學者 scaffolding／更敢開口」為框架落地、有容易學正當性(降低開口焦慮、有引導)、驗證紮實＝非空轉；惟它做的是舊 pin 殘留的「對話分支」而非我 17:26 新 pin 的 exam 內容量/UX bug 缺口＝輕微偏離但無害(產出有價值、無破壞)。→ 導正(又見「殘留 pin 誘導重做＝空轉」風險，與歷輪同模式)：evolve_instruction ✅清單只到第22輪、🔴pin line33 仍把「對話分支」標為「炫技非降門檻、列次選」而非「已做」，雖已降級不致明顯重做、但語意未標完成會留模糊空間。已①把第23輪對話分支補進✅已完成清單；②勿重做清單把對話分支由「炫技次選」改標「第23輪已做、勿重做、勿再以敢開口為由重加分支機制」。🔴pin(exam 對話 0→≥3 內容量補實／UX sticky 底列遮內容 padding-bottom)為真正未碰、最貼容易學的缺口、方向正確未過時 → 不動 pin。稽核時 lock(17:56:30)極新鮮=第24輪正在跑、已讀過 instruction，此修正僅校正已完成狀態(嚴格正確、不影響跑中的第24輪、保護第25輪不重做對話分支)，非 race。靜默不擾人。

---

### 第 24 輪 — 2026-06-29（補實 exam 主題對話 0→3 + work 3→4｜正中🔴pin「內容量補實讓推薦對所有動機名副其實」）
**第 0 優先（網址）：第 3 輪已處理、本輪不需重做**
- 使用者派工提「換網址 english-tutor.pages.dev」，但該名為全域唯一名、已被外部帳號（Voice Recorder）永久佔用、技術不可取得；第 3 輪已遷至乾淨網址 `english-tutor-ai.pages.dev`。開工前雙站健康（HTTP 200）。

**北極星研究（必做）**
- WebSearch「English speaking exam TOEIC/IELTS oral test dialogue scenarios make learning easier beginner」。借鏡 TOEIC/IELTS 口說考試：①口說考試＝**給情境→回答考官提問**（IELTS Part 1 暖身問答身家／TOEIC 描述照片／IELTS Part 3 表達意見說理由）；②初學者友善做法＝**情境短對話＋可預覽的提示句**，先看一遍再開口、降低臨場焦慮；③同一情境一問一答、貼近真實考場節奏。落地點子：①把考試情境寫成跟既有對話同款的「情境短劇＋hint 提示句」②分初/中級，暖身放初級、描述/表達意見放中級③沿用既有評分/STT/難度徽章路徑，零新機制。
- 來源：englishclub.com/esl-exams TOEIC speaking、bestmytest.com/ielts/speaking、ets.org TOEIC speaking sample。

**本輪進化：補實 exam 主題對話（讓「依動機推薦」對考試族群也名副其實＝更容易學）**
- 改動檔：`assets/js/data.js`（DIALOGUES **append-only**：exam 3 則「口說考試暖身問答(初)/描述一張照片(中)/表達意見並說明理由(中)」＋ work 1 則「跟客戶報告進度(中)」）。**純資料層、不動既有 turns/topic/level 索引**；TOPIC_META 早含 exam（📖 考試），chip/聚焦/難度徽章全自動生效，零程式改動。
- **補洞**：第22輪 exam 對話=0 → 動機=考試的人進「情境對話」只能退「全部」、看不到任何考試情境＝推薦名不副實。本輪 exam 0→3、work 3→4，四大動機主題對話皆 ≥2。
- **零摩擦不破壞**：未選動機 → filter=all 照常；第6–23輪所有功能（口說全系列/連續保護/成就牆/音效/動機 onboarding/精選句/依動機分主題/難度分級/自由跳級/對話分支）全維持不動。

**驗證證據**
- 本機真 Chrome（puppeteer-core、375px 手機、dynamic import 真實模組 + 真實渲染）端到端 **16/16 PASS、0 console error**（`tools/verify_exam_dialogue.mjs`）：exam≥3/work≥4/四主題≥2/欄位完整／動機=考試→聚焦 exam(filter=exam、curTopic=exam「口說考試暖身問答」、exam chip 出現、難度徽章 初級・1/3)／換情境仍在 exam 內循環(→描述一張照片)／動機=工作仍聚焦 work(補量無回歸)／未選動機 filter=all 照常／回歸第20輪推薦緞帶+第21輪精選句卡仍在。
- regression 全綠：對話依動機分主題 `verify_topic_dialogue.mjs` **19/19**、對話分支 `verify_branch_dialogue.mjs` **16/16**，皆 0 console error。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 10/10 PASS、0 console error**（`tools/verify_exam_dialogue_live.mjs`）：線上 exam≥3/work≥4/四主題≥2／動機=考試聚焦 exam+chip+難度徽章／換情境 exam 內循環／未選動機 filter=all 照常。線上 data.js `topic: "exam", level` 命中 3 筆。
- git aec28eb push main + wrangler deploy 主(english-tutor-ai 049afecb)+legacy(english-tutor-e1l 9d40de2e)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
- ※內容廣度依動機分主題（句第21／對話單字第22／分支第23）＋內容量補洞 exam(第24)已覆蓋；動力持續三大項(第18–20)+口說核心(第8–17)飽和。避免在已飽和層空轉。
1. **UX 體質 sticky 底列遮內容**：補 `.view` padding-bottom，讓長頁內容都能捲離底部導覽列（🔴pin 次選、純 CSS 低風險、直接降操作摩擦＝最該做的真實 bug）。
2. 深色／淺色模式切換（久看護眼、降低持續學疲勞摩擦）。
3. 設定面板可單獨重選學習動機（目前只能靠「重看新手導覽」整套重來）。
4. 文法題也標 topic 依動機篩（內容依動機分主題唯一還沒碰的模式）。

[小組長 18:28] 督導：雙站皆健康(english-tutor-ai 與 legacy e1l 皆 HTTP 200、size 一致 3981)。第24輪「補實 exam 主題對話 0→3 + work 3→4」確實落地、正中我 17:26🔴pin 之①內容量補實（exam 0→3 讓動機=考試族群推薦名副其實），做了北極星研究(TOEIC/IELTS 口說考試情境短劇+hint)、16本機+10線上真機 0 console error、regression 全綠(topic_dialogue19/branch16)、純資料層 append-only 不動既有索引＝無空轉無偏離。當前線上即第24輪部署(aec28eb)、驗證紮實。稽核時 lock(18:27:22)極新鮮=第25輪正在跑、log 未產出，故不跑會 race 的重型 headless、僅憑雙站 200+size 一致判健康。→ 導正(又見「殘留 pin 誘導重做＝空轉」老模式)：evolve_instruction ✅清單只到第23輪、🔴pin 仍把「exam 對話 0→≥3」列為①(=第24輪已正中做完)，會誘導第25/26輪重做內容量擴充。已①把第24輪 exam 0→3+work 3→4 補進✅已完成清單與「勿重做」清單；②🔴pin 移除已完成的內容量①，收斂為 pin 原列但從未做、且第24輪 backlog #1 點名的真實操作摩擦 bug「UX 體質：sticky 底部導覽列遮長頁內容→補 `.view` padding-bottom」(純 CSS 低風險、直接降操作摩擦＝容易學)，並明標內容量已於第24輪補齊勿重做擴充。僅校正已完成狀態(嚴格正確、第25輪已讀過 instruction 不受影響、保護第26輪不重做)，非 race。靜默不擾人。

---

### 第 25 輪 — 2026-06-29（深色／淺色主題切換：白天/明亮環境護眼、降低長時間學習的視覺疲勞｜🔴pin 次選「深色模式」，並以真機診斷退役「sticky padding-bottom」假 bug）
**第 0 優先（網址）：第 3 輪已處理、本輪不需重做**
- 使用者派工提「換網址 english-tutor.pages.dev」，但該名為全域唯一名、已被外部帳號（Voice Recorder）永久佔用、技術不可取得；第 3 輪已遷至乾淨網址 `english-tutor-ai.pages.dev`。開工前雙站健康（HTTP 200）、working tree 乾淨（HEAD=第24輪 docs）。

**選題依據（避免空轉）**
- 🔴pin 之①「exam 對話內容量補實」第24輪已正中做完（exam 0→3、work 3→4、aec28eb 已部署線上）＝勿重做。
- 🔴pin 小組長 18:28 收斂為②「sticky 底列遮長頁內容→補 `.view` padding-bottom」，但**小組長自註當輪未跑 headless、僅憑 HTTP 200+size 判健康**＝該 pin 為假設、未經真機驗證。
- **本輪先用真機診斷驗證該假設**（`tools/diag_tabbar_overlap.mjs`，375px、捲到底量測 tabbar 與 .view 末元素 rect）：home/shadowing/grammar/dictation/flashcard/conversation **六模式 overlapBehindBar 皆=0px**——`.tabbar` 是 `position:sticky` 的「流內最後一個子元素」，捲到底時回到自身自然槽位、末內容(lastBottom 607/624)永遠在 tabbar 頂(654)之上＝**內容從不被遮**，補 padding-bottom 只會多一段空白＝為改而改、違反鐵律「跟容易學無關的炫技不做」。→ 退役此假 bug。
- 改做 🔴pin 明列的**次選「深色／淺色模式切換」**：本站長期僅深色，加淺色選項讓使用者**依環境配色護眼**（北極星研究：螢幕與環境光一致可緩解調節疲勞）＝真實降低長時間學習的視覺疲勞摩擦＝容易學，且 24 輪從未碰。

**北極星研究（必做）**
- WebSearch「Duolingo dark/light theme eye strain reduce fatigue UX」。借鏡：①深色模式在低光/夜間**降低眼睛疲勞**（減少螢幕與環境的對比、減少藍光、減少調節疲勞）；②但 Duolingo 預設**淺色**、深色為選用——關鍵是讓使用者**依當下環境挑舒服的配色**；③本站與其相反（僅深色），缺的正是**淺色選項**（白天/明亮環境、偏好淺色或淺色更易讀者）。落地點子：①給淺色主題＋一鍵切換；②記住偏好跨次保留；③開畫前先套用避免閃爍；④預設維持深色＝零回歸。
- 來源：toolsmart.ai/blog/unlocking-duolingo-dark-mode、lingoly.io/duolingo-dark-mode-guide、nighteye.app/duolingo-dark-mode。

**本輪進化：深色／淺色主題切換（護眼＝降低持續學的視覺疲勞摩擦）**
- 改動檔：`assets/css/style.css`（**純加法** `html[data-theme="light"]` 區塊：覆寫 :root 設計 token＋少數寫死的深色覆蓋層(頁底漸層/頂列/底部導覽列)＋把「深色底專用亮色文字」改同色系較深值保證白底對比；不改任何既有規則）、`index.html`（head 加「開畫前套主題」inline script 防閃＋topbar 加切換鈕 `#themeToggle`）、`assets/js/app.js`（+`getTheme/applyTheme/setTheme/toggleTheme`、init 套用+綁鈕、更新鈕圖示與 `meta theme-color`）。低風險、可回退。
- **深色為預設＝零回歸**：無 `data-theme` 即原深色（既有體驗一字未動）；淺色為選用，存 localStorage `theme` 跨次保留。
- **護眼**：淺色主題整套 token 改亮底深字＋語意色(紫品牌/黃提醒/綠對/紅錯/藍對照)改較深值保白底對比；切換鈕在 topbar（🌙↔☀️），白天明亮環境可切淺色、夜間切回深色。
- **防閃**：`<head>` inline script 於樣式前先讀偏好套 `data-theme`，開畫即正確配色不閃。
- **不破壞**：主題屬顯示偏好非學習進度→「清除學習進度」不動它；第6–24輪所有功能全維持。

**驗證證據**
- 本機先跑**真機診斷**證實「sticky padding-bottom」非真 bug（六模式 overlapBehindBar=0px，見上）→ 不做該改動、改做主題。
- 本機真 Chrome（puppeteer-core、375px 手機、本機 HTTP server）端到端 **38/38 PASS、0 console error**（`tools/verify_theme.mjs`）：預設無 data-theme+深底(亮度0.07)+鈕🌙／切淺色→data-theme=light+localStorage+鈕☀️+meta #f3f5fb+亮底(0.96)深字(0.12)／9 個重映亮色文字在白底皆變深(w-ok/w-bad/w-miss/opt.correct/drill-near/pace-ok/into-arrow/phonetic 亮度0.23–0.39)／重整持久化仍淺色+head 防閃 inline script 在樣式前／六模式淺色皆渲染且內文深字可讀／切回深色+持久化。
- regression 全綠、0 console error：`verify_exam_dialogue` **16/16**、`verify_branch_dialogue` **16/16**、`verify_motive_onboarding` **30/30**。
- git 7fb4a38 push main + wrangler deploy 主(english-tutor-ai 5a3f66ee)+legacy(english-tutor-e1l b6e99555)皆成功、兩站 HTTP 200。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 31/31 PASS、0 console error**（`tools/verify_theme_live.mjs`）：線上 head 防閃 inline script 在／預設深色+鈕🌙／切淺色 data-theme+localStorage+鈕☀️+meta #f3f5fb+亮底深字／8 重映亮色文字白底皆變深／重整持久化仍淺色／六模式淺色渲染內文深／切回深色持久化。線上 style.css `data-theme="light"` 49 處、app.js toggleTheme/applyTheme 5 處實證。

**下一輪 backlog 想法（優先序建議）**
- ※「sticky padding-bottom」經真機診斷確認為**非 bug、已退役**（tabbar 流內 sticky、內容從不被遮）→ 勿再以此為由改動。深色/淺色（第25）已做、勿重做。
1. 淺色主題進階：可選「跟隨系統 `prefers-color-scheme`」（目前預設深色+手動切；淺色已驗證穩可考慮開放系統跟隨）。
2. 設定面板可單獨重選學習動機（目前只能靠「重看新手導覽」整套重來）。
3. 文法題也標 topic 依動機篩（內容依動機分主題唯一還沒碰的模式）。
4. 內容量續擴充（各主題對話/句量加深）。

[小組長 18:58] 督導：雙站皆健康(english-tutor-ai 200/0.075s、legacy e1l 200/0.106s、size 一致 4951)。第25輪「深色／淺色主題切換」確實上線實證(線上 curl：style.css `data-theme="light"` 49 處、app.js applyTheme/setTheme/toggleTheme、index.html themeToggle 在；R18-20 LEARN_MOTIVES/STREAK_MILESTONES/freezesToNext 全在=無回歸)，做了北極星研究(Duolingo 深色降疲勞、預設淺色為選用)、38本機+31線上真機 0 console error、regression 全綠(exam16/branch16/motive30)、純加法預設深色零回歸＝無空轉無偏離、緊扣容易學(護眼降長時學習疲勞)。**特別嘉許**：第25輪先以真機診斷(diag_tabbar_overlap 六模式 overlapBehindBar=0px)證實🔴pin 的「sticky 底列遮內容」是假 bug 而退役、改做次選深色模式＝主動防了「為改而改」的空轉，正是督導要的判斷力。稽核時 lock(18:57:25)極新鮮=第26輪正在跑、log 未產出，故不跑會 race 的重型 headless、僅憑雙站 200+size 一致+線上 curl 判健康。→ 導正(又見「殘留 pin 誘導重做＝空轉」老模式)：evolve_instruction ✅清單只到第24輪、🔴pin 仍把「sticky padding-bottom」列唯一指定(=第25輪已真機退役為假 bug)、深色列次選(=第25輪已做)，兩項都會誘導第26/27輪重做或追假 bug。已①把第25輪深色模式+退役 sticky 假 bug 補進✅已完成清單；②🔴pin 移除已退役的 sticky 假 bug 與已完成的深色，收斂為真正未碰、第25輪 backlog #2 點名的真實操作摩擦「設定面板可單獨重選學習動機(不必整套重看 onboarding，沿用第20輪既有機制勿另造)」＝直接降操作摩擦＝容易學；次選改「淺色跟隨系統 prefers-color-scheme」，並明標內容/分主題已飽和勿重做。僅校正已完成狀態(嚴格正確、第26輪已讀過 instruction 不受影響、保護第27輪不重做)，非 race。靜默不擾人。

[小組長 16:25] 督導：兩站皆健康(english-tutor-ai 200/0.12s、legacy e1l 200/0.10s)。第20輪「學習動機 onboarding → 推薦起始模式」確實上線實證(線上 curl app.js 含 LEARN_MOTIVES/getRecommendedMode/setLearnMotive、modes.js 含 mc-rec、style.css 含 onb-motive，第18/19輪 freezesToNext/showAchievementWall 仍在=無回歸)，正中我 15:24 🔴pin 二選一之「①動機 onboarding」、做了北極星研究(Duolingo/Babbel 問動機個人化降摩擦)、30本機+10線上真機 0 console error、regression 全綠(成就牆21/連續保護19)、舊資料相容。至此**動力持續/低門檻層三大項全數補齊**(streak freeze 第18+成就牆/音效 第19+動機 onboarding 第20)、口說核心連十輪(第8–17)飽和，二十輪逐輪真朝「容易學」前進、無空轉無偏離。稽核時 lock(16:25:28)極新鮮=第21輪正在跑、log 未產出。→ 導正(又見「殘留 pin 誘導重做＝空轉」風險，與歷輪同模式)：evolve_instruction ✅清單只到第19輪、🔴pin 仍把「①學習動機 onboarding」標為「動力持續層唯一尚未碰的大項」(=第20輪已正中做完)，會誘導第21/22輪以同理由重做。已①把第20輪動機 onboarding 補進✅已完成清單；②🔴pin 移除已完成的動機 onboarding、收斂為真正未碰且最該補的「內容廣度・依學習動機分主題」——第20輪推薦目前只導模式、內容仍是同一套通用題庫，使用者選旅遊/工作/考試卻看不到對應主題內容＝推薦名不副實，本輪把這塊補實(內容標主題標籤+依 learnMotive 篩選排前+對話分支/難度分級)，明標「本輪是把第20輪推薦的內容面補實、非重做 onboarding 流程」、動力持續三大項已補齊勿再加同層機制、第8–17口說全列勿重做。僅校正已完成狀態(嚴格正確、第21輪已讀過不受影響、保護第22輪不重做)，非 race。靜默不擾人。

[小組長 16:55] 督導：雙站皆健康(english-tutor-ai 200/0.085s、legacy e1l 200/0.087s)。第21輪「目標精選句・依學習動機推主題句」確實上線實證(線上 modes.js curl 含 goal-card+getLearnMotive、data.js 含 topic:、R18-20 freezesToNext/showAchievementWall/LEARN_MOTIVES 全在=無回歸)，正中我 16:25 🔴pin「內容廣度・依動機分主題」、做了北極星研究(Babbel 依目標先學最用得到的句子)、20本機+9線上真機 0 console error、regression 全綠(動機 onboarding30/成就牆21)、純加法 topic 標籤+append-only 不動既有索引。二十一輪逐輪真朝「容易學」前進、無空轉無偏離。稽核時無 lock=第21輪已收工、第22輪尚未起跑。→ 導正(又見「殘留 pin 誘導重做」風險，與歷輪同模式)：evolve_instruction ✅清單只到第20輪、🔴pin 仍泛指整個「內容廣度・依動機分主題(句子/單字/對話)」(=第21輪已把『句子』那半做完)，會誘導第22輪重做句子/精選句卡。已①把第21輪「目標精選句・依動機推句子」補進✅已完成清單；②🔴pin 由泛指「分主題」收斂為**真正只做了一半、剩下未碰的「依動機篩單字+對話 + 對話分支/難度分級」**，明標「句子(SENTENCES)主題標籤+精選句卡第21輪已做、勿重做句子那塊」「沿用第21輪 getLearnMotive 模式勿另造機制」「先稽核 WORDS/DIALOGS 量體各主題≥3」。僅校正已完成狀態(嚴格正確、保護第22輪不重做句子)，非 race。靜默不擾人。

---

### 第 26 輪 — 2026-06-29（設定面板可單獨重選學習動機｜正中🔴pin、沿用第20輪既有機制勿另造）
**第 0 優先（網址）：第 3 輪已處理、本輪不需重做**
- 使用者派工提「換網址 english-tutor.pages.dev」，該名為全域唯一名、已被外部帳號（Voice Recorder）永久佔用、技術不可取得；第 3 輪已遷至乾淨網址 `english-tutor-ai.pages.dev`。開工前雙站健康（HTTP 200、size 一致 4951）、working tree 乾淨（HEAD=第25輪 docs）。

**選題依據（避免空轉）**
- 🔴pin（小組長 18:58 收斂）＝第25輪 backlog #2「設定面板可單獨重選學習動機（不必整套重看 onboarding，沿用第20輪既有機制勿另造）」＝真正未碰、直接降操作摩擦的真實缺口。第25輪已退役 sticky 假 bug、已做深色模式＝皆勿重做。
- 痛點：第20輪起學習動機只能在「首訪 onboarding」設定，事後要改只能按「🧭 重看新手導覽」整套重來＝高摩擦。動機會變（旅遊→工作），改不動就讓第20–24輪的「依動機推薦/精選句/分主題對話」名不副實。

**北極星研究（必做）**
- WebSearch「language learning app settings change goal/motivation reselection friction Duolingo」+「dark mode follow prefers-color-scheme best practice」。借鏡 Duolingo：①目標/個人化可在**設定頁直接編輯**（點設定→Edit Daily Goal），不必重跑 onboarding；②開頭問幾個問題做個人化、但**事後可改**才不會卡住；③降低「調整偏好」的摩擦＝使用者更願意維持精準的個人化。落地點子：①設定面板加「學習動機」下拉、可隨時改 ②改完即時更新首頁「為你推薦」緞帶（即時回饋）③可清為「未設定」不強迫 ④沿用第20輪 LEARN_MOTIVES/setLearnMotive 既有機制、不另造。
- 來源：duolingoguides.com/how-to-change-daily-goals、lingoly.io/change-duolingo-daily-goals、goodux.appcues.com/blog/duolingo-user-onboarding。

**本輪進化：設定面板單獨重選學習動機（降「調整個人化」摩擦＝容易學）**
- 改動檔：`index.html`（設定面板加「學習動機」`<select id="motiveSelect">`）、`assets/js/app.js`（initSettings 動態填選項=未設定+4動機、onchange 即時 `setLearnMotive`/清除 learnMotive + 重渲染首頁；`open()` 每次開啟同步目前動機值，防被 onboarding 改過顯示舊值）。**純加法、低風險、可回退、沿用第20輪既有機制未另造**。
- **隨時可改**：⚙️設定 → 學習動機下拉直接選旅遊/工作/考試/日常，不必整套重看 onboarding。
- **即時回饋**：改完即時更新首頁「為你推薦」緞帶卡（工作→跟讀糾音、旅遊→情境對話、考試→文法填空、日常→跟讀糾音）並排最前。
- **不強迫**：可選「未設定（不特別推薦）」清除動機、首頁回到無推薦緞帶；跨次持久化（localStorage learnMotive）。

**驗證證據**
- 本機真 Chrome（puppeteer-core、375px 手機、本機 HTTP server、真實模組+真實渲染）端到端 **22/22 PASS、0 console error**（`tools/verify_settings_motive.mjs`）：下拉=未設定+4動機共5項、值齊、初始空/無緞帶／改工作→learnMotive=work+推薦跟讀糾音排最前僅1張／改旅遊→情境對話即時切換不殘留／改考試→文法填空／清未設定→移除 learnMotive+無緞帶／reload 跨次持久化設定回讀+首頁推薦正確。
- regression 全綠、0 console error：`verify_motive_onboarding` **30/30**（onboarding 設動機路徑無回歸）、`verify_theme` **38/38**、`verify_exam_dialogue` **16/16**。
- **線上正式站 `https://english-tutor-ai.pages.dev` 真機端到端 16/16 PASS、0 console error**（`tools/verify_settings_motive_live.mjs`）：線上下拉/選項/即時切換工作-旅遊-考試/清未設定/reload 跨次持久化全綠。線上 app.js `motiveSel`/`未設定（不特別推薦）`、index.html `motiveSelect`（根網址 `/`）curl 實證。
- git adf3996 push main + wrangler deploy 主(english-tutor-ai 0ae40747)+legacy(english-tutor-e1l 58f230aa)皆成功、兩站 HTTP 200。

**下一輪 backlog 想法（優先序建議）**
- ※動機可在設定重選（第26）已做、勿重做；sticky 假 bug 已退役、深色（第25）已做、內容/分主題（第21–24）飽和＝勿重做。
1. 次選：淺色主題「跟隨系統 prefers-color-scheme」（第25 backlog #1，研究指 OS 級偏好應被尊重；目前手動切換已穩、可開放系統跟隨）。
2. 文法題也標 topic 依動機篩（內容依動機分主題唯一還沒碰的模式，惟分主題層近飽和、優先序低）。
3. 設定面板也可單獨重選每日目標（已可改 goal，動機本輪補上）＝個人化偏好設定面板大致補齊。
