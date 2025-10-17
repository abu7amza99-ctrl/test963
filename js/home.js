/* home.js
   - يقرأ images.json من جذر المشروع ../images.json (من داخل /sections/home.html)
   - يعرض شبكة صور 4x على الكمبيوتر و2x على الجوال
   - يبحث جزئياً في اسم الصورة
   - يفتح lightbox مدمج بدون مكتبات خارجية
   - زر التحميل يحفظ الصورة بصيغتها الأصلية
*/

/* تهيئة عناصر DOM */
const sidebarBtn = document.querySelector('.sidebar-btn');
const sidebar = document.querySelector('.sidebar');
const sidebarClose = document.querySelector('.sidebar-close');

const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');

const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.querySelector('.lightbox-close');
const downloadBtn = document.getElementById('downloadBtn');

let IMAGES = []; // سيحمل محتوى images.json

/* وظيفة لفتح وإغلاق اللوحة الجانبية */
if (sidebarBtn && sidebar) {
  sidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
    // aria
    sidebar.setAttribute('aria-hidden', sidebar.classList.contains('open') ? 'false' : 'true');
  });
}
if (sidebarClose) {
  sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('open');
    sidebar.setAttribute('aria-hidden','true');
  });
}

/* تحميل images.json بمسارات محتمَلة — لأن home.html داخل /sections */
async function fetchImagesJson() {
  const possiblePaths = [
    '../images.json',    // الافتراضي (sections -> ../images.json)
    '../../images.json', // احترازي لو الوضع مختلف
    'images.json'        // احترازي
  ];
  for (const p of possiblePaths) {
    try {
      const res = await fetch(p, {cache: "no-store"});
      if (!res.ok) throw new Error('not ok');
      const j = await res.json();
      console.info('images.json loaded from:', p);
      return j;
    } catch (err) {
      // تجربة المسار التالي
    }
  }
  throw new Error('images.json not found in expected locations.');
}

/* إنشاء عنصر بطاقة صورة داخل الشبكة */
function createImageCard(imgObj) {
  // العنصر الرابط الذي يفتح الصورة في lightbox
  const a = document.createElement('a');
  a.href = `../assets/home/${imgObj.file}`;
  a.className = 'gallery-item';
  a.setAttribute('data-name', imgObj.name || '');
  a.setAttribute('aria-label', imgObj.name || '');

  // الصورة
  const image = document.createElement('img');
  image.src = `../assets/home/${imgObj.file}`;
  image.alt = imgObj.name || '';
  a.appendChild(image);

  // شريط الأدوات الصغير داخل البطاقة (اسم + زر تحميل صغير)
  const badge = document.createElement('div');
  badge.className = 'card-badge';
  badge.textContent = imgObj.name || '';
  a.appendChild(badge);

  const dl = document.createElement('a');
  dl.className = 'card-download';
  dl.textContent = 'تحميل';
  dl.href = `../assets/home/${imgObj.file}`;
  dl.download = imgObj.file;
  dl.setAttribute('aria-label','تحميل الصورة');
  a.appendChild(dl);

  // عند الضغط على الصورة نفتح الـ lightbox (منع الانتقال القياسي للرابط)
  a.addEventListener('click', function(ev) {
    ev.preventDefault();
    openLightbox(image.src, imgObj.file, imgObj.name);
  });

  return a;
}

/* عرض مجموعة من الصور */
function renderGallery(imagesArr) {
  gallery.innerHTML = '';
  if (!Array.isArray(imagesArr) || imagesArr.length === 0) {
    const empty = document.createElement('p');
    empty.style.color = '#000';
    empty.style.background = 'rgba(255,255,255,0.7)';
    empty.style.padding = '12px';
    empty.style.borderRadius = '10px';
    empty.textContent = 'لا توجد صور مطابقة للبحث';
    gallery.appendChild(empty);
    return;
  }
  imagesArr.forEach(img => {
    const card = createImageCard(img);
    const wrapper = document.createElement('div');
    wrapper.appendChild(card);
    // وضع البطاقة مباشرة داخل الشبكة
    gallery.appendChild(wrapper);
  });
}

/* فتح الـ Lightbox */
function openLightbox(src, filename, name) {
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden','false');
  lightboxImage.src = src;
  lightboxImage.alt = name || filename || '';
  downloadBtn.href = src;
  downloadBtn.download = filename || src.split('/').pop();
  // تمرير الفوكس إلى زر التحميل
  downloadBtn.focus();
}

/* إغلاق الـ Lightbox */
function closeLightbox() {
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden','true');
  lightboxImage.src = '';
}

/* إغلاق عند ضغط زر الإغلاق أو الضغط خارج الصورة */
if (lightboxClose) lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', (e) => {
  if (e.target === lightbox) closeLightbox();
});

/* وظيفة التنزيل: link download يكفي (تعمل على معظم المتصفحات) */
function forceDownload(url, filename) {
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || url.split('/').pop();
  document.body.appendChild(a);
  a.click();
  a.remove();
}

/* إذا أردت زر التحميل في اللّيتبوكس يقوم بتنزيل عبر JS (fallback) */
if (downloadBtn) {
  downloadBtn.addEventListener('click', function(e) {
    // default link download يعمل عادةً، لكن نضمن fallback
    const href = this.href;
    const filename = this.getAttribute('download') || href.split('/').pop();
    // مستعمل قد يضغط بزر الماوس الأوسط → نمنع السلوك الافتراضي
    e.preventDefault();
    forceDownload(href, filename);
  });
}

/* البحث - تفاعلي */
searchInput.addEventListener('input', (e) => {
  const q = (e.target.value || '').trim().toLowerCase();
  if (!q) {
    renderGallery(IMAGES);
    return;
  }
  const filtered = IMAGES.filter(i => (i.name || '').toLowerCase().includes(q));
  renderGallery(filtered);
});

/* تحميل الصور من images.json ثم العرض */
(async function init(){
  try {
    const images = await fetchImagesJson();
    // images متوقع أن يكون مصفوفة كائنات {name,file}
    IMAGES = Array.isArray(images) ? images : [];
    renderGallery(IMAGES);
    // ضمان ظهور عناصر الشبكة متناسقة
  } catch (err) {
    console.error('فشل تحميل images.json:', err);
    // إظهار رسالة للمستخدم
    gallery.innerHTML = '<p style="color:#000;background:#fff;padding:12px;border-radius:10px">حدث خطأ بتحميل قائمة الصور. تأكد من وجود الملف images.json في جذر المشروع وبأن المسارات صحيحة.</p>';
  }
})();
