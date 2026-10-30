// ==========================================================
// STERCQ — global.js
// Stack: GSAP (+ ScrollTrigger, CustomEase), Lenis, Barba
// Doel: licht, snel, smooth — Lenis bijna native, korte Barba-transities
// ==========================================================

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

gsap.registerPlugin(ScrollTrigger, CustomEase);

// SplitText is nodig voor data-tr="lines|chars" — laat een ontbrekende plugin global.js niet breken
if (window.SplitText) gsap.registerPlugin(SplitText);

// ==========================================================
// GLOBAL STATE
// ==========================================================

let lenis = null;

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", (e) => (reducedMotion = e.matches));

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: 0.6 });

// ==========================================================
// LENIS SCROLL
// Hoge lerp = korte nasleep, voelt bijna native (Bodak draait op 0.2).
// Touch blijft native scroll.
// ==========================================================

function initLenis() {
  if (lenis) return;
  if (reducedMotion) return;

  lenis = new Lenis({
    lerp: 0.2,
    wheelMultiplier: 1,
    smoothWheel: true,
    syncTouch: false,
    stopInertiaOnNavigate: true,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function lockScroll() {
  lenis?.stop();
  document.documentElement.classList.add("is-scroll-locked");
}

function unlockScroll() {
  lenis?.start();
  document.documentElement.classList.remove("is-scroll-locked");
}

function resetScroll() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

// ==========================================================
// WEBFLOW REINIT
// Webflow koppelt IX2/forms aan data-wf-page — na een Barba-swap overnemen.
// ==========================================================

function reinitWebflow(nextHtml) {
  if (nextHtml) {
    const nextDoc = new DOMParser().parseFromString(nextHtml, "text/html");
    const pageId = nextDoc.documentElement.getAttribute("data-wf-page");
    if (pageId) document.documentElement.setAttribute("data-wf-page", pageId);
  }

  if (!window.Webflow) return;
  window.Webflow.destroy?.();
  window.Webflow.ready?.();
  window.Webflow.require?.("ix2")?.init();
}

function updateCurrentNav() {
  const path = window.location.pathname;
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || link.origin !== window.location.origin) return;
    const linkPath = new URL(link.href, window.location.origin).pathname;
    const isCurrent = linkPath === path;
    link.classList.toggle("w--current", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

// ==========================================================
// BOLD FULL SCREEN NAVIGATION
// Staat buiten de Barba-container → één keer initten, niet per pagina.
// data-navigation-status="not-active|active" op de nav-wrapper
// data-navigation-toggle="toggle|close" op de knoppen
// ==========================================================

function setNavigationStatus(isActive) {
  const navStatusEl = document.querySelector("[data-navigation-status]");
  if (!navStatusEl) return;

  const wasActive = navStatusEl.getAttribute("data-navigation-status") === "active";
  if (wasActive === isActive) return;

  navStatusEl.setAttribute("data-navigation-status", isActive ? "active" : "not-active");
  if (isActive) lockScroll();
  else unlockScroll();
}

function closeNavigation() {
  setNavigationStatus(false);
}

function initBoldFullScreenNavigation() {
  const navStatusEl = document.querySelector("[data-navigation-status]");
  if (!navStatusEl || navStatusEl._navInit) return;
  navStatusEl._navInit = true;

  // Altijd dicht starten, ook als hij in de Designer op "active" staat
  navStatusEl.setAttribute("data-navigation-status", "not-active");

  document.addEventListener("click", (e) => {
    const toggleBtn = e.target.closest("[data-navigation-toggle]");
    if (!toggleBtn) return;

    if (toggleBtn.getAttribute("data-navigation-toggle") === "close") {
      closeNavigation();
    } else {
      const isActive = navStatusEl.getAttribute("data-navigation-status") === "active";
      setNavigationStatus(!isActive);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNavigation();
  });
}

// ==========================================================
// REVEAL — data-reveal (fade-up bij in beeld komen)
// data-reveal-delay="0.1" optioneel
// ==========================================================

function initReveal(scope = document) {
  const items = scope.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  if (reducedMotion) {
    gsap.set(items, { autoAlpha: 1, y: 0 });
    return;
  }

  items.forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: "2rem" },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "expo.out",
        delay: parseFloat(el.getAttribute("data-reveal-delay")) || 0,
        scrollTrigger: { trigger: el, start: "clamp(top 90%)", once: true },
      }
    );
  });
}

// ==========================================================
// STICKER ZONE — stickers poppen op, vallen met zwaartekracht op de tekst
// en knikkeren over de grond. Klik in de zone = nieuwe random sticker.
// Matter.js wordt alleen geladen als er een zone op de pagina staat.
//
// data-sticker-library        wrapper (mag verborgen) met de sticker-<img>'s, bv. CMS Collection List
// data-sticker-zone           de sectie waarin stickers vallen
//   data-sticker-count="6"    aantal stickers als de zone in beeld komt (0 = alleen klikken)
//   data-sticker-max="24"     max aantal tegelijk, de oudste popt weg
//   data-sticker-size="7"     breedte in rem
// data-sticker-collider       elementen in de zone waar stickers op landen (koppen, tekst)
// Het effect is alleen actief vanaf 992px; op mobiel en tablet wordt het volledig opgeruimd.
// ==========================================================

let matterPromise = null;
const stickerDesktopMQ = window.matchMedia("(min-width: 992px)");

function loadMatter() {
  if (window.Matter) return Promise.resolve(window.Matter);
  if (matterPromise) return matterPromise;
  matterPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js";
    script.onload = () => resolve(window.Matter);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return matterPromise;
}

function getStickerSources() {
  return [...document.querySelectorAll("[data-sticker-library] img")]
    .map((img) => img.currentSrc || img.src)
    .filter(Boolean);
}

function initStickerZones(scope = document) {
  const zones = scope.querySelectorAll("[data-sticker-zone]");
  if (!zones.length) return;
  if (!stickerDesktopMQ.matches) {
    destroyStickerZones(scope);
    return;
  }

  loadMatter()
    .then((Matter) => zones.forEach((zone) => initStickerZone(zone, Matter)))
    .catch(() => console.warn("Stercq: matter-js kon niet laden"));
}

function initStickerZone(zone, Matter) {
  if (!stickerDesktopMQ.matches || zone._stickerDestroy || !zone.isConnected) return;

  const sources = getStickerSources();
  if (!sources.length) return;

  const { Engine, Bodies, Composite, Body } = Matter;
  const startCount = parseInt(zone.getAttribute("data-sticker-count"), 10);
  const maxCount = parseInt(zone.getAttribute("data-sticker-max"), 10) || 24;
  const sizeRem = parseFloat(zone.getAttribute("data-sticker-size")) || 7;

  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = reducedMotion ? 0 : 1;

  const stickers = [];
  let statics = [];
  let lastSrc = null;
  let running = false;
  let inViewNow = false;

  const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const stickerWidth = () => sizeRem * remPx() * (window.innerWidth < 768 ? 0.7 : 1);

  // Vloer, wanden en tekst als statische bodies, in zone-coördinaten
  // Inline SVG-colliders gebruiken benaderde lijnsegmenten langs de SVG-paden,
  // zodat stickers op de logo-vorm landen in plaats van op één grote rechthoek.
  function createSvgPathBodies(el, zr) {
    const paths = [...el.querySelectorAll("svg path[d]")];
    if (!paths.length) return [];

    const prepared = paths.map((path) => {
      try {
        const length = path.getTotalLength();
        const matrix = path.getScreenCTM();
        if (!length || !matrix) return null;
        const scale = Math.max(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d));
        return scale ? { path, length, matrix, scale } : null;
      } catch (error) {
        return null;
      }
    }).filter(Boolean);

    if (!prepared.length) return [];

    // Houd de hoeveelheid bodies beperkt, ook bij complexe SVG-logo's.
    const screenLength = prepared.reduce((sum, item) => sum + item.length * item.scale, 0);
    const samplePx = Math.min(24, Math.max(10, screenLength / 500));
    const thickness = Math.max(6, Math.min(12, samplePx * 0.75));
    const bodies = [];

    prepared.forEach(({ path, length, matrix, scale }) => {
      const step = samplePx / scale;
      let previous = null;
      const sampleCount = Math.max(1, Math.ceil(length / step));

      for (let i = 0; i <= sampleCount; i++) {
        const point = path.getPointAtLength(Math.min(i * step, length));
        const current = {
          x: point.x * matrix.a + point.y * matrix.c + matrix.e - zr.left,
          y: point.x * matrix.b + point.y * matrix.d + matrix.f - zr.top,
        };

        if (previous) {
          const dx = current.x - previous.x;
          const dy = current.y - previous.y;
          const segmentLength = Math.hypot(dx, dy);

          // Skip SVG subpath jumps (M commands) instead of bridging empty space.
          if (segmentLength > samplePx * 2.5) {
            previous = current;
            continue;
          }

          if (segmentLength > 1) {
            bodies.push(Bodies.rectangle(
              (previous.x + current.x) / 2,
              (previous.y + current.y) / 2,
              segmentLength + thickness * 0.35,
              thickness,
              { isStatic: true, angle: Math.atan2(dy, dx), friction: 0.8 }
            ));
          }
        }

        previous = current;
      }
    });

    return bodies;
  }

  function buildStatics() {
    Composite.remove(engine.world, statics);
    const zr = zone.getBoundingClientRect();
    const t = 200;
    statics = [
      Bodies.rectangle(zr.width / 2, zr.height + t / 2, zr.width * 3, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, zr.height / 2, t, zr.height * 4, { isStatic: true }),
      Bodies.rectangle(zr.width + t / 2, zr.height / 2, t, zr.height * 4, { isStatic: true }),
    ];
    zone.querySelectorAll("[data-sticker-collider]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const pathBodies = createSvgPathBodies(el, zr);
      if (pathBodies.length) {
        statics.push(...pathBodies);
      } else {
        statics.push(Bodies.rectangle(
          r.left - zr.left + r.width / 2,
          r.top - zr.top + r.height / 2,
          r.width, r.height,
          { isStatic: true, chamfer: { radius: Math.min(12, r.height / 2) } }
        ));
      }
    });
    Composite.add(engine.world, statics);
    stickers.forEach((s) => Matter.Sleeping.set(s.body, false));
  }

  function pickSource() {
    const pool = sources.length > 1 ? sources.filter((src) => src !== lastSrc) : sources;
    lastSrc = pool[Math.floor(Math.random() * pool.length)];
    return lastSrc;
  }

  function removeSticker(s) {
    Composite.remove(engine.world, s.body);
    stickers.splice(stickers.indexOf(s), 1);
    gsap.to(s.img, { scale: 0, rotation: "+=" + rnd(-30, 30), duration: 0.3, ease: "back.in(2)", onComplete: () => s.el.remove() });
  }

  async function spawn(x, y) {
    const img = new Image();
    img.src = pickSource();
    img.alt = "";
    img.draggable = false;
    try { await img.decode(); } catch (e) { return; }
    if (!zone._stickerDestroy) return;

    const w = stickerWidth();
    const ratio = img.naturalWidth && img.naturalHeight ? img.naturalHeight / img.naturalWidth : 1;
    const h = w * ratio;

    const el = document.createElement("div");
    el.className = "sticker-zone__sticker";
    el.style.width = w + "px";
    el.style.height = h + "px";
    el.appendChild(img);
    zone.appendChild(el);

    const body = Bodies.rectangle(x, y, w * 0.9, h * 0.9, {
      chamfer: { radius: Math.min(w, h) * 0.3 },
      restitution: 0.45,
      friction: 0.3,
      frictionAir: 0.01,
      angle: rnd(-0.4, 0.4),
    });
    Body.setAngularVelocity(body, rnd(-0.08, 0.08));
    Composite.add(engine.world, body);

    const s = { el, img, body, w, h };
    stickers.push(s);
    render(s);

    // Pop: schaal op de img, de wrapper is van de physics
    if (!reducedMotion) gsap.fromTo(img, { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(2.2)" });

    if (stickers.length > maxCount) removeSticker(stickers[0]);
    start();
  }

  function render(s) {
    const { x, y } = s.body.position;
    s.el.style.transform = `translate(${x - s.w / 2}px, ${y - s.h / 2}px) rotate(${s.body.angle}rad)`;
  }

  function tick() {
    Engine.update(engine, Math.min(gsap.ticker.deltaRatio(60) * (1000 / 60), 33));
    stickers.forEach(render);
  }

  function start() {
    if (running || !inViewNow) return;
    running = true;
    gsap.ticker.add(tick);
  }

  function stop() {
    if (!running) return;
    running = false;
    gsap.ticker.remove(tick);
  }

  function onClick(e) {
    if (e.target.closest("a, button, input, textarea, select, label")) return;
    const zr = zone.getBoundingClientRect();
    spawn(e.clientX - zr.left, e.clientY - zr.top);
  }

  let spawnedStart = false;
  function spawnStartSet() {
    if (spawnedStart) return;
    spawnedStart = true;
    const count = isNaN(startCount) ? 6 : startCount;
    const zr = zone.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      gsap.delayedCall(i * 0.12, () => spawn(rnd(zr.width * 0.15, zr.width * 0.85), rnd(zr.height * 0.05, zr.height * 0.3)));
    }
  }

  // Alleen rekenen als de zone in beeld is
  const io = new IntersectionObserver(([entry]) => {
    inViewNow = entry.isIntersecting;
    if (inViewNow) {
      buildStatics();
      start();
      spawnStartSet();
    } else {
      stop();
    }
  }, { threshold: 0.25 });
  io.observe(zone);

  let resizeTimer;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildStatics, 150);
  });
  ro.observe(zone);

  zone.addEventListener("click", onClick);
  buildStatics();

  zone._stickerDestroy = () => {
    stop();
    io.disconnect();
    ro.disconnect();
    clearTimeout(resizeTimer);
    zone.removeEventListener("click", onClick);
    stickers.forEach((s) => s.el.remove());
    stickers.length = 0;
    Composite.clear(engine.world, false);
    Engine.clear(engine);
    zone._stickerDestroy = null;
  };
}

function destroyStickerZones(scope = document) {
  scope.querySelectorAll("[data-sticker-zone]").forEach((zone) => zone._stickerDestroy?.());
}

stickerDesktopMQ.addEventListener?.("change", (event) => {
  if (event.matches) initStickerZones(document);
  else destroyStickerZones(document);
});

// ==========================================================
// PAGE LIFECYCLE
// initPage draait bij eerste load én na elke Barba-transitie.
// Alles wat hier start, moet in destroyPage weer opgeruimd worden.
// ==========================================================

function initPage(container) {
  initReveal(container);
  // document, zodat ook een footer buiten de Barba-container meedoet (idempotent)
  initStickerZones(document);
  ScrollTrigger.refresh();
}

function destroyPage(container) {
  ScrollTrigger.getAll().forEach((st) => st.kill());
  if (container) destroyStickerZones(container);
}

// ==========================================================
// TRANSITIE-ENGINE (data-tr) — overgezet uit "Stercq Showcase animaties.html"
// Geen overlay: alles wat in beeld staat gaat op zijn eigen manier weg,
// de nieuwe pagina bouwt zich op met één veegrand over de kleurvlakken.
//
// data-tr="lines"    tekst, valt per regel in zijn masker (SplitText)
// data-tr="chars"    tekst per letter
// data-tr="slide"    knoppen/kleine blokken, schuiven in hun masker
// data-tr="line"     lijnen, schalen in/uit
// data-tr="pop"      kleine elementen, poppen
// data-tr="sticker"  stickers, worden erop geplakt / poppen eraf met draai
// data-tr="media"    beelden — data-in="wipe|pop|slap|drop", data-out="wipe|pop|drop"
// data-tr="wipe"     gekleurde secties, de veegrand loopt hierover
// data-header-theme="light|dark" op de container → html[data-header-theme] voor de header-CSS
// data-tr-hidden / data-tr-defer op een wrapper: niet meenemen in leave / enter
// ==========================================================

const rnd = gsap.utils.random;
// GSAP neemt de CSS-rotate over; onthoud die ontwerphoek zodat elke animatie daar weer eindigt
const base = (el) => (el._base != null ? el._base : (el._base = gsap.getProperty(el, "rotation")));
const setIf = (targets, vars) => { if (targets && targets.length) gsap.set(targets, vars); };
const vh = () => window.innerHeight;
const each = (n, per, max) => (n > 1 && n * per > max ? max / n : per);

const trState = { headerTheme: "light" };

function inView(el, h = vh(), w = window.innerWidth) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < h && r.right > 0 && r.left < w;
}

// Alleen wat echt te zien is doet mee met de leave
function isShown(el) {
  const cs = getComputedStyle(el);
  if (cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) return false;
  if (gsap.getProperty(el, "scaleX") < 0.05) return false;
  return !(el.style.clipPath || "").includes("100%");
}

function splitAll(c) {
  if (!window.SplitText) return;
  c.querySelectorAll('[data-tr="lines"]').forEach((el) => {
    if (el._split) return;
    el._split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "tr-line", autoSplit: true });
  });
  c.querySelectorAll('[data-tr="chars"]').forEach((el) => {
    if (!el._split) el._split = SplitText.create(el, { type: "chars", mask: "chars", charsClass: "tr-char" });
  });
}

function unsplitAll(c) {
  c.querySelectorAll('[data-tr="lines"],[data-tr="chars"]').forEach((el) => {
    if (el._split) { el._split.revert(); el._split = null; }
  });
}

function collect(list, h) {
  const p = { sticker: [], pop: [], lines: [], chars: [], slide: [], line: [], media: [], wipe: [] };
  list.forEach((el) => {
    const t = el.getAttribute("data-tr");
    if (t === "lines") (el._split ? el._split.lines : [el]).forEach((l) => { if (inView(l.parentElement, h)) p.lines.push(l); });
    else if (t === "chars") p.chars.push(...(el._split ? el._split.chars : [el]));
    else if (p[t]) p[t].push(el);
  });
  return p;
}

function setHeaderTheme(name) {
  if (name === trState.headerTheme) return;
  trState.headerTheme = name;
  document.documentElement.setAttribute("data-header-theme", name);
}

function headerLine() {
  const header = document.querySelector("[data-header]");
  if (!header) return 0;
  const r = header.getBoundingClientRect();
  return r.top + r.height / 2;
}

// Eén veegrand over alle zichtbare kleurvlakken, in viewport-coördinaten
function sweep(sections, dir, opts = {}) {
  const h = vh();
  const rects = sections.map((s) => s.getBoundingClientRect());
  const from = Math.max(0, Math.min(...rects.map((r) => r.top)));
  const to = Math.min(h, Math.max(...rects.map((r) => r.bottom)));
  const duration = 0.62 * (0.55 + (0.45 * Math.max(0, to - from)) / h);
  const edge = { y: from };
  let passed = false;

  const apply = () => {
    rects.forEach((r, i) => {
      const cut = gsap.utils.clamp(0, r.height, edge.y - r.top);
      sections[i].style.clipPath = dir === "out" ? `inset(${cut}px 0px 0px 0px)` : `inset(0px 0px ${r.height - cut}px 0px)`;
    });
    if (!passed && opts.onHeader && edge.y >= headerLine()) { passed = true; opts.onHeader(); }
  };

  return gsap.to(edge, {
    y: to, duration, ease: "power2.inOut", onStart: apply, onUpdate: apply,
    onComplete() {
      apply();
      if (!passed && opts.onHeader) opts.onHeader();
      if (dir === "in") sections.forEach((s) => { s.style.clipPath = ""; });
    },
  });
}

// Streepje onder de actieve nav-link schuift mee (desktop)
// [data-nav-indicator] in dezelfde parent als de [data-nav-link]'s
function moveIndicator(url, instant) {
  const indicator = document.querySelector("[data-nav-indicator]");
  if (!indicator) return;
  const path = new URL(url, window.location.origin).pathname;
  const links = [...document.querySelectorAll("[data-nav-link]")];
  const link = links.find((a) => {
    const p = new URL(a.href, window.location.origin).pathname;
    return p === "/" ? path === "/" : path === p || path.startsWith(p + "/");
  });
  links.forEach((a) => a.classList.toggle("is-active", a === link));
  if (!link) { gsap.to(indicator, { scaleX: 0, duration: instant ? 0 : 0.3 }); return; }
  const v = { x: link.offsetLeft, width: link.offsetWidth, scaleX: 1 };
  instant ? gsap.set(indicator, v) : gsap.to(indicator, { ...v, duration: 0.7, ease: "power3.inOut", overwrite: "auto" });
}

function pageOut(c) {
  const h = vh();
  const all = [...c.querySelectorAll("[data-tr]")];
  const vis = all.filter((el) => inView(el, h) && isShown(el) && !el.closest("[data-tr-hidden]"));
  setIf(all.filter((el) => !vis.includes(el) && el.getAttribute("data-tr") !== "wipe"), { autoAlpha: 0 });

  const tl = gsap.timeline();
  if (reducedMotion) { tl.to(c, { autoAlpha: 0, duration: 0.2 }); return tl; }

  const p = collect(vis, h);
  // Wat nog niet binnen is (boven/onder zijn masker) slaan we over, anders schiet het er even doorheen
  const inPlace = (el) => Math.abs(gsap.getProperty(el, "yPercent")) < 50;
  p.lines = p.lines.filter(inPlace); p.chars = p.chars.filter(inPlace); p.slide = p.slide.filter(inPlace);

  if (p.sticker.length) tl.to(p.sticker, { keyframes: [
    { scale: 1.12, duration: 0.1, ease: "power2.out" },
    { scale: 0, rotation: () => "+=" + rnd(-35, 35), duration: 0.3, ease: "back.in(2.4)" },
  ], stagger: { each: each(p.sticker.length, 0.045, 0.2), from: "random" }, overwrite: "auto" }, 0);
  if (p.pop.length) tl.to(p.pop, { scale: 0, duration: 0.3, ease: "back.in(2)", stagger: each(p.pop.length, 0.035, 0.15), overwrite: "auto" }, 0.02);
  if (p.lines.length) tl.to(p.lines, { yPercent: 112, duration: 0.42, ease: "power3.in", stagger: each(p.lines.length, 0.035, 0.22), overwrite: "auto" }, 0.04);
  if (p.chars.length) tl.to(p.chars, { yPercent: 112, duration: 0.42, ease: "power3.in", stagger: each(p.chars.length, 0.025, 0.16) }, 0.04);
  if (p.slide.length) tl.to(p.slide, { yPercent: 125, duration: 0.4, ease: "power3.in", stagger: each(p.slide.length, 0.03, 0.18), overwrite: "auto" }, 0.06);
  if (p.line.length) tl.to(p.line, { scaleX: 0, transformOrigin: "right center", duration: 0.42, ease: "power3.in", stagger: each(p.line.length, 0.03, 0.15) }, 0.06);

  if (p.media.length) {
    const out = (k) => p.media.filter((el) => (el.getAttribute("data-out") || "wipe") === k);
    const wipe = out("wipe"), pop = out("pop"), drop = out("drop");
    if (wipe.length) tl.fromTo(wipe, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(100% 0% 0% 0%)", duration: 0.5, ease: "power3.in", overwrite: "auto" }, 0.06);
    if (pop.length) tl.to(pop, { keyframes: [
      { scale: 1.06, duration: 0.12, ease: "power2.out" },
      { scale: 0, rotation: () => "+=" + rnd(-22, 22), duration: 0.38, ease: "back.in(1.7)" },
    ], stagger: 0.06, overwrite: "auto" }, 0.03);
    if (drop.length) tl.to(drop, { keyframes: [
      { y: -14, duration: 0.14, ease: "power2.out" },
      { y: () => vh() * 1.15, rotation: (i, el) => base(el) + rnd(-28, 28), duration: 0.72, ease: "power2.in" },
    ], stagger: 0.07, overwrite: "auto" }, 0.02);
  }

  const hasEls = tl.duration() > 0;
  if (p.wipe.length) tl.add(sweep(p.wipe, "out", { onHeader: () => setHeaderTheme("light") }), hasEls ? 0.3 : 0);
  else tl.call(() => setHeaderTheme("light"), null, 0);
  if (tl.duration() < 0.15) tl.to({}, { duration: 0.15 });
  return tl;
}

function setInitialStates(c) {
  const h = vh();
  const pageTheme = c.getAttribute("data-header-theme") || "light";
  c._pageTheme = pageTheme;

  if (reducedMotion) { gsap.set(c, { autoAlpha: 0 }); c._enter = null; setHeaderTheme(pageTheme); return; }

  const vis = [...c.querySelectorAll("[data-tr]")].filter((el) => !el.closest("[data-tr-defer]") && inView(el, h));
  const p = collect(vis, h);
  c._enter = p;

  setIf([...p.lines, ...p.chars], { yPercent: -112 });
  setIf(p.slide, { yPercent: -125 });
  setIf(p.sticker, { scale: 1.6, autoAlpha: 0, rotation: (i, el) => base(el) + rnd(-28, 28) });
  setIf(p.pop, { scale: 0 });
  setIf(p.line, { scaleX: 0, transformOrigin: "left center" });

  const mIn = (k) => p.media.filter((el) => (el.getAttribute("data-in") || "wipe") === k);
  setIf(mIn("wipe"), { clipPath: "inset(0% 0% 100% 0%)" });
  setIf(mIn("pop"), { scale: 0, rotation: (i, el) => base(el) + rnd(-10, 10) });
  setIf(mIn("slap"), { scale: 1.3, autoAlpha: 0, rotation: (i, el) => base(el) + rnd(-12, 12) });
  setIf(mIn("drop"), { y: () => -vh(), rotation: (i, el) => base(el) + rnd(-20, 20) });
  p.wipe.forEach((s) => { s.style.clipPath = "inset(0px 0px 100% 0px)"; });

  if (pageTheme === "light" || !p.wipe.length) setHeaderTheme(pageTheme);
}

function pageIn(c) {
  const tl = gsap.timeline();
  gsap.set(c, { autoAlpha: 1 });
  if (reducedMotion || !c._enter) { setHeaderTheme(c._pageTheme || "light"); return tl; }

  const p = c._enter;
  let t = 0;
  if (p.wipe.length) { tl.add(sweep(p.wipe, "in", { onHeader: () => setHeaderTheme(c._pageTheme) }), 0); t = 0.26; }
  if (p.lines.length) tl.to(p.lines, { yPercent: 0, duration: 0.95, ease: "power4.out", stagger: each(p.lines.length, 0.06, 0.42) }, t);
  if (p.chars.length) tl.to(p.chars, { yPercent: 0, duration: 1, ease: "power4.out", stagger: each(p.chars.length, 0.035, 0.3) }, t + 0.05);

  if (p.media.length) {
    const mIn = (k) => p.media.filter((el) => (el.getAttribute("data-in") || "wipe") === k);
    const wipe = mIn("wipe"), pop = mIn("pop"), slap = mIn("slap"), drop = mIn("drop");
    if (wipe.length) tl.to(wipe, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power3.inOut", clearProps: "clipPath" }, t + 0.1);
    if (pop.length) tl.to(pop, { scale: 1, rotation: (i, el) => base(el), duration: 0.8, ease: "back.out(1.6)", stagger: 0.08 }, t + 0.15);
    if (slap.length) tl.to(slap, { scale: 1, autoAlpha: 1, rotation: (i, el) => base(el), duration: 0.6, ease: "back.out(2)", stagger: 0.1 }, t + 0.25);
    if (drop.length) tl.to(drop, { y: 0, rotation: (i, el) => base(el), duration: 1.1, ease: "bounce.out", stagger: 0.1 }, t + 0.05);
  }

  if (p.line.length) tl.to(p.line, { scaleX: 1, duration: 0.9, ease: "power3.inOut", stagger: each(p.line.length, 0.07, 0.3) }, t + 0.15);
  if (p.slide.length) tl.to(p.slide, { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: each(p.slide.length, 0.05, 0.25) }, t + 0.2);
  if (p.pop.length) tl.to(p.pop, { scale: 1, duration: 0.55, ease: "back.out(2.2)", stagger: each(p.pop.length, 0.05, 0.25) }, t + 0.3);
  if (p.sticker.length) tl.to(p.sticker, { scale: 1, autoAlpha: 1, rotation: (i, el) => base(el), duration: 0.55, ease: "back.out(2.4)", stagger: { each: each(p.sticker.length, 0.08, 0.35), from: "random" } }, t + 0.45);

  return tl;
}

// ==========================================================
// BARBA TRANSITIONS
// leave = pageOut, enter = setInitialStates + pageIn.
// Barba prefetcht al op hover, dus de nieuwe pagina staat meestal klaar.
// ==========================================================

function initBarba() {
  if (!window.barba) return;

  barba.hooks.before((data) => {
    document.documentElement.classList.add("is-transitioning");
    closeNavigation();
    lockScroll();
    moveIndicator(data.next.url.href);
  });

  barba.hooks.after((data) => {
    reinitWebflow(data.next.html);
    updateCurrentNav();
    unlockScroll();
    document.documentElement.classList.remove("is-transitioning");
  });

  barba.init({
    preventRunning: true,
    timeout: 5000,
    transitions: [
      {
        name: "stercq",

        leave(data) {
          return pageOut(data.current.container);
        },

        afterLeave(data) {
          destroyPage(data.current.container);
          unsplitAll(data.current.container);
          gsap.set(data.current.container, { display: "none" });
        },

        beforeEnter(data) {
          resetScroll();
          splitAll(data.next.container);
          setInitialStates(data.next.container);
        },

        enter(data) {
          return pageIn(data.next.container);
        },

        afterEnter(data) {
          initPage(data.next.container);
        },
      },
    ],
  });
}

// Eerste load: dezelfde opbouw als na een transitie
async function initFirstEnter() {
  const c = document.querySelector('[data-barba="container"]');
  if (!c) return;
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
  splitAll(c);
  setInitialStates(c);
  document.documentElement.classList.add("is-ready");
  pageIn(c);
}

// ==========================================================
// INIT
// ==========================================================

function initSite() {
  initLenis();
  initBarba();
  initBoldFullScreenNavigation();
  updateCurrentNav();
  moveIndicator(window.location.href, true);
  initPage(document.querySelector('[data-barba="container"]') || document);
  initFirstEnter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSite);
} else {
  initSite();
}
