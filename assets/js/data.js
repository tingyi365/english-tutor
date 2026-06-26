// ============ 學習內容資料庫 ============
// 全部為純前端內建內容，免後端、免金鑰即可運作。

// 跟讀 / 聽寫共用句庫（依難度分級）
export const SENTENCES = [
  { lv: "初級", en: "Good morning. How are you today?", zh: "早安，你今天好嗎？", ipa: "/ɡʊd ˈmɔːrnɪŋ haʊ ɑːr juː təˈdeɪ/" },
  { lv: "初級", en: "My name is Anna. Nice to meet you.", zh: "我叫安娜，很高興認識你。", ipa: "/maɪ neɪm ɪz ˈænə naɪs tə miːt juː/" },
  { lv: "初級", en: "I would like a cup of coffee, please.", zh: "我想要一杯咖啡，謝謝。", ipa: "/aɪ wʊd laɪk ə kʌp əv ˈkɔːfi pliːz/" },
  { lv: "初級", en: "Where is the nearest train station?", zh: "最近的火車站在哪裡？", ipa: "/wɛr ɪz ðə ˈnɪrəst treɪn ˈsteɪʃən/" },
  { lv: "初級", en: "Thank you very much for your help.", zh: "非常感謝你的幫忙。", ipa: "/ˈθæŋk juː ˈvɛri mʌtʃ fɔːr jɔːr hɛlp/" },
  { lv: "中級", en: "I have been learning English for three years.", zh: "我已經學英文三年了。", ipa: "/aɪ hæv bɪn ˈlɜːrnɪŋ ˈɪŋɡlɪʃ fɔːr θriː jɪrz/" },
  { lv: "中級", en: "Could you please speak a little more slowly?", zh: "可以請你說慢一點嗎？", ipa: "/kʊd juː pliːz spiːk ə ˈlɪtəl mɔːr ˈsloʊli/" },
  { lv: "中級", en: "I'm looking forward to seeing you next week.", zh: "我很期待下週見到你。", ipa: "/aɪm ˈlʊkɪŋ ˈfɔːrwərd tə ˈsiːɪŋ juː nɛkst wiːk/" },
  { lv: "中級", en: "The weather is supposed to get better tomorrow.", zh: "明天天氣應該會變好。", ipa: "/ðə ˈwɛðər ɪz səˈpoʊzd tə ɡɛt ˈbɛtər təˈmɑːroʊ/" },
  { lv: "中級", en: "Let me know if you need anything else.", zh: "如果你還需要什麼就告訴我。", ipa: "/lɛt miː noʊ ɪf juː niːd ˈɛniθɪŋ ɛls/" },
  { lv: "進階", en: "Despite the difficulties, the team managed to finish on time.", zh: "儘管困難重重，團隊仍設法準時完成。", ipa: "/dɪˈspaɪt ðə ˈdɪfɪkəltiz ðə tiːm ˈmænɪdʒd tə ˈfɪnɪʃ ɒn taɪm/" },
  { lv: "進階", en: "I'd appreciate it if you could send me the report by Friday.", zh: "如果你能在週五前把報告寄給我，我會很感激。", ipa: "/aɪd əˈpriːʃieɪt ɪt ɪf juː kʊd sɛnd miː ðə rɪˈpɔːrt baɪ ˈfraɪdeɪ/" },
  { lv: "進階", en: "She has a remarkable ability to explain complex ideas clearly.", zh: "她有把複雜概念講清楚的非凡能力。", ipa: "/ʃiː hæz ə rɪˈmɑːrkəbl əˈbɪləti tə ɪkˈspleɪn ˈkɒmplɛks aɪˈdɪəz ˈklɪrli/" },
];

// 單字卡
export const VOCAB = [
  { word: "appreciate", ipa: "/əˈpriːʃieɪt/", pos: "v.", zh: "感激；欣賞", ex: "I really appreciate your help.", exZh: "我真的很感激你的幫忙。" },
  { word: "improve", ipa: "/ɪmˈpruːv/", pos: "v.", zh: "改善；進步", ex: "Practice helps you improve quickly.", exZh: "練習能幫助你快速進步。" },
  { word: "confident", ipa: "/ˈkɒnfɪdənt/", pos: "adj.", zh: "有自信的", ex: "Speak slowly and stay confident.", exZh: "慢慢說，保持自信。" },
  { word: "schedule", ipa: "/ˈskɛdʒuːl/", pos: "n.", zh: "行程；時間表", ex: "Let's check the schedule together.", exZh: "我們一起看一下行程。" },
  { word: "available", ipa: "/əˈveɪləbl/", pos: "adj.", zh: "有空的；可用的", ex: "Are you available this afternoon?", exZh: "你今天下午有空嗎？" },
  { word: "decision", ipa: "/dɪˈsɪʒən/", pos: "n.", zh: "決定", ex: "It was a difficult decision to make.", exZh: "那是個難下的決定。" },
  { word: "recommend", ipa: "/ˌrɛkəˈmɛnd/", pos: "v.", zh: "推薦；建議", ex: "I recommend trying this restaurant.", exZh: "我推薦試試這家餐廳。" },
  { word: "opportunity", ipa: "/ˌɒpərˈtjuːnəti/", pos: "n.", zh: "機會", ex: "This is a great opportunity for you.", exZh: "這對你是個很好的機會。" },
  { word: "convenient", ipa: "/kənˈviːniənt/", pos: "adj.", zh: "方便的", ex: "Is this time convenient for you?", exZh: "這個時間對你方便嗎？" },
  { word: "experience", ipa: "/ɪkˈspɪriəns/", pos: "n.", zh: "經驗；體驗", ex: "She has a lot of teaching experience.", exZh: "她有很多教學經驗。" },
  { word: "necessary", ipa: "/ˈnɛsəsɛri/", pos: "adj.", zh: "必要的", ex: "It's not necessary to worry.", exZh: "沒必要擔心。" },
  { word: "particular", ipa: "/pərˈtɪkjələr/", pos: "adj.", zh: "特定的；講究的", ex: "Is there a particular topic you like?", exZh: "你有特別喜歡的主題嗎？" },
];

// 情境口說對話：AI 給提示句，學生開口回應，逐句推進
export const DIALOGUES = [
  {
    title: "咖啡廳點餐",
    scene: "你走進一家咖啡廳，店員開始招呼你。",
    turns: [
      { ai: "Hi! Welcome. What can I get for you today?", hint: "I'd like a latte, please.", zh: "我想要一杯拿鐵，謝謝。" },
      { ai: "Sure. What size would you like?", hint: "A medium one, please.", zh: "中杯，謝謝。" },
      { ai: "Anything else? Maybe a snack?", hint: "No, thank you. That's all.", zh: "不用了，謝謝，這樣就好。" },
      { ai: "Great. That will be five dollars.", hint: "Here you are. Thank you!", zh: "錢在這裡，謝謝！" },
    ],
  },
  {
    title: "認識新朋友",
    scene: "你在語言交換活動中第一次見到一位新朋友。",
    turns: [
      { ai: "Hello! I don't think we've met. I'm David.", hint: "Hi David, I'm Anna. Nice to meet you.", zh: "嗨大衛，我是安娜，很高興認識你。" },
      { ai: "Nice to meet you too! Where are you from?", hint: "I'm from Taiwan. How about you?", zh: "我來自台灣，你呢？" },
      { ai: "I'm from Canada. What do you do?", hint: "I'm a software engineer.", zh: "我是軟體工程師。" },
      { ai: "Cool! Why are you learning English?", hint: "I want to improve my speaking for work.", zh: "我想為了工作加強口說。" },
    ],
  },
  {
    title: "問路",
    scene: "你在街上迷路了，向路人問路。",
    turns: [
      { ai: "Hi, you look a little lost. Do you need help?", hint: "Yes, where is the train station?", zh: "是的，請問火車站在哪裡？" },
      { ai: "It's just two blocks away, on your left.", hint: "Thank you. Is it far to walk?", zh: "謝謝，走路會很遠嗎？" },
      { ai: "No, about five minutes on foot.", hint: "Great. Thank you so much for your help.", zh: "太好了，非常感謝你的幫忙。" },
    ],
  },
];

// 文法填空（單選，含解析）
export const GRAMMAR = [
  {
    lv: "初級", prompt: "She ___ to work by bus every day.",
    options: ["go", "goes", "going", "gone"], answer: 1,
    zh: "她每天搭公車上班。",
    explain: "主詞 She 為第三人稱單數，現在簡單式動詞要加 -es → goes。",
  },
  {
    lv: "初級", prompt: "There ___ some milk in the fridge.",
    options: ["are", "is", "have", "has"], answer: 1,
    zh: "冰箱裡有一些牛奶。",
    explain: "milk 為不可數名詞，搭配單數 be 動詞 → There is。",
  },
  {
    lv: "中級", prompt: "I have lived here ___ 2019.",
    options: ["for", "since", "from", "during"], answer: 1,
    zh: "我從 2019 年就住在這裡。",
    explain: "完成式中表「自某時間點起」用 since；表「一段時間長度」才用 for。",
  },
  {
    lv: "中級", prompt: "If it ___ tomorrow, we will stay home.",
    options: ["rains", "will rain", "rained", "is raining"], answer: 0,
    zh: "如果明天下雨，我們就待在家。",
    explain: "第一類條件句：if 子句用現在簡單式 rains，主句用 will。",
  },
  {
    lv: "中級", prompt: "This book is ___ interesting than that one.",
    options: ["much", "more", "most", "very"], answer: 1,
    zh: "這本書比那本有趣。",
    explain: "兩者比較用比較級；interesting 為長形容詞，前面加 more。",
  },
  {
    lv: "進階", prompt: "I wish I ___ more time to finish it.",
    options: ["have", "had", "will have", "having"], answer: 1,
    zh: "真希望我有更多時間完成它。",
    explain: "wish 表與現在事實相反的願望，子句用過去式 had（假設語氣）。",
  },
  {
    lv: "進階", prompt: "The report ___ by the team last week.",
    options: ["completed", "was completed", "has completed", "completes"], answer: 1,
    zh: "那份報告上週由團隊完成。",
    explain: "報告是被完成，需用被動語態；時間在上週為過去式 → was completed。",
  },
  {
    lv: "進階", prompt: "She speaks English ___ than her brother.",
    options: ["fluent", "fluently", "more fluently", "most fluently"], answer: 2,
    zh: "她英文說得比她哥哥流利。",
    explain: "修飾動詞 speaks 用副詞，且為兩者比較 → more fluently。",
  },
];
