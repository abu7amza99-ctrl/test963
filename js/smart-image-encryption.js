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
removeTextBtn.addEventListener("click", async () => {
  if (!previewImage.src) return alert("أضف صورة أولاً.");

  const result = await Tesseract.recognize(previewImage.src, 'eng');
  const boxes = result.data.words;

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = previewImage.width;
  canvas.height = previewImage.height;
  ctx.drawImage(previewImage, 0, 0);

  ctx.fillStyle = "white";
  boxes.forEach(word => {
    const { x0, y0, x1, y1 } = word.bbox;
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  });

  previewImage.src = canvas.toDataURL("image/png");
});

// ===== زر حذف الخلفية =====
removeBgBtn.addEventListener("click", async () => {
  if (!previewImage.src) return alert("أضف صورة أولاً.");

  const net = await bodyPix.load();
  const segmentation = await net.segmentPerson(previewImage);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = previewImage.width;
  canvas.height = previewImage.height;
  ctx.drawImage(previewImage, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < segmentation.data.length; i++) {
    if (segmentation.data[i] === 0) imageData.data[i * 4 + 3] = 0;
  }

  ctx.putImageData(imageData, 0, 0);
  previewImage.src = canvas.toDataURL("image/png");
});

// ===== زر حذف الشخصية =====
removePersonBtn.addEventListener("click", async () => {
  if (!previewImage.src) return alert("أضف صورة أولاً.");

  const net = await bodyPix.load();
  const segmentation = await net.segmentPerson(previewImage);

  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  canvas.width = previewImage.width;
  canvas.height = previewImage.height;
  ctx.drawImage(previewImage, 0, 0);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < segmentation.data.length; i++) {
    if (segmentation.data[i] === 1) imageData.data[i * 4 + 3] = 0;
  }

  ctx.putImageData(imageData, 0, 0);
  previewImage.src = canvas.toDataURL("image/png");
});
