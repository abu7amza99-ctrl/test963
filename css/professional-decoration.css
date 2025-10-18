/* professional-decoration.js - نهائي: تلوين الأحرف فقط على الصور الشفافة */
document.addEventListener('DOMContentLoaded', () => {
  // عناصر DOM
  const sidebarToggle = document.getElementById('toggleSidebar');
  const siteSidebar = document.getElementById('siteSidebar');
  const closeSidebar = document.getElementById('closeSidebar');

  const editorCanvas = document.getElementById('editorCanvas');
  const modeSelect = document.getElementById('modeSelect');
  const textInput = document.getElementById('textInput');
  const fontSelect = document.getElementById('fontSelect');
  const fileImage = document.getElementById('fileImage');
  const btnAdd = document.getElementById('btnAdd');
  const btnGradients = document.getElementById('btnGradients');
  const btnDressups = document.getElementById('btnDressups');
  const strokeWidth = document.getElementById('strokeWidth');
  const strokeColor = document.getElementById('strokeColor');
  const dressQuick = document.getElementById('dressQuick');
  const deleteSelected = document.getElementById('deleteSelected');
  const downloadImage = document.getElementById('downloadImage');
  const popupContainer = document.getElementById('popupContainer');

  // حالة
  let SELECTED = null;
  const ELEMENTS = []; // سنخزن كل عنصر هنا مع بياناته

  // تدرجات (50 تقريبا + ذهبي/فضي/معدني)
  const GRADIENTS = (function(){
    const out = [];
    for(let i=0;i<50;i++){
      const a = `hsl(${(i*360/50)|0} 80% 55%)`;
      const b = `hsl(${((i*360/50)+40)|0} 80% 65%)`;
      out.push([a,b]);
    }
    // metallics
    out.push(['#f3c976','#b8862a']); // gold
    out.push(['#e6e9ec','#b9bfc6']); // silver
    out.push(['#d4b06f','#8b5a2b']); // bronze
    out.push(['#9fb8c8','#6b7f95']); // cool metal
    return out;
  })();

  // تلبيسات افتراضية (ضع ملفات داخل assets/Dress up/)
  const DRESSUPS = [
    'assets/Dress up/gold1.jpg',
    'assets/Dress up/gold2.jpg',
    'assets/Dress up/silver1.jpg',
    'assets/Dress up/metal1.jpg'
  ];

  // فتح/اغلاق الشريط
  if(sidebarToggle) sidebarToggle.addEventListener('click', ()=> siteSidebar.classList.toggle('active'));
  if(closeSidebar) closeSidebar.addEventListener('click', ()=> siteSidebar.classList.remove('active'));

  // مساعدة: إنشاء عنصر الحالة (object) لكل عنصر
  function createElementObject(type, data){
    const id = 'el_'+(Date.now() + Math.floor(Math.random()*999));
    const obj = Object.assign({
      id, type, x:50, y:60, rotation:0, scale:1,
      font: 'Reem Kufi', size: 72, stroke:0, strokeColor:'#000', fillMode:'solid', gradient:null, dress:null, img:null,
      displayWidth: null, displayHeight: null
    }, data||{});
    ELEMENTS.push(obj);
    return obj;
  }

  // إنشاء DOM من obj
  function renderElement(obj){
    let dom;
    if(obj.type === 'text'){
      dom = document.createElement('div');
      dom.className = 'canvas-item text-item';
      dom.textContent = obj.text || '';
      dom.style.fontFamily = obj.font;
      dom.style.fontSize = (obj.size || 48) + 'px';
      dom.style.left = obj.x + 'px';
      dom.style.top = obj.y + 'px';
      dom.dataset.id = obj.id;
      applyStyleToDom(obj, dom);
      attachInteraction(dom, obj);
      editorCanvas.appendChild(dom);
    } else if(obj.type === 'image'){
      const wrap = document.createElement('div');
      wrap.className = 'canvas-item img-wrap';
      wrap.style.left = obj.x + 'px';
      wrap.style.top = obj.y + 'px';
      wrap.dataset.id = obj.id;

      const img = document.createElement('img');
      img.src = obj.img;
      img.alt = '';
      img.style.display='block';

      // overlay canvas (for alpha-only preview)
      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.className = 'img-overlay-canvas';
      overlayCanvas.style.left = '0';
      overlayCanvas.style.top = '0';
      overlayCanvas.style.pointerEvents = 'none';

      img.onload = () => {
        // سجل أبعاد العرض (المستخدمة في المعاينة) داخل obj
        const maxw = Math.min(480, img.naturalWidth);
        const dispW = obj.displayWidth || maxw;
        const aspect = img.naturalHeight / img.naturalWidth;
        const dispH = Math.round(dispW * aspect);

        img.style.width = dispW + 'px';
        img.style.height = 'auto';
        wrap.style.width = img.style.width;
        wrap.style.height = img.offsetHeight + 'px';

        // ضبط canvas overlay لحجم العرض الفعلي (ببيكسل)
        overlayCanvas.width = dispW;
        overlayCanvas.height = dispH;
        overlayCanvas.style.width = dispW + 'px';
        overlayCanvas.style.height = dispH + 'px';

        // خزن القياسات ليتطابق التصدير
        obj.displayWidth = dispW;
        obj.displayHeight = dispH;

        // أنشئ المعاينة وفق الحالة الحالية
        updateImageOverlay(obj, wrap);
      };

      const overlayDiv = document.createElement('div');
      overlayDiv.className = 'img-overlay'; // لا نحذفها - لكن نستخدم overlayCanvas للاحترافية
      overlayDiv.style.left = '0'; overlayDiv.style.top = '0';

      wrap.appendChild(img);
      wrap.appendChild(overlayCanvas);
      wrap.appendChild(overlayDiv);

      applyStyleToDom(obj, wrap);
      attachInteraction(wrap, obj);
      editorCanvas.appendChild(wrap);
      dom = wrap;
    }
    return dom;
  }

  // تحديث الـ overlay الخاص بصورة: نستخدم canvas لنعمل قناع alpha ثم نعرضه كـ canvas مباشرة (يضمن الشفافية)
  function updateImageOverlay(obj, wrap){
    if(!wrap) return;
    const imgEl = wrap.querySelector('img');
    const overlayCanvas = wrap.querySelector('.img-overlay-canvas');
    if(!imgEl || !overlayCanvas) return;

    const dispW = obj.displayWidth || parseInt(imgEl.style.width) || imgEl.naturalWidth;
    const dispH = obj.displayHeight || (imgEl.naturalHeight * (dispW / imgEl.naturalWidth)) | 0;

    overlayCanvas.width = dispW;
    overlayCanvas.height = dispH;
    overlayCanvas.style.width = dispW + 'px';
    overlayCanvas.style.height = dispH + 'px';
    overlayCanvas.style.position = 'absolute';
    overlayCanvas.style.left = '0px';
    overlayCanvas.style.top = '0px';

    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0,0,overlayCanvas.width, overlayCanvas.height);

    if(obj.fillMode === 'gradient' && obj.gradient){
      // ارسم التدرج ثم استخدم الصورة كقناع (destination-in)
      const g = ctx.createLinearGradient(0,0,overlayCanvas.width,0);
      g.addColorStop(0, obj.gradient[0]);
      g.addColorStop(1, obj.gradient[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0,0,overlayCanvas.width, overlayCanvas.height);

      ctx.globalCompositeOperation = 'destination-in';
      // نرسم الصورة بنفس الأبعاد لنعمل القناع على ألفا
      ctx.drawImage(imgEl, 0, 0, overlayCanvas.width, overlayCanvas.height);
      ctx.globalCompositeOperation = 'source-over';
      overlayCanvas.style.opacity = 1;
    } else if(obj.fillMode === 'dress' && obj.dress){
      // ارسم صورة التلبيس (dress) ثم استخدم الصورة الأصلية كقناع
      const dressImg = new Image();
      dressImg.crossOrigin = 'anonymous';
      dressImg.onload = () => {
        ctx.clearRect(0,0,overlayCanvas.width, overlayCanvas.height);
        ctx.drawImage(dressImg, 0, 0, overlayCanvas.width, overlayCanvas.height);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(imgEl, 0, 0, overlayCanvas.width, overlayCanvas.height);
        ctx.globalCompositeOperation = 'source-over';
        overlayCanvas.style.opacity = 1;
      };
      dressImg.onerror = ()=> {
        ctx.clearRect(0,0,overlayCanvas.width, overlayCanvas.height);
        overlayCanvas.style.opacity = 0;
      };
      dressImg.src = obj.dress;
    } else {
      // لا شيء: اخفي الـ overlay
      overlayCanvas.style.opacity = 0;
      ctx.clearRect(0,0,overlayCanvas.width, overlayCanvas.height);
    }
  }

  // تطبيق ستايلات المعاينة على DOM (تدرج/تلبيس/حد)
  function applyStyleToDom(obj, dom){
    if(!dom) return;
    // إزالة خلفيات سابقة
    dom.style.background = '';
    if(obj.type === 'text'){
      if(obj.fillMode === 'solid' || !obj.gradient){
        dom.style.color = obj.color || '#000';
        dom.style.webkitTextStroke = (obj.stroke||0)+'px '+(obj.strokeColor||'#000');
        dom.style.background = 'none';
        dom.style.webkitBackgroundClip = 'unset';
      } else {
        // gradient preview
        const g = obj.gradient;
        dom.style.background = `linear-gradient(90deg, ${g[0]}, ${g[1]})`;
        dom.style.webkitBackgroundClip = 'text';
        dom.style.color = 'transparent';
        dom.style.webkitTextFillColor = 'transparent';
        dom.style.webkitTextStroke = (obj.stroke||0)+'px '+(obj.strokeColor||'#000');
      }
      dom.style.transform = `rotate(${obj.rotation}rad)`;
    } else if(obj.type === 'image'){
      // بدل التعديل على div.overlay نحدث overlay canvas
      updateImageOverlay(obj, dom);
      dom.style.transform = `rotate(${obj.rotation}rad)`;
    }
  }

  // ربط التفاعل: سحب وتحديد وتدوير عبر مقبض
  function attachInteraction(dom, obj){
    // موقع البداية
    dom.style.left = (obj.x||50) + 'px';
    dom.style.top = (obj.y||50) + 'px';
    dom.style.position = 'absolute';

    // حذف أي مقبض قديم
    const oldHandle = dom.querySelector('.rotate-handle');
    if(oldHandle) oldHandle.remove();

    // مقبض التدوير
    const handle = document.createElement('div');
    handle.className = 'rotate-handle';
    handle.innerHTML = '⤾';
    dom.appendChild(handle);

    // عند النقر نختار العنصر
    dom.addEventListener('mousedown', (e)=> {
      e.stopPropagation();
      selectElement(dom, obj);
    });

    // سحب
    let dragging = false, startX=0, startY=0, startLeft=0, startTop=0;
    dom.addEventListener('pointerdown', (ev) => {
      if(ev.target === handle) return;
      dragging = true;
      startX = ev.clientX; startY = ev.clientY;
      startLeft = parseFloat(dom.style.left) || 0;
      startTop = parseFloat(dom.style.top) || 0;
      dom.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });
    window.addEventListener('pointermove', (ev) => {
      if(!dragging) return;
      const nx = startLeft + (ev.clientX - startX);
      const ny = startTop + (ev.clientY - startY);
      dom.style.left = nx + 'px';
      dom.style.top = ny + 'px';
      obj.x = nx; obj.y = ny;
    });
    window.addEventListener('pointerup', ()=> dragging=false);

    // تدوير بالسحب على المقبض
    let rotating = false;
    handle.addEventListener('pointerdown', (ev) => {
      ev.stopPropagation();
      rotating = true;
      const rect = dom.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      const startAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx) - (obj.rotation||0);
      handle.setPointerCapture(ev.pointerId);
      function onMove(e2){
        if(!rotating) return;
        const angle = Math.atan2(e2.clientY - cy, e2.clientX - cx) - startAngle;
        obj.rotation = angle;
        dom.style.transform = `rotate(${angle}rad)`;
      }
      function onUp(){
        rotating = false;
        window.removeEventListener('pointermove', onMove);
        window.removeEventListener('pointerup', onUp);
      }
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  }

  // تحديد العنصر (عرض حدود، حفظ في SELECTED)
  function selectElement(dom, obj){
    // ازالة التحديد القديم
    document.querySelectorAll('.canvas-item.selected').forEach(el=>el.classList.remove('selected'));
    dom.classList.add('selected');
    SELECTED = {dom,obj};
  }

  // كل مكان فارغ يزيل التحديد
  editorCanvas.addEventListener('mousedown', (e)=>{
    if(e.target === editorCanvas){
      document.querySelectorAll('.canvas-item.selected').forEach(el=>el.classList.remove('selected'));
      SELECTED = null;
    }
  });

  // إضافة نص/صورة
  btnAdd.addEventListener('click', ()=>{
    if(modeSelect.value === 'text'){
      const txt = textInput.value.trim();
      if(!txt) return alert('أدخل نصًا ثم اضغط أضف');
      const obj = createElementObject('text',{text:txt,font:fontSelect.value});
      renderElement(obj);
      textInput.value = '';
    } else {
      // صورة من الجهاز
      const f = fileImage.files && fileImage.files[0];
      if(!f) return alert('اختر صورة من جهازك');
      const reader = new FileReader();
      reader.onload = (ev) => {
        const obj = createElementObject('image',{img:ev.target.result});
        renderElement(obj);
      };
      reader.readAsDataURL(f);
      fileImage.value = '';
    }
  });

  // فتح popup التدرجات
  btnGradients.addEventListener('click', ()=> {
    openPopup('grad');
  });

  // فتح popup التلبيسات
  btnDressups.addEventListener('click', ()=> {
    openPopup('dress');
  });

  // popup عام
  function openPopup(type){
    popupContainer.innerHTML = '';
    popupContainer.classList.add('open');
    const pop = document.createElement('div'); pop.className='popup';
    const head = document.createElement('div'); head.className='popup-head';
    const title = document.createElement('h3'); title.textContent = type==='grad' ? 'التدرجات' : 'التلبيسات';
    const close = document.createElement('button'); close.className='btn'; close.textContent='إغلاق';
    close.addEventListener('click', ()=> closePopup());
    head.appendChild(title); head.appendChild(close);
    pop.appendChild(head);
    const body = document.createElement('div'); body.className='popup-body';
    const grid = document.createElement('div'); grid.className = (type==='grad' ? 'grad-grid' : 'dress-grid');

    if(type==='grad'){
      GRADIENTS.forEach(g => {
        const s = document.createElement('div'); s.className='grad-sample';
        s.style.background = `linear-gradient(90deg, ${g[0]}, ${g[1]})`;
        s.addEventListener('click', ()=>{
          applyGradientToSelected(g);
          closePopup();
        });
        grid.appendChild(s);
      });
    } else {
      DRESSUPS.forEach(url=>{
        const d = document.createElement('div'); d.className='dress-item';
        const img = document.createElement('img'); img.src = url;
        d.appendChild(img);
        d.addEventListener('click', ()=>{
          applyDressToSelected(url);
          closePopup();
        });
        grid.appendChild(d);
      });
    }

    body.appendChild(grid);
    pop.appendChild(body);
    popupContainer.appendChild(pop);
  }

  function closePopup(){
    popupContainer.classList.remove('open');
    popupContainer.innerHTML = '';
  }

  // تطبيق تدرج على العنصر المحدد (تدرج: [a,b])
  function applyGradientToSelected(g){
    if(!SELECTED){ alert('اختر عنصرًا أولاً'); return;}
    const {obj,dom} = SELECTED;
    obj.fillMode = 'gradient';
    obj.gradient = g;
    applyStyleToDom(obj, dom);
  }

  // تطبيق تلبيس (dress) على العنصر المحدد
  function applyDressToSelected(url){
    if(!SELECTED){ alert('اختر عنصرًا أولاً'); return;}
    const {obj,dom} = SELECTED;
    obj.fillMode = 'dress';
    obj.dress = url;
    applyStyleToDom(obj, dom);
  }

  // حذف المحدد
  deleteSelected.addEventListener('click', ()=>{
    if(!SELECTED) return;
    // إزالة من DOM و ELEMENTS
    const {dom,obj} = SELECTED;
    dom.remove();
    const idx = ELEMENTS.findIndex(e=>e.id===obj.id);
    if(idx!==-1) ELEMENTS.splice(idx,1);
    SELECTED = null;
  });

  // تحويل التلبيس السريع
  dressQuick && dressQuick.addEventListener('change', (e)=>{
    const v = e.target.value;
    if(!SELECTED) return;
    if(v==='gold') applyDressToSelected(DRESSUPS[0]);
    else if(v==='silver') applyDressToSelected(DRESSUPS[1]);
    e.target.value='none';
  });

  /* ---------- التصدير: نرسم يدوياً على canvas ليكون الناتج مطابق للعرض ---------- */
  downloadImage.addEventListener('click', async ()=>{
    try {
      const rect = editorCanvas.getBoundingClientRect();
      const W = Math.max(800, Math.round(rect.width));
      const H = Math.max(400, Math.round(rect.height));
      const outCanvas = document.createElement('canvas');
      outCanvas.width = W;
      outCanvas.height = H;
      const ctx = outCanvas.getContext('2d');

      ctx.clearRect(0,0,W,H);

      // رسم عناصر بحسب ترتيب DOM
      const domChildren = Array.from(editorCanvas.querySelectorAll('.canvas-item'));
      for(const dom of domChildren){
        const id = dom.dataset.id;
        const obj = ELEMENTS.find(e=>e.id===id);
        if(!obj) continue;

        if(obj.type === 'text'){
          const x = Math.round(parseFloat(dom.style.left) || obj.x || 0);
          const y = Math.round(parseFloat(dom.style.top) || obj.y || 0);
          const fontSize = obj.size || 72;
          ctx.save();
          const bboxW = (dom.offsetWidth || (fontSize* (obj.text ? obj.text.length : 1) /2));
          const bboxH = (dom.offsetHeight || fontSize);
          const cx = x + bboxW/2;
          const cy = y + bboxH/2;
          ctx.translate(cx, cy);
          ctx.rotate(obj.rotation || 0);
          ctx.translate(-cx, -cy);

          ctx.font = `${fontSize}px "${obj.font || 'Reem Kufi'}"`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          if(obj.fillMode === 'solid' || !obj.gradient){
            ctx.fillStyle = obj.color || '#000';
            if(obj.stroke && obj.stroke>0){
              ctx.lineWidth = obj.stroke;
              ctx.strokeStyle = obj.strokeColor || '#000';
              ctx.strokeText(obj.text, x, y);
            }
            ctx.fillText(obj.text, x, y);
          } else if(obj.fillMode === 'gradient' && obj.gradient){
            const g = ctx.createLinearGradient(x, y, x + bboxW, y);
            g.addColorStop(0, obj.gradient[0]);
            g.addColorStop(1, obj.gradient[1]);
            ctx.fillStyle = g;
            if(obj.stroke && obj.stroke>0){
              ctx.lineWidth = obj.stroke;
              ctx.strokeStyle = obj.strokeColor || '#000';
              ctx.strokeText(obj.text, x, y);
            }
            ctx.fillText(obj.text, x, y);
          } else if(obj.fillMode === 'dress' && obj.dress){
            // رسم تلبيس على نص (قناع)
            const tmp = document.createElement('canvas');
            tmp.width = Math.max(1, Math.round(bboxW));
            tmp.height = Math.max(1, Math.round(bboxH));
            const tctx = tmp.getContext('2d');
            tctx.clearRect(0,0,tmp.width,tmp.height);
            tctx.font = `${fontSize}px "${obj.font || 'Reem Kufi'}"`;
            tctx.textAlign = 'left';
            tctx.textBaseline = 'top';
            tctx.fillStyle = '#000';
            tctx.fillText(obj.text, 0, 0);

            await new Promise((res,rej)=>{
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = ()=>{
                const t2 = document.createElement('canvas');
                t2.width = tmp.width; t2.height = tmp.height;
                const t2ctx = t2.getContext('2d');
                t2ctx.drawImage(img, 0, 0, t2.width, t2.height);
                t2ctx.globalCompositeOperation = 'destination-in';
                t2ctx.drawImage(tmp, 0, 0);
                ctx.drawImage(t2, x, y);
                res();
              };
              img.onerror = ()=> {
                ctx.fillStyle = obj.color || '#000';
                ctx.fillText(obj.text, x, y);
                res();
              };
              img.src = obj.dress;
            });
          }

          ctx.restore();
        } else if(obj.type === 'image'){
          const wrap = dom;
          const imgEl = wrap.querySelector('img');
          if(!imgEl) continue;

          await new Promise((res,rej)=>{
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = async ()=>{
              // نأخذ أبعاد العرض المستخدمة في المعاينة (display)
              const left = Math.round(parseFloat(wrap.style.left)||obj.x||0);
              const top = Math.round(parseFloat(wrap.style.top)||obj.y||0);
              const drawW = obj.displayWidth || parseInt(imgEl.style.width) || img.naturalWidth;
              const drawH = obj.displayHeight || Math.round(img.naturalHeight * (drawW / img.naturalWidth));

              if(obj.fillMode === 'gradient' && obj.gradient){
                const tmp = document.createElement('canvas');
                tmp.width = drawW; tmp.height = drawH;
                const tctx = tmp.getContext('2d');

                const g = tctx.createLinearGradient(0,0, tmp.width,0);
                g.addColorStop(0, obj.gradient[0]);
                g.addColorStop(1, obj.gradient[1]);
                tctx.fillStyle = g;
                tctx.fillRect(0,0,tmp.width,tmp.height);

                tctx.globalCompositeOperation = 'destination-in';
                // نرسم الصورة على نفس الحجم لاستخدام ألفا كقناع
                tctx.drawImage(img, 0, 0, tmp.width, tmp.height);
                ctx.drawImage(tmp, left, top, tmp.width, tmp.height);
                res();
              } else if(obj.fillMode === 'dress' && obj.dress){
                const dressImg = new Image();
                dressImg.crossOrigin = 'anonymous';
                dressImg.onload = ()=>{
                  const tmp = document.createElement('canvas');
                  tmp.width = drawW; tmp.height = drawH;
                  const tctx = tmp.getContext('2d');
                  // ارسم التلبيس بالحجم المطلوب
                  tctx.drawImage(dressImg, 0, 0, tmp.width, tmp.height);
                  // استخدم الصورة كقناع (alpha)
                  tctx.globalCompositeOperation = 'destination-in';
                  tctx.drawImage(img, 0, 0, tmp.width, tmp.height);
                  ctx.drawImage(tmp, left, top, tmp.width, tmp.height);
                  res();
                };
                dressImg.onerror = ()=>{
                  ctx.drawImage(img, left, top, drawW, drawH);
                  res();
                };
                dressImg.src = obj.dress;
              } else {
                // فقط الصورة
                ctx.drawImage(img, left, top, drawW, drawH);
                res();
              }
            };
            img.onerror = ()=> { res(); };
            img.src = imgEl.src;
          });
        }
      } // end loop

      // تحميل
      const dataUrl = outCanvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'design.png';
      a.click();
    } catch(err){
      console.error(err);
      alert('حدث خطأ أثناء التصدير: ' + err.message);
    }
  });

  // عند تحميل الصفحة: نتركها فارغة (عنصر hint يظهر إذا تريد)
});
