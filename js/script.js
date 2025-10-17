// زر فتح اللوحة الجانبية
const sidebarBtn = document.querySelector('.sidebar-btn');
const sidebar = document.querySelector('.sidebar');
const closeBtn = document.querySelector('.close-btn');

// فتح اللوحة
sidebarBtn.addEventListener('click', () => {
  sidebar.classList.toggle('open');
});

// إغلاق اللوحة
closeBtn.addEventListener('click', () => {
  sidebar.classList.remove('open');
});

// إغلاق اللوحة عند النقر خارجها (لتحسين التجربة)
document.addEventListener('click', (e) => {
  if (!sidebar.contains(e.target) && !sidebarBtn.contains(e.target)) {
    sidebar.classList.remove('open');
  }
});
