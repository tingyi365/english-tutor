// ============ 學習內容資料庫 ============
// 全部為純前端內建內容，免後端、免金鑰即可運作。

// 跟讀 / 聽寫共用句庫（依難度分級）
// topic：學習動機主題（travel 旅遊／work 工作職場／exam 準備考試／daily 日常開口），
// 用於依使用者動機在首頁優先推「跟你的目標相關」的句子（容易學：直接練用得到的內容）。
export const SENTENCES = [
  { lv: "初級", en: "Good morning. How are you today?", zh: "早安，你今天好嗎？", ipa: "/ɡʊd ˈmɔːrnɪŋ haʊ ɑːr juː təˈdeɪ/", topic: "daily" },
  { lv: "初級", en: "My name is Anna. Nice to meet you.", zh: "我叫安娜，很高興認識你。", ipa: "/maɪ neɪm ɪz ˈænə naɪs tə miːt juː/", topic: "daily" },
  { lv: "初級", en: "I would like a cup of coffee, please.", zh: "我想要一杯咖啡，謝謝。", ipa: "/aɪ wʊd laɪk ə kʌp əv ˈkɔːfi pliːz/", topic: "travel" },
  { lv: "初級", en: "Where is the nearest train station?", zh: "最近的火車站在哪裡？", ipa: "/wɛr ɪz ðə ˈnɪrəst treɪn ˈsteɪʃən/", topic: "travel" },
  { lv: "初級", en: "Thank you very much for your help.", zh: "非常感謝你的幫忙。", ipa: "/ˈθæŋk juː ˈvɛri mʌtʃ fɔːr jɔːr hɛlp/", topic: "daily" },
  { lv: "中級", en: "I have been learning English for three years.", zh: "我已經學英文三年了。", ipa: "/aɪ hæv bɪn ˈlɜːrnɪŋ ˈɪŋɡlɪʃ fɔːr θriː jɪrz/", topic: "daily" },
  { lv: "中級", en: "Could you please speak a little more slowly?", zh: "可以請你說慢一點嗎？", ipa: "/kʊd juː pliːz spiːk ə ˈlɪtəl mɔːr ˈsloʊli/", topic: "daily" },
  { lv: "中級", en: "I'm looking forward to seeing you next week.", zh: "我很期待下週見到你。", ipa: "/aɪm ˈlʊkɪŋ ˈfɔːrwərd tə ˈsiːɪŋ juː nɛkst wiːk/", topic: "work" },
  { lv: "中級", en: "The weather is supposed to get better tomorrow.", zh: "明天天氣應該會變好。", ipa: "/ðə ˈwɛðər ɪz səˈpoʊzd tə ɡɛt ˈbɛtər təˈmɑːroʊ/", topic: "daily" },
  { lv: "中級", en: "Let me know if you need anything else.", zh: "如果你還需要什麼就告訴我。", ipa: "/lɛt miː noʊ ɪf juː niːd ˈɛniθɪŋ ɛls/", topic: "work" },
  { lv: "進階", en: "Despite the difficulties, the team managed to finish on time.", zh: "儘管困難重重，團隊仍設法準時完成。", ipa: "/dɪˈspaɪt ðə ˈdɪfɪkəltiz ðə tiːm ˈmænɪdʒd tə ˈfɪnɪʃ ɒn taɪm/", topic: "work" },
  { lv: "進階", en: "I'd appreciate it if you could send me the report by Friday.", zh: "如果你能在週五前把報告寄給我，我會很感激。", ipa: "/aɪd əˈpriːʃieɪt ɪt ɪf juː kʊd sɛnd miː ðə rɪˈpɔːrt baɪ ˈfraɪdeɪ/", topic: "work" },
  { lv: "進階", en: "She has a remarkable ability to explain complex ideas clearly.", zh: "她有把複雜概念講清楚的非凡能力。", ipa: "/ʃiː hæz ə rɪˈmɑːrkəbl əˈbɪləti tə ɪkˈspleɪn ˈkɒmplɛks aɪˈdɪəz ˈklɪrli/", topic: "work" },
  { lv: "初級", en: "Excuse me, can you help me, please?", zh: "不好意思，可以請你幫我嗎？", ipa: "/ɪkˈskjuːz miː kæn juː hɛlp miː pliːz/", topic: "travel" },
  { lv: "初級", en: "How much does this cost?", zh: "這個多少錢？", ipa: "/haʊ mʌtʃ dʌz ðɪs kɔːst/", topic: "travel" },
  { lv: "初級", en: "I don't understand. Can you repeat that?", zh: "我不懂，可以再說一次嗎？", ipa: "/aɪ doʊnt ˌʌndərˈstænd kæn juː rɪˈpiːt ðæt/", topic: "daily" },
  { lv: "初級", en: "Let's meet at the coffee shop at noon.", zh: "我們中午在咖啡店碰面吧。", ipa: "/lɛts miːt æt ðə ˈkɔːfi ʃɒp æt nuːn/", topic: "daily" },
  { lv: "中級", en: "Would you mind opening the window?", zh: "你介意把窗戶打開嗎？", ipa: "/wʊd juː maɪnd ˈoʊpənɪŋ ðə ˈwɪndoʊ/", topic: "daily" },
  { lv: "中級", en: "I'm not sure whether I can make it on time.", zh: "我不確定能不能準時到。", ipa: "/aɪm nɑːt ʃʊr ˈwɛðər aɪ kæn meɪk ɪt ɒn taɪm/", topic: "daily" },
  { lv: "中級", en: "She decided to take the job in another city.", zh: "她決定接下另一個城市的工作。", ipa: "/ʃiː dɪˈsaɪdɪd tə teɪk ðə dʒɒb ɪn əˈnʌðər ˈsɪti/", topic: "work" },
  { lv: "進階", en: "Had I known earlier, I would have acted differently.", zh: "早知道的話，我會有不同的做法。", ipa: "/hæd aɪ noʊn ˈɜːrliər aɪ wʊd hæv ˈæktɪd ˈdɪfrəntli/", topic: "exam" },
  { lv: "進階", en: "The committee is considering several alternative proposals.", zh: "委員會正在考慮幾個替代方案。", ipa: "/ðə kəˈmɪti ɪz kənˈsɪdərɪŋ ˈsɛvrəl ɔːlˈtɜːrnətɪv prəˈpoʊzəlz/", topic: "work" },
  { lv: "進階", en: "His argument, though compelling, lacked solid evidence.", zh: "他的論點雖然有說服力，卻缺乏確鑿證據。", ipa: "/hɪz ˈɑːrɡjumənt ðoʊ kəmˈpɛlɪŋ lækt ˈsɒlɪd ˈɛvɪdəns/", topic: "exam" },
  // —— 第 21 輪：補齊各動機主題句（讓「依動機推薦」名副其實；append-only，不動既有索引/錯題 key）——
  { lv: "初級", en: "Could you tell me how to get to the airport?", zh: "可以告訴我怎麼去機場嗎？", ipa: "/kʊd juː tɛl miː haʊ tə ɡɛt tə ðə ˈɛrpɔːrt/", topic: "travel" },
  { lv: "中級", en: "I'd like to check in. Here is my passport.", zh: "我想辦理入住，這是我的護照。", ipa: "/aɪd laɪk tə tʃɛk ɪn hɪr ɪz maɪ ˈpæspɔːrt/", topic: "travel" },
  { lv: "中級", en: "Let's schedule a meeting to discuss the project.", zh: "我們來約個時間討論這個專案。", ipa: "/lɛts ˈskɛdʒuːl ə ˈmiːtɪŋ tə dɪˈskʌs ðə ˈprɒdʒɛkt/", topic: "work" },
  { lv: "進階", en: "Which option best completes the meaning of the sentence?", zh: "哪個選項最能完成這個句子的意思？", ipa: "/wɪtʃ ˈɒpʃən bɛst kəmˈpliːts ðə ˈmiːnɪŋ əv ðə ˈsɛntəns/", topic: "exam" },
  { lv: "進階", en: "According to the passage, what is the author's main point?", zh: "根據這段文章，作者的主要論點是什麼？", ipa: "/əˈkɔːrdɪŋ tə ðə ˈpæsɪdʒ wɒt ɪz ðə ˈɔːθərz meɪn pɔɪnt/", topic: "exam" },
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
  { word: "manage", ipa: "/ˈmænɪdʒ/", pos: "v.", zh: "設法做到；管理", ex: "She managed to solve the problem.", exZh: "她設法解決了那個問題。" },
  { word: "obvious", ipa: "/ˈɒbviəs/", pos: "adj.", zh: "明顯的", ex: "The answer is quite obvious.", exZh: "答案相當明顯。" },
  { word: "encourage", ipa: "/ɪnˈkʌrɪdʒ/", pos: "v.", zh: "鼓勵", ex: "My teacher always encourages me.", exZh: "我的老師總是鼓勵我。" },
  { word: "purpose", ipa: "/ˈpɜːrpəs/", pos: "n.", zh: "目的；用途", ex: "What's the purpose of this meeting?", exZh: "這場會議的目的是什麼？" },
  { word: "reduce", ipa: "/rɪˈdjuːs/", pos: "v.", zh: "減少；降低", ex: "We need to reduce our spending.", exZh: "我們需要減少開支。" },
  { word: "familiar", ipa: "/fəˈmɪliər/", pos: "adj.", zh: "熟悉的", ex: "This place looks familiar.", exZh: "這個地方看起來很熟悉。" },
  { word: "achieve", ipa: "/əˈtʃiːv/", pos: "v.", zh: "達成；實現", ex: "You can achieve your goals with effort.", exZh: "努力就能達成你的目標。" },
  { word: "complain", ipa: "/kəmˈpleɪn/", pos: "v.", zh: "抱怨；投訴", ex: "There's no point in complaining.", exZh: "抱怨沒有意義。" },
  { word: "polite", ipa: "/pəˈlaɪt/", pos: "adj.", zh: "有禮貌的", ex: "He is always polite to others.", exZh: "他對人總是很有禮貌。" },
  { word: "suggest", ipa: "/səˈdʒɛst/", pos: "v.", zh: "建議；提議", ex: "Can you suggest a good movie?", exZh: "你能推薦一部好電影嗎？" },
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
  {
    title: "餐廳訂位",
    scene: "你打電話到餐廳預約晚餐的桌位。",
    turns: [
      { ai: "Good evening, Bella's Restaurant. How can I help you?", hint: "Hi, I'd like to book a table for two.", zh: "嗨，我想訂一張兩人的桌子。" },
      { ai: "Sure. What time would you like?", hint: "At seven o'clock tonight, please.", zh: "今晚七點，謝謝。" },
      { ai: "Perfect. Can I have your name?", hint: "It's Anna. Thank you.", zh: "我叫安娜，謝謝。" },
      { ai: "Great, we'll see you tonight!", hint: "See you tonight. Goodbye!", zh: "今晚見，再見！" },
    ],
  },
  {
    title: "看醫生",
    scene: "你覺得身體不舒服，去診所看醫生。",
    turns: [
      { ai: "Hello, what seems to be the problem?", hint: "I have a headache and a sore throat.", zh: "我頭痛又喉嚨痛。" },
      { ai: "How long have you felt like this?", hint: "Since yesterday morning.", zh: "從昨天早上開始。" },
      { ai: "I see. Do you have a fever?", hint: "Yes, a little. I feel very tired.", zh: "有一點，我覺得很累。" },
      { ai: "Okay. Take this medicine and get some rest.", hint: "Thank you, doctor.", zh: "謝謝醫生。" },
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
  {
    lv: "初級", prompt: "I ___ a student. I study at a university.",
    options: ["am", "is", "are", "be"], answer: 0,
    zh: "我是學生，我在大學念書。",
    explain: "主詞 I 搭配的 be 動詞用 am。",
  },
  {
    lv: "初級", prompt: "There are many ___ on the table.",
    options: ["book", "books", "a book", "bookes"], answer: 1,
    zh: "桌上有很多書。",
    explain: "many 後接可數名詞的複數形 → books。",
  },
  {
    lv: "中級", prompt: "He has been working here ___ five years.",
    options: ["since", "for", "from", "in"], answer: 1,
    zh: "他已經在這裡工作五年了。",
    explain: "for 接「一段時間長度」（five years）；since 才接時間點。",
  },
  {
    lv: "中級", prompt: "You ___ finish your homework before playing.",
    options: ["should", "would", "could", "might"], answer: 0,
    zh: "你應該先寫完作業再玩。",
    explain: "表示「應該、義務」用 should。",
  },
  {
    lv: "中級", prompt: "If I were you, I ___ accept the offer.",
    options: ["will", "would", "can", "am"], answer: 1,
    zh: "如果我是你，我會接受這個提議。",
    explain: "與現在事實相反的假設（were），主句用 would + 原形動詞。",
  },
  {
    lv: "進階", prompt: "By the time we arrived, the movie ___ already started.",
    options: ["has", "had", "was", "have"], answer: 1,
    zh: "我們到的時候，電影已經開始了。",
    explain: "過去某時間點之前就完成的動作，用過去完成式 had + p.p.。",
  },
  {
    lv: "進階", prompt: "I'd rather you ___ tell anyone about this.",
    options: ["don't", "didn't", "won't", "not"], answer: 1,
    zh: "我寧願你別跟任何人說這件事。",
    explain: "would rather + 子句表現在/未來願望時，子句用過去式（didn't）表假設語氣。",
  },
];
