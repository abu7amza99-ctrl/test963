// عناصر الواجهة
const menuBtn = document.getElementById("menuBtn");
const sidePanel = document.getElementById("sidePanel");
const closePanel = document.getElementById("closePanel");

// أقسام الزخرفة
const quickBtn = document.getElementById("quickDecorationBtn");
const manualBtn = document.getElementById("manualDecorationBtn");
const quickDecor = document.getElementById("quickDecor");
const manualDecor = document.getElementById("manualDecor");

// الزخرفة السريعة
const generateBtn = document.getElementById("generateBtn");
const quickName = document.getElementById("quickName");
const quickResults = document.getElementById("quickResults");

// زخرف بنفسك
const chooseTypeBtn = document.getElementById("chooseType");
const lettersMenu = document.getElementById("lettersMenu");
const lettersArea = document.getElementById("lettersArea");
const customResult = document.getElementById("customResult");

// فتح وإغلاق اللوحة الجانبية
menuBtn.addEventListener("click", () => {
  sidePanel.classList.add("open");
});
closePanel.addEventListener("click", () => {
  sidePanel.classList.remove("open");
});

// التبديل بين الأقسام
quickBtn.addEventListener("click", () => {
  quickDecor.classList.remove("hidden");
  manualDecor.classList.add("hidden");
});
manualBtn.addEventListener("click", () => {
  manualDecor.classList.remove("hidden");
  quickDecor.classList.add("hidden");
});

// الزخرفة السريعة (توليد عشوائي بسيط)
generateBtn.addEventListener("click", () => {
  const name = quickName.value.trim();
  if (!name) {
    alert("يرجى كتابة الاسم أولاً!");
    return;
  }
  quickResults.innerHTML = "";
  const decorations = generateDecorations(name, 50);
  decorations.forEach((decor) => {
    const div = document.createElement("div");
    div.className = "result-item";
    div.textContent = decor;
    div.addEventListener("click", () => copyToClipboard(decor));
    quickResults.appendChild(div);
  });
});

// دالة توليد زخارف مستوحاة من خوارزميتنا
function generateDecorations(name, count) {
  const symbols = ["ٰ", "ۧ", "ـ", "ِ", "ْ", "ٍ", "ً", "ٌ", "ٖ", "ٛ", "✨", "💫", "🌸", "💎", "🎨", "❤️", "🌹"];
  let results = [];
  for (let i = 0; i < count; i++) {
    let decorated = "";
    for (let ch of name) {
      let sym = symbols[Math.floor(Math.random() * symbols.length)];
      decorated += ch + sym;
    }
    results.push(decorated);
  }
  return results;
}

// نسخ عند الضغط
function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert("تم نسخ الزخرفة!");
  });
}

// زخرف بنفسك - عرض القوائم
chooseTypeBtn.addEventListener("click", () => {
  lettersMenu.classList.toggle("hidden");
});

// أنواع الحروف
const letterSets = {
  "الحروف العربية": ["ا","ب","ت","ث","ج","ح","خ","د","ذ","ر","ز","س","ش","ص","ض","ط","ظ","ع","غ","ف","ق","ك","ل","م","ن","ه","و","ي"],
  "الرموز": ["★","☆","✿","❀","♡","❤","❥","💫","✨","♛","♚","⚜","☪"],
  "حروف الوصل": ["ـ","ۛ","ۖ","ۗ","ۘ","ۙ"],
  "تشكيل الأحرف": ["َ","ً","ُ","ٌ","ِ","ٍ","ْ","ّ"],
  "الحروف الإنجليزية": "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split(""),
  "رموز ببجي": ["々","ツ","彡","气","メ","×","乂","卍","乡","么"]
};

// اختيار نوع الحروف
lettersMenu.querySelectorAll("p").forEach((p) => {
  p.addEventListener("click", () => {
    const type = p.textContent;
    lettersArea.innerHTML = "";
    lettersMenu.classList.add("hidden");
    if (letterSets[type]) {
      letterSets[type].forEach((char) => {
        const span = document.createElement("span");
        span.className = "letter-box";
        span.textContent = char;
        span.addEventListener("click", () => {
          customResult.textContent += char;
        });
        lettersArea.appendChild(span);
      });
    }
  });
});

// نسخ النص المزخرف يدويًا
customResult.addEventListener("click", () => {
  const text = customResult.textContent.trim();
  if (text) copyToClipboard(text);
});
