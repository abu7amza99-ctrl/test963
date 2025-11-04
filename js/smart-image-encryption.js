// ===== قسم تشفيف الصور الذكي =====

// عناصر DOM
const imageInput = document.getElementById('imageInput');
const uploadBtn = document.getElementById('uploadBtn');
const previewImage = document.getElementById('previewImage');
const previewContainer = document.getElementById('previewContainer');
const actionButtons = document.getElementById('actionButtons');
const removeTextBtn = document.getElementById('removeTextBtn');
const removeBgBtn = document.getElementById('removeBgBtn');
const removePersonBtn = document.getElementById('removePersonBtn');
const downloadBtn = document.getElementById('downloadBtn');

let originalImage = null; // لحفظ الصورة الأصلية
let currentCanvas = null; // لحفظ نسخة العمل

// ===== تحميل الصورة من الهاتف =====
uploadBtn.addEventListener('click', () => imageInput.click());

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = () => {
    previewImage.src = reader.result;
    previewImage.style.display = 'block';
    actionButtons.style.display = 'flex';
    originalImage = new Image();
    originalImage.src = reader.result;
  };
  reader.readAsDataURL(file);
});

// ===== زر حذف النص =====
removeTextBtn.addEventListener('click', async () => {
  if (!previewImage.src) return alert("أضف صورة أولاً.");
  alert("ضع هنا كود Tesseract.js لحذف النص.");
});

// ===== زر حذف الخلفية =====
removeBgBtn.addEventListener('click', async () => {
  if (!previewImage.src) return alert("أضف صورة أولاً.");
  alert("ضع هنا كود BodyPix لحذف الخلفية.");
});

// ===== زر حذف الشخصية =====
removePersonBtn.addEventListener('click', async () => {
  if (!previewImage.src) return alert("أضف صورة أولاً.");
  alert("ضع هنا كود BodyPix لعكس القناع وحذف الشخص.");
});
