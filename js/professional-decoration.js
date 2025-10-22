/* professional-decoration.js - Unified final (merged & fixed)
   - Works with the supplied HTML (rtl Arabic)
   - Removes image-only gradient/dress buttons
   - Gradients/dress apply to both text and image
   - Fixed btnAdd behavior
   - Stable overlay/exports and interactions
*/

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM refs (must match HTML) ---
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
  const downloadImage = document.getElementById('downloadImage');
  const popupContainer = document.getElementById('popupContainer');
  const deleteSelected = document.getElementById('deleteSelected');
  const widthInput = document.getElementById('widthInput');
  const heightInput = document.getElementById('heightInput');

  const textControls = document.getElementById('textControls');
  const imageControls = document.getElementById('imageControls');

  // --- State ---
  let SELECTED = null;
  const ELEMENTS = [];
  let AVAILABLE_FONTS = [];
  let AVAILABLE_DRESS = [];
  let DRESSES_LOADED = false;

  // Gradients generator (valid CSS color strings)
  const GRADIENTS = (function(){
    const out = [];
    for(let i=0;i<50;i++){
      const h = Math.floor(i*360/50);
      out.push([`hsl(${h}, 80%, 45%)`, `hsl(${(h+40)%360}, 80%, 60%)`]);
    }
    out.push(['#f3c976','#b8862a']);
    out.push(['#e6e9ec','#b9bfc6']);
    out.push(['#d4b06f','#8b5a2b']);
    return out;
  })();

  const isMobileLike = window.innerWidth <= 768;
  const DEFAULT_FONT_SIZE = isMobileLike ? 48 : 72;
  const ROTATE_HANDLE_TOUCH_SIZE = isMobileLike ? 44 : 34;

  // assets base detection
  const assetsBase = (() => {
    try { return new URL('../assets/', window.location.href).href; }
    catch (e) { return (window.location.origin || '') + '/assets/'; }
  })();

  // --- Utilities ---
  function showInlineMessage(msg, time = 4000) {
    if (!editorCanvas) return;
    let el = editorCanvas.querySelector('.__inline_msg');
    if (!el) {
      el = document.createElement('div');
      el.className = '__inline_msg';
      Object.assign(el.style, {
        position: 'absolute',
        left: '12px',
        top: '12px',
        zIndex: '9999',
        background: 'rgba(0,0,0,0.65)',
        color: '#fff',
        padding: '8px 12px',
        borderRadius: '8px',
        fontSize: '14px'
      });
      editorCanvas.appendChild(el);
    }
    el.textContent = msg;
    clearTimeout(el.__t);
    el.__t = setTimeout(() => el.remove(), time);
  }

  function fileNameNoExt(p) {
    return String(p).split('/').pop().replace(/\.[^/.]+$/, '');
  }

  function safeFetchJson(url) {
    return fetch(url, { cache: 'no-store' })
      .then(r => r.ok ? r.json().catch(() => null) : null)
      .catch(() => null);
  }

  function registerFont(fontName, url) {
    try {
      const s = document.createElement('style');
      s.textContent = `@font-face{ font-family: "${fontName}"; src: url("${url}"); font-display: swap; }`;
      document.head.appendChild(s);
    } catch (e) { /* ignore */ }
  }

  // --- populate assets: fonts & dressups ---
  async function populateAssets() {
    const idxUrl = new URL('index.json', assetsBase).href;
    const idx = await safeFetchJson(idxUrl);
    if (idx) {
      if (Array.isArray(idx.fonts)) {
        idx.fonts.forEach(f => {
          const name = fileNameNoExt(f);
          const url = new URL(f, assetsBase).href;
          AVAILABLE_FONTS.push({ name, url });
          registerFont(name, url);
        });
      }
      if (Array.isArray(idx.dressup)) {
        idx.dressup.forEach(p => AVAILABLE_DRESS.push(new URL(p, assetsBase).href));
      }
      DRESSES_LOADED = true;
      refreshFontListUI();
      return;
    }
     // 👇 إذا ما كان في index.json نحاول نقرأ الملفات مباشرة من المجلدات
try {
  const fontDir = assetsBase + 'fonts/';
  const dressDir = assetsBase + 'dressup/';
  const fontExts = ['.ttf', '.woff2', '.otf'];
  const dressExts = ['.png', '.jpg', '.jpeg', '.webp'];

  // نحاول جلب قائمة من السيرفر (فقط إن وجد index أو directory listing)
  const fontListResp = await fetch(fontDir);
  const text = await fontListResp.text();
  for (const ext of fontExts) {
    const matches = text.match(new RegExp(`[^"']+\\${ext}`, 'g')) || [];
    for (const m of matches) {
      const url = fontDir + m.split('/').pop();
      const name = fileNameNoExt(url);
      AVAILABLE_FONTS.push({ name, url });
      registerFont(name, url);
    }
  }

  const dressResp = await fetch(dressDir);
  const text2 = await dressResp.text();
  for (const ext of dressExts) {
    const matches = text2.match(new RegExp(`[^"']+\\${ext}`, 'g')) || [];
    for (const m of matches) {
      const url = dressDir + m.split('/').pop();
      AVAILABLE_DRESS.push(url);
    }
  }

  DRESSES_LOADED = true;
  refreshFontListUI();
} catch (e) {
  console.warn('fallback asset scan failed', e);
}

    // fallback probe (simple)
    const tryFonts = ['ReemKufi.ttf','ReemKufi-Regular.ttf','ReemKufi.woff2'];
    for (const fn of tryFonts) {
      try {
        const url = new URL(`fonts/${fn}`, assetsBase).href;
        const h = await fetch(url, { method: 'HEAD' });
        if (h && h.ok) { AVAILABLE_FONTS.push({ name: fileNameNoExt(fn), url }); registerFont(fileNameNoExt(fn), url); }
      } catch (e) { /* ignore */ }
    }
    const tryD = ['dressup/gold.png','dressup/silver.png','dressup/glitter1.webp'];
    for (const p of tryD) {
      try {
        const url = new URL(p, assetsBase).href;
        const h = await fetch(url, { method: 'HEAD' });
        if (h && h.ok) AVAILABLE_DRESS.push(url);
      } catch (e) { /* ignore */ }
    }

    DRESSES_LOADED = true;
    refreshFontListUI();
    if (AVAILABLE_FONTS.length === 0 && AVAILABLE_DRESS.length === 0) {
      showInlineMessage('ضع ملفات داخل assets/fonts و assets/dressup أو assets/index.json لعرض الخطوط والتلبيسات');
    }
  }

  // --- fonts UI builder ---
  function refreshFontListUI() {
    if (!fontListPanel) return;
    fontListPanel.innerHTML = '';
    if (AVAILABLE_FONTS.length === 0) {
      const p = document.createElement('div');
      p.textContent = 'لا توجد خطوط في assets/fonts/';
      p.className = 'panel-empty';
      fontListPanel.appendChild(p);
      return;
    }
    AVAILABLE_FONTS.forEach(f => {
      const btn = document.createElement('button');
      btn.className = 'font-item';
      btn.textContent = f.name;
      btn.setAttribute('data-font', f.name);
      btn.addEventListener('click', () => {
        applyFontToSelected(f.name);
        fontListPanel.classList.add('hidden');
        if (fontListBtn) fontListBtn.setAttribute('aria-expanded', 'false');
      });
      fontListPanel.appendChild(btn);
    });
  }

  // --- element model & render ---
  function createElementObject(type, data) {
    const id = 'el_' + (Date.now() + Math.floor(Math.random()*999));
    const base = {
      id, type, x: 80, y: 80, rotation: 0, scale: 1,
      font: AVAILABLE_FONTS.length ? AVAILABLE_FONTS[0].name : 'ReemKufiLocalFallback',
      size: DEFAULT_FONT_SIZE, stroke: 0, strokeColor: '#000', fillMode: 'solid', gradient: null, dress: null, img: null,
      displayWidth: null, displayHeight: null, text: ''
    };
    const obj = Object.assign({}, base, data || {});
    if (DRESSES_LOADED && AVAILABLE_DRESS.length && obj.fillMode === 'solid') {
      obj.fillMode = 'dress';
      obj.dress = AVAILABLE_DRESS[0];
    }
    ELEMENTS.push(obj);
    return obj;
  }

  function renderElement(obj) {
    if (!editorCanvas) return null;
    let dom = null;
    if (obj.type === 'text') {
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
      editorCanvas.appendChild(dom);
      // attachInteraction (part of same file)
      attachInteraction(dom, obj);
    } else if (obj.type === 'image') {
      const wrap = document.createElement('div');
      wrap.className = 'canvas-item img-wrap';
      wrap.style.left = obj.x + 'px';
      wrap.style.top = obj.y + 'px';
      wrap.dataset.id = obj.id;
      wrap.tabIndex = 0;

      const img = document.createElement('img');
      img.src = obj.img || '';
      img.alt = '';
      img.style.display = 'block';
      img.style.pointerEvents = 'none';
      img.style.userSelect = 'none';
      img.style.touchAction = 'none';
      img.style.opacity = '1';

      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.className = 'img-overlay-canvas';
      overlayCanvas.style.position = 'absolute';
      overlayCanvas.style.left = '0';
      overlayCanvas.style.top = '0';
      overlayCanvas.style.pointerEvents = 'none';
      overlayCanvas.style.opacity = 0;
      overlayCanvas.style.display = 'none';

      wrap.appendChild(img);
      wrap.appendChild(overlayCanvas);
      applyStyleToDom(obj, wrap);
      editorCanvas.appendChild(wrap);

      // finalize layout on load
      const finalizeImageLayout = () => {
        const canvasPadding = 40;
        const editorW = Math.max(200, editorCanvas.clientWidth || 300);
        const maxw = Math.min(Math.max(200, editorW - canvasPadding), img.naturalWidth || editorW);
        const dispW = obj.displayWidth || Math.min(480, maxw);
        const dispH = obj.displayHeight || Math.round((img.naturalHeight || dispW) * (dispW / (img.naturalWidth || dispW)));

        img.style.width = dispW + 'px';
        wrap.style.width = dispW + 'px';
        wrap.style.height = dispH + 'px';

        overlayCanvas.width = Math.max(1, Math.round(dispW));
        overlayCanvas.height = Math.max(1, Math.round(dispH));
        overlayCanvas.style.width = dispW + 'px';
        overlayCanvas.style.height = dispH + 'px';
        obj.displayWidth = dispW; obj.displayHeight = dispH;
        updateImageOverlay(obj, wrap);
      };

      if (img.complete && img.naturalWidth && img.naturalWidth > 0) {
        setTimeout(finalizeImageLayout, 0);
      } else {
        img.addEventListener('load', function _onLoad() { img.removeEventListener('load', _onLoad); finalizeImageLayout(); });
        img.addEventListener('error', function _onErr() { img.removeEventListener('error', _onErr); finalizeImageLayout(); });
      }

      attachInteraction(wrap, obj);
      dom = wrap;

      if (obj.fillMode === 'dress' && obj.dress) {
        dom.classList.add('dressed');
        updateImageOverlay(obj, dom);
      }
    }
    return dom;
  }

  // --- update overlay for image (clears and draws) ---
  function updateImageOverlay(obj, wrap) {
    if (!wrap) return;
    const imgEl = wrap.querySelector('img');
    const overlayCanvas = wrap.querySelector('.img-overlay-canvas');
    if (!imgEl || !overlayCanvas) return;

    // wait for image loaded
    if (!imgEl.complete || (imgEl.naturalWidth === 0 && imgEl.naturalHeight === 0)) {
      const once = () => {
        imgEl.removeEventListener('load', once);
        imgEl.removeEventListener('error', once);
        setTimeout(() => updateImageOverlay(obj, wrap), 20);
      };
      imgEl.addEventListener('load', once);
      imgEl.addEventListener('error', once);
      return;
    }

    const baseDispW = (obj.displayWidth || parseInt(imgEl.style.width) || imgEl.naturalWidth) || 1;
    const dispW = Math.max(1, Math.round(baseDispW * (obj.scale || 1)));
    const baseDispH = (obj.displayHeight || Math.round(imgEl.naturalHeight * (baseDispW / (imgEl.naturalWidth || baseDispW)))) || 1;
    const dispH = Math.max(1, Math.round(baseDispH * (obj.scale || 1)));

    if (overlayCanvas.width !== dispW || overlayCanvas.height !== dispH) {
      overlayCanvas.width = dispW;
      overlayCanvas.height = dispH;
      overlayCanvas.style.width = dispW + 'px';
      overlayCanvas.style.height = dispH + 'px';
    }
    overlayCanvas.style.left = '0px';
    overlayCanvas.style.top = '0px';

    const ctx = overlayCanvas.getContext('2d');
    ctx.setTransform(1,0,0,1,0,0);
    ctx.clearRect(0,0,dispW,dispH);

    const hasGradient = obj.fillMode === 'gradient' && Array.isArray(obj.gradient) && obj.gradient.length >= 2;
    const hasDress = obj.fillMode === 'dress' && obj.dress;
    const overlayActive = hasGradient || hasDress;

    if (overlayActive) {
      imgEl.style.opacity = '0';
      overlayCanvas.style.display = 'block';
      overlayCanvas.style.opacity = '1';
    } else {
      imgEl.style.opacity = '1';
      overlayCanvas.style.opacity = '0';
      overlayCanvas.style.display = 'none';
      return;
    }

    if (hasGradient) {
      const g = ctx.createLinearGradient(0,0,dispW,0);
      g.addColorStop(0, obj.gradient[0]); g.addColorStop(1, obj.gradient[1]);
      ctx.fillStyle = g; ctx.fillRect(0,0,dispW,dispH);
      ctx.globalCompositeOperation = 'destination-in';
      try { ctx.drawImage(imgEl, 0, 0, dispW, dispH); } catch (e) { /* ignore */ }
      ctx.globalCompositeOperation = 'source-over';
    } else if (hasDress) {
      const dimg = new Image();
      dimg.crossOrigin = 'anonymous';
      dimg.onload = () => {
        ctx.setTransform(1,0,0,1,0,0);
        ctx.clearRect(0,0,dispW,dispH);
        try { ctx.drawImage(dimg, 0, 0, dispW, dispH); } catch(e) {}
        ctx.globalCompositeOperation = 'destination-in';
        try { ctx.drawImage(imgEl, 0, 0, dispW, dispH); } catch(e) {}
        ctx.globalCompositeOperation = 'source-over';
      };
      dimg.onerror = () => {
        overlayCanvas.style.opacity = '0';
        overlayCanvas.style.display = 'none';
        imgEl.style.opacity = '1';
      };
      dimg.src = obj.dress;
    }
  }

  // expose updateImageOverlay for part of code that may call it
  window.updateImageOverlay = updateImageOverlay;

  // --- apply styles to DOM element (text/image) ---
  function applyStyleToDom(obj, dom) {
    if (!dom) return;
    const sc = typeof obj.scale === 'number' ? obj.scale : 1;
    const rot = obj.rotation || 0;
    dom.style.transform = `rotate(${rot}rad) scale(${sc})`;

    if (obj.type === 'text') {
      dom.style.webkitBackgroundClip = 'unset';
      dom.style.backgroundImage = '';
      dom.style.color = obj.color || '#000';
      dom.style.webkitTextFillColor = obj.color || '#000';

      if (obj.fillMode === 'solid' || (!obj.gradient && obj.fillMode !== 'dress')) {
        dom.style.color = obj.color || '#000';
        dom.style.webkitTextFillColor = obj.color || '#000';
      } else if (obj.fillMode === 'gradient' && obj.gradient) {
        const g = obj.gradient;
        dom.style.background = `linear-gradient(90deg, ${g[0]}, ${g[1]})`;
        dom.style.webkitBackgroundClip = 'text';
        dom.style.backgroundClip = 'text';
        dom.style.color = 'transparent';
        dom.style.webkitTextFillColor = 'transparent';
      } else if (obj.fillMode === 'dress' && obj.dress) {
        const fontSize = (obj.size || DEFAULT_FONT_SIZE) * (obj.scale || 1);
        const text = obj.text || '';

        dom.style.color = 'transparent';
        dom.style.webkitTextFillColor = 'transparent';
        dom.style.backgroundClip = 'text';
        dom.style.webkitBackgroundClip = 'text';
        dom.style.backgroundImage = `url(${obj.dress})`;

        const drawDress = () => {
          try {
            const tmp = document.createElement('canvas');
            const tctx = tmp.getContext('2d');
            tctx.font = `${fontSize}px "${obj.font}"`;
            let w = Math.max(1, Math.ceil(tctx.measureText(text).width));
            let h = Math.max(1, Math.ceil(fontSize * 1.1));
            w = Math.ceil(w + 8); h = Math.ceil(h + 8);
            tmp.width = w; tmp.height = h;
            const dimg = new Image(); dimg.crossOrigin = 'anonymous';
            dimg.onload = () => {
              const t2 = tmp.getContext('2d');
              t2.clearRect(0,0,w,h);
              try { t2.drawImage(dimg, 0, 0, w, h); } catch(e) {}
              t2.globalCompositeOperation = 'destination-in';
              t2.fillStyle = '#000';
              t2.font = `${fontSize}px "${obj.font}"`;
              t2.textBaseline = 'top';
              t2.fillText(text, 4, 4);
              dom.style.backgroundImage = `url(${tmp.toDataURL()})`;
              dom.style.color = 'transparent';
            };
            dimg.onerror = () => { dom.style.color = obj.color || '#000'; };
            dimg.src = obj.dress;
          } catch (e) { dom.style.color = obj.color || '#000'; }
        };

        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => {
            if (obj.font) document.fonts.load(`${fontSize}px "${obj.font}"`).finally(drawDress);
            else drawDress();
          }).catch(drawDress);
        } else drawDress();
      }
    } else if (obj.type === 'image') {
      updateImageOverlay(obj, dom);
    }
  }

  // --- interactions (drag / rotate / pinch) ---
  function attachInteraction(dom, obj) {
    if (!dom) return;
    dom.style.left = (obj.x || 50) + 'px';
    dom.style.top = (obj.y || 50) + 'px';
    dom.style.position = 'absolute';

    const old = dom.querySelector('.rotate-handle'); if (old) old.remove();
    const handle = document.createElement('div'); handle.className = 'rotate-handle'; handle.textContent = '⤾';
    handle.style.width = ROTATE_HANDLE_TOUCH_SIZE + 'px';
    handle.style.height = ROTATE_HANDLE_TOUCH_SIZE + 'px';
    handle.style.top = (-ROTATE_HANDLE_TOUCH_SIZE / 2) + 'px';
    handle.style.left = (-ROTATE_HANDLE_TOUCH_SIZE / 2) + 'px';
    dom.appendChild(handle);

    // mousedown selects
    dom.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      selectElement(dom, obj);
    });

    // pointer drag for desktop
    let dragging = false, sx = 0, sy = 0, sl = 0, st = 0;
    dom.addEventListener('pointerdown', (ev) => {
      if (ev.target === handle) return;
      dragging = true;
      sx = ev.clientX; sy = ev.clientY;
      sl = parseFloat(dom.style.left) || 0;
      st = parseFloat(dom.style.top) || 0;
      try { dom.setPointerCapture && dom.setPointerCapture(ev.pointerId); } catch (e) {}
      ev.preventDefault();
    });
    window.addEventListener('pointermove', (ev) => {
      if (!dragging) return;
      const nx = sl + (ev.clientX - sx);
      const ny = st + (ev.clientY - sy);
      dom.style.left = nx + 'px'; dom.style.top = ny + 'px';
      const id = dom.dataset.id;
      const model = ELEMENTS.find(it => it.id === id);
      if (model) { model.x = nx; model.y = ny; }
    });
    window.addEventListener('pointerup', () => dragging = false);

    // rotate handle
    handle.addEventListener('pointerdown', (ev) => {
      ev.stopPropagation();
      const rect = dom.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const model = ELEMENTS.find(it => it.id === dom.dataset.id) || obj;
      const startAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx) - (model.rotation || 0);
      function move(e2) {
        const angle = Math.atan2(e2.clientY - cy, e2.clientX - cx) - startAngle;
        model.rotation = angle;
        dom.style.transform = `rotate(${angle}rad) scale(${model.scale || 1})`;
      }
      function up() {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });

    // touch gestures: select or pinch-zoom/rotate
    let gesture = { active:false, startDist:0, startAngle:0, origScale: obj.scale||1, origRotation: obj.rotation||0 };
    dom.addEventListener('touchstart', (ev) => {
      if (ev.touches.length === 1) {
        selectElement(dom, obj);
      } else if (ev.touches.length === 2) {
        ev.preventDefault();
        gesture.active = true;
        gesture.origScale = obj.scale || 1;
        gesture.origRotation = obj.rotation || 0;
        const t1 = ev.touches[0], t2 = ev.touches[1];
        const dx = t2.clientX - t1.clientX, dy = t2.clientY - t1.clientY;
        gesture.startDist = Math.hypot(dx,dy);
        gesture.startAngle = Math.atan2(dy, dx);
      }
    }, { passive: false });

    dom.addEventListener('touchmove', (ev) => {
      if (!gesture.active || ev.touches.length !== 2) return;
      ev.preventDefault();
      const t1 = ev.touches[0], t2 = ev.touches[1];
      const dx = t2.clientX - t1.clientX, dy = t2.clientY - t1.clientY;
      const dist = Math.hypot(dx,dy), angle = Math.atan2(dy, dx);
      const factor = dist / (gesture.startDist || dist || 1);
      obj.scale = Math.max(0.3, Math.min(3, gesture.origScale * factor));
      const deltaAngle = angle - gesture.startAngle;
      obj.rotation = gesture.origRotation + deltaAngle;
      dom.style.transform = `rotate(${obj.rotation}rad) scale(${obj.scale})`;
      if (obj.type === 'image') updateImageOverlay(obj, dom);
    }, { passive: false });

    dom.addEventListener('touchend', (ev) => { if (ev.touches.length < 2) gesture.active = false; });

  } // end attachInteraction

  // --- select element visually ---
  function selectElement(dom, obj) {
    document.querySelectorAll('.canvas-item.selected').forEach(e => e.classList.remove('selected'));
    dom.classList.add('selected');
    SELECTED = { dom, obj };
  }

  // click background to deselect
  if (editorCanvas) {
    editorCanvas.addEventListener('mousedown', (e) => {
      if (e.target === editorCanvas) {
        document.querySelectorAll('.canvas-item.selected').forEach(el => el.classList.remove('selected'));
        SELECTED = null;
      }
    });
  }

  // --- Add element (text/image) ---
  if (btnAdd) btnAdd.addEventListener('click', () => {
    if (!modeSelect) return;
    if (modeSelect.value === 'text') {
      const txt = (textInput && textInput.value || '').trim();
      if (!txt) return alert('أدخل نصًا أولاً');
      const obj = createElementObject('text', { text: txt, font: (AVAILABLE_FONTS[0] ? AVAILABLE_FONTS[0].name : 'ReemKufiLocalFallback') });
      const dom = renderElement(obj);
      // place near center
      try {
        const centerX = Math.max(0, (editorCanvas.clientWidth - (dom.offsetWidth || 100)) / 2);
        const centerY = Math.max(0, (editorCanvas.clientHeight - (dom.offsetHeight || 100)) / 2);
        obj.x = centerX; obj.y = centerY;
        dom.style.left = centerX + 'px'; dom.style.top = centerY + 'px';
      } catch(e){}
      // select
      selectElement(dom, obj);
      if (textInput) textInput.value = '';
    } else {
      const f = fileImage && fileImage.files && fileImage.files[0];
      if (!f) return alert('اختر صورة شفافة من جهازك');
      const reader = new FileReader();
      reader.onload = (ev) => {
        const dataUrl = ev.target.result;
        const preload = new Image();
        preload.onload = () => {
          const obj = createElementObject('image', { img: dataUrl });
          const editorW = Math.max(200, editorCanvas.clientWidth || 300);
          const canvasPadding = 40;
          const maxw = Math.min(Math.max(200, editorW - canvasPadding), preload.naturalWidth || editorW);
          obj.displayWidth = Math.min(480, maxw);
          obj.displayHeight = Math.round(obj.displayWidth * (preload.naturalHeight / preload.naturalWidth || 1));
          const dom = renderElement(obj);
          const centerX = Math.max(0, (editorCanvas.clientWidth - obj.displayWidth) / 2);
          const centerY = Math.max(0, (editorCanvas.clientHeight - obj.displayHeight) / 2);
          obj.x = centerX; obj.y = centerY;
          dom.style.left = centerX + 'px'; dom.style.top = centerY + 'px';
          if (DRESSES_LOADED && AVAILABLE_DRESS.length && obj.fillMode === 'dress') applySmartDressToObj(obj, dom);
          selectElement(dom, obj);
        };
        preload.onerror = () => {
          const obj = createElementObject('image', { img: dataUrl });
          const dom = renderElement(obj);
          selectElement(dom, obj);
        };
        preload.src = dataUrl;
      };
      reader.readAsDataURL(f);
      if (fileImage) fileImage.value = '';
    }
  });

  // --- delete selected ---
  if (deleteSelected) {
    deleteSelected.addEventListener('click', () => {
      const sel = document.querySelector('.canvas-item.selected');
      if (!sel) return alert('اختر عنصراً أولاً');
      const id = sel.dataset.id;
      sel.remove();
      const idx = ELEMENTS.findIndex(e => e.id === id);
      if (idx !== -1) ELEMENTS.splice(idx,1);
      SELECTED = null;
    });
  }

  // --- popup for gradients / dressups ---
  function openPopup(type) {
    if (!popupContainer) return;
    popupContainer.innerHTML = '';
    popupContainer.classList.add('open');
    popupContainer.setAttribute('aria-hidden','false');

    const pop = document.createElement('div'); pop.className = 'popup';
    const head = document.createElement('div'); head.className = 'popup-head';
    const title = document.createElement('h3'); title.textContent = type === 'grad' ? 'اختر تدرج' : 'اختر تلبيسة';
    const close = document.createElement('button'); close.className = 'btn'; close.textContent = 'إغلاق';
    close.addEventListener('click', closePopup);
    head.appendChild(title); head.appendChild(close); pop.appendChild(head);

    const body = document.createElement('div'); body.className = 'popup-body';
    const grid = document.createElement('div'); grid.className = (type === 'grad' ? 'grad-grid' : 'dress-grid');

    if (type === 'grad') {
      GRADIENTS.forEach(g => {
        const s = document.createElement('div'); s.className = 'grad-sample';
        s.style.background = `linear-gradient(90deg, ${g[0]}, ${g[1]})`;
        s.addEventListener('click', () => { applyGradientToSelected(g); closePopup(); });
        grid.appendChild(s);
      });
    } else { // dress
      if (AVAILABLE_DRESS.length === 0) {
        const p = document.createElement('div'); p.textContent = 'لا توجد تلبيسات في assets/dressup/'; p.style.padding = '12px';
        body.appendChild(p);
      } else {
        AVAILABLE_DRESS.forEach(url => {
          const d = document.createElement('div'); d.className = 'dress-item';
          const img = document.createElement('img'); img.src = url;
          d.appendChild(img);
          d.addEventListener('click', () => { applyDressToSelected(url); closePopup(); });
          grid.appendChild(d);
        });
      }
    }

    body.appendChild(grid); pop.appendChild(body); popupContainer.appendChild(pop);
  }

  function closePopup() {
    if (!popupContainer) return;
    popupContainer.classList.remove('open');
    popupContainer.innerHTML = '';
    popupContainer.setAttribute('aria-hidden','true');
  }

  if (btnGradients) btnGradients.addEventListener('click', () => openPopup('grad'));
  if (btnDressups) btnDressups.addEventListener('click', () => openPopup('dress'));
  // note: removed image-specific gradient/dress buttons (per request)

  // apply gradient/dress to selected element (text or image)
  function applyGradientToSelected(g) {
    const selectedDom = document.querySelector('.canvas-item.selected');
    if (!selectedDom) { alert('اختر عنصرًا أولاً'); return; }
    const id = selectedDom.dataset.id;
    const obj = ELEMENTS.find(e => e.id === id);
    if (!obj) return;
    obj.fillMode = 'gradient';
    obj.gradient = g;
    if (selectedDom.classList && selectedDom.classList.contains('dressed')) selectedDom.classList.remove('dressed');
    if (obj.type === 'text') {
      selectedDom.style.background = `linear-gradient(90deg, ${g[0]}, ${g[1]})`;
      selectedDom.style.webkitBackgroundClip = 'text';
      selectedDom.style.backgroundClip = 'text';
      selectedDom.style.color = 'transparent';
      selectedDom.style.webkitTextFillColor = 'transparent';
    } else if (obj.type === 'image') {
      updateImageOverlay(obj, selectedDom);
    }
  }

  function applyDressToSelected(url) {
    const selectedDom = document.querySelector('.canvas-item.selected');
    if (!selectedDom) { alert('اختر عنصرًا أولاً'); return; }
    const id = selectedDom.dataset.id;
    const obj = ELEMENTS.find(e => e.id === id);
    if (!obj) return;
    obj.fillMode = 'dress';
    obj.dress = url;
    if (obj.type === 'text') {
      selectedDom.classList.add('dressed');
      applyStyleToDom(obj, selectedDom);
    } else if (obj.type === 'image') {
      selectedDom.classList.add('dressed');
      updateImageOverlay(obj, selectedDom);
    }
  }

  // --- font apply ---
  function applyFontToSelected(fontName) {
    if (!SELECTED) {
      const lastText = [...ELEMENTS].reverse().find(e => e.type === 'text');
      if (lastText) {
        lastText.font = fontName;
        const dom = editorCanvas.querySelector(`[data-id="${lastText.id}"]`);
        if (dom) dom.style.fontFamily = fontName;
      }
      return;
    }
    const { obj, dom } = SELECTED;
    obj.font = fontName;
    if (obj.type === 'text' && dom) dom.style.fontFamily = fontName;
    if (obj.type === 'text' && obj.fillMode === 'dress') applyStyleToDom(obj, dom);
  }

  // Expose a couple helpers for debugging if needed
  window.__ELEMENTS = ELEMENTS;
  window.__applyFontToSelected = applyFontToSelected;
  window.__renderElement = renderElement;
  window.__createElementObject = createElementObject;

  // --- export / download as PNG ---
  if (downloadImage) downloadImage.addEventListener('click', async () => {
    try {
      const rect = editorCanvas.getBoundingClientRect();
      const W = Math.max(1, Math.round(rect.width));
      const H = Math.max(1, Math.round(rect.height));

      const desiredW = parseInt(widthInput && widthInput.value) || W;
      const desiredH = parseInt(heightInput && heightInput.value) || H;
      const scaleX = desiredW / W;
      const scaleY = desiredH / H;
      const scale = Math.min(scaleX, scaleY);

      const out = document.createElement('canvas');
      const ctx = out.getContext('2d');
      out.width = Math.max(1, Math.round(W * scale));
      out.height = Math.max(1, Math.round(H * scale));
      ctx.scale(scale, scale);
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0,0,W,H);

      const domChildren = Array.from(editorCanvas.querySelectorAll('.canvas-item'));
      for (const dom of domChildren) {
        const id = dom.dataset.id;
        const obj = ELEMENTS.find(e => e.id === id);
        if (!obj) continue;

        if (obj.type === 'text') {
          const x = Math.round((parseFloat(dom.style.left) || obj.x || 0));
          const y = Math.round((parseFloat(dom.style.top) || obj.y || 0));
          const fontSize = (obj.size || DEFAULT_FONT_SIZE) * (obj.scale || 1);
          ctx.save();
          const bboxW = dom.offsetWidth || (fontSize * (obj.text ? obj.text.length : 1));
          const bboxH = dom.offsetHeight || fontSize;
          const cx = x + bboxW / 2, cy = y + bboxH / 2;
          ctx.translate(cx, cy); ctx.rotate(obj.rotation || 0); ctx.translate(-cx, -cy);
          ctx.font = `${fontSize}px "${obj.font || 'ReemKufiLocalFallback'}"`;
          ctx.textAlign = 'left'; ctx.textBaseline = 'top';

          if (obj.fillMode === 'solid' || !obj.gradient) {
            ctx.fillStyle = obj.color || '#000';
            if (obj.stroke && obj.stroke > 0) { ctx.lineWidth = obj.stroke; ctx.strokeStyle = obj.strokeColor || '#000'; ctx.strokeText(obj.text, x, y); }
            ctx.fillText(obj.text, x, y);
          } else if (obj.fillMode === 'gradient' && obj.gradient) {
            const g = ctx.createLinearGradient(x, y, x + bboxW, y);
            g.addColorStop(0, obj.gradient[0]); g.addColorStop(1, obj.gradient[1]);
            ctx.fillStyle = g;
            if (obj.stroke && obj.stroke > 0) { ctx.lineWidth = obj.stroke; ctx.strokeStyle = obj.strokeColor || '#000'; ctx.strokeText(obj.text, x, y); }
            ctx.fillText(obj.text, x, y);
          } else if (obj.fillMode === 'dress' && obj.dress) {
            const tmp = document.createElement('canvas');
            tmp.width = Math.max(1, Math.round(bboxW));
            tmp.height = Math.max(1, Math.round(bboxH));
            const tctx = tmp.getContext('2d');
            tctx.clearRect(0,0,tmp.width,tmp.height);
            tctx.font = `${fontSize}px "${obj.font || 'ReemKufiLocalFallback'}"`;
            tctx.textAlign = 'left';
            tctx.textBaseline = 'top';
            tctx.fillStyle = '#000';
            tctx.fillText(obj.text, 0, 0);

            await new Promise((res) => {
              const img = new Image(); img.crossOrigin = 'anonymous';
              img.onload = () => {
                try {
                  const pattern = tctx.createPattern(img, 'repeat');
                  tctx.globalCompositeOperation = 'source-in';
                  tctx.fillStyle = pattern;
                  tctx.fillRect(0,0,tmp.width,tmp.height);
                  ctx.setTransform(1,0,0,1,0,0);
                  ctx.drawImage(tmp, x, y);
                } catch (e) {
                  ctx.fillStyle = '#000'; ctx.fillText(obj.text, x, y);
                }
                res();
              };
              img.onerror = () => { ctx.fillStyle = '#000'; ctx.fillText(obj.text, x, y); res(); };
              img.src = obj.dress;
            });
          }
          ctx.restore();
        } else if (obj.type === 'image') {
          const wrap = dom;
          const imgEl = wrap.querySelector('img');
          if (!imgEl) continue;
          await new Promise((res) => {
            const img = new Image(); img.crossOrigin = 'anonymous';
            img.onload = () => {
              const left = Math.round(parseFloat(wrap.style.left) || obj.x || 0);
              const top = Math.round(parseFloat(wrap.style.top) || obj.y || 0);
              const drawW = parseInt(imgEl.style.width) || ((obj.displayWidth || img.naturalWidth) * (obj.scale || 1)) || img.naturalWidth;
              const drawH = parseInt(imgEl.style.height) || ((obj.displayHeight || img.naturalHeight) * (obj.scale || 1)) || img.naturalHeight;

              if (obj.fillMode === 'gradient' && obj.gradient) {
                const tmp = document.createElement('canvas'); tmp.width = Math.max(1, Math.round(drawW)); tmp.height = Math.max(1, Math.round(drawH));
                const tctx = tmp.getContext('2d');
                const g = tctx.createLinearGradient(0,0,tmp.width,0);
                g.addColorStop(0, obj.gradient[0]); g.addColorStop(1, obj.gradient[1]);
                tctx.fillStyle = g; tctx.fillRect(0,0,tmp.width,tmp.height);
                tctx.globalCompositeOperation = 'destination-in';
                try { tctx.drawImage(img, 0, 0, tmp.width, tmp.height); } catch(e) {}
                ctx.drawImage(tmp, left, top, tmp.width, tmp.height);
                res();
              } else if (obj.fillMode === 'dress' && obj.dress) {
                const dressImg = new Image(); dressImg.crossOrigin = 'anonymous';
                dressImg.onload = () => {
                  const tmp = document.createElement('canvas'); tmp.width = Math.max(1, Math.round(drawW)); tmp.height = Math.max(1, Math.round(drawH));
                  const tctx = tmp.getContext('2d');
                  try { tctx.drawImage(dressImg, 0, 0, tmp.width, tmp.height); } catch(e) {}
                  tctx.globalCompositeOperation = 'destination-in';
                  try { tctx.drawImage(img, 0, 0, tmp.width, tmp.height); } catch(e) {}
                  ctx.drawImage(tmp, left, top, tmp.width, tmp.height);
                  res();
                };
                dressImg.onerror = () => { ctx.drawImage(img, left, top, drawW, drawH); res(); };
                dressImg.src = obj.dress;
              } else {
                ctx.drawImage(img, left, top, drawW, drawH);
                res();
              }
            };
            img.onerror = () => res();
            img.src = imgEl.src;
          });
        }
      }

      const url = out.toDataURL('image/png');
      const a = document.createElement('a'); a.href = url; a.download = 'design.png'; a.click();
    } catch (err) {
      console.error(err);
      alert('حدث خطأ أثناء التصدير: ' + (err && err.message || err));
    }
  });

  // --- helpers specific for text ---
  function applyGradientToText(g) {
    if (!SELECTED || SELECTED.obj.type !== 'text') { alert('اختر نصاً أولاً'); return; }
    const { obj, dom } = SELECTED;
    obj.fillMode = 'gradient';
    obj.gradient = g;
    if (dom && dom.classList.contains('dressed')) dom.classList.remove('dressed');
    dom.style.background = `linear-gradient(90deg, ${g[0]}, ${g[1]})`;
    dom.style.webkitBackgroundClip = 'text';
    dom.style.backgroundClip = 'text';
    dom.style.color = 'transparent';
    dom.style.webkitTextFillColor = 'transparent';
  }

  function applyDressToText(url) {
    if (!SELECTED || SELECTED.obj.type !== 'text') { alert('اختر نصاً أولاً'); return; }
    const { obj, dom } = SELECTED;
    obj.fillMode = 'dress';
    obj.dress = url;
    if (dom) dom.classList.add('dressed');
    applyStyleToDom(obj, dom);
  }

  // --- mode toggle for controls ---
  if (modeSelect) modeSelect.addEventListener('change', () => {
    if (modeSelect.value === 'text') {
      textControls && textControls.classList.remove('hidden');
      imageControls && imageControls.classList.add('hidden');
    } else {
      textControls && textControls.classList.add('hidden');
      imageControls && imageControls.classList.remove('hidden');
    }
  });

  // --- click outside font panel closes it ---
  document.addEventListener('click', (e) => {
    if (fontListPanel && !fontListPanel.contains(e.target) && e.target !== fontListBtn) fontListPanel.classList.add('hidden');
  });

  // clicking item selects it (delegated)
  document.addEventListener('click', (e) => {
    const item = e.target.closest('.canvas-item');
    if (item && editorCanvas && editorCanvas.contains(item)) {
      item.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    }
  });

  // expose popup openers (HTML may call these)
  window.__openColorPopup = () => openPopup('grad');
  window.__openDressPopup = () => openPopup('dress');

  // applySmartDressToObj helper
  function applySmartDressToObj(obj, dom) {
    if (!obj || !dom) return;
    if (!AVAILABLE_DRESS || AVAILABLE_DRESS.length === 0) return;
    if (!obj.dress) obj.dress = AVAILABLE_DRESS[0];
    obj.fillMode = 'dress';
    applyStyleToDom(obj, dom);
    dom.classList.add('dressed');
  }

  // --- init assets (async) ---
  (async () => {
    try {
      await populateAssets();
    } catch (e) {
      console.warn('populateAssets failed', e);
      showInlineMessage('خطأ أثناء تحميل الأصول — تحقق من مجلد assets/');
    }
  })();

  // open font list button
  if (fontListBtn) fontListBtn.addEventListener('click', (e) => {
    if (!fontListPanel) return;
    const isOpen = !fontListPanel.classList.contains('hidden');
    fontListPanel.classList.toggle('hidden');
    fontListBtn.setAttribute('aria-expanded', String(!isOpen));
  });

  // --- Sidebar behavior (safe) ---
  function ensureSidebarControls() {
    if (toggleSidebar) {
      toggleSidebar.addEventListener('click', () => {
        if (!siteSidebar) return;
        siteSidebar.classList.toggle('open');
        siteSidebar.classList.toggle('active');
        siteSidebar.setAttribute('aria-hidden', !siteSidebar.classList.contains('open'));
      });
    }
    if (closeSidebar) {
      closeSidebar.addEventListener('click', () => {
        if (!siteSidebar) return;
        siteSidebar.classList.remove('open');
        siteSidebar.classList.remove('active');
        siteSidebar.setAttribute('aria-hidden', 'true');
      });
    }
    document.addEventListener('click', (e) => {
      if (!siteSidebar) return;
      if (!siteSidebar.classList.contains('open')) return;
      if (!siteSidebar.contains(e.target) && !(toggleSidebar && toggleSidebar.contains(e.target))) {
        siteSidebar.classList.remove('open');
        siteSidebar.classList.remove('active');
        siteSidebar.setAttribute('aria-hidden', 'true');
      }
    });
  }
  ensureSidebarControls();

  // MutationObserver: when new canvas-item is appended, attach interaction
  if (editorCanvas) {
    const observer = new MutationObserver((mutList) => {
      for (const m of mutList) {
        for (const n of m.addedNodes) {
          if (n.nodeType === 1 && n.classList && n.classList.contains('canvas-item')) {
            const id = n.dataset.id;
            const model = ELEMENTS.find(it => it.id === id);
            if (model) attachInteraction(n, model);
          }
        }
      }
    });
    observer.observe(editorCanvas, { childList: true });
  }

  // attach interaction to any existing items
  document.querySelectorAll('.canvas-item').forEach(dom => {
    const id = dom.dataset.id;
    const model = ELEMENTS.find(it => it.id === id);
    if (model) attachInteraction(dom, model);
  });

  // final ready message (quiet)
  // showInlineMessage('المحرر جاهز');
}); // end DOMContentLoaded

