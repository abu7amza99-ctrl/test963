// عناصر التحكم في اللوحة الجانبية
const sidebarBtn = document.querySelector('.sidebar-btn');
const sidebar = document.querySelector('.sidebar');
const closeBtn = document.querySelector('.close-btn');

// فتح وإغلاق اللوحة الجانبية (مطابق لتنسيق زخرفة الأسماء)
sidebarBtn.addEventListener('click', () => {
  sidebar.classList.add('active');
});
closeBtn.addEventListener('click', () => {
  sidebar.classList.remove('active');
});

// ===== وظائف المعرض كما هي =====
const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');
const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const closeModal = document.querySelector('.close-modal');
const downloadBtn = document.getElementById('downloadBtn');

async function loadImages() {
  const response = await fetch('../images.json');
  const data = await response.json();
  renderGallery(data);
}

function renderGallery(images) {
  if (!gallery) return;
  gallery.innerHTML = '';
  images.forEach(img => {
    const imageElement = document.createElement('img');
    imageElement.src = `../assets/home/${img.file}`;
    imageElement.alt = img.name;
    imageElement.addEventListener('click', () => openModal(imageElement.src, img.file));
    gallery.appendChild(imageElement);
  });
}

function openModal(src, filename) {
  if (!modal) return;
  modal.style.display = 'flex';
  modalImage.src = src;
  downloadBtn.href = src;
  downloadBtn.download = filename;
}

if (closeModal) {
  closeModal.addEventListener('click', () => {
    modal.style.display = 'none';
  });
}

window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

if (searchInput) {
  searchInput.addEventListener('input', async (e) => {
    const response = await fetch('../images.json');
    const data = await response.json();
    const searchTerm = e.target.value.trim();
    const filtered = data.filter(img => img.name.includes(searchTerm));
    renderGallery(filtered);
  });
}

loadImages();
