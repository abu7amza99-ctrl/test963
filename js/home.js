/* home.js - نسخة محسّنة
   يدعم أسماء ملفات تحتوي على شرطات أو مسافات أو رموز عربية
   يقرأ من ../assets/home/images.json
   عرض شبكي 4x / 2x، بحث جزئي، lightbox مع زر تحميل
*/

const sidebarBtn = document.querySelector('.sidebar-btn');
const sidebar = document.querySelector('.sidebar');
const sidebarClose = document.querySelector('.sidebar-close');

const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.querySelector('.lightbox-close');
const downloadBtn = document.getElementById('downloadBtn');

let IMAGES = []; // سيملأ من JSON

// toggle sidebar
if (sidebarBtn && sidebar) {
  sidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    sidebar.setAttribute('aria-hidden', sidebar.classList.contains('open') ? 'false' : 'true');
  });
}
if (sidebarClose) {
  sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebar.setAttribute('aria-hidden','true');
  });
}

// جلب JSON من assets/home/images.json
async function fetchImagesJson() {
  const url = '../assets/home/images.json'; // كما طلبت
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const j = await res.json();
    if (Array.isArray(j)) {
      return j.map(it => typeof it === 'string' ? { name: it, file: it } : it);
    }
    if (j && Array.isArray(j.images)) {
      return j.images.map(it => typeof it === 'string' ? { name: it, file: it } : it);
    }
    return [];
  } catch (err) {
    console.error('fetch images.json failed', err);
    throw err;
  }
}

// إنشاء عنصر بطاقة صورة
function createImageCard(imgObj) {
  const encodedFile = encodeURIComponent(imgObj.file);
  const imgPath = `../assets/home/${encodedFile}`;

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
if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});
document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeLightbox(); });

// تحميل إجباري
function forceDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = decodeURIComponent(filename || url.split('/').pop());
  document.body.appendChild(a);
  a.click();
  a.remove();
}
if (downloadBtn) {
  downloadBtn.addEventListener('click', function(e){
    e.preventDefault();
    const href = this.href;
    const fname = this.getAttribute('download') || href.split('/').pop();
    forceDownload(href, fname);
  });
}

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

// التهيئة
(async function init(){
  try {
    IMAGES = await fetchImagesJson();
    renderGallery(IMAGES);
  } catch (err) {
    gallery.innerHTML = '<p style="padding:12px;background:#fff;color:#000;border-radius:8px">فشل تحميل قائمة الصور. تأكد من وجود الملف: assets/home/images.json</p>';
  }
})();
