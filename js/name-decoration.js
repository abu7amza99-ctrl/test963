// =======================
// عناصر واجهة المستخدم
// =======================
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

// =======================
// فتح وإغلاق اللوحة الجانبية
// =======================
menuBtn.addEventListener("click", () => sidePanel.classList.add("open"));
closePanel.addEventListener("click", () => sidePanel.classList.remove("open"));

// =======================
// التبديل بين الأقسام
// =======================
quickBtn.addEventListener("click", () => {
  quickDecor.classList.remove("hidden");
  manualDecor.classList.add("hidden");
});
manualBtn.addEventListener("click", () => {
  manualDecor.classList.remove("hidden");
  quickDecor.classList.add("hidden");
});

// =======================
// خوارزمية الزخرفة السريعة (خوارزميتنا)
// =======================
function generateDecorations(name, count) {
  const templates = [
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
  ];
  const results = [];
  for (let i = 0; i < count; i++) {
    const template = templates[Math.floor(Math.random() * templates.length)];
    const styled = template.replace("${n}", decorateArabic(name));
    results.push(styled);
  }
  return results;
}

// دالة زخرفة داخلية تحافظ على العربية
function decorateArabic(text) {
  const addMarks = ["ٰ", "ۛ", "ۖ", "ۗ", "ۘ", "ۙ", "ِ", "ً", "ٌ", "ُ", "ْ"];
  let out = "";
  for (const ch of text) {
    if (/[اأإآبتثجحخدذرزسشصضطظعغفقكلمنهوىي]/.test(ch)) {
      out += ch + (Math.random() > 0.5 ? addMarks[Math.floor(Math.random() * addMarks.length)] : "");
    } else out += ch;
  }
  return out;
}

// =======================
// زر "زخرف" → يولد النتائج
// =======================
generateBtn.addEventListener("click", () => {
  const name = quickName.value.trim();
  if (!name) return alert("يرجى كتابة الاسم أولاً!");
  quickResults.innerHTML = "";
  const decorations = generateDecorations(name, 50);
  decorations.forEach((decor) => {
    const div = document.createElement("div");
    div.className = "result-item";
    div.textContent = decor;
    addCopyOnLongPress(div, decor);
    quickResults.appendChild(div);
  });
});

// =======================
// وظيفة النسخ بالنقر أو الضغط المطول
// =======================
function addCopyOnLongPress(element, text) {
  let timer;
  element.addEventListener("mousedown", () => {
    timer = setTimeout(() => copyText(text), 500);
  });
  element.addEventListener("mouseup", () => clearTimeout(timer));
  element.addEventListener("touchstart", () => {
    timer = setTimeout(() => copyText(text), 500);
  });
  element.addEventListener("touchend", () => clearTimeout(timer));
  element.addEventListener("click", () => copyText(text));
}

function copyText(text) {
  navigator.clipboard.writeText(text);
  alert("تم نسخ الزخرفة!");
}

// =======================
// زخرف بنفسك — الموسوعة
// =======================
chooseTypeBtn.addEventListener("click", () => {
  lettersMenu.classList.toggle("hidden");
});

const letterSets = {
  "الحروف العربية": "ابتثجحخدذرزسشصضطظعغفقكلمنهوي".split(""),
  "الرموز": ["★", "☆", "✿", "❀", "♡", "❤", "❥", "💫", "✨", "♛", "♚", "⚜", "☪", "☯", "♩", "♪", "♫", "♬", "✪", "✯", "☾", "☽"],
  "حروف الوصل": ["ـ", "ۛ", "ۖ", "ۗ", "ۘ", "ۙ", "ۚ", "ۜ", "۫"],
  "تشكيل الأحرف": ["َ", "ً", "ُ", "ٌ", "ِ", "ٍ", "ْ", "ّ"],
  "الحروف الإنجليزية": "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz".split(""),
  "رموز ببجي": ["々", "ツ", "彡", "气", "メ", "×", "乂", "卍", "乡", "么", "丨", "爪", "丹", "丫", "尸", "乇", "山"],
};

// عند اختيار نوع الحروف
lettersMenu.querySelectorAll(".letters-type").forEach((btn) => {
  btn.addEventListener("click", () => {
    const type = btn.dataset.type;
    lettersMenu.classList.add("hidden");
    displayLetters(type);
  });
});

function displayLetters(type) {
  lettersArea.innerHTML = "";
  const chars = letterSets[type] || [];
  chars.forEach((ch) => {
    const span = document.createElement("span");
    span.className = "letter-box";
    span.textContent = ch;
    span.addEventListener("click", () => {
      customResult.textContent += ch;
    });
    lettersArea.appendChild(span);
  });
}

// مسح ونسخ للنص اليدوي
clearCustom.addEventListener("click", () => (customResult.textContent = ""));
copyCustom.addEventListener("click", () => {
  const text = customResult.textContent.trim();
  if (text) copyText(text);
});
