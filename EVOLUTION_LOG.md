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
