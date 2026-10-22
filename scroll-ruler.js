/* Przenośna adaptacja mechaniki ArtCraft. Oryginalny moduł: reference/.
   Bez React, GSAP i Lenis. Sekcje: <section id="..." data-ruler-label="...">. */
(() => {
  const clamp = value => Math.max(0, Math.min(1, value));
  const mix = (a, b, p) => a + (b - a) * p;
  const ease = p => p < .5 ? 4 * p ** 3 : 1 - (-2 * p + 2) ** 3 / 2;
  const defaults = { enabled: true, showSections: true, width: 60, topOffset: 60,
    sectionFontSize: 28, hoverDelay: 150, zoomDamping: 10, smoothScroll: false,
    smoothDuration: 180, smoothLinks: true,
    mobile: { enabled: true, breakpoint: 600, width: 30, showSectionName: true, interactive: false } };
  if (customElements.get('scroll-ruler')) return;
  class ScrollRuler extends HTMLElement {
    connectedCallback() {
      this.abort?.abort();
      this.abort = new AbortController();
      const { signal } = this.abort;
      this.setAttribute('role', 'group');
      this.setAttribute('aria-label', this.getAttribute('aria-label') || 'Page scroll position');
      this.innerHTML = '<div class="sr-rail"><div class="sr-backdrop" aria-hidden="true"></div><div class="sr-scale" aria-hidden="true"></div><div class="sr-bracket" aria-hidden="true"></div><div class="sr-marker" aria-hidden="true"><span class="sr-value"></span></div><div class="sr-ghost" aria-hidden="true"></div></div><nav class="sr-sections" aria-label="Page sections"></nav><span class="sr-mobile-label" aria-hidden="true"></span>';
      this.rail = this.querySelector('.sr-rail');
      this.rail.tabIndex = 0;
      this.rail.setAttribute('role', 'scrollbar');
      this.rail.setAttribute('aria-label', this.getAttribute('aria-label'));
      this.rail.setAttribute('aria-controls', this.getAttribute('aria-controls') || 'main');
      this.rail.setAttribute('aria-orientation', 'vertical');
      this.rail.setAttribute('aria-valuemin', '0');
      this.rail.setAttribute('aria-valuemax', '100');
      this.scale = this.querySelector('.sr-scale');
      this.marker = this.querySelector('.sr-marker');
      this.bracket = this.querySelector('.sr-bracket');
      this.ghost = this.querySelector('.sr-ghost');
      this.zoom = 0;
      this.zoomTarget = 0;
      this.velocity = 0;
      this.lastY = window.scrollY;
      this.ticks = [];
      for (let i = 0; i <= 100; i++) {
        const tick = document.createElement('span');
        tick.className = 'sr-tick' + (i % 5 === 0 ? ' is-major' : '');
        this.scale.append(tick);
        let label;
        if (i % 5 === 0) {
          label = document.createElement('span');
          label.className = 'sr-tick-label';
          label.textContent = i;
          this.scale.append(label);
        }
        this.ticks.push({ tick, label, pct: i / 100 });
      }
      const value = this.querySelector('.sr-value');
      this.wheels = Array.from({ length: 3 }, () => {
        const digit = document.createElement('span');
        digit.className = 'sr-digit';
        const wheel = document.createElement('span');
        wheel.className = 'sr-wheel';
        for (let i = 0; i < 10; i++) {
          const item = document.createElement('span');
          item.textContent = i;
          wheel.append(item);
        }
        digit.append(wheel);
        value.append(digit);
        return wheel;
      });
      value.append('%');
      this.schedule = () => {
        if (!this.frame) this.frame = requestAnimationFrame(time => { this.frame = 0; this.render(time); });
      };
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.motion.addEventListener('change', this.schedule, { signal });
      this.motion.addEventListener('change', () => this.cancelSmooth(), { signal });
      this.measure = () => { this.geometryDirty = true; this.schedule(); };
      window.addEventListener('scroll', this.schedule, { passive: true, signal });
      window.addEventListener('resize', this.measure, { passive: true, signal });
      window.addEventListener('pageshow', this.measure, { signal });
      this.observer = new ResizeObserver(this.measure);
      this.observer.observe(document.documentElement);
      this.observer.observe(document.body);
      this.configure(window.SCROLL_RULER_CONFIG || {});
      this.refreshSections();
      this.bindSmoothScroll(signal);
      document.fonts?.ready.then(() => { if (this.isConnected) this.measure(); });
      const intent = open => {
        clearTimeout(this.intentTimer);
        this.intentTimer = setTimeout(() => { this.zoomTarget = open && !this.isMobile ? 1 : 0; this.schedule(); }, this.options.hoverDelay);
      };
      this.rail.addEventListener('pointerenter', () => intent(true), { signal });
      this.rail.addEventListener('pointerleave', () => {
        this.ghostY = null;
        if (!this.drag) intent(false);
        this.schedule();
      }, { signal });
      this.addEventListener('focusin', () => { this.zoomTarget = this.isMobile ? 0 : 1; this.schedule(); }, { signal });
      this.addEventListener('focusout', event => {
        if (!this.contains(event.relatedTarget)) intent(false);
      }, { signal });
      this.addEventListener('keydown', event => {
        const y = window.scrollY;
        const positions = { ArrowDown: y + 40, ArrowUp: y - 40, PageDown: y + innerHeight * .9, PageUp: y - innerHeight * .9, Home: 0, End: this.max };
        if (event.key in positions) {
          event.preventDefault();
          window.scrollTo({ top: positions[event.key], behavior: 'instant' });
        }
      }, { signal });
      this.rail.addEventListener('pointerdown', event => {
        if (event.button !== 0 || !this.max) return;
        this.rail.focus({ preventScroll: true });
        clearTimeout(this.intentTimer);
        this.zoomTarget = this.isMobile ? 0 : 1;
        this.rail.setPointerCapture(event.pointerId);
        this.drag = true;
        this.ghostY = event.clientY;
        this.seek(clamp((event.clientY - this.base) / this.span));
        this.schedule();
      }, { signal });
      this.rail.addEventListener('pointermove', event => {
        this.ghostY = event.clientY;
        if (this.drag) this.seek(clamp((event.clientY - this.base) / this.span));
        this.schedule();
      }, { signal });
      this.rail.addEventListener('lostpointercapture', event => {
        this.drag = false;
        const rect = this.rail.getBoundingClientRect();
        if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < 0 || event.clientY > innerHeight) {
          this.ghostY = null;
          intent(false);
        }
        this.schedule();
      }, { signal });
      this.measure();
    }
    // Zmiany w locie: ruler.configure({ smoothScroll: true, mobile: { enabled: false } }).
    configure(patch = {}) {
      this.options = { ...defaults, ...this.options, ...patch,
        mobile: { ...defaults.mobile, ...this.options?.mobile, ...patch.mobile } };
      this.options.width = Math.max(24, Number(this.options.width) || 60);
      this.options.sectionFontSize = Math.max(12, Number(this.options.sectionFontSize) || 28);
      this.options.smoothDuration = Math.max(60, Math.min(500, Number(this.options.smoothDuration) || 180));
      this.options.hoverDelay = Math.max(0, Number(this.options.hoverDelay) || 0);
      this.options.zoomDamping = Math.max(1, Number(this.options.zoomDamping) || 10);
      this.cancelSmooth();
      this.measure();
    }
    cancelSmooth() {
      cancelAnimationFrame(this.smoothFrame);
      this.smoothFrame = 0;
      this.smoothTarget = null;
    }
    bindSmoothScroll(signal) {
      const cancel = () => this.cancelSmooth();
      for (const type of ['pointerdown', 'touchstart', 'keydown']) window.addEventListener(type, cancel, { passive: true, signal });
      document.addEventListener('click', event => {
        if (event.target.closest?.('a')) cancel();
      }, { capture: true, signal });
      window.addEventListener('wheel', event => {
        if (!this.options.enabled || !this.options.smoothScroll || this.isMobile || this.motion.matches ||
            event.ctrlKey || event.metaKey || event.shiftKey || !event.cancelable ||
            Math.abs(event.deltaX) > Math.abs(event.deltaY) || !event.deltaY) return;
        // Zachowaj natywne działanie pól i zagnieżdżonych przewijanych paneli.
        for (const node of event.composedPath()) {
          if (!(node instanceof HTMLElement) || node === document.body || node === document.documentElement) continue;
          if (node.matches('input, textarea, select, [contenteditable]:not([contenteditable="false"])')) return;
          const css = getComputedStyle(node);
          if (/auto|scroll/.test(css.overflowY) && node.scrollHeight > node.clientHeight &&
              (event.deltaY < 0 ? node.scrollTop > 0 : node.scrollTop + node.clientHeight < node.scrollHeight - 1)) return;
        }
        const maximum = Math.max(0, document.documentElement.scrollHeight - document.documentElement.clientHeight);
        const step = event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1;
        this.smoothTarget = Math.max(0, Math.min(maximum, (this.smoothTarget ?? scrollY) + event.deltaY * step));
        if (Math.abs(this.smoothTarget - scrollY) < .5) { this.cancelSmooth(); return; }
        event.preventDefault();
        if (this.smoothFrame) return;
        let previous = performance.now();
        const animate = time => {
          const dt = Math.min(64, time - previous);
          previous = time;
          const target = Math.min(this.smoothTarget, document.documentElement.scrollHeight - document.documentElement.clientHeight);
          const next = mix(scrollY, target, 1 - Math.exp(-dt / this.options.smoothDuration));
          window.scrollTo({ top: Math.abs(target - next) < .6 ? target : next, behavior: 'instant' });
          if (Math.abs(target - scrollY) < .6) this.cancelSmooth();
          else this.smoothFrame = requestAnimationFrame(animate);
        };
        this.smoothFrame = requestAnimationFrame(animate);
      }, { passive: false, signal });
    }
    // Wywołaj po dodaniu/usunięciu sekcji w aplikacji SPA.
    refreshSections() {
      const nav = this.querySelector('.sr-sections');
      nav.replaceChildren();
      this.sections = Array.from(document.querySelectorAll('[data-ruler-label][id]')).map(element => {
        const link = document.createElement('a');
        const label = element.getAttribute('data-ruler-label');
        link.href = '#' + encodeURIComponent(element.id);
        link.setAttribute('aria-label', 'Go to: ' + label);
        link.className = 'sr-section';
        const letters = Array.from(label).map(char => {
          const span = document.createElement('span');
          span.className = 'sr-letter';
          span.textContent = char;
          span.setAttribute('aria-hidden', 'true');
          link.append(span);
          return span;
        });
        link.addEventListener('click', event => {
          event.preventDefault();
          this.cancelSmooth();
          window.scrollTo({ top: element.getBoundingClientRect().top + scrollY - this.base, behavior: this.motion.matches || !this.options.smoothLinks ? 'instant' : 'smooth' });
        }, { signal: this.abort.signal });
        nav.append(link);
        return { element, link, letters };
      });
      this.geometryDirty = true;
      this.schedule();
    }
    seek(p) { window.scrollTo({ top: Math.max(0, Math.min(1, p)) * this.max, behavior: 'instant' }); }
    render(time = performance.now()) {
      const root = document.scrollingElement || document.documentElement;
      const h = document.documentElement.clientHeight;
      const y = window.scrollY;
      if (this.geometryDirty) {
        this.geometryDirty = false;
        if (this.options) {
          this.isMobile = innerWidth <= this.options.mobile.breakpoint;
          this.dataset.mobile = String(this.isMobile);
          this.dataset.sections = String(this.options.showSections);
          this.dataset.mobileInteractive = String(this.options.mobile.interactive);
          this.hidden = !this.options.enabled || (this.isMobile && !this.options.mobile.enabled);
          this.style.setProperty('--ruler-width', (this.isMobile ? this.options.mobile.width : this.options.width) + 'px');
          this.style.setProperty('--ruler-top', this.options.topOffset + 'px');
          this.style.setProperty('--ruler-section-size', this.options.sectionFontSize + 'px');
          this.rail.tabIndex = this.hidden || (this.isMobile && !this.options.mobile.interactive) ? -1 : 0;
          if (this.isMobile) this.zoom = this.zoomTarget = 0;
        }
        const css = getComputedStyle(this);
        this.base = parseFloat(css.getPropertyValue('--ruler-top')) || 60;
        this.span = Math.max(1, h - this.base - 12);
        this.width = this.getBoundingClientRect().width;
        this.docH = root.scrollHeight;
        this.sections.forEach(section => {
          section.anchor = section.element.getBoundingClientRect().top + y;
          let x = 0;
          section.metrics = section.letters.map(letter => {
            const width = letter.offsetWidth;
            const center = x + width / 2;
            x += width;
            return { width, center };
          });
          section.total = x;
        });
      }
      this.max = Math.max(0, this.docH - h);
      // Przeglądarki potrafią zatrzymać scroll ułamek piksela przed max.
      // Domykamy wtedy również GEOMETRIĘ skali, żeby 100% nie wyprzedzało kreski.
      const p = this.max ? (this.max - y < 1 ? 1 : clamp(y / this.max)) : 0;
      const dt = Math.min(.1, Math.max(.001, (time - (this.lastTime || time - 16)) / 1000));
      this.lastTime = time;
      this.velocity += ((y - this.lastY) / dt - this.velocity) * (1 - Math.exp(-6 * dt));
      this.lastY = y;
      this.zoom = this.motion.matches ? this.zoomTarget : mix(this.zoom, this.zoomTarget, 1 - Math.exp(-(this.options?.zoomDamping || 10) * dt));
      if (Math.abs(this.zoom - this.zoomTarget) < .0005) this.zoom = this.zoomTarget;
      const z = this.zoom;
      this.dataset.expanded = String(z > .5);
      const drift = this.base + p * (this.span - h);
      // Jeden układ współrzędnych dla kresek, igły i odczytu — także w trakcie zoomu.
      const scaleOrigin = mix(-p * this.max + drift, this.base, z);
      const scaleSpan = mix(this.docH, this.span, z);
      const markerY = scaleOrigin + p * scaleSpan;
      this.ticks.forEach(({ tick, label, pct }) => {
        const tickY = scaleOrigin + pct * scaleSpan;
        tick.style.top = tickY + 'px';
        if (label) label.style.top = tickY + 'px';
        const proximity = clamp(1 - Math.abs((pct - p) * this.docH) / 180);
        const stretch = this.motion.matches ? 0 : clamp(Math.abs(this.velocity) / 3000) * proximity ** 2;
        tick.style.transform = `scaleX(${1 + .6 * stretch})`;
      });
      this.marker.style.transform = `translate3d(0,${markerY}px,0)`;
      this.marker.style.opacity = clamp(p / .03);
      this.querySelector('.sr-value').style.top = markerY > h - 26 ? '-14px' : '4px';
      this.bracket.style.transform = `translate3d(0,${this.base + y / this.docH * this.span}px,0)`;
      this.bracket.style.height = h / this.docH * this.span + 'px';
      this.bracket.style.opacity = z;
      this.ghost.style.top = Math.max(this.base, Math.min(this.base + this.span, this.ghostY || 0)) + 'px';
      this.ghost.style.opacity = this.ghostY == null ? 0 : .2 + .8 * z;
      this.renderSections(y, h, drift, ease(z));
      if (this.isMobile) {
        const current = [...this.sections].reverse().find(section => section.anchor <= y + this.base + 1) || this.sections[0];
        const label = this.querySelector('.sr-mobile-label');
        label.textContent = this.options.mobile.showSectionName && this.options.showSections ? current?.element.getAttribute('data-ruler-label') || '' : '';
      }
      // Nowa liczba dopiero po przecięciu jej kreski; bez zaokrąglania 49.5 do 50.
      // Epsilon koryguje wyłącznie błąd arytmetyki zmiennoprzecinkowej.
      const scalePercent = clamp((markerY - scaleOrigin) / scaleSpan) * 100;
      const percent = Math.min(100, Math.floor(scalePercent + 1e-9));
      const digits = String(percent).padStart(3, '0');
      this.wheels.forEach((wheel, i) => { wheel.style.transform = `translateY(-${Number(digits[i]) * 1.2}em)`; });
      this.rail.setAttribute('aria-valuenow', percent);
      this.rail.setAttribute('aria-valuetext', percent + '%');
      if (this.zoom !== this.zoomTarget || Math.abs(this.velocity) > 1) this.schedule();
    }
    renderSections(y, h, drift, zoom) {
      if (this.isMobile || this.options?.showSections === false || this.hidden) return;
      const size = this.options?.sectionFontSize || 34, small = 14 / size, riding = 18 / size;
      const states = this.sections.map((section, i) => {
        const v = section.anchor - y + drift;
        const flip = i === 0 ? 1 : clamp((h * .12 + 200 - v) / 200);
        return { v, flip, len: section.total * riding, detach: 1, queue: h - 36 };
      });
      let queued = 0;
      for (let i = states.length - 1; i > 0; i--) {
        const s = states[i];
        s.queue -= 20 * queued;
        s.detach = clamp((s.queue + 240 - s.v - s.len) / 240);
        queued += 1 - s.detach;
      }
      const completed = states.filter(s => s.flip >= 1).length;
      const partial = states.reduce((n, s) => n + (s.flip > 0 && s.flip < 1 ? s.flip : 0), 0);
      this.sections.forEach((section, index) => {
        const state = states[index];
        const horizontal = (j, yy, scale, alpha) => ({ x: -section.total * scale + section.metrics[j].center * scale, y: yy, scale, alpha, rot: 0 });
        const vertical = (j, yy) => ({ x: this.width / 2, y: yy + (section.total - section.metrics[j].center) * riding, scale: riding, alpha: .35, rot: -90 });
        let from, to, progress;
        if (state.flip > 0) {
          progress = state.flip;
          from = j => vertical(j, state.v);
          if (state.flip >= 1) {
            const t = index === completed - 1 ? partial : 1;
            to = j => horizontal(j, this.base + 28 + index * 20 + 26 * (1 - t), mix(1, small, t), mix(1, .35, t));
          } else to = j => horizontal(j, this.base + 28 + index * 20 + 26, 1, 1);
        } else {
          progress = state.detach;
          from = j => horizontal(j, state.queue, small, .35);
          to = j => vertical(j, state.detach < 1 ? state.queue - state.len : state.v);
        }
        let left = Infinity, right = -Infinity, top = Infinity, bottom = -Infinity;
        const positions = [];
        section.letters.forEach((letter, j) => {
          const staggerIndex = section.letters.length - 1 - j;
          const t = ease(clamp(progress * (1 + (section.letters.length - 1) * .16) - staggerIndex * .16));
          const a = from(j), b = to(j);
          const arc = (a.x + b.x) / 2 - 28;
          let x = (1 - t) ** 2 * a.x + 2 * (1 - t) * t * arc + t * t * b.x;
          let yy = mix(a.y, b.y, t), rot = mix(a.rot, b.rot, t), scale = mix(a.scale, b.scale, t), alpha = mix(a.alpha, b.alpha, t);
          const map = horizontal(j, this.base + section.anchor / this.docH * this.span, small, .85);
          x = mix(x, map.x, zoom); yy = mix(yy, map.y, zoom); rot *= 1 - zoom;
          scale = mix(scale, map.scale, zoom); alpha = mix(alpha, map.alpha, zoom);
          positions.push({ letter, x, yy, rot, scale });
          letter.style.opacity = alpha;
          const turned = Math.abs(rot) > 45;
          const halfW = (turned ? size : section.metrics[j].width) * scale / 2;
          const halfH = (turned ? section.metrics[j].width : size) * scale / 2;
          left = Math.min(left, x - halfW); right = Math.max(right, x + halfW);
          top = Math.min(top, yy - halfH); bottom = Math.max(bottom, yy + halfH);
        });
        if (!positions.length) return;
        section.link.style.left = left - 4 + 'px';
        section.link.style.top = top - 4 + 'px';
        section.link.style.width = right - left + 8 + 'px';
        section.link.style.height = bottom - top + 8 + 'px';
        positions.forEach(({ letter, x, yy, rot, scale }) => {
          letter.style.transform = `translate3d(${x - left + 4}px,${yy - top + 4}px,0) translate(-50%,-50%) rotate(${rot}deg) scale(${scale})`;
        });
      });
    }
    disconnectedCallback() {
      this.abort?.abort();
      this.observer?.disconnect();
      this.cancelSmooth();
      clearTimeout(this.intentTimer);
      cancelAnimationFrame(this.frame);
      this.frame = 0;
    }
  }
  customElements.define('scroll-ruler', ScrollRuler);
})();
