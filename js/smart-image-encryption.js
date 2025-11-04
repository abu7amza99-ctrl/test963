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

/* ---------- أدوات مساعدة (تنعيم قناع) ---------- */
function applyFeatherToMask(maskCanvas, radius = 12) {
  // يستخدم StackBlur لتنعيم القناع (يعمل على alpha)
  // maskCanvas يجب أن يحتوي صورة القناع بالأبيض على أسود.
  StackBlur.canvasRGB(maskCanvas, 0, 0, maskCanvas.width, maskCanvas.height, radius);
}

/* ---------- مساعدة: رسم الناتج باستخدام قناع alpha ---------- */
function compositeWithMask(srcImage, maskCanvas, keepPerson = true) {
  const out = document.createElement('canvas');
  out.width = srcImage.width;
  out.height = srcImage.height;
  const octx = out.getContext('2d');

  // ارسم الصورة الأصلية
  octx.drawImage(srcImage, 0, 0);

  // احصل على قناع (alpha) من maskCanvas
  // maskCanvas: الأبيض = الشخص، الأسود = الخلفية (تأكد من هذا عند الإنشاء)
  // نستخدم compositing: إذا نريد حذف الخلفية -> نفرّغ الخلفية عبر globalCompositeOperation
  const mask = document.createElement('canvas');
  mask.width = maskCanvas.width;
  mask.height = maskCanvas.height;
  const mctx = mask.getContext('2d');
  mctx.drawImage(maskCanvas, 0, 0);

  // استخدم قناع لعمل alpha
  const src = octx.getImageData(0, 0, out.width, out.height);
  const maskData = mctx.getImageData(0, 0, mask.width, mask.height);

  for (let i = 0; i < src.data.length; i += 4) {
    const alpha = maskData.data[i]; // قيمة من 0..255 (افتراض: قناع أحادي)
    // عندما keepPerson=true => نقيم alpha كما هو (شخص مرئي)، أما عندما false => نعكس القناع
    const usedAlpha = keepPerson ? alpha : (255 - alpha);
    src.data[i + 3] = usedAlpha; // ضبط قناة الألفا
  }
  octx.putImageData(src, 0, 0);
  return out;
}

/* ---------- 1) حذف الخلفية (ابقِ الشخص فقط) باستخدام MediaPipe SelfieSegmentation ---------- */
removeBgBtn.addEventListener('click', async () => {
  if (!previewImage.src) return alert("أضف صورة أولاً.");

  try {
    // انشاء كائن SelfieSegmentation
    const segmentation = new SelfieSegmentation({locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
    }});

    segmentation.setOptions({modelSelection: 1}); // 0 أو 1 (1 أكثر دقة)
    // wrapper لالتقاط النتيجة
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = previewImage.width;
    maskCanvas.height = previewImage.height;
    const maskCtx = maskCanvas.getContext('2d');

    const resultPromise = new Promise((resolve) => {
      segmentation.onResults((results) => {
        // results.segmentationMask is an HTMLCanvasElement or image-like
        maskCtx.clearRect(0,0,maskCanvas.width,maskCanvas.height);
        // ارسم قناع التكسير على canvas بحجم الصورة
        maskCtx.drawImage(results.segmentationMask, 0, 0, maskCanvas.width, maskCanvas.height);
        resolve();
      });
    });

    // ارسل الصورة إلى الموديل
    await segmentation.send({image: previewImage});
    await resultPromise;

    // نعّّم القناع ليتحسن الحافة
    applyFeatherToMask(maskCanvas, 14);

    // تركيب الصورة باستخدام القناع (نحتفظ بالشخص)
    const out = compositeWithMask(previewImage, maskCanvas, true);
    previewImage.src = out.toDataURL('image/png');

  } catch (err) {
    console.error(err);
    // فشل MediaPipe؟ نستخدم BodyPix كبديل بسيط
    try {
      const net = await bodyPix.load();
      const seg = await net.segmentPerson(previewImage);
      const canvas = document.createElement('canvas');
      canvas.width = previewImage.width;
      canvas.height = previewImage.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(previewImage,0,0);
      const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
      for (let i = 0; i < seg.data.length; i++) {
        if (seg.data[i] === 0) imageData.data[i*4 + 3] = 0;
      }
      ctx.putImageData(imageData,0,0);
      previewImage.src = canvas.toDataURL('image/png');
    } catch(e2) {
      alert("حدث خطأ أثناء إزالة الخلفية.");
      console.error(e2);
    }
  }
});

/* ---------- 2) حذف الشخص (ابقِ الخلفية) باستخدام MediaPipe + feather ---------- */
removePersonBtn.addEventListener('click', async () => {
  if (!previewImage.src) return alert("أضف صورة أولاً.");

  try {
    const segmentation = new SelfieSegmentation({locateFile: (file) => {
      return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
    }});
    segmentation.setOptions({modelSelection: 1});
    const maskCanvas = document.createElement('canvas');
    maskCanvas.width = previewImage.width;
    maskCanvas.height = previewImage.height;
    const mctx = maskCanvas.getContext('2d');

    const resultPromise = new Promise((resolve) => {
      segmentation.onResults((results) => {
        mctx.clearRect(0,0,maskCanvas.width,maskCanvas.height);
        mctx.drawImage(results.segmentationMask, 0, 0, maskCanvas.width, maskCanvas.height);
        resolve();
      });
    });

    await segmentation.send({image: previewImage});
    await resultPromise;

    applyFeatherToMask(maskCanvas, 14);

    // هذه المرة نعيد تركيب الصورة مع عكس القناع (إزالة الشخص)
    const out = compositeWithMask(previewImage, maskCanvas, false);
    previewImage.src = out.toDataURL('image/png');

  } catch (err) {
    console.error(err);
    // بديل BodyPix
    try {
      const net = await bodyPix.load();
      const seg = await net.segmentPerson(previewImage);
      const canvas = document.createElement('canvas');
      canvas.width = previewImage.width;
      canvas.height = previewImage.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(previewImage,0,0);
      const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
      for (let i = 0; i < seg.data.length; i++) {
        if (seg.data[i] === 1) imageData.data[i*4 + 3] = 0;
      }
      ctx.putImageData(imageData,0,0);
      previewImage.src = canvas.toDataURL('image/png');
    } catch(e2) {
      alert("حدث خطأ أثناء إزالة الشخصية.");
      console.error(e2);
    }
  }
});

/* ---------- 3) حذف النص (Tesseract + طمس المربع بخيار ملئ لوني) ---------- */
removeTextBtn.addEventListener('click', async () => {
  if (!previewImage.src) return alert("أضف صورة أولاً.");

  try {
    // التعرف على النص (قد يستغرق وقتًا على الموبايل حسب الصورة)
    const result = await Tesseract.recognize(previewImage.src, 'eng');
    const boxes = result.data.words;

    const canvas = document.createElement('canvas');
    canvas.width = previewImage.width;
    canvas.height = previewImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(previewImage, 0, 0);

    // بدل ملء أبيض ثابت: نمزج لون الخلفية المحلي داخل كل صندوق ليفضل طبيعياً
    boxes.forEach(word => {
      const { x0, y0, x1, y1 } = word.bbox;
      // اأخذ متوسط لون حول الصندوق لملئه
      const pad = 4;
      const sx = Math.max(0, x0 - pad), sy = Math.max(0, y0 - pad);
      const sw = Math.min(canvas.width - sx, (x1 - x0) + pad*2);
      const sh = Math.min(canvas.height - sy, (y1 - y0) + pad*2);
      const sample = ctx.getImageData(sx, sy, sw, sh);
      // حساب متوسط اللون
      let r=0,g=0,b=0,count=0;
      for(let i=0;i<sample.data.length;i+=4){ r+=sample.data[i]; g+=sample.data[i+1]; b+=sample.data[i+2]; count++; }
      r=Math.round(r/count); g=Math.round(g/count); b=Math.round(b/count);
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    });

    previewImage.src = canvas.toDataURL('image/png');
  } catch(err) {
    console.error(err);
    alert("خطأ عند محاولة حذف النص.");
  }
});

/* ---------- زر التحميل (لو لم يكن موجود) ---------- */
if (downloadBtn) {
  downloadBtn.addEventListener('click', () => {
    if (!previewImage.src) return alert("لا توجد صورة للتحميل.");
    const link = document.createElement('a');
    link.href = previewImage.src;
    link.download = 'image_edited.png';
    link.click();
  });
                    }
