/* professional-decoration.js
   نهائي: تطبيق كل المطلوبات — تلوين أحرف النص أو أسماء داخل صور شفافة
   يعمل مع: assets/dressup/*  و assets/fonts/*
*/

document.addEventListener('DOMContentLoaded', () => {
  // عناصر DOM
  const toggleSidebar = document.getElementById('toggleSidebar');
  const siteSidebar = document.getElementById('siteSidebar');
  const closeSidebar = document.getElementById('closeSidebar');

  const editorCanvas = document.getElementById('editorCanvas');
  const modeSelect = document.getElementById('modeSelect');
  const textInput = document.getElementById('textInput');
  const fontSelect = document.getElementById('fontSelect');
  const fileImage = document.getElementById('fileImage');
  const btnAdd = document.getElementById('btnAdd');
  const btnShowPalette = document.getElementById('btnShowPalette');
  const colorMode = document.getElementById('colorMode');
  const fileInputWrap = document.getElementById('fileInputWrap');
  const textInputWrap = document.getElementById('textInputWrap');
  const btnGradients = document.getElementById('btnGradients');
  const deleteSelected = document.getElementById('deleteSelected');
  const downloadImage = document.getElementById('downloadImage');
  const popupContainer = document.getElementById('popupContainer');

  // حالة
  let SELECTED = null;
  const ELEMENTS = [];

  // توليد 50 تدرج لعرضهم
  const GRADIENTS = (function(){
    const out = [];
    for(let i=0;i<50;i++){
      const a = `hsl(${Math.round(i*360/50)} 80% 50%)`;
      const b = `hsl(${Math.round((i*360/50)+30)} 80% 65%)`;
      out.push([a,b]);
    }
    // اضف بعض الانواع المعدنية الافتراضية
    out.push(['#f3c976','#b8862a']);
    out.push(['#e6e9ec','#b9bfc6']);
    return out;
  })();

  // جلب التلبيسات المتوفرة داخل assets/dressup/ (قائمة افتراضية)
  const DRESSUPS = (function(){
    // لاحقًا يمكنك تعديل القائمة هنا او وضع ملفات في assets/dressup/
    return [
      '../assets/dressup/gold1.jpg',
      '../assets/dressup/gold2.jpg',
      '../assets/dressup/silver1.jpg',
      '../assets/dressup/metal1.jpg'
    ];
  })();

  // تفعيل زر الشريط الجانبي
  function openSidebar(){ siteSidebar.classList.add('open'); siteSidebar.setAttribute('aria-hidden','false'); }
  function closeSidebarFn(){ siteSidebar.classList.remove('open'); siteSidebar.setAttribute('aria-hidden','true'); }

  if(toggleSidebar) toggleSidebar.addEventListener('click', openSidebar);
  if(closeSidebar) closeSidebar.addEventListener('click', closeSidebarFn);

  // اعداد قائمة الخطوط من مجلد assets/fonts/ (عرض افتراضي)
  const FONTS = [
    {name:'Reem Kufi', css:'Reem Kufi'},
    {name:'Cairo', css:'Cairo'},
    {name:'Tajawal', css:'Tajawal'},
    {name:'Amiri', css:'Amiri'}
  ];
  function populateFonts(){
    fontSelect.innerHTML = '';
    FONTS.forEach(f=>{
      const opt = document.createElement('option');
      opt.value = f.css;
      opt.textContent = f.name;
      fontSelect.appendChild(opt);
    });
  }
  populateFonts();

  // مساعدة: انشاء كائن حالة للعنصر
  function createElementObject(type, data){
    const id = 'el_' + (Date.now() + Math.floor(Math.random()*999));
    const obj = Object.assign({
      id, type, x:50, y:60, rotation:0, scale:1,
      font: 'Reem Kufi', size: 72, stroke:0, strokeColor:'#000',
      fillMode: 'solid', gradient: null, dress: null, img: null,
      displayWidth: null, displayHeight: null, text: ''
    }, data||{});
    ELEMENTS.push(obj);
    return obj;
  }

  // انشاء DOM للعنصر
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
      img.style.display = 'block';
      img.style.pointerEvents = 'none'; // مهم: يمنع الصورة من اعتراض النقر ويسمح بتحديد العنصر

      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.className = 'img-overlay-canvas';
      overlayCanvas.style.pointerEvents = 'none';

      img.onload = () => {
        const maxw = Math.min(480, img.naturalWidth);
        const dispW = obj.displayWidth || maxw;
        const aspect = img.naturalHeight / img.naturalWidth;
        const dispH = Math.round(dispW * aspect);

        img.style.width = dispW + 'px';
        img.style.height = 'auto';
        wrap.style.width = dispW + 'px';
        wrap.style.height = dispH + 'px';

        overlayCanvas.width = dispW;
        overlayCanvas.height = dispH;
        overlayCanvas.style.width = dispW + 'px';
        overlayCanvas.style.height = dispH + 'px';

        obj.displayWidth = dispW;
        obj.displayHeight = dispH;

        updateImageOverlay(obj, wrap);
      };

      wrap.appendChild(img);
      wrap.appendChild(overlayCanvas);
      applyStyleToDom(obj, wrap);
      attachInteraction(wrap, obj);
      editorCanvas.appendChild(wrap);
      dom = wrap;
    }
    return dom;
  }

  // تحديث overlay للصور (تلوين أحرف الاسم داخل الصورة الشفافة فقط)
  function updateImageOverlay(obj, wrap){
    const imgEl = wrap.querySelector('img');
    const overlayCanvas = wrap.querySelector('.img-overlay-canvas');
    if(!imgEl || !overlayCanvas) return;

    const dispW = obj.displayWidth || parseInt(imgEl.style.width) || imgEl.naturalWidth;
    const dispH = obj.displayHeight || Math.round(imgEl.naturalHeight * (dispW / imgEl.naturalWidth));

    overlayCanvas.width = dispW;
    overlayCanvas.height = dispH;
    overlayCanvas.style.width = dispW + 'px';
    overlayCanvas.style.height = dispH + 'px';
    overlayCanvas.style.left = '0';
    overlayCanvas.style.top = '0';

    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0,0,dispW,dispH);

    if(obj.fillMode === 'gradient' && obj.gradient){
      const g = ctx.createLinearGradient(0,0,dispW,0);
      g.addColorStop(0, obj.gradient[0]);
      g.addColorStop(1, obj.gradient[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0,0,dispW,dispH);

      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(imgEl, 0, 0, dispW, dispH);
      ctx.globalCompositeOperation = 'source-over';
      overlayCanvas.style.opacity = 1;
    } else if(obj.fillMode === 'dress' && obj.dress){
      const dressImg = new Image();
      dressImg.crossOrigin = 'anonymous';
      dressImg.onload = () => {
        ctx.clearRect(0,0,dispW,dispH);
        ctx.drawImage(dressImg, 0, 0, dispW, dispH);
        ctx.globalCompositeOperation = 'destination-in';
        ctx.drawImage(imgEl, 0, 0, dispW, dispH);
        ctx.globalCompositeOperation = 'source-over';
        overlayCanvas.style.opacity = 1;
      };
      dressImg.onerror = ()=> { overlayCanvas.style.opacity = 0; };
      dressImg.src = obj.dress;
    } else if(obj.fillMode === 'solid' && obj.color){
      // لون ثابت للـ alpha فقط — نرسم طبقة باللون ثم نستخدم الصورة كقناع
      ctx.fillStyle = obj.color || '#000';
      ctx.fillRect(0,0,dispW,dispH);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(imgEl, 0, 0, dispW, dispH);
      ctx.globalCompositeOperation = 'source-over';
      overlayCanvas.style.opacity = 1;
    } else {
      overlayCanvas.style.opacity = 0;
      ctx.clearRect(0,0,dispW,dispH);
    }
  }

  // تطبيق ستايل المعاينة على DOM
  function applyStyleToDom(obj, dom){
    if(!dom) return;
    dom.style.transform = `rotate(${obj.rotation}rad)`;
    if(obj.type === 'text'){
      dom.style.fontFamily = obj.font || 'Reem Kufi';
      dom.style.fontSize = (obj.size || 48) + 'px';
      if(obj.fillMode === 'gradient' && obj.gradient){
        dom.style.background = `linear-gradient(90deg, ${obj.gradient[0]}, ${obj.gradient[1]})`;
        dom.style.webkitBackgroundClip = 'text';
        dom.style.color = 'transparent';
      } else if(obj.fillMode === 'dress' && obj.dress){
        // بالنسبة للنص: سنعرض معاينة تلبيس عبر canvas في التصدير؛ للمعاينة نجعل النص بلون داكن ثم نترك التصدير للـcanvas
        dom.style.color = '#000';
      } else if(obj.fillMode === 'solid'){
        dom.style.color = obj.color || '#000';
        dom.style.background = 'none';
        dom.style.webkitBackgroundClip = 'unset';
      }
    } else if(obj.type === 'image'){
      // تحديث طبقة overlay
      updateImageOverlay(obj, dom);
    }
  }

  // التفاعل: تحديد، سحب، تدوير
  function attachInteraction(dom, obj){
    dom.style.position = 'absolute';
    dom.style.left = (obj.x||50) + 'px';
    dom.style.top  = (obj.y||60) + 'px';

    // ازالة قبلاً
    const oldHandle = dom.querySelector('.rotate-handle');
    if(oldHandle) oldHandle.remove();

    const handle = document.createElement('div');
    handle.className = 'rotate-handle';
    handle.innerHTML = '⤾';
    dom.appendChild(handle);

    // تحديد العنصر حتى لو نقرنا على الصورة (لأن الصورة pointer-events = none)
    dom.addEventListener('mousedown', (e)=>{
      e.stopPropagation();
      selectElement(dom, obj);
    });

    // سحب
    let dragging=false, sx=0, sy=0, sl=0, st=0;
    dom.addEventListener('pointerdown', (ev)=>{
      if(ev.target === handle) return;
      dragging = true;
      sx = ev.clientX; sy = ev.clientY;
      sl = parseFloat(dom.style.left) || 0;
      st = parseFloat(dom.style.top) || 0;
      dom.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });
    window.addEventListener('pointermove', (ev)=>{
      if(!dragging) return;
      const nx = sl + (ev.clientX - sx);
      const ny = st + (ev.clientY - sy);
      dom.style.left = nx + 'px';
      dom.style.top = ny + 'px';
      obj.x = nx; obj.y = ny;
    });
    window.addEventListener('pointerup', ()=> dragging=false);

    // تدوير
    handle.addEventListener('pointerdown', (ev)=>{
      ev.stopPropagation();
      const rect = dom.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      const startAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx) - (obj.rotation || 0);
      function onMove(e2){
        const ang = Math.atan2(e2.clientY - cy, e2.clientX - cx) - startAngle;
        obj.rotation = ang;
        dom.style.transform = `rotate(${ang}rad)`;
      }
      function onUp(){ window.removeEventListener('pointermove', onMove); window.removeEventListener('pointerup', onUp); }
      window.addEventListener('pointermove', onMove);
      window.addEventListener('pointerup', onUp);
    });
  }

  // تحديد عنصر
  function selectElement(dom, obj){
    document.querySelectorAll('.canvas-item.selected').forEach(el=>el.classList.remove('selected'));
    dom.classList.add('selected');
    SELECTED = {dom,obj};
  }

  // إلغاء التحديد عند النقر على المساحة الفارغة
  editorCanvas.addEventListener('mousedown', (e)=>{
    if(e.target === editorCanvas){
      document.querySelectorAll('.canvas-item.selected').forEach(el=>el.classList.remove('selected'));
      SELECTED = null;
    }
  });

  // زر إضافة النص/الصورة
  btnAdd.addEventListener('click', ()=>{
    if(modeSelect.value === 'text'){
      const txt = textInput.value.trim();
      if(!txt) return alert('أدخل نصًا أولاً');
      const obj = createElementObject('text',{ text: txt, font: fontSelect.value });
      renderElement(obj);
      textInput.value = '';
    } else {
      const f = fileImage.files && fileImage.files[0];
      if(!f) return alert('اختر صورة شفافة من جهازك');
      const reader = new FileReader();
      reader.onload = (ev)=>{
        const obj = createElementObject('image',{ img: ev.target.result });
        renderElement(obj);
      };
      reader.readAsDataURL(f);
      fileImage.value = '';
    }
  });

  // تغيير ظهور حقول حسب اختيار النص/الصورة
  modeSelect.addEventListener('change', ()=>{
    if(modeSelect.value === 'text'){
      textInputWrap.style.display = '';
      fileInputWrap.style.display = 'none';
    } else {
      textInputWrap.style.display = 'none';
      fileInputWrap.style.display = '';
    }
  });

  // فتح الشبكة (تدرجات / تلبيسات) حسب الاختيار
  btnShowPalette.addEventListener('click', ()=>{
    openPopup(colorMode.value);
  });

  function openPopup(type){
    popupContainer.innerHTML = '';
    popupContainer.classList.add('open');
    popupContainer.style.display = 'flex';
    const pop = document.createElement('div'); pop.className='popup';
    const head = document.createElement('div'); head.className='popup-head';
    const title = document.createElement('h3'); title.textContent = type === 'gradient' ? 'اختر تدرجاً' : 'اختر تلبيسة';
    const close = document.createElement('button'); close.className='btn'; close.textContent='إغلاق';
    close.addEventListener('click', closePopup);
    head.appendChild(title); head.appendChild(close); pop.appendChild(head);

    const body = document.createElement('div');

    if(type === 'gradient'){
      const grid = document.createElement('div'); grid.className = 'grad-grid';
      GRADIENTS.forEach(g=>{
        const s = document.createElement('div'); s.className='grad-sample';
        s.style.background = `linear-gradient(90deg, ${g[0]}, ${g[1]})`;
        s.addEventListener('click', ()=>{
          applyGradientToSelected(g);
          closePopup();
        });
        grid.appendChild(s);
      });
      body.appendChild(grid);
    } else if(type === 'dress'){
      const grid = document.createElement('div'); grid.className = 'dress-grid';
      DRESSUPS.forEach(url=>{
        const d = document.createElement('div'); d.className='dress-item';
        const im = document.createElement('img'); im.src = url;
        d.appendChild(im);
        d.addEventListener('click', ()=>{
          applyDressToSelected(url);
          closePopup();
        });
        grid.appendChild(d);
      });
      body.appendChild(grid);
    } else if(type === 'solid'){
      const info = document.createElement('div');
      info.textContent = 'اختر لون ثابت (سيطبق على أحرف النص أو على أحرف الاسم داخل الصورة الشفافة).';
      body.appendChild(info);
      // يمكن اضافة color picker هنا إذا رغبت لاحقًا
    }

    pop.appendChild(body);
    popupContainer.appendChild(pop);
  }
  function closePopup(){ popupContainer.classList.remove('open'); popupContainer.style.display='none'; popupContainer.innerHTML=''; }

  // تطبيق تدرج/تلبيس على المحدد (أو على العنصر الجاري اضافته)
  function applyGradientToSelected(g){
    if(!SELECTED){ alert('اختر العنصر أولاً'); return; }
    const {obj,dom} = SELECTED;
    obj.fillMode = 'gradient';
    obj.gradient = g;
    applyStyleToDom(obj, dom);
    if(obj.type === 'image') updateImageOverlay(obj, dom);
  }
  function applyDressToSelected(url){
    if(!SELECTED){ alert('اختر العنصر أولاً'); return; }
    const {obj,dom} = SELECTED;
    obj.fillMode = 'dress';
    obj.dress = url;
    applyStyleToDom(obj, dom);
    if(obj.type === 'image') updateImageOverlay(obj, dom);
  }

  // حذف المحدد
  deleteSelected.addEventListener('click', ()=>{
    if(!SELECTED) return;
    const {dom,obj} = SELECTED;
    dom.remove();
    const idx = ELEMENTS.findIndex(e=>e.id===obj.id);
    if(idx !== -1) ELEMENTS.splice(idx,1);
    SELECTED = null;
  });

  // التصدير: رسم دقيق على Canvas مطابق للمعاينة
  downloadImage.addEventListener('click', async ()=>{
    try {
      const rect = editorCanvas.getBoundingClientRect();
      const W = Math.max(800, Math.round(rect.width));
      const H = Math.max(400, Math.round(rect.height));
      const out = document.createElement('canvas');
      out.width = W; out.height = H;
      const ctx = out.getContext('2d');
      ctx.clearRect(0,0,W,H);

      // ارسم كل العناصر بترتيب الDOM
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
          const bboxW = dom.offsetWidth || (fontSize * (obj.text ? obj.text.length : 1) / 1.6);
          const bboxH = dom.offsetHeight || fontSize;
          const cx = x + bboxW/2, cy = y + bboxH/2;
          ctx.translate(cx, cy);
          ctx.rotate(obj.rotation || 0);
          ctx.translate(-cx, -cy);

          ctx.font = `${fontSize}px "${obj.font || 'Reem Kufi'}"`;
          ctx.textAlign = 'left';
          ctx.textBaseline = 'top';

          if(obj.fillMode === 'solid' || !obj.gradient){
            ctx.fillStyle = obj.color || '#000';
            ctx.fillText(obj.text, x, y);
          } else if(obj.fillMode === 'gradient' && obj.gradient){
            const g = ctx.createLinearGradient(x, y, x + bboxW, y);
            g.addColorStop(0, obj.gradient[0]);
            g.addColorStop(1, obj.gradient[1]);
            ctx.fillStyle = g;
            ctx.fillText(obj.text, x, y);
          } else if(obj.fillMode === 'dress' && obj.dress){
            // نص -> نرسم القناع ثم نضع التلبيسة عليه
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
            await new Promise((res)=>{
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
              img.onerror = ()=> { ctx.fillStyle = '#000'; ctx.fillText(obj.text, x, y); res(); };
              img.src = obj.dress;
            });
          }
          ctx.restore();
        } else if(obj.type === 'image'){
          const wrap = dom;
          const imgEl = wrap.querySelector('img');
          if(!imgEl) continue;
          await new Promise((res)=>{
            const img = new Image();
            img.crossOrigin = "anonymous";
            img.onload = ()=>{
              const left = Math.round(parseFloat(wrap.style.left)||obj.x||0);
              const top = Math.round(parseFloat(wrap.style.top)||obj.y||0);
              const drawW = obj.displayWidth || parseInt(imgEl.style.width) || img.naturalWidth;
              const drawH = obj.displayHeight || Math.round(img.naturalHeight * (drawW / img.naturalWidth));

              if(obj.fillMode === 'gradient' && obj.gradient){
                const tmp = document.createElement('canvas');
                tmp.width = drawW; tmp.height = drawH;
                const tctx = tmp.getContext('2d');
                const g = tctx.createLinearGradient(0,0,tmp.width,0);
                g.addColorStop(0, obj.gradient[0]);
                g.addColorStop(1, obj.gradient[1]);
                tctx.fillStyle = g;
                tctx.fillRect(0,0,tmp.width,tmp.height);
                tctx.globalCompositeOperation = 'destination-in';
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
                  tctx.drawImage(dressImg, 0, 0, tmp.width, tmp.height);
                  tctx.globalCompositeOperation = 'destination-in';
                  tctx.drawImage(img, 0, 0, tmp.width, tmp.height);
                  ctx.drawImage(tmp, left, top, tmp.width, tmp.height);
                  res();
                };
                dressImg.onerror = ()=> { ctx.drawImage(img, left, top, drawW, drawH); res(); };
                dressImg.src = obj.dress;
              } else {
                // رسم الصورة كما هي (الخلفية تبقى شفافة)
                ctx.drawImage(img, left, top, drawW, drawH);
                res();
              }
            };
            img.onerror = ()=> res();
            img.src = imgEl.src;
          });
        }
      } // end loop

      // حفظ الصورة
      const dataUrl = out.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = 'design.png';
      a.click();
    } catch(err){
      console.error(err);
      alert('خطأ أثناء التصدير: '+err.message);
    }
  });

  // عند تحميل صفحة: اربط الحدث لاختيار نوع اللون الافتراضي
  colorMode.addEventListener('change', ()=>{ /* يمكن اضافة منطق هنا */ });

  // إخراج: فتح popup / اغلاق
  popupContainer.addEventListener('click', (e)=>{
    if(e.target === popupContainer) closePopup();
  });

  // وظيفة مساعدة لاظهار رسالة في السجل (debug)
  function log(...r){ /* console.log(...r); */ }

  // جاهز - نهاية DOMContentLoaded
});
