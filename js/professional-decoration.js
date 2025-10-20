/* professional-decoration.js - Final complete (modified)
   - Fix: prevent duplicated image in preview when applying gradient/dress and scaling
   - Approach: hide the base <img> when overlay is active; clear overlay canvas before draw
   - All other logic preserved
*/

document.addEventListener('DOMContentLoaded', () => {
  // DOM refs (match sactions/professional-decoration.html)
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

  const textControls = document.getElementById('textControls');
  const imageControls = document.getElementById('imageControls');

  // State
  let SELECTED = null;
  const ELEMENTS = [];
  let AVAILABLE_FONTS = [];
  let AVAILABLE_DRESS = [];
  let DRESSES_LOADED = false;

  const isMobileLike = window.innerWidth <= 768;
  const DEFAULT_FONT_SIZE = isMobileLike ? 48 : 72;
  const ROTATE_HANDLE_TOUCH_SIZE = isMobileLike ? 44 : 34;

  // 50 gradients (generator)
  const GRADIENTS = (function(){
    const out = [];
    for(let i=0;i<50;i++){
      const a = `hsl(${(i*360/50)|0} 80% 45%)`;
      const b = `hsl(${((i*360/50)+40)|0} 80% 60%)`;
      out.push([a,b]);
    }
    // extras
    out.push(['#f3c976','#b8862a']);
    out.push(['#e6e9ec','#b9bfc6']);
    out.push(['#d4b06f','#8b5a2b']);
    return out;
  })();

  // assets base (relative)
  const assetsBase = (() => {
    try { return new URL('../assets/', window.location.href).href; }
    catch(e){ return window.location.origin + '/assets/'; }
  })();

  // Utilities
  function showInlineMessage(msg, time = 4000){
    let el = editorCanvas.querySelector('.__inline_msg');
    if(!el){
      el = document.createElement('div');
      el.className = '__inline_msg';
      el.style.position = 'absolute';
      el.style.left = '12px';
      el.style.top = '12px';
      el.style.zIndex = '999';
      el.style.background = 'rgba(0,0,0,0.6)';
      el.style.color = '#fff';
      el.style.padding = '8px 12px';
      el.style.borderRadius = '8px';
      el.style.fontSize = '14px';
      editorCanvas.appendChild(el);
    }
    el.textContent = msg;
    clearTimeout(el.__t);
    el.__t = setTimeout(()=> el.remove(), time);
  }

  function fileNameNoExt(p){
    return p.split('/').pop().replace(/\.[^/.]+$/, '');
  }

  function safeFetchJson(url){
    return fetch(url, {cache:'no-store'}).then(r=> r.ok ? r.json().catch(()=>null) : null).catch(()=>null);
  }

  function detectGitHubRepo(){
    try {
      const host = window.location.hostname;
      if(!host.includes('github.io')) return null;
      const owner = host.split('.github.io')[0];
      const parts = window.location.pathname.split('/').filter(Boolean);
      const repo = parts.length ? parts[0] : null;
      return { owner, repo };
    } catch(e){ return null; }
  }

  function registerFont(fontName, url){
    try {
      const s = document.createElement('style');
      s.textContent = `@font-face{ font-family: "${fontName}"; src: url("${url}"); font-display: swap; }`;
      document.head.appendChild(s);
    } catch(e){}
  }

  // Load assets: index.json preferred, else GitHub API fallback, else try common files
  async function populateAssets(){
    const idxUrl = new URL('index.json', assetsBase).href;
    const idx = await safeFetchJson(idxUrl);
    if(idx){
      if(Array.isArray(idx.fonts)){
        idx.fonts.forEach(f=>{
          const name = fileNameNoExt(f);
          const url = new URL(f, assetsBase).href;
          AVAILABLE_FONTS.push({name,url});
          registerFont(name,url);
        });
      }
      if(Array.isArray(idx.dressup)) idx.dressup.forEach(p=> AVAILABLE_DRESS.push(new URL(p, assetsBase).href));
      DRESSES_LOADED = true;
      refreshFontListUI();
      return;
    }

    const repo = detectGitHubRepo();
    if(repo && repo.owner && repo.repo){
      // fonts
      try {
        const res = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/assets/fonts`);
        if(res.ok){
          const list = await res.json();
          list.filter(f=>f.type==='file' && /\.(ttf|otf|woff2?|woff)$/i.test(f.name)).forEach(f=>{
            const name = f.name.replace(/\.[^/.]+$/, '');
            AVAILABLE_FONTS.push({name, url: f.download_url});
            registerFont(name, f.download_url);
          });
        }
      } catch(e){}
      // dressup
      try {
        const res2 = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/assets/dressup`);
        if(res2.ok){
          const list2 = await res2.json();
          list2.filter(f=>f.type==='file' && /\.(png|jpe?g|webp|svg)$/i.test(f.name)).forEach(f=>{
            AVAILABLE_DRESS.push(f.download_url);
          });
        }
      } catch(e){}
      DRESSES_LOADED = true;
      refreshFontListUI();
      return;
    }

    // last resort checks
    const tryFonts = ['ReemKufi.ttf','ReemKufi-Regular.ttf','ReemKufi.woff2'];
    for(const fname of tryFonts){
      const furl = new URL(`fonts/${fname}`, assetsBase).href;
      try {
        const r = await fetch(furl, { method:'HEAD' });
        if(r && r.ok){ AVAILABLE_FONTS.push({ name:fileNameNoExt(fname), url: furl }); registerFont(fileNameNoExt(fname), furl); }
      } catch(e){}
    }
    const tryD = ['dressup/gold.png','dressup/silver.png','dressup/glitter1.webp'];
    for(const p of tryD){
      const durl = new URL(p, assetsBase).href;
      try {
        const h = await fetch(durl, { method:'HEAD' });
        if(h && h.ok) AVAILABLE_DRESS.push(durl);
      } catch(e){}
    }
    DRESSES_LOADED = true;
    refreshFontListUI();
    if(AVAILABLE_FONTS.length === 0 && AVAILABLE_DRESS.length === 0){
      showInlineMessage('ضع ملفات داخل assets/fonts و assets/dressup أو assets/index.json لعرض الخطوط والتلبيسات');
    }
  }

  // Fonts UI
  function refreshFontListUI(){
    fontListPanel && (fontListPanel.innerHTML = '');
    if(!fontListPanel) return;
    if(AVAILABLE_FONTS.length === 0){
      const p = document.createElement('div'); p.textContent = 'لا توجد خطوط في assets/fonts/'; p.className='panel-empty';
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

  // Element model & render
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
      dom.style.left = obj.x + 'px';
      dom.style.top = obj.y + 'px';
      dom.dataset.id = obj.id;
      dom.style.pointerEvents = 'auto';
      applyStyleToDom(obj, dom);
      attachInteraction(dom, obj);
      editorCanvas.appendChild(dom);
    } else if(obj.type === 'image'){
      const wrap = document.createElement('div');
      wrap.className = 'canvas-item img-wrap';
      wrap.style.left = obj.x + 'px';
      wrap.style.top = obj.y + 'px';
      wrap.dataset.id = obj.id;
      wrap.tabIndex = 0;

      const img = document.createElement('img');
      img.src = obj.img;
      img.alt = '';
      img.style.display = 'block';
      img.style.pointerEvents = 'none';
      img.style.userSelect = 'none';
      img.style.touchAction = 'none';
      // ensure default visible
      img.style.opacity = '1';

      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.className = 'img-overlay-canvas';
      overlayCanvas.style.position = 'absolute';
      overlayCanvas.style.left = '0';
      overlayCanvas.style.top = '0';
      overlayCanvas.style.pointerEvents = 'none';
      overlayCanvas.style.opacity = 0;
      overlayCanvas.style.display = 'none';

      const finalizeImageLayout = ()=>{
        const canvasPadding = 40;
        const editorW = Math.max(200, editorCanvas.clientWidth || 300);
        const maxw = Math.min(Math.max(200, editorW - canvasPadding), img.naturalWidth || editorW);
        const dispW = obj.displayWidth || Math.min(480, maxw);
        const dispH = dispW; // 🔲 نجعل الصورة مربعة تمامًا (العرض = الارتفاع)

        img.style.width = dispW + 'px';
        wrap.style.width = dispW + 'px';
        wrap.style.height = dispH + 'px';

        // set overlay canvas to match display dims
        overlayCanvas.width = dispW; overlayCanvas.height = dispH;
        overlayCanvas.style.width = dispW + 'px'; overlayCanvas.style.height = dispH + 'px';
        obj.displayWidth = dispW; obj.displayHeight = dispH;
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

  // update overlay for image (clears before draw)
  function updateImageOverlay(obj, wrap){
    if(!wrap) return;
    const imgEl = wrap.querySelector('img');
    const overlayCanvas = wrap.querySelector('.img-overlay-canvas');
    if(!imgEl || !overlayCanvas) return;

    // wait for image loaded if needed
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

    // compute displayed width/height (consider scale)
    const baseDispW = (obj.displayWidth || parseInt(imgEl.style.width) || imgEl.naturalWidth);
    const dispW = Math.max(1, Math.round(baseDispW * (obj.scale || 1)));
    const baseDispH = (obj.displayHeight || Math.round(imgEl.naturalHeight * (baseDispW / (imgEl.naturalWidth || baseDispW))));
    const dispH = Math.max(1, Math.round(baseDispH * (obj.scale || 1)));

    // update overlay canvas pixel dims and css dims
    if (overlayCanvas.width !== dispW || overlayCanvas.height !== dispH) {
      overlayCanvas.width = dispW;
      overlayCanvas.height = dispH;
      overlayCanvas.style.width = dispW + 'px';
      overlayCanvas.style.height = dispH + 'px';
    }
    overlayCanvas.style.left = '0px';
    overlayCanvas.style.top = '0px';

    const ctx = overlayCanvas.getContext('2d');
    // Reset transform and clear to avoid duplicates
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,dispW,dispH);

    // determine whether overlay should be active
    const hasGradient = obj.fillMode === 'gradient' && Array.isArray(obj.gradient) && obj.gradient.length >= 2;
    const hasDress = obj.fillMode === 'dress' && obj.dress;
    const overlayActive = hasGradient || hasDress;

    // hide base image when overlay is active (prevents visual double)
    if(overlayActive){
      imgEl.style.opacity = '0';
      overlayCanvas.style.display = 'block';
      overlayCanvas.style.opacity = '1';
    } else {
      imgEl.style.opacity = '1';
      overlayCanvas.style.opacity = '0';
      // hide from layout/paint to avoid accidental stacking
      overlayCanvas.style.display = 'none';
      return;
    }

    if(hasGradient){
      // draw gradient then mask by image
      const g = ctx.createLinearGradient(0,0,dispW,0);
      g.addColorStop(0, obj.gradient[0]); g.addColorStop(1, obj.gradient[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0,0,dispW,dispH);

      ctx.globalCompositeOperation = 'destination-in';
      try { ctx.drawImage(imgEl, 0, 0, dispW, dispH); } catch(e){ /* ignore cross-origin draw errors gracefully */ }
      ctx.globalCompositeOperation = 'source-over';
    } else if(hasDress){
      const dimg = new Image();
      dimg.crossOrigin = 'anonymous';
      dimg.onload = ()=>{
        // clear then draw dress image sized to overlay
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,dispW,dispH);
        try { ctx.drawImage(dimg, 0, 0, dispW, dispH); } catch(e){}
        ctx.globalCompositeOperation = 'destination-in';
        try { ctx.drawImage(imgEl, 0, 0, dispW, dispH); } catch(e){}
        ctx.globalCompositeOperation = 'source-over';
      };
      dimg.onerror = ()=> {
        // if dress image fails, hide overlay and show base image
        overlayCanvas.style.opacity = '0';
        overlayCanvas.style.display = 'none';
        imgEl.style.opacity = '1';
      };
      dimg.src = obj.dress;
    } else {
      // nothing active
      overlayCanvas.style.opacity = 0;
      overlayCanvas.style.display = 'none';
      imgEl.style.opacity = '1';
    }
  }

  // apply style to DOM item
  function applyStyleToDom(obj, dom){
    if(!dom) return;
    const sc = typeof obj.scale === 'number' ? obj.scale : 1;
    const rot = obj.rotation || 0;
    dom.style.transform = `rotate(${rot}rad) scale(${sc})`;

    if(obj.type === 'text'){
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
  const fontSize = (obj.size || DEFAULT_FONT_SIZE) * (obj.scale || 1);
  const text = obj.text || '';

  // ✅ تصحيح المعاينة الفورية لنمط dress
  dom.style.color = 'transparent';
  dom.style.webkitTextFillColor = 'transparent';
  dom.style.backgroundClip = 'text';
  dom.style.webkitBackgroundClip = 'text';
  dom.style.backgroundImage = `url(${obj.dress})`;

        const drawDress = ()=>{
          try {
            const tmp = document.createElement('canvas');
            const tctx = tmp.getContext('2d');
            tctx.font = `${fontSize}px "${obj.font}"`;
            let w = Math.max(1, Math.ceil(tctx.measureText(text).width));
            let h = Math.max(1, Math.ceil(fontSize * 1.1));
            w = Math.ceil(w + 8); h = Math.ceil(h + 8);
            tmp.width = w; tmp.height = h;
            const dimg = new Image(); dimg.crossOrigin='anonymous';
              dimg.onload = () => {
  const t2 = tmp.getContext('2d');
  t2.clearRect(0, 0, w, h);
  try {
    t2.drawImage(dimg, 0, 0, w, h);
  } catch(e) {}
  t2.globalCompositeOperation = 'destination-in';
  t2.fillStyle = '#000';
  t2.font = `${fontSize}px "${obj.font}"`;
  t2.textBaseline = 'top';
  t2.fillText(text, 4, 4);

  dom.style.backgroundImage = `url(${tmp.toDataURL()})`;
  dom.style.color = 'transparent';
};

dimg.onerror = () => {
  dom.style.color = obj.color || '#000';
};

dimg.src = obj.dress;
        };

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

  // interactions: drag / rotate / pinch
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

    // pinch gestures
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

  editorCanvas.addEventListener('mousedown', (e)=>{
    if(e.target === editorCanvas){
      document.querySelectorAll('.canvas-item.selected').forEach(el=>el.classList.remove('selected'));
      SELECTED = null;
    }
  });

  // Add element - text or image (image only after pressing "أضف")
  btnAdd && btnAdd.addEventListener('click', ()=>{
    if(modeSelect.value === 'text'){
      const txt = textInput.value.trim();
      if(!txt) return alert('أدخل نصًا أولاً');
      const obj = createElementObject('text',{ text: txt, font: (AVAILABLE_FONTS[0] ? AVAILABLE_FONTS[0].name : 'ReemKufiLocalFallback')});
      const dom = renderElement(obj);
      const lastDom = editorCanvas.querySelector(`[data-id="${obj.id}"]`);
      if(lastDom) selectElement(lastDom,obj);
      textInput.value='';
    } else {
      const f = fileImage.files && fileImage.files[0];
      if(!f) return alert('اختر صورة شفافة من جهازك');
      const reader = new FileReader();
      reader.onload = (ev)=>{
        const dataUrl = ev.target.result;
        const preload = new Image();
        preload.onload = ()=>{
          const obj = createElementObject('image',{ img: dataUrl });
          const editorW = Math.max(200, editorCanvas.clientWidth || 300);
          const canvasPadding = 40;
          const maxw = Math.min(Math.max(200, editorW - canvasPadding), preload.naturalWidth || editorW);
          obj.displayWidth = Math.min(480, maxw);
          obj.displayHeight = Math.round(obj.displayWidth * (preload.naturalHeight / preload.naturalWidth));
    
          // 🟩 توسيط الصورة داخل المعاينة
        const dom = renderElement(obj);
const centerX = (editorCanvas.clientWidth - obj.displayWidth) / 2;
const centerY = (editorCanvas.clientHeight - obj.displayHeight) / 2;
obj.x = centerX;
obj.y = centerY;
dom.style.left = centerX + 'px';
dom.style.top = centerY + 'px';
          if(DRESSES_LOADED && AVAILABLE_DRESS.length && obj.fillMode === 'dress'){
            applySmartDressToObj(obj, dom);
          }
          const lastDom = editorCanvas.querySelector(`[data-id="${obj.id}"]`);
          if(lastDom) selectElement(lastDom,obj);
        };
        preload.onerror = ()=>{
          const obj = createElementObject('image',{ img: dataUrl });
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

  // Delete selected
  deleteSelected.addEventListener('click', ()=>{
    if(!SELECTED) return alert('اختر عنصراً أولاً');
    const {dom,obj} = SELECTED;
    dom.remove();
    const idx = ELEMENTS.findIndex(e=>e.id===obj.id);
    if(idx!==-1) ELEMENTS.splice(idx,1);
    SELECTED = null;
  });

  // POPUP - gradients / dressups
  function openPopup(type){
    popupContainer.innerHTML = '';
    popupContainer.classList.add('open');
    popupContainer.setAttribute('aria-hidden','false');
    const pop = document.createElement('div'); pop.className='popup';
    const head = document.createElement('div'); head.className='popup-head';
    const title = document.createElement('h3'); title.textContent = type==='grad' ? 'اختر تدرج' : 'اختر تلبيسة';
    const close = document.createElement('button'); close.className='btn'; close.textContent='إغلاق';
    close.addEventListener('click', closePopup);
    head.appendChild(title); head.appendChild(close); pop.appendChild(head);

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
        const p = document.createElement('div'); p.textContent = 'لا توجد تلبيسات في assets/dressup/'; p.style.padding='12px';
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

  btnGradients && btnGradients.addEventListener('click', ()=> openPopup('grad'));
  btnDressups && btnDressups.addEventListener('click', ()=> openPopup('dress'));
  btnGradientsImg && btnGradientsImg.addEventListener('click', ()=> openPopup('grad'));
  btnDressupsImg && btnDressupsImg.addEventListener('click', ()=> openPopup('dress'));

  // APPLY gradient/dress to selected — important: DO NOT CREATE NEW ELEMENTS
  function applyGradientToSelected(g){
    if(!SELECTED){ alert('اختر عنصرًا أولاً'); return; }
    const {obj,dom} = SELECTED;
    obj.fillMode = 'gradient';
    obj.gradient = g;

    // remove any dress class or background previously set
    if(dom.classList.contains('dressed')) dom.classList.remove('dressed');

    // If text: use background-clip text
    if(obj.type === 'text'){
      dom.style.background = `linear-gradient(90deg, ${g[0]}, ${g[1]})`;
      dom.style.webkitBackgroundClip = 'text';
      dom.style.backgroundClip = 'text';
      dom.style.color = 'transparent';
      dom.style.webkitTextFillColor = 'transparent';
    } else if(obj.type === 'image'){
      // For images: set the obj.gradient then redraw overlay (overlay cleared inside updateImageOverlay)
function applyDressToSelected(url){
  if(!SELECTED){ alert('اختر عنصرًا أولاً'); return; }
  const {obj,dom} = SELECTED;
  obj.fillMode = 'dress';
  obj.dress = url;

  if(obj.type === 'text'){
    dom.classList.add('dressed');
    applyStyleToDom(obj, dom);
    // ✅ تصحيح المعاينة الفورية بعد تحميل الخط
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(() => applyStyleToDom(obj, dom));
    } else {
      applyStyleToDom(obj, dom);
    }
  } else if(obj.type === 'image'){
    dom.classList.add('dressed');
    updateImageOverlay(obj, dom);
  }
}

  // Font apply
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

  // Download/export final as PNG
  downloadImage.addEventListener('click', async ()=>{
    try {
      const rect = editorCanvas.getBoundingClientRect();
     const W = Math.round(rect.width);
     const H = Math.round(rect.height);
     // 🔹 احسب نسبة التكبير بين حجم الصورة المطلوب وحجم المعاينة
const desiredW = parseInt(document.getElementById('widthInput').value);
const desiredH = parseInt(document.getElementById('heightInput').value);
    const scaleX = desiredW / W;
    const scaleY = desiredH / H;
    const scale = Math.min(scaleX, scaleY);
      const out = document.createElement('canvas'); 
      const ctx = out.getContext('2d');
      out.width = W * scale;
      out.height = H * scale;
      ctx.scale(scale, scale);
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, W, H);
     

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
              const drawW = parseInt(imgEl.style.width) || (obj.displayWidth * (obj.scale || 1)) || img.naturalWidth;
              const drawH = parseInt(imgEl.style.height) || (obj.displayHeight * (obj.scale || 1)) || img.naturalHeight;

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

  // Helper for text/dress apply
  function applyGradientToText(g){
    if(!SELECTED || SELECTED.obj.type !== 'text') { alert('اختر نصاً أولاً'); return; }
    const {obj,dom} = SELECTED;
    obj.fillMode = 'gradient';
    obj.gradient = g;
    if(dom && dom.classList.contains('dressed')) dom.classList.remove('dressed');
    dom.style.background = `linear-gradient(90deg, ${g[0]}, ${g[1]})`;
    dom.style.webkitBackgroundClip = 'text';
    dom.style.backgroundClip = 'text';
    dom.style.color = 'transparent';
    dom.style.webkitTextFillColor = 'transparent';
  }

  function applyDressToText(url){
    if(!SELECTED || SELECTED.obj.type !== 'text') { alert('اختر نصاً أولاً'); return; }
    const {obj,dom} = SELECTED;
    obj.fillMode = 'dress';
    obj.dress = url;
    if(dom) dom.classList.add('dressed');
    applyStyleToDom(obj, dom);
  }

  // show/hide controls on mode change
  modeSelect.addEventListener('change', ()=>{
    if(modeSelect.value === 'text'){
      textControls.classList.remove('hidden');
      if(imageControls) imageControls.classList.add('hidden');
    } else {
      textControls.classList.add('hidden');
      if(imageControls) imageControls.classList.remove('hidden');
    }
  });

  // click outside font panel closes it
  document.addEventListener('click', (e)=>{
    if(fontListPanel && !fontListPanel.contains(e.target) && e.target !== fontListBtn) fontListPanel.classList.add('hidden');
  });

  // clicking item selects it
  document.addEventListener('click', (e)=>{
    const item = e.target.closest('.canvas-item');
    if(item && editorCanvas.contains(item)){
      item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    }
  });

  // Expose popup openers (used by HTML)
  window.__openColorPopup = ()=> openPopup('grad');
  window.__openDressPopup = ()=> openPopup('dress');

  refreshFontListUI();

  function applySmartDressToObj(obj, dom){
    if(!obj || !dom) return;
    if(!AVAILABLE_DRESS || AVAILABLE_DRESS.length === 0) return;
    if(!obj.dress) obj.dress = AVAILABLE_DRESS[0];
    obj.fillMode = 'dress';
    applyStyleToDom(obj, dom);
    dom.classList.add('dressed');
  }

  // init assets
  (async ()=>{
    try {
      await populateAssets();
    } catch(e){
      console.warn('populateAssets failed', e);
      showInlineMessage('خطأ أثناء تحميل الأصول — تحقق من مجلد assets/');
    }
  })();

  // open font list
  fontListBtn && fontListBtn.addEventListener('click', (e)=>{
    fontListPanel.classList.toggle('hidden');
  });

}); // end DOMContentLoaded
