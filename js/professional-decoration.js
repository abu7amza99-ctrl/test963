/* professional-decoration.js - نهائي (إصلاح تحديد الصورة + استيراد محلي للتلبيسات) */
document.addEventListener('DOMContentLoaded', () => {
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

  let SELECTED = null;
  const ELEMENTS = [];

  const GRADIENTS = (() => {
    const out = [];
    for (let i = 0; i < 50; i++) {
      const a = `hsl(${(i * 360 / 50) | 0} 80% 55%)`;
      const b = `hsl(${((i * 360 / 50) + 40) | 0} 80% 65%)`;
      out.push([a, b]);
    }
    out.push(['#f3c976', '#b8862a']);
    out.push(['#e6e9ec', '#b9bfc6']);
    out.push(['#d4b06f', '#8b5a2b']);
    out.push(['#9fb8c8', '#6b7f95']);
    return out;
  })();

  // ✅ استدعاء التلبيسات محليًا من مجلد assets/Dress up/
  const DRESSUPS = [
    '../assets/Dress up/gold1.jpg',
    '../assets/Dress up/gold2.jpg',
    '../assets/Dress up/silver1.jpg',
    '../assets/Dress up/metal1.jpg'
  ];

  if (sidebarToggle) sidebarToggle.addEventListener('click', () => siteSidebar.classList.toggle('active'));
  if (closeSidebar) closeSidebar.addEventListener('click', () => siteSidebar.classList.remove('active'));

  function createElementObject(type, data) {
    const id = 'el_' + (Date.now() + Math.floor(Math.random() * 999));
    const obj = Object.assign({
      id, type, x: 50, y: 60, rotation: 0, scale: 1,
      font: 'Reem Kufi', size: 72, stroke: 0, strokeColor: '#000',
      fillMode: 'solid', gradient: null, dress: null, img: null,
      displayWidth: null, displayHeight: null
    }, data || {});
    ELEMENTS.push(obj);
    return obj;
  }

  function renderElement(obj) {
    let dom;
    if (obj.type === 'text') {
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
    } else if (obj.type === 'image') {
      const wrap = document.createElement('div');
      wrap.className = 'canvas-item img-wrap';
      wrap.style.left = obj.x + 'px';
      wrap.style.top = obj.y + 'px';
      wrap.dataset.id = obj.id;

      const img = document.createElement('img');
      img.src = obj.img;
      img.alt = '';
      img.style.display = 'block';
      img.style.pointerEvents = 'none'; // ✅ يسمح بالتحديد عند النقر فوق الصورة

      const overlayCanvas = document.createElement('canvas');
      overlayCanvas.className = 'img-overlay-canvas';
      overlayCanvas.style.pointerEvents = 'none';

      img.onload = () => {
        const maxw = Math.min(480, img.naturalWidth);
        const dispW = obj.displayWidth || maxw;
        const aspect = img.naturalHeight / img.naturalWidth;
        const dispH = Math.round(dispW * aspect);

        img.style.width = dispW + 'px';
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

  function updateImageOverlay(obj, wrap) {
    const imgEl = wrap.querySelector('img');
    const overlayCanvas = wrap.querySelector('.img-overlay-canvas');
    if (!imgEl || !overlayCanvas) return;

    const ctx = overlayCanvas.getContext('2d');
    const dispW = obj.displayWidth || parseInt(imgEl.style.width);
    const dispH = obj.displayHeight || parseInt(imgEl.style.height);
    overlayCanvas.width = dispW;
    overlayCanvas.height = dispH;
    ctx.clearRect(0, 0, dispW, dispH);

    if (obj.fillMode === 'gradient' && obj.gradient) {
      const g = ctx.createLinearGradient(0, 0, dispW, 0);
      g.addColorStop(0, obj.gradient[0]);
      g.addColorStop(1, obj.gradient[1]);
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, dispW, dispH);
      ctx.globalCompositeOperation = 'destination-in';
      ctx.drawImage(imgEl, 0, 0, dispW, dispH);
      ctx.globalCompositeOperation = 'source-over';
      overlayCanvas.style.opacity = 1;
    } else {
      overlayCanvas.style.opacity = 0;
    }
  }

  function applyStyleToDom(obj, dom) {
    if (!dom) return;
    dom.style.transform = `rotate(${obj.rotation}rad)`;
    if (obj.type === 'text' && obj.fillMode === 'gradient' && obj.gradient) {
      dom.style.background = `linear-gradient(90deg, ${obj.gradient[0]}, ${obj.gradient[1]})`;
      dom.style.webkitBackgroundClip = 'text';
      dom.style.color = 'transparent';
    }
  }

  function attachInteraction(dom, obj) {
    const handle = document.createElement('div');
    handle.className = 'rotate-handle';
    handle.innerHTML = '⤾';
    dom.appendChild(handle);

    // ✅ تحديد عند النقر على العنصر (حتى لو فوق الصورة)
    dom.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      selectElement(dom, obj);
    });

    let dragging = false, startX = 0, startY = 0, startLeft = 0, startTop = 0;
    dom.addEventListener('pointerdown', (ev) => {
      if (ev.target === handle) return;
      dragging = true;
      startX = ev.clientX; startY = ev.clientY;
      startLeft = parseFloat(dom.style.left) || 0;
      startTop = parseFloat(dom.style.top) || 0;
      dom.setPointerCapture(ev.pointerId);
      ev.preventDefault();
    });
    window.addEventListener('pointermove', (ev) => {
      if (!dragging) return;
      const nx = startLeft + (ev.clientX - startX);
      const ny = startTop + (ev.clientY - startY);
      dom.style.left = nx + 'px';
      dom.style.top = ny + 'px';
      obj.x = nx; obj.y = ny;
    });
    window.addEventListener('pointerup', () => dragging = false);

    handle.addEventListener('pointerdown', (ev) => {
      ev.stopPropagation();
      const rect = dom.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const startAngle = Math.atan2(ev.clientY - cy, ev.clientX - cx) - obj.rotation;
      function move(e2) {
        const angle = Math.atan2(e2.clientY - cy, e2.clientX - cx) - startAngle;
        obj.rotation = angle;
        dom.style.transform = `rotate(${angle}rad)`;
      }
      function up() {
        window.removeEventListener('pointermove', move);
        window.removeEventListener('pointerup', up);
      }
      window.addEventListener('pointermove', move);
      window.addEventListener('pointerup', up);
    });
  }

  function selectElement(dom, obj) {
    document.querySelectorAll('.canvas-item.selected').forEach(el => el.classList.remove('selected'));
    dom.classList.add('selected');
    SELECTED = { dom, obj };
  }

  editorCanvas.addEventListener('mousedown', (e) => {
    if (e.target === editorCanvas) {
      document.querySelectorAll('.canvas-item.selected').forEach(el => el.classList.remove('selected'));
      SELECTED = null;
    }
  });

  btnAdd.addEventListener('click', () => {
    if (modeSelect.value === 'text') {
      const txt = textInput.value.trim();
      if (!txt) return alert('أدخل نصًا أولاً');
      const obj = createElementObject('text', { text: txt, font: fontSelect.value });
      renderElement(obj);
      textInput.value = '';
    } else {
      const f = fileImage.files && fileImage.files[0];
      if (!f) return alert('اختر صورة من جهازك');
      const reader = new FileReader();
      reader.onload = ev => {
        const obj = createElementObject('image', { img: ev.target.result });
        renderElement(obj);
      };
      reader.readAsDataURL(f);
    }
  });
});
