const stage = document.querySelector('.hero-art');
stage.removeAttribute('aria-hidden');
stage.classList.add('hud-stage');
stage.setAttribute('role', 'group');
stage.setAttribute('aria-label', 'Interactive brand wireframe');
const logoPath = 'M0 0 64 110 80 83 96 110 120 69 143 110 159 110 127 55 159 0 143 0 96 83 88 69 127 0 32 0 64 55 80 28 64 28 56 14 104 14 64 83 16 0z';
stage.innerHTML = `
  <div class="hud-top"><span>WX / BRAND EXPLORER</span><span class="hud-readout" aria-hidden="true">X 050 · Y 050</span></div>
  <div class="hud-viewport">
    <svg class="hud-grid" viewBox="0 0 400 320" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="hud-grid-pattern" width="32" height="32" patternUnits="userSpaceOnUse"><path d="M32 0H0V32" fill="none" stroke="currentColor" stroke-width=".6"/></pattern></defs><rect width="400" height="320" fill="url(#hud-grid-pattern)"/><path d="M200 0V320M0 160H400" fill="none" stroke="currentColor" stroke-dasharray="3 6"/></svg>
    <div class="hud-object" aria-hidden="true"><svg viewBox="-10 -10 180 130"><path class="hud-depth" d="${logoPath}"/><path class="hud-outline" d="${logoPath}"/><path class="hud-fill" d="${logoPath}"/><g class="hud-vertices"><circle cx="0" cy="0" r="2"/><circle cx="64" cy="110" r="2"/><circle cx="96" cy="110" r="2"/><circle cx="159" cy="0" r="2"/><circle cx="127" cy="55" r="2"/><circle cx="80" cy="28" r="2"/></g></svg></div>
    <div class="hud-crosshair" aria-hidden="true"></div><div class="hud-scanline" aria-hidden="true"></div>
    <button class="hud-node node-design" data-node="design" aria-label="Explore design" aria-pressed="false">01</button>
    <button class="hud-node node-build" data-node="build" aria-label="Explore development" aria-pressed="false">02</button>
    <button class="hud-node node-connect" data-node="connect" aria-label="Explore automation" aria-pressed="false">03</button>
    <span class="hud-axis" aria-hidden="true">+ X<br>+ Y / Z</span>
  </div>
  <div class="hud-controls" role="group" aria-label="Logo rendering mode"><button data-mode="solid" aria-pressed="true">SOLID</button><button data-mode="wire" aria-pressed="false">WIREFRAME</button><button data-mode="scan" aria-pressed="false">SCAN</button></div>
  <div class="hud-info" aria-live="polite"><span class="hud-info-label">EXPLORE THE SYSTEM</span><p class="hud-info-copy">Hover or tap a numbered point.</p></div>`;
const viewport = stage.querySelector('.hud-viewport');
const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
const points = {
  design: ['01 / DESIGN', 'Clarity in every line. Structure before decoration.'],
  build: ['02 / DEVELOPMENT', 'Precise construction. Built for speed and everyday use.'],
  connect: ['03 / AUTOMATION', 'Connected systems. Fewer steps between idea and outcome.']
};
let mode = 'solid', selected = null, preview = null, frame = 0, pointer = null;
function renderMode() { stage.dataset.mode = mode; }
function renderPoint() {
  const active = preview || selected;
  const text = points[active] || ['EXPLORE THE SYSTEM', 'Hover or tap a numbered point.'];
  stage.querySelector('.hud-info-label').textContent = text[0];
  stage.querySelector('.hud-info-copy').textContent = text[1];
  stage.querySelectorAll('[data-node]').forEach(button => {
    button.classList.toggle('is-active', button.dataset.node === active);
    button.setAttribute('aria-pressed', String(button.dataset.node === selected));
  });
}
stage.querySelectorAll('[data-mode]').forEach(button => button.addEventListener('click', () => {
  mode = button.dataset.mode;
  stage.querySelectorAll('[data-mode]').forEach(item => item.setAttribute('aria-pressed', String(item === button)));
  renderMode();
}));
stage.querySelectorAll('[data-node]').forEach(button => {
  button.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { preview = button.dataset.node; renderPoint(); } });
  button.addEventListener('pointerleave', () => { preview = null; renderPoint(); });
  button.addEventListener('focus', () => { preview = button.dataset.node; renderPoint(); });
  button.addEventListener('blur', () => { preview = null; renderPoint(); });
  button.addEventListener('click', () => { selected = selected === button.dataset.node ? null : button.dataset.node; preview = null; renderPoint(); });
});
viewport.addEventListener('pointermove', event => {
  if (!fine.matches || event.pointerType !== 'mouse') return;
  const rect = viewport.getBoundingClientRect();
  pointer = {x: Math.max(0, Math.min(1, (event.clientX - rect.left) / rect.width)), y: Math.max(0, Math.min(1, (event.clientY - rect.top) / rect.height))};
  if (frame) return;
  frame = requestAnimationFrame(() => {
    frame = 0;
    if (!pointer) return;
    const {x, y} = pointer;
    stage.style.setProperty('--pointer-x', `${x * 100}%`);
    stage.style.setProperty('--pointer-y', `${y * 100}%`);
    if (!motion.matches) {
      stage.style.setProperty('--rotate-x', `${(0.5-y)*44}deg`);
      stage.style.setProperty('--rotate-y', `${(x-0.5)*60}deg`);
    }
    stage.querySelector('.hud-readout').textContent = `X ${String(Math.round(x*100)).padStart(3,'0')} · Y ${String(Math.round(y*100)).padStart(3,'0')}`;
  });
});
function resetPointer() {
  cancelAnimationFrame(frame); frame = 0; pointer = null;
  stage.style.setProperty('--rotate-x','0deg'); stage.style.setProperty('--rotate-y','0deg');
  stage.style.setProperty('--pointer-x','50%'); stage.style.setProperty('--pointer-y','50%');
  stage.querySelector('.hud-readout').textContent = 'X 050 · Y 050';
}
viewport.addEventListener('pointerleave', resetPointer);
motion.addEventListener('change', resetPointer);
stage.addEventListener('keydown', event => { if(event.key === 'Escape') { selected = null; preview = null; renderPoint(); resetPointer(); } });
renderMode();

// Each service gets an explicit touch and keyboard equivalent to its hover treatment.
document.querySelectorAll('.services-grid article').forEach((card, index) => {
  card.classList.add('hud-service');
  const detail = card.querySelector('.service-meta');
  detail.id = `service-scope-${index}`;
  const button = document.createElement('button');
  button.className = 'hud-inspect';
  button.type = 'button';
  button.textContent = 'EXPLORE SCOPE +';
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('aria-controls', detail.id);
  detail.hidden = true;
  card.append(button);
  let locked = false;
  function show(active) {
    card.classList.toggle('is-inspected', active);
    detail.hidden = !active;
    button.setAttribute('aria-expanded', String(active));
    button.textContent = active ? 'CLOSE SCOPE −' : 'EXPLORE SCOPE +';
  }
  card.addEventListener('pointerenter', event => { if(event.pointerType === 'mouse') show(true); });
  card.addEventListener('pointerleave', () => show(locked));
  button.addEventListener('click', () => { locked = !locked; show(locked); });
  button.addEventListener('keydown', event => { if(event.key === 'Escape') { locked = false; show(false); } });
});
