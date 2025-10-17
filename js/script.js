const sidebarBtn = document.querySelector('.sidebar-btn');
const sidebar = document.querySelector('.sidebar');
const closeBtn = document.querySelector('.close-btn');
const gallery = document.getElementById('gallery');
const searchInput = document.getElementById('searchInput');

const modal = document.getElementById('imageModal');
const modalImage = document.getElementById('modalImage');
const closeModal = document.querySelector('.close-modal');
const downloadBtn = document.getElementById('downloadBtn');

sidebarBtn.addEventListener('click', () => sidebar.classList.toggle('open'));
closeBtn.addEventListener('click', () => sidebar.classList.remove('open'));

async function loadImages() {
  const response = await fetch('../images.json');
  const data = await response.json();
  renderGallery(data);
}

function renderGallery(images) {
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
  modal.style.display = 'flex';
  modalImage.src = src;
  downloadBtn.href = src;
  downloadBtn.download = filename;
}

closeModal.addEventListener('click', () => {
  modal.style.display = 'none';
});

window.addEventListener('click', (e) => {
  if (e.target === modal) modal.style.display = 'none';
});

searchInput.addEventListener('input', async (e) => {
  const response = await fetch('../images.json');
  const data = await response.json();
  const searchTerm = e.target.value.trim();
  const filtered = data.filter(img => img.name.includes(searchTerm));
  renderGallery(filtered);
});

loadImages();
