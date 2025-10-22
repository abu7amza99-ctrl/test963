/* professional-decoration.part2.js
   جزء 2/2 - يكمل السكربت: التفاعلات، تطبيق الملابس والتدرجات والتصدير
*/

document.addEventListener('DOMContentLoaded', () => {
  // استيراد مراجع ووظائف من الجزء الأول (المتاحة على window)
  const editorCanvas = document.getElementById('editorCanvas');
  const downloadImage = document.getElementById('downloadImage');
  const deleteSelected = document.getElementById('deleteSelected');
  const widthInput = document.getElementById('widthInput');
  const heightInput = document.getElementById('heightInput');
  const ELEMENTS = window.__ELEMENTS || [];
  const AVAILABLE_DRESS = window.__AVAILABLE_DRESS || [];

  // fallback للوظائف في حال لم تتوفر (لن يحدث عادة)
  const applyStyleToDom = window.__applyStyleToDom || function(){};
  const renderElement = window.__renderElement || function(){};
  const createElementObject = window.__createElementObject || function(){};
  const selectElement = window.__selectElement || function(){};
  const applyFontToSelected = window.__applyFontToSelected || function(){};

  // محلياً نعيد تعريف attachInteraction (تبديل الـ placeholder)
  function attachInteraction(dom, obj) {
    dom.style.left = (obj.x || 50) + 'px';
    dom.style.top = (obj.y || 50) + 'px';
    dom.style.position = 'absolute';

    const old = dom.querySelector('.rotate-handle'); if (old) old.remove();
    const handle = document.createElement('div'); handle.className = 'rotate-handle'; handle.textContent = '⤾';
    const ROTATE_HANDLE_TOUCH_SIZE = window.innerWidth <= 768 ? 44 : 34;
    handle.style.width = ROTATE_HANDLE_TOUCH_SIZE + 'px';
    handle.style.height = ROTATE_HANDLE_TOUCH_SIZE + 'px';
    handle.style.top = (-ROTATE_HANDLE_TOUCH_SIZE / 2) + 'px';
    handle.style.left = (-ROTATE_HANDLE_TOUCH_SIZE / 2) + 'px';
    dom.appendChild(handle);

    dom.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      // find obj by dataset if not provided
      const id = dom.dataset.id;
      const model = ELEMENTS.find(it => it.id === id) || obj;
      selectElement(dom, model);
    });

    let dragging = false, sx = 0, sy = 0, sl = 0, st = 0;
    dom.addEventListener('pointerdown', (ev) => {
      if (ev.target === handle) return;
      dragging = true;
      sx = ev.clientX; sy = ev.clientY;
      sl = parseFloat(dom.style.left) || 0;
      st = parseFloat(dom.style.top) || 0;
      try { dom.setPointerCapture && dom.setPointerCapture(ev.pointerId); } catch (e) { }
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

    // touch pinch gestures
    let gesture = { active: false, startDist: 0, startAngle: 0, origScale: obj.scale || 1, origRotation: obj.rotation || 0 };
    dom.addEventListener('touchstart', (ev) => {
      if (ev.touches.length === 1) {
        selectElement(dom, ELEMENTS.find(it => it.id === dom.dataset.id) || obj);
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
      if (obj.type === 'image') {
        // update overlay if image
        const id = dom.dataset.id;
        const model = ELEMENTS.find(it => it.id === id) || obj;
        if (model) {
          model.scale = obj.scale;
          model.rotation = obj.rotation;
        }
        const overlay = dom.querySelector('.img-overlay-canvas');
        if (overlay) {
          // call updateImageOverlay from window (exists in part1 scope)
          if (window.updateImageOverlay) window.updateImageOverlay(obj, dom);
        }
      }
    }, { passive: false });

    dom.addEventListener('touchend', (ev) => {
      if (ev.touches.length < 2) gesture.active = false;
    });

  } // end attachInteraction

  // expose attachInteraction to elements created by part1
  window.__attachInteractionPlaceholder = attachInteraction;

  // We need updateImageOverlay in window scope (part1 declared it local). If it's not global, create proxy:
  if (!window.updateImageOverlay && typeof window.__updateImageOverlay === 'function') {
    window.updateImageOverlay = window.__updateImageOverlay;
  }

  // Helper: apply gradient/dress to selected element (text or image)
  function applyGradientToSelected(g) {
    const SELECTED = document.querySelector('.canvas-item.selected');
    if (!SELECTED) { alert('اختر عنصرًا أولاً'); return; }
    const id = SELECTED.dataset.id;
    const obj = ELEMENTS.find(e => e.id === id);
    if (!obj) return;
    obj.fillMode = 'gradient';
    obj.gradient = g;
    if (SELECTED.classList && SELECTED.classList.contains('dressed')) SELECTED.classList.remove('dressed');
    if (obj.type === 'text') {
      SELECTED.style.background = `linear-gradient(90deg, ${g[0]}, ${g[1]})`;
      SELECTED.style.webkitBackgroundClip = 'text';
      SELECTED.style.backgroundClip = 'text';
      SELECTED.style.color = 'transparent';
      SELECTED.style.webkitTextFillColor = 'transparent';
    } else if (obj.type === 'image') {
      // update overlay (call the function from part1 scope)
      if (typeof window.updateImageOverlay === 'function') window.updateImageOverlay(obj, SELECTED);
    }
  }

  function applyDressToSelected(url) {
    const SELECTED = document.querySelector('.canvas-item.selected');
    if (!SELECTED) { alert('اختر عنصرًا أولاً'); return; }
    const id = SELECTED.dataset.id;
    const obj = ELEMENTS.find(e => e.id === id);
    if (!obj) return;
    obj.fillMode = 'dress';
    obj.dress = url;
    if (obj.type === 'text') {
      SELECTED.classList.add('dressed');
      applyStyleToDom(obj, SELECTED);
    } else if (obj.type === 'image') {
      SELECTED.classList.add('dressed');
      if (typeof window.updateImageOverlay === 'function') window.updateImageOverlay(obj, SELECTED);
    }
  }

  // wire popup buttons (these functions are used by part1)
  window.applyGradientToSelected = applyGradientToSelected;
  window.applyDressToSelected = applyDressToSelected;

  // --- export / download as PNG ---
  if (downloadImage) downloadImage.addEventListener('click', async () => {
    try {
      const rect = editorCanvas.getBoundingClientRect();
      const W = Math.round(rect.width);
      const H = Math.round(rect.height);

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
            const tmp = document.createElement('canvas');
            tmp.width = Math.max(1, Math.round(bboxW));
            tmp.height = Math.max(1, Math.round(bboxH));
            const tctx = tmp.getContext('2d');
            tctx.clearRect(0, 0, tmp.width, tmp.height);
            tctx.font = `${fontSize}px "${obj.font || 'ReemKufiLocalFallback'}"`;
            tctx.textAlign = 'left';
            tctx.textBaseline = 'top';
            tctx.fillStyle = '#000';
            tctx.fillText(obj.text, 0, 0);

            await new Promise((res) => {
              const img = new Image();
              img.crossOrigin = 'anonymous';
              img.onload = () => {
                try {
                  const pattern = tctx.createPattern(img, 'repeat');
                  tctx.globalCompositeOperation = 'source-in';
                  tctx.fillStyle = pattern;
                  tctx.fillRect(0, 0, tmp.width, tmp.height);
                  ctx.setTransform(1, 0, 0, 1, 0, 0);
                  ctx.drawImage(tmp, x, y);
                } catch (e) {
                  ctx.fillStyle = '#000';
                  ctx.fillText(obj.text, x, y);
                }
                res();
              };
              img.onerror = () => {
                ctx.fillStyle = '#000';
                ctx.fillText(obj.text, x, y);
                res();
              };
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

  // deleteSelected handled in part1 (button listener), but ensure selection available
  if (deleteSelected) {
    deleteSelected.addEventListener('click', () => {
      const selDom = document.querySelector('.canvas-item.selected');
      if (!selDom) return alert('اختر عنصراً أولاً');
      const id = selDom.dataset.id;
      const idx = ELEMENTS.findIndex(e => e.id === id);
      if (idx !== -1) ELEMENTS.splice(idx, 1);
      selDom.remove();
    });
  }

  // add delegation: when new canvas-item inserted (renderElement from part1), attach interaction
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
  if (editorCanvas) observer.observe(editorCanvas, { childList: true });

  // Finally: attach interaction to existing items (if any)
  document.querySelectorAll('.canvas-item').forEach(dom => {
    const id = dom.dataset.id;
    const model = ELEMENTS.find(it => it.id === id);
    if (model) attachInteraction(dom, model);
  });

}); // end DOMContentLoaded for part2
