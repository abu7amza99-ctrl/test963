/* home.js - معدل لتوحيد مظهر الشريط العلوي واللوحة الجانبية
   ✅ تمت إضافة نظام فتح/غلق اللوحة الجانبية من قسم "زخرفة الأسماء"
   ✅ باقي الأكواد الأصلية للمعرض والبحث والـ Lightbox كما هي تماماً
*/

/* ============================
   فتح/غلق اللوحة الجانبية (مطابق لقسم زخرفة الأسماء)
   ============================ */
const menuBtn = document.getElementById("menuBtn");
const sidePanel = document.getElementById("sidePanel");
const closePanel = document.getElementById("closePanel");

if (menuBtn) menuBtn.addEventListener("click", () => sidePanel.classList.add("open"));
if (closePanel) closePanel.addEventListener("click", () => sidePanel.classList.remove("open"));

/* ============================
   باقي كود الصفحة الأصلي كما هو
   ============================ */

const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.querySelector('.lightbox-close');
const downloadBtn = document.getElementById('downloadBtn');

let IMAGES = [];

// تحميل JSON من مجلد الصور
async function fetchImagesJson() {
  const url = '../assets/images.json';
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();

    let data = [];
    if (Array.isArray(j)) {
      data = j.map(it => typeof it === 'string' ? { name: it, file: it } : it);
    } else if (j && Array.isArray(j.images)) {
      data = j.images.map(it => typeof it === 'string' ? { name: it, file: it } : it);
    }

    console.log(`✅ تم تحميل images.json (${data.length} صورة)`);
    return data;
  } catch (err) {
    console.error('❌ فشل تحميل images.json', err);
    return [];
  }
}

// إنشاء عنصر بطاقة صورة
function createImageCard(imgObj) {
  const safeFile = encodeURIComponent(imgObj.file).replace(/%25/g, '%');
  const imgPath = `../assets/home/${safeFile}`;

  const a = document.createElement('a');
  a.href = imgPath;
  a.className = 'gallery-item';
  a.setAttribute('data-name', imgObj.name || '');

  const image = document.createElement('img');
  image.src = imgPath;
  image.alt = imgObj.name || '';
  a.appendChild(image);

  a.addEventListener('click', (e) => {
    e.preventDefault();
    openLightbox(imgPath, imgObj.file, imgObj.name);
  });

  return a;
}

// عرض الشبكة
function renderGallery(arr) {
  gallery.innerHTML = '';
  if (!Array.isArray(arr) || arr.length === 0) {
    const p = document.createElement('p');
    p.textContent = 'لا توجد صور للعرض';
    p.style.color = '#000';
    p.style.background = '#fff';
    p.style.padding = '10px';
    p.style.borderRadius = '8px';
    gallery.appendChild(p);
    return;
  }
  const frag = document.createDocumentFragment();
  arr.forEach(img => {
    const card = createImageCard(img);
    frag.appendChild(card);
  });
  gallery.appendChild(frag);
}

// فتح Lightbox
function openLightbox(src, filename, name) {
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
  lightboxImage.src = src;
  lightboxImage.alt = name || filename || '';
  downloadBtn.href = src;
  downloadBtn.download = decodeURIComponent(filename || src.split('/').pop());
  downloadBtn.focus();
}

// إغلاق Lightbox
function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden','true');
  lightboxImage.src = '';
}
if (lightboxClose) {
  lightboxClose.addEventListener('click', closeLightbox);
}
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeLightbox();
});

// تحميل الصور عند بدء الصفحة
(async function init(){
  try {
    IMAGES = await fetchImagesJson();
    renderGallery(IMAGES);
  } catch (err) {
    gallery.innerHTML = '<p style="padding:12px;background:#fff;color:#000;border-radius:8px">فشل تحميل قائمة الصور. تأكد من وجود الملف: assets/images.json</p>';
  }
})();

// البحث الذكي
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const q = (e.target.value || '').trim().toLowerCase();
    if (!q) {
      renderGallery(IMAGES);
      return;
    }
    const normalizedQuery = q.replace(/[\s_-]+/g, '');
    const filtered = IMAGES.filter(i => {
      const normalizedName = (i.name || '').toLowerCase().replace(/[\s_-]+/g, '');
      return normalizedName.includes(normalizedQuery);
    });
    renderGallery(filtered);
  });
}
