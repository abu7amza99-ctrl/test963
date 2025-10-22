/* name-decoration.js — Final full version
   - Smart Arabic decoration engine (fast decorate)
   - "Decorate yourself" full encyclopedia support
   - Loads external JSON sets from ../assets/data/ if available
   - Respects rule: don't append connector AFTER final letter
   - UX: copy on click / long-press, toast messages, lazy loading
*/

/* ============================
   DOM عناصر
   ============================ */
const menuBtn = document.getElementById("menuBtn");
const sidePanel = document.getElementById("sidePanel");
const closePanel = document.getElementById("closePanel");

const quickBtn = document.getElementById("quickDecorationBtn");
const manualBtn = document.getElementById("manualDecorationBtn");

const quickDecor = document.getElementById("quickDecor");
const manualDecor = document.getElementById("manualDecor");

const quickName = document.getElementById("quickName");
const generateBtn = document.getElementById("generateBtn");
const quickResults = document.getElementById("quickResults");

const chooseTypeBtn = document.getElementById("chooseType");
const lettersMenu = document.getElementById("lettersMenu");
const lettersArea = document.getElementById("lettersArea");
const customResult = document.getElementById("customResult");
const clearCustom = document.getElementById("clearCustom");
const copyCustom = document.getElementById("copyCustom");

/* ============================
   فتح/غلق اللوحة الجانبية
   ============================ */
if (menuBtn) menuBtn.addEventListener("click", () => sidePanel.classList.add("open"));
if (closePanel) closePanel.addEventListener("click", () => sidePanel.classList.remove("open"));

/* ============================
   تبديل الأقسام (سريعة / بنفسك)
   ============================ */
if (quickBtn && manualBtn && quickDecor && manualDecor) {
  quickBtn.addEventListener("click", () => {
    quickDecor.classList.remove("hidden");
    manualDecor.classList.add("hidden");
  });
  manualBtn.addEventListener("click", () => {
    manualDecor.classList.remove("hidden");
    quickDecor.classList.add("hidden");
  });
}

/* ============================
   أدوات مساعدة
   ============================ */
function fragmentAppend(parent, nodes) {
  const frag = document.createDocumentFragment();
  nodes.forEach(n => frag.appendChild(n));
  parent.appendChild(frag);
}
function showToast(msg, timeout = 1200) {
  let t = document.getElementById("nd-toast");
  if (!t) {
    t = document.createElement("div");
    t.id = "nd-toast";
    Object.assign(t.style, {
      position: "fixed", bottom: "18px", left: "50%", transform: "translateX(-50%)",
      background: "rgba(0,0,0,0.75)", color: "#fff", padding: "8px 12px", borderRadius: "8px",
      zIndex: 9999, fontFamily: "Amiri, serif", fontSize: "14px", transition: "opacity 0.3s"
    });
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = "1";
  setTimeout(()=> t.style.opacity = "0", timeout);
}
function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try { document.execCommand("copy"); showToast("تم النسخ ✓"); } catch { alert("النسخ غير مدعوم"); }
  document.body.removeChild(ta);
}
function copyText(text) {
  if (!text) return;
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(String(text)).then(()=> showToast("تم النسخ ✓")).catch(()=> fallbackCopy(text));
  } else fallbackCopy(text);
}

/* ============================
   TEMPLATE_POOL — 60+ قالب
   ============================ */
const TEMPLATE_POOL = [
  "اٰ${n}ٰہٰٖ ♛ ✦",
  "• ${n} ٰۧ ❖",
  "𓆩 ${n} 𓆪 ✺",
  "꧁ ${n} ꧂ ✧",
  "★ ${n} ☆",
  "❥ ${n} ❂",
  "↭ ${n} ↭ ✯",
  "⫷ ${n} ⫸ ✪",
  "『${n}』 ✿",
  "☬ ${n} ☬ ✶",
  "•°${n}°• ✦",
  "♡ ${n} ♡",
  "ꜱ ${n} ᴺ ✺",
  "『${n}』 ✵",
  "꧁༺ ${n} ༻꧂ ✾",
  "❦ ${n} ❦ ✷",
  "𖣘 ${n} 𖣘 ✹",
  "☆彡 ${n} 彡☆ ✶",
  "⇜ ${n} ⇝ ✧",
  "✿ ${n} ✿",
  "✪ ${n} ✪",
  "✧ ${n} ✧",
  "❂ ${n} ❂",
  "☸ ${n} ☸",
  "⌯ ${n} ⌯",
  "✺ ${n} ✺",
  "۞ ${n} ۞",
  "【 ${n} 】",
  "✽ ${n} ✽",
  "✵ ${n} ✵",
  "✯ ${n} ✯",
  "۩ ${n} ۩",
  "✦ ${n} ✦",
  "❉ ${n} ❉",
  "✾ ${n} ✾",
  "♛ ${n} ♛",
  "♚ ${n} ♚",
  "☾ ${n} ☽",
  "♕ ${n} ♕",
  "❖ ${n} ❖",
  "╰☆╮ ${n} ╰☆╮",
  "⋆ ${n} ⋆",
  "• ${n} •",
  "✿✿ ${n} ✿✿",
  "✦✦ ${n} ✦✦",
  "❁ ${n} ❁",
  "❋ ${n} ❋",
  "✬ ${n} ✬",
  "✫ ${n} ✫",
  "✮ ${n} ✮"
];

/* ============================
   CONNECTORS و DIACRITICS — وصل وتشكيل
   ============================ */
const CONNECTORS = [
  "ـ","ـِـ","ـُـ","ـْ","ـّ",
  "ۛ","ۚ","ۖ","ۗ","ۘ","ۙ","ۜ","۫",
  "ٰ","ٖ","ٛ","ّ",
  // رموز إضافية المطلوبة (محوّلة/آمنة)
  "ཱ","ི","ཱི","ུ","͜","ཱུ","ྲྀ","ཷ","ླྀ","ེ","ཻ","ོ","ཽ","ཾ","ཿ","ऀ","ँ","ं","ः","ऺ"
];
const DIACRITICS = ["َ","ً","ُ","ٌ","ِ","ٍ","ْ","ّ"];

/* ============================
   قواعد لغوية / فحوصات
   ============================ */
const isArabicLetter = ch => /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(ch);
function canAppendConnectorAfter(text, index) {
  for (let i = index + 1; i < text.length; i++) {
    if (text[i] === " ") return false;
    if (isArabicLetter(text[i])) return true;
  }
  return false;
}

/* ============================
   decorateArabicHybrid — زخرفة داخلية ذكية
   ============================ */
function decorateArabicHybrid(text) {
  text = String(text || "");
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    out += ch;
    if (!isArabicLetter(ch)) continue;
    if (canAppendConnectorAfter(text, i)) {
      if (Math.random() < 0.45) out += CONNECTORS[Math.floor(Math.random()*CONNECTORS.length)];
      if (Math.random() < 0.45) out += DIACRITICS[Math.floor(Math.random()*DIACRITICS.length)];
      if (Math.random() < 0.12) out += CONNECTORS[Math.floor(Math.random()*CONNECTORS.length)];
    }
  }
  return out;
}

/* ============================
   applyTemplate & generateDecorations
   ============================ */
function applyTemplate(template, name) {
  return template.replace(/\$\{n\}/g, decorateArabicHybrid(name));
}

const FINAL_SYMBOLS = ["♛","⚜","✦","✧","❖","❂","✺","✾","✼","✪","✯","✮","✿","✵","✶","✷","✸","✹"];
const FINAL_EMOJIS = ["💫","🌸","🌹","💎","✨","🌺","🌻","🌼","💖"];

function generateDecorations(name, count = 50) {
  name = String(name||"").trim();
  const results = [];
  for (let i = 0; i < count; i++) {
    const tpl = TEMPLATE_POOL[Math.floor(Math.random()*TEMPLATE_POOL.length)];
    let decorated = applyTemplate(tpl, name);
    const sym = FINAL_SYMBOLS[Math.floor(Math.random()*FINAL_SYMBOLS.length)];
    const emo = FINAL_EMOJIS[Math.floor(Math.random()*FINAL_EMOJIS.length)];
    decorated = `${decorated} ${sym} ${emo}`;
    results.push(decorated);
  }
  return results;
}

/* ============================
   عرض النتائج
   ============================ */
function renderQuickResults(list) {
  quickResults.innerHTML = "";
  if (!Array.isArray(list) || list.length === 0) return;
  const nodes = list.map(txt => {
    const div = document.createElement("div");
    div.className = "result-item";
    div.textContent = txt;
    addCopyOnLongPress(div, txt);
    return div;
  });
  fragmentAppend(quickResults, nodes);
}

/* ============================
   نسخ بالنقر / الضغط الطويل
   ============================ */
function addCopyOnLongPress(el, text) {
  let timer = null;
  const duration = 600;
  let moved = false;

  el.addEventListener("mousedown", () => {
    moved = false;
    timer = setTimeout(() => !moved && copyText(text), duration);
  });
  el.addEventListener("mouseup", () => clearTimeout(timer));
  el.addEventListener("mouseleave", () => clearTimeout(timer));

  el.addEventListener("touchstart", () => {
    moved = false;
    timer = setTimeout(() => !moved && copyText(text), duration);
  }, { passive: true });

  el.addEventListener("touchmove", () => { moved = true; clearTimeout(timer); });
  el.addEventListener("touchend", () => clearTimeout(timer));
}

/* ============================
   زر الزخرفة السريعة
   ============================ */
if (generateBtn) {
  generateBtn.addEventListener("click", () => {
    const name = (quickName && quickName.value || "").trim();
    if (!name) return showToast("يرجى كتابة الاسم أولاً");
    const decs = generateDecorations(name, 50);
    renderQuickResults(decs);
  });
}

/* ============================
   الموسوعة (LETTER_SETS) — مع تحميل خارجي إذا وُجد
   ============================ */
const LETTER_SETS = {
  "الحروف العربية": "ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي".split(" "),
  "الحروف العربية المزخرفة": [], // سنحشوها من الملف JSON أو من الافتراضي أدناه
  "تشكيل الأحرف": ["َ","ً","ُ","ٌ","ِ","ٍ","ْ","ّ"],
  "حروف الوصل": [
    "ـ","ـِـ","ـُـ","ـْ","ـّ","ۛ","ۚ","ۖ","ۗ","ۘ","ۙ","ۜ","۫",
    "ٰ","ٖ","ٛ","ཱ","ི","ཱི","ུ","͜","ཱུ","ྲྀ","ཷ","ླྀ","ེ","ཻ","ོ","ཽ","ཾ","ཿ","ऀ","ँ","ं","ः","ऺ"
  ],
  "الرموز": [
    "★","☆","✿","❀","♡","❤","❥","♛","♚","⚜","☪","☯","✪","✯","✮","✺","✻","✼","❂","❁","❉","✵","✶","✷","✸","✹",
    "◆","◇","◈","●","○","◎","◉","✥","✤","✣"
  ],
  "رموز ببجي": ["々","ツ","彡","卍","メ","气","乂","爪","丹","丫","〆","灬","ク","ッ","ハ","シ","キ","〤","☆","★","卐","꧁","꧂","༒","ღ"],
  "الحروف الإنجليزية": [] // سيُملأ من JSON أو من الافتراضي أدناه
};

/* ملء الحروف الإنجليزية بصيغ أساسية */
(function fillEnglishDefaults() {
  const base = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const variants = [];
  function toFullwidth(ch){ const code=ch.charCodeAt(0); return (code>=65&&code<=90)?String.fromCharCode(0xFF21+(code-65)):ch; }
  function toCircled(ch){ const code=ch.charCodeAt(0); return (code>=65&&code<=90)?String.fromCharCode(0x24B6+(code-65)):ch; }
  function toScript(ch){ const map={A:"𝒜",B:"𝔅",C:"𝒞",D:"𝒟",E:"ℰ",F:"𝔉",G:"𝒢",H:"ℋ",I:"ℐ",J:"𝒥",K:"𝒦",L:"ℒ",M:"𝑀",N:"𝒩",O:"𝒪",P:"𝒫",Q:"𝒬",R:"ℛ",S:"𝒮",T:"𝒯",U:"𝒰",V:"𝒱",W:"𝒲",X:"𝒳",Y:"𝒴",Z:"𝒵"}; return map[ch]||ch; }
  base.forEach(ch => { variants.push(ch); variants.push(ch.toLowerCase()); variants.push(toFullwidth(ch)); variants.push(toCircled(ch)); variants.push(toScript(ch)); });
  LETTER_SETS["الحروف الإنجليزية"] = variants;
})();

/* ============================
   تحميل خارجي لملفات JSON كبيرة (اختياري)
   ============================ */
async function loadExternalSet(url) {
  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error("failed");
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (e) {
    return [];
  }
}

async function ensureLargeSets() {
  const extras = {};
  extras["الحروف العربية المزخرفة"] = await loadExternalSet("../assets/data/letters-ar-decorated.json");
  extras["الحروف الإنجليزية"] = await loadExternalSet("../assets/data/letters-en-decorated.json");
  extras["الرموز_الكبيرة"] = await loadExternalSet("../assets/data/symbols-large.json");
  Object.keys(extras).forEach(k => {
    if (extras[k] && extras[k].length) {
      if (!LETTER_SETS[k]) LETTER_SETS[k] = [];
      extras[k].forEach(item => { if (!LETTER_SETS[k].includes(item)) LETTER_SETS[k].push(item); });
    }
  });
  return true;
}

/* ============================
   عرض الحروف عند اختيار نوع
   ============================ */
async function displayLetters(type) {
  lettersArea.innerHTML = "";
  // تحميل خارجي إذا تطلب النوع
  if (["الحروف العربية المزخرفة","الحروف الإنجليزية","الرموز_الكبيرة"].includes(type)) {
    await ensureLargeSets();
  }
  const chars = LETTER_SETS[type] || [];
  if (!chars.length) {
    const p = document.createElement("p");
    p.textContent = "لا توجد عناصر في هذه المجموعة حالياً.";
    lettersArea.appendChild(p);
    return;
  }
  const maxShow = 600;
  const slice = chars.slice(0, maxShow);
  const nodes = slice.map(ch => {
    const s = document.createElement("span");
    s.className = "letter-box";
    s.textContent = ch;
    s.title = ch;
s.addEventListener("click", () => {
  const lastChar = (customResult.value || "").slice(-1);
  const isConnector = (LETTER_SETS["حروف الوصل"] || []).includes(ch) || CONNECTORS.includes(ch);

  if (isConnector) {
    const cr = customResult.value || "";
    if (!cr || cr.slice(-1) === " ") { showToast("لا يمكن إضافة وصلة هنا"); return; }
    if ((LETTER_SETS["حروف الوصل"] || []).includes(lastChar) || CONNECTORS.includes(lastChar)) {
      showToast("لا يمكن تكرار الوصل مباشرة");
      return;
    }
  }

  // أضف الحرف في المكان الذي يوجد فيه مؤشر الكتابة
  const start = customResult.selectionStart;
  const end = customResult.selectionEnd;
  const text = customResult.value;
  customResult.value = text.slice(0, start) + ch + text.slice(end);
  customResult.selectionStart = customResult.selectionEnd = start + ch.length;
  customResult.focus(); // حتى يفتح الكيبورد على الهاتف
});
    return s;
  });
  fragmentAppend(lettersArea, nodes);
}

/* ============================
   ربط أزرار اختيار النوع
   ============================ */
if (chooseTypeBtn && lettersMenu) {
  chooseTypeBtn.addEventListener("click", () => lettersMenu.classList.toggle("hidden"));
  lettersMenu.querySelectorAll(".letters-type").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      lettersMenu.classList.add("hidden");
      displayLetters(type);
    });
  });
}

/* ============================
   مسح ونسخ للنص اليدوي
   ============================ */
if (clearCustom)
  clearCustom.addEventListener("click", () => {
    customResult.value = "";
  });

if (copyCustom)
  copyCustom.addEventListener("click", () => {
    const t = (customResult.value || "").trim();
    if (!t) return showToast("لا يوجد نص للنسخ");
    copyText(t);
  });
  if (!t) return showToast("لا يوجد نص للنسخ");
  copyText(t);
});

/* ============================
   DOMContentLoaded (تهيئة خفيفة)
   ============================ */
document.addEventListener("DOMContentLoaded", () => {
  // لا تحميل افتراضي ضخم، التحميل عند الطلب من ensureLargeSets()
});function addCopyOnLongPress(el, text) {
  let timer = null;
  const duration = 600;
  let moved = false;

  el.addEventListener("mousedown", () => {
    moved = false;
    timer = setTimeout(() => !moved && copyText(text), duration);
  });
  el.addEventListener("mouseup", () => clearTimeout(timer));
  el.addEventListener("mouseleave", () => clearTimeout(timer));

  el.addEventListener("touchstart", (e) => {
    moved = false;
    timer = setTimeout(() => !moved && copyText(text), duration);
  }, { passive: true });

  el.addEventListener("touchmove", () => { moved = true; clearTimeout(timer); });
  el.addEventListener("touchend", () => clearTimeout(timer));
}
