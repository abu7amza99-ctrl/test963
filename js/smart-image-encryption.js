// ===== smart-image-encryption.js =====
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

// ------ إعداد آمن: استخدم PROXY_URL لخفيان المفتاح (بدل وضع المفتاح هنا) ------
const PROXY_URL = ""; // ضع رابط البروكسي هنا إذا أنشأته (مثلاً Cloudflare Worker أو Vercel)
// مثال: "https://your-proxy.example.com/removebg"

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
  };
  reader.readAsDataURL(file);
});

/* ---------- أدوات مساعدة (تنعيم قناع) ---------- */
function applyFeatherToMask(maskCanvas, radius = 12) {
  if (typeof StackBlur !== 'undefined') {
    StackBlur.canvasRGB(maskCanvas, 0, 0, maskCanvas.width, maskCanvas.height, radius);
  }
}

/* ---------- مساعدة: تركيب الصورة مع قناع alpha ---------- */
function compositeWithMask(srcImage, maskCanvas, keepPerson = true) {
  const out = document.createElement('canvas');
  out.width = srcImage.naturalWidth || srcImage.width;
  out.height = srcImage.naturalHeight || srcImage.height;
  const octx = out.getContext('2d');
  octx.drawImage(srcImage, 0, 0, out.width, out.height);

  const mask = document.createElement('canvas');
  mask.width = maskCanvas.width;
  mask.height = maskCanvas.height;
  const mctx = mask.getContext('2d');
  mctx.drawImage(maskCanvas, 0, 0, mask.width, mask.height);

  const src = octx.getImageData(0, 0, out.width, out.height);
  const maskData = mctx.getImageData(0, 0, mask.width, mask.height);

  // تأكد تطابق أبعاد: إذا اختلفت، ارسم mask على out before.getImageData
  if (mask.width !== out.width || mask.height !== out.height) {
    // إعادة تحجيم mask إلى أبعاد الصورة
    const tmp = document.createElement('canvas');
    tmp.width = out.width; tmp.height = out.height;
    tmp.getContext('2d').drawImage(mask, 0, 0, out.width, out.height);
    const resized = tmp.getContext('2d').getImageData(0, 0, out.width, out.height);
    for (let i = 0; i < src.data.length; i += 4) {
      const alpha = resized.data[i]; 
      const usedAlpha = keepPerson ? alpha : (255 - alpha);
      src.data[i + 3] = usedAlpha;
    }
  } else {
    for (let i = 0; i < src.data.length; i += 4) {
      const alpha = maskData.data[i];
      const usedAlpha = keepPerson ? alpha : (255 - alpha);
      src.data[i + 3] = usedAlpha;
    }
  }
  octx.putImageData(src, 0, 0);
  return out;
}

/* ---------- remove.bg via PROXY (آمن) أو fallback محلي ---------- */
async function removeBgViaProxy(blob) {
  if (!PROXY_URL) throw new Error('PROXY_URL not configured');
  const form = new FormData();
  form.append('image_file', blob, 'upload.png');
  const res = await fetch(PROXY_URL, { method: 'POST', body: form });
  if (!res.ok) {
    const text = await res.text();
    throw new Error('Proxy error: ' + text);
  }
  return await res.blob();
}

/* ---------- زر حذف الخلفية (يحاول البروكسي أولاً ثم fallback محلي) ---------- */
removeBgBtn.addEventListener('click', async () => {
  if (!previewImage.src) return alert("أضف صورة أولاً.");

  try {
    // جلب الصورة كـ blob
    const r = await fetch(previewImage.src);
    const blob = await r.blob();

    // إذا عندك بروكسي مضبوط - استخدمه (يوصي للحماية)
    if (PROXY_URL) {
      const resultBlob = await removeBgViaProxy(blob);
      previewImage.src = URL.createObjectURL(resultBlob);
      return;
    }

    // fallback محلي: استخدم MediaPipe SelfieSegmentation إن متوفر
    if (typeof SelfieSegmentation !== 'undefined') {
      const segmentation = new SelfieSegmentation({ locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
      }});
      segmentation.setOptions({ modelSelection: 1 });
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = previewImage.naturalWidth || previewImage.width;
      maskCanvas.height = previewImage.naturalHeight || previewImage.height;
      const mctx = maskCanvas.getContext('2d');

      const resultPromise = new Promise((resolve) => {
        segmentation.onResults((results) => {
          mctx.clearRect(0,0,maskCanvas.width,maskCanvas.height);
          mctx.drawImage(results.segmentationMask, 0, 0, maskCanvas.width, maskCanvas.height);
          resolve();
        });
      });

      await segmentation.send({ image: previewImage });
      await resultPromise;

      applyFeatherToMask(maskCanvas, 14);
      const out = compositeWithMask(previewImage, maskCanvas, true);
      previewImage.src = out.toDataURL('image/png');
      return;
    }

    // آخر حل: BodyPix (إن كانت موجودة)
    if (typeof bodyPix !== 'undefined') {
      const net = await bodyPix.load();
      const seg = await net.segmentPerson(previewImage);
      const canvas = document.createElement('canvas');
      canvas.width = previewImage.naturalWidth || previewImage.width;
      canvas.height = previewImage.naturalHeight || previewImage.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(previewImage, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
      for (let i = 0; i < seg.data.length; i++) {
        if (seg.data[i] === 0) imageData.data[i*4 + 3] = 0;
      }
      ctx.putImageData(imageData,0,0);
      previewImage.src = canvas.toDataURL('image/png');
      return;
    }

    throw new Error('No available method to remove background (add PROXY_URL or include libraries).');

  } catch (err) {
    console.error(err);
    alert("فشل إزالة الخلفية: " + err.message);
  }
});

/* ---------- حذف الشخصية (يحاول PROXY ثم محلي) ---------- */
removePersonBtn.addEventListener('click', async () => {
  if (!previewImage.src) return alert("أضف صورة أولاً.");
  try {
    // إذا تريد استخدام same proxy (remove.bg) يمكنك استبدال behavior هنا.
    if (PROXY_URL) {
      // استخدام البروكسي: نأخذ الصورة، نمرّرها، ثم نطبع النتيجة
      const r = await fetch(previewImage.src);
      const blob = await r.blob();
      const resultBlob = await removeBgViaProxy(blob);
      // النتيجة من remove.bg عادة تكون الصورة بدون خلفية (الشخص ظاهر)،
      // إذا تريد عكس ذلك (حذف الشخص) تحتاج معالجة إضافية على النتيجة.
      // هنا نعرض النتيجة كما هي (شفافة).
      previewImage.src = URL.createObjectURL(resultBlob);
      return;
    }

    // محلي: استخدم SelfieSegmentation أو BodyPix لعكس القناع
    if (typeof SelfieSegmentation !== 'undefined') {
      const segmentation = new SelfieSegmentation({ locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/${file}`;
      }});
      segmentation.setOptions({ modelSelection: 1 });
      const maskCanvas = document.createElement('canvas');
      maskCanvas.width = previewImage.naturalWidth || previewImage.width;
      maskCanvas.height = previewImage.naturalHeight || previewImage.height;
      const mctx = maskCanvas.getContext('2d');

      const resultPromise = new Promise((resolve) => {
        segmentation.onResults((results) => {
          mctx.clearRect(0,0,maskCanvas.width,maskCanvas.height);
          mctx.drawImage(results.segmentationMask, 0, 0, maskCanvas.width, maskCanvas.height);
          resolve();
        });
      });

      await segmentation.send({ image: previewImage });
      await resultPromise;
      applyFeatherToMask(maskCanvas, 14);

      const out = compositeWithMask(previewImage, maskCanvas, false);
      previewImage.src = out.toDataURL('image/png');
      return;
    }

    if (typeof bodyPix !== 'undefined') {
      const net = await bodyPix.load();
      const seg = await net.segmentPerson(previewImage);
      const canvas = document.createElement('canvas');
      canvas.width = previewImage.naturalWidth || previewImage.width;
      canvas.height = previewImage.naturalHeight || previewImage.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(previewImage, 0, 0, canvas.width, canvas.height);
      const imageData = ctx.getImageData(0,0,canvas.width,canvas.height);
      for (let i = 0; i < seg.data.length; i++) {
        if (seg.data[i] === 1) imageData.data[i*4 + 3] = 0;
      }
      ctx.putImageData(imageData,0,0);
      previewImage.src = canvas.toDataURL('image/png');
      return;
    }

    throw new Error('No method available to remove person');

  } catch (err) {
    console.error(err);
    alert("فشل إزالة الشخصية: " + err.message);
  }
});

/* ---------- حذف النص (Tesseract) ---------- */
removeTextBtn.addEventListener('click', async () => {
  if (!previewImage.src) return alert("أضف صورة أولاً.");
  try {
    const result = await Tesseract.recognize(previewImage.src, 'eng');
    const boxes = result.data.words;
    const canvas = document.createElement('canvas');
    canvas.width = previewImage.naturalWidth || previewImage.width;
    canvas.height = previewImage.naturalHeight || previewImage.height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(previewImage, 0, 0, canvas.width, canvas.height);
    boxes.forEach(word => {
      const { x0, y0, x1, y1 } = word.bbox;
      const pad = 4;
      const sx = Math.max(0, x0 - pad), sy = Math.max(0, y0 - pad);
      const sw = Math.min(canvas.width - sx, (x1 - x0) + pad*2);
      const sh = Math.min(canvas.height - sy, (y1 - y0) + pad*2);
      const sample = ctx.getImageData(sx, sy, sw, sh);
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

/* ---------- زر التحميل ---------- */
if (downloadBtn) {
  downloadBtn.addEventListener('click', () => {
    if (!previewImage.src) return alert("لا توجد صورة للتحميل.");
    const link = document.createElement('a');
    link.href = previewImage.src;
    link.download = 'image_edited.png';
    link.click();
  });
}
