/* ==========================================================
   professional-decoration.js — Final Stable Version
   إصلاح شامل + دمج كامل لكل الخصائص + تنظيف الكود
   ========================================================== */

"use strict";

/* ----------------------------------------------------------
   المتغيرات العامة
---------------------------------------------------------- */
const editorCanvas = document.getElementById("editorCanvas");
const btnAdd = document.getElementById("btnAdd");
const textInput = document.getElementById("textInput");
const fileImage = document.getElementById("fileImage");
const deleteSelected = document.getElementById("deleteSelected");
const downloadImage = document.getElementById("downloadImage");

let ELEMENTS = [];       // العناصر المضافة
let SELECTED = null;     // العنصر المحدد حالياً
let CURRENT_MODE = "text";
let FONTS_LOADED = false;
let AVAILABLE_FONTS = [];
let AVAILABLE_DRESS = [];
let DRESSES_LOADED = false;
let GRADIENTS = [];
let ACTIVE_POPUP = null;

/* ----------------------------------------------------------
   تحميل الخطوط و التدرجات و التلبيسات
---------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", async () => {
  initToolbar();
  await loadGradients();
  await loadDresses();
  await loadFonts();
  setupCanvasInteractions();
});

/* ----------------------------------------------------------
   تحميل الخطوط من Google أو محلياً
---------------------------------------------------------- */
async function loadFonts() {
  AVAILABLE_FONTS = [
    "Cairo",
    "Reem Kufi",
    "Amiri",
    "Tajawal",
    "Changa",
    "Mada",
    "Scheherazade New"
  ];
  const list = document.getElementById("fontList");
  list.innerHTML = "";
  AVAILABLE_FONTS.forEach(font => {
    const item = document.createElement("div");
    item.textContent = font;
    item.style.fontFamily = font;
    item.className = "font-item";
    item.addEventListener("click", () => {
      textInput.style.fontFamily = font;
      document.getElementById("fontList").classList.add("hidden");
    });
    list.appendChild(item);
  });
  FONTS_LOADED = true;
}

/* ----------------------------------------------------------
   تحميل تدرجات الألوان الاحترافية (50 تدرج)
---------------------------------------------------------- */
async function loadGradients() {
  const colors = [
    ["#ffd700", "#b8860b"],
    ["#f6d365", "#fda085"],
    ["#a1c4fd", "#c2e9fb"],
    ["#ffecd2", "#fcb69f"],
    ["#fcb045", "#fd1d1d"],
    ["#833ab4", "#fd1d1d", "#fcb045"],
    ["#8EC5FC", "#E0C3FC"],
    ["#f9d423", "#ff4e50"],
    ["#4facfe", "#00f2fe"],
    ["#43e97b", "#38f9d7"],
    ["#fa709a", "#fee140"],
    ["#30cfd0", "#330867"],
    ["#f12711", "#f5af19"],
    ["#8360c3", "#2ebf91"],
    ["#ff9966", "#ff5e62"],
    ["#56ab2f", "#a8e063"],
    ["#614385", "#516395"],
    ["#e65c00", "#f9d423"],
    ["#ff9a9e", "#fad0c4"],
    ["#a1ffce", "#faffd1"],
    ["#fbc2eb", "#a6c1ee"],
    ["#ffdde1", "#ee9ca7"],
    ["#89f7fe", "#66a6ff"],
    ["#d4fc79", "#96e6a1"],
    ["#02aab0", "#00cdac"],
    ["#84fab0", "#8fd3f4"],
    ["#fccb90", "#d57eeb"],
    ["#5ee7df", "#b490ca"],
    ["#9796f0", "#fbc7d4"],
    ["#f7971e", "#ffd200"],
    ["#ff758c", "#ff7eb3"],
    ["#fbd3e9", "#bb377d"],
    ["#1e3c72", "#2a5298"],
    ["#d9a7c7", "#fffcdc"],
    ["#43cea2", "#185a9d"],
    ["#ffb347", "#ffcc33"],
    ["#00c6ff", "#0072ff"],
    ["#3a6186", "#89253e"],
    ["#0f2027", "#203a43", "#2c5364"],
    ["#667eea", "#764ba2"],
    ["#ffafbd", "#ffc3a0"],
    ["#2193b0", "#6dd5ed"],
    ["#cc2b5e", "#753a88"],
    ["#42275a", "#734b6d"],
    ["#bdc3c7", "#2c3e50"],
    ["#de6161", "#2657eb"],
    ["#eecda3", "#ef629f"],
    ["#02aabd", "#00cdac"],
    ["#da4453", "#89216b"],
    ["#4ca1af", "#c4e0e5"]
  ];

  GRADIENTS = colors.map(c => `linear-gradient(90deg, ${c.join(",")})`);
}

/* ----------------------------------------------------------
   تحميل التلبيسات
---------------------------------------------------------- */
async function loadDresses() {
  AVAILABLE_DRESS = [];
  for (let i = 1; i <= 20; i++) {
    AVAILABLE_DRESS.push(`../assets/dressup/dress${i}.jpg`);
  }
  DRESSES_LOADED = true;
}

/* ----------------------------------------------------------
   التبديل بين وضعي النص والصورة
---------------------------------------------------------- */
function initToolbar() {
  const modeSelect = document.getElementById("modeSelect");
  const textControls = document.getElementById("textControls");
  const imageControls = document.getElementById("imageControls");

  modeSelect.addEventListener("change", e => {
    CURRENT_MODE = e.target.value;
    if (CURRENT_MODE === "text") {
      textControls.classList.remove("hidden");
      imageControls.classList.add("hidden");
    } else {
      imageControls.classList.remove("hidden");
      textControls.classList.add("hidden");
    }
  });

  btnAdd.addEventListener("click", handleAdd);
  deleteSelected.addEventListener("click", handleDeleteSelected);
  downloadImage.addEventListener("click", handleDownload);
}

/* ----------------------------------------------------------
   إنشاء عنصر جديد (نص أو صورة)
---------------------------------------------------------- */
function handleAdd() {
  if (CURRENT_MODE === "text") {
    const value = textInput.value.trim();
    if (!value) return alert("⚠️ الرجاء إدخال نص قبل الإضافة");
    const obj = createElementObject("text", value);
    const dom = renderElement(obj);
    editorCanvas.appendChild(dom);
    ELEMENTS.push(obj);
    selectElement(dom, obj);
  } else if (CURRENT_MODE === "image") {
    const file = fileImage.files[0];
    if (!file) return alert("⚠️ الرجاء اختيار صورة شفافة");
    const reader = new FileReader();
    reader.onload = () => {
      const obj = createElementObject("image", reader.result);
      const dom = renderElement(obj);
      editorCanvas.appendChild(dom);
      ELEMENTS.push(obj);
      selectElement(dom, obj);
    };
    reader.readAsDataURL(file);
  }
}

/* ----------------------------------------------------------
   إنشاء كائن العنصر
---------------------------------------------------------- */
function createElementObject(type, content) {
  return {
    id: "el-" + Date.now(),
    type,
    content,
    x: 50,
    y: 50,
    rotation: 0,
    scale: 1,
    font: textInput.style.fontFamily || "Cairo",
    fillMode: "solid",
    color: "#111",
    gradient: null,
    dressUrl: null
  };
}

/* ----------------------------------------------------------
   توليد العنصر داخل الـ DOM
---------------------------------------------------------- */
function renderElement(obj) {
  const wrap = document.createElement("div");
  wrap.className = "canvas-item";
  wrap.dataset.id = obj.id;
  wrap.style.left = obj.x + "px";
  wrap.style.top = obj.y + "px";
  wrap.style.transform = `rotate(${obj.rotation}deg) scale(${obj.scale})`;

  if (obj.type === "text") {
    const span = document.createElement("div");
    span.textContent = obj.content;
    span.className = "text-item";
    span.style.fontFamily = obj.font;
    applyStyleToDom(obj, span);
    wrap.appendChild(span);
  } else {
    const img = document.createElement("img");
    img.src = obj.content;
    img.alt = "صورة";
    img.className = "uploaded-image";
    wrap.classList.add("img-wrap");
    wrap.appendChild(img);
  }

  enableDragRotateScale(wrap, obj);
  wrap.addEventListener("click", e => {
    e.stopPropagation();
    selectElement(wrap, obj);
  });

  return wrap;
}

/* ----------------------------------------------------------
   تحديد العنصر المحدد
---------------------------------------------------------- */
function selectElement(dom, obj) {
  document.querySelectorAll(".canvas-item.selected").forEach(e => e.classList.remove("selected"));
  dom.classList.add("selected");
  SELECTED = { obj, dom };
}

/* ----------------------------------------------------------
   إلغاء التحديد عند الضغط خارج العناصر
---------------------------------------------------------- */
editorCanvas.addEventListener("click", e => {
  if (e.target === editorCanvas) {
    document.querySelectorAll(".canvas-item.selected").forEach(el => el.classList.remove("selected"));
    SELECTED = null;
  }
});

/* ----------------------------------------------------------
   تحريك وتدوير وتكبير العناصر
---------------------------------------------------------- */
function enableDragRotateScale(dom, obj) {
  let isDragging = false;
  let startX = 0, startY = 0;

  dom.addEventListener("mousedown", startDrag);
  dom.addEventListener("touchstart", startDrag);

  function startDrag(e) {
    isDragging = true;
    const point = getEventPoint(e);
    startX = point.x - obj.x;
    startY = point.y - obj.y;
    selectElement(dom, obj);
    window.addEventListener("mousemove", drag);
    window.addEventListener("mouseup", stopDrag);
    window.addEventListener("touchmove", drag);
    window.addEventListener("touchend", stopDrag);
  }

  function drag(e) {
    if (!isDragging) return;
    const point = getEventPoint(e);
    obj.x = point.x - startX;
    obj.y = point.y - startY;
    dom.style.left = obj.x + "px";
    dom.style.top = obj.y + "px";
  }

  function stopDrag() {
    isDragging = false;
    window.removeEventListener("mousemove", drag);
    window.removeEventListener("mouseup", stopDrag);
    window.removeEventListener("touchmove", drag);
    window.removeEventListener("touchend", stopDrag);
  }
}

/* ----------------------------------------------------------
   أداة المساعدة للحصول على إحداثيات اللمس أو الماوس
---------------------------------------------------------- */
function getEventPoint(e) {
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX, y: e.touches[0].clientY };
  } else {
    return { x: e.clientX, y: e.clientY };
  }
}

/* ----------------------------------------------------------
   تطبيق النمط المرئي (لون/تدرج/تلبيس)
---------------------------------------------------------- */
function applyStyleToDom(obj, dom) {
  dom.classList.remove("dressed");
  dom.style.background = "";
  dom.style.webkitTextFillColor = "";
  dom.style.color = obj.color;

  if (obj.fillMode === "solid") {
    dom.style.color = obj.color;
  } else if (obj.fillMode === "gradient" && obj.gradient) {
    dom.style.backgroundImage = obj.gradient;
    dom.classList.add("dressed");
  } else if (obj.fillMode === "dress" && obj.dressUrl) {
    dom.classList.add("dressed");
    dom.style.backgroundImage = `url(${obj.dressUrl})`;
  }
}

/* ----------------------------------------------------------
   حذف العنصر المحدد
---------------------------------------------------------- */
function handleDeleteSelected() {
  if (!SELECTED) return alert("⚠️ اختر عنصراً أولاً");
  const { obj, dom } = SELECTED;
  const idx = ELEMENTS.findIndex(e => e.id === obj.id);
  if (idx !== -1) ELEMENTS.splice(idx, 1);
  dom.remove();
  SELECTED = null;
}

/* ----------------------------------------------------------
   حفظ الصورة النهائية (تحميل)
---------------------------------------------------------- */
function handleDownload() {
  html2canvas(editorCanvas, {
    backgroundColor: "#ffffff",
    scale: 2
  }).then(canvas => {
    const link = document.createElement("a");
    link.download = "decoration.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
}

/* ----------------------------------------------------------
   فتح النوافذ المنبثقة (تدرجات - تلبيسات)
---------------------------------------------------------- */
function openPopup(type) {
  const popupContainer = document.getElementById("popupContainer");
  popupContainer.innerHTML = "";
  popupContainer.classList.add("open");
  popupContainer.setAttribute("aria-hidden", "false");

  const pop = document.createElement("div");
  pop.className = "popup";
  const head = document.createElement("div");
  head.className = "popup-head";
  head.innerHTML = `<h3>${type === "grad" ? "التدرجات" : "التلبيسات"}</h3><button onclick="closePopup()" class="btn small">إغلاق</button>`;
  pop.appendChild(head);

  const body = document.createElement("div");
  body.className = "popup-body";

  if (type === "grad") {
    const grid = document.createElement("div");
    grid.className = "grad-grid";
    GRADIENTS.forEach(g => {
      const s = document.createElement("div");
      s.className = "grad-sample";
      s.style.background = g;
      s.addEventListener("click", () => applyGradientToSelected(g));
      grid.appendChild(s);
    });
    body.appendChild(grid);
  } else if (type === "dress") {
    const grid = document.createElement("div");
    grid.className = "dress-grid";
    AVAILABLE_DRESS.forEach(url => {
      const d = document.createElement("div");
      d.className = "dress-item";
      const img = document.createElement("img");
      img.src = url;
      d.appendChild(img);
      d.addEventListener("click", () => applyDressToSelected(url));
      grid.appendChild(d);
    });
    body.appendChild(grid);
  }

  pop.appendChild(body);
  popupContainer.appendChild(pop);
}

/* ----------------------------------------------------------
   إغلاق النوافذ المنبثقة
---------------------------------------------------------- */
function closePopup() {
  const popupContainer = document.getElementById("popupContainer");
  popupContainer.classList.remove("open");
  popupContainer.innerHTML = "";
  popupContainer.setAttribute("aria-hidden", "true");
     }
     /* ==========================================================
   professional-decoration.js — Final Part (2/2)
   ========================================================== */

/* ----------------------------------------------------------
   تطبيق التدرج اللوني على العنصر المحدد
---------------------------------------------------------- */
function applyGradientToSelected(gradient) {
  if (!SELECTED) return alert("⚠️ اختر عنصراً أولاً");
  const { obj, dom } = SELECTED;
  obj.fillMode = "gradient";
  obj.gradient = gradient;
  obj.color = "#fff";
  applyStyleToDom(obj, dom);
  closePopup();
}

/* ----------------------------------------------------------
   تطبيق التلبيسة (Dress) على العنصر المحدد
---------------------------------------------------------- */
function applyDressToSelected(url) {
  if (!SELECTED) return alert("⚠️ اختر عنصراً أولاً");
  const { obj, dom } = SELECTED;
  obj.fillMode = "dress";
  obj.dressUrl = url;
  applyStyleToDom(obj, dom);
  closePopup();
}

/* ----------------------------------------------------------
   تفعيل تفاعلات الماوس على اللوحة
---------------------------------------------------------- */
function setupCanvasInteractions() {
  editorCanvas.addEventListener("wheel", e => {
    if (!SELECTED) return;
    const { obj, dom } = SELECTED;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.05 : -0.05;
    obj.scale = Math.min(Math.max(0.3, obj.scale + delta), 3);
    dom.style.transform = `rotate(${obj.rotation}deg) scale(${obj.scale})`;
  });

  let rotating = false;
  window.addEventListener("keydown", e => {
    if (!SELECTED) return;
    const { obj, dom } = SELECTED;
    if (e.key === "r") {
      rotating = true;
    } else if (e.key === "Delete") {
      handleDeleteSelected();
    } else if (e.key === "ArrowLeft") {
      obj.rotation -= 5;
    } else if (e.key === "ArrowRight") {
      obj.rotation += 5;
    }
    dom.style.transform = `rotate(${obj.rotation}deg) scale(${obj.scale})`;
  });

  window.addEventListener("keyup", e => {
    if (e.key === "r") rotating = false;
  });
}

/* ----------------------------------------------------------
   تصدير الحالة JSON (للتخزين أو المعاينة)
---------------------------------------------------------- */
function exportLayout() {
  const layout = {
    version: 1,
    elements: ELEMENTS
  };
  return JSON.stringify(layout, null, 2);
}

/* ----------------------------------------------------------
   استيراد الحالة JSON (لإعادة التحميل)
---------------------------------------------------------- */
function importLayout(json) {
  try {
    const data = JSON.parse(json);
    ELEMENTS = data.elements || [];
    editorCanvas.innerHTML = "";
    ELEMENTS.forEach(obj => {
      const dom = renderElement(obj);
      editorCanvas.appendChild(dom);
    });
  } catch (err) {
    alert("❌ فشل استيراد البيانات: " + err.message);
  }
}

/* ----------------------------------------------------------
   تحديث الطبقات وترتيب العناصر
---------------------------------------------------------- */
function bringForward() {
  if (!SELECTED) return;
  const { dom } = SELECTED;
  dom.style.zIndex = parseInt(dom.style.zIndex || 1) + 1;
}
function sendBackward() {
  if (!SELECTED) return;
  const { dom } = SELECTED;
  dom.style.zIndex = parseInt(dom.style.zIndex || 1) - 1;
}

/* ----------------------------------------------------------
   معاينة اللون أو التدرج في الواجهة
---------------------------------------------------------- */
document.getElementById("applyColor").addEventListener("click", () => {
  if (!SELECTED) return alert("⚠️ اختر عنصراً أولاً");
  const color = document.getElementById("colorPicker").value;
  const { obj, dom } = SELECTED;
  obj.fillMode = "solid";
  obj.color = color;
  applyStyleToDom(obj, dom);
});

document.getElementById("openGradients").addEventListener("click", () => {
  openPopup("grad");
});

document.getElementById("openDresses").addEventListener("click", () => {
  openPopup("dress");
});

/* ----------------------------------------------------------
   تحسين العرض والاستجابة على الشاشات الصغيرة
---------------------------------------------------------- */
window.addEventListener("resize", () => {
  const canvasRect = editorCanvas.getBoundingClientRect();
  ELEMENTS.forEach(({ obj, dom }) => {
    dom.style.left = Math.min(obj.x, canvasRect.width - 50) + "px";
    dom.style.top = Math.min(obj.y, canvasRect.height - 50) + "px";
  });
});

/* ----------------------------------------------------------
   طبقة التفاعل على كل عنصر لتدوير وتحريك أسهل باللمس
---------------------------------------------------------- */
function addTouchGestures(dom, obj) {
  let initialDistance = null;
  let initialScale = obj.scale;

  dom.addEventListener("touchmove", e => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      if (!initialDistance) {
        initialDistance = distance;
        initialScale = obj.scale;
      } else {
        const scaleChange = distance / initialDistance;
        obj.scale = Math.min(Math.max(0.3, initialScale * scaleChange), 3);
        dom.style.transform = `rotate(${obj.rotation}deg) scale(${obj.scale})`;
      }
    }
  });

  dom.addEventListener("touchend", () => {
    initialDistance = null;
  });
}

/* ----------------------------------------------------------
   تخصيص النصوص (تحكم مباشر)
---------------------------------------------------------- */
document.getElementById("fontSize").addEventListener("input", e => {
  if (!SELECTED) return;
  const { obj, dom } = SELECTED;
  const newSize = e.target.value + "px";
  dom.style.fontSize = newSize;
  obj.fontSize = newSize;
});

document.getElementById("boldToggle").addEventListener("click", () => {
  if (!SELECTED) return;
  const { obj, dom } = SELECTED;
  const current = dom.style.fontWeight;
  dom.style.fontWeight = current === "bold" ? "normal" : "bold";
  obj.bold = dom.style.fontWeight === "bold";
});

document.getElementById("italicToggle").addEventListener("click", () => {
  if (!SELECTED) return;
  const { obj, dom } = SELECTED;
  const current = dom.style.fontStyle;
  dom.style.fontStyle = current === "italic" ? "normal" : "italic";
  obj.italic = dom.style.fontStyle === "italic";
});

document.getElementById("underlineToggle").addEventListener("click", () => {
  if (!SELECTED) return;
  const { obj, dom } = SELECTED;
  const current = dom.style.textDecoration;
  dom.style.textDecoration = current === "underline" ? "none" : "underline";
  obj.underline = dom.style.textDecoration === "underline";
});

/* ----------------------------------------------------------
   تصفية/تنظيف ذاكرة اللوحة
---------------------------------------------------------- */
function clearCanvas() {
  if (!confirm("⚠️ هل أنت متأكد من حذف كل العناصر؟")) return;
  editorCanvas.innerHTML = "";
  ELEMENTS = [];
  SELECTED = null;
}

/* ----------------------------------------------------------
   معاينة فورية (preview mode)
---------------------------------------------------------- */
function togglePreview() {
  document.body.classList.toggle("preview-mode");
  const toolbar = document.getElementById("toolbar");
  toolbar.classList.toggle("hidden");
  editorCanvas.classList.toggle("locked");
}

/* ----------------------------------------------------------
   تخصيص الواجهة (الثيم)
---------------------------------------------------------- */
const themeToggle = document.getElementById("themeToggle");
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    document.body.classList.toggle("dark");
  });
}

/* ----------------------------------------------------------
   دعم الاختصارات السريعة
---------------------------------------------------------- */
window.addEventListener("keydown", e => {
  if (e.ctrlKey && e.key === "s") {
    e.preventDefault();
    const data = exportLayout();
    const blob = new Blob([data], { type: "application/json" });
    const link = document.createElement("a");
    link.download = "layout.json";
    link.href = URL.createObjectURL(blob);
    link.click();
  }
  if (e.ctrlKey && e.key === "o") {
    e.preventDefault();
    document.getElementById("fileImport").click();
  }
});

document.getElementById("fileImport")?.addEventListener("change", e => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => importLayout(reader.result);
  reader.readAsText(file);
});

/* ----------------------------------------------------------
   حفظ تلقائي (Auto Save)
---------------------------------------------------------- */
setInterval(() => {
  if (ELEMENTS.length > 0) {
    localStorage.setItem("autoSaveLayout", exportLayout());
  }
}, 8000);

/* ----------------------------------------------------------
   تحميل الحفظ التلقائي عند الفتح
---------------------------------------------------------- */
window.addEventListener("load", () => {
  const saved = localStorage.getItem("autoSaveLayout");
  if (saved) importLayout(saved);
});

/* ----------------------------------------------------------
   النهاية — ملف متكامل ونهائي
---------------------------------------------------------- */
console.log("✅ professional-decoration.js — Loaded Successfully");
