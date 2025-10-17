const sidebarBtn = document.querySelector('.sidebar-btn');
const sidebar = document.querySelector('.sidebar');
const sidebarClose = document.querySelector('.sidebar-close');
const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');
const lightbox = document.getElementById('lightbox');
const lightboxImage = document.getElementById('lightboxImage');
const lightboxClose = document.querySelector('.lightbox-close');
const downloadBtn = document.getElementById('downloadBtn');
let IMAGES = [];

if (sidebarBtn && sidebar) {
  sidebarBtn.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });
}
if (sidebarClose) {
  sidebarClose.addEventListener('click', () => {
    sidebar.classList.remove('open');
  });
}

async function fetchImagesJson() {
  const res = await fetch('../assets/home/images.json', { cache: 'no-store' });
  if (!res.ok) throw new Error('فشل تحميل images.json');
  return await res.json();
}

function createImageCard(img) {
  const a = document.createElement('a');
  a.href = `../assets/home/${img.file}`;
  a.className = 'gallery-item';

  const image = document.createElement('img');
  image.src = `../assets/home/${img.file}`;
  image.alt = img.name || '';
  a.appendChild(image);

  a.addEventListener('click', (e) => {
    e.preventDefault();
    openLightbox(image.src, img.file);
  });

  return a;
}

function renderGallery(images) {
  gallery.innerHTML = '';
  images.forEach(img => gallery.appendChild(createImageCard(img)));
}

function openLightbox(src, filename) {
  lightbox.classList.add('open');
  lightboxImage.src = src;
  downloadBtn.href = src;
  downloadBtn.download = filename;
}
function closeLightbox() {
  lightbox.classList.remove('open');
}
lightboxClose.addEventListener('click', closeLightbox);
lightbox.addEventListener('click', e => { if (e.target === lightbox) closeLightbox(); });

searchInput.addEventListener('input', e => {
  const q = e.target.value.toLowerCase();
  const filtered = IMAGES.filter(i => i.name.toLowerCase().includes(q));
  renderGallery(filtered);
});

(async () => {
  try {
    IMAGES = await fetchImagesJson();
    renderGallery(IMAGES);
  } catch (err) {
    gallery.innerHTML = '<p>فشل تحميل الصور.</p>';
  }
})();
