/* professional-decoration.js - Final complete (merged & fixed)
   - Full standalone JS for professional-decoration HTML/CSS provided by user
   - Fixes: sidebar open/close using image button, no duplicate declarations,
     image overlay clearing to prevent duplicate drawing, resilient asset loading,
     consistent element model, and stable export flow.
   - Place this file at ../js/professional-decoration.js (same path as your HTML)
*/

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM refs (must match the HTML you provided) ---
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

  // --- State ---
  let SELECTED = null;
  const ELEMENTS = [];
  let AVAILABLE_FONTS = [];
  let AVAILABLE_DRESS = [];
  let DRESSES_LOADED = false;

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

  const isMobileLike = window.innerWidth <= 768;
  const DEFAULT_FONT_SIZE = isMobileLike ? 48 : 72;
  const ROTATE_HANDLE_TOUCH_SIZE = isMobileLike ? 44 : 34;

  // --- assets base detection ---
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
        zIndex: '999',
        background: 'rgba(0,0,0,0.6)',
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

  function detectGitHubRepo() {
    try {
      const host = window.location.hostname || '';
      if (!host.includes('github.io')) return null;
      const owner = host.split('.github.io')[0];
      const parts = window.location.pathname.split('/').filter(Boolean);
      const repo = parts.length ? parts[0] : null;
      return { owner, repo };
    } catch (e) { return null; }
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

    const repo = detectGitHubRepo();
    if (repo && repo.owner && repo.repo) {
      // try Github API listing if deployed on github pages
      try {
        const resF = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/assets/fonts`);
        if (resF.ok) {
          const list = await resF.json();
          list.filter(f => f.type === 'file' && /\.(ttf|otf|woff2?|woff)$/i.test(f.name)).forEach(f => {
            const name = f.name.replace(/\.[^/.]+$/, '');
            AVAILABLE_FONTS.push({ name, url: f.download_url });
            registerFont(name, f.download_url);
          });
        }
      } catch (e) { /* ignore */ }

      try {
        const resD = await fetch(`https://api.github.com/repos/${repo.owner}/${repo.repo}/contents/assets/dressup`);
        if (resD.ok) {
          const list2 = await resD.json();
          list2.filter(f => f.type === 'file' && /\.(png|jpe?g|webp|svg)$/i.test(f.name)).forEach(f => {
            AVAILABLE_DRESS.push(f.download_url);
          });
        }
      } catch (e) { /* ignore */ }

      DRESSES_LOADED = true;
      refreshFontListUI();
      return;
    }

    // Fallback: probe common filenames
    const tryFonts = ['ReemKufi.ttf', 'ReemKufi-Regular.ttf', 'ReemKufi.woff2'];
    for (const fname of tryFonts) {
      const furl = new URL(`fonts/${fname}`, assetsBase).href;
      try {
        const r = await fetch(furl, { method: 'HEAD' });
        if (r && r.ok) { AVAILABLE_FONTS.push({ name: fileNameNoExt(fname), url: furl }); registerFont(fileNameNoExt(fname), furl); }
      } catch (e) { /* ignore */ }
    }
    const tryD = ['dressup/gold.png', 'dressup/silver.png', 'dressup/glitter1.webp'];
    for (const p of tryD) {
      const durl = new URL(p, assetsBase).href;
      try {
        const h = await fetch(durl, { method: 'HEAD' });
        if (h && h.ok) AVAILABLE_DRESS.push(durl);
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
      btn.addEventListener('click', () => {
        applyFontToSelected(f.name);
        fontListPanel.classList.add('hidden');
      });
      fontListPanel.appendChild(btn);
    });
  }

  // --- element model & render ---
  function createElementObject(type, data) {
    const id = 'el_' + (Date.now() + Math.floor(Math.random() * 999));
    const base = {
      id, type, x: 80, y: 80, rotation: 0, scale: 1,
      font: AVAILABLE_FONTS.length ? AVAILABLE_FONTS[0].name : 'ReemKufiLocalFallback',
      size: DEFAULT_FONT_SIZE, stroke: 0, strokeColor: '#000', fillMode: 'solid', gradient: null, dress: null, img: null,
      displayWidth: null, displayHeight: null, text: ''
    };
    const obj = Object.assign(base, data || {});
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
      attachInteraction(dom, obj);
      editorCanvas.appendChild(dom);
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

      const finalizeImageLayout = () => {
        const canvasPadding = 40;
        const editorW = Math.max(200, editorCanvas.clientWidth || 300);
        const maxw = Math.min(Math.max(200, editorW - canvasPadding), img.naturalWidth || editorW);
        const dispW = obj.displayWidth || Math.min(480, maxw);
        const dispH = dispW; // square preview by default

        img.style.width = dispW + 'px';
        wrap.style.width = dispW + 'px';
        wrap.style.height = dispH + 'px';

        overlayCanvas.width = dispW; overlayCanvas.height = dispH;
        overlayCanvas.style.width = dispW + 'px'; overlayCanvas.style.height = dispH + 'px';
        obj.displayWidth = dispW; obj.displayHeight = dispH;
        updateImageOverlay(obj, wrap);
      };

      if (img.complete && img.naturalWidth && img.naturalWidth > 0) {
        setTimeout(finalizeImageLayout, 0);
      } else {
        img.addEventListener('load', function _onLoad() {
          img.removeEventListener('load', _onLoad);
          finalizeImageLayout();
        });
        img.addEventListener('error', function _onErr() {
          img.removeEventListener('error', _onErr);
          obj.displayWidth = obj.displayWidth || Math.min(300, (editorCanvas.clientWidth || 600) - 40);
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

      if (obj.fillMode === 'dress' && obj.dress) {
        dom.classList.add('dressed');
        updateImageOverlay(obj, dom);
      }
    }
    return dom;
  }

  // --- update overlay for image (ensures clearing, hides base image when overlay active) ---
  function updateImageOverlay(obj, wrap) {
    if (!wrap) return;
    const imgEl = wrap.querySelector('img');
    const overlayCanvas = wrap.querySelector('.img-overlay-canvas');
    if (!imgEl || !overlayCanvas) return;

    // wait for image loaded if needed
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

    // compute displayed width/height (consider scale)
    const baseDispW = (obj.displayWidth || parseInt(imgEl.style.width) || imgEl.naturalWidth) || 1;
    const dispW = Math.max(1, Math.round(baseDispW * (obj.scale || 1)));
    const baseDispH = (obj.displayHeight || Math.round(imgEl.naturalHeight * (baseDispW / (imgEl.naturalWidth || baseDispW)))) || 1;
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
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, dispW, dispH);

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
      const g = ctx.createLinearGradient(0, 0, dispW, 0);
      g.addColorStop(0, obj.gradient[0]); g.addColorStop(1, obj.gradient[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, dispW, dispH);

      ctx.globalCompositeOperation = 'destination-in';
      try { ctx.drawImage(imgEl, 0, 0, dispW, dispH); } catch (e) { /* ignore cross-origin drawing errors */ }
      ctx.globalCompositeOperation = 'source-over';
    } else if (hasDress) {
      const dimg = new Image();
      dimg.crossOrigin = 'anonymous';
      dimg.onload = () => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, dispW, dispH);
        try { ctx.drawImage(dimg, 0, 0, dispW, dispH); } catch (e) { /* ignore */ }
        ctx.globalCompositeOperation = 'destination-in';
        try { ctx.drawImage(imgEl, 0, 0, dispW, dispH); } catch (e) { /* ignore */ }
        ctx.globalCompositeOperation = 'source-over';
      };
      dimg.onerror = () => {
        overlayCanvas.style.opacity = '0';
        overlayCanvas.style.display = 'none';
        imgEl.style.opacity = '1';
      };
      dimg.src = obj.dress;
    } else {
      overlayCanvas.style.opacity = 0;
      overlayCanvas.style.display = 'none';
      imgEl.style.opacity = '1';
    }
  }

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
              t2.clearRect(0, 0, w, h);
              try { t2.drawImage(dimg, 0, 0, w, h); } catch (e) { /* ignore */ }
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
          } catch (e) {
            dom.style.color = obj.color || '#000';
          }
        };

        if (document.fonts && document.fonts.ready) {
          document.fonts.ready.then(() => {
            if (obj.font) {
              document.fonts.load(`${fontSize}px "${obj.font}"`).finally(drawDress);
            } else drawDress();
          }).catch(drawDress);
        } else {
          drawDress();
        }
      }
    } else if (obj.type === 'image') {
      updateImageOverlay(obj, dom);
    }
  }

  // --- interactions (drag / rotate / pinch) ---
  function attachInteraction(dom, obj) {
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

    dom.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      selectElement(dom, obj);
    });

    let dragging = false, sx = 0, sy = 0, sl = 0, st = 0;
    dom.addEventListener('pointerdown', (ev) => {
      // ignore rotate handle pointerdown here
      if (ev.target === handle) return;
      dragging = true;
      sx = ev.clientX; sy = ev.clientY;
      sl = parseFloat(dom.style.left) || 0;
      st = parseFloat(dom.style.top) || 0;
      try { dom.setPointerCapture && dom.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ }
      ev.preventDefault();
    });
    window.addEventListener('pointermove', (ev) => {
      if (!dragging) return;
      const nx = sl + (ev.clientX - sx);
      const ny = st + (ev.clientY - sy);
      dom.style.left = nx + 'px'; dom.style.top = ny + 'px';
      obj.x = nx; obj.y = ny;
    });
    window.addEventListener('pointerup', () => dragging = false);

    handle.addEventListener('pointerdown', (ev) => {
      ev.stopPropagation();
      const rect = dom.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const startAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx) - (obj.rotation || 0);
      function move(e2) {
        const angle = Math.atan2(e2.clientY - cy, e2.clientX - cx) - startAngle;
        obj.rotation = angle;
        dom.style.transform = `rotate(${angle}rad) scale(${obj.scale || 1})`;
      }
      function up() {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });

    // pinch gestures for touch
    let gesture = { active: false, startDist: 0, startAngle: 0, origScale: obj.scale || 1, origRotation: obj.rotation || 0 };
    dom.addEventListener('touchstart', (ev) => {
      if (ev.touches.length === 1) {
        selectElement(dom, obj);
      } else if (ev.touches.length === 2) {
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

    dom.addEventListener('touchmove', (ev) => {
      if (!gesture.active || ev.touches.length !== 2) return;
      ev.preventDefault();
      const t1 = ev.touches[0]; const t2 = ev.touches[1];
      const dx = t2.clientX - t1.clientX; const dy = t2.clientY - t1.clientY;
      const dist = Math.hypot(dx, dy); const angle = Math.atan2(dy, dx);
      const factor = dist / (gesture.startDist || dist || 1);
      obj.scale = Math.max(0.3, Math.min(3, gesture.origScale * factor));
      const deltaAngle = angle - gesture.startAngle;
      obj.rotation = gesture.origRotation + deltaAngle;
      dom.style.transform = `rotate(${obj.rotation}rad) scale(${obj.scale})`;
      if (obj.type === 'image') updateImageOverlay(obj, dom);
    }, { passive: false });

    dom.addEventListener('touchend', (ev) => {
      if (ev.touches.length < 2) gesture.active = false;
    });
  }

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

function textToImageDataURL(text, fontName, fontSize, color = '#000') {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  ctx.font = `${fontSize}px "${fontName}"`;
  const w = Math.ceil(ctx.measureText(text).width + 20);
  const h = Math.ceil(fontSize * 1.3);
  canvas.width = w;
  canvas.height = h;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.font = `${fontSize}px "${fontName}"`;
  ctx.fillStyle = color;
  ctx.textBaseline = 'top';
  ctx.fillText(text, 10, 0);
  return canvas.toDataURL('image/png');
}
  // --- Add element (text/image) ---
  if (btnAdd) btnAdd.addEventListener('click', () => {
    if (!modeSelect) return;
    if (modeSelect.value === 'text') {
      const txt = (textInput && textInput.value || '').trim();
      if (!txt) return alert('أدخل نصًا أولاً');
      const dataUrl = textToImageDataURL(txt, (AVAILABLE_FONTS[0] ? AVAILABLE_FONTS[0].name : 'ReemKufiLocalFallback'), DEFAULT_FONT_SIZE, '#000');
const obj = createElementObject('image', { img: dataUrl });
      const dom = renderElement(obj);
      const lastDom = editorCanvas.querySelector(`[data-id="${obj.id}"]`);
      if (lastDom) selectElement(lastDom, obj);
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
          obj.displayHeight = Math.round(obj.displayWidth * (preload.naturalHeight / preload.naturalWidth));

          const dom = renderElement(obj);
          const centerX = Math.max(0, (editorCanvas.clientWidth - obj.displayWidth) / 2);
          const centerY = Math.max(0, (editorCanvas.clientHeight - obj.displayHeight) / 2);
          obj.x = centerX;
          obj.y = centerY;
          dom.style.left = centerX + 'px';
          dom.style.top = centerY + 'px';
          if (DRESSES_LOADED && AVAILABLE_DRESS.length && obj.fillMode === 'dress') {
            applySmartDressToObj(obj, dom);
          }
          const lastDom = editorCanvas.querySelector(`[data-id="${obj.id}"]`);
          if (lastDom) selectElement(lastDom, obj);
        };
        preload.onerror = () => {
          const obj = createElementObject('image', { img: dataUrl });
          const dom = renderElement(obj);
          if (DRESSES_LOADED && AVAILABLE_DRESS.length && obj.fillMode === 'dress') {
            applySmartDressToObj(obj, dom);
          }
          const lastDom = editorCanvas.querySelector(`[data-id="${obj.id}"]`);
          if (lastDom) selectElement(lastDom, obj);
        };
        preload.src = dataUrl;
      };
      reader.readAsDataURL(f);
      if (fileImage) fileImage.value = '';
    }
  });

  // --- delete selected ---
  if (deleteSelected) deleteSelected.addEventListener('click', () => {
    if (!SELECTED) return alert('اختر عنصراً أولاً');
    const { dom, obj } = SELECTED;
    dom.remove();
    const idx = ELEMENTS.findIndex(e => e.id === obj.id);
    if (idx !== -1) ELEMENTS.splice(idx, 1);
    SELECTED = null;
  });

  // --- popup for gradients / dressups ---
  function openPopup(type) {
    if (!popupContainer) return;
    popupContainer.innerHTML = '';
    popupContainer.classList.add('open');
    popupContainer.setAttribute('aria-hidden', 'false');

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
        s.addEventListener('click', () => {
          applyGradientToSelected(g);
          closePopup();
        });
        grid.appendChild(s);
      });
    } else {
      if (AVAILABLE_DRESS.length === 0) {
        const p = document.createElement('div'); p.textContent = 'لا توجد تلبيسات في assets/dressup/'; p.style.padding = '12px';
        body.appendChild(p);
      } else {
        AVAILABLE_DRESS.forEach(url => {
          const d = document.createElement('div'); d.className = 'dress-item';
          const img = document.createElement('img'); img.src = url;
          d.appendChild(img);
          d.addEventListener('click', () => {
            applyDressToSelected(url);
            closePopup();
          });
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
    popupContainer.setAttribute('aria-hidden', 'true');
  }

  if (btnGradients) btnGradients.addEventListener('click', () => openPopup('grad'));
  if (btnDressups) btnDressups.addEventListener('click', () => openPopup('dress'));
  if (btnGradientsImg) btnGradientsImg.addEventListener('click', () => openPopup('grad'));
  if (btnDressupsImg) btnDressupsImg.addEventListener('click', () => openPopup('dress'));

  // --- apply gradient/dress to selected ---
  function applyGradientToSelected(g) {
    if (!SELECTED) { alert('اختر عنصرًا أولاً'); return; }
    const { obj, dom } = SELECTED;
    obj.fillMode = 'gradient';
    obj.gradient = g;
    if (dom.classList && dom.classList.contains('dressed')) dom.classList.remove('dressed');
    if (obj.type === 'text') {
      dom.style.background = `linear-gradient(90deg, ${g[0]}, ${g[1]})`;
      dom.style.webkitBackgroundClip = 'text';
      dom.style.backgroundClip = 'text';
      dom.style.color = 'transparent';
      dom.style.webkitTextFillColor = 'transparent';
    } else if (obj.type === 'image') {
      updateImageOverlay(obj, dom);
    }
  }

  function applyDressToSelected(url) {
    if (!SELECTED) { alert('اختر عنصرًا أولاً'); return; }
    const { obj, dom } = SELECTED;
    obj.fillMode = 'dress';
    obj.dress = url;
    if (obj.type === 'text') {
      dom.classList.add('dressed');
      applyStyleToDom(obj, dom);
    } else if (obj.type === 'image') {
      dom.classList.add('dressed');
      updateImageOverlay(obj, dom);
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

  // --- export / download as PNG ---
  if (downloadImage) downloadImage.addEventListener('click', async () => {
    try {
      const rect = editorCanvas.getBoundingClientRect();
      const W = Math.round(rect.width);
      const H = Math.round(rect.height);

      const desiredW = parseInt(document.getElementById('widthInput').value) || W;
      const desiredH = parseInt(document.getElementById('heightInput').value) || H;
      const scaleX = desiredW / W;
      const scaleY = desiredH / H;
      const scale = Math.min(scaleX, scaleY);

      const out = document.createElement('canvas');
      const ctx = out.getContext('2d');
      out.width = Math.max(1, Math.round(W * scale));
      out.height = Math.max(1, Math.round(H * scale));
      ctx.scale(scale, scale);
      ctx.imageSmoothingQuality = 'high';
      ctx.clearRect(0, 0, W, H);

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
          const cx = x + bboxW / 2; const cy = y + bboxH / 2;
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
            const tmp = document.createElement('canvas'); tmp.width = Math.max(1, Math.round(bboxW)); tmp.height = Math.max(1, Math.round(bboxH));
            const tctx = tmp.getContext('2d');
            tctx.clearRect(0, 0, tmp.width, tmp.height);
            tctx.font = `${fontSize}px "${obj.font || 'ReemKufiLocalFallback'}"`;
            tctx.textAlign = 'left'; tctx.textBaseline = 'top';
            tctx.fillStyle = '#000'; tctx.fillText(obj.text, 0, 0);
            await new Promise((res) => {
              const img = new Image(); img.crossOrigin = 'anonymous';
              img.onload = () => {
                const t2 = document.createElement('canvas'); t2.width = tmp.width; t2.height = tmp.height;
                const t2ctx = t2.getContext('2d');
                try { t2ctx.drawImage(img, 0, 0, t2.width, t2.height); } catch (e) { /* ignore */ }
                t2ctx.globalCompositeOperation = 'destination-in';
                try { t2ctx.drawImage(tmp, 0, 0); } catch (e) { /* ignore */ }
                ctx.drawImage(t2, x, y);
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
            img.onload = async () => {
              const left = Math.round(parseFloat(wrap.style.left) || obj.x || 0);
              const top = Math.round(parseFloat(wrap.style.top) || obj.y || 0);
              const drawW = parseInt(imgEl.style.width) || ((obj.displayWidth || img.naturalWidth) * (obj.scale || 1)) || img.naturalWidth;
              const drawH = parseInt(imgEl.style.height) || ((obj.displayHeight || img.naturalHeight) * (obj.scale || 1)) || img.naturalHeight;

              if (obj.fillMode === 'gradient' && obj.gradient) {
                const tmp = document.createElement('canvas'); tmp.width = Math.max(1, Math.round(drawW)); tmp.height = Math.max(1, Math.round(drawH));
                const tctx = tmp.getContext('2d');
                const g = tctx.createLinearGradient(0, 0, tmp.width, 0);
                g.addColorStop(0, obj.gradient[0]); g.addColorStop(1, obj.gradient[1]);
                tctx.fillStyle = g; tctx.fillRect(0, 0, tmp.width, tmp.height);
                tctx.globalCompositeOperation = 'destination-in';
                try { tctx.drawImage(img, 0, 0, tmp.width, tmp.height); } catch (e) { /* ignore */ }
                ctx.drawImage(tmp, left, top, tmp.width, tmp.height);
                res();
              } else if (obj.fillMode === 'dress' && obj.dress) {
                const dressImg = new Image(); dressImg.crossOrigin = 'anonymous';
                dressImg.onload = () => {
                  const tmp = document.createElement('canvas'); tmp.width = Math.max(1, Math.round(drawW)); tmp.height = Math.max(1, Math.round(drawH));
                  const tctx = tmp.getContext('2d');
                  try { tctx.drawImage(dressImg, 0, 0, tmp.width, tmp.height); } catch (e) { /* ignore */ }
                  tctx.globalCompositeOperation = 'destination-in';
                  try { tctx.drawImage(img, 0, 0, tmp.width, tmp.height); } catch (e) { /* ignore */ }
                  ctx.drawImage(tmp, left, top, tmp.width, tmp.height);
                  res();
                };
                dressImg.onerror = () => { ctx.drawImage(img, left, top, drawW, drawH); res(); };
                dressImg.src = obj.dress;
              } else {
                ctx.drawImage(img, left, top, drawW, drawH); res();
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

  // refresh UI initially
  refreshFontListUI();

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
    fontListPanel.classList.toggle('hidden');
  });

  // --- Sidebar behavior (fixed & safe) ---
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

  // --- End of DOMContentLoaded handler ---
}); // end DOMContentLoaded
