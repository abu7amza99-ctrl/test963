/* professional-decoration.part1.js
   جزء 1/2 - يوفر الجزء الأول من السكربت النهائي
*/

document.addEventListener('DOMContentLoaded', () => {
  // --- DOM refs ---
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

  // 50 gradients generator (produce valid CSS hsl strings)
  const GRADIENTS = (function(){
    const out = [];
    for(let i=0;i<50;i++){
      const h = ((i*360/50)|0);
      const a = 'hsl(' + h + ', 80%, 45%)';
      const b = 'hsl(' + ((h+40)%360) + ', 80%, 60%)';
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
      s.textContent = `@font-face { font-family: "${fontName}"; src: url("${url}"); font-display: swap; }`;
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
        if (fontListBtn) fontListBtn.setAttribute('aria-expanded', 'false');
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
        const dispH = dispW;

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

  // Attach interaction (drag/rotate/pinch) function declared but implemented later in part2
  // We declare a placeholder now so other functions can reference it (will be replaced in part2 scope).
  window.__attachInteractionPlaceholder = function attachInteraction(dom, obj) {
    // placeholder: will be replaced when part2 loads
    console.warn('attachInteraction placeholder used. Ensure part2 JS is loaded.');
  };

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

  // Expose some helpers for part2
  window.__applyStyleToDom = applyStyleToDom;
  window.__renderElement = renderElement;
  window.__createElementObject = createElementObject;
  window.__selectElement = selectElement;
  window.__ELEMENTS = ELEMENTS;
  window.__AVAILABLE_DRESS = AVAILABLE_DRESS;

  // --- font apply (declared here to be used by refreshFontListUI) ---
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

  window.__applyFontToSelected = applyFontToSelected;

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

  // --- Sidebar behavior ---
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

  // --- expose popup openers ---
  window.__openColorPopup = () => openPopup('grad');
  window.__openDressPopup = () => openPopup('dress');

  // End of part1 scope - part2 will add interactions, export and the remaining helpers.
});
