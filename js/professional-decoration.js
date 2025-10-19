/* professional-decoration.js - نهائي: تلوين الأحرف على الشفافية + جلب خطوط وتلبيسات من GitHub API
   تم إضافة: "التلبيس الذكي التلقائي" كما طُلب — لا أزرار جديدة، لا تأثيرات إضافية، فقط تطبيق التلبيسة
   تلقائياً على العناصر (نصوص/صور) عندما تتوفر تلبيسات من المستودع.

   تحسينات موبايل مضافة:
   - ضبط أحجام افتراضية أصغر على الشاشات الصغيرة
   - استخدام عرض editorCanvas لحساب أقصى عرض للصور بدلاً من قيمة ثابتة
   - دعم إيماءات اللمس: سحب، تدوير، وتكبير/تصغير بعنصرين (pinch-to-zoom)
   - تكبير مقبض التدوير على أجهزة اللمس لتسهيل التفاعل

   إصلاحات أساسية:
   - عند إضافة صورة من الملف المحلي: الآن نحمّل الصورة مؤقتاً وننتظر naturalWidth/complete قبل رندرها في الـDOM
   - updateImageOverlay صار يتحقق من جاهزية img المصدر ويعيد المحاولة أو ينتظر حدث load
   - الحفاظ على الخلفية/شفافية الصورة: التدرج/التلبيسة تُطبّق فقط على ألفا (destination-in)
*/

document.addEventListener('DOMContentLoaded', () => {
  // عناصر DOM
  const toggleSidebar = document.getElementById('toggleSidebar');
  const siteSidebar = document.getElementById('siteSidebar');
  const closeSidebar = document.getElementById('closeSidebar');

  const editorCanvas = document.getElementById('editorCanvas');
  const modeSelect = document.getElementById('modeSelect');
  const textInput = document.getElementById('textInput');
  const fontListBtn = document.getElementById('openFontList');
  const fontListPanel = document.getElementById('fontList');
  const fileImage = document.getElementById('fileImage');
  const btnAdd = document.getElementById('btnAdd');
  const btnGradients = document.getElementById('openColorGrid');
  const btnDressups = document.getElementById('openDressGrid');
  const btnGradientsImg = document.getElementById('openColorGridImg');
  const btnDressupsImg = document.getElementById('openDressGridImg');
  const downloadImage = document.getElementById('downloadImage');
  const popupContainer = document.getElementById('popupContainer');
  const deleteSelected = document.getElementById('deleteSelected');

  // conditionals (باقي عناصر الواجهة إن وُجدت)
  const textControls = document.getElementById('textControls');
  const imageControls = document.getElementById('imageControls');

  // حالة
  let SELECTED = null;
  const ELEMENTS = [];
  let AVAILABLE_FONTS = [];     // {name, url}
  let AVAILABLE_DRESS = [];     // urls

  // ذكي: تذكرنا إذا أنهينا تحميل التلبيسات من الريبو
  let DRESSES_LOADED = false;

  // ضبط افتراضي يعتمد على حجم الجهاز (موبايل أقل حجم)
  const isMobileLike = window.innerWidth <= 768;
  const DEFAULT_FONT_SIZE = isMobileLike ? 48 : 72;
  const ROTATE_HANDLE_TOUCH_SIZE = isMobileLike ? 44 : 34; // نجعل المقبض أكبر على اللمس

  const GRADIENTS = (function(){
    const out = [];
    for(let i=0;i<50;i++){
      const a = `hsl(${(i*360/50)|0} 80% 45%)`;
      const b = `hsl(${((i*360/50)+40)|0} 80% 60%)`;
      out.push([a,b]);
    }
    // metallics
    out.push(['#f3c976','#b8862a']);
    out.push(['#e6e9ec','#b9bfc6']);
    out.push(['#d4b06f','#8b5a2b']);
    return out;
  })();

  // --- Sidebar toggle (from right) ---
  toggleSidebar && toggleSidebar.addEventListener('click', ()=> {
    siteSidebar.classList.toggle('active');
  });
  closeSidebar && closeSidebar.addEventListener('click', ()=> siteSidebar.classList.remove('active'));

  // --- Utility: parse repo from location (for GitHub Pages) ---
  function detectGitHubRepo(){
    try {
      const host = window.location.hostname;
      const path = window.location.pathname.split('/').filter(Boolean);
      if(!host.includes('github.io')) return null;
      const owner = host.split('.github.io')[0];
      const repo = path.length ? path[0] : null;
      if(owner && repo) return {owner, repo};
      return null;
    } catch(e){ return null; }
  }

  const repoInfo = detectGitHubRepo();
  const FALLBACK_REPO = { owner: repoInfo ? repoInfo.owner : null, repo: repoInfo ? repoInfo.repo : null };

  // --- GitHub API helpers to list folder files ---
  async function listGitHubFolder(owner, repo, folderPath){
    if(!owner || !repo) return null;
    const api = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(folderPath)}`;
    try {
      const res = await fetch(api);
      if(!res.ok) return null;
      const json = await res.json();
      return json;
    } catch(err){
      console.warn('GitHub API list error', err);
      return null;
    }
  }

  // --- load fonts dynamically from assets/fonts/ using GitHub raw URLs ---
  async function loadFontsFromRepo(){
    const owner = FALLBACK_REPO.owner, repo = FALLBACK_REPO.repo;
    if(!owner || !repo) return;
    const list = await listGitHubFolder(owner, repo, 'assets/fonts');
    if(!list || !Array.isArray(list)) return;
    const fonts = list.filter(f => f.type === 'file' && /\.(ttf|otf|woff2?|woff)$/i.test(f.name));
    for(const f of fonts){
      const fontName = f.name.replace(/\.[^/.]+$/, '');
      const url = f.download_url;
      const style = document.createElement('style');
      style.textContent = `@font-face{ font-family: "${fontName}"; src: url("${url}"); font-display: swap; }`;
      document.head.appendChild(style);
      AVAILABLE_FONTS.push({name: fontName, url});
    }
    refreshFontListUI();
  }

  function refreshFontListUI(){
    fontListPanel.innerHTML = '';
    if(AVAILABLE_FONTS.length === 0){
      const p = document.createElement('div'); p.textContent = 'لا توجد خطوط في المجلد assets/fonts/'; p.className='panel-empty';
      fontListPanel.appendChild(p);
      return;
    }
    AVAILABLE_FONTS.forEach(f=>{
      const btn = document.createElement('button');
      btn.className = 'font-item';
      btn.textContent = f.name;
      btn.addEventListener('click', ()=>{
        applyFontToSelected(f.name);
        fontListPanel.classList.add('hidden');
      });
      fontListPanel.appendChild(btn);
    });
  }

  // --- load dressups from repo ---
  async function loadDressupsFromRepo(){
    const owner = FALLBACK_REPO.owner, repo = FALLBACK_REPO.repo;
    if(!owner || !repo) { DRESSES_LOADED = true; return; }
    const list = await listGitHubFolder(owner, repo, 'assets/Dress up');
    if(!list || !Array.isArray(list)) {
      DRESSES_LOADED = true;
      return;
    }
    const imgs = list.filter(f => f.type === 'file' && /\.(png|jpe?g|webp|svg)$/i.test(f.name));
    AVAILABLE_DRESS.length = 0;
    imgs.forEach(i=> AVAILABLE_DRESS.push(i.download_url));
    DRESSES_LOADED = true;

    try {
      ELEMENTS.forEach(e=>{
        if(e && e.fillMode === 'solid' && AVAILABLE_DRESS.length){
          const dom = editorCanvas.querySelector(`[data-id="${e.id}"]`);
          if(dom) applySmartDressToObj(e, dom);
          else {
            e.fillMode = 'dress';
            e.dress = AVAILABLE_DRESS[0];
          }
        }
      });
    } catch(err){
      console.warn('smart-dress apply after load failed', err);
    }
  }

  (async ()=>{
    await loadFontsFromRepo();
    await loadDressupsFromRepo();
  })();

  // open font list toggle
  fontListBtn && fontListBtn.addEventListener('click', (e)=>{
    fontListPanel.classList.toggle('hidden');
  });

  // --- Smart Dress helper ---
  function applySmartDressToObj(obj, dom){
    if(!obj || !dom) return;
    if(!AVAILABLE_DRESS || AVAILABLE_DRESS.length === 0) return;
    if(!obj.dress) obj.dress = AVAILABLE_DRESS[0];
    obj.fillMode = 'dress';
    applyStyleToDom(obj, dom);
    dom.classList.add('dressed');
  }

  // --- Editor core: element objects + rendering ---
  function createElementObject(type, data){
    const id = 'el_'+(Date.now() + Math.floor(Math.random()*999));
    const base = {
      id, type, x:80, y:80, rotation:0, scale:1,
      font: AVAILABLE_FONTS.length?AVAILABLE_FONTS[0].name:'ReemKufiLocalFallback',
      size: DEFAULT_FONT_SIZE, stroke:0, strokeColor:'#000', fillMode:'solid', gradient:null, dress:null, img:null,
      displayWidth:null, displayHeight:null, text:''
    };
    const obj = Object.assign(base, data||{});
    if(DRESSES_LOADED && AVAILABLE_DRESS.length && obj.fillMode === 'solid'){
      obj.fillMode = 'dress';
      obj.dress = AVAILABLE_DRESS[0];
    }
    ELEMENTS.push(obj);
    return obj;
  }

  function renderElement(obj){
    let dom;
    if(obj.type === 'text'){
      dom = document.createElement('div');
      dom.className = 'canvas-item text-item';
      dom.textContent = obj.text || '';
      dom.style.fontFamily = obj.font;
      dom.style.fontSize = (obj.size || DEFAULT_FONT_SIZE) + 'px';
      // crucial to avoid text clipping/flicker: ensure inline-block and no wrapping
      dom.style.display = 'inline-block';
      dom.style.whiteSpace = 'nowrap';
      dom.style.left = obj.x + 'px';
      dom.style.top = obj.y + 'px';
      dom.dataset.id = obj.id;
      dom.style.pointerEvents = 'auto';
      applyStyleToDom(obj, dom);
      attachInteraction(dom, obj);
      editorCanvas.appendChild(dom);

      if(obj.fillMode === 'dress' && obj.dress){
        dom.classList.add('dressed');
        applyStyleToDom(obj, dom);
      }
    } else if(obj.type === 'image'){
      const wrap = document.createElement('div');
      wrap.className = 'canvas-item img-wrap';
      wrap.style.left = obj.x + 'px';
      wrap.style.top = obj.y + 'px';
      wrap.dataset.id = obj.id;
      wrap.tabIndex = 0; // make focusable for accessibility / mobile taps

      const img = document.createElement('img');
      img.src = obj.img;
      img.alt = '';
      img.style.display = 'block';
      img.style.pointerEvents = 'none';

      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.className = 'img-overlay-canvas';
      overlayCanvas.style.position = 'absolute';
      overlayCanvas.style.left = '0';
      overlayCanvas.style.top = '0';
      overlayCanvas.style.pointerEvents = 'none';
      overlayCanvas.style.opacity = 0;

      const finalizeImageLayout = ()=>{
        const canvasPadding = 40;
        const editorW = Math.max(200, editorCanvas.clientWidth || 300);
        const maxw = Math.min(Math.max(200, editorW - canvasPadding), img.naturalWidth || editorW);
        const dispW = obj.displayWidth || Math.min(480, maxw);
        const aspect = img.naturalHeight && img.naturalWidth ? (img.naturalHeight / img.naturalWidth) : 1;
        const dispH = Math.round(dispW * aspect);

        img.style.width = dispW + 'px';
        wrap.style.width = dispW + 'px';
        wrap.style.height = dispH + 'px';

        overlayCanvas.width = dispW; overlayCanvas.height = dispH;
        overlayCanvas.style.width = dispW + 'px'; overlayCanvas.style.height = dispH + 'px';
        obj.displayWidth = dispW; obj.displayHeight = dispH;
        // ensure overlay drawn after sizes applied
        updateImageOverlay(obj, wrap);
      };

      if(img.complete && img.naturalWidth && img.naturalWidth > 0){
        setTimeout(finalizeImageLayout, 0);
      } else {
        img.addEventListener('load', function _onLoad(){
          img.removeEventListener('load', _onLoad);
          finalizeImageLayout();
        });
        img.addEventListener('error', function _onErr(){
          img.removeEventListener('error', _onErr);
          obj.displayWidth = obj.displayWidth || Math.min(300, editorCanvas.clientWidth - 40);
          const fallbackH = Math.round((obj.displayWidth || 300) * 0.75);
          wrap.style.width = (obj.displayWidth || 300) + 'px';
          wrap.style.height = fallbackH + 'px';
          overlayCanvas.width = obj.displayWidth || 300;
          overlayCanvas.height = fallbackH;
          overlayCanvas.style.width = (obj.displayWidth || 300) + 'px';
          overlayCanvas.style.height = fallbackH + 'px';
        });
      }

      wrap.appendChild(img);
      wrap.appendChild(overlayCanvas);
      applyStyleToDom(obj, wrap);
      attachInteraction(wrap, obj);
      editorCanvas.appendChild(wrap);
      dom = wrap;

      if(obj.fillMode === 'dress' && obj.dress){
        dom.classList.add('dressed');
        updateImageOverlay(obj, dom);
      }
    }
    return dom;
  }

  // نهاية جزء العرض — تكملة الدفعة 2 تأتي بعد هذا الجزء
   // update overlay for image (gradient/dress applied to alpha only)
  function updateImageOverlay(obj, wrap){
    if(!wrap) return;
    const imgEl = wrap.querySelector('img');
    const overlayCanvas = wrap.querySelector('.img-overlay-canvas');
    if(!imgEl || !overlayCanvas) return;

    if(!imgEl.complete || (imgEl.naturalWidth === 0 && imgEl.naturalHeight === 0)){
      const once = ()=>{
        imgEl.removeEventListener('load', once);
        imgEl.removeEventListener('error', once);
        setTimeout(()=> updateImageOverlay(obj, wrap), 20);
      };
      imgEl.addEventListener('load', once);
      imgEl.addEventListener('error', once);
      return;
    }

    const dispW = Math.round((obj.displayWidth || parseInt(imgEl.style.width) || imgEl.naturalWidth) * (obj.scale || 1));
    const dispH = Math.round((obj.displayHeight || Math.round(imgEl.naturalHeight * (dispW / imgEl.naturalWidth))) * (obj.scale || 1));

    overlayCanvas.width = dispW;
    overlayCanvas.height = dispH;
    overlayCanvas.style.width = dispW + 'px';
    overlayCanvas.style.height = dispH + 'px';
    overlayCanvas.style.left = '0px';
    overlayCanvas.style.top = '0px';
    const ctx = overlayCanvas.getContext('2d');
    ctx.clearRect(0,0,dispW,dispH);

    if(obj.fillMode === 'gradient' && obj.gradient){
      const g = ctx.createLinearGradient(0,0,dispW,0);
      g.addColorStop(0, obj.gradient[0]); g.addColorStop(1, obj.gradient[1]);
      ctx.fillStyle = g; ctx.fillRect(0,0,dispW,dispH);
      ctx.globalCompositeOperation = 'destination-in';
      try { ctx.drawImage(imgEl, 0, 0, dispW, dispH); } catch(e){}
      ctx.globalCompositeOperation = 'source-over';
      overlayCanvas.style.opacity = 1;
    } else if(obj.fillMode === 'dress' && obj.dress){
      const dimg = new Image(); dimg.crossOrigin = 'anonymous';
      dimg.onload = ()=>{
        ctx.clearRect(0,0,dispW,dispH);
        try { ctx.drawImage(dimg, 0, 0, dispW, dispH); } catch(e){}
        ctx.globalCompositeOperation = 'destination-in';
        try { ctx.drawImage(imgEl, 0, 0, dispW, dispH); } catch(e){}
        ctx.globalCompositeOperation = 'source-over';
        overlayCanvas.style.opacity = 1;
      };
      dimg.onerror = ()=> { overlayCanvas.style.opacity = 0; };
      dimg.src = obj.dress;
    } else {
      overlayCanvas.style.opacity = 0;
    }
  }

  // apply styles to DOM item
  function applyStyleToDom(obj, dom){
    if(!dom) return;
    const sc = typeof obj.scale === 'number' ? obj.scale : 1;
    const rot = obj.rotation || 0;
    dom.style.transform = `rotate(${rot}rad) scale(${sc})`;

    if(obj.type === 'text'){
      // default reset
      dom.style.webkitBackgroundClip = 'unset';
      dom.style.backgroundImage = '';
      dom.style.color = obj.color || '#000';
      dom.style.webkitTextFillColor = obj.color || '#000';

      if(obj.fillMode === 'solid' || (!obj.gradient && obj.fillMode !== 'dress')){
        dom.style.color = obj.color || '#000';
        dom.style.webkitTextFillColor = obj.color || '#000';
      } else if(obj.fillMode === 'gradient' && obj.gradient){
        const g = obj.gradient;
        dom.style.background = `linear-gradient(90deg, ${g[0]}, ${g[1]})`;
        dom.style.webkitBackgroundClip = 'text';
        dom.style.backgroundClip = 'text';
        dom.style.color = 'transparent';
        dom.style.webkitTextFillColor = 'transparent';
      } else if(obj.fillMode === 'dress' && obj.dress){
        // For dress: wait for font readiness to get accurate measure
        // then draw dress onto tmp canvas and apply as background-image (dataURL)
        const fontSize = (obj.size || DEFAULT_FONT_SIZE) * (obj.scale || 1);
        const text = obj.text || '';

        // ensure fonts loaded (best-effort)
        const drawDress = ()=>{
          try {
            const tmp = document.createElement('canvas');
            const tctx = tmp.getContext('2d');
            tctx.font = `${fontSize}px "${obj.font}"`;
            // measure text width (fallback if unavailable)
            let w = Math.max(1, Math.ceil(tctx.measureText(text).width));
            let h = Math.max(1, Math.ceil(fontSize * 1.1));
            // add small padding to avoid clipping
            w = Math.ceil(w + 8); h = Math.ceil(h + 8);
            tmp.width = w; tmp.height = h;
            // draw dress image then clip by text alpha
            const dimg = new Image(); dimg.crossOrigin='anonymous';
            dimg.onload = ()=>{
              const t2 = tmp.getContext('2d');
              t2.clearRect(0,0,w,h);
              try { t2.drawImage(dimg,0,0,w,h); } catch(e){}
              t2.globalCompositeOperation = 'destination-in';
              t2.fillStyle = '#000';
              t2.font = `${fontSize}px "${obj.font}"`;
              t2.textBaseline = 'top';
              // draw text mask (position adjust)
              t2.fillText(text, 4, 4 + (fontSize*0.0));
              // apply as background image
              try {
                dom.style.backgroundImage = `url(${tmp.toDataURL()})`;
                dom.style.webkitBackgroundClip = 'text';
                dom.style.backgroundClip = 'text';
                dom.style.color = 'transparent';
              } catch(e){
                dom.style.color = obj.color || '#000';
              }
            };
            dimg.onerror = ()=>{
              dom.style.color = obj.color || '#000';
            };
            dimg.src = obj.dress;
          } catch(e){
            dom.style.color = obj.color || '#000';
          }
        };

        // attempt to wait for fonts to be available for accurate measure
        if(document.fonts && document.fonts.ready){
          document.fonts.ready.then(()=>{
            if(obj.font){
              document.fonts.load(`${fontSize}px "${obj.font}"`).finally(drawDress);
            } else drawDress();
          }).catch(drawDress);
        } else {
          drawDress();
        }
      }
    } else if(obj.type === 'image'){
      updateImageOverlay(obj, dom);
    }
  }

  // attach interaction: select, drag, rotate, pinch-to-scale
  function attachInteraction(dom, obj){
    dom.style.left = (obj.x||50) + 'px';
    dom.style.top = (obj.y||50) + 'px';
    dom.style.position = 'absolute';

    const old = dom.querySelector('.rotate-handle'); if(old) old.remove();
    const handle = document.createElement('div'); handle.className='rotate-handle'; handle.textContent='⤾';
    handle.style.width = ROTATE_HANDLE_TOUCH_SIZE + 'px';
    handle.style.height = ROTATE_HANDLE_TOUCH_SIZE + 'px';
    handle.style.top = (-ROTATE_HANDLE_TOUCH_SIZE/2) + 'px';
    handle.style.left = (-ROTATE_HANDLE_TOUCH_SIZE/2) + 'px';
    dom.appendChild(handle);

    dom.addEventListener('mousedown', (e)=> {
      e.stopPropagation();
      selectElement(dom, obj);
    });

    let dragging=false, sx=0, sy=0, sl=0, st=0;
    dom.addEventListener('pointerdown', (ev)=>{
      if(ev.target === handle) return;
      dragging=true;
      sx = ev.clientX; sy = ev.clientY;
      sl = parseFloat(dom.style.left) || 0;
      st = parseFloat(dom.style.top) || 0;
      dom.setPointerCapture && dom.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });
    window.addEventListener('pointermove', (ev)=>{
      if(!dragging) return;
      const nx = sl + (ev.clientX - sx);
      const ny = st + (ev.clientY - sy);
      dom.style.left = nx + 'px'; dom.style.top = ny + 'px';
      obj.x = nx; obj.y = ny;
    });
    window.addEventListener('pointerup', ()=> dragging=false);

    handle.addEventListener('pointerdown', (ev)=>{
      ev.stopPropagation();
      const rect = dom.getBoundingClientRect();
      const cx = rect.left + rect.width/2;
      const cy = rect.top + rect.height/2;
      const startAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx) - (obj.rotation||0);
      function move(e2){
        const angle = Math.atan2(e2.clientY - cy, e2.clientX - cx) - startAngle;
        obj.rotation = angle;
        dom.style.transform = `rotate(${angle}rad) scale(${obj.scale || 1})`;
      }
      function up(){
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });

    // touch gestures for pinch/rotate
    let gesture = { active:false, startDist:0, startAngle:0, origScale: obj.scale||1, origRotation: obj.rotation||0 };
    dom.addEventListener('touchstart', (ev)=>{
      if(ev.touches.length === 1){
        selectElement(dom, obj);
      } else if(ev.touches.length === 2){
        ev.preventDefault();
        gesture.active = true;
        gesture.origScale = obj.scale || 1;
        gesture.origRotation = obj.rotation || 0;
        const t1 = ev.touches[0]; const t2 = ev.touches[1];
        const dx = t2.clientX - t1.clientX; const dy = t2.clientY - t1.clientY;
        gesture.startDist = Math.hypot(dx, dy);
        gesture.startAngle = Math.atan2(dy, dx);
      }
    }, { passive: false });

    dom.addEventListener('touchmove', (ev)=>{
      if(!gesture.active || ev.touches.length !== 2) return;
      ev.preventDefault();
      const t1 = ev.touches[0]; const t2 = ev.touches[1];
      const dx = t2.clientX - t1.clientX; const dy = t2.clientY - t1.clientY;
      const dist = Math.hypot(dx, dy); const angle = Math.atan2(dy, dx);
      const factor = dist / (gesture.startDist || dist || 1);
      obj.scale = Math.max(0.3, Math.min(3, gesture.origScale * factor));
      const deltaAngle = angle - gesture.startAngle;
      obj.rotation = gesture.origRotation + deltaAngle;
      dom.style.transform = `rotate(${obj.rotation}rad) scale(${obj.scale})`;
      if(obj.type === 'image') updateImageOverlay(obj, dom);
    }, { passive: false });

    dom.addEventListener('touchend', (ev)=>{
      if(ev.touches.length < 2) gesture.active = false;
    });
  }

  // select element visually
  function selectElement(dom, obj){
    document.querySelectorAll('.canvas-item.selected').forEach(e=>e.classList.remove('selected'));
    dom.classList.add('selected');
    SELECTED = {dom,obj};
  }

  // deselect all on canvas click
  editorCanvas.addEventListener('mousedown', (e)=>{
    if(e.target === editorCanvas){
      document.querySelectorAll('.canvas-item.selected').forEach(el=>el.classList.remove('selected'));
      SELECTED = null;
    }
  });

  // add element
  btnAdd.addEventListener('click', ()=>{
    if(modeSelect.value === 'text'){
      const txt = textInput.value.trim();
      if(!txt) return alert('أدخل نصًا أولاً');
      const obj = createElementObject('text',{ text: txt, font: (AVAILABLE_FONTS[0] ? AVAILABLE_FONTS[0].name : 'ReemKufiLocalFallback')});
      const dom = renderElement(obj);
      const lastDom = editorCanvas.querySelector(`[data-id="${obj.id}"]`);
      if(lastDom) selectElement(lastDom,obj);
      if(DRESSES_LOADED && AVAILABLE_DRESS.length && obj.fillMode === 'dress'){
        applySmartDressToObj(obj, dom || lastDom);
      }
      textInput.value='';
    } else {
      const f = fileImage.files && fileImage.files[0];
      if(!f) return alert('اختر صورة شفافة من جهازك');

      // preload image to ensure sizes before rending DOM (fixes missing preview / interactivity)
      const reader = new FileReader();
      reader.onload = (ev)=>{
        const dataUrl = ev.target.result;
        const preload = new Image();
        preload.onload = ()=>{
          const obj = createElementObject('image',{ img: dataUrl });
          const canvasPadding = 40;
          const editorW = Math.max(200, editorCanvas.clientWidth || 300);
          const maxw = Math.min(Math.max(200, editorW - canvasPadding), preload.naturalWidth || editorW);
          obj.displayWidth = Math.min(480, maxw);
          obj.displayHeight = Math.round(obj.displayWidth * (preload.naturalHeight / preload.naturalWidth));
          const dom = renderElement(obj);
          if(DRESSES_LOADED && AVAILABLE_DRESS.length && obj.fillMode === 'dress'){
            applySmartDressToObj(obj, dom);
          }
          const lastDom = editorCanvas.querySelector(`[data-id="${obj.id}"]`);
          if(lastDom) selectElement(lastDom,obj);
        };
        preload.onerror = ()=>{
          const obj = createElementObject('image',{ img: dataUrl });
          const dom = renderElement(obj);
          if(DRESSES_LOADED && AVAILABLE_DRESS.length && obj.fillMode === 'dress'){
            applySmartDressToObj(obj, dom);
          }
          const lastDom = editorCanvas.querySelector(`[data-id="${obj.id}"]`);
          if(lastDom) selectElement(lastDom,obj);
        };
        preload.src = dataUrl;
      };
      reader.readAsDataURL(f);
      fileImage.value = '';
    }
  });

  // delete selected
  deleteSelected.addEventListener('click', ()=>{
    if(!SELECTED) return alert('اختر عنصراً أولاً');
    const {dom,obj} = SELECTED;
    dom.remove();
    const idx = ELEMENTS.findIndex(e=>e.id===obj.id);
    if(idx!==-1) ELEMENTS.splice(idx,1);
    SELECTED = null;
  });

  // OPEN POPUPS: gradients or dress list
  function openPopup(type, targetObj){
    popupContainer.innerHTML = '';
    popupContainer.classList.add('open');
    popupContainer.setAttribute('aria-hidden','false');
    const pop = document.createElement('div'); pop.className='popup';
    const head = document.createElement('div'); head.className='popup-head';
    const title = document.createElement('h3'); title.textContent = type==='grad' ? 'اختر تدرج' : 'اختر تلبيسة';
    const close = document.createElement('button'); close.className='btn'; close.textContent='إغلاق';
    close.addEventListener('click', closePopup);
    head.appendChild(title); head.appendChild(close);
    pop.appendChild(head);

    const body = document.createElement('div'); body.className='popup-body';
    const grid = document.createElement('div'); grid.className = (type==='grad' ? 'grad-grid' : 'dress-grid');

    if(type === 'grad'){
      GRADIENTS.forEach(g=>{
        const s = document.createElement('div'); s.className='grad-sample';
        s.style.background = `linear-gradient(90deg, ${g[0]}, ${g[1]})`;
        s.addEventListener('click', ()=>{
          applyGradientToSelected(g);
          closePopup();
        });
        grid.appendChild(s);
      });
    } else {
      if(AVAILABLE_DRESS.length === 0){
        const p = document.createElement('div'); p.textContent = 'لا توجد تلبيسات في assets/Dress up/'; p.style.padding='12px';
        body.appendChild(p);
      } else {
        AVAILABLE_DRESS.forEach(url=>{
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
    }

    body.appendChild(grid); pop.appendChild(body); popupContainer.appendChild(pop);
  }

  function closePopup(){ popupContainer.classList.remove('open'); popupContainer.innerHTML=''; popupContainer.setAttribute('aria-hidden','true'); }
   // apply gradient/dress
  function applyGradientToSelected(g){
    if(!SELECTED){ alert('اختر عنصرًا أولاً'); return; }
    const {obj,dom} = SELECTED;
    obj.fillMode = 'gradient';
    obj.gradient = g;
    if(dom && dom.classList.contains('dressed')) dom.classList.remove('dressed');
    applyStyleToDom(obj, dom);
    if(obj.type === 'image') updateImageOverlay(obj, dom);
  }
  function applyDressToSelected(url){
    if(!SELECTED){ alert('اختر عنصرًا أولاً'); return; }
    const {obj,dom} = SELECTED;
    obj.fillMode = 'dress';
    obj.dress = url;
    if(dom) dom.classList.add('dressed');
    applyStyleToDom(obj, dom);
    if(obj.type === 'image') updateImageOverlay(obj, dom);
  }

  // handlers to open popups from toolbar (text and image)
  btnGradients && btnGradients.addEventListener('click', ()=> openPopup('grad'));
  btnDressups && btnDressups.addEventListener('click', ()=> openPopup('dress'));
  btnGradientsImg && btnGradientsImg.addEventListener('click', ()=> openPopup('grad'));
  btnDressupsImg && btnDressupsImg.addEventListener('click', ()=> openPopup('dress'));

  // apply font to selected or last text
  function applyFontToSelected(fontName){
    if(!SELECTED){
      const lastText = [...ELEMENTS].reverse().find(e=>e.type==='text');
      if(lastText){
        lastText.font = fontName;
        const dom = editorCanvas.querySelector(`[data-id="${lastText.id}"]`);
        if(dom) dom.style.fontFamily = fontName;
      }
      return;
    }
    const {obj,dom} = SELECTED;
    obj.font = fontName;
    if(obj.type === 'text' && dom) dom.style.fontFamily = fontName;
    if(obj.type === 'text' && obj.fillMode === 'dress') applyStyleToDom(obj, dom);
  }

  // download/export final as PNG (draw to canvas)
  downloadImage.addEventListener('click', async ()=>{
    try {
      const rect = editorCanvas.getBoundingClientRect();
      const W = Math.max(800, Math.round(rect.width));
      const H = Math.max(400, Math.round(rect.height));
      const out = document.createElement('canvas'); out.width = W; out.height = H;
      const ctx = out.getContext('2d');
      ctx.clearRect(0,0,W,H);

      const domChildren = Array.from(editorCanvas.querySelectorAll('.canvas-item'));
      for(const dom of domChildren){
        const id = dom.dataset.id;
        const obj = ELEMENTS.find(e=>e.id===id);
        if(!obj) continue;

        if(obj.type === 'text'){
          const x = Math.round((parseFloat(dom.style.left) || obj.x || 0));
          const y = Math.round((parseFloat(dom.style.top) || obj.y || 0));
          const fontSize = (obj.size || DEFAULT_FONT_SIZE) * (obj.scale || 1);
          ctx.save();
          const bboxW = dom.offsetWidth || (fontSize*(obj.text?obj.text.length:1));
          const bboxH = dom.offsetHeight || fontSize;
          const cx = x + bboxW/2; const cy = y + bboxH/2;
          ctx.translate(cx,cy); ctx.rotate(obj.rotation||0); ctx.translate(-cx,-cy);
          ctx.font = `${fontSize}px "${obj.font || 'ReemKufiLocalFallback'}"`;
          ctx.textAlign = 'left'; ctx.textBaseline = 'top';

          if(obj.fillMode === 'solid' || !obj.gradient){
            ctx.fillStyle = obj.color || '#000';
            if(obj.stroke && obj.stroke>0){ ctx.lineWidth = obj.stroke; ctx.strokeStyle = obj.strokeColor || '#000'; ctx.strokeText(obj.text, x, y); }
            ctx.fillText(obj.text, x, y);
          } else if(obj.fillMode === 'gradient' && obj.gradient){
            const g = ctx.createLinearGradient(x,y,x+bboxW,y);
            g.addColorStop(0,obj.gradient[0]); g.addColorStop(1,obj.gradient[1]);
            ctx.fillStyle = g;
            if(obj.stroke && obj.stroke>0){ ctx.lineWidth = obj.stroke; ctx.strokeStyle = obj.strokeColor || '#000'; ctx.strokeText(obj.text,x,y); }
            ctx.fillText(obj.text, x, y);
          } else if(obj.fillMode === 'dress' && obj.dress){
            // render dress mask into tmp canvas then draw
            const tmp = document.createElement('canvas'); tmp.width = Math.max(1,Math.round(bboxW)); tmp.height = Math.max(1,Math.round(bboxH));
            const tctx = tmp.getContext('2d');
            tctx.clearRect(0,0,tmp.width,tmp.height);
            tctx.font = `${fontSize}px "${obj.font || 'ReemKufiLocalFallback'}"`;
            tctx.textAlign = 'left'; tctx.textBaseline = 'top';
            tctx.fillStyle = '#000'; tctx.fillText(obj.text,0,0);
            await new Promise((res)=>{
              const img = new Image(); img.crossOrigin='anonymous';
              img.onload = ()=>{
                const t2 = document.createElement('canvas'); t2.width = tmp.width; t2.height = tmp.height;
                const t2ctx = t2.getContext('2d');
                try { t2ctx.drawImage(img,0,0,t2.width,t2.height); } catch(e){}
                t2ctx.globalCompositeOperation='destination-in';
                t2ctx.drawImage(tmp,0,0);
                ctx.drawImage(t2, x, y);
                res();
              };
              img.onerror = ()=> { ctx.fillStyle = '#000'; ctx.fillText(obj.text,x,y); res(); };
              img.src = obj.dress;
            });
          }

          ctx.restore();
        } else if(obj.type === 'image'){
          const wrap = dom;
          const imgEl = wrap.querySelector('img');
          if(!imgEl) continue;
          await new Promise((res)=>{
            const img = new Image(); img.crossOrigin='anonymous';
            img.onload = async ()=>{
              const left = Math.round(parseFloat(wrap.style.left)||obj.x||0);
              const top = Math.round(parseFloat(wrap.style.top)||obj.y||0);
              const drawW = (obj.displayWidth || parseInt(imgEl.style.width) || img.naturalWidth) * (obj.scale || 1);
              const drawH = (obj.displayHeight || Math.round(img.naturalHeight * (drawW / img.naturalWidth))) * (obj.scale || 1);

              if(obj.fillMode === 'gradient' && obj.gradient){
                const tmp = document.createElement('canvas'); tmp.width = Math.max(1,Math.round(drawW)); tmp.height = Math.max(1,Math.round(drawH));
                const tctx = tmp.getContext('2d');
                const g = tctx.createLinearGradient(0,0,tmp.width,0);
                g.addColorStop(0,obj.gradient[0]); g.addColorStop(1,obj.gradient[1]);
                tctx.fillStyle = g; tctx.fillRect(0,0,tmp.width,tmp.height);
                tctx.globalCompositeOperation='destination-in';
                try { tctx.drawImage(img,0,0,tmp.width,tmp.height); } catch(e){}
                ctx.drawImage(tmp,left,top,tmp.width,tmp.height);
                res();
              } else if(obj.fillMode === 'dress' && obj.dress){
                const dressImg = new Image(); dressImg.crossOrigin='anonymous';
                dressImg.onload = ()=>{
                  const tmp = document.createElement('canvas'); tmp.width = Math.max(1,Math.round(drawW)); tmp.height = Math.max(1,Math.round(drawH));
                  const tctx = tmp.getContext('2d');
                  try { tctx.drawImage(dressImg,0,0,tmp.width,tmp.height); } catch(e){}
                  tctx.globalCompositeOperation='destination-in';
                  try { tctx.drawImage(img,0,0,tmp.width,tmp.height); } catch(e){}
                  ctx.drawImage(tmp,left,top,tmp.width,tmp.height);
                  res();
                };
                dressImg.onerror = ()=> { ctx.drawImage(img,left,top,drawW,drawH); res(); };
                dressImg.src = obj.dress;
              } else {
                ctx.drawImage(img,left,top,drawW,drawH); res();
              }
            };
            img.onerror = ()=> res();
            img.src = imgEl.src;
          });
        }
      }
      const url = out.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = 'design.png'; a.click();
    } catch(err){
      console.error(err);
      alert('حدث خطأ أثناء التصدير: ' + (err.message||err));
    }
  });

  // helper: apply selected gradient (text-only)
  function applyGradientToText(g){
    if(!SELECTED || SELECTED.obj.type !== 'text') { alert('اختر نصاً أولاً'); return; }
    const {obj,dom} = SELECTED;
    obj.fillMode = 'gradient';
    obj.gradient = g;
    if(dom && dom.classList.contains('dressed')) dom.classList.remove('dressed');
    applyStyleToDom(obj, dom);
  }

  // apply dress to text
  function applyDressToText(url){
    if(!SELECTED || SELECTED.obj.type !== 'text') { alert('اختر نصاً أولاً'); return; }
    const {obj,dom} = SELECTED;
    obj.fillMode = 'dress';
    obj.dress = url;
    if(dom) dom.classList.add('dressed');
    applyStyleToDom(obj, dom);
  }

  // small UX: when mode changes show/hide controls
  modeSelect.addEventListener('change', ()=>{
    if(modeSelect.value === 'text'){
      textControls.classList.remove('hidden');
      if(imageControls) imageControls.classList.add('hidden');
    } else {
      textControls.classList.add('hidden');
      if(imageControls) imageControls.classList.remove('hidden');
    }
  });

  // allow clicking font list items outside overlay to close
  document.addEventListener('click', (e)=>{
    if(!fontListPanel.contains(e.target) && e.target !== fontListBtn) fontListPanel.classList.add('hidden');
  });

  // ensure clicking image's area selects the wrap
  document.addEventListener('click', (e)=>{
    const item = e.target.closest('.canvas-item');
    if(item && editorCanvas.contains(item)){
      item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    }
  });

  // expose opening popup functions for toolbar buttons
  window.__openColorPopup = ()=> openPopup('grad');
  window.__openDressPopup = ()=> openPopup('dress');

  // initial small demo: if user wants to open fonts panel but nothing loaded yet -> show message (handled in refresh)
  refreshFontListUI();

}); // DOMContentLoaded end
