/* home.js - قراءة من ../assets/home/images.json
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
    // نتوقع مصفوفة كائنات {name,file} أو مصفوفة أسماء
    if (Array.isArray(j)) {
      // normalize: إذا عناصرها سترينغ نحولها لكائنات
      return j.map(it => typeof it === 'string' ? { name: it, file: it } : it);
    }
    // لو جلبنا كائن بداخل images: [...]
    if (j && Array.isArray(j.images)) {
      return j.images.map(it => typeof it === 'string' ? { name: it, file: it } : it);
    }
    return [];
  } catch (err) {
    console.error('fetch images.json failed', err);
    throw err;
  }
}

// إنشاء عنصر بطاقة صورة (بدون أسماء ظاهرة)
function createImageCard(imgObj) {
  const a = document.createElement('a');
  a.href = `../assets/home/${imgObj.file}`;
  a.className = 'gallery-item';
  a.setAttribute('data-name', imgObj.name || '');

  const image = document.createElement('img');
  image.src = `../assets/home/${imgObj.file}`;
  image.alt = imgObj.name || '';
  a.appendChild(image);

  // prevent default navigation and open lightbox
  a.addEventListener('click', (e) => {
    e.preventDefault();
    openLightbox(image.src, imgObj.file, imgObj.name);
  });

  return a;
}

// render gallery
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

// open lightbox
function openLightbox(src, filename, name) {
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
  lightboxImage.src = src;
  lightboxImage.alt = name || filename || '';
  downloadBtn.href = src;
  downloadBtn.download = filename || src.split('/').pop();
  // focus download for keyboard users
  downloadBtn.focus();
}

// close
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

// force download fallback
function forceDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || url.split('/').pop();
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

// search
if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const q = (e.target.value || '').trim().toLowerCase();
    if (!q) {
      renderGallery(IMAGES);
      return;
    }
    const filtered = IMAGES.filter(i => (i.name || '').toLowerCase().includes(q));
    renderGallery(filtered);
  });
}

// init
(async function init(){
  try {
    IMAGES = await fetchImagesJson();
    renderGallery(IMAGES);
  } catch (err) {
    gallery.innerHTML = '<p style="padding:12px;background:#fff;color:#000;border-radius:8px">فشل تحميل قائمة الصور. تأكد من وجود الملف: assets/home/images.json</p>';
  }
})();
