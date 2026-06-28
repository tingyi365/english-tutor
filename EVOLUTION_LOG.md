# ENG-TUTOR 自進化台帳

每輪開頭先讀此檔，結尾必 append 一筆。

## 正式線上站（往後都驗這個）
- **https://english-tutor-e1l.pages.dev**（Cloudflare Pages，比照地球遊戲乾淨 `*.pages.dev` 根網址）
- 註：`english-tutor.pages.dev` 子網域已被他站（Voice Recorder）全域佔用，Cloudflare 自動配發 `-e1l` 後綴；專案名仍為 `english-tutor`，功能完全相同。
- GitHub repo：`tingyi365/english-tutor`（main 分支）
- 部署指令：`npx wrangler pages deploy . --project-name=english-tutor --branch=main --commit-dirty=true`

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
