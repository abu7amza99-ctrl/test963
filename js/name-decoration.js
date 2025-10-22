const menuBtn = document.getElementById("menuBtn");
const sidePanel = document.getElementById("sidePanel");
const closePanel = document.getElementById("closePanel");
const typeButton = document.getElementById("typeButton");
const typeMenu = document.getElementById("typeMenu");

// فتح وإغلاق اللوحة الجانبية
menuBtn.addEventListener("click", () => {
  sidePanel.classList.add("open");
});

closePanel.addEventListener("click", () => {
  sidePanel.classList.remove("open");
});

// زر اختيار نوع الزخرفة
typeButton.addEventListener("click", () => {
  typeMenu.classList.toggle("hidden");
});

// لاحقًا نضيف الأحداث الخاصة بخيارات الزخرفة
