import { sentenceStress, isFunctionWord } from "../assets/js/scoring.js";
let pass=0, fail=0;
const ok=(c,m)=>{ if(c){pass++;} else {fail++; console.log("FAIL:",m);} };

// 1. 基本實詞/虛詞分類
const m1 = sentenceStress("I would like a cup of coffee please");
const map1 = Object.fromEntries(m1.map(x=>[x.word.toLowerCase(), x.stressed]));
ok(map1["i"]===false, "I 為虛詞(代名詞)");
ok(map1["would"]===false, "would 助動詞弱化");
ok(map1["like"]===true, "like 動詞重讀");
ok(map1["a"]===false, "a 冠詞弱化");
ok(map1["cup"]===true, "cup 名詞重讀");
ok(map1["of"]===false, "of 介系詞弱化");
ok(map1["coffee"]===true, "coffee 名詞重讀");
ok(map1["please"]===true, "please 實詞重讀");

// 2. 否定縮寫永遠重讀
ok(isFunctionWord("don't")===false, "don't 否定重讀");
ok(isFunctionWord("can't")===false, "can't 否定重讀");
ok(isFunctionWord("won't")===false, "won't 否定重讀");

// 3. 縮寫去尾後判斷
ok(isFunctionWord("it's")===true, "it's→it 虛詞");
ok(isFunctionWord("they're")===true, "they're→they 虛詞");
ok(isFunctionWord("I'm")===true, "I'm→i 虛詞");

// 4. 標點不影響
ok(isFunctionWord("the,")===true, "the, 去標點仍虛詞");
ok(isFunctionWord("coffee.")===false, "coffee. 去標點仍實詞");

// 5. 疑問詞/否定詞為實詞(重讀)
const m5 = sentenceStress("What do you not know");
const map5 = Object.fromEntries(m5.map(x=>[x.word.toLowerCase(), x.stressed]));
ok(map5["what"]===true, "what 疑問詞重讀");
ok(map5["do"]===false, "do 助動詞弱化");
ok(map5["not"]===true, "not 否定詞重讀");
ok(map5["know"]===true, "know 動詞重讀");

// 6. 至少有實詞 & 詞數一致
ok(m1.length===8, "詞數一致 = 8");
ok(m1.some(x=>x.stressed) && m1.some(x=>!x.stressed), "句中同時有重讀與弱化");

console.log(`\n${pass}/${pass+fail} PASS`);
process.exit(fail?1:0);
