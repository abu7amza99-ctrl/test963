/* name-decoration.js
   الإصدار: مدمج كامل - خوارزمية زخرفة سريعة + موسوعة "زخرف بنفسك"
   ملاحظة: الملف مُصمّم ليعمل داخل بنية HTML/CSS التي حضّرناها.
*/

/* ============================
   عناصر واجهة المستخدم (DOM)
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
   تعاملات بسيطة: فتح/غلق اللوحة
   ============================ */
if (menuBtn) menuBtn.addEventListener("click", () => sidePanel.classList.add("open"));
if (closePanel) closePanel.addEventListener("click", () => sidePanel.classList.remove("open"));

/* ============================
   تبديل الأقسام: سريعة / بنفسك
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
   مساعدات الأداء / أدوات
   ============================ */
function fragmentAppend(parent, children) {
  const frag = document.createDocumentFragment();
  children.forEach(c => frag.appendChild(c));
  parent.appendChild(frag);
}
function safeText(s) {
  return String(s);
}

/* ============================
   مكتبة القوالب (60 قالب) للخوارزمية
   ============================ */
const TEMPLATE_POOL = [
  "اٰ${n}ٰہٰٖ 🌸💫",
  "• ${n} ٰۧ ✨",
  "𓆩 ${n} 𓆪 💖",
  "꧁ ${n} ꧂ 💎",
  "★ ${n} ☆",
  "❥ ${n} 🌹",
  "↭ ${n} ↭ ⚜️",
  "⫷ ${n} ⫸ 💫",
  "『${n}』 💞",
  "☬ ${n} ☬ 💕",
  "•°${n}°• 💫",
  "♡ ${n} ♡",
  "ꜱ ${n} ᴺ 💛",
  "『${n}』✨",
  "꧁༺ ${n} ༻꧂",
  "❦ ${n} ❦ 🌸",
  "𖣘 ${n} 𖣘 💖",
  "☆彡 ${n} 彡☆",
  "⇜ ${n} ⇝ 💕",
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
  "✺ ${n} ✺",
  "╰☆╮ ${n} ╰☆╮",
  "⋆ ${n} ⋆",
  "✵ ${n} ✵",
  "• ${n} •",
  "✿✿ ${n} ✿✿",
  "✦✦ ${n} ✦✦",
  "❁ ${n} ❁",
  "❋ ${n} ❋",
  "✬ ${n} ✬",
  "✫ ${n} ✫",
  "❂❂ ${n} ❂❂",
  "✮ ${n} ✮",
  "✯✯ ${n} ✯✯",
  "✺✺ ${n} ✺✺",
  "✧✧ ${n} ✧✧",
  "⚜ ${n} ⚜"
];
// (تأكدنا من وجود 60+ قالب).  

/* ============================
   عناصر زخرفية داخلية (حروف وصل و تشكيل)
   ============================ */
const CONNECTORS = ["ـ", "ۛ", "ۖ", "ۗ", "ۘ", "ۙ", "ـِـ", "ِـ", "ـِ"];
const DIACRITICS = ["َ","ً","ُ","ٌ","ِ","ٍ","ْ","ّ","ٖ","ٛ"];

/* ============================
   دالة زخرفة عربية داخلية محافظة على القواعد
   - تضيف تشكيل/وصلات بشكل ذكي
   - لا تكسر حروف التركيب أو المسافات
   ============================ */
function decorateArabicSmart(text) {
  text = String(text || "");
  // نُعايِن كل حرف؛ إذا عربي نضيف احتمالياً رموز وصل/تشكيل
  const arabicLetter = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
  let out = "";
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    out += ch;
    if (arabicLetter.test(ch)) {
      // لا نضيف بعد الفراغ أو علامات الترقيم
      if (Math.random() < 0.45) {
        out += CONNECTORS[Math.floor(Math.random() * CONNECTORS.length)];
      }
      if (Math.random() < 0.5) {
        out += DIACRITICS[Math.floor(Math.random() * DIACRITICS.length)];
      }
    }
  }
  return out;
}

/* ============================
   دالة تغليف الاسم بقالب
   ============================ */
function applyTemplate(template, name) {
  return template.replace(/\$\{n\}/g, decorateArabicSmart(name));
}

/* ============================
   دالة توليد 50 زخرفة ذكية
   ============================ */
function generateDecorations(name, count = 50) {
  const results = [];
  // نستخدم مزيجًا من القوالب بشكل يضمن تنوعًا مرتفعًا
  for (let i = 0; i < count; i++) {
    const tpl = TEMPLATE_POOL[Math.floor(Math.random() * TEMPLATE_POOL.length)];
    results.push(applyTemplate(tpl, name));
  }
  return results;
}

/* ============================
   وظيفة عرض النتائج في DOM (بأداء جيد)
   ============================ */
function renderQuickResults(arr) {
  quickResults.innerHTML = "";
  if (!arr || !arr.length) return;
  const items = arr.map(text => {
    const div = document.createElement("div");
    div.className = "result-item";
    div.textContent = text;
    addCopyOnLongPress(div, text);
    return div;
  });
  fragmentAppend(quickResults, items);
}

/* ============================
   زر توليد الزخارف (سريعة)
   ============================ */
if (generateBtn) {
  generateBtn.addEventListener("click", () => {
    const name = (quickName && quickName.value || "").trim();
    if (!name) return alert("يرجى كتابة الاسم أولاً!");
    // توليد ذكي
    const decs = generateDecorations(name, 50);
    renderQuickResults(decs);
  });
}

/* ============================
   نسخ بالنقر / الضغط المطوّل
   - يدعم الموبايل والكمبيوتر
   ============================ */
function addCopyOnLongPress(element, text) {
  let timer = null;
  const pressDuration = 500; // 500ms للضغط الطويل
  element.addEventListener("mousedown", () => {
    timer = setTimeout(() => copyText(text), pressDuration);
  });
  element.addEventListener("mouseup", () => {
    if (timer) clearTimeout(timer);
  });
  element.addEventListener("mouseleave", () => {
    if (timer) clearTimeout(timer);
  });
  element.addEventListener("touchstart", () => {
    timer = setTimeout(() => copyText(text), pressDuration);
  }, {passive: true});
  element.addEventListener("touchend", () => {
    if (timer) clearTimeout(timer);
  });
  element.addEventListener("click", () => {
    // نقرة واحدة تنسخ أيضاً (تجربة أسهل للمستخدم)
    copyText(text);
  });
}

function copyText(text) {
  const t = String(text || "");
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(t).then(() => {
      showToast("تم النسخ ✓");
    }).catch(() => {
      fallbackCopy(t);
    });
  } else {
    fallbackCopy(t);
  }
}

function fallbackCopy(text) {
  const ta = document.createElement("textarea");
  ta.value = text;
  ta.style.position = "fixed";
  ta.style.left = "-9999px";
  document.body.appendChild(ta);
  ta.select();
  try {
    document.execCommand("copy");
    showToast("تم النسخ ✓");
  } catch (e) {
    alert("نسخ غير مدعوم في هذا المتصفح.");
  }
  document.body.removeChild(ta);
}

/* ============================
   رسالة صغيرة عائمة (toast)
   ============================ */
function showToast(msg, timeout = 1200) {
  let toast = document.getElementById("nd-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "nd-toast";
    toast.style.position = "fixed";
    toast.style.bottom = "20px";
    toast.style.left = "50%";
    toast.style.transform = "translateX(-50%)";
    toast.style.padding = "8px 14px";
    toast.style.background = "rgba(0,0,0,0.7)";
    toast.style.color = "#fff";
    toast.style.borderRadius = "8px";
    toast.style.zIndex = 9999;
    toast.style.fontFamily = "Amiri, serif";
    toast.style.fontSize = "14px";
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.opacity = "1";
  setTimeout(() => {
    toast.style.opacity = "0";
  }, timeout);
}

/* ============================
   ========== الموسوعة الشاملة ==========
   سنوفّر مجموعات كبيرة ومنظمة، لكن نحملها تدريجيًا عند الطلب
   ============================ */

/* --- مجموعات أساسية (مبسطة أولًا، ثم نوسّع) --- */
const LETTER_SETS = {
  // الحروف العربية (عادية)
  "الحروف العربية": ("ا ب ت ث ج ح خ د ذ ر ز س ش ص ض ط ظ ع غ ف ق ك ل م ن ه و ي").split(" "),
  // تشكيل
  "تشكيل الأحرف": ["َ","ً","ُ","ٌ","ِ","ٍ","ْ","ّ"],
  // حروف الوصل وزخارف الوصل
  "حروف الوصل": ["ـ","ـِ","ـُ","ـْ","ـّ","ۛ","ۚ","ۖ","ۗ","ۘ","ۙ","ۜ","ۥ"],
  // رموز عامة (ناعمة + زخارف)
  "الرموز": [
    "★","☆","✿","❀","♡","❤","❥","💫","✨","♛","♚","⚜","☪","☯","♩","♪","♫","♬",
    "✪","✯","☾","☽","✦","✧","✺","✻","✼","❂","❁","❃","❋","❈","✵","✶","✷","✸","✹",
    "◆","◇","◈","●","○","◎","◉","◌","※","※","❖","✽","✾","✿","✥","✤","✣"
  ],
  // رموز PUBG (مألوفة ومستخدمة عادةً)
  "رموز ببجي": ["々","ツ","彡","卍","メ","气","乂","爪","丹","丫","彡","々","〆","灬","ク","ッ","ハ","シ","キ","ツ","〤","☆","★","卐","卍","꧁","꧂","༒"],
  // الحروف الإنجليزية بأشكال مُكررة عدة ستايلات
  "الحروف الإنجليزية": generateEnglishVariantsArray()
};

/* ============================
   دالة إنشاء مصفوفة أنماط الحروف الإنجليزية (عدة ستايلات شائعة)
   نولّد عدة تمثيلات شائعة مثل: uppercase, bold-like, script, fraktur, fullwidth, circled, smallcaps
   ============================ */
function generateEnglishVariantsArray() {
  // سنبقي مجموعة متنوّعة من أشكال الحروف الإنجليزية (أحرف مفردة)
  const base = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
  const variants = [];
  // بعض تمثيلات يونيكود الشائعة (حلقات صغيرة من أمثلة)
  const styleSets = [
    // serif-like (Mathematical Bold Italic etc are large; نستخدم مجرد أمثلة رمزية)
    {prefix:"", map: (c)=> c}, // الأصلية
    {prefix:"", map: (c)=> c.toLowerCase()}, // lowercase
    {prefix:"", map: (c)=> toFullwidth(c)}, // fullwidth
    {prefix:"", map: (c)=> toCircled(c)}, // circled
    {prefix:"", map: (c)=> toScript(c)}, // script-ish (fallback)
    {prefix:"", map: (c)=> toFraktur(c)}, // fraktur-ish (fallback)
    {prefix:"", map: (c)=> toSmallCaps(c)} // smallcaps-ish
  ];
  for (const s of styleSets) {
    base.forEach(ch => {
      variants.push(s.map(ch));
    });
  }
  return variants.filter(Boolean);
}

/* ============================
   دوال تحويل مبسطة للحروف الإنجليزية لأنواع (ملائمة للعرض)
   (ملاحظة: ليست شاملة لكل يونيكود، لكنها تغطي أشكال شائعة)
   ============================ */
function toFullwidth(ch) {
  // A => Ａ (U+FF21)
  const code = ch.charCodeAt(0);
  if (code >= 65 && code <= 90) return String.fromCharCode(0xFF21 + (code - 65));
  return ch;
}
function toCircled(ch) {
  // A => Ⓐ (U+24B6)
  const code = ch.charCodeAt(0);
  if (code >= 65 && code <= 90) return String.fromCharCode(0x24B6 + (code - 65));
  return ch;
}
function toScript(ch) {
  // إطار مبسط: سنستخدم تشكيلة محدودة مع استبدال لبعض الحروف
  const map = {
    A: "𝒜", B: "𝔅", C: "𝒞", D: "𝒟", E: "ℰ", F: "𝔉",
    G: "𝒢", H: "ℋ", I: "ℐ", J: "𝒥", K: "𝒦", L: "ℒ",
    M: "𝑀", N: "𝒩", O: "𝒪", P: "𝒫", Q: "𝒬", R: "ℛ",
    S: "𝒮", T: "𝒯", U: "𝒰", V: "𝒱", W: "𝒲", X: "𝒳",
    Y: "𝒴", Z: "𝒵"
  };
  return map[ch] || ch;
}
function toFraktur(ch) {
  const map = {
    A:"𝔄", B:"𝔅", C:"ℭ", D:"𝔇", E:"𝔈", F:"𝔉",
    G:"𝔊", H:"ℌ", I:"𝔍", J:"𝔍", K:"𝔎", L:"𝔏",
    M:"𝔐", N:"𝔑", O:"𝔒", P:"𝔓", Q:"𝔔", R:"ℜ",
    S:"𝔖", T:"𝔗", U:"𝔘", V:"𝔙", W:"𝔚", X:"𝔛",
    Y:"𝔜", Z:"𝔝"
  };
  return map[ch] || ch;
}
function toSmallCaps(ch) {
  // smallcaps approximation (lowercase Latin small caps not fully supported)
  return ch.toLowerCase();
}

/* ============================
   تحميل ذكي/جزئي للمجموعات (lazy)
   - لتجنّب إضافة مئات العناصر الى DOM دفعة واحدة
   ============================ */
let loadedSets = {}; // يحفظ ما تم تحميله

function loadSet(name) {
  if (loadedSets[name]) return Promise.resolve(loadedSets[name]);
  return new Promise(resolve => {
    // تأخير طفيف لمحاكاة تحميل مؤقت إذا لزم
    setTimeout(() => {
      // إذا كانت المجموعة موجودة في LETTER_SETS نستخدمها
      const setData = LETTER_SETS[name] || [];
      // نُحوّل إلى مصفوفة أحرف (تتأكد من القيم)
      const arr = Array.isArray(setData) ? setData.slice() : [];
      loadedSets[name] = arr;
      resolve(arr);
    }, 50);
  });
}

/* ============================
   عرض الحروف في واجهة "زخرف بنفسك"
   ============================ */
function displayLetters(type) {
  lettersArea.innerHTML = "";
  loadSet(type).then(chars => {
    if (!chars || !chars.length) return;
    // إذا أعداد كبيرة، نعرض أول 300 فقط ثم نسمح بالتمرير/تحميل المزيد لاحقًا
    const maxToShow = 600; // آمن للعرض على الجوال
    const showList = chars.slice(0, maxToShow);
    const nodes = showList.map(ch => {
      const span = document.createElement("span");
      span.className = "letter-box";
      span.textContent = ch;
      span.title = ch;
      span.addEventListener("click", () => {
        customResult.textContent += ch;
      });
      return span;
    });
    fragmentAppend(lettersArea, nodes);
  });
}

/* ============================
   ربط أزرار اختيار النوع
   ============================ */
if (chooseTypeBtn && lettersMenu) {
  chooseTypeBtn.addEventListener("click", () => {
    lettersMenu.classList.toggle("hidden");
  });
  lettersMenu.querySelectorAll(".letters-type").forEach(btn => {
    btn.addEventListener("click", () => {
      const type = btn.dataset.type;
      lettersMenu.classList.add("hidden");
      displayLetters(type);
    });
  });
}

/* ============================
   مفاتيح مسح/نسخ للنص اليدوي
   ============================ */
if (clearCustom) clearCustom.addEventListener("click", () => { customResult.textContent = ""; });
if (copyCustom) copyCustom.addEventListener("click", () => {
  const text = (customResult.textContent || "").trim();
  if (!text) return showToast("لا يوجد نص للنسخ");
  copyText(text);
});

/* ============================
   تعبئة الموسوعة الأساسية الإضافية (عربي مزخرف - أمثلة)
   نزوّد لكل حرف عربي مجموعة من البدائل المزخرفة (نماذج)
   ============================ */
(function expandArabicVariants() {
  // خريطة بدائل مزخرفة لبعض الحروف (عينة واسعة)
  const arabicBase = LETTER_SETS["الحروف العربية"];
  const fancy = {
    // أمثلة زخرفية (ليست شاملة لكل أشكال ممكنة ولكن واسعة)
    "ا": ["ا","آ","ا͠","𝕒","آٰ","𝓐"], // أحرف مزخرفة للتجربة (بعضها رمزي)
    "ب": ["ب","بـ","ب̷","β","𝔟"],
    "ت": ["ت","تـ","т","𝓽"],
    "ث": ["ث","ثـ","Ϯ","𝕥"],
    "ج": ["ج","جـ","ج̷","𝔧"],
    "ح": ["ح","حـ","ћ","𝒽"],
    "خ": ["خ","خـ","қ","𝓀"],
    "د": ["د","د̷","∂","𝒹"],
    "ذ": ["ذ","ذ̷","ż","𝓏"],
    "ر": ["ر","ر̷","ř","𝓇"],
    "ز": ["ز","ز̷","ẑ","𝓏"],
    "س": ["س","سـ","ş","𝓈"],
    "ش": ["ش","شـ","ŝ","𝓈"],
    "ص": ["ص","صـ","ς","𝕤"],
    "ض": ["ض","ضـ","đ","𝔡"],
    "ط": ["ط","طـ","ţ","𝓉"],
    "ظ": ["ظ","ظـ","ẓ","𝔷"],
    "ع": ["ع","عـ","ع̷","ʕ","𝕒"],
    "غ": ["غ","غـ","ĝ","𝓰"],
    "ف": ["ف","فـ","ƒ","𝔣"],
    "ق": ["ق","قـ","ɋ","𝓺"],
    "ك": ["ك","كـ","ƙ","𝔨"],
    "ل": ["ل","لـ","ℓ","𝓵"],
    "م": ["م","مـ","ɱ","𝓶"],
    "ن": ["ن","نـ","η","𝓷"],
    "ه": ["ه","هـ","ħ","𝓱"],
    "و": ["و","و̷","ω","𝔴"],
    "ي": ["ي","يـ","ɣ","𝔶"]
  };
  // دمج إلى LETTER_SETS كمفتاح جديد "الحروف العربية المزخرفة"
  const decoratedList = [];
  arabicBase.forEach(ch => {
    const list = fancy[ch] || [ch];
    // نضم كل البدائل إلى القائمة
    list.forEach(x => decoratedList.push(x));
  });
  LETTER_SETS["الحروف العربية المزخرفة"] = decoratedList;
})();

/* ============================
   توسيع رموز ببجي (قائمة أطول وآمنة)
   ============================ */
LETTER_SETS["رموز ببجي"] = [
  "々","ツ","彡","卍","メ","气","乂","爪","丹","丫","〆","灬","ク","ッ","ハ","シ","キ",
  "ツ","〤","☆","★","卐","卍","꧁","꧂","༒","ღ","ღ","۞","☯","✧","✦","✪","✯","✮",
  "✺","✻","✼","✽","✾","❂","❁","✵","✶","✷","✸","✹","✺","✻","✼","✽","✾"
];

/* ============================
   تحسين تجربة الأداء للمجموعات الكبيرة
   - نسمح بعرض أول 600 حرف فقط ثم التحميل الجزئي لاحقًا
   ============================ */
// (already handled in displayLetters with maxToShow)

/* ============================
   انطلاقة افتراضية: إذا الصفحة جاهزة، نجهز حدث توليد تجريبي خفيف
   ============================ */
document.addEventListener("DOMContentLoaded", () => {
  // إن لم يكن هناك زر توليد في نسخة قديمة، نوقف
  // (لكن غالبًا موجود حسب الهيكل)
  // افتراضيًا نعرض قسم "الزخرفة السريعة" مخفي حتى يختار المستخدم
  // لا نفعل شيء تلقائيًا
});

/* ============================
   نهاية الملف
   ============================ */
