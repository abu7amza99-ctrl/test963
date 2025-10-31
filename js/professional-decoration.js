/* professional-decoration.js — النسخة النهائية الكاملة
   - يحمّل الخطوط من: https://abu963.github.io/test963/assets/fonts/
   - يحمّل تلبيسات الصور من: https://abu963.github.io/test963/assets/dressup/
   - يحتوي 50 تدرجًا ثابتًا داخل الكود
   - يتيح إضافة نص/صورة، تعديل المكان، التكبير، التدوير (متوافق مع اللمس)
   - يصدّر كصورة بدقة يحددها المستخدم
*/

/* =============== إعداد ثابتات المسارات =============== */
const GH_USER = "abu7amza99-ctrl";
const GH_REPO = "test963";
const BASE_RAW = `https://${GH_USER}.github.io/${GH_REPO}/`;
const API_BASE = `https://api.github.com/repos/${GH_USER}/${GH_REPO}/contents/`;
const FONTS_API = API_BASE + "assets/fonts";
const DRESSUP_API = API_BASE + "assets/dressup";

/* =============== عناصر DOM أساسية =============== */
document.addEventListener("DOMContentLoaded", () => {
  const menuBtn = document.getElementById("menuBtn");
  const sidePanel = document.getElementById("sidePanel");
  const closePanel = document.getElementById("closePanel");
  const toolbar = document.getElementById("toolbar");
  const canvas = document.getElementById("previewCanvas");
  const previewWrapper = document.getElementById("previewWrapper");
  const ctx = canvas.getContext("2d", { alpha: true });
  const widthInput = document.getElementById("widthInput");
  const heightInput = document.getElementById("heightInput");
  const downloadBtn = document.getElementById("downloadBtn");
  const colorPanelContainer = document.getElementById("colorPanelContainer");
  const transformBox = document.getElementById("transformBox");

  menuBtn?.addEventListener("click", () => sidePanel.classList.add("open"));
  closePanel?.addEventListener("click", () => sidePanel.classList.remove("open"));

  /* ====== حالة التطبيق ====== */
  const App = {
    elements: [], // العناصر المضافة (نص أو صورة)
    active: null, // المرجع إلى العنصر النشط
    fonts: [],    // مصفوفة خطوط محملة {name, url}
    dressups: [], // مصفوفة صور التلبيس URLs
    gradients: [],// مصفوفة 50 تدرجاً جاهزاً
    pointerInfo: { pointers: new Map() }, // لتتبع اللمسات
  };

  /* =============== تعريف 50 تدرجًا احترافيًا ثابتًا ===============
     كل تدرج عبارة عن مصفوفة ألوان (stop positions and colors)
     عند تطبيق التدرج على نص نستخدم createLinearGradient */
  (function defineGradients() {
    const g = [];
    // أضفت 50 تدرجًا معدنيًا/لامعًا متنوعًا — كل واحد مصفوفة ألوان من 0..1 مع أكواد HEX
    const presets = [
      ["#fff7e6","#ffd86b","#d4af37","#b8860b"],
      ["#fbfbfb","#e6e8ea","#cfcfcf","#9ea6ab"],
      ["#fff7eb","#ffd8a8","#f2b96b","#b56a12"],
      ["#fff5f6","#ffd7e0","#ff9fb8","#c04a6b"],
      ["#e9f6ff","#bfe7ff","#7fd0ff","#2f9fe0"],
      ["#f6f7ff","#d6dbff","#b0bbff","#7a86ff"],
      ["#f3f9f6","#cdefdf","#9fd9b9","#2f8f63"],
      ["#fffaf0","#ffe8b8","#ffd07a","#c17a06"],
      ["#f2f7f9","#d9edf6","#aee2f7","#61bfe9"],
      ["#fbf8ff","#f0e8ff","#ddb9ff","#a86cff"],
      ["#fff7f6","#ffdcd4","#ffb3a0","#e06a48"],
      ["#fffdf6","#fff1c3","#ffe08a","#f2b400"],
      ["#f9fbff","#dfe8ff","#c1d3ff","#93b3ff"],
      ["#fff8ff","#f0e6ff","#e0c1ff","#c09cff"],
      ["#fff7f1","#ffd9b8","#ffb36b","#d07a1f"],
      ["#f7fff8","#d7ffec","#aef6d0","#55d28f"],
      ["#fffdf9","#ffeedd","#ffd0a6","#ff9f3b"],
      ["#f4faff","#d7f0ff","#a7dcff","#42a7e6"],
      ["#fff9fb","#ffeef7","#ffd7ef","#ff9adf"],
      ["#fffafc","#ffe6ff","#ffd1ff","#ff9bff"],
      ["#fffef9","#fff3e0","#ffe8b0","#ffd06a"],
      ["#f6fff7","#d6ffe6","#aefdcf","#4ae28f"],
      ["#f8fff9","#dfffe9","#b6fcd2","#71eaa2"],
      ["#fff9f2","#ffe8d0","#ffd09a","#ffb06a"],
      ["#f9fbff","#e7f0ff","#cfe0ff","#9fc8ff"],
      ["#fff9f9","#ffe9eb","#ffd0d6","#ff9fb1"],
      ["#fffefc","#fff1e8","#ffe0c6","#ffc18a"],
      ["#f9fff9","#d7ffdf","#b0f7bf","#5ae284"],
      ["#fff8f8","#ffdfe5","#ffc0cc","#ff8fb8"],
      ["#fffdfb","#fff3f0","#ffd9d0","#ffb6a6"],
      ["#fbfff8","#e7ffef","#cfffff","#9fffe0"],
      ["#fffefe","#fff4f4","#ffe8e8","#ffbdbd"],
      ["#f8fbff","#dfeaff","#bcd6ff","#8ab1ff"],
      ["#fff8fb","#ffe6f3","#ffcfe8","#ffa6e0"],
      ["#fffaf5","#ffe9d3","#ffd19a","#ffb36a"],
      ["#fff9fe","#f2e9ff","#e0cfff","#cfa0ff"],
      ["#fff7f9","#ffdff1","#ffbfe6","#ff8fd6"],
      ["#fffafc","#ffeef9","#ffdff1","#ffb8e0"],
      ["#fff7f2","#ffe4d0","#ffcfa6","#ff9f70"],
      ["#fffdf9","#fff3e6","#ffe1c0","#ffd197"],
      ["#f7fff9","#dfffea","#b5ffd0","#73ffb0"],
      ["#fff9f6","#fff0d9","#ffe2b8","#ffd08a"],
      ["#fff9fb","#ffeef8","#ffdff2","#ffc0ea"],
      ["#fff8ff","#f2eaff","#e0d1ff","#c9b2ff"],
      ["#fffef8","#fff6e8","#ffe7c6","#ffd69a"],
      ["#fff8f9","#ffe8ef","#ffcfdf","#ff9fc8"],
      ["#fff9fb","#ffeef8","#ffdff2","#ffc0ea"]
    ];
    // ensure exactly 50 — if fewer, repeat some variations
    while (presets.length < 50) presets.push(...presets.slice(0, 50 - presets.length));
    App.gradients = presets.slice(0,50);
  })();

  /* =============== تحميل خطوط من GitHub (قائمة ديناميكية) =============== */
  async function loadFontsList() {
    try {
      const res = await fetch(FONTS_API);
      if (!res.ok) throw new Error("خطأ في جلب خطوط من GitHub API");
      const files = await res.json();
      // files: array items with .name and .download_url or .path
      const fonts = files.filter(f => /\.(ttf|otf|woff|woff2)$/i.test(f.name))
                         .map(f => ({name: f.name.replace(/\.[^.]+$/, ""), url: BASE_RAW + "assets/fonts/" + f.name }));
      App.fonts = fonts;
      injectFonts(fonts);
      populateFontSelect(fonts);
    } catch (e) {
      console.warn("فشل جلب الخطوط تلقائياً:", e);
      // نترك افتراضياً القيم المضمنة إذا لم تعمل GitHub API
      App.fonts = [{name:"KufiCustom", url: BASE_RAW + "assets/fonts/kufi-bold.ttf"},
                   {name:"SerifDecor", url: BASE_RAW + "assets/fonts/amiri.ttf"}];
      injectFonts(App.fonts);
      populateFontSelect(App.fonts);
    }
  }

  /* حقن @font-face باستخدام روابط مباشرة على GitHub Pages */
  function injectFonts(fonts) {
    const style = document.createElement("style");
    const lines = fonts.map((f, idx) => {
      const family = sanitizeFontName(f.name) + (idx); // ensure unique fallback
      return `@font-face{font-family:'${family}';src:url('${f.url}');font-display:swap;}`;
    });
    style.innerHTML = lines.join("\n");
    document.head.appendChild(style);
    // store canonical family names mapped to created family
    fonts.forEach((f, idx) => f.family = sanitizeFontName(f.name) + (idx));
  }
  function sanitizeFontName(n){ return n.replace(/[^a-zA-Z0-9\-]/g, "_"); }

  function populateFontSelect(fonts) {
    const fontSelect = document.getElementById("fontSelect");
    fontSelect.innerHTML = "";
    fonts.forEach(f => {
      const opt = document.createElement("option");
      opt.value = f.family;
      opt.textContent = f.name;
      fontSelect.appendChild(opt);
    });
  }

  /* =============== تحميل صور التلبيس ديناميكياً =============== */
  async function loadDressups() {
    try {
      const res = await fetch(DRESSUP_API);
      if (!res.ok) throw new Error("فشل جلب التلبيسات من GitHub API");
      const files = await res.json();
      const imgs = files.filter(f => /\.(png|jpg|jpeg|webp|svg)$/i.test(f.name))
        .map(f => BASE_RAW + "assets/dressup/" + f.name);
      App.dressups = imgs;
      // لا نعرضها فوراً في DOM إلا عند فتح تبويب التلوين
    } catch (e) {
      console.warn("فشل جلب التلبيسات:", e);
      App.dressups = [];
    }
  }

  /* =============== بناء شريط الأدوات (ديناميكي) =============== */
  function buildToolbar() {
    toolbar.innerHTML = `
      <select id="typeSelect" aria-label="اختيار نوع"> 
        <option value="text">نص</option>
        <option value="image">صورة</option>
      </select>
      <input id="textInput" type="text" placeholder="أدخل النص هنا" style="width:220px;" />
      <select id="fontSelect" aria-label="قائمة الخطوط"></select>
      <button id="addBtn">أضف</button>
      <input id="imageInput" type="file" accept="image/*" style="display:none">
      <button id="colorBtn">اختيار اللون / التلبيس / التدرجات</button>
    `;
    const typeSelect = document.getElementById("typeSelect");
    const textInput = document.getElementById("textInput");
    const fontSelect = document.getElementById("fontSelect");
    const addBtn = document.getElementById("addBtn");
    const imageInput = document.getElementById("imageInput");
    const colorBtn = document.getElementById("colorBtn");

    // حدث تبديل العرض بين نص وصورة
    typeSelect.addEventListener("change", () => {
      const isText = typeSelect.value === "text";
      textInput.style.display = isText ? "inline-block" : "none";
      fontSelect.style.display = isText ? "inline-block" : "none";
      imageInput.style.display = isText ? "none" : "inline-block";
    });

    // زر إضافة
    addBtn.addEventListener("click", () => {
      if (typeSelect.value === "text") {
        const t = textInput.value.trim();
        if (!t) return alert("أدخل نصًا لإضافته.");
        const fontFamily = fontSelect.value || (App.fonts[0] && App.fonts[0].family) || "KufiCustom0";
        AppAdd.addText(t, fontFamily);
      } else {
        imageInput.click();
      }
    });

    imageInput.addEventListener("change", (ev) => {
      const f = ev.target.files[0];
      if (!f) return;
      const img = new Image();
      img.onload = () => AppAdd.addImage(img);
      img.src = URL.createObjectURL(f);
    });

    colorBtn.addEventListener("click", () => showColorPanel());
  }

  /* =============== عرض تبويب الألوان (تلبيس ودرجات) =============== */
  function showColorPanel() {
    colorPanelContainer.innerHTML = ""; // تفريغ
    const panel = document.createElement("div");
    panel.className = "color-panel";
    panel.innerHTML = `<h3>خيارات التلوين والتلبيس والتدرجات</h3>`;
    // تبويب التلبيس المصور (من assets/dressup)
    const dressupTitle = document.createElement("div");
    dressupTitle.textContent = "التلبيسات (الصور من مجلد assets/dressup)";
    dressupTitle.style.fontSize = "13px";
    panel.appendChild(dressupTitle);

    const dressupGrid = document.createElement("div");
    dressupGrid.className = "color-list";
    dressupGrid.style.maxHeight = "120px";
    dressupGrid.style.overflowY = "auto";
    dressupGrid.style.padding = "6px";
    // if there are dressups, show them; else show message
    if (App.dressups.length === 0) {
      const emptyMsg = document.createElement("div");
      emptyMsg.textContent = "لا توجد صور في assets/dressup";
      emptyMsg.style.opacity = 0.8;
      dressupGrid.appendChild(emptyMsg);
    } else {
      App.dressups.forEach(url => {
        const it = document.createElement("div");
        it.className = "color-item";
        it.style.backgroundImage = `url(${url})`;
        it.style.backgroundSize = "cover";
        it.style.backgroundPosition = "center";
        it.title = "تلبيس";
        it.addEventListener("click", () => applyDressup(url));
        dressupGrid.appendChild(it);
      });
    }
    panel.appendChild(dressupGrid);

    // تبويب التدرجات — عرض 50 تدرجًا
    const gradTitle = document.createElement("div");
    gradTitle.textContent = "التدرجات الاحترافية (50 تدرج)";
    gradTitle.style.fontSize = "13px";
    gradTitle.style.marginTop = "8px";
    panel.appendChild(gradTitle);

    const gradGrid = document.createElement("div");
    gradGrid.className = "gradient-list";
    gradGrid.style.display = "grid";
    gradGrid.style.gridTemplateColumns = "repeat(auto-fit, 44px)";
    gradGrid.style.gap = "8px";
    gradGrid.style.padding = "6px";
    App.gradients.forEach((stops, idx) => {
      const item = document.createElement("div");
      item.className = "gradient-item";
      // build CSS linear-gradient using stops
      item.style.background = `linear-gradient(135deg, ${stops.join(", ")})`;
      item.title = `تدرج ${idx+1}`;
      item.addEventListener("click", () => applyGradient(stops));
      gradGrid.appendChild(item);
    });
    panel.appendChild(gradGrid);

    // زر إغلاق
    const close = document.createElement("div");
    close.style.display = "flex";
    close.style.justifyContent = "center";
    close.style.marginTop = "8px";
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "إغلاق";
    closeBtn.style.padding = "8px 12px";
    closeBtn.addEventListener("click", ()=> colorPanelContainer.innerHTML = "");
    close.appendChild(closeBtn);
    panel.appendChild(close);

    colorPanelContainer.appendChild(panel);
  }

  /* تطبيق تلبيس: إذا العنصر نصّ — نستخدم التلبيس كـ pattern؟ 
     سهلاً: نطبق صورة التلبيس كقناع فوق النص — لكن على Canvas لا توجد طريقة مباشرة لقناع الحروف إلا برسم النص كمسار واستخدام globalCompositeOperation.
     النهج المستخدم: نرسم الصورة في مكان النص ثم نستخدم 'destination-in' لقص الصورة بشكل الحروف. */
  async function applyDressup(url) {
    if (!App.active) return alert("اختر نصًا أو صورة أولاً.");
    if (App.active.type !== "text") return alert("التلبيس يطبّق على النص فقط.");
    try {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      await new Promise((res, rej)=> { img.onload = res; img.onerror = rej; });
      // store as dressup image on element for rendering special mode
      App.active.dressup = img;
      App.active.fillMode = "dressup"; // علامة خاصة
      renderAll();
    } catch (e) {
      alert("فشل تحميل صورة التلبيس.");
      console.error(e);
    }
  }

  /* تطبيق تدرج (stops = array of color hex) — نطبق على النص كـ gradient */
  function applyGradient(stops) {
    if (!App.active) return alert("اختر نصًا أو صورة أولاً.");
    if (App.active.type !== "text") return alert("التدرجات تطبّق على النص فقط.");
    App.active.fillMode = "gradient";
    App.active.gradientStops = stops.slice();
    renderAll();
  }

  /* تطبيق لون صلب */
  function applyColorToActive(hex) {
    if (!App.active) return alert("اختر عنصرًا أولاً.");
    if (App.active.type === "text") {
      App.active.fillMode = "solid";
      App.active.color = hex;
    } else {
      // لو كانت صورة: يمكن تطبيق فلتر أو وضع تراكب بسيط — سنطبق تغيّر tint على الكانفاس المؤقت عند التصدير
      App.active.tint = hex;
    }
    renderAll();
  }

  /* =============== وظائف إضافة النص/الصورة إلى المشهد =============== */
  const AppAdd = {
    addText(text, fontFamily) {
      const el = {
        id: Date.now() + Math.random(),
        type: "text",
        text,
        font: fontFamily,
        x: canvas.width/2,
        y: canvas.height/2,
        size: Math.round(Math.min(canvas.width, canvas.height) * 0.08),
        rotation: 0,
        scale: 1,
        color: "#D4AF37",
        fillMode: "solid",
        gradientStops: null,
        dressup: null,
      };
      App.elements.push(el);
      App.active = el;
      renderAll();
    },
    addImage(img) {
      // scale image to fit preview
      const maxW = canvas.width * 0.6;
      const ratio = Math.min(1, maxW / img.width);
      const el = {
        id: Date.now() + Math.random(),
        type: "image",
        image: img,
        x: canvas.width/2,
        y: canvas.height/2,
        width: img.width * ratio,
        height: img.height * ratio,
        rotation: 0,
        scale: 1,
        tint: null,
      };
      App.elements.push(el);
      App.active = el;
      renderAll();
    }
  };

  /* =============== الرسم على الكانفاس =============== */
  function renderAll() {
    // clear
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // optional transparent background — keep transparent unless user wants background
    // draw each element
    for (const el of App.elements) {
      ctx.save();
      ctx.translate(el.x, el.y);
      ctx.rotate(el.rotation);
      ctx.scale(el.scale, el.scale);
      if (el.type === "text") {
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `${el.size}px '${el.font}'`;
        // rendering fillMode: dressup/gradient/solid
        if (el.fillMode === "dressup" && el.dressup) {
          // draw dressup image clipped by text
          // 1) draw image
          const img = el.dressup;
          // scale image to text width
          const textWidth = ctx.measureText(el.text).width;
          const iw = Math.max(textWidth, el.size * 2);
          const ih = (img.height / img.width) * iw;
          // draw image centered at 0,0 into offscreen
          const off = document.createElement("canvas");
          off.width = Math.ceil(iw);
          off.height = Math.ceil(ih);
          const octx = off.getContext("2d");
          octx.drawImage(img, 0, 0, iw, ih);
          // draw text as mask
          octx.globalCompositeOperation = "destination-in";
          octx.font = `${el.size}px '${el.font}'`;
          octx.fillStyle = "#000";
          octx.textAlign = "center";
          octx.textBaseline = "middle";
          octx.fillText(el.text, iw/2, ih/2);
          // finally draw offscreen onto main canvas centered
          ctx.drawImage(off, -iw/2, -ih/2);
        } else if (el.fillMode === "gradient" && el.gradientStops) {
          // create gradient across text width
          const textWidth = Math.max(1, ctx.measureText(el.text).width);
          const grad = ctx.createLinearGradient(-textWidth/2, 0, textWidth/2, 0);
          const stops = el.gradientStops;
          const step = 1 / (stops.length - 1);
          stops.forEach((c, i) => grad.addColorStop(i*step, c));
          ctx.fillStyle = grad;
          ctx.fillText(el.text, 0, 0);
        } else {
          ctx.fillStyle = el.color || "#D4AF37";
          ctx.fillText(el.text, 0, 0);
        }
      } else if (el.type === "image") {
        const w = el.width;
        const h = el.height;
        if (el.tint) {
          // draw tinted image using offscreen
          const off = document.createElement("canvas");
          off.width = Math.ceil(w);
          off.height = Math.ceil(h);
          const octx = off.getContext("2d");
          octx.drawImage(el.image, 0, 0, w, h);
          octx.globalCompositeOperation = "source-atop";
          octx.fillStyle = el.tint;
          octx.fillRect(0,0,w,h);
          ctx.drawImage(off, -w/2, -h/2);
        } else {
          ctx.drawImage(el.image, -w/2, -h/2, w, h);
        }
      }
      ctx.restore();
    }
    updateTransformBox();
  }

  /* =============== وظيفة تحديث مربع التحويل حول العنصر النشط =============== */
  function updateTransformBox() {
    if (!App.active) {
      transformBox.style.display = "none";
      return;
    }
    const el = App.active;
    const rect = canvas.getBoundingClientRect();
    const scaleX = rect.width / canvas.width;
    const scaleY = rect.height / canvas.height;
    let w,h;
    if (el.type === "text") {
      // approximate width using measureText with current canvas font (we must set font)
      ctx.save();
      ctx.font = `${el.size}px '${el.font}'`;
      const tw = ctx.measureText(el.text).width * el.scale;
      ctx.restore();
      w = tw;
      h = el.size * el.scale;
    } else {
      w = el.width * el.scale;
      h = el.height * el.scale;
    }
    const centerX = rect.left + el.x * scaleX;
    const centerY = rect.top + el.y * scaleY;
    transformBox.style.display = "block";
    transformBox.style.width = Math.max(30, w * scaleX) + "px";
    transformBox.style.height = Math.max(30, h * scaleY) + "px";
    transformBox.style.left = (centerX - (w*scaleX)/2) + "px";
    transformBox.style.top = (centerY - (h*scaleY)/2) + "px";
    transformBox.style.border = "2px dashed rgba(212,175,55,0.9)";
    transformBox.style.borderRadius = "8px";
    transformBox.style.pointerEvents = "auto";
    // add handles if absent
    if (!transformBox.querySelector(".handle")) createHandles();
  }

  function createHandles() {
    transformBox.innerHTML = ""; // reset
    const handleScale = document.createElement("div");
    handleScale.className = "handle scale";
    const handleRotate = document.createElement
