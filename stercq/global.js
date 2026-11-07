// ==========================================================
// STERCQ — global.js
// Stack: GSAP (+ ScrollTrigger, CustomEase, SplitText), Lenis, Barba.
// Draggable en matter-js laden we zelf, alleen op pagina's die ze nodig hebben.
// Doel: licht, snel, smooth — Lenis bijna native, korte Barba-transities
// ==========================================================

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

gsap.registerPlugin(ScrollTrigger, CustomEase);
if (window.Draggable) gsap.registerPlugin(Draggable);

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
// "leaving": je koos een pagina in het menu. Het vlak blijft als doek staan, de links gaan al weg;
// de nieuwe pagina wordt erachter klaargezet en komt binnen terwijl het vlak wegtrekt (zie initBarba).
// ==========================================================

const isNavigationOpen = () => document.querySelector("[data-navigation-status]")?.getAttribute("data-navigation-status") === "active";

function setNavigationStatus(isActive, { scroll = true } = {}) {
  const navStatusEl = document.querySelector("[data-navigation-status]");
  if (!navStatusEl) return;

  const target = isActive ? "active" : "not-active";
  if (navStatusEl.getAttribute("data-navigation-status") === target) return;

  navStatusEl.setAttribute("data-navigation-status", target);
  if (!scroll) return;
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

  // Een link naar de pagina waar je al bent: geen transitie, dus het menu gewoon dicht.
  // In de capture-fase: Barba zet de url bij een echte navigatie al om voordat dit zou draaien.
  document.addEventListener("click", (e) => {
    const link = e.target.closest("[data-navigation-status] a[href]");
    if (link && new URL(link.href, location.href).pathname === location.pathname) closeNavigation();
  }, true);

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
// HEADER (desktop) — één crème balk die met de scroll kleiner wordt
// Geen toestanden die omklappen: de eerste 140 px scroll bepalen hoe ver hij is (0 = groot, 1 = klein).
// Het vlak knipt naar een smallere, lagere balk; knop en links schuiven mee naar binnen, het logo
// wordt iets kleiner. Alles via clip-path en transforms, dus niets in de layout verschuift.
// Hover op het logo: de letters golven. Bij een nieuwe pagina stuitert de punt.
// Het streepje onder de actieve link ([data-nav-indicator]) maakt de JS zelf aan als het er niet is.
// ==========================================================

let headerEl = null;
let headerState = "";
let headerLastY = 0;
const HEADER_RANGE = 140;
// Zoveel rem gaat er boven en onder af als hij klein is (zelfde waarde als in global.css)
const HEADER_INSET_Y = 0.5;
// Zo klein wordt de knop (zelfde waarde als in global.css)
const HEADER_BTN_SCALE = 0.8;
const headerBar = { p: -1, x: 0, shift: 0, inset: 0, reset: null };

function setHeaderState(state) {
  if (!headerEl || state === headerState) return;
  headerState = state;
  headerEl.setAttribute("data-header-state", state);
}

// Hoe ver de balk krimpt: tot hij net om de inhoud past (de grootste kant bepaalt, zodat het logo in het midden blijft)
function measureHeaderBar() {
  if (!headerEl) return;
  const W = headerEl.offsetWidth;
  if (!W) return;
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const span = (wrap) => {
    const kids = wrap ? [...wrap.children].filter((n) => !n.matches("[data-nav-indicator]") && n.offsetWidth) : [];
    if (!kids.length) return 0;
    return Math.max(...kids.map((n) => n.offsetLeft + n.offsetWidth)) - Math.min(...kids.map((n) => n.offsetLeft));
  };
  const left = span(headerEl.querySelector(".header_btn_wrapper"));
  const right = span(headerEl.querySelector(".header_nav_items_wrapper"));
  const logo = (headerEl.querySelector(".logo_stercq")?.offsetWidth || 128) * 0.86;
  const padFull = parseFloat(getComputedStyle(headerEl).paddingLeft) || 1.5 * rem;
  // Klein: evenveel ruimte naast de knop als erboven en eronder
  const barH = headerEl.offsetHeight - 2 * HEADER_INSET_Y * rem;
  // De knop krimpt mee (HEADER_BTN_SCALE), zodat hij ook in de lagere balk lucht heeft
  const btnH = (headerEl.querySelector(".header_btn_wrapper > *")?.offsetHeight || 0) * HEADER_BTN_SCALE;
  const pad = Math.max(0.5 * rem, (barH - btnH) / 2);
  const compact = Math.min(W, 2 * (Math.max(left * HEADER_BTN_SCALE, right) + 2.5 * rem + logo / 2 + pad));
  headerBar.inset = (W - compact) / 2;
  headerBar.shift = headerBar.inset + (pad - padFull);
  headerBar.p = -1;
  applyHeaderBar(headerBar.x);
}

function applyHeaderBar(p) {
  if (!headerEl) return;
  headerBar.x = p;
  if (Math.abs(p - headerBar.p) < 0.002) return;
  headerBar.p = p;
  const e = p * p * (3 - 2 * p);
  headerEl.style.setProperty("--hdr-p", e.toFixed(4));
  headerEl.style.setProperty("--hdr-inset", `${(headerBar.inset * e).toFixed(1)}px`);
  headerEl.style.setProperty("--hdr-shift", `${(headerBar.shift * e).toFixed(1)}px`);
}

let headerRaf = 0;
function updateHeaderState() {
  if (headerRaf) return;
  headerRaf = requestAnimationFrame(() => {
    headerRaf = 0;
    const y = window.scrollY;
    headerLastY = y;
    setHeaderState(y < 40 ? "top" : "bar");
    // Een nieuwe pagina laat hem groeien (resetHeaderState); scrolt de bezoeker intussen, dan wint die
    if (headerBar.reset?.isActive() && y < 4) return;
    headerBar.reset?.kill();
    applyHeaderBar(Math.min(1, Math.max(0, y / HEADER_RANGE)));
  });
}

// Nieuwe pagina (die begint bovenaan): rustig terug naar groot in plaats van te springen
function resetHeaderState() {
  headerLastY = 0;
  setHeaderState("top");
  headerBar.reset?.kill();
  const state = { p: headerBar.x };
  headerBar.reset = gsap.to(state, { p: 0, duration: 0.6, ease: "power2.inOut", onUpdate: () => applyHeaderBar(state.p) });
}

// Logo: letters golven bij hover; de punt stuitert bij een nieuwe pagina
function headerLogos() {
  const wrap = headerEl?.querySelector(".logo_stercq, .header_logo_wrapper");
  const wm = wrap && wordmarkLetters(wrap);
  return wm ? [wm] : [];
}
function headerLogoUnits(wm) {
  const r = wm.svg.getBoundingClientRect();
  const vb = wm.svg.viewBox.baseVal;
  return vb && vb.width && r.width ? vb.width / r.width : 1;
}
function initHeaderLogo() {
  if (reducedMotion) return;
  const wave = () => headerLogos().forEach((wm) => {
    const u = headerLogoUnits(wm);
    wm.letters.forEach((l, i) => gsap.to(l, { keyframes: [
      { y: l._y0 - 5 * u, duration: 0.16, ease: "power2.out" },
      { y: l._y0, duration: 0.45, ease: "back.out(2)" },
    ], delay: i * 0.035, overwrite: "auto" }));
  });
  headerEl?.querySelector(".header_logo_wrapper a, .header_logo_wrapper")?.addEventListener("mouseenter", wave);
}
function bounceHeaderDot() {
  if (reducedMotion) return;
  headerLogos().forEach((wm) => {
    const dot = wm.letters[wm.letters.length - 1];
    const u = headerLogoUnits(wm);
    gsap.to(dot, { keyframes: [
      { y: dot._y0 - 12 * u, duration: 0.18, ease: "power2.out" },
      { y: dot._y0, duration: 0.6, ease: "bounce.out" },
    ], overwrite: "auto" });
  });
}

function initHeaderStates() {
  headerEl = [...document.querySelectorAll("[data-header]")].find((el) => el.querySelector(".header_nav_items_wrapper")) || null;
  if (!headerEl) return;
  const navWrap = headerEl.querySelector(".header_nav_items_wrapper");
  if (navWrap && !document.querySelector("[data-nav-indicator]")) {
    const indicator = document.createElement("span");
    indicator.className = "nav-indicator";
    indicator.setAttribute("data-nav-indicator", "");
    indicator.setAttribute("aria-hidden", "true");
    navWrap.appendChild(indicator);
  }
  headerEl.setAttribute("data-header-bar", "");
  measureHeaderBar();
  headerBar.x = Math.min(1, Math.max(0, window.scrollY / HEADER_RANGE));
  headerBar.p = -1;
  applyHeaderBar(headerBar.x);
  headerLastY = window.scrollY;
  setHeaderState(window.scrollY < 40 ? "top" : "bar");
  window.addEventListener("scroll", updateHeaderState, { passive: true });
  let t;
  window.addEventListener("resize", () => { clearTimeout(t); t = setTimeout(measureHeaderBar, 150); });
  initHeaderLogo();
}

// Ligt er bovenaan een donker of paars vlak achter de header? Dan "dark": de balk blijft staan.
// Een eigen data-header-theme op de container wint.
function detectHeaderTheme(c) {
  if (!headerEl) return "light";
  const band = headerEl.getBoundingClientRect();
  const luminance = (color) => {
    const m = color.match(/[\d.]+/g);
    if (!m || (m[3] !== undefined && Number(m[3]) < 0.5)) return null;
    const [r, g, b] = m.slice(0, 3).map((v) => {
      const x = v / 255;
      return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b;
  };
  for (const el of c.querySelectorAll(":scope > *, :scope > * > *")) {
    const r = el.getBoundingClientRect();
    if (r.bottom <= band.top || r.top >= band.bottom || r.right <= band.left || r.left >= band.right) continue;
    const l = luminance(getComputedStyle(el).backgroundColor);
    if (l !== null && l < 0.4) return "dark";
  }
  return "light";
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
// MARQUEE — scroll-richting en scroll-snelheid
// data-marquee-scroll-direction-target op de wrapper
// ==========================================================

function initMarqueeScrollDirection(scope = document) {
  const marquees = [
    ...(scope.nodeType === 1 && scope.matches("[data-marquee-scroll-direction-target]") ? [scope] : []),
    ...scope.querySelectorAll("[data-marquee-scroll-direction-target]"),
  ].filter((marquee) => !marquee._marqueeScrollDirectionDestroy);
  if (!marquees.length) return;

  // In drie rondes: eerst alles meten, dan alles schrijven, dan pas animaties en triggers.
  // Per marquee meten-schrijven-meten liet de hele pagina een paar keer opnieuw layouten (de haper bij de wissel).
  const speedMultiplier = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;
  const setups = marquees.map((marquee) => {
    const marqueeContent = marquee.querySelector("[data-marquee-collection-target]");
    const marqueeScroll = marquee.querySelector("[data-marquee-scroll-target]");
    if (!marqueeContent || !marqueeScroll) return null;
    const { marqueeSpeed: speed, marqueeDirection: direction, marqueeDuplicate: duplicate, marqueeScrollSpeed: scrollSpeed } = marquee.dataset;
    const marqueeSpeed = parseFloat(speed) * (marqueeContent.offsetWidth / Math.max(1, window.innerWidth)) * speedMultiplier;
    if (!Number.isFinite(marqueeSpeed) || marqueeSpeed <= 0) return null;
    return {
      marquee,
      marqueeContent,
      marqueeScroll,
      marqueeSpeed,
      marqueeDirectionAttr: direction === "right" ? 1 : -1,
      duplicateAmount: Math.max(0, parseInt(duplicate || 0, 10) || 0),
      scrollSpeedAttr: parseFloat(scrollSpeed) || 0,
    };
  }).filter(Boolean);

  setups.forEach((m) => {
    m.originalMarginLeft = m.marqueeScroll.style.marginLeft;
    m.originalWidth = m.marqueeScroll.style.width;
    m.originalScrollTransform = m.marqueeScroll.style.transform;
    m.originalStatus = m.marquee.getAttribute("data-marquee-status");
    m.clones = [];
    m.marqueeScroll.style.marginLeft = `${m.scrollSpeedAttr * -1}%`;
    m.marqueeScroll.style.width = `${(m.scrollSpeedAttr * 2) + 100}%`;
    if (m.duplicateAmount > 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < m.duplicateAmount; i++) {
        const clone = m.marqueeContent.cloneNode(true);
        clone.setAttribute("data-marquee-generated-clone", "");
        clone.setAttribute("aria-hidden", "true");
        m.clones.push(clone);
        fragment.appendChild(clone);
      }
      m.marqueeScroll.appendChild(fragment);
    }
    m.marquee.setAttribute("data-marquee-status", "normal");
  });

  setups.forEach((m) => {
    const { marquee, marqueeScroll, marqueeSpeed, marqueeDirectionAttr, scrollSpeedAttr } = m;
    const marqueeItems = [...marquee.querySelectorAll("[data-marquee-collection-target]")];
    const originalTransforms = marqueeItems.map((item) => item.style.transform);
    const animation = gsap.to(marqueeItems, {
      xPercent: -100,
      repeat: -1,
      duration: marqueeSpeed,
      ease: "linear",
    }).totalProgress(0.5);

    gsap.set(marqueeItems, { xPercent: marqueeDirectionAttr === 1 ? 100 : -100 });
    animation.timeScale(marqueeDirectionAttr);
    animation.play();

    const directionTrigger = ScrollTrigger.create({
      trigger: marquee,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const isInverted = self.direction === 1;
        const currentDirection = isInverted ? -marqueeDirectionAttr : marqueeDirectionAttr;
        animation.timeScale(currentDirection);
        marquee.setAttribute("data-marquee-status", isInverted ? "normal" : "inverted");
      },
      // Buiten beeld stil: anders rekent elke marquee elke frame door
      onToggle: (self) => animation.paused(!self.isActive),
    });
    animation.paused(!directionTrigger.isActive);

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: marquee,
        start: "0% 100%",
        end: "100% 0%",
        scrub: 0,
      },
    });

    const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
    const scrollEnd = -scrollStart;
    timeline.fromTo(marqueeScroll, { x: `${scrollStart}vw` }, { x: `${scrollEnd}vw`, ease: "none" });

    marquee._marqueeScrollDirectionDestroy = () => {
      animation.kill();
      directionTrigger.kill();
      timeline.scrollTrigger?.kill();
      timeline.kill();
      marqueeItems.forEach((item, index) => { item.style.transform = originalTransforms[index]; });
      marqueeScroll.style.marginLeft = m.originalMarginLeft;
      marqueeScroll.style.width = m.originalWidth;
      marqueeScroll.style.transform = m.originalScrollTransform;
      m.clones.forEach((clone) => clone.remove());
      if (m.originalStatus == null) marquee.removeAttribute("data-marquee-status");
      else marquee.setAttribute("data-marquee-status", m.originalStatus);
      marquee._marqueeScrollDirectionDestroy = null;
    };
  });
}

function destroyMarqueeScrollDirection(scope = document) {
  const marquees = [
    ...(scope.nodeType === 1 && scope.matches("[data-marquee-scroll-direction-target]") ? [scope] : []),
    ...scope.querySelectorAll("[data-marquee-scroll-direction-target]"),
  ];
  marquees.forEach((marquee) => marquee._marqueeScrollDirectionDestroy?.());
}

// ==========================================================
// CSS-ANIMATIES BUITEN BEELD PAUZEREN
// De radial marquee draait oneindig in CSS; buiten beeld zetten we hem stil.
// ==========================================================

function initOffscreenPause(scope = document) {
  scope.querySelectorAll("[data-radial-cards-marquee-list]").forEach((el) => {
    if (el._offscreenPauseDestroy || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => {
      el.style.animationPlayState = entry.isIntersecting ? "" : "paused";
    });
    io.observe(el.parentElement || el);
    el._offscreenPauseDestroy = () => {
      io.disconnect();
      el.style.animationPlayState = "";
      el._offscreenPauseDestroy = null;
    };
  });
}

function destroyOffscreenPause(scope = document) {
  scope.querySelectorAll("[data-radial-cards-marquee-list]").forEach((el) => el._offscreenPauseDestroy?.());
}

// ==========================================================
// CSS ACCORDION
// [data-accordion-css-init] op de wrapper; toggle/status via data-attributen.
// ==========================================================

function initAccordionCSS(scope = document) {
  const accordions = [
    ...(scope.nodeType === 1 && scope.matches("[data-accordion-css-init]") ? [scope] : []),
    ...scope.querySelectorAll("[data-accordion-css-init]"),
  ];

  accordions.forEach((accordion) => {
    if (accordion._accordionCssDestroy) return;

    const closeSiblings = accordion.getAttribute("data-accordion-close-siblings") === "true";
    const onClick = (event) => {
      const toggle = event.target.closest?.("[data-accordion-toggle]");
      if (!toggle || toggle.closest("[data-accordion-css-init]") !== accordion) return;

      const item = toggle.closest("[data-accordion-status]");
      if (!item || !accordion.contains(item)) return;

      const isActive = item.getAttribute("data-accordion-status") === "active";
      item.setAttribute("data-accordion-status", isActive ? "not-active" : "active");

      if (closeSiblings && !isActive) {
        accordion.querySelectorAll('[data-accordion-status="active"]').forEach((sibling) => {
          if (sibling !== item && sibling.closest("[data-accordion-css-init]") === accordion) {
            sibling.setAttribute("data-accordion-status", "not-active");
          }
        });
      }
    };

    accordion.addEventListener("click", onClick);
    accordion._accordionCssDestroy = () => {
      accordion.removeEventListener("click", onClick);
      accordion._accordionCssDestroy = null;
    };
  });
}

function destroyAccordionCSS(scope = document) {
  const accordions = [
    ...(scope.nodeType === 1 && scope.matches("[data-accordion-css-init]") ? [scope] : []),
    ...scope.querySelectorAll("[data-accordion-css-init]"),
  ];
  accordions.forEach((accordion) => accordion._accordionCssDestroy?.());
}

// ==========================================================
// FORMULIER — Osmo-opmaak met [data-form-validate]
// De echte submit (input.form-submit) is onzichtbaar, dus een klik op de knop
// bereikt hem niet. [data-submit] valideert en verstuurt via requestSubmit,
// zodat Webflow het formulier gewoon afhandelt (succes/fout-states).
// [data-validate] op een veldgroep krijgt is--error / is--success.
// ==========================================================

// Regels bovenop de browser-validatie, als foutmelding op het veld (dan werkt checkValidity overal):
// min="2" op tekst of textarea = minimale lengte; data-validate-type="contact" = e-mail of telefoonnummer;
// bij een select telt de lege eerste optie niet als keuze.
const FORM_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function applyFieldRules(field) {
  const v = (field.value || "").trim();
  let msg = "";
  if (field.required && !v) msg = field.tagName === "SELECT" ? "Kies een onderwerp" : "Vul dit in";
  else if (v && field.tagName !== "SELECT") {
    const min = parseInt(field.getAttribute("min"), 10);
    if (field.type !== "number" && min && v.length < min) msg = `Minimaal ${min} tekens`;
    if (field.getAttribute("data-validate-type") === "contact") {
      const phone = /^[+\d\s\-().]+$/.test(v) && v.replace(/\D/g, "").length >= 9;
      if (!FORM_EMAIL.test(v) && !phone) msg = "Een e-mailadres of telefoonnummer";
    }
  }
  field.setCustomValidity(msg);
  return !msg && field.checkValidity();
}

function showFormNote(form, text) {
  let note = form.querySelector(".form-note");
  if (!note) {
    note = document.createElement("p");
    note.className = "form-note";
    note.setAttribute("role", "status");
    (form.querySelector("[data-submit]") || form.lastElementChild)?.after(note);
  }
  note.textContent = text;
  clearTimeout(note._t);
  note._t = setTimeout(() => { note.textContent = ""; }, 5000);
}

function initFormValidate(scope = document) {
  scope.querySelectorAll("[data-form-validate] form").forEach((form) => {
    if (form._formValidateDestroy) return;

    let tried = false;
    // Spam: een mens vult nooit binnen 5 seconden een formulier in
    const startedAt = Date.now();
    const fieldsOf = (group) => [...group.querySelectorAll("input, textarea, select")]
      .filter((field) => !["submit", "hidden", "button"].includes(field.type));
    const check = (group) => {
      const ok = fieldsOf(group).map(applyFieldRules).every(Boolean);
      group._touched = true;
      group.classList.toggle("is--error", !ok);
      group.classList.toggle("is--success", ok);
      return ok;
    };
    const submit = () => {
      tried = true;
      const ok = [...form.querySelectorAll("[data-validate]")].map(check).every(Boolean);
      if (!ok) {
        form.querySelector("[data-validate].is--error input, [data-validate].is--error textarea, [data-validate].is--error select")?.focus();
        form._onInvalidSubmit?.();
        return;
      }
      if (Date.now() - startedAt < 5000) {
        showFormNote(form, "Dat ging wel heel snel. Probeer het over een paar seconden nog eens.");
        return;
      }
      if (form._onValidSubmit?.() === false) return;
      const submitter = form.querySelector('[type="submit"]');
      if (form.requestSubmit) form.requestSubmit(submitter || undefined);
      else if (submitter) submitter.click();
      else form.submit();
    };

    const onClick = (event) => {
      if (!event.target.closest("[data-submit]")) return;
      event.preventDefault();
      submit();
    };
    // Enter in een veld volgt dezelfde route als de knop
    const onKeyDown = (event) => {
      if (event.key !== "Enter" || event.target.tagName === "TEXTAREA" || event.target.closest("[data-submit]")) return;
      event.preventDefault();
      submit();
    };
    // Tijdens het typen: een veld dat al eens gecontroleerd is meteen terugkoppelen; een veld dat
    // klopt mag ook al groen worden. Een fout komt pas bij het verlaten of bij versturen.
    const onInput = (event) => {
      const group = event.target.closest("[data-validate]");
      if (!group) return;
      if (tried || group._touched) check(group);
      else if (fieldsOf(group).map(applyFieldRules).every(Boolean)) check(group);
    };
    const onLeave = (event) => {
      const group = event.target.closest("[data-validate]");
      if (!group || group.contains(event.relatedTarget)) return;
      if (tried || group._touched || (event.target.value || "").trim()) check(group);
    };

    form.addEventListener("click", onClick);
    form.addEventListener("keydown", onKeyDown);
    form.addEventListener("input", onInput);
    form.addEventListener("change", onInput);
    form.addEventListener("focusout", onLeave);
    form._formValidateDestroy = () => {
      form.removeEventListener("click", onClick);
      form.removeEventListener("keydown", onKeyDown);
      form.removeEventListener("input", onInput);
      form.removeEventListener("change", onInput);
      form.removeEventListener("focusout", onLeave);
      form._formValidateDestroy = null;
    };
  });
}

function destroyFormValidate(scope = document) {
  scope.querySelectorAll("[data-form-validate] form").forEach((form) => form._formValidateDestroy?.());
  destroyContactForm(scope);
}

// ==========================================================
// CONTACTFORMULIER — een formulier met [data-form-step]'s, zoals het prototype
// Per stap wisselt de kop links (met een andere sticker) en schuift dat blok op desktop mee naar de stap.
// De ogen in de kop kijken naar waar je typt. Alles goed en op de knop: "Druk maar. Let op de klok."
// Versturen: confetti uit de knop, het formulier gaat weg en Binnen! (de success-staat van Webflow)
// komt binnen. De stickers [data-success-sticker] spatten uit de knop en landen rond de video
// [data-success-video], Remi praat en de klok [data-clock] loopt tot hij begint.
// Mislukt het, dan terug naar het formulier met "Hij kwam niet aan."
// Eigen teksten per stap (optioneel): data-step-title="Regel<br>regel" en data-step-sticker="megafoon".
// Video's per onderwerp: window.STERCQ_VIDEOS = { Branding: "https://…mp4", … } (labels: CONTACT_REPLIES).
// Op desktop krijgt de select een eigen lijst (.contact_dropdown); de select blijft het echte veld.
// ==========================================================

const CONTACT_STEPS = [
  { title: null, sticker: ["shit-geregeld-blok"] },                          // 0: begin (de kop uit Webflow)
  { title: "Eerst even<br>kennismaken.", sticker: ["stercq-he", "smiley"] },
  { title: "Wij bellen<br>gewoon terug.", sticker: ["megafoon"] },
  { title: "Wat mag<br>het worden?", sticker: ["doe-eens-gek"] },
  { title: "Vertel maar,<br>we luisteren.", sticker: ["waargebeurd"] },
  { title: "Druk maar.<br>Let op de klok.", sticker: ["tijd-om-te-knallen"] }, // 5: klaar, op de knop
  { title: "Hij kwam<br>niet aan.", sticker: ["megafoon"] },                   // 6: niet verstuurd
];

// Per onderwerp (gezocht in de gekozen optie): het label op de video, en de sleutel voor STERCQ_VIDEOS
const CONTACT_REPLIES = [
  { test: /brand|merk/i, label: "Branding" },
  { test: /campagne|video/i, label: "Campagne" },
  { test: /web|shop/i, label: "Website" },
  { test: /social/i, label: "Social media" },
  { test: /./, label: "Vraag" },
];

// Waar de stickers van Binnen! landen: [x, y, breedte] als deel van de video, vanuit het midden van de video
const BINNEN_SPOTS = {
  desk: { stickers: [[-0.82, -0.67, 0.44], [-1.02, -0.14, 0.51], [-0.94, 0.28, 0.48], [1.0, 0.03, 0.49]], eyes: [0.79, -0.4, 0.28] },
  mob: { stickers: [[-0.47, -0.9, 0.32], [-0.57, -0.05, 0.38], [-0.55, 0.22, 0.34], [0.57, 0.15, 0.36]], eyes: [0.55, -0.39, 0.23] },
};
// Staat er nog een placeholder in Webflow, dan deze stickers uit de bibliotheek
const BINNEN_FILL = [["shit-geregeld-blok"], ["megafoon"], ["wereldbol"], ["durf-je-wel"]];

const contactFieldOf = (step) => step.querySelector("input:not([type=submit]):not([type=hidden]), textarea, select");
const whenIdle = (fn) => ("requestIdleCallback" in window ? window.requestIdleCallback(fn, { timeout: 1200 }) : setTimeout(fn, 250));
const COPY_ROT = -6;   // de sticker bij de kop staat iets scheef

// Alle teksten die de kop kan krijgen
function contactTitles(startTitle, steps) {
  return CONTACT_STEPS.map((s, i) => (i === 0 ? startTitle : (i <= 4 && steps[i - 1]?.getAttribute("data-step-title")) || s.title));
}
// De kop krijgt de hoogte van de hoogste tekst die hij kan krijgen: zo schuift er niets als hij wisselt.
// Alle varianten tegelijk in één onzichtbaar blok: één keer meten.
function lockContactHeading(heading, hero, titles) {
  const headWrap = heading?.parentElement;
  if (!heading || !headWrap) return;
  heading.style.minHeight = "";
  // Zo breed als de kop maximaal mag worden (de kolom), niet zo breed als hij nu is
  const room = (hero || headWrap.parentElement || headWrap).clientWidth;
  const box = document.createElement("div");
  box.setAttribute("aria-hidden", "true");
  Object.assign(box.style, { position: "absolute", left: "0px", top: "0px", width: `${room}px`, visibility: "hidden", pointerEvents: "none" });
  titles.forEach((t) => {
    const probe = heading.cloneNode(false);
    probe.removeAttribute("data-tr");
    probe.removeAttribute("id");
    Object.assign(probe.style, { margin: "0px", minHeight: "", position: "static" });
    probe.innerHTML = t;
    box.appendChild(probe);
  });
  headWrap.appendChild(box);
  const max = Math.max(heading.offsetHeight, ...[...box.children].map((p) => p.offsetHeight));
  box.remove();
  heading.style.minHeight = `${Math.ceil(max)}px`;
}
function contactParts(wrap) {
  const grid = wrap.closest(".contact_grid");
  const col = grid ? [...grid.children].find((el) => el.contains(wrap)) || null : null;
  const hero = grid ? [...grid.children].find((el) => el !== col) || null : null;
  const heading = hero?.querySelector("h1, h2, .h1, .h2") || null;
  return { grid, col, hero, heading };
}

// Vóór de binnenkomst (paginawissel of eerste load): alleen wat je ziet. Kleuren van de stappen en de knop,
// en de vaste hoogte van de kop. Al het andere komt pas als de pagina er staat (initContactForm).
function prepareContactForm(scope = document) {
  scope.querySelectorAll("[data-form-validate]").forEach((wrap) => {
    const form = wrap.querySelector("form");
    const steps = form ? [...form.querySelectorAll("[data-form-step]")] : [];
    if (!steps.length || wrap._contactDestroy || wrap.classList.contains("has-steps")) return;
    wrap.classList.add("has-steps");
    steps.forEach((s, i) => s.classList.toggle("is--active", i === 0));
    wrap.classList.toggle("is--complete", steps.map(contactFieldOf).every((f) => !f || applyFieldRules(f)));
    const { hero, heading } = contactParts(wrap);
    if (heading) {
      heading._contactStart = heading.innerHTML;
      lockContactHeading(heading, hero, contactTitles(heading._contactStart, steps));
    }
  });
}

function initContactForm(scope = document) {
  scope.querySelectorAll("[data-form-validate]").forEach((wrap) => {
    const form = wrap.querySelector("form");
    const steps = form ? [...form.querySelectorAll("[data-form-step]")] : [];
    if (!steps.length || wrap._contactDestroy) return;
    wrap.classList.add("has-steps");
    const cleanups = [];
    const on = (el, type, fn, opts) => { el.addEventListener(type, fn, opts); cleanups.push(() => el.removeEventListener(type, fn, opts)); };

    const fields = steps.map(contactFieldOf);
    const done = wrap.querySelector(".w-form-done");
    const fail = wrap.querySelector(".w-form-fail");
    const { grid, col, hero, heading } = contactParts(wrap);
    const headWrap = heading?.parentElement || null;
    let stickerSources = null;
    const srcFor = (names) => stickerSrcFor(names, stickerSources || (stickerSources = getStickerSources()));
    const eyesSlot = hero?.querySelector("[data-eyes]") || null;
    const eyesBox = eyesSlot && eyesSlot.parentElement !== headWrap && eyesSlot.parentElement?.children.length === 1
      ? eyesSlot.parentElement : eyesSlot;
    const heroEyes = () => eyesSlot?._eyes || null;
    const submitBox = form.querySelector("[data-submit]");
    const button = submitBox?.querySelector("a, button") || submitBox;
    const btnText = button?.querySelector(".button-052__text") || null;
    const btnLabel = btnText ? btnText.textContent : "";
    const topic = fields.find((f) => f?.tagName === "SELECT") || null;
    const contactField = fields.find((f) => f?.getAttribute("data-validate-type") === "contact") || null;
    const narrow = window.matchMedia("(max-width: 767px)");
    const ctx = document.createElement("canvas").getContext("2d");
    const valid = (f) => !f || applyFieldRules(f);
    const missing = () => fields.filter((f) => !valid(f)).length;
    const ready = () => missing() === 0;
    const sideBySide = () => !!(grid && hero) && getComputedStyle(grid).gridTemplateColumns.trim().split(/\s+/).length > 1;

    let step = 0, token = 0, sent = false, error = false, busy = false, view = "form", lateFail = false;
    let target = null, origin = { x: innerWidth / 2, y: innerHeight / 2 };
    let alive = true, copyStk = null, watching = false, resolveResult = null, resultP = null, binnenTl = null, cancelBinnen = null;

    const bursts = done ? [...done.querySelectorAll("[data-success-sticker]")] : [];
    const doneEyes = done?.querySelector("[data-eyes]") || null;
    const burstEls = () => [...bursts, doneEyes].filter(Boolean);

    // Binnen! komt binnen zoals een pagina: zonder eigen data-tr krijgt het de standaard
    if (done) {
      const setTr = (el, v, extra = {}) => {
        if (!el || el.hasAttribute("data-tr")) return;
        el.setAttribute("data-tr", v);
        Object.entries(extra).forEach(([k, val]) => el.setAttribute(k, val));
      };
      done.querySelectorAll("h1, h2, h3, p").forEach((el) => setTr(el, "lines"));
      const media = done.querySelector("[data-success-video]");
      setTr(media && (media.tagName === "IMG" || media.tagName === "VIDEO") ? media.parentElement : media, "media", { "data-in": "slap", "data-out": "pop" });
      done.querySelectorAll(".button-052").forEach((el) => setTr(el, "pop"));
    }
    // Wat pas bij versturen nodig is (de video, de stickers van Binnen!, de eigen uitklaplijst) komt
    // als de browser even niets te doen heeft, niet tijdens de binnenkomst
    let reply = null, extrasDone = false;
    const extras = () => {
      if (extrasDone || !alive) return;
      extrasDone = true;
      bursts.forEach((st, i) => {
        if (isPlaceholderImg(st) && BINNEN_FILL[i]) { const s = srcFor(BINNEN_FILL[i]); if (s) st.src = s; }
      });
      reply = contactReply(done);
      if (topic?.value) reply?.prepare(topic.value);
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        form.querySelectorAll("[data-form-step] select").forEach((select) => cleanups.push(enhanceSelect(select)));
      }
    };
    cleanups.push(() => reply?.destroy());

    // De klok in Binnen!: loopt vanaf de klik tot Remi begint te praten
    // (opnieuw zoeken als de regels van de tekst gesplitst zijn: dan is het een ander element)
    let clockEl = null, clockOn = false, t0 = 0;
    const clockTick = () => {
      if (!clockEl?.isConnected) clockEl = done?.querySelector("[data-clock]") || null;
      if (clockEl) clockEl.textContent = ((performance.now() - t0) / 1000).toFixed(2).replace(".", ",");
    };
    const startClock = () => { t0 = performance.now(); clockTick(); if (!clockOn) { clockOn = true; gsap.ticker.add(clockTick); } };
    const stopClock = () => { if (!clockOn) return; clockOn = false; gsap.ticker.remove(clockTick); clockTick(); };
    cleanups.push(() => { if (clockOn) gsap.ticker.remove(clockTick); });


    // De kop: per stap een andere tekst, regel voor regel
    // De oorspronkelijke kop (bewaard in de voorbereiding, vóór de transitie hem in regels zette)
    const startTitle = heading ? heading._contactStart ?? heading.innerHTML : "";
    const titles = contactTitles(startTitle, steps);
    const titleFor = (idx) => titles[idx];
    const stickerFor = (idx) => {
      const own = idx >= 1 && idx <= 4 ? steps[idx - 1]?.getAttribute("data-step-sticker") : null;
      return own ? [own] : CONTACT_STEPS[idx].sticker;
    };
    const split = () => {
      if (!heading || !window.SplitText) return;
      heading._split?.revert();
      heading._split = SplitText.create(heading, { type: "lines", mask: "lines", linesClass: "tr-line" });
    };

    // De ogen: geen muis volgen, maar kijken naar waar je typt
    const takeEyes = () => { const e = heroEyes(); if (e) eyesFollowers.delete(e); };
    takeEyes();
    cleanups.push(() => { const e = heroEyes(); if (e) eyesFollowers.add(e); });
    if (eyesBox) {
      const old = eyesBox.getAttribute("style");
      Object.assign(eyesBox.style, { position: "absolute", left: "0px", top: "0px", right: "auto", bottom: "auto", margin: "0px" });
      cleanups.push(() => {
        gsap.killTweensOf(eyesBox);
        if (old == null) eyesBox.removeAttribute("style"); else eyesBox.setAttribute("style", old);
      });
    }

    // De ogen staan verborgen (CSS) tot ze op hun plek staan, dan springen ze erop
    let eyesShown = false;
    function showEyes() {
      if (!alive || eyesShown || !eyesSlot) return;
      eyesShown = true;
      if (reducedMotion) gsap.set(eyesSlot, { autoAlpha: 1 });
      else gsap.fromTo(eyesSlot, { autoAlpha: 0, scale: 0 }, { autoAlpha: 1, scale: 1, duration: 0.5, ease: POP_EASE });
    }
    if (eyesSlot) cleanups.push(() => { gsap.killTweensOf(eyesSlot); gsap.set(eyesSlot, { clearProps: "opacity,visibility,transform" }); });

    // De kop houdt de hoogte van zijn hoogste tekst (zie lockContactHeading)
    const lockHeading = () => lockContactHeading(heading, hero, titles);
    if (heading) cleanups.push(() => { heading.style.minHeight = ""; });

    // Achter de laatste regel van de kop: op desktop flink los van de tekst, iets lager
    function placeEyes(instant) {
      const lines = heading?._split?.lines;
      const op = eyesBox?.offsetParent;
      if (!eyesBox || !op || !lines?.length) return;
      const or = op.getBoundingClientRect();
      const colRight = (hero || headWrap).getBoundingClientRect().right;
      const fs = parseFloat(getComputedStyle(heading).fontSize);
      const w = eyesBox.offsetWidth, h = eyesBox.offsetHeight;
      const desk = sideBySide();
      const gap = fs * (desk ? 0.7 : 0.15);
      const maxRight = desk ? colRight + 24 + w : colRight;
      // Achter de laatste regel; past dat niet, dan achter een regel erboven met ruimte; anders rechtsboven de kop
      const spots = [...lines].map((line) => {
        const range = document.createRange();
        range.selectNodeContents(line);
        return { tr: range.getBoundingClientRect(), mr: line.parentElement.getBoundingClientRect() };
      });
      // Een plek is goed als de ogen erin passen en over geen enkele regel tekst vallen
      const clear = (left, top) => spots.every(({ tr }) => left + 4 >= tr.right || left + w - 4 <= tr.left || top + 4 >= tr.bottom || top + h - 4 <= tr.top);
      const fit = [...spots].reverse().map(({ tr, mr }) => ({
        left: tr.right + gap,
        top: mr.top + (mr.height - h) / 2 + fs * (desk ? 0.38 : 0.1),
      })).find((c) => c.left + w <= maxRight && clear(c.left, c.top));
      let x, y;
      if (fit) {
        x = fit.left - or.left;
        y = fit.top - or.top;
      } else {
        // Rechtsboven, helemaal boven de eerste regel
        x = colRight - w - or.left;
        y = Math.min(...spots.map(({ tr }) => tr.top)) - h - 2 - or.top;
      }
      if (instant || reducedMotion) { gsap.killTweensOf(eyesBox, "x,y"); gsap.set(eyesBox, { x, y }); }
      else gsap.to(eyesBox, { x, y, duration: 0.7, ease: "power3.inOut", overwrite: "auto", onUpdate: look });
    }

    function caretPoint(input) {
      const r = input.getBoundingClientRect();
      const cs = getComputedStyle(input);
      ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
      const pos = input.selectionStart == null ? input.value.length : input.selectionStart;
      const w = Math.min(r.width, (parseFloat(cs.paddingLeft) || 0) + ctx.measureText(input.value.slice(0, pos)).width);
      return [r.left + w, r.top + r.height * 0.45];
    }

    function look() {
      const e = heroEyes();
      if (!e || !alive || view !== "form") return;
      if (sent) { e.lookAtYou(); return; }
      if (!target) { if (heading) e.lookAtEl(heading, 0.3, 0.55); return; }
      if (target === button) { e.lookAtEl(button, 0.25, 0.5); return; }
      if (target.tagName === "INPUT") { const [x, y] = caretPoint(target); e.lookAt(x, y); return; }
      e.lookAtEl(target, 0.12, 0.4);
    }


    // Desktop: het blok links blijft in beeld terwijl je door het formulier scrolt (sticky), zonder zelf te bewegen
    if (hero) {
      const old = hero.getAttribute("style");
      const stick = () => {
        if (sideBySide()) Object.assign(hero.style, { position: "sticky", top: `${Math.max(headerEl?.offsetHeight || 0, 80) + 72}px`, alignSelf: "start" });
        else Object.assign(hero.style, { position: "", top: "", alignSelf: "" });
      };
      stick();
      on(window, "resize", stick);
      cleanups.push(() => { if (old == null) hero.removeAttribute("style"); else hero.setAttribute("style", old); });
    }



    // Sticker bij de kop: de oude springt eraf, de nieuwe wordt erop geplakt
    function makeSticker(names) {
      const src = srcFor(names);
      if (!src || !headWrap) return null;
      const el = document.createElement("img");
      el.className = "contact_copy_sticker";
      el.src = src;
      el.alt = "";
      el.draggable = false;
      el.setAttribute("aria-hidden", "true");
      headWrap.appendChild(el);
      return el;
    }
    function popIn(el, delay = 0) {
      if (!el) return;
      if (reducedMotion) { gsap.set(el, { autoAlpha: 1 }); return; }
      gsap.fromTo(el, { scale: 1.6, autoAlpha: 0, rotation: rnd(-28, 28) },
        { scale: 1, autoAlpha: 1, rotation: COPY_ROT, duration: 0.55, ease: "back.out(2.4)", delay });
    }
    function swapSticker(names) {
      const old = copyStk;
      copyStk = makeSticker(names);
      if (copyStk) gsap.set(copyStk, { autoAlpha: 0 });
      if (old) {
        gsap.killTweensOf(old);
        if (reducedMotion) old.remove();
        else gsap.to(old, { keyframes: [
          { scale: 1.12, duration: 0.1, ease: "power2.out" },
          { scale: 0, rotation: "+=" + rnd(-35, 35), duration: 0.28, ease: "back.in(2.4)" },
        ], onComplete: () => old.remove() });
      }
      if (!heading) popIn(copyStk);              // anders springt hij erop als de nieuwe kop er staat (swapText)
    }
    cleanups.push(() => headWrap?.querySelectorAll(".contact_copy_sticker").forEach((el) => { gsap.killTweensOf(el); el.remove(); }));

    function swapText(markup) {
      if (!heading) return;
      const my = ++token;
      const replace = () => {
        if (my !== token || !alive) return;
        heading._split?.revert();
        heading._split = null;
        heading.innerHTML = markup;
        split();
        placeEyes(false);
        if (heading._split && !reducedMotion) gsap.fromTo(heading._split.lines, { yPercent: -112 }, { yPercent: 0, duration: 0.75, ease: "power4.out", stagger: 0.06 });
        popIn(copyStk, reducedMotion ? 0 : 0.3);
      };
      const cur = heading._split?.lines || [];
      if (!cur.length || reducedMotion) { replace(); return; }
      gsap.killTweensOf(cur);
      gsap.to(cur, { yPercent: 112, duration: 0.32, ease: "power3.in", stagger: 0.04, onComplete: replace });
    }

    function applyActive() {
      steps.forEach((s, i) => {
        s.classList.toggle("is--active", step <= 4 && i === Math.max(1, step) - 1);
        s.classList.remove("is--done");
      });
    }
    // Alles goed ingevuld: de knop wordt paars
    function updateStatus() { wrap.classList.toggle("is--complete", ready()); }
    function setStep(idx) {
      if (idx < 6 && error) error = false;
      if (idx === step) { look(); return; }
      step = idx;
      applyActive();
      swapSticker(stickerFor(idx));
      swapText(titleFor(idx));
      look();
    }

    // Versturen terwijl er nog iets mist: initFormValidate springt naar het veld, de knop schudt even nee
    form._onInvalidSubmit = () => {
      if (reducedMotion || !button) return;
      gsap.fromTo(button, { x: -8 }, { x: 0, duration: 0.6, ease: "elastic.out(1.4, 0.25)", clearProps: "x" });
    };

    on(form, "focusin", (event) => {
      if (sent) return;
      const s = event.target.closest("[data-form-step]");
      if (s) { target = event.target; setStep(steps.indexOf(s) + 1); }
      else if (submitBox?.contains(event.target) && ready()) { target = button; setStep(5); }
    });
    on(form, "focusout", () => {
      setTimeout(() => { if (alive && !form.contains(document.activeElement)) { target = null; look(); } }, 0);
    });
    ["input", "change", "keyup", "click"].forEach((type) => on(form, type, (event) => {
      if (sent) return;
      if (event.target.closest?.("[data-form-step]")) { target = event.target; look(); }
      if (type === "input" || type === "change") updateStatus();
      if (type === "change" && event.target === topic) reply?.prepare(topic.value);   // video alvast laden
    }));
    if (submitBox) on(submitBox, "pointerenter", () => { if (!sent && ready()) { target = button; setStep(5); } });
    on(window, "scroll", () => {
      look();
      if (watching && reply) doneEyes?._eyes?.lookAtEl(reply.fig, 0.5, 0.45);
    }, { passive: true });
    let rz = 0, lastW = window.innerWidth;
    on(window, "resize", () => {
      if (window.innerWidth === lastW) return;
      lastW = window.innerWidth;
      cancelAnimationFrame(rz);
      rz = requestAnimationFrame(() => {
        if (!alive) return;
        if (view === "binnen") { placeBursts(); return; }
        split();
        lockHeading();
        placeEyes(true);
        look();
      });
    });

    // Na een paginawissel zet Webflow de spamcheck (Turnstile) niet opnieuw goed neer: dat doen we zelf
    if (document.documentElement.classList.contains("is-transitioning")) contactTurnstile(form, cleanups);

    whenIdle(extras);

    // Na een paginawissel staat de kop al in regels (de transitie deed dat): die houden we
    if (!heading?._split) split();
    applyActive();
    updateStatus();
    if (heading && !heading.style.minHeight) lockHeading();
    // Ogen en sticker pas als de kop in beeld staat: dan meten, plaatsen en erop. Zo doet het begin
    // (en het einde van een paginawissel) zo min mogelijk tegelijk.
    if (headWrap) {
      const io2 = new IntersectionObserver(([entry]) => {
        if (!entry.isIntersecting) return;
        io2.disconnect();
        gsap.delayedCall(0.35, () => { if (!alive) return; placeEyes(true); showEyes(); look(); });
        gsap.delayedCall(0.5, () => {
          if (!alive || step !== 0 || sent || copyStk) return;
          copyStk = makeSticker(stickerFor(0));
          if (copyStk) { gsap.set(copyStk, { autoAlpha: 0 }); popIn(copyStk); }
        });
      }, { threshold: 0.3 });
      io2.observe(headWrap);
      cleanups.push(() => io2.disconnect());
    } else showEyes();
    // Lettertype nog niet binnen: als het er is, de regels en de hoogte opnieuw meten
    if (document.fonts && document.fonts.status !== "loaded") {
      document.fonts.ready.then(() => { if (alive && view === "form") { split(); lockHeading(); if (eyesShown) placeEyes(true); } });
    }

    // ---------- Versturen ----------
    const moving = () => [...steps, submitBox].filter(Boolean);
    const shown = (el) => !!el && getComputedStyle(el).display !== "none";
    const settle = (r) => { if (resolveResult) { resolveResult(r); resolveResult = null; } };
    // Webflow laat de success- of fout-staat zien; Binnen! tonen we zelf, als het formulier weg is
    const mo = new MutationObserver(() => {
      if (view === "form" && sent) {
        if (shown(done)) { done.style.display = "none"; form.style.display = ""; settle("ok"); }
        else if (shown(fail)) settle("fail");
      } else if (view === "binnen" && shown(fail) && !lateFail) {
        // Webflow verbergt Binnen! en toont het formulier al: dat terugdraaien, wij gaan zelf netjes terug
        lateFail = true;
        done.style.display = "block";
        form.style.display = "none";
        if (busy) { binnenTl?.kill(); cancelBinnen?.(); }
        else backToForm(true);
      }
    });
    [done, fail].filter(Boolean).forEach((el) => mo.observe(el, { attributes: true, attributeFilter: ["style", "class"] }));
    cleanups.push(() => mo.disconnect());

    form._onValidSubmit = () => {
      if (sent || busy) return false;
      sent = true; busy = true; lateFail = false; target = null;
      extras();
      applyTurnstileToken(form);
      if (fail) fail.style.display = "none";     // een oude foutmelding van een vorige poging telt niet meer
      token++;                                   // een kop- of stickerwissel die nog loopt (muis op de knop) niet meer afmaken
      wrap.classList.add("is--sent");
      if (btnText) btnText.textContent = "Verstuurd";
      heroEyes()?.lookAtYou();
      const r = (button || form).getBoundingClientRect();
      origin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      startClock();
      reply?.prepare(topic?.value);
      reply?.unlock();                                        // nog in de klik: dan mag de video straks met geluid
      contactConfetti(origin.x, origin.y);
      resultP = new Promise((res) => { resolveResult = res; });
      run();
      return true;
    };

    async function run() {
      lenis?.stop();
      // Tegelijk met het weggaan rustig naar boven, waar Binnen! komt (dan schuift ook de footer uit beeld)
      await Promise.all([leaveForm(), scrollUp()]);
      // Niet op Webflow wachten: Binnen! komt meteen. Mislukt het alsnog, dan terug naar het formulier.
      const first = await Promise.race([resultP, Promise.resolve("pending")]);
      resolveResult = null;
      if (!alive) return;
      if (first === "fail") { await backToForm(true, true); return; }
      await showBinnen();
      busy = false;
      if (lateFail) backToForm(true);
    }

    function leaveForm() {
      const tl = gsap.timeline();
      if (reducedMotion) return tl;
      if (hero) tl.add(pageOut(hero), 0);
      const lines = heading?._split?.lines || [];
      if (lines.length) { gsap.killTweensOf(lines); tl.to(lines, { yPercent: 140, duration: 0.42, ease: "power3.in", stagger: 0.035 }, 0.04); }
      // Ook een sticker die net wisselde (de nieuwe kan nog wachten om erop te springen)
      const stks = headWrap ? [...headWrap.querySelectorAll(".contact_copy_sticker")] : [];
      gsap.killTweensOf(stks);
      if (stks.length) tl.to(stks, { scale: 0, autoAlpha: 0, duration: 0.3, ease: "back.in(2)" }, 0);
      if (eyesBox) tl.to(eyesBox, { scale: 0, duration: 0.3, ease: "back.in(2)", overwrite: "auto" }, 0);
      tl.to(moving(), { clipPath: "inset(0% 0% 100% 0%)", duration: 0.45, ease: "power3.in", stagger: 0.05, overwrite: "auto" }, 0);
      return tl;
    }

    // Waar Binnen! komt: staat het formulier in het eerste scherm, dan de bovenkant van de pagina
    function topTarget() {
      const gTop = (grid || wrap).getBoundingClientRect().top + window.scrollY;
      return gTop < window.innerHeight * 0.8 ? 0 : Math.max(0, gTop - (headerEl?.offsetHeight || 0) - 24);
    }
    function scrollUp() {
      const top = topTarget();
      if (reducedMotion || Math.abs(window.scrollY - top) < 2) return Promise.resolve();
      return new Promise((resolve) => {
        if (lenis) lenis.scrollTo(top, { duration: 0.75, easing: (t) => 1 - Math.pow(1 - t, 3), force: true, lock: true, onComplete: resolve });
        else { window.scrollTo({ top, behavior: "smooth" }); setTimeout(resolve, 750); }
        setTimeout(resolve, 1000);   // vangnet
      });
    }
    // Het laatste stukje (of alles, zonder animatie) meteen
    function toTop() {
      const top = topTarget();
      if (Math.abs(window.scrollY - top) < 2) return;
      if (lenis) lenis.scrollTo(top, { immediate: true, force: true });
      window.scrollTo(0, top);
    }
    const clearTr = (c) => {
      const els = [...c.querySelectorAll("[data-tr], .tr-line")];
      gsap.killTweensOf(els);
      gsap.set(els, { clearProps: "opacity,visibility,transform,clipPath" });
    };

    // Stickers rond de video: plek en maat ten opzichte van de video
    function placeBursts() {
      const media = reply?.fig || done?.querySelector("[data-success-video]");
      if (!media || !done || !shown(done)) return;
      const set = narrow.matches ? BINNEN_SPOTS.mob : BINNEN_SPOTS.desk;
      const mr = media.getBoundingClientRect();
      const title = done.querySelector("h1, h2, h3");
      const put = (el, spot) => {
        const op = el.offsetParent;
        if (!op || !spot) return;
        const [fx, fy, fw] = spot;
        const or = op.getBoundingClientRect();
        const w = fw * mr.width;
        const cx = gsap.utils.clamp(8 + w / 2, window.innerWidth - 8 - w / 2, mr.left + mr.width / 2 + fx * mr.width);
        Object.assign(el.style, {
          left: `${cx - or.left}px`,
          top: `${mr.top + mr.height / 2 + fy * mr.height - or.top}px`,
          right: "auto", bottom: "auto", width: `${w}px`,
        });
        gsap.set(el, { xPercent: -50, yPercent: -50 });
      };
      bursts.forEach((el, i) => {
        if (i === 0 && title) {
          // Op de kop, linksboven: half eroverheen, zoals in het ontwerp
          const tr = title.getBoundingClientRect();
          const w = set.stickers[0][2] * mr.width;
          const op = el.offsetParent;
          if (!op) return;
          const or = op.getBoundingClientRect();
          const cx = gsap.utils.clamp(8 + w / 2, window.innerWidth - 8 - w / 2, tr.left + w * 0.1);
          Object.assign(el.style, { left: `${cx - or.left}px`, top: `${tr.top - or.top - w * 0.22}px`, right: "auto", bottom: "auto", width: `${w}px` });
          gsap.set(el, { xPercent: -50, yPercent: -50 });
          return;
        }
        put(el, set.stickers[i]);
      });
      if (doneEyes) put(doneEyes, set.eyes);
    }
    function burstPrep() {
      burstEls().forEach((el) => {
        const rest = base(el);
        gsap.set(el, { x: 0, y: 0, scale: 1, rotation: rest, autoAlpha: 1 });
        const r = el.getBoundingClientRect();
        gsap.set(el, { x: origin.x - (r.left + r.width / 2), y: origin.y - (r.top + r.height / 2), scale: 0.15, rotation: rest + rnd(-120, 120), autoAlpha: 0 });
      });
    }
    function burstIn(tl, at) {
      burstEls().forEach((el, i) => {
        const d = rnd(0.9, 1.15), t = at + i * 0.05, rest = base(el);
        tl.set(el, { autoAlpha: 1 }, t)
          .to(el, { x: 0, duration: d, ease: "power3.out" }, t)
          .to(el, { y: 0, duration: d, ease: "back.out(1.5)" }, t)
          .to(el, { scale: 1, duration: d * 0.55, ease: "back.out(2.4)" }, t)
          .to(el, { rotation: rest, duration: d * 1.2, ease: "elastic.out(1, 0.5)" }, t);
      });
    }
    // De ogen in Binnen! kijken naar de video zolang Remi praat
    function watch(onn) {
      const e = doneEyes?._eyes;
      if (!e || !reply) return;
      watching = onn;
      if (onn) { eyesFollowers.delete(e); e.lookAtEl(reply.fig, 0.5, 0.45); }
      else { eyesFollowers.add(e); e.lookAtYou(); }
    }

    async function showBinnen() {
      if (!done) return;
      view = "binnen";
      // De hoogte vasthouden: Binnen! is korter dan het formulier, anders schuift de footer omhoog in beeld
      if (grid) grid.style.minHeight = `${grid.offsetHeight}px`;
      if (hero) hero.style.display = "none";
      form.style.display = "none";
      if (col) col.style.gridColumn = "1 / -1";
      grid?.classList.add("is--sent");
      done.style.display = "block";
      gsap.set(done, { autoAlpha: 1 });
      toTop();
      clearTr(done);
      unsplitAll(done);
      splitAll(done, { near: false });
      placeBursts();
      setInitialStates(done);
      // De rest van de pagina (footer) is verschoven: de scrollposities opnieuw meten als het rustig is
      whenIdle(() => ScrollTrigger.refresh());
      const tl = pageIn(done);
      binnenTl = tl;
      if (reducedMotion) gsap.set(burstEls(), { x: 0, y: 0, scale: 1, autoAlpha: 1 });
      else { burstPrep(); burstIn(tl, 0.1); }
      const title = done.querySelector("h1, h2, h3");
      if (title) { title.setAttribute("tabindex", "-1"); title.focus({ preventScroll: true }); }
      tl.call(() => {
        if (reply) reply.play({ start: () => { stopClock(); watch(true); }, end: () => watch(false) });
        else stopClock();
      }, null, reducedMotion ? 0 : 0.4);
      tl.call(() => lenis?.start(), null, Math.min(0.6, tl.duration()));
      await new Promise((resolve) => { cancelBinnen = resolve; tl.then(resolve); });
      binnenTl = null;
      cancelBinnen = null;
      lenis?.start();
    }

    async function backToForm(err, skipOut) {
      busy = true;
      lenis?.stop();
      stopClock();
      if (view === "binnen" && !skipOut && done) {
        reply?.stop();
        watch(false);
        done.style.display = "block";              // Webflow verbergt hem bij een fout al: eerst netjes weg laten gaan
        const out = pageOut(done);
        out.to(burstEls(), { scale: 0, duration: 0.3, ease: "back.in(2)", overwrite: "auto" }, 0);
        await out;
      }
      reply?.stop();
      watch(false);
      if (done) done.style.display = "none";
      view = "form";
      form.style.display = "";
      if (hero) { hero.style.display = ""; clearTr(hero); }
      if (col) col.style.gridColumn = "";
      if (grid) grid.style.minHeight = "";
      grid?.classList.remove("is--sent");
      gsap.set(moving(), { clearProps: "clipPath" });
      toTop();
      reset(err);
      if (!reducedMotion) {
        if (hero) setInitialStates(hero);
        const tl = hero ? pageIn(hero) : gsap.timeline();
        const lines = heading?._split?.lines || [];
        if (lines.length) tl.fromTo(lines, { yPercent: -112 }, { yPercent: 0, duration: 0.85, ease: "power4.out", stagger: 0.06 }, 0);
        if (eyesBox) tl.fromTo(eyesBox, { scale: 0 }, { scale: 1, duration: 0.5, ease: POP_EASE }, 0.3);
        if (copyStk) tl.fromTo(copyStk, { scale: 1.6, autoAlpha: 0, rotation: rnd(-28, 28) }, { scale: 1, autoAlpha: 1, rotation: COPY_ROT, duration: 0.55, ease: "back.out(2.4)" }, 0.35);
        tl.fromTo(moving(), { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.6, ease: REVEAL_EASE, stagger: 0.05, clearProps: "clipPath" }, 0.1);
        await tl;
      } else {
        gsap.set([eyesBox, copyStk].filter(Boolean), { scale: 1, autoAlpha: 1 });
      }
      lenis?.start();
      look();
      busy = false;
    }

    // Terug naar het formulier: wat je had ingevuld blijft staan
    function reset(err) {
      sent = false; error = !!err; target = null; token++;
      gsap.killTweensOf([hero, eyesBox].filter(Boolean));
      wrap.classList.remove("is--sent");
      if (btnText) btnText.textContent = err ? "Opnieuw versturen" : btnLabel;
      step = err ? 6 : 0;
      applyActive();
      if (heading) {
        heading._split?.revert();
        heading._split = null;
        heading.innerHTML = titleFor(step);
        split();
      }
      headWrap?.querySelectorAll(".contact_copy_sticker").forEach((el) => el.remove());
      copyStk = makeSticker(stickerFor(step));
      placeEyes(true);
      updateStatus();
    }

    wrap._contactDestroy = () => {
      alive = false;
      if (grid) grid.style.minHeight = "";
      cleanups.forEach((fn) => fn());
      if (heading?._split) { gsap.killTweensOf(heading._split.lines); heading._split.revert(); heading._split = null; heading.innerHTML = startTitle; }
      form._onValidSubmit = null;
      form._onInvalidSubmit = null;
      wrap.classList.remove("has-steps", "is--complete", "is--sent");
      wrap._contactDestroy = null;
    };
  });
}

function destroyContactForm(scope = document) {
  scope.querySelectorAll("[data-form-validate]").forEach((wrap) => wrap._contactDestroy?.());
}

// Select met een eigen lijst eroverheen. Muis, pijltjes, Enter, spatie, Escape en Tab werken.
function enhanceSelect(select) {
  const host = select.parentElement;
  const opts = [...select.options].filter((o) => o.value !== "");
  const list = document.createElement("div");
  list.className = "contact_dropdown";
  list.setAttribute("role", "listbox");
  list.id = `${select.id || "keuze"}-lijst`;
  list.hidden = true;
  opts.forEach((o, i) => {
    const item = document.createElement("div");
    item.className = "contact_dropdown_option";
    item.setAttribute("role", "option");
    item.id = `${list.id}-${i}`;
    item.textContent = o.text;
    list.appendChild(item);
  });
  host.appendChild(list);
  const items = [...list.children];
  select.setAttribute("aria-haspopup", "listbox");
  select.setAttribute("aria-controls", list.id);
  let hover = -1;
  const mark = (i) => {
    hover = i;
    items.forEach((item, j) => item.classList.toggle("is--hover", j === i));
    if (i >= 0) select.setAttribute("aria-activedescendant", items[i].id);
  };
  const open = () => {
    if (!list.hidden) return;
    list.hidden = false;
    host.classList.add("is--open");
    select.setAttribute("aria-expanded", "true");
    mark(Math.max(0, opts.findIndex((o) => o.value === select.value)));
    if (!reducedMotion) gsap.fromTo(list, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 0.35, ease: REVEAL_EASE, clearProps: "clipPath" });
    // Valt de lijst onder het scherm, dan schuift de pagina zo ver mee dat hij helemaal te zien is
    const over = list.getBoundingClientRect().bottom - (window.innerHeight - 16);
    if (over > 0) {
      const top = window.scrollY + over;
      if (lenis) lenis.scrollTo(top, { duration: 0.45, easing: (t) => 1 - Math.pow(1 - t, 3) });
      else window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    }
  };
  const close = () => {
    if (list.hidden) return;
    list.hidden = true;
    host.classList.remove("is--open");
    select.setAttribute("aria-expanded", "false");
  };
  const choose = (i) => {
    const o = opts[i];
    if (!o) return;
    select.value = o.value;
    items.forEach((item, j) => item.setAttribute("aria-selected", String(j === i)));
    select.dispatchEvent(new Event("input", { bubbles: true }));
    select.dispatchEvent(new Event("change", { bubbles: true }));
    close();
  };
  const onDown = (e) => { e.preventDefault(); select.focus(); if (list.hidden) open(); else close(); };
  const onKey = (e) => {
    if (list.hidden) {
      if (["ArrowDown", "ArrowUp", " ", "Enter"].includes(e.key)) { e.preventDefault(); e.stopPropagation(); open(); }
      return;
    }
    if (e.key === "ArrowDown") { e.preventDefault(); mark(Math.min(items.length - 1, hover + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); mark(Math.max(0, hover - 1)); }
    else if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); choose(hover); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
    else if (e.key === "Tab") close();
  };
  const onMove = (e) => { const item = e.target.closest(".contact_dropdown_option"); if (item) mark(items.indexOf(item)); };
  const keep = (e) => e.preventDefault();
  const onPick = (e) => { const item = e.target.closest(".contact_dropdown_option"); if (item) choose(items.indexOf(item)); };
  select.addEventListener("mousedown", onDown);
  select.addEventListener("keydown", onKey);
  select.addEventListener("blur", close);
  list.addEventListener("mousemove", onMove);
  list.addEventListener("mousedown", keep);
  list.addEventListener("click", onPick);
  return () => {
    select.removeEventListener("mousedown", onDown);
    select.removeEventListener("keydown", onKey);
    select.removeEventListener("blur", close);
    list.remove();
    host.classList.remove("is--open");
  };
}

const isPlaceholderImg = (img) => img?.tagName === "IMG" && /placeholder/i.test(img.getAttribute("src") || "");
// Eerste sticker uit de bibliotheek waarvan de bestandsnaam een van deze namen bevat
function stickerSrcFor(names, sources = getStickerSources()) {
  for (const name of names) {
    const hit = sources.find((s) => s.src && s.src.split("/").pop().includes(name));
    if (hit) return hit.src;
  }
  return null;
}

// Turnstile (de spamcheck van Webflow) na een paginawissel: Webflow kijkt maar één keer bij het laden van de
// site of er een formulier met spamcheck is, en tekent het vakje daarna niet meer. Dus: script laden (één keer),
// zelf het vakje in het formulier tekenen en het token aan Webflow geven. Het token gaat als veld mee.
function contactTurnstile(form, cleanups) {
  const key = form.closest("[data-turnstile-sitekey]")?.getAttribute("data-turnstile-sitekey");
  if (!key) return;
  form.setAttribute("data-wf-no-turnstile", "");          // Webflow's eigen (kapotte) poging overslaan
  const box = document.createElement("div");
  box.className = "contact_turnstile";
  form.appendChild(box);
  let id = null;
  const render = () => {
    if (!box.isConnected || id != null || !window.turnstile?.render) return;
    id = window.turnstile.render(box, {
      sitekey: key,
      callback: (token) => {
        form._turnstileToken = token;
        applyTurnstileToken(form);
      },
    });
  };
  whenIdle(() => {
  if (window.turnstile?.render) render();
  else {
    let script = document.querySelector('script[src*="challenges.cloudflare.com/turnstile"]');
    if (!script) {
      script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      document.head.appendChild(script);
    }
    script.addEventListener("load", render, { once: true });
    const poll = setInterval(() => { if (window.turnstile?.render || !box.isConnected) { clearInterval(poll); render(); } }, 300);
    cleanups.push(() => clearInterval(poll));
  }
  });
  cleanups.push(() => {
    try { if (id != null) window.turnstile?.remove(id); } catch (e) { /* al weg */ }
    box.remove();
  });
}

// Webflow maakt bij het opnieuw starten (na de paginawissel) nieuwe formulierdata aan: token er (weer) in zetten
function applyTurnstileToken(form) {
  if (!form._turnstileToken) return;
  const d = window.jQuery?.data(form, ".w-form");
  if (d) d.turnstileToken = form._turnstileToken;
  form.querySelectorAll('input[type="submit"]').forEach((b) => { b.disabled = false; b.classList.remove("w-form-loading"); });
}

// Confetti: papiersnippers in de huiskleuren, vanuit de knop
function contactConfetti(x, y) {
  if (reducedMotion) return;
  const layer = document.createElement("div");
  layer.className = "contact_confetti";
  layer.setAttribute("aria-hidden", "true");
  document.body.appendChild(layer);
  const colors = ["#5800ff", "#cb94ff", "#f2c0ff", "#111111"];
  const bits = Array.from({ length: 36 }, (_, i) => {
    const el = document.createElement("i");
    const w = rnd(7, 15), h = rnd(4, 8);
    el.style.cssText = `width:${w}px;height:${h}px;margin:${-h / 2}px 0 0 ${-w / 2}px;background:${colors[i % colors.length]}`;
    layer.appendChild(el);
    const a = (rnd(-165, -15) * Math.PI) / 180, sp = rnd(380, 1050);
    return { el, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, r: rnd(0, 360), vr: rnd(-760, 760), f: rnd(0, 6) };
  });
  let t = 0;
  const tick = () => {
    const dt = Math.min(1 / 30, gsap.ticker.deltaRatio(60) / 60);
    t += dt;
    bits.forEach((b) => {
      b.vx *= 0.986; b.vy = b.vy * 0.988 + 2300 * dt;
      b.x += b.vx * dt; b.y += b.vy * dt; b.r += b.vr * dt;
      b.el.style.transform = `translate3d(${b.x.toFixed(1)}px,${b.y.toFixed(1)}px,0) rotate(${b.r.toFixed(1)}deg) scaleY(${Math.cos(t * 9 + b.f).toFixed(2)})`;
    });
    if (t > 0.95) layer.style.opacity = Math.max(0, 1 - (t - 0.95) / 0.55).toFixed(2);
    if (t > 1.5) { gsap.ticker.remove(tick); layer.remove(); }
  };
  gsap.ticker.add(tick);
}

// De video van Remi in Binnen!: één per onderwerp, met een voortgangsbalk.
// Laden zodra iemand een onderwerp kiest; het geluid ontgrendelen in de klik op Versturen. Lukt geluid niet,
// dan zonder geluid met de knop "Geluid aan". Geen video (nog): de foto blijft staan.
function contactReply(done) {
  const media = done?.querySelector("[data-success-video]");
  if (!media) return null;
  const fig = media.tagName === "IMG" || media.tagName === "VIDEO" ? media.parentElement : media;
  fig.classList.add("contact_reply");
  let video = media.tagName === "VIDEO" ? media : fig.querySelector("video");
  const own = !video;
  if (own) {
    video = document.createElement("video");
    video.className = "contact_reply_video";
    video.hidden = true;
    fig.appendChild(video);
  }
  video.playsInline = true;
  video.setAttribute("playsinline", "");
  video.preload = "none";
  const baseSrc = own ? "" : video.currentSrc || video.getAttribute("src") || "";
  const ui = document.createElement("div");
  ui.className = "contact_reply_ui";
  ui.innerHTML = '<span class="contact_reply_tag" aria-hidden="true">Remi · <span></span></span>'
    + '<span class="contact_reply_bar" aria-hidden="true" hidden><i></i></span>'
    + '<button type="button" class="contact_sound" hidden>Geluid aan</button>';
  fig.appendChild(ui);
  const labelEl = ui.querySelector(".contact_reply_tag span");
  const bar = ui.querySelector(".contact_reply_bar");
  const barEl = bar.querySelector("i");
  const btn = ui.querySelector(".contact_sound");
  let cur = CONTACT_REPLIES[CONTACT_REPLIES.length - 1], src = "", started = false, unlocking = false, cb = {}, guard = 0;
  labelEl.textContent = cur.label;

  function prepare(value) {
    cur = CONTACT_REPLIES.find((r) => r.test.test(value || "")) || cur;
    labelEl.textContent = cur.label;
    src = (window.STERCQ_VIDEOS || {})[cur.label] || baseSrc;
    if (src) {
      if (video.dataset.src !== src) { video.dataset.src = src; video.src = src; video.preload = "auto"; video.load(); }
    } else if (own && video.dataset.src) {
      video.removeAttribute("src"); delete video.dataset.src; video.load();
    }
  }
  function unlock() {
    if (!src) return;
    unlocking = true;
    video.muted = false;
    video.volume = 0;
    const p = video.play();
    if (p) p.then(() => { if (unlocking) { video.pause(); video.currentTime = 0; } video.volume = 1; unlocking = false; })
      .catch(() => { video.volume = 1; unlocking = false; });
  }
  function onStarted() {
    if (started) return;
    started = true;
    clearTimeout(guard);
    fig.classList.add("is--playing");
    cb.start?.();
  }
  function onEnded() {
    fig.classList.remove("is--playing");
    btn.textContent = "Nog een keer";
    btn.dataset.mode = "replay";
    btn.hidden = false;
    cb.end?.();
  }
  // Geen video (nog): de foto blijft staan, de klok stopt meteen
  function still() {
    if (own) video.hidden = true;
    bar.hidden = true;
    started = true;
    cb.start?.();
    cb.end?.();
  }
  function play(callbacks) {
    if (callbacks) cb = callbacks;
    stop();
    started = false;
    btn.hidden = true;
    barEl.style.transform = "scaleX(0)";
    if (!src) { still(); return; }
    if (own) video.hidden = false;
    bar.hidden = false;
    unlocking = false;
    video.currentTime = 0;
    video.muted = false;
    video.volume = 1;
    guard = setTimeout(() => { if (!started) { video.pause(); still(); } }, 2500);   // laadt niet: dan de foto
    const p = video.play();
    if (p) p.catch(() => {
      video.muted = true;
      video.play().then(() => { btn.textContent = "Geluid aan"; btn.dataset.mode = "sound"; btn.hidden = false; }).catch(() => {});
    });
  }
  function stop() {
    clearTimeout(guard);
    if (!video.paused) video.pause();
    fig.classList.remove("is--playing");
  }
  const onPlaying = () => { if (!unlocking) onStarted(); };
  const onTime = () => {
    if (unlocking || !started || !video.duration) return;
    barEl.style.transform = `scaleX(${video.currentTime / video.duration})`;
  };
  const onBtn = () => {
    if (btn.dataset.mode === "sound") { video.muted = false; btn.hidden = true; return; }
    play();
  };
  video.addEventListener("playing", onPlaying);
  video.addEventListener("timeupdate", onTime);
  video.addEventListener("ended", onEnded);
  btn.addEventListener("click", onBtn);
  function destroy() {
    stop();
    video.removeEventListener("playing", onPlaying);
    video.removeEventListener("timeupdate", onTime);
    video.removeEventListener("ended", onEnded);
    btn.removeEventListener("click", onBtn);
    ui.remove();
    if (own) video.remove();
    fig.classList.remove("contact_reply", "is--playing");
  }
  return { prepare, unlock, play, stop, destroy, fig };
}

// ==========================================================
// DROPPING CARD STACK
// [data-dropping-stack-init] op de wrapper; kaarten en controls via data-attributen.
// ==========================================================

let draggablePromise = null;

// Zelfde versie als de GSAP-core die Webflow laadt
function loadDraggable() {
  if (window.Draggable) return Promise.resolve(window.Draggable);
  if (draggablePromise) return draggablePromise;
  draggablePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://cdn.jsdelivr.net/npm/gsap@${gsap.version}/dist/Draggable.min.js`;
    script.onload = () => {
      gsap.registerPlugin(window.Draggable);
      resolve(window.Draggable);
    };
    script.onerror = () => {
      draggablePromise = null;
      reject();
    };
    document.head.appendChild(script);
  });
  return draggablePromise;
}

function initDroppingCardsStack(scope = document) {
  const stacks = [
    ...(scope.nodeType === 1 && scope.matches("[data-dropping-stack-init]") ? [scope] : []),
    ...scope.querySelectorAll("[data-dropping-stack-init]"),
  ];

  stacks.forEach((stackEl) => {
    if (stackEl._droppingStackDestroy) return;

    const list = stackEl.querySelector(".dropping-stack__list");
    if (!list) return;

    const originalCards = [...list.querySelectorAll("[data-dropping-stack-item]")];
    if (originalCards.length < 3) return;

    // Draggable laden we pas als er een stack op de pagina staat; daarna deze stack alsnog opzetten
    if (!window.Draggable) {
      loadDraggable()
        .then(() => { if (stackEl.isConnected && stackEl.offsetParent) initDroppingCardsStack(stackEl); })
        .catch(() => console.warn("Stercq: GSAP Draggable kon niet laden"));
      return;
    }

    const visibleCount = 4;
    const minTotalForLoop = 5;
    const duration = 0.75;
    const mainEase = "osmo";
    const dragThresholdPercent = 20;
    const originalStyles = new Map(originalCards.map((card) => [card, card.getAttribute("style")]));
    const generatedCards = [];
    const listeners = [];

    let cards = [...originalCards];
    const setsNeeded = Math.ceil(minTotalForLoop / cards.length);
    const clonesToAdd = (setsNeeded * cards.length) - cards.length;

    for (let i = 0; i < clonesToAdd; i++) {
      const clone = cards[i % originalCards.length].cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("data-dropping-stack-generated", "");
      clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      generatedCards.push(clone);
      list.appendChild(clone);
    }
    cards = [...list.querySelectorAll("[data-dropping-stack-item]")];

    const total = cards.length;
    let activeIndex = 0;
    let isAnimating = false;
    let dragCard = null;
    let draggableInstance = null;
    let limitX = 1;
    let limitY = 1;
    let offsetX = "0px";
    let offsetY = "0px";
    let isActive = true;

    const nextBtn = stackEl.querySelector("[data-dropping-stack-next]");
    const prevBtn = stackEl.querySelector("[data-dropping-stack-prev]");
    const collectionEl = stackEl.querySelector("[data-dropping-stack-collection]");
    const mod = (n, m) => ((n % m) + m) % m;
    const cardAt = (offset) => cards[mod(activeIndex + offset, total)];
    const getUnitValue = (value, depth) => {
      const amount = parseFloat(value) || 0;
      const unit = String(value).replace(/[0-9.-]/g, "") || "px";
      return (amount * depth) + unit;
    };

    function updateOffsetsFromPadding() {
      if (!collectionEl) return;
      const styles = getComputedStyle(collectionEl);
      const padRight = parseFloat(styles.paddingRight) || 0;
      const padLeft = parseFloat(styles.paddingLeft) || 0;
      const padBottom = parseFloat(styles.paddingBottom) || 0;
      const padTop = parseFloat(styles.paddingTop) || 0;
      const steps = Math.max(1, visibleCount - 1);
      const usePadX = Math.max(padRight, padLeft);
      const usePadY = Math.max(padBottom, padTop);
      const signX = padLeft > padRight ? -1 : 1;
      const signY = padTop > padBottom ? -1 : 1;
      offsetX = `${(usePadX / steps) * signX}px`;
      offsetY = `${(usePadY / steps) * signY}px`;
    }

    function updateDragLimits() {
      if (!dragCard) return;
      const rect = dragCard.getBoundingClientRect();
      limitX = rect.width || 1;
      limitY = rect.height || 1;
    }

    function applyState() {
      updateOffsetsFromPadding();

      cards.forEach((card) => {
        gsap.set(card, {
          opacity: 0,
          pointerEvents: "none",
          zIndex: 0,
          x: 0,
          y: 0,
          xPercent: 0,
          yPercent: 0,
        });
      });

      for (let depth = 0; depth < visibleCount; depth++) {
        const card = cardAt(depth);
        const xVal = getUnitValue(offsetX, depth);
        const yVal = getUnitValue(offsetY, depth);
        const state = {
          opacity: 1,
          zIndex: 999 - depth,
          pointerEvents: depth === 0 ? "auto" : "none",
        };

        if (offsetX.includes("%")) state.xPercent = parseFloat(xVal);
        else state.x = xVal;
        if (offsetY.includes("%")) state.yPercent = parseFloat(yVal);
        else state.y = yVal;
        gsap.set(card, state);
      }

      dragCard = cardAt(0);
      gsap.set(dragCard, { touchAction: "none" });
      updateDragLimits();

      draggableInstance?.kill();
      const magnetize = (raw, limit) => {
        const sign = Math.sign(raw) || 1;
        return sign * limit * Math.tanh(Math.abs(raw) / limit);
      };

      draggableInstance = Draggable.create(dragCard, {
        type: "x,y",
        inertia: false,
        onPress() {
          if (isAnimating) return;
          gsap.killTweensOf(dragCard);
          gsap.set(dragCard, { zIndex: 2000, opacity: 1 });
        },
        onDrag() {
          if (isAnimating) return;
          gsap.set(dragCard, {
            x: magnetize(this.x, limitX),
            y: magnetize(this.y, limitY),
            opacity: 1,
          });
        },
        onRelease() {
          if (isAnimating) return;
          const currentX = gsap.getProperty(dragCard, "x");
          const currentY = gsap.getProperty(dragCard, "y");
          const movedXPercent = Math.abs(currentX) / limitX * 100;
          const movedYPercent = Math.abs(currentY) / limitY * 100;
          const movedPercent = Math.max(movedXPercent, movedYPercent);

          if (movedPercent >= dragThresholdPercent) {
            animateNext(true, currentX, currentY);
            return;
          }

          gsap.to(dragCard, {
            x: 0,
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "elastic.out(1, 0.7)",
            onComplete: applyState,
          });
        },
      })[0];
    }

    function animateNext(fromDrag = false, releaseX = 0, releaseY = 0) {
      if (isAnimating) return;
      isAnimating = true;

      const outgoing = cardAt(0);
      const incomingBack = cardAt(visibleCount);
      const tl = gsap.timeline({
        defaults: { duration, ease: mainEase },
        onComplete() {
          activeIndex = mod(activeIndex + 1, total);
          applyState();
          isAnimating = false;
        },
      });

      gsap.set(outgoing, { zIndex: 2000, opacity: 1 });
      if (fromDrag) gsap.set(outgoing, { x: releaseX, y: releaseY });
      tl.to(outgoing, { yPercent: 200 }, 0);
      tl.to(outgoing, { opacity: 0, duration: duration * 0.2, ease: "none" }, duration * 0.4);

      for (let depth = 1; depth < visibleCount; depth++) {
        const xVal = getUnitValue(offsetX, depth - 1);
        const yVal = getUnitValue(offsetY, depth - 1);
        const move = { zIndex: 999 - (depth - 1) };
        if (offsetX.includes("%")) move.xPercent = parseFloat(xVal);
        else move.x = xVal;
        if (offsetY.includes("%")) move.yPercent = parseFloat(yVal);
        else move.y = yVal;
        tl.to(cardAt(depth), move, 0);
      }

      const backX = getUnitValue(offsetX, visibleCount);
      const backY = getUnitValue(offsetY, visibleCount);
      const startX = getUnitValue(offsetX, visibleCount - 1);
      const startY = getUnitValue(offsetY, visibleCount - 1);
      const incomingSet = { opacity: 0, zIndex: 999 - visibleCount };
      if (offsetX.includes("%")) incomingSet.xPercent = parseFloat(backX);
      else incomingSet.x = backX;
      if (offsetY.includes("%")) incomingSet.yPercent = parseFloat(backY);
      else incomingSet.y = backY;
      gsap.set(incomingBack, incomingSet);

      const incomingTo = { opacity: 1 };
      if (offsetX.includes("%")) incomingTo.xPercent = parseFloat(startX);
      else incomingTo.x = startX;
      if (offsetY.includes("%")) incomingTo.yPercent = parseFloat(startY);
      else incomingTo.y = startY;
      tl.to(incomingBack, incomingTo, 0);
    }

    function animatePrev() {
      if (isAnimating) return;
      isAnimating = true;

      const incomingTop = cardAt(-1);
      const leavingBack = cardAt(visibleCount - 1);
      const tl = gsap.timeline({
        defaults: { duration, ease: mainEase },
        onComplete() {
          activeIndex = mod(activeIndex - 1, total);
          applyState();
          isAnimating = false;
        },
      });

      gsap.set(leavingBack, { zIndex: 1 });
      gsap.set(incomingTop, { opacity: 0, x: 0, xPercent: 0, y: 0, yPercent: -200, zIndex: 2000 });
      tl.to(incomingTop, { yPercent: 0 }, 0);
      tl.to(incomingTop, { opacity: 1, duration: duration * 0.2, ease: "none" }, duration * 0.3);

      for (let depth = 0; depth < visibleCount - 1; depth++) {
        const xVal = getUnitValue(offsetX, depth + 1);
        const yVal = getUnitValue(offsetY, depth + 1);
        const move = { zIndex: 999 - (depth + 1) };
        if (offsetX.includes("%")) move.xPercent = parseFloat(xVal);
        else move.x = xVal;
        if (offsetY.includes("%")) move.yPercent = parseFloat(yVal);
        else move.y = yVal;
        tl.to(cardAt(depth), move, 0);
      }

      const backX = getUnitValue(offsetX, visibleCount);
      const backY = getUnitValue(offsetY, visibleCount);
      const hideBack = { opacity: 0 };
      if (offsetX.includes("%")) hideBack.xPercent = parseFloat(backX);
      else hideBack.x = backX;
      if (offsetY.includes("%")) hideBack.yPercent = parseFloat(backY);
      else hideBack.y = backY;
      tl.to(leavingBack, hideBack, 0);
    }

    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            isActive = entry.isIntersecting && entry.intersectionRatio >= 0.6;
          });
        }, { threshold: [0, 0.6, 1] })
      : null;
    observer?.observe(stackEl);

    const onKeyDown = (event) => {
      // Al afgehandeld (bv. een sticker die je met de pijltjes verschuift)
      if (event.defaultPrevented || !isActive || isAnimating) return;
      const target = event.target;
      const tag = target?.tagName?.toLowerCase() || "";
      if (["input", "textarea", "select"].includes(tag) || target?.isContentEditable) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        animateNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        animatePrev();
      }
    };

    const addListener = (element, type, handler) => {
      if (!element) return;
      element.addEventListener(type, handler);
      listeners.push(() => element.removeEventListener(type, handler));
    };
    const onResize = () => applyState();

    addListener(window, "keydown", onKeyDown);
    addListener(window, "resize", onResize);
    addListener(nextBtn, "click", () => animateNext());
    addListener(prevBtn, "click", animatePrev);
    applyState();

    stackEl._droppingStackDestroy = () => {
      observer?.disconnect();
      listeners.forEach((removeListener) => removeListener());
      draggableInstance?.kill();
      gsap.killTweensOf(cards);
      originalCards.forEach((card) => {
        const style = originalStyles.get(card);
        if (style == null) card.removeAttribute("style");
        else card.setAttribute("style", style);
      });
      generatedCards.forEach((card) => card.remove());
      stackEl._droppingStackDestroy = null;
    };
  });
}

function destroyDroppingCardsStack(scope = document) {
  const stacks = [
    ...(scope.nodeType === 1 && scope.matches("[data-dropping-stack-init]") ? [scope] : []),
    ...scope.querySelectorAll("[data-dropping-stack-init]"),
  ];
  stacks.forEach((stackEl) => stackEl._droppingStackDestroy?.());
}

// ==========================================================
// STACKED CARDS SLIDER
// [data-stacked-cards] wrapper, [data-stacked-cards-list] list,
// [data-stacked-cards-item] items, [data-stacked-cards-card] draggable card.
// ==========================================================

function initStackedCardsSlider(scope = document) {
  const sliders = [
    ...(scope.nodeType === 1 && scope.matches("[data-stacked-cards]") ? [scope] : []),
    ...scope.querySelectorAll("[data-stacked-cards]"),
  ];

  sliders.forEach((container) => {
    if (container._stackedCardsDestroy) return;
    const list = container.querySelector("[data-stacked-cards-list]");
    if (!list) return;

    const initialItems = [...list.querySelectorAll(":scope > [data-stacked-cards-item]")];
    if (initialItems.length < 3) {
      console.warn("Stercq: stacked cards requires at least 3 items", list);
      return;
    }
    if (!window.Draggable) {
      loadDraggable()
        .then(() => { if (container.isConnected) initStackedCardsSlider(container); })
        .catch(() => console.warn("Stercq: GSAP Draggable kon niet laden"));
      return;
    }

    const itemStyles = new Map(initialItems.map((item) => [item, item.getAttribute("style")]));
    const listeners = [];
    let activeDeg = 4;
    let inactiveDeg = -4;
    let dragFirst = null;
    let dragSecond = null;
    let firstItem, secondItem, firstCard, secondCard;
    let full = 1;
    let threshold = 1;
    let destroyed = false;
    const easeBeforeRelease = { duration: 0.2, ease: "power2.out" };
    const easeAfterRelease = { duration: 1, ease: "elastic.out(1,0.75)" };

    const getItems = () => [...list.querySelectorAll(":scope > [data-stacked-cards-item]")];

    function restack() {
      const items = getItems();
      items.forEach((item) => item.classList.remove("is--active", "is--second"));
      items.forEach((item, index) => {
        item.style.zIndex = index < 3 ? String(3 - index) : "0";
        item.style.transform = `rotate(${index === 0 || index === 2 ? activeDeg : inactiveDeg}deg)`;
        item.style.pointerEvents = index === 0 ? "auto" : "none";
      });
      items[0]?.classList.add("is--active");
      items[1]?.classList.add("is--second");
    }

    function setupDraggables() {
      if (destroyed) return;
      restack();
      const items = getItems();
      firstItem = items[0];
      secondItem = items[1];
      firstCard = firstItem?.querySelector("[data-stacked-cards-card], .stack-cards__card, .stack-cards__card-image");
      secondCard = secondItem?.querySelector("[data-stacked-cards-card], .stack-cards__card, .stack-cards__card-image");
      if (!firstCard || !secondCard) return;

      const width = firstCard.getBoundingClientRect().width;
      full = Math.max(1, width * 1.15);
      threshold = width * 0.1;
      dragFirst?.kill();
      dragSecond?.kill();

      dragFirst = Draggable.create(firstCard, {
        type: "x",
        onPress() { firstCard.classList.add("is--dragging"); },
        onRelease() { firstCard.classList.remove("is--dragging"); },
        onDrag() {
          let x = this.x;
          if (Math.abs(x) > full) x = Math.sign(x) * (full + (Math.abs(x) - full) * 0.1);
          gsap.set(firstCard, { x, rotation: 0 });
        },
        onDragEnd() {
          const x = this.x;
          const direction = x > 0 ? "right" : "left";
          this.disable();
          dragSecond?.enable();
          firstItem.style.pointerEvents = "none";
          secondItem.style.pointerEvents = "auto";
          if (Math.abs(x) <= threshold) {
            gsap.to(firstCard, { x: 0, rotation: 0, ...easeBeforeRelease, onComplete: resetCycle });
          } else {
            flick(direction, Math.abs(x) > full, x);
          }
        },
      })[0];

      dragSecond = Draggable.create(secondCard, {
        type: "x",
        onPress() { secondCard.classList.add("is--dragging"); },
        onRelease() { secondCard.classList.remove("is--dragging"); },
        onDrag() {
          let x = this.x;
          if (Math.abs(x) > full) x = Math.sign(x) * (full + (Math.abs(x) - full) * 0.2);
          gsap.set(secondCard, { x, rotation: 0 });
        },
        onDragEnd() { gsap.to(secondCard, { x: 0, rotation: 0, ...easeBeforeRelease }); },
      })[0];
      dragFirst.enable();
      dragSecond.disable();
    }

    function flick(direction, skipHome = false, releaseX = 0) {
      if (direction !== "left" && direction !== "right") direction = activeDeg > 0 ? "right" : "left";
      dragFirst?.disable();
      const item = getItems()[0];
      const card = item?.querySelector("[data-stacked-cards-card], .stack-cards__card, .stack-cards__card-image");
      if (!item || !card) return;
      const exitX = direction === "right" ? full : -full;

      const advance = () => {
        gsap.set(card, { x: 0, rotation: 0 });
        list.appendChild(item);
        [activeDeg, inactiveDeg] = [inactiveDeg, activeDeg];
      };

      if (skipHome) {
        const visualX = gsap.getProperty(card, "x");
        advance();
        restack();
        gsap.fromTo(card, { x: visualX, rotation: 0 }, { x: 0, rotation: 0, ...easeAfterRelease, onComplete: resetCycle });
      } else {
        gsap.fromTo(card, { x: releaseX, rotation: 0 }, {
          x: exitX,
          ...easeBeforeRelease,
          onComplete() {
            advance();
            const newCard = item.querySelector("[data-stacked-cards-card], .stack-cards__card, .stack-cards__card-image");
            resetCycle();
            if (newCard) gsap.fromTo(newCard, { x: exitX }, { x: 0, ...easeAfterRelease, onComplete: resetCycle });
          },
        });
      }
    }

    function resetCycle() {
      if (destroyed) return;
      list.querySelectorAll("[data-stacked-cards-card].is--dragging, .stack-cards__card.is--dragging, .stack-cards__card-image.is--dragging").forEach((card) => card.classList.remove("is--dragging"));
      setupDraggables();
    }

    const nextButtons = container.querySelectorAll('[data-stacked-cards-control="next"]');
    nextButtons.forEach((button) => {
      const handler = (event) => {
        event.preventDefault();
        flick();
      };
      button.addEventListener("click", handler);
      listeners.push(() => button.removeEventListener("click", handler));
    });

    setupDraggables();
    container._stackedCardsDestroy = () => {
      destroyed = true;
      listeners.forEach((remove) => remove());
      dragFirst?.kill();
      dragSecond?.kill();
      gsap.killTweensOf(initialItems.flatMap((item) => [
        item,
        ...item.querySelectorAll("[data-stacked-cards-card], .stack-cards__card, .stack-cards__card-image"),
      ]));
      initialItems.forEach((item) => {
        const style = itemStyles.get(item);
        if (style == null) item.removeAttribute("style");
        else item.setAttribute("style", style);
        item.classList.remove("is--active", "is--second");
        const card = item.querySelector("[data-stacked-cards-card], .stack-cards__card, .stack-cards__card-image");
        if (card) gsap.set(card, { clearProps: "transform" });
      });
      container._stackedCardsDestroy = null;
    };
  });
}

function destroyStackedCardsSlider(scope = document) {
  const sliders = [
    ...(scope.nodeType === 1 && scope.matches("[data-stacked-cards]") ? [scope] : []),
    ...scope.querySelectorAll("[data-stacked-cards]"),
  ];
  sliders.forEach((container) => container._stackedCardsDestroy?.());
}

// ==========================================================
// REVIEWS — om de beurt praten
// Elke ballon plopt vanuit zijn staartje open als hij in beeld komt en de vorige krimpt iets
// terug, alsof ze tegen elkaar in praten. Terugscrollen draait het om.
// Wrapper: [data-review-talk] of .review_wrapper. Ballonnen: [data-review-talk-item] of .review.
// Een gespiegelde ballon (.mirrored erin, of data-review-talk-item="right") heeft zijn staartje links.
// De zigzag (links/rechts) zit in de opmaak in Webflow, niet hier.
// ==========================================================

function initReviewTalk(scope = document) {
  scope.querySelectorAll("[data-review-talk], .review_wrapper").forEach((wrap) => {
    if (wrap._reviewTalkDestroy) return;
    const items = [...wrap.querySelectorAll(":scope > [data-review-talk-item], :scope > .review")];
    if (items.length < 2) return;

    // Stickers niet neerleggen waar een ballon openklapt
    items.forEach((item) => item.setAttribute("data-sticker-block", ""));
    const cleanup = () => items.forEach((item) => item.removeAttribute("data-sticker-block"));
    if (reducedMotion) {
      wrap._reviewTalkDestroy = () => { cleanup(); wrap._reviewTalkDestroy = null; };
      return;
    }

    const inners = items.map((item) => item.querySelector(".review_inner") || item.firstElementChild);
    // 1 = staartje rechtsonder (gewone ballon), -1 = linksonder (gespiegeld)
    const sides = items.map((item) => (item.getAttribute("data-review-talk-item") === "right" || item.querySelector(".mirrored") ? -1 : 1));
    items.forEach((item, i) => gsap.set(item, { transformOrigin: sides[i] === 1 ? "80% 100%" : "20% 100%", scale: 0.2, rotation: sides[i] * -10, autoAlpha: 0 }));
    gsap.set(inners, { autoAlpha: 0 });

    let active = -1;
    const setActive = (index) => {
      if (index === active) return;
      const previous = active;
      active = index;
      items.forEach((item, i) => {
        const side = sides[i];
        if (i > index) {
          // Nog niet aan de beurt (of teruggescrold): klapt dicht naar zijn staartje
          gsap.to(item, { scale: 0.2, rotation: side * -10, autoAlpha: 0, duration: 0.25, ease: "power2.in", overwrite: "auto" });
          gsap.to(inners[i], { autoAlpha: 0, duration: 0.15, overwrite: "auto" });
        } else if (i === index && i > previous) {
          // Nieuwe beurt: plopt open, daarna de tekst
          gsap.to(item, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.6, ease: "back.out(2)", overwrite: "auto" });
          gsap.fromTo(inners[i], { y: 14, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: 0.35, delay: 0.15, ease: "power3.out", overwrite: "auto" });
        } else if (i === index) {
          // Weer aan de beurt na terugscrollen: komt naar voren
          gsap.to(item, { scale: 1, rotation: 0, autoAlpha: 1, duration: 0.45, ease: "back.out(1.6)", overwrite: "auto" });
          gsap.to(inners[i], { y: 0, autoAlpha: 1, duration: 0.25, overwrite: "auto" });
        } else {
          // Heeft al gepraat: krimpt iets terug en leunt naar zijn kant
          gsap.to(item, { scale: 0.9, rotation: side * 2, autoAlpha: 1, duration: 0.5, ease: "power3.out", overwrite: "auto" });
          gsap.to(inners[i], { y: 0, autoAlpha: 1, duration: 0.25, overwrite: "auto" });
        }
      });
    };

    // Meten op de wrapper plus de layoutpositie van de ballon (offsetTop telt geen transforms mee).
    // Op de ballon zelf meten gaat mis: die is dichtgeklapt tot 20% en dan ploppen ze veel te laat.
    const offsetIn = (el) => {
      if (el.offsetParent === wrap) return el.offsetTop;
      if (el.offsetParent === wrap.offsetParent) return el.offsetTop - wrap.offsetTop;
      return gsap.getProperty(el, "scale") === 1 ? el.getBoundingClientRect().top - wrap.getBoundingClientRect().top : 0;
    };
    const triggers = items.map((item, i) => ScrollTrigger.create({
      trigger: wrap,
      start: () => `top+=${Math.round(offsetIn(item))} 72%`,
      onEnter: () => setActive(Math.max(active, i)),
      onLeaveBack: () => setActive(i - 1),
    }));
    // Al voorbij gescrold bij het laden (terugknop, herladen halverwege): meteen goed zetten
    const sync = requestAnimationFrame(() => {
      const passed = triggers.reduce((last, trigger, i) => (trigger.scroll() >= trigger.start ? i : last), -1);
      if (passed !== active) setActive(passed);
    });

    wrap._reviewTalkDestroy = () => {
      cancelAnimationFrame(sync);
      triggers.forEach((trigger) => trigger.kill());
      gsap.killTweensOf([...items, ...inners]);
      gsap.set(items, { clearProps: "transform,transformOrigin,opacity,visibility" });
      gsap.set(inners, { clearProps: "transform,opacity,visibility" });
      cleanup();
      wrap._reviewTalkDestroy = null;
    };
  });
}

function destroyReviewTalk(scope = document) {
  scope.querySelectorAll("[data-review-talk], .review_wrapper").forEach((wrap) => wrap._reviewTalkDestroy?.());
}

// ==========================================================
// OGEN — levende ogen: kijken naar je cursor, knipperen, en schrikken (WAAA!) als je ze oppakt.
// In een stickerzone wordt de ogen-sticker uit je CMS vanzelf levend: herkend aan "ogen" in de
// bestandsnaam of alt, of zet data-sticker-kind="ogen" op dat item.
// Zelf plaatsen: een lege div met data-eyes. data-eyes="controlled": volgt de muis niet,
// je stuurt hem zelf aan via el._eyes.lookAt(x, y) / lookAtEl(el) / lookAtYou().
// Buiten beeld rekenen ze niet.
// ==========================================================

// De definitieve ogen-sticker in lagen: crème rand, per pupil een crème randje, oogwit + inktlijn, pupillen
const EYE = {"rim":["M28.03,99.41c-6.63,0-12.66-2.91-17-8.2-.04-.05-.08-.1-.11-.14C2.61,80.16.65,64.22,5.08,43.69c0-.03.05-.22.05-.22,1.74-7.12,5.07-17.35,11.14-25.88,6.55-9.21,14.97-14.33,24.36-14.81.07,0,.15,0,.22,0h.18c16.57,0,26.92,16.26,28.28,31.6,1.38,11.71-1.48,26.07-7.66,38.44-7.13,14.27-17.48,23.56-29.14,26.16-.06.01-.12.03-.18.04-1.44.27-2.89.4-4.31.4h0Z","M28.03,102.19h0c-7.48,0-14.28-3.27-19.15-9.21-.06-.08-.12-.15-.18-.22C-.11,81.17-2.24,64.46,2.37,43.1l.06-.27c1.8-7.36,5.26-17.97,11.58-26.85C21.07,6.06,30.23.54,40.49.01c.12,0,.23,0,.35-.01h.19c18.21,0,29.58,17.56,31.05,34.09,1.43,12.22-1.53,27.16-7.94,39.97-7.51,15.03-18.53,24.84-31.02,27.63-.1.02-.19.04-.28.06-1.61.3-3.23.45-4.81.45ZM28.03,96.64h0c1.25,0,2.53-.12,3.8-.35l.09-.02c10.81-2.42,20.49-11.18,27.24-24.69,5.95-11.9,8.71-25.68,7.39-36.87v-.08c-1.25-14.09-10.61-29.06-25.52-29.06h-.27c-8.5.44-16.19,5.16-22.23,13.65-5.81,8.17-9.03,18.06-10.71,24.93l-.04.16c-4.25,19.69-2.46,34.87,5.33,45.1l.05.07c3.79,4.63,9.07,7.18,14.85,7.18Z","M69.57,101.64c-6.63,0-12.66-2.91-17-8.2-.04-.05-.08-.1-.11-.14-8.3-10.91-10.26-26.86-5.83-47.39,0-.03.06-.24.06-.26,1.73-7.08,5.06-17.31,11.13-25.84,6.55-9.21,14.97-14.33,24.36-14.81.07,0,.15,0,.22,0h.18c16.57,0,26.92,16.26,28.28,31.6,1.38,11.71-1.48,26.07-7.66,38.44-7.13,14.27-17.48,23.56-29.14,26.16-.06.01-.12.03-.18.04-1.44.27-2.89.4-4.31.4h0Z","M69.57,104.41h0c-7.48,0-14.28-3.27-19.15-9.21-.06-.08-.12-.15-.18-.22-8.82-11.59-10.95-28.29-6.34-49.66l.07-.32c1.79-7.33,5.25-17.92,11.57-26.8,7.06-9.92,16.22-15.44,26.48-15.97.12,0,.23,0,.35-.01h.19c18.2,0,29.58,17.56,31.05,34.09,1.43,12.22-1.53,27.16-7.94,39.97-7.51,15.03-18.53,24.84-31.02,27.63-.1.02-.19.04-.29.06-1.6.3-3.22.45-4.81.45ZM69.57,98.86h0c1.25,0,2.53-.12,3.8-.35l.09-.02c10.81-2.42,20.49-11.18,27.25-24.69,5.95-11.9,8.71-25.68,7.39-36.87v-.08c-1.25-14.09-10.61-29.06-25.52-29.06h-.27c-8.5.44-16.19,5.16-22.23,13.65-5.81,8.17-9.03,18.04-10.7,24.89l-.05.21c-4.25,19.68-2.46,34.86,5.33,45.09l.05.07c3.79,4.63,9.07,7.18,14.85,7.18Z"],"prim":[["M16.64,77.96c-.67,0-1.33-.06-1.97-.17-3.46-.61-6.57-2.84-9-6.45-3.88-5.76-5.42-14.03-3.92-21.07,1.93-9.08,8.92-18.74,18.08-18.74.29,0,.59.01.89.03,4.44.3,8.58,2.9,11.65,7.32,2.41,3.46,4.02,7.82,4.43,11.95.68,7-2.06,14.64-7.32,20.43-3.92,4.32-8.48,6.7-12.83,6.7h0Z","M16.64,78.21h0c-.68,0-1.36-.06-2.02-.18-3.53-.63-6.7-2.89-9.17-6.56C1.54,65.66-.02,57.32,1.49,50.21c2.02-9.47,9.52-19.56,19.23-18.9,4.52.31,8.72,2.95,11.84,7.43,2.44,3.5,4.06,7.9,4.47,12.07.69,7.07-2.07,14.78-7.38,20.63-3.97,4.37-8.59,6.78-13.01,6.78ZM19.82,31.78c-9.02,0-15.92,9.55-17.83,18.54-1.48,6.98.04,15.18,3.88,20.88,2.39,3.55,5.45,5.74,8.84,6.34.63.11,1.28.17,1.93.17h0c4.28,0,8.77-2.35,12.64-6.62,5.21-5.74,7.92-13.31,7.25-20.24-.4-4.09-1.99-8.4-4.38-11.83-3.03-4.35-7.1-6.91-11.46-7.21-.29-.02-.58-.03-.87-.03Z"],["M59.8,77.96c-.67,0-1.33-.06-1.97-.17-3.46-.61-6.57-2.84-9-6.45-3.88-5.76-5.42-14.03-3.92-21.07,1.93-9.08,8.92-18.74,18.08-18.74.29,0,.59.01.89.03,4.44.3,8.58,2.9,11.65,7.32,2.41,3.46,4.02,7.82,4.43,11.95.68,7-2.06,14.64-7.32,20.43-3.92,4.32-8.48,6.7-12.83,6.7h0Z","M59.81,78.21h0c-.68,0-1.36-.06-2.02-.18-3.53-.63-6.7-2.89-9.17-6.56-3.92-5.81-5.47-14.16-3.96-21.27,2.01-9.47,9.53-19.56,19.23-18.9,4.52.31,8.72,2.95,11.84,7.43,2.44,3.5,4.06,7.9,4.47,12.07.69,7.07-2.07,14.78-7.38,20.63-3.97,4.37-8.59,6.78-13.01,6.78ZM62.98,31.78c-9.02,0-15.92,9.55-17.83,18.54-1.48,6.98.04,15.18,3.88,20.88,2.39,3.55,5.45,5.74,8.84,6.34.63.11,1.28.17,1.93.17h0c4.28,0,8.77-2.35,12.64-6.62,5.21-5.74,7.92-13.31,7.25-20.24-.4-4.09-1.99-8.4-4.38-11.83-3.03-4.35-7.1-6.91-11.46-7.21-.29-.02-.58-.03-.87-.03Z"]],"white":["M10.02,45.87c-3.23,14.96-3.8,31.81,4.91,43.26,4.18,5.1,10.12,7.2,16.48,6.03,22.21-4.96,35.42-37.96,32.87-59.15-1.09-12.7-9.51-27.17-23.4-27.06-17.48.9-26.9,20.68-30.84,36.8l-.03.12Z","M51.57,48.09c-3.23,14.96-3.8,31.81,4.91,43.26,4.18,5.1,10.12,7.2,16.48,6.03,22.21-4.96,35.42-37.96,32.87-59.15-1.09-12.7-9.51-27.17-23.4-27.06-17.48.9-26.9,20.68-30.84,36.8l-.03.12Z"],"line":["M28.05,98.25c-5.92,0-11.34-2.58-15.26-7.36l-.06-.08c-7.88-10.36-9.7-25.68-5.42-45.53l.04-.17c1.69-6.91,4.92-16.85,10.78-25.09,6.22-8.74,13.83-13.4,22.62-13.85h.12c.06,0,.11,0,.17,0,7.22,0,13.63,3.39,18.55,9.82,4.12,5.37,6.83,12.56,7.46,19.74,1.34,11.29-1.43,25.19-7.43,37.19-6.82,13.64-16.62,22.51-27.6,24.96l-.1.02c-1.31.24-2.6.36-3.88.36ZM17.12,87.4c3.48,4.22,8.36,6.01,13.75,5.03,9.29-2.1,17.74-9.91,23.79-22.01,5.46-10.91,8.09-23.98,6.88-34.09v-.09c-.54-6.16-2.85-12.31-6.35-16.88-2.68-3.49-7.3-7.64-14.14-7.64h-.06c-6.98.38-13.14,4.26-18.32,11.52-5.35,7.52-8.34,16.74-9.91,23.16l-.02.07c-2.69,12.49-4.11,29.72,4.38,40.93Z","M69.59,100.47c-5.92,0-11.34-2.58-15.26-7.36l-.06-.08c-7.88-10.36-9.7-25.68-5.42-45.53l.04-.17c1.69-6.91,4.92-16.85,10.78-25.09,6.22-8.74,13.83-13.4,22.62-13.85h.12c.06,0,.11,0,.17,0,7.22,0,13.63,3.39,18.55,9.82,4.12,5.37,6.83,12.56,7.46,19.74,1.34,11.29-1.43,25.19-7.43,37.19-6.82,13.64-16.62,22.51-27.6,24.96l-.1.02c-1.31.24-2.6.36-3.88.36ZM58.67,89.62c3.48,4.22,8.36,6.01,13.75,5.03,9.29-2.1,17.74-9.91,23.79-22.01,5.46-10.91,8.09-23.98,6.88-34.09v-.09c-.54-6.16-2.85-12.31-6.35-16.88-2.68-3.49-7.3-7.64-14.14-7.64h-.07c-6.98.38-13.14,4.26-18.32,11.52-5.35,7.52-8.34,16.74-9.91,23.16l-.02.07c-2.69,12.49-4.11,29.72,4.38,40.93Z"],"pupil":["M6.68,52.42c-1.93,9.08,2.57,20.38,8.86,21.5,7.14,1.27,17.28-10.46,16.21-21.5-.61-6.28-5.04-14.28-11.4-14.72-6.89-.47-12.29,8.2-13.68,14.72Z","M49.85,52.42c-1.93,9.08,2.57,20.38,8.86,21.5,7.14,1.27,17.28-10.46,16.21-21.5-.61-6.28-5.04-14.28-11.4-14.72-6.89-.47-12.29,8.2-13.68,14.72Z"]};
const EYE_W = 113.98;
const EYE_H = 104.41;
const SVG_NS = "http://www.w3.org/2000/svg";

function eyesSVG() {
  const P = (d, cls, fill) => `<path class="${cls}" d="${d}" fill="${fill}"/>`;
  return `<svg class="eyes-svg" viewBox="0 0 ${EYE_W} ${EYE_H}" aria-hidden="true" focusable="false">`
    + `<g>${EYE.rim.map((d) => P(d, "rim", "#eeeae1")).join("")}</g>`
    + EYE.prim.map((ds) => `<g class="prim">${ds.map((d) => P(d, "rim", "#eeeae1")).join("")}</g>`).join("")
    // Het rechteroog ligt over het linker, dus de linkerpupil schuift eronder door
    + [0, 1].map((i) => `<g class="eye"><g class="white">${P(EYE.white[i], "wh", "#fff")}</g>${P(EYE.line[i], "ink", "#1d1d1b")}</g>`
      + `<g class="pupil">${P(EYE.pupil[i], "ink", "#1d1d1b")}</g>`).join("")
    + `</svg>`;
}

function isEyesSource(img) {
  return !!img && (img.closest?.('[data-sticker-kind="ogen"]') || /ogen/i.test(`${img.getAttribute?.("src") || ""} ${img.getAttribute?.("alt") || ""}`));
}

const eyesFollowers = new Set();
let eyesPointer = null;
let eyesRaf = 0;
const eyesIO = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => entries.forEach((entry) => {
      const eyes = entry.target._eyes;
      if (eyes) eyes.visible = entry.isIntersecting;
    }))
  : null;

let eyesFromScroll = false;
function eyesUpdate() {
  eyesRaf = 0;
  if (!eyesPointer) return;
  const cached = eyesFromScroll;
  eyesFromScroll = false;
  eyesFollowers.forEach((eyes) => { if (eyes.visible) eyes.lookAt(eyesPointer.x, eyesPointer.y, cached); });
}
function eyesSchedule() {
  if (!eyesRaf && eyesFollowers.size) eyesRaf = requestAnimationFrame(eyesUpdate);
}
window.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;
  eyesPointer = { x: event.clientX, y: event.clientY };
  eyesFromScroll = false;
  eyesSchedule();
}, { passive: true });
// Scrollt de pagina onder een stilstaande muis door, dan blijven ze je volgen.
// Dan rekenen we met de laatst gemeten positie plus de scroll, zonder layout op te vragen.
window.addEventListener("scroll", () => {
  if (!eyesRaf) eyesFromScroll = true;
  eyesSchedule();
}, { passive: true });

class Eyes {
  constructor(svg, host, { follow = true } = {}) {
    this.svg = svg;
    this.host = host;
    this.eyes = [...svg.querySelectorAll(".eye")];
    this.pupils = [...svg.querySelectorAll(".pupil")];
    this.prims = [...svg.querySelectorAll(".prim")];
    this.held = false;
    this.visible = !eyesIO;
    // Pupil en zijn randje bewegen samen
    const both = (i) => [this.pupils[i], this.prims[i]].filter(Boolean);
    this.qx = this.pupils.map((p, i) => gsap.quickTo(both(i), "x", { duration: 0.5, ease: "power3.out" }));
    this.qy = this.pupils.map((p, i) => gsap.quickTo(both(i), "y", { duration: 0.5, ease: "power3.out" }));
    svg._eyes = this;
    eyesIO?.observe(svg);
    if (follow) {
      eyesFollowers.add(this);
      this.blinkLoop();
    }
  }

  parts(i) { return [this.eyes[i], this.pupils[i], this.prims[i]].filter(Boolean); }
  get all() { return [...this.eyes, ...this.pupils, ...this.prims]; }

  // Oogwit, pupil en randje van één oog knijpen samen rond hetzelfde punt
  squash(vars, fy) {
    this.eyes.forEach((eye, i) => {
      const w = eye.querySelector(".white").getBBox();
      gsap.to(this.parts(i), { ...vars, svgOrigin: `${w.x + w.width / 2} ${w.y + w.height * fy}` });
    });
  }

  // Maten pas meten als de ogen zichtbaar zijn (in een verborgen element is alles 0)
  get geo() {
    if (this._geo) return this._geo;
    const g = this.eyes.map((eye, i) => {
      const w = eye.querySelector(".white").getBBox();
      const p = this.pupils[i].getBBox();
      const cx = w.x + w.width / 2;
      const cy = w.y + w.height / 2;
      return { cx, cy, dx: p.x + p.width / 2 - cx, dy: p.y + p.height / 2 - cy, rx: Math.max(4, (w.width - p.width) / 2 - 1), ry: Math.max(6, (w.height - p.height) / 2 - 3) };
    });
    if (g[0] && g[0].rx > 4) this._geo = g;
    return g;
  }

  // In de eigen coördinaten van de SVG, zodat het ook klopt als de sticker scheef of op zijn kop ligt.
  // cached: alleen gescrold, dus de vorige meting plus de scrollafstand gebruiken
  lookAt(px, py, cached = false) {
    if (this.held) return;
    let dy = 0;
    if (cached && this.inv) {
      dy = window.scrollY - this.invScroll;
    } else {
      const m = this.svg.getScreenCTM();
      // Nog niet zichtbaar of op schaal 0 (net aan het ploppen): niets te meten
      if (!m || Math.abs(m.a * m.d - m.b * m.c) < 1e-6) return;
      this.inv = m.inverse();
      this.invScroll = window.scrollY;
    }
    const p = new DOMPoint(px, py + dy).matrixTransform(this.inv);
    this.geo.forEach((g, i) => {
      const dx = p.x - g.cx;
      const dy = p.y - g.cy;
      const a = Math.atan2(dy, dx);
      const k = Math.min(1, Math.hypot(dx, dy) / 70);
      this.qx[i](Math.cos(a) * g.rx * k - g.dx);
      this.qy[i](Math.sin(a) * g.ry * k - g.dy);
    });
  }
  lookAtEl(el, fx = 0.5, fy = 0.5) {
    const r = el.getBoundingClientRect();
    this.lookAt(r.left + r.width * fx, r.top + r.height * fy);
  }
  lookAtYou() {
    if (this.held) return;
    this.geo.forEach((g, i) => { this.qx[i](-g.dx); this.qy[i](2 - g.dy); });
  }

  blink() {
    if (reducedMotion || this.held || !this.visible) return;
    this.squash({ scaleY: 0.1, duration: 0.07, ease: "power2.in", yoyo: true, repeat: 1, overwrite: "auto" }, 0.55);
  }
  blinkLoop() {
    const go = () => { this.blink(); this.timer = gsap.delayedCall(rnd(2.6, 6), go); };
    this.timer = gsap.delayedCall(rnd(1.4, 3.5), go);
  }

  // Eén extra laag om elke pupil, voor het heen en weer schieten
  get darts() {
    if (!this._darts) this._darts = this.pupils.map((p) => {
      const d = document.createElementNS(SVG_NS, "g");
      d.setAttribute("class", "dart");
      while (p.firstChild) d.appendChild(p.firstChild);
      p.appendChild(d);
      return d;
    });
    return this._darts;
  }

  // Oppakken: ogen springen open, pupillen krimpen en schieten heen en weer, de gil groeit zolang je vasthoudt
  shock() {
    if (this.held || reducedMotion) return;
    const D = this.darts;
    this.lookAtYou();
    this.held = true;
    this.calmCall?.kill();
    gsap.killTweensOf(this.all, "scaleX,scaleY");
    gsap.set(this.all, { scaleX: 1, scaleY: 1 });
    this.squash({ scaleX: 1.12, scaleY: 1.26, duration: 0.22, ease: "back.out(3.5)" }, 0.62);
    gsap.to(D, { scale: 0.48, transformOrigin: "50% 50%", duration: 0.18, ease: "back.out(3)" });
    const dart = () => {
      const ax = rnd(-6, 6);
      const ay = rnd(-7, 7);
      D.forEach((d) => gsap.to(d, { x: ax + rnd(-1.5, 1.5), y: ay + rnd(-1.5, 1.5), duration: 0.07, ease: "power2.out", overwrite: "auto" }));
      this.dartCall = gsap.delayedCall(rnd(0.08, 0.17), dart);
    };
    dart();
    this.shake = gsap.fromTo(this.svg, { x: -1.2, y: 0.6 }, { x: 1.2, y: -0.6, duration: 0.045, repeat: -1, yoyo: true, ease: "none" });

    let b = this.host.querySelector(":scope > .waaa");
    if (!b) {
      b = document.createElement("span");
      b.className = "waaa";
      b.setAttribute("aria-hidden", "true");
      this.host.appendChild(b);
    }
    let n = 3;
    b.textContent = "WAAA!";
    b.style.fontSize = `${Math.min(34, Math.max(14, this.host.offsetWidth * 0.22))}px`;
    gsap.killTweensOf(b);
    gsap.fromTo(b, { scale: 0, rotation: -26, autoAlpha: 1 }, { scale: 1, rotation: -7, duration: 0.42, ease: "back.out(3)" });
    clearInterval(this.waaaTimer);
    this.waaaTimer = setInterval(() => { if (n < 10) b.textContent = `W${"A".repeat(++n)}!`; }, 110);
  }

  // Loslaten: pupillen terug, ballon popt weg, twee keer knipperen en weer meekijken
  calm() {
    if (!this.held) return;
    this.dartCall?.kill();
    this.shake?.kill();
    clearInterval(this.waaaTimer);
    gsap.to(this.svg, { x: 0, y: 0, duration: 0.2 });
    gsap.to(this.darts, { x: 0, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)", overwrite: "auto" });
    this.squash({ scaleX: 1, scaleY: 1, duration: 0.6, ease: "elastic.out(1, 0.45)" }, 0.62);
    const b = this.host.querySelector(":scope > .waaa");
    if (b) gsap.to(b, { scale: 0, rotation: 8, duration: 0.2, ease: "back.in(2)", delay: 0.06, onComplete: () => gsap.set(b, { autoAlpha: 0 }) });
    this.calmCall = gsap.delayedCall(0.6, () => {
      this.held = false;
      this.blink();
      gsap.delayedCall(0.24, () => this.blink());
      if (eyesPointer) this.lookAt(eyesPointer.x, eyesPointer.y);
    });
  }

  // Weggeslagen in een zwaartekrachtzone: kort schrikken
  startle() {
    if (this.held) return;
    this.shock();
    this.startleCall = gsap.delayedCall(0.7, () => this.calm());
  }

  destroy() {
    this.timer?.kill();
    this.dartCall?.kill();
    this.calmCall?.kill();
    this.startleCall?.kill();
    this.shake?.kill();
    clearInterval(this.waaaTimer);
    gsap.killTweensOf([...this.all, ...(this._darts || []), this.svg]);
    eyesFollowers.delete(this);
    eyesIO?.unobserve(this.svg);
    this.svg._eyes = null;
  }
}

// Losse ogen die je zelf in Webflow plaatst: <div data-eyes></div>
function initEyes(scope = document) {
  scope.querySelectorAll("[data-eyes]").forEach((slot) => {
    if (slot._eyes) return;
    // Een afbeelding met data-eyes (zoals in Webflow neergezet) kan geen SVG bevatten: vervang hem door een div
    if (slot.tagName === "IMG") {
      const div = document.createElement("div");
      [...slot.attributes].forEach((a) => { if (!/^(src|srcset|sizes|loading|alt|width|height|decoding)$/.test(a.name)) div.setAttribute(a.name, a.value); });
      div.setAttribute("aria-hidden", "true");
      div.style.width = "100%";
      slot.replaceWith(div);
      slot = div;
    }
    if (!slot.querySelector(".eyes-svg")) slot.innerHTML = eyesSVG();
    slot._eyes = new Eyes(slot.querySelector(".eyes-svg"), slot, { follow: slot.dataset.eyes !== "controlled" });
  });
}

function destroyEyes(scope = document) {
  scope.querySelectorAll("[data-eyes]").forEach((slot) => {
    slot._eyes?.destroy();
    slot._eyes = null;
  });
}

// Inhoud van een sticker: een <img>, of levende ogen als het de ogen-sticker is
async function createStickerFace(source) {
  if (source.eyes) {
    const face = document.createElement("div");
    face.className = "sticker-face sticker-eyes";
    face.innerHTML = eyesSVG();
    return { face, ratio: EYE_H / EYE_W, eyes: new Eyes(face.firstElementChild, face) };
  }
  const img = new Image();
  img.src = source.src;
  img.alt = "";
  img.draggable = false;
  img.className = "sticker-face";
  await img.decode();
  return { face: img, ratio: img.naturalWidth && img.naturalHeight ? img.naturalHeight / img.naturalWidth : 1, eyes: null };
}

// ==========================================================
// STICKER COMPOSITIE
// Stickers liggen niet los in de ruimte maar plakken aan de typografie, zoals in het ontwerp:
// op de hoek van de eerste regel, aan het einde ervan, naast de laatste regel, eronder.
// Welke sticker waar komt wisselt per bezoek; de plekken, draaiing en maat blijven.
//
// Soort per sticker: data-sticker-kind="tekst|icoon|foto|ogen" op de img of het CMS-item,
// anders uit de bestandsnaam (tekst-…, icoon-…, ogen), een foto (avif/jpg/png/webp) is "foto".
// ==========================================================

const stickerRatios = new Map();
const stickerClamp = (value, min, max) => Math.min(max, Math.max(min, value));

function stickerKindOf(img, src) {
  const own = img.getAttribute?.("data-sticker-kind") || img.closest?.("[data-sticker-kind]")?.getAttribute("data-sticker-kind");
  if (own) return own.trim().toLowerCase();
  let name = String(src || "").split("?")[0].split("/").pop().toLowerCase();
  try { name = decodeURIComponent(name); } catch (e) { /* laat staan */ }
  if (/(^|[_-])tekst[-_]/.test(name)) return "tekst";
  if (/(^|[_-])icoon[-_]/.test(name)) return "icoon";
  if (/\.(avif|jpe?g|png|webp)$/.test(name)) return "foto";
  return "icoon";
}

// Verhouding (hoogte/breedte) per bron, eenmalig gemeten: die bepaalt vorm en maat
function loadStickerRatios(sources) {
  return Promise.all(sources.map((source) => {
    if (source.eyes || stickerRatios.has(source.src)) return null;
    const img = new Image();
    img.src = source.src;
    return img.decode()
      .then(() => stickerRatios.set(source.src, img.naturalWidth && img.naturalHeight ? img.naturalHeight / img.naturalWidth : 1))
      .catch(() => stickerRatios.set(source.src, 1));
  }));
}
const stickerRatio = (source) => (source.eyes ? EYE_H / EYE_W : stickerRatios.get(source.src) || 1);
const stickerShape = (source) => {
  const r = stickerRatio(source);
  return r < 0.8 ? "wide" : r > 1.25 ? "tall" : "round";
};

// Maat: tekststickers groter, icoontjes kleiner. Brede stickers worden breder, hoge smaller,
// zodat ze ongeveer even zwaar ogen.
const STICKER_KIND_SIZE = { tekst: 1.15, foto: 0.95, ogen: 0.85, icoon: 0.8 };
function stickerSizeFactor(source) {
  const r = stickerRatio(source);
  const shape = r < 1 ? Math.pow(r, -0.3) : Math.pow(r, -0.25);
  return stickerClamp((STICKER_KIND_SIZE[source.kind] ?? 1) * shape, 0.65, 1.8);
}

// Per pagina bijhouden wat er al hangt, zodat de hero en de reviews niet dezelfde krijgen
let stickerPageUse = new Map();

// Welke sticker komt er. Voorkeuren: "round"/"wide" (tekststickers in die vorm), of een soort
// ("tekst", "icoon", "foto", "ogen"). Ogen alleen in een zone met een h1 (de hero), één keer;
// data-sticker-eyes="always" | "never" op de zone overschrijft dat.
function createStickerPicker(zone, sources) {
  const setting = zone.getAttribute("data-sticker-eyes");
  const eyesOk = setting === "always" || (setting !== "never" && !!zone.querySelector("h1"));
  const taken = new Set();
  // Geen sticker die de kop van de zone herhaalt ("wij stoppen de scroll" naast WIJ STOPPEN DE SCROLL)
  const slug = (t) => String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const headSlug = slug(stickerAnchorHeading(zone)?.textContent || "");
  const echoes = (source) => headSlug.length > 5 && slug(String(source.src).split("?")[0].split("/").pop()).includes(headSlug);
  // Varianten van dezelfde tekst (tekst-shit-geregeld-blok en -ster) niet samen in één zone
  const stem = (source) => String(source.src).split("?")[0].split("/").pop().replace(/\.[a-z0-9]+$/i, "").replace(/-[^-]+$/, "");
  const family = new Map(sources.map((source) => {
    const st = stem(source);
    return [source, st.includes("-") && sources.some((o) => o !== source && stem(o) === st) ? st : source.src];
  }));
  const familyTaken = (source) => [...taken].some((t) => family.get(t) === family.get(source));
  const matches = (source, token) => {
    if (token === "any") return true;
    if (token === "round" || token === "wide") return source.kind === "tekst" && stickerShape(source) === token;
    if (token === "flat") return source.kind === "tekst" && stickerRatio(source) < 0.5;
    return source.kind === token;
  };
  const leastUsed = (pool) => {
    const use = (source) => stickerPageUse.get(source.src) || 0;
    const least = Math.min(...pool.map(use));
    const best = pool.filter((source) => use(source) === least);
    return best[Math.floor(Math.random() * best.length)];
  };
  return {
    pick(prefs = ["any"]) {
      const free = sources.filter((source) => !taken.has(source) && !familyTaken(source) && !echoes(source) && (!source.eyes || eyesOk));
      let choice = null;
      for (const token of [...prefs, "tekst", "foto", "icoon", "any"]) {
        const pool = free.filter((source) => matches(source, token));
        if (pool.length) { choice = leastUsed(pool); break; }
      }
      // Alles hangt al: dan mag er een dubbele, maar nooit tweemaal ogen
      if (!choice) {
        const rest = sources.filter((source) => !source.eyes);
        if (!rest.length) return null;
        choice = leastUsed(rest);
      }
      taken.add(choice);
      stickerPageUse.set(choice.src, (stickerPageUse.get(choice.src) || 0) + 1);
      return choice;
    },
    // Kwam er niet (geen plek) of is weg: mag weer gekozen worden
    release(source) {
      if (!source || !taken.has(source)) return;
      taken.delete(source);
      stickerPageUse.set(source.src, Math.max(0, (stickerPageUse.get(source.src) || 1) - 1));
    },
  };
}

// Tekstregels van een element in zone-coördinaten, op hun rustpositie: regels of letters die nog
// inschuiven (SplitText) tellen op de plek waar ze straks staan. Boven en onder gaat de lucht van het
// lettertype eraf, zodat "de bovenkant van de regel" de bovenkant van de kapitalen is.
function stickerTextLines(el, zoneRect) {
  const boxes = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  let node;
  while ((node = walker.nextNode())) {
    if (!node.textContent.trim()) continue;
    let dx = 0;
    let dy = 0;
    for (let p = node.parentElement; p && p !== el; p = p.parentElement) {
      const t = getComputedStyle(p).transform;
      if (t && t !== "none") {
        const m = new DOMMatrixReadOnly(t);
        dx += m.e;
        dy += m.f;
      }
    }
    range.selectNodeContents(node);
    [...range.getClientRects()].forEach((r) => {
      if (r.width < 1 || r.height < 1) return;
      boxes.push({
        left: r.left - dx - zoneRect.left,
        right: r.right - dx - zoneRect.left,
        top: r.top - dy - zoneRect.top,
        bottom: r.bottom - dy - zoneRect.top,
      });
    });
  }
  range.detach?.();
  boxes.sort((a, b) => a.top - b.top);
  const lines = [];
  boxes.forEach((b) => {
    const cy = (b.top + b.bottom) / 2;
    const line = lines.find((l) => Math.abs((l.top + l.bottom) / 2 - cy) < Math.min(l.bottom - l.top, b.bottom - b.top) * 0.5);
    if (line) {
      line.left = Math.min(line.left, b.left);
      line.right = Math.max(line.right, b.right);
      line.top = Math.min(line.top, b.top);
      line.bottom = Math.max(line.bottom, b.bottom);
    } else lines.push({ ...b });
  });
  return lines.map((l) => {
    const h = l.bottom - l.top;
    const top = l.top + h * STICKER_LINE_TRIM[0];
    const bottom = l.bottom - h * STICKER_LINE_TRIM[1];
    return { left: l.left, right: l.right, top, bottom, w: l.right - l.left, h: bottom - top };
  });
}
const STICKER_LINE_TRIM = [0.16, 0.14];

function stickerTextBox(lines) {
  return {
    left: Math.min(...lines.map((l) => l.left)),
    right: Math.max(...lines.map((l) => l.right)),
    top: lines[0].top,
    bottom: lines[lines.length - 1].bottom,
  };
}

// De plekken rond een kop, in volgorde van belangrijkheid (bij minder stickers vallen de laatste af).
// at() geeft het midden van de sticker, uitgaand van zijn breedte w en hoogte h.
const STICKER_HEADING_SPOTS = [
  // Over de linkerbovenhoek van de eerste regel (in het ontwerp: het hoofd op de W)
  { prefs: ["foto", "ogen", "round"], rot: -7, at: (m, w, h) => ({ x: m.first.left + w * 0.05, y: m.first.top + h * 0.08 }) },
  // Over het einde van de eerste regel (de badge op de N)
  { prefs: ["round", "tekst"], rot: 9, at: (m, w, h) => ({ x: m.first.right + w * 0.12, y: m.first.top + h * 0.04 }) },
  // Rechts naast de laatste regel, iets lager (de spreekballon)
  { prefs: ["wide", "tekst"], rot: 4, multiline: true, at: (m, w, h) => ({ x: m.last.right + w * 0.58, y: m.last.top + m.last.h * 0.8 }) },
  // Kop van één regel: rechts eronder, half onder het einde
  { prefs: ["wide", "tekst"], rot: 5, singleline: true, at: (m, w, h) => ({ x: m.last.right - w * 0.25, y: m.last.bottom + h * 0.5 }) },
  // Links bij de regelovergang, onder de eerste regel weggestopt ("ook qua marketing")
  { prefs: ["wide", "tekst"], rot: -4, multiline: true, at: (m, w, h) => ({ x: Math.min(m.last.left, m.box.left + w * 0.3) - w * 0.55, y: m.last.top + m.last.h * 0.3 }) },
  // Linksonder, schuin onder de kop (de ster)
  { prefs: ["round", "tekst"], rot: -9, at: (m, w, h) => ({ x: m.box.left - w * 0.1, y: m.last.bottom + h * 0.55 }) },
];

// Zones zonder kop: verdeeld over de hoogte, om en om links en rechts in de marge
const STICKER_BAND_LOOKS = [
  { prefs: ["round", "tekst"], rot: -6 },
  { prefs: ["icoon"], rot: 7 },
  { prefs: ["wide", "tekst"], rot: -3 },
  { prefs: ["icoon"], rot: 9 },
];

// Zwaartekracht: waar ze op landen, in volgorde
const STICKER_DROP_LOOKS = [
  { prefs: ["round", "tekst"], rot: -8 },
  { prefs: ["foto", "wide", "tekst"], rot: 6 },
  { prefs: ["round", "tekst"], rot: 10 },
  { prefs: ["icoon"], rot: -5 },
];

const stickerJitter = (amount) => (Math.random() * 2 - 1) * amount;

// De kop van een board-zone: [data-sticker-anchor], anders de h1, anders de eerste h2
function stickerAnchorHeading(zone) {
  const candidates = [zone.querySelector("[data-sticker-anchor]"), zone.querySelector("h1"), zone.querySelector("h2")];
  return candidates.find((el) => el && el.getClientRects().length && !el.closest("[data-sticker-library]")) || null;
}

// Wacht tot de kop is uitgeschoven, dan pas plakken (max 2,5 s)
function stickerHeadingSettled(el) {
  return new Promise((resolve) => {
    const started = performance.now();
    const targets = () => [el, ...(el._split?.lines || []), ...(el._split?.chars || []), ...(el._split?.words || [])];
    const busy = () => gsap.getTweensOf(targets()).some((t) => t.progress() < 1 && !t.paused() && t.timeScale());
    const check = () => {
      if (!el.isConnected || !busy() || performance.now() - started > 2500) resolve();
      else gsap.delayedCall(0.1, check);
    };
    check();
  });
}

// ==========================================================
// STICKER ZONES
// Standaard: stickers vallen met zwaartekracht. data-sticker-mode="board":
// stickers blijven liggen en zijn binnen hun zone versleepbaar.
// Matter.js wordt alleen geladen als een zwaartekrachtzone op de pagina staat.
//
// data-sticker-library        wrapper met sticker-<img>'s, bv. CMS Collection List
// .sticker_list                statische fallback-library voor pagina's zonder CMS Collection, zoals 404
// data-sticker-zone           de sectie voor een van beide sticker-modi
//   data-sticker-mode="board" geen zwaartekracht, stickers blijven liggen en zijn versleepbaar
// Plaatsing (zie STICKER COMPOSITIE): een board plakt ze rond zijn kop ([data-sticker-anchor], h1 of h2),
// zonder kop verdeeld over de hoogte. Zwaartekracht laat ze bovenin starten en richting de vloer vallen,
// verdeeld over de breedte; staan er kaarten als colliders (resultaten), dan landen ze op de kaarten.
// Een bezoeker kan ze pakken, gooien en verplaatsen, niet bijmaken.
//   data-sticker-drop="floor|on"  optioneel: naar de vloer, of erop (kaarten, woordmerk, kop)
//   data-sticker-count="6"    aantal. Rond een kop max 5; zonder kop 2 per schermhoogte (max 8); vallend naar de
//                             vloer standaard 8 (max 12); op kaarten of een woordmerk max 4
//   data-sticker-size="7"     basisbreedte in rem (standaard 6); tekststickers iets groter, icoontjes kleiner
//   data-sticker-edge-inset="1rem" zijmarge in px of rem; standaard 1rem
//   data-sticker-floor-inset="0px" boardmarge onder; standaard 0 zodat stickers de vloer raken
//   data-sticker-swat="false"     optioneel: muisduw in gravity uitschakelen
//   data-sticker-spawn="cursor"   optioneel: bezoeker strooit stickers met de muis (of "click": klik plakt er een)
//   data-sticker-max="24"         alleen met spawn: max aantal tegelijk, de oudste popt weg
//   data-sticker-spawn-distance="180"  alleen met spawn="cursor": minimale cursorafstand in px
//   data-sticker-field="true"     optioneel: alle stickers schuiven mee met de muis
//   data-sticker-idle="true"      optioneel: stickers wiebelen in rust
// data-sticker-collider       elementen in de zone waar stickers op landen. Koppen en alinea's tellen per regel.
// ==========================================================

let matterPromise = null;
let stickerSourceWarningShown = false;
// Muis of touch bepaalt het gedrag per aanraking (event.pointerType), niet de schermbreedte.
// Kleiner en minder op kleinere schermen: de tekst neemt daar het meeste plek in
const stickerSizeScale = () => (window.innerWidth < 768 ? 0.62 : window.innerWidth < 992 ? 0.8 : 1);
const stickerCount = (n) => (n > 0 ? Math.max(1, Math.round(n * (window.innerWidth < 768 ? 0.6 : window.innerWidth < 992 ? 0.8 : 1))) : n);

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

// Elke bron: { src, eyes, kind }. eyes = de ogen-sticker, die wordt levend. kind: zie STICKER COMPOSITIE.
function getStickerSources() {
  const toSource = (img) => {
    const src = img.currentSrc || img.getAttribute("src") || img.getAttribute("data-src");
    const eyes = isEyesSource(img);
    return { src, eyes, kind: eyes ? "ogen" : stickerKindOf(img, src) };
  };
  const librarySources = [...document.querySelectorAll("[data-sticker-library] img")]
    .map(toSource)
    .filter((source) => source.src);
  const fallbackSources = librarySources.length ? [] : [...document.querySelectorAll(".sticker_list img")]
    .map(toSource)
    .filter((source) => source.src);
  const sources = librarySources.length ? librarySources : fallbackSources;

  if (sources.length) {
    stickerSourceWarningShown = false;
  } else if (!stickerSourceWarningShown) {
    stickerSourceWarningShown = true;
    console.warn("Stercq: geen stickerafbeeldingen gevonden. Gebruik [data-sticker-library] of plaats statische afbeeldingen in .sticker_list.");
  }

  return sources;
}

// Draaiing + schaal van een element: transform (Webflow) én de losse rotate-property
function getElementRotation(el) {
  const style = getComputedStyle(el);
  let angle = 0;
  let scale = 1;
  if (style.transform && style.transform !== "none") {
    const m = new DOMMatrixReadOnly(style.transform);
    angle = Math.atan2(m.b, m.a);
    scale = Math.hypot(m.a, m.b) || 1;
  }
  if (style.rotate && style.rotate !== "none") {
    const deg = parseFloat(style.rotate.split(" ").pop());
    if (!Number.isNaN(deg)) angle += (deg * Math.PI) / 180;
  }
  return { angle, scale };
}

const stickerBlockedSelector ="[data-sticker-collider], a, button, input, textarea, select, label, h1, h2, h3, h4, h5, h6, p, blockquote, li, dt, dd, figcaption";
// Klein scherm: koppen en alinea's vullen daar de hele breedte. Dan ontwijken stickers alleen de echte
// tekstregels (naast een korte regel mag wel), houden ze minder afstand en mogen ze een stuk over de rand steken.
const stickerCompact = () => window.innerWidth < 992;
const stickerBlockedSelectorCompact = "[data-sticker-collider], a, button, input, textarea, select, label";
const stickerBleed = () => (stickerCompact() ? 0.35 : 0);

function stickerLengthToPx(value, fallback) {
  if (value == null || !value.trim()) return fallback;
  const amount = parseFloat(value);
  if (!Number.isFinite(amount)) return fallback;
  return value.trim().toLowerCase().endsWith("rem")
    ? amount * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
    : amount;
}

function getStickerEdgeInset(zone) {
  const defaultInset = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return Math.max(0, stickerLengthToPx(zone.getAttribute("data-sticker-edge-inset"), defaultInset));
}

function getStickerFloorInset(zone) {
  return Math.max(0, stickerLengthToPx(zone.getAttribute("data-sticker-floor-inset"), 0));
}

// except: een element (de kop waar stickers aan plakken) dat niet meetelt
function getStickerBlockedRects(zone, zoneRect, except = null) {
  const rects = [];
  const skip = (el) => except && (el === except || except.contains(el));
  const addRect = (rect) => {
    if (!rect.width || !rect.height) return;
    rects.push({
      left: rect.left - zoneRect.left,
      right: rect.right - zoneRect.left,
      top: rect.top - zoneRect.top,
      bottom: rect.bottom - zoneRect.top,
    });
  };

  zone.querySelectorAll(stickerCompact() ? stickerBlockedSelectorCompact : stickerBlockedSelector).forEach((el) => {
    if (skip(el)) return;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) < 0.05) return;
    addRect(el.getBoundingClientRect());
  });

  const walker = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT);
  let textNode;
  while ((textNode = walker.nextNode())) {
    if (!textNode.textContent.trim()) continue;
    const parent = textNode.parentElement;
    if (!parent || skip(parent) || parent.closest("[data-sticker-library], [data-sticker-board-item], .sticker-zone__sticker, [data-sticker-collider]")) continue;

    const range = document.createRange();
    range.selectNodeContents(textNode);
    [...range.getClientRects()].forEach(addRect);
    range.detach?.();
  }

  // [data-sticker-block]: hier nooit stickers, op de layout-positie (ook als het vlak nog dichtgeklapt staat)
  zone.querySelectorAll("[data-sticker-block]").forEach((el) => {
    let x = 0;
    let y = 0;
    let node = el;
    while (node && node !== zone) {
      x += node.offsetLeft;
      y += node.offsetTop;
      node = node.offsetParent;
    }
    if (node === zone) rects.push({ left: x, top: y, right: x + el.offsetWidth, bottom: y + el.offsetHeight });
  });

  // Board: een vaste header ligt over de zone heen, daar geen stickers neerleggen of naartoe slepen.
  // (Bij zwaartekracht vallen ze er toch onder vandaan.)
  if (zone.getAttribute("data-sticker-mode") !== "board") return rects;
  // Ook een header die zelf absolute staat binnen een vaste nav (de mobiele balk)
  const pinnedToScreen = (el) => {
    for (let node = el; node && node !== document.body; node = node.parentElement) {
      const position = getComputedStyle(node).position;
      if (position === "fixed" || position === "sticky") return true;
    }
    return false;
  };
  document.querySelectorAll("[data-header]").forEach((el) => {
    if (zone.contains(el)) return;
    if (pinnedToScreen(el)) addRect(el.getBoundingClientRect());
  });

  return rects;
}

function isStickerTextPoint(zone, clientX, clientY) {
  const zoneRect = zone.getBoundingClientRect();
  const x = clientX - zoneRect.left;
  const y = clientY - zoneRect.top;
  return getStickerBlockedRects(zone, zoneRect).some((rect) =>
    x >= rect.left - 4 && x <= rect.right + 4 && y >= rect.top - 4 && y <= rect.bottom + 4
  );
}

function findStickerSpawnPosition(zone, w, h, {
  x,
  y,
  automatic = false,
  autoTopRatio = 1,
  maxRotation = 0.4,
  minimumClearance = 0,
  ignoreElement = null,
  cachedBlockedRects = null,
  ignoreText = false,
} = {}) {
  const zoneRect = zone.getBoundingClientRect();
  const compact = stickerCompact();
  const edgeInset = getStickerEdgeInset(zone);
  const clearance = compact ? Math.max(8, Math.min(minimumClearance, 10)) : Math.max(18, Math.min(w, h) * 0.12, minimumClearance);
  const cos = Math.cos(maxRotation);
  const sin = Math.sin(maxRotation);
  const footprintW = Math.abs(w * cos) + Math.abs(h * sin);
  const footprintH = Math.abs(h * cos) + Math.abs(w * sin);
  const bleed = stickerBleed() * w;
  const minX = footprintW / 2 + (bleed ? -bleed : edgeInset);
  const maxX = zoneRect.width - footprintW / 2 - (bleed ? -bleed : edgeInset);
  const minY = footprintH / 2 + edgeInset;
  const maxY = zoneRect.height - footprintH / 2 - edgeInset;
  if (maxX <= minX || maxY <= minY) return null;

  const blockedRects = ignoreText ? [] : cachedBlockedRects || getStickerBlockedRects(zone, zoneRect);
  const occupiedRects = [...zone.querySelectorAll("[data-sticker-board-item], .sticker-zone__sticker")]
    .filter((el) => el !== ignoreElement)
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left - zoneRect.left,
        right: rect.right - zoneRect.left,
        top: rect.top - zoneRect.top,
        bottom: rect.bottom - zoneRect.top,
      };
    })
    .filter((rect) => rect.right > rect.left && rect.bottom > rect.top);
  const allBlockers = [...blockedRects, ...occupiedRects];

  function isOpen(centerX, centerY) {
    if (centerX < minX || centerX > maxX || centerY < minY || centerY > maxY) return false;
    const left = centerX - footprintW / 2 - clearance;
    const right = centerX + footprintW / 2 + clearance;
    const top = centerY - footprintH / 2 - clearance;
    const bottom = centerY + footprintH / 2 + clearance;
    return !allBlockers.some((rect) =>
      right > rect.left && left < rect.right && bottom > rect.top && top < rect.bottom
    );
  }

  if (!automatic) return Number.isFinite(x) && Number.isFinite(y) && isOpen(x, y) ? { x, y } : null;

  const upperLimit = Math.min(maxY, Math.max(minY, zoneRect.height * autoTopRatio));
  const searchRanges = upperLimit < maxY ? [upperLimit, maxY] : [maxY];
  for (const searchMaxY of searchRanges) {
    if (searchMaxY <= minY) continue;
    // Klein scherm: weinig vrije plekken, dus vaker proberen (goedkoop: alleen rechthoeken vergelijken)
    for (let attempt = 0, tries = compact ? 160 : 48; attempt < tries; attempt++) {
      const candidateX = minX + Math.random() * (maxX - minX);
      const candidateY = minY + Math.random() * (searchMaxY - minY);
      if (isOpen(candidateX, candidateY)) return { x: candidateX, y: candidateY };
    }
  }

  return null;
}

// Ruimte die een gedraaide sticker inneemt, als rechthoek rond zijn midden
function stickerFootprint(x, y, w, h, rotDeg) {
  const a = Math.abs(rotDeg) * Math.PI / 180;
  const fw = w * Math.cos(a) + h * Math.sin(a);
  const fh = h * Math.cos(a) + w * Math.sin(a);
  return { left: x - fw / 2, right: x + fw / 2, top: y - fh / 2, bottom: y + fh / 2 };
}

const stickerFree = (zone, w, h, x, y, rotDeg, blocked) =>
  !!findStickerSpawnPosition(zone, w, h, { x, y, maxRotation: Math.abs(rotDeg) * Math.PI / 180, cachedBlockedRects: blocked });

// Colliders als rechthoeken in zone-coördinaten; een tekst-collider per regel
const STICKER_TEXT_COLLIDER = "h1, h2, h3, h4, h5, h6, p, [data-sticker-collider='lines']";
function stickerColliderRects(zone, zr) {
  const out = [];
  zone.querySelectorAll("[data-sticker-collider]").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    // Een woordmerk telt per plek (zie svgTopAt), niet als één groot blok
    if (stickerIsWordmark(el)) return;
    if (el.matches(STICKER_TEXT_COLLIDER) && !el.querySelector("svg") && Math.abs(getElementRotation(el).angle) < 0.01) {
      out.push(...stickerTextLines(el, zr));
    } else out.push({ left: r.left - zr.left, right: r.right - zr.left, top: r.top - zr.top, bottom: r.bottom - zr.top });
  });
  return out;
}

// Board met kop: de plekken uit STICKER_HEADING_SPOTS. Ligt er iets onder (knop, alinea, header, een
// andere sticker), dan schuift hij een stukje: eerst van de kop af, dan er juist verder overheen.
async function planHeadingStickers(zone, heading, picker, baseW, count) {
  const zr = zone.getBoundingClientRect();
  const lines = stickerTextLines(heading, zr);
  if (!lines.length) return [];
  const m = { lines, first: lines[0], last: lines[lines.length - 1], box: stickerTextBox(lines) };
  const mid = { x: (m.box.left + m.box.right) / 2, y: (m.box.top + m.box.bottom) / 2 };
  const blocked = getStickerBlockedRects(zone, zr, heading);
  const plan = [];
  for (const spot of STICKER_HEADING_SPOTS) {
    if (plan.length >= count) break;
    if (spot.multiline && lines.length < 2) continue;
    if (spot.singleline && lines.length > 1) continue;
    const source = picker.pick(spot.prefs);
    if (!source) break;
    await loadStickerRatios([source]);
    const factor = stickerSizeFactor(source);
    const w = baseW * factor;
    const h = w * stickerRatio(source);
    const rot = spot.rot + stickerJitter(1.5);
    const p = spot.at(m, w, h);
    p.x += stickerJitter(w * 0.04);
    p.y += stickerJitter(h * 0.04);
    const len = Math.hypot(p.x - mid.x, p.y - mid.y) || 1;
    const away = { x: (p.x - mid.x) / len, y: (p.y - mid.y) / len };
    const base = spot.at(m, w, h);
    let fit = null;
    for (const k of [0, 0.15, -0.12, 0.3, -0.25, 0.45]) {
      const x = p.x + away.x * k * w;
      const y = p.y + away.y * k * h;
      if (stickerFree(zone, w, h, x, y, rot, blocked)) { fit = { x, y }; break; }
    }
    if (!fit) { picker.release(source); continue; }
    plan.push({ source, factor, w, h, x: fit.x, y: fit.y, rot, spot, nudge: { x: (fit.x - base.x) / w, y: (fit.y - base.y) / h } });
    blocked.push(stickerFootprint(fit.x, fit.y, w, h, rot));
  }
  return plan;
}

// Board zonder kop: één per schermhoogte, om en om links en rechts, op de vrije plek die het dichtst
// bij dat punt ligt
async function planBandStickers(zone, picker, baseW, count) {
  const zr = zone.getBoundingClientRect();
  // Twee per schermhoogte (om en om links en rechts), tot 8
  const n = Math.min(count, 8, Math.max(1, Math.round((zr.height / Math.max(1, window.innerHeight)) * 2)));
  const blocked = getStickerBlockedRects(zone, zr);
  // Hier ook niet over beelden en kaarten. Zweeft een kaart (parallax), dan de hele baan die hij aflegt.
  const drift = Math.min(window.innerHeight, 1000) * 0.25;
  zone.querySelectorAll("img, video, .werk_card, [data-depth]").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return;
    const d = el.closest(".werk_card, [data-depth]") ? drift : 0;
    blocked.push({ left: r.left - zr.left, right: r.right - zr.left, top: r.top - zr.top - d, bottom: r.bottom - zr.top + d });
  });
  const plan = [];
  for (let i = 0; i < n; i++) {
    const look = STICKER_BAND_LOOKS[i % STICKER_BAND_LOOKS.length];
    const source = picker.pick(look.prefs);
    if (!source) break;
    await loadStickerRatios([source]);
    const factor = stickerSizeFactor(source);
    const w = baseW * factor;
    const h = w * stickerRatio(source);
    const rot = look.rot + stickerJitter(1.5);
    const tx = zr.width * (i % 2 ? 0.9 : 0.1);
    const ty = zr.height * (i + 0.5) / n;
    let fit = null;
    for (let ring = 0; ring <= 8 && !fit; ring++) {
      const steps = ring ? 12 : 1;
      for (let s = 0; s < steps && !fit; s++) {
        const a = (s / steps) * Math.PI * 2;
        const x = tx + Math.cos(a) * ring * w * 0.35;
        const y = ty + Math.sin(a) * ring * h * 0.35;
        if (stickerFree(zone, w, h, x, y, rot, blocked)) fit = { x, y };
      }
    }
    if (!fit) { picker.release(source); continue; }
    plan.push({ source, factor, w, h, x: fit.x, y: fit.y, rot });
    blocked.push(stickerFootprint(fit.x, fit.y, w, h, rot));
  }
  return plan;
}

// Zwaartekracht: waar ze op moeten landen. Een woordmerk (SVG-collider): boven de s, de r en de q,
// zoals in het ontwerp. Een kop: op de schouders waar een regel uitsteekt, dan op de eerste regel.
// Anders de kaarten, om en om zodat ze over de breedte verdeeld liggen.
function stickerDropTargets(zone, baseW) {
  const zr = zone.getBoundingClientRect();
  const cols = [...zone.querySelectorAll("[data-sticker-collider]")].filter((el) => el.getClientRects().length && el.getBoundingClientRect().width > 1);
  const rel = (el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left - zr.left, top: r.top - zr.top, w: r.width, area: r.width * r.height };
  };
  // room: hoe breed het vlak is waar hij op moet blijven liggen; past hij niet, dan valt die plek af
  const svgEl = cols.filter(stickerIsWordmark).sort((a, b) => rel(b).area - rel(a).area)[0];
  if (svgEl) {
    const svg = rel(svgEl);
    return [0.08, 0.47, 0.9].map((f) => ({ x: svg.left + svg.w * f, top: svg.top, room: Infinity, svg: svgEl }));
  }
  const head = cols.find((el) => el.matches("h1, h2, h3"));
  const lines = head ? stickerTextLines(head, zr) : [];
  if (lines.length) {
    const out = [];
    lines.forEach((l, i) => {
      const prev = lines[i - 1];
      if (!prev) return;
      if (prev.left - l.left > baseW * 0.8) out.push({ x: (l.left + prev.left) / 2, top: l.top, room: prev.left - l.left });
      if (l.right - prev.right > baseW * 0.8) out.push({ x: (l.right + prev.right) / 2, top: l.top, room: l.right - prev.right });
    });
    // Op de eerste regel: twee als hij breed genoeg is, anders één in het midden
    const f = lines[0];
    if (f.w >= baseW * 2.6) out.push({ x: f.left + f.w * 0.22, top: f.top, room: f.w * 0.44 }, { x: f.right - f.w * 0.22, top: f.top, room: f.w * 0.44 });
    else out.push({ x: f.left + f.w / 2, top: f.top, room: f.w });
    return out;
  }
  const cards = cols.map(rel).sort((a, b) => a.left - b.left);
  return [...cards.filter((c, i) => i % 2 === 0), ...cards.filter((c, i) => i % 2 === 1)]
    .map((c) => ({ x: c.left + c.w * (0.5 + stickerJitter(0.12)), top: c.top, room: c.w * 0.8 }));
}

// Hoogste punt van een SVG-woordmerk tussen x0 en x1 (zone-coördinaten): boven een c of q ligt
// dat lager dan boven de t
function svgTopAt(el, zr, x0, x1) {
  const plan = svgColliderPlan(el);
  if (!plan) return null;
  let top = Infinity;
  plan.prepared.forEach(({ path, length, matrix, scale }) => {
    const pts = samplePath(path, length, plan.samplePx / scale);
    for (let i = 0; i < pts.length; i += 2) {
      const x = pts[i] * matrix.a + pts[i + 1] * matrix.c + matrix.e - zr.left;
      if (x < x0 || x > x1) continue;
      const y = pts[i] * matrix.b + pts[i + 1] * matrix.d + matrix.f - zr.top;
      if (y < top) top = y;
    }
  });
  return Number.isFinite(top) ? top : null;
}

// Vlak boven het landingspunt beginnen, zodat hij kort valt en niet wild stuitert
// Zwaartekracht met een kop of woordmerk: de stickers vallen richting de vloer. Ze starten bovenin,
// verdeeld over de breedte, het liefst boven een plek waar niets onder ligt; komen ze toch op de
// tekst terecht, dan is dat zo. Kaarten (resultaten): zie planDropStickers, die landen erop.
// data-sticker-drop="floor" (naar de vloer) | "on" (erop: kaarten, woordmerk, kop) op de zone kiest zelf.
function stickerDropMode(zone) {
  const own = zone.getAttribute("data-sticker-drop");
  if (own === "floor" || own === "on") return own;
  const cols = [...zone.querySelectorAll("[data-sticker-collider]")];
  if (!cols.length || cols.some(stickerIsWordmark) || cols.some((el) => el.matches("h1, h2, h3"))) return "floor";
  return "on";
}

async function planFloorStickers(zone, picker, baseW, count) {
  const zr = zone.getBoundingClientRect();
  const base = getStickerBlockedRects(zone, zr);
  // Een vaste header ligt over de bovenkant van de zone: daar niet beginnen
  document.querySelectorAll("[data-header]").forEach((el) => {
    if (zone.contains(el) || getComputedStyle(el).position !== "fixed") return;
    const r = el.getBoundingClientRect();
    if (r.width && r.height) base.push({ left: r.left - zr.left, right: r.right - zr.left, top: r.top - zr.top, bottom: r.bottom - zr.top });
  });
  // Wat eronder ligt (colliders, per regel; een woordmerk als blok) bepaalt of een baan vrij is tot de vloer
  const below = [...stickerColliderRects(zone, zr), ...[...zone.querySelectorAll("[data-sticker-collider]")].filter(stickerIsWordmark).map((el) => {
    const r = el.getBoundingClientRect();
    return { left: r.left - zr.left, right: r.right - zr.left, top: r.top - zr.top, bottom: r.bottom - zr.top };
  })];
  const n = 9;
  const lanes = Array.from({ length: n }, (_, i) => {
    const x = zr.width * (i + 0.5) / n;
    const half = baseW * 0.4;
    return { x, clear: !below.some((r) => r.right > x - half && r.left < x + half) };
  });
  // Eerst de vrije banen, zo ver mogelijk uit elkaar; dan pas banen boven tekst
  const minGap = Math.max(baseW * 1.4, zr.width / (Math.min(count, 6) + 2));
  const chosen = [];
  for (const pass of [true, false]) {
    for (const lane of lanes.filter((l) => l.clear === pass).sort(() => Math.random() - 0.5)) {
      if (chosen.every((c) => Math.abs(c.x - lane.x) >= minGap)) chosen.push(lane);
    }
  }
  // Meer stickers dan banen: in golven. De vorige golf is dan al naar beneden gevallen.
  const plan = [];
  for (let wave = 0; wave < 3 && plan.length < count; wave++) {
    const blocked = [...base];
    let placed = 0;
    for (const lane of [...chosen].sort(() => Math.random() - 0.5)) {
      if (plan.length >= count) break;
      const look = STICKER_DROP_LOOKS[plan.length % STICKER_DROP_LOOKS.length];
      const source = picker.pick(look.prefs);
      if (!source) break;
      await loadStickerRatios([source]);
      const factor = stickerSizeFactor(source);
      const w = baseW * factor;
      const h = w * stickerRatio(source);
      const rot = look.rot + stickerJitter(2);
      // Bovenin een vrije plek, in de buurt van de baan
      let fit = null;
      for (let y = h * 0.6 + 8; y < zr.height * 0.55 && !fit; y += h * 0.4) {
        for (const dx of [0, 0.3, -0.3, 0.6, -0.6]) {
          const x = lane.x + dx * w + stickerJitter(w * 0.05);
          if (stickerFree(zone, w, h, x, y, rot, blocked)) { fit = { x, y }; break; }
        }
      }
      if (!fit) { picker.release(source); continue; }
      plan.push({ source, factor, w, h, x: fit.x, y: fit.y, rot, delay: wave * 0.9 + placed * 0.18 });
      blocked.push(stickerFootprint(fit.x, fit.y, w, h, rot));
      placed++;
    }
    if (!placed) break;
  }
  return plan;
}

async function planDropStickers(zone, picker, baseW, count) {
  const zr = zone.getBoundingClientRect();
  const blocked = stickerColliderRects(zone, zr);
  const plan = [];
  // Past de gekozen sticker niet (te hoog voor de ruimte erboven), dan een brede proberen
  const tryPlace = (t, source, look) => {
    const factor = stickerSizeFactor(source);
    const w = baseW * factor;
    const h = w * stickerRatio(source);
    const rot = look.rot + stickerJitter(2);
    if (t.room < w * 0.95) return null;
    const x = t.x + stickerJitter(w * 0.06);
    let top = t.top;
    const local = [];
    if (t.svg) {
      const fp = stickerFootprint(x, 0, w, h, rot);
      top = svgTopAt(t.svg, zr, fp.left - 4, fp.right + 4) ?? t.top;
      // Vlak boven de letters mag (de vrije-plek-check houdt anders nog een marge aan)
      local.push({ left: fp.left, right: fp.right, top: top + 14, bottom: top + h });
    }
    for (const lift of [0.62, 0.9, 1.3, 1.8]) {
      const y = top - h * lift;
      if (y < h / 2) break;
      if (stickerFree(zone, w, h, x, y, rot, [...blocked, ...local])) return { source, factor, w, h, x, y, rot };
    }
    return null;
  };
  for (const t of stickerDropTargets(zone, baseW)) {
    if (plan.length >= count) break;
    const look = STICKER_DROP_LOOKS[plan.length % STICKER_DROP_LOOKS.length];
    let placed = null;
    for (const prefs of [look.prefs, ["wide"], ["flat"]]) {
      const source = picker.pick(prefs);
      if (!source) break;
      await loadStickerRatios([source]);
      placed = tryPlace(t, source, look);
      if (placed) break;
      picker.release(source);
    }
    if (!placed) continue;
    plan.push(placed);
    blocked.push(stickerFootprint(placed.x, placed.y, placed.w, placed.h, placed.rot));
  }
  return plan;
}

function initStickerZones(scope = document) {
  const zones = [...scope.querySelectorAll("[data-sticker-zone]")];
  if (!zones.length) return;

  if (!getStickerSources().length) return;
  // Nieuwe pagina: wat er hing telt niet meer
  if (scope === document) stickerPageUse = new Map();

  const boardZones = zones.filter((zone) => zone.getAttribute("data-sticker-mode") === "board");
  boardZones.forEach(initStickerBoard);

  // Vallende zones: Matter.js (±25 KB) pas laden als zo'n zone binnen een scherm afstand komt.
  // Staat hij al in beeld (404, korte pagina), dan meteen.
  const gravityZones = zones.filter((zone) => !boardZones.includes(zone));
  gravityZones.forEach((zone) => {
    if (zone._stickerDestroy || zone._stickerPending) return;
    const io = new IntersectionObserver((entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      io.disconnect();
      zone._stickerPending = null;
      loadMatter()
        .then((Matter) => initStickerZone(zone, Matter))
        .catch(() => console.warn("Stercq: matter-js kon niet laden"));
    }, { rootMargin: "100% 0px" });
    io.observe(zone);
    zone._stickerPending = io;
  });
}

function initStickerBoard(zone) {
  if (zone._stickerDestroy || !zone.isConnected) return;

  const sources = getStickerSources();
  if (!sources.length) return;

  const startCount = stickerCount(parseInt(zone.getAttribute("data-sticker-count"), 10));
  const maxCount = stickerCount(parseInt(zone.getAttribute("data-sticker-max"), 10) || 24);
  const sizeRem = parseFloat(zone.getAttribute("data-sticker-size")) || 6;
  // Bezoekers verplaatsen en gooien, ze maken er geen bij (tenzij de zone dat met data-sticker-spawn vraagt)
  const spawnMode = zone.getAttribute("data-sticker-spawn") || "none";
  const spawnDistance = parseFloat(zone.getAttribute("data-sticker-spawn-distance"));
  const stickers = [];
  const picker = createStickerPicker(zone, sources);
  const heading = stickerAnchorHeading(zone);
  let nextZIndex = 3;
  let activeDrag = null;
  let spawnedStart = false;
  let suppressNextClick = false;
  let pointerInside = false;
  let pointerPosition = null;
  let lastCursorSpawn = null;
  let lastCursorSpawnAt = 0;
  let cursorSpawnPending = false;
  let zoneSize = { width: 0, height: 0 };
  let introCalls = [];
  let zoneVisible = true;
  // Rust: alleen de sticker onder de muis komt los. Meeschuiven met de muis en wiebelen zijn opt-in.
  const pointerField = zone.getAttribute("data-sticker-field") === "true";
  const idleOn = zone.getAttribute("data-sticker-idle") === "true";

  const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const stickerWidth = () => sizeRem * remPx() * stickerSizeScale();
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const edgeInset = getStickerEdgeInset(zone);
  const floorInset = getStickerFloorInset(zone);

  function getPositionBounds(sticker, rect) {
    const radians = Math.abs(sticker.angle * Math.PI / 180);
    const footprintW = sticker.w * Math.cos(radians) + sticker.h * Math.sin(radians);
    const footprintH = sticker.h * Math.cos(radians) + sticker.w * Math.sin(radians);
    const xExtra = Math.max(0, (footprintW - sticker.w) / 2);
    const yExtra = Math.max(0, (footprintH - sticker.h) / 2);
    const bleed = stickerBleed() * sticker.w;
    const xInset = bleed ? xExtra - bleed : Math.min(edgeInset, Math.max(0, (rect.width - footprintW) / 2)) + xExtra;
    const topInset = Math.min(edgeInset, Math.max(0, (rect.height - footprintH) / 2)) + yExtra;

    return {
      minX: xInset,
      maxX: Math.max(xInset, rect.width - sticker.w - xInset),
      minY: topInset,
      maxY: Math.max(topInset, rect.height - sticker.h - yExtra - floorInset),
    };
  }

  // Wiebel in rust. Staat de zone buiten beeld, dan pauzeert hij (zie io hieronder).
  function startIdle(sticker) {
    if (!idleOn || reducedMotion || pointerInside || !sticker.el.isConnected) return;
    sticker.idleTween?.kill();
    sticker.idleTween = gsap.to(sticker.img, {
      y: rnd(-2.4, -1.4),
      rotation: rnd(-0.7, 0.7),
      duration: rnd(3.8, 5.4),
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: rnd(0, 1.1),
      paused: !zoneVisible,
    });
  }

  // Wrapper: plek + draai, plus wat de hand doet (optillen, kantelen, slingeren) en een schok van een buur.
  // De schaduw ligt op tafel: kantelt niet mee, schuift verder weg en wordt donkerder naarmate hij hoger hangt.
  function render(sticker) {
    const lift = sticker.lift;
    const x = sticker.x + sticker.jx;
    const y = sticker.y + sticker.jy;
    const rot = sticker.angle + sticker.swing + sticker.jr;
    const tiltX = sticker.tiltX + sticker.mtX;
    const tiltY = sticker.tiltY + sticker.mtY;
    let t = `translate3d(${x}px, ${y}px, 0) rotate(${rot}deg)`;
    if (lift !== 1 || tiltX || tiltY) t += ` perspective(700px) rotateX(${tiltX}deg) rotateY(${tiltY}deg) scale(${lift})`;
    sticker.el.style.transform = t;
    if (sticker.shadow) {
      const k = Math.max(0, lift - 1);
      sticker.shadow.style.transform = `translate3d(${x + k * 90}px, ${y + k * 170}px, 0) rotate(${rot}deg) scale(${1 + k * 0.5})`;
      sticker.shadow.style.opacity = String(Math.min(0.3, k * 2.5));
    }
  }

  function ensureShadow(sticker) {
    if (sticker.shadow) return sticker.shadow;
    const shadow = document.createElement("div");
    shadow.className = "sticker-shadow";
    shadow.setAttribute("aria-hidden", "true");
    shadow.style.width = `${sticker.w}px`;
    shadow.style.height = `${sticker.h}px`;
    if (sticker.img.tagName === "IMG") {
      const img = new Image();
      img.src = sticker.img.currentSrc || sticker.img.src;
      img.alt = "";
      img.draggable = false;
      shadow.appendChild(img);
    } else shadow.classList.add("is-blob");
    shadow.style.zIndex = sticker.el.style.zIndex;
    zone.insertBefore(shadow, sticker.el);
    sticker.shadow = shadow;
    return shadow;
  }

  function toTop(sticker) {
    const z = String(nextZIndex++);
    sticker.el.style.zIndex = z;
    if (sticker.shadow) sticker.shadow.style.zIndex = z;
  }

  function liftTo(sticker, value, duration = 0.3) {
    sticker.liftTween?.kill();
    sticker.liftTween = gsap.to(sticker, { lift: value, duration, ease: "power3.out", onUpdate: () => render(sticker) });
  }

  // Muis boven een sticker: hij komt een klein stukje los van het papier, als uitnodiging om te pakken
  let hovered = null;
  function setHover(sticker) {
    if (hovered === sticker || reducedMotion) return;
    if (hovered && !hovered.flying && activeDrag?.sticker !== hovered && hovered.el.isConnected) liftTo(hovered, 1, 0.35);
    hovered = sticker;
    if (sticker && !sticker.flying && activeDrag?.sticker !== sticker) {
      ensureShadow(sticker);
      liftTo(sticker, 1.035, 0.28);
    }
  }

  // Valt er een sticker naast je neer, dan schrik je even op
  function thud(source) {
    const cx = source.x + source.w / 2;
    const cy = source.y + source.h / 2;
    const radius = source.w * 2;
    stickers.forEach((sticker) => {
      if (sticker === source || sticker.flying || activeDrag?.sticker === sticker) return;
      const dx = sticker.x + sticker.w / 2 - cx;
      const dy = sticker.y + sticker.h / 2 - cy;
      const distance = Math.hypot(dx, dy) || 1;
      if (distance > radius) return;
      const p = 1 - distance / radius;
      sticker.joltTween?.kill();
      sticker.joltTween = gsap.fromTo(sticker,
        { jx: (dx / distance) * 7 * p, jy: -9 * p, jr: rnd(-7, 7) * p },
        { jx: 0, jy: 0, jr: 0, duration: 0.7, ease: "elastic.out(1, 0.32)", onUpdate: () => render(sticker) });
      sticker.eyes?.startle();
    });
  }

  // Slepen: de sticker hangt iets achter de cursor aan en slingert mee met hoe hard je trekt
  function dragTick() {
    const d = activeDrag;
    if (!d) { gsap.ticker.remove(dragTick); return; }
    const sticker = d.sticker;
    const r = Math.min(gsap.ticker.deltaRatio(60), 3);
    const follow = 1 - Math.pow(0.62, r);
    const px = sticker.x;
    const py = sticker.y;
    sticker.x += (d.tx - sticker.x) * follow;
    sticker.y += (d.ty - sticker.y) * follow;
    const vx = (sticker.x - px) / r;
    const vy = (sticker.y - py) / r;
    d.swingV += (clamp(vx * 0.85, -24, 24) - sticker.swing) * 0.2 * r;
    d.swingV *= Math.pow(0.72, r);
    sticker.swing += d.swingV * r;
    sticker.mtX += (clamp(vy * 0.5, -9, 9) - sticker.mtX) * follow;
    sticker.mtY += (clamp(-vx * 0.5, -9, 9) - sticker.mtY) * follow;
    render(sticker);
  }

  // Loslaten: wie gooit, ziet hem doorglijden en uitdraaien; daarna slaat hij plat op een vrije plek.
  // Lag hij boven tekst, dan glijdt hij naar de dichtstbijzijnde vrije plek in de gooirichting.
  function land(sticker, vx, vy, home) {
    sticker.moved = true;
    const rect = zone.getBoundingClientRect();
    const speed = Math.hypot(vx, vy);
    const thrown = speed > 0.35;
    const dirX = thrown ? vx / speed : 0;
    const dirY = thrown ? vy / speed : 0;
    const glide = thrown ? Math.min(speed * 230, rect.width * 0.35) : 0;
    const spin = thrown ? clamp(vx * 12, -30, 30) : 0;
    const angle = clamp(sticker.angle + sticker.swing * 0.6 + spin, -26, 26);
    const probe = { w: sticker.w, h: sticker.h, angle };
    const bounds = getPositionBounds(probe, rect);
    // Klein scherm: daar staat bijna overal tekst. Wat je zelf neerlegt mag over tekst liggen,
    // alleen niet over knoppen en links (anders schiet hij weg en voelt het alsof hij niet wil).
    const blockedRects = stickerCompact()
      ? [...zone.querySelectorAll("a, button, input, textarea, select, label, [data-sticker-collider]")].map((el) => {
          const r = el.getBoundingClientRect();
          return { left: r.left - rect.left, right: r.right - rect.left, top: r.top - rect.top, bottom: r.bottom - rect.top };
        }).filter((r) => r.right > r.left && r.bottom > r.top)
      : getStickerBlockedRects(zone, rect, heading);
    const free = (x, y) => findStickerSpawnPosition(zone, sticker.w, sticker.h, {
      x: x + sticker.w / 2,
      y: y + sticker.h / 2,
      maxRotation: Math.abs(angle * Math.PI / 180),
      minimumClearance: 24,
      ignoreElement: sticker.el,
      cachedBlockedRects: blockedRects,
    });
    let target = null;
    const ex = clamp(sticker.x + dirX * glide, bounds.minX, bounds.maxX);
    const ey = clamp(sticker.y + dirY * glide, bounds.minY, bounds.maxY);
    // Eerst het eindpunt, dan in ringen eromheen
    for (let ring = 0; ring <= 6 && !target; ring++) {
      const steps = ring ? 10 : 1;
      for (let i = 0; i < steps && !target; i++) {
        const a = (i / steps) * Math.PI * 2;
        const x = clamp(ex + Math.cos(a) * ring * 40, bounds.minX, bounds.maxX);
        const y = clamp(ey + Math.sin(a) * ring * 40, bounds.minY, bounds.maxY);
        if (free(x, y)) target = { x, y, angle };
      }
    }
    if (!target) target = { x: home.x, y: home.y, angle: home.angle };

    const distance = Math.hypot(target.x - sticker.x, target.y - sticker.y);
    const duration = clamp(0.16 + distance / 1300, 0.18, 0.75);
    const impact = duration * 0.72;
    sticker.flying = true;
    sticker.flight?.kill();
    sticker.liftTween?.kill();
    sticker.flight = gsap.timeline({
      onUpdate: () => render(sticker),
      onComplete: () => {
        sticker.flying = false;
        sticker.flight = null;
        sticker.rest = { x: target.x, y: target.y, angle: target.angle };
        if (pointerInside && pointerPosition) applyPointerField(pointerPosition.x, pointerPosition.y);
        else startIdle(sticker);
      },
    })
      .to(sticker, { x: target.x, y: target.y, angle: target.angle, swing: 0, mtX: 0, mtY: 0, tiltX: 0, tiltY: 0, duration, ease: "power3.out" }, 0)
      .to(sticker, { lift: 0.94, duration: 0.09, ease: "power2.in" }, Math.max(0, impact - 0.09))
      .call(() => thud(sticker), null, impact)
      .to(sticker, { lift: 1, duration: 0.55, ease: "elastic.out(1, 0.42)" }, impact);
  }

  function applyPointerField(clientX, clientY) {
    if (!pointerField || reducedMotion) return;

    pointerInside = true;
    pointerPosition = { x: clientX, y: clientY };

    const rect = zone.getBoundingClientRect();
    const normalizedX = clamp((clientX - rect.left - rect.width / 2) / Math.max(1, rect.width / 2), -1, 1);
    const normalizedY = clamp((clientY - rect.top - rect.height / 2) / Math.max(1, rect.height / 2), -1, 1);
    const sharedX = -normalizedX * 9;
    const sharedY = -normalizedY * 7;
    const radius = Math.max(240, Math.hypot(rect.width, rect.height) * 0.55);

    stickers.forEach((sticker) => {
      if (activeDrag?.sticker === sticker) return;

      sticker.idleRestartCall?.kill();
      sticker.idleTween?.kill();
      sticker.idleTween = null;

      const stickerRect = sticker.el.getBoundingClientRect();
      const dx = stickerRect.left + stickerRect.width / 2 - clientX;
      const dy = stickerRect.top + stickerRect.height / 2 - clientY;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const proximity = 1 - clamp(distance / radius, 0, 1);
      const localPush = proximity * 10;

      sticker.pointerToX?.(clamp(sharedX + (dx / distance) * localPush, -16, 16));
      sticker.pointerToY?.(clamp(sharedY + (dy / distance) * localPush, -14, 14));
      sticker.pointerToRotation?.(clamp(normalizedX * 3.5 + (dx / radius) * proximity * 2.5, -6, 6));
      sticker.pointerToScale?.(1 + proximity * 0.04);
    });
  }

  function resetPointerField() {
    pointerInside = false;
    pointerPosition = null;

    stickers.forEach((sticker) => {
      sticker.pointerToX?.(0);
      sticker.pointerToY?.(0);
      sticker.pointerToRotation?.(0);
      sticker.pointerToScale?.(1);
      sticker.idleRestartCall?.kill();
      sticker.idleRestartCall = gsap.delayedCall(0.55, () => startIdle(sticker));
    });
  }

  // Andere breedte: wat nog op zijn plek aan de kop zit, gaat mee met de regels; wat de bezoeker
  // verplaatst heeft, schuift naar verhouding mee
  function updateZoneSize() {
    const rect = zone.getBoundingClientRect();
    const scaleX = zoneSize.width ? rect.width / zoneSize.width : 1;
    const scaleY = zoneSize.height ? rect.height / zoneSize.height : 1;
    let measured = null;
    const measure = () => {
      if (measured || !heading) return measured;
      const lines = stickerTextLines(heading, rect);
      if (lines.length) measured = { lines, first: lines[0], last: lines[lines.length - 1], box: stickerTextBox(lines) };
      return measured;
    };

    stickers.forEach((sticker) => {
      sticker.w = stickerWidth() * (sticker.factor || 1);
      sticker.h = sticker.w * sticker.ratio;
      const bounds = getPositionBounds(sticker, rect);
      const m = sticker.spot && !sticker.moved && !sticker.flying ? measure() : null;
      if (m) {
        const p = sticker.spot.at(m, sticker.w, sticker.h);
        sticker.x = clamp(p.x + sticker.nudge.x * sticker.w - sticker.w / 2, bounds.minX, bounds.maxX);
        sticker.y = clamp(p.y + sticker.nudge.y * sticker.h - sticker.h / 2, bounds.minY, bounds.maxY);
      } else {
        sticker.x = clamp(sticker.x * scaleX, bounds.minX, bounds.maxX);
        sticker.y = clamp(sticker.y * scaleY, bounds.minY, bounds.maxY);
      }
      sticker.el.style.width = `${sticker.w}px`;
      sticker.el.style.height = `${sticker.h}px`;
      if (sticker.shadow) {
        sticker.shadow.style.width = `${sticker.w}px`;
        sticker.shadow.style.height = `${sticker.h}px`;
      }
      render(sticker);
    });

    zoneSize = { width: rect.width, height: rect.height };
  }

  function removeSticker(sticker) {
    const index = stickers.indexOf(sticker);
    if (index === -1) return;
    stickers.splice(index, 1);
    sticker.idleTween?.kill();
    sticker.idleRestartCall?.kill();
    sticker.popTween?.kill();
    sticker.flight?.kill();
    sticker.liftTween?.kill();
    sticker.joltTween?.kill();
    sticker.shadow?.remove();
    if (hovered === sticker) hovered = null;
    gsap.killTweensOf(sticker.img);
    sticker.eyes?.destroy();
    picker.release(sticker.source);
    if (activeDrag?.sticker === sticker) activeDrag = null;

    if (reducedMotion) {
      sticker.el.remove();
      return;
    }

    gsap.to(sticker.img, {
      scale: 0.6,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => sticker.el.remove(),
    });
  }

  // Sticker in de zone zetten: midden (x, y), draaiing in graden. extra: factor (maat), spot/nudge (plek aan de kop)
  function addSticker(source, made, w, x, y, angle, extra = {}) {
    // img heet zo omdat het meestal een <img> is; bij de ogen is het een div met de SVG
    const { face: img, ratio, eyes } = made;
    const h = w * ratio;
    const sticker = {
      el: document.createElement("div"),
      img,
      eyes,
      source,
      x: x - w / 2,
      y: y - h / 2,
      w,
      h,
      ratio,
      angle,
      factor: extra.factor || 1,
      spot: extra.spot || null,
      nudge: extra.nudge || { x: 0, y: 0 },
      moved: false,
      lift: 1, tiltX: 0, tiltY: 0, mtX: 0, mtY: 0, swing: 0, jx: 0, jy: 0, jr: 0,
      shadow: null,
      flying: false,
      rest: null,
    };
    if (pointerField) {
      sticker.pointerToX = gsap.quickTo(img, "x", { duration: 0.48, ease: "power3.out" });
      sticker.pointerToY = gsap.quickTo(img, "y", { duration: 0.48, ease: "power3.out" });
      sticker.pointerToRotation = gsap.quickTo(img, "rotation", { duration: 0.48, ease: "power3.out" });
      // quickTo kan "scale" niet resetten (GSAP splitst die in scaleX/scaleY), dus beide apart
      const pointerToScaleX = gsap.quickTo(img, "scaleX", { duration: 0.48, ease: "power3.out" });
      const pointerToScaleY = gsap.quickTo(img, "scaleY", { duration: 0.48, ease: "power3.out" });
      sticker.pointerToScale = (value) => { pointerToScaleX(value); pointerToScaleY(value); };
    }

    sticker.el.className = "sticker-board__sticker";
    sticker.el.setAttribute("data-sticker-board-item", "");
    sticker.el.setAttribute("role", "button");
    sticker.el.setAttribute("aria-label", "Sticker verplaatsen met de pijltjestoetsen");
    sticker.el.tabIndex = 0;
    sticker.el.style.width = `${w}px`;
    sticker.el.style.height = `${h}px`;
    sticker.el.style.zIndex = String(nextZIndex++);
    sticker.el.appendChild(img);
    zone.appendChild(sticker.el);

    stickers.push(sticker);
    render(sticker);

    if (!reducedMotion) {
      sticker.popTween = gsap.fromTo(img, { scale: 0.72, rotate: -7 }, {
        scale: 1,
        rotate: 0,
        duration: 0.5,
        ease: POP_EASE,
        onComplete: () => {
          sticker.popTween = null;
          if (pointerInside && pointerPosition) applyPointerField(pointerPosition.x, pointerPosition.y);
          else startIdle(sticker);
        },
      });
    }
    return sticker;
  }

  async function makeFace(source) {
    let made;
    try { made = await createStickerFace(source); } catch (error) { picker.release(source); return null; }
    if (!zone._stickerDestroy) { made.eyes?.destroy(); picker.release(source); return null; }
    return made;
  }

  // Uit het plan (zie planHeadingStickers / planBandStickers)
  async function spawnPlanned(p) {
    if (!zone._stickerDestroy) return;
    const made = await makeFace(p.source);
    if (made) addSticker(p.source, made, p.w, p.x, p.y, p.rot, p);
  }

  // Alleen met data-sticker-spawn: een bezoeker plakt er zelf een (icoontjes eerst)
  async function spawn(centerX, centerY, automatic = false) {
    if (!zone._stickerDestroy) return;
    const source = picker.pick(["icoon", "any"]);
    if (!source) return;
    const made = await makeFace(source);
    if (!made) return;
    const factor = stickerSizeFactor(source);
    const w = stickerWidth() * factor;
    const h = w * made.ratio;
    const position = findStickerSpawnPosition(zone, w, h, {
      x: centerX,
      y: centerY,
      automatic,
      maxRotation: Math.PI / 15,
      minimumClearance: 24,
    });
    if (!position) { made.eyes?.destroy(); picker.release(source); return; }
    addSticker(source, made, w, position.x, position.y, STICKER_BAND_LOOKS[stickers.length % STICKER_BAND_LOOKS.length].rot + stickerJitter(2), { factor });
    // De oudste popt weg, maar de ogen blijven
    if (stickers.length > maxCount) removeSticker(stickers.find((item) => !item.eyes) || stickers[0]);
  }

  function maybeSpawnFromCursor(event) {
    if (spawnMode !== "cursor" || event.pointerType !== "mouse" || event.buttons || activeDrag) return;
    if (event.target.closest("[data-sticker-board-item], a, button, input, textarea, select, label")) return;
    if (cursorSpawnPending) return;

    const rect = zone.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const minimumDistance = Number.isFinite(spawnDistance) && spawnDistance > 0
      ? spawnDistance
      : stickerWidth() * 1.8;
    const now = performance.now();
    if (lastCursorSpawn && Math.hypot(point.x - lastCursorSpawn.x, point.y - lastCursorSpawn.y) < minimumDistance) return;
    if (now - lastCursorSpawnAt < 360) return;
    if (isStickerTextPoint(zone, event.clientX, event.clientY)) return;

    lastCursorSpawn = point;
    lastCursorSpawnAt = now;
    cursorSpawnPending = true;
    spawn(point.x, point.y).finally(() => { cursorSpawnPending = false; });
  }

  function onClick(event) {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    // Touch heeft geen cursor om stickers mee te strooien: daar plakt een tik op een lege plek er een
    if (spawnMode !== "click" && !(spawnMode === "cursor" && lastPointerType !== "mouse")) return;
    if (event.target.closest("[data-sticker-board-item], a, button, input, textarea, select, label") || isStickerTextPoint(zone, event.clientX, event.clientY)) return;
    const rect = zone.getBoundingClientRect();
    spawn(event.clientX - rect.left, event.clientY - rect.top);
  }

  // Touch: tikken = opspringen, vasthouden (0,3 s) = oppakken, vegen = gewoon scrollen.
  // Zo blokkeert een duim die op een sticker begint nooit het scrollen.
  let lastPointerType = "mouse";
  let press = null;
  const PRESS_SLOP = 10;

  function hop(sticker) {
    if (reducedMotion) return;
    sticker.flight?.kill();
    sticker.liftTween?.kill();
    sticker.idleTween?.kill();
    sticker.idleTween = null;
    ensureShadow(sticker);
    toTop(sticker);
    sticker.flying = true;
    const side = Math.random() < 0.5 ? -1 : 1;
    sticker.eyes?.startle();
    sticker.flight = gsap.timeline({
      onUpdate: () => render(sticker),
      onComplete: () => {
        sticker.flying = false;
        sticker.flight = null;
        startIdle(sticker);
      },
    })
      .to(sticker, { lift: 1.16, swing: side * 9, duration: 0.18, ease: "power2.out" })
      .to(sticker, { lift: 0.94, swing: 0, duration: 0.12, ease: "power2.in" })
      .call(() => thud(sticker))
      .to(sticker, { lift: 1, duration: 0.5, ease: "elastic.out(1, 0.42)" });
  }

  function cancelPress() {
    press?.timer.kill();
    press = null;
  }

  function onPointerDown(event) {
    lastPointerType = event.pointerType;
    const el = event.target.closest("[data-sticker-board-item]");
    if (!el || event.button !== 0) return;
    const sticker = stickers.find((item) => item.el === el);
    if (!sticker) return;

    suppressNextClick = true;
    if (event.pointerType !== "mouse") {
      cancelPress();
      press = {
        sticker,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        last: event,
        timer: gsap.delayedCall(0.3, () => {
          if (!press) return;
          const { last } = press;
          press = null;
          navigator.vibrate?.(8);
          beginDrag(sticker, last);
        }),
      };
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    beginDrag(sticker, event);
  }

  function beginDrag(sticker, event) {
    if (!sticker.el.isConnected) return;
    sticker.idleTween?.kill();
    sticker.idleTween = null;
    sticker.idleRestartCall?.kill();
    sticker.popTween?.kill();
    sticker.popTween = null;
    sticker.pointerToX?.(0);
    sticker.pointerToY?.(0);
    sticker.pointerToRotation?.(0);
    sticker.pointerToScale?.(1);
    // Halverwege een worp weer gepakt: vanaf waar hij nu is
    const wasFlying = sticker.flying;
    sticker.flight?.kill();
    sticker.flight = null;
    sticker.flying = false;
    sticker.liftTween?.kill();
    sticker.joltTween?.kill();
    sticker.jx = sticker.jy = sticker.jr = 0;
    ensureShadow(sticker);
    toTop(sticker);
    sticker.el.classList.add("is-dragging");

    const rect = zone.getBoundingClientRect();
    const cx = rect.left + sticker.x + sticker.w / 2;
    const cy = rect.top + sticker.y + sticker.h / 2;
    // Waar je hem vastpakt, -1 tot 1: die kant komt los van het papier
    const nx = clamp((event.clientX - cx) / (sticker.w / 2), -1, 1);
    const ny = clamp((event.clientY - cy) / (sticker.h / 2), -1, 1);
    activeDrag = {
      sticker,
      pointerId: event.pointerId,
      offsetX: event.clientX - cx,
      offsetY: event.clientY - cy,
      tx: sticker.x,
      ty: sticker.y,
      swingV: 0,
      samples: [{ x: event.clientX, y: event.clientY, t: performance.now() }],
      // Laatste plek waar hij vrij lag, voor als er bij het loslaten nergens plek is
      home: wasFlying && sticker.rest ? sticker.rest : { x: sticker.x, y: sticker.y, angle: sticker.angle },
    };
    try { zone.setPointerCapture(event.pointerId); } catch (e) { /* vinger al los */ }

    if (!reducedMotion) {
      sticker.liftTween = gsap.to(sticker, {
        lift: 1.12,
        tiltX: ny * 16,
        tiltY: -nx * 16,
        duration: 0.34,
        ease: "back.out(2.2)",
        onUpdate: () => render(sticker),
      });
      gsap.ticker.add(dragTick);
    }
    sticker.eyes?.shock();
  }

  function onPointerMove(event) {
    if (press && press.pointerId === event.pointerId) {
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > PRESS_SLOP) cancelPress();
      else press.last = event;
      return;
    }
    if (activeDrag && activeDrag.pointerId === event.pointerId) {
      event.preventDefault();

      // In de lucht mag hij over tekst heen; pas bij het neerleggen moet hij vrij liggen
      const d = activeDrag;
      const rect = zone.getBoundingClientRect();
      const sticker = d.sticker;
      const bounds = getPositionBounds(sticker, rect);
      d.tx = clamp(event.clientX - rect.left - d.offsetX - sticker.w / 2, bounds.minX, bounds.maxX);
      d.ty = clamp(event.clientY - rect.top - d.offsetY - sticker.h / 2, bounds.minY, bounds.maxY);
      d.samples.push({ x: event.clientX, y: event.clientY, t: performance.now() });
      if (d.samples.length > 8) d.samples.shift();
      if (reducedMotion) {
        sticker.x = d.tx;
        sticker.y = d.ty;
        render(sticker);
      }
    } else if (event.pointerType === "mouse" && !event.buttons) {
      const over = event.target.closest?.("[data-sticker-board-item]");
      setHover(over ? stickers.find((item) => item.el === over) || null : null);
    }

    if (event.pointerType === "mouse") {
      applyPointerField(event.clientX, event.clientY);
      maybeSpawnFromCursor(event);
    }
  }

  function onPointerLeave() {
    if (!activeDrag) setHover(null);
    if (!activeDrag && pointerInside) resetPointerField();
  }

  function finishDrag(event) {
    if (press && press.pointerId === event.pointerId) {
      const { sticker } = press;
      cancelPress();
      if (event.type === "pointerup") hop(sticker);
      return;
    }
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
    const d = activeDrag;
    const sticker = d.sticker;
    activeDrag = null;
    gsap.ticker.remove(dragTick);
    sticker.liftTween?.kill();
    sticker.el.classList.remove("is-dragging");
    sticker.eyes?.calm();
    setTimeout(() => { suppressNextClick = false; }, 0);
    if (zone.hasPointerCapture(event.pointerId)) zone.releasePointerCapture(event.pointerId);

    // Gooisnelheid uit de laatste ~100 ms (px per ms); stilgehouden voor het loslaten = gewoon neerleggen
    const now = performance.now();
    const recent = d.samples.filter((p) => now - p.t < 100);
    let vx = 0;
    let vy = 0;
    if (recent.length >= 2) {
      const a = recent[0];
      const b = recent[recent.length - 1];
      const dt = Math.max(16, b.t - a.t);
      vx = (b.x - a.x) / dt;
      vy = (b.y - a.y) / dt;
    }

    if (reducedMotion) {
      sticker.moved = true;
      sticker.x = d.tx;
      sticker.y = d.ty;
      if (!findStickerSpawnPosition(zone, sticker.w, sticker.h, { x: sticker.x + sticker.w / 2, y: sticker.y + sticker.h / 2, maxRotation: Math.abs(sticker.angle * Math.PI / 180), minimumClearance: 24, ignoreElement: sticker.el, cachedBlockedRects: getStickerBlockedRects(zone, zone.getBoundingClientRect(), heading) })) {
        sticker.x = d.home.x;
        sticker.y = d.home.y;
      }
      render(sticker);
      return;
    }
    land(sticker, vx, vy, d.home);
  }

  function onKeyDown(event) {
    const el = event.target.closest("[data-sticker-board-item]");
    if (!el || !event.key.startsWith("Arrow")) return;
    const sticker = stickers.find((item) => item.el === el);
    if (!sticker) return;

    event.preventDefault();
    const rect = zone.getBoundingClientRect();
    const distance = event.shiftKey ? 24 : 8;
    let proposedX = sticker.x;
    let proposedY = sticker.y;
    if (event.key === "ArrowLeft") proposedX -= distance;
    if (event.key === "ArrowRight") proposedX += distance;
    if (event.key === "ArrowUp") proposedY -= distance;
    if (event.key === "ArrowDown") proposedY += distance;
    const bounds = getPositionBounds(sticker, rect);
    const nextX = clamp(proposedX, bounds.minX, bounds.maxX);
    const nextY = clamp(proposedY, bounds.minY, bounds.maxY);
    // De kop telt niet mee: daar horen ze juist op te plakken
    const safePosition = findStickerSpawnPosition(zone, sticker.w, sticker.h, {
      x: nextX + sticker.w / 2,
      y: nextY + sticker.h / 2,
      maxRotation: Math.abs(sticker.angle * Math.PI / 180),
      minimumClearance: 24,
      ignoreElement: sticker.el,
      cachedBlockedRects: getStickerBlockedRects(zone, rect, heading),
    });
    if (!safePosition) return;
    sticker.moved = true;
    sticker.x = safePosition.x - sticker.w / 2;
    sticker.y = safePosition.y - sticker.h / 2;
    toTop(sticker);
    render(sticker);
  }

  // De vaste compositie: eerst de kop laten landen, dan de stickers erop plakken, één voor één
  async function spawnStartSet() {
    if (spawnedStart) return;
    spawnedStart = true;
    const cap = stickerCount(heading ? 5 : 8);
    const count = Math.min(Number.isNaN(startCount) ? cap : startCount, cap);
    if (!(count > 0)) return;
    // Vorm telt bij tekststickers en foto's; icoontjes pas meten als er een gekozen wordt
    await loadStickerRatios(sources.filter((source) => source.kind !== "icoon"));
    if (heading) await stickerHeadingSettled(heading);
    if (!zone._stickerDestroy) return;
    const plan = heading
      ? await planHeadingStickers(zone, heading, picker, stickerWidth(), count)
      : await planBandStickers(zone, picker, stickerWidth(), count);
    if (!zone._stickerDestroy) return;
    plan.forEach((p, i) => introCalls.push(gsap.delayedCall(0.1 + i * 0.14, () => spawnPlanned(p))));
  }

  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) spawnStartSet();
  }, { threshold: 0.25 });
  // Buiten beeld wiebelt er niets: anders rekent elke sticker elke frame door
  const visibilityIO = new IntersectionObserver(([entry]) => {
    zoneVisible = entry.isIntersecting;
    stickers.forEach((sticker) => sticker.idleTween?.paused(!zoneVisible));
  });
  visibilityIO.observe(zone);
  const ro = new ResizeObserver(updateZoneSize);

  zoneSize = { width: zone.getBoundingClientRect().width, height: zone.getBoundingClientRect().height };
  zone.addEventListener("click", onClick);
  zone.addEventListener("pointerdown", onPointerDown);
  zone.addEventListener("pointermove", onPointerMove);
  zone.addEventListener("pointerleave", onPointerLeave);
  zone.addEventListener("pointerup", finishDrag);
  zone.addEventListener("pointercancel", finishDrag);
  zone.addEventListener("keydown", onKeyDown);
  // Sticker in je hand: de pagina scrolt niet mee. Anders altijd gewoon scrollen.
  const onTouchMove = (event) => { if (activeDrag && event.cancelable) event.preventDefault(); };
  const onContextMenu = (event) => { if (activeDrag || press) event.preventDefault(); };
  zone.addEventListener("touchmove", onTouchMove, { passive: false });
  zone.addEventListener("contextmenu", onContextMenu);

  zone._stickerDestroy = () => {
    io.disconnect();
    visibilityIO.disconnect();
    ro.disconnect();
    introCalls.forEach((call) => call.kill());
    if (activeDrag && zone.hasPointerCapture(activeDrag.pointerId)) {
      zone.releasePointerCapture(activeDrag.pointerId);
    }
    zone.removeEventListener("click", onClick);
    zone.removeEventListener("pointerdown", onPointerDown);
    zone.removeEventListener("pointermove", onPointerMove);
    zone.removeEventListener("pointerleave", onPointerLeave);
    zone.removeEventListener("pointerup", finishDrag);
    zone.removeEventListener("pointercancel", finishDrag);
    zone.removeEventListener("keydown", onKeyDown);
    zone.removeEventListener("touchmove", onTouchMove);
    zone.removeEventListener("contextmenu", onContextMenu);
    cancelPress();
    gsap.ticker.remove(dragTick);
    stickers.forEach((sticker) => {
      sticker.idleTween?.kill();
      sticker.idleRestartCall?.kill();
      sticker.popTween?.kill();
      sticker.flight?.kill();
      sticker.liftTween?.kill();
      sticker.joltTween?.kill();
      gsap.killTweensOf(sticker.img);
      sticker.eyes?.destroy();
      sticker.shadow?.remove();
      sticker.el.remove();
    });
    stickers.length = 0;
    zone._stickerDestroy = null;
  };

  ro.observe(zone);
  io.observe(zone);
}

function initStickerZone(zone, Matter) {
  if (zone._stickerDestroy || !zone.isConnected) return;

  const sources = getStickerSources();
  if (!sources.length) return;

  const { Engine, Bodies, Composite, Body } = Matter;
  const startCount = stickerCount(parseInt(zone.getAttribute("data-sticker-count"), 10));
  const maxCount = stickerCount(parseInt(zone.getAttribute("data-sticker-max"), 10) || 24);
  const sizeRem = parseFloat(zone.getAttribute("data-sticker-size")) || 6;
  // Bezoekers gooien en duwen, ze maken er geen bij (tenzij de zone dat met data-sticker-spawn vraagt)
  const spawnMode = zone.getAttribute("data-sticker-spawn") || "none";
  const spawnDistance = parseFloat(zone.getAttribute("data-sticker-spawn-distance"));

  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = reducedMotion ? 0 : 1;


  const stickers = [];
  const picker = createStickerPicker(zone, sources);
  let statics = [];
  let running = false;
  let inViewNow = false;
  let lastCursorSpawn = null;
  let lastCursorSpawnAt = 0;
  let cursorSpawnPending = false;

  const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const stickerWidth = () => sizeRem * remPx() * stickerSizeScale();

  // Vloer, wanden en tekst als statische bodies, in zone-coördinaten
  // Inline SVG-colliders gebruiken benaderde lijnsegmenten langs de SVG-paden,
  // zodat stickers op de logo-vorm landen in plaats van op één grote rechthoek.
  function createSvgPathBodies(el, zr) {
    const plan = svgColliderPlan(el);
    if (!plan) return [];
    const { prepared, samplePx } = plan;
    const thickness = Math.max(6, Math.min(12, samplePx * 0.75));
    const bodies = [];

    prepared.forEach(({ path, length, matrix, scale }) => {
      const step = samplePx / scale;
      let previous = null;
      // Punten in de eigen coördinaten van het pad: die veranderen niet bij scrollen, dus eenmalig meten
      const pts = samplePath(path, length, step);
      const sampleCount = pts.length / 2 - 1;

      for (let i = 0; i <= sampleCount; i++) {
        const point = { x: pts[i * 2], y: pts[i * 2 + 1] };
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

  // Alleen opnieuw opbouwen (en de stickers wakker maken) als er echt iets verschoven is. Anders gaan
  // liggende stickers bij elke keer terugscrollen opnieuw schuiven en lijkt het of ze zich verplaatsen.
  let staticsKey = "";
  function buildStatics({ wakeAll = true } = {}) {
    const zr = zone.getBoundingClientRect();
    const key = [zr.width, zr.height, ...[...zone.querySelectorAll("[data-sticker-collider]")].flatMap((el) => {
      const r = el.getBoundingClientRect();
      return [r.left - zr.left, r.top - zr.top, r.width, r.height];
    })].map((v) => Math.round(v / 3)).join(",");
    if (key === staticsKey) return;
    staticsKey = key;
    Composite.remove(engine.world, statics);
    const t = 200;
    statics = [
      Bodies.rectangle(zr.width / 2, zr.height + t / 2, zr.width * 3, t, { isStatic: true }),
      // Plafond: een omhoog gegooide sticker kaatst terug in plaats van uit beeld te verdwijnen
      Bodies.rectangle(zr.width / 2, -t / 2, zr.width * 3, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, zr.height / 2, t, zr.height * 4, { isStatic: true }),
      Bodies.rectangle(zr.width + t / 2, zr.height / 2, t, zr.height * 4, { isStatic: true }),
    ];
    zone.querySelectorAll("[data-sticker-collider]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const pathBodies = stickerIsWordmark(el) ? createSvgPathBodies(el, zr) : [];
      if (pathBodies.length) {
        statics.push(...pathBodies);
      } else if (el.matches(STICKER_TEXT_COLLIDER) && Math.abs(getElementRotation(el).angle) < 0.01) {
        // Kop of alinea: elke regel apart, zodat stickers op de letters liggen (en op de schouders
        // waar een regel uitsteekt) in plaats van op de onzichtbare rand van het blok
        stickerTextLines(el, zr).forEach((l) => statics.push(Bodies.rectangle(
          (l.left + l.right) / 2, (l.top + l.bottom) / 2, l.w, l.h,
          { isStatic: true, friction: 0.8, chamfer: { radius: Math.min(8, l.h / 3) } }
        )));
      } else {
        // Gedraaide kaart (Webflow-transform of rotate): de echte, schuine rechthoek als collider,
        // anders blijven stickers op de onzichtbare hoeken van de bounding box liggen.
        const { angle, scale } = getElementRotation(el);
        const w = el.offsetWidth ? el.offsetWidth * scale : r.width;
        const h = el.offsetHeight ? el.offsetHeight * scale : r.height;
        statics.push(Bodies.rectangle(
          r.left - zr.left + r.width / 2,
          r.top - zr.top + r.height / 2,
          w, h,
          { isStatic: true, angle, chamfer: { radius: Math.min(12, h / 2) } }
        ));
      }
    });
    Composite.add(engine.world, statics);
    // Na een maatwijziging alles opnieuw laten zakken; bij terugscrollen niet: wat ligt, blijft liggen
    if (wakeAll) stickers.forEach((s) => Matter.Sleeping.set(s.body, false));
  }

  function removeSticker(s) {
    if (held?.s === s) held = null;
    Composite.remove(engine.world, s.body);
    stickers.splice(stickers.indexOf(s), 1);
    s.eyes?.destroy();
    picker.release(s.source);
    gsap.to(s.img, { scale: 0, rotation: "+=" + rnd(-30, 30), duration: 0.3, ease: "back.in(2)", onComplete: () => s.el.remove() });
  }

  // Sticker als body in de wereld: midden (x, y), hoek in radialen
  function addBody(source, made, w, x, y, angle, calm = false) {
    const { face: img, ratio, eyes } = made;
    const h = w * ratio;
    const el = document.createElement("div");
    el.className = "sticker-zone__sticker";
    el.style.width = w + "px";
    el.style.height = h + "px";
    el.appendChild(img);
    zone.appendChild(el);

    const body = Bodies.rectangle(x, y, w * 0.96, h * 0.96, {
      chamfer: { radius: Math.min(w, h) * 0.08 },
      // Neergelegd (de compositie) stuitert minder dan wat een bezoeker gooit
      restitution: calm ? 0.25 : 0.45,
      friction: calm ? 0.5 : 0.3,
      frictionAir: 0.01,
      angle,
    });
    Body.setAngularVelocity(body, calm ? rnd(-0.015, 0.015) : rnd(-0.08, 0.08));
    Composite.add(engine.world, body);

    const s = { el, img, body, w, h, eyes, source };
    stickers.push(s);
    render(s);

    // Pop: schaal op de img, de wrapper is van de physics
    if (!reducedMotion) gsap.fromTo(img, { scale: 0 }, { scale: 1, duration: 0.5, ease: POP_EASE });
    start();
    return s;
  }

  async function makeFace(source) {
    let made;
    try { made = await createStickerFace(source); } catch (e) { picker.release(source); return null; }
    if (!zone._stickerDestroy) { made.eyes?.destroy(); picker.release(source); return null; }
    return made;
  }

  // Uit het plan (zie planDropStickers)
  async function dropPlanned(p) {
    if (!zone._stickerDestroy) return;
    const made = await makeFace(p.source);
    if (made) addBody(p.source, made, p.w, p.x, p.y, p.rot * Math.PI / 180, true);
  }

  // Alleen met data-sticker-spawn: een bezoeker laat er zelf een vallen (icoontjes eerst)
  async function spawn(x, y, automatic = false) {
    if (!zone._stickerDestroy) return;
    const source = picker.pick(["icoon", "any"]);
    if (!source) return;
    const made = await makeFace(source);
    if (!made) return;
    const w = stickerWidth() * stickerSizeFactor(source);
    const h = w * made.ratio;

    // Eerst een vrije plek. Op een klein scherm staat bijna overal tekst: lukt het niet, dan mag hij
    // boven tekst starten (hij valt toch naar beneden)
    const spawnAt = (ignoreText) => findStickerSpawnPosition(zone, w, h, { x, y, automatic, autoTopRatio: 0.58, maxRotation: 0.4, ignoreText });
    const position = spawnAt(false) || (automatic && stickerCompact() ? spawnAt(true) : null);
    if (!position) { made.eyes?.destroy(); picker.release(source); return; }
    addBody(source, made, w, position.x, position.y, rnd(-0.2, 0.2));
    if (stickers.length > maxCount) removeSticker(stickers.find((item) => !item.eyes) || stickers[0]);
  }

  function maybeSpawnFromCursor(event) {
    if (zone._stickerHold || spawnMode !== "cursor" || event.pointerType !== "mouse" || event.buttons || !inViewNow) return;
    if (event.target.closest("a, button, input, textarea, select, label")) return;
    if (cursorSpawnPending) return;

    const rect = zone.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const minimumDistance = Number.isFinite(spawnDistance) && spawnDistance > 0
      ? spawnDistance
      : stickerWidth() * 1.8;
    const now = performance.now();
    if (lastCursorSpawn && Math.hypot(point.x - lastCursorSpawn.x, point.y - lastCursorSpawn.y) < minimumDistance) return;
    if (now - lastCursorSpawnAt < 360) return;
    if (isStickerTextPoint(zone, event.clientX, event.clientY)) return;

    lastCursorSpawn = point;
    lastCursorSpawnAt = now;
    cursorSpawnPending = true;
    spawn(point.x, point.y).finally(() => { cursorSpawnPending = false; });
  }

  function render(s) {
    const { x, y } = s.body.position;
    s.el.style.transform = `translate(${x - s.w / 2}px, ${y - s.h / 2}px) rotate(${s.body.angle}rad)`;
  }

  // Matter wil stappen van max ~16.7ms: lange frames (120Hz-wissels, haperende tab)
  // in gelijke substappen hakken, zodat stickers niet door een collider schieten.
  function tick() {
    steerHeld();
    // Alles ligt stil (Matter-sleeping): niet rekenen en geen transforms schrijven.
    // Spawnen en wegslaan maken bodies wakker, dan loopt hij weer.
    if (stickers.every((s) => s.body.isSleeping)) return;
    const dt = Math.min(gsap.ticker.deltaRatio(60) * (1000 / 60), 50);
    const steps = Math.max(1, Math.ceil(dt / (1000 / 60)));
    for (let i = 0; i < steps; i++) Engine.update(engine, dt / steps);
    stickers.forEach(render);
    // Ogen die vallen of rollen blijven naar de cursor kijken
    if (eyesPointer) stickers.forEach((s) => { if (s.eyes && !s.body.isSleeping) s.eyes.lookAt(eyesPointer.x, eyesPointer.y); });
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

  // Pakken en gooien. Opgetild hangt hij boven alles (sensor: botst nergens tegen),
  // je trekt hem met wat vertraging mee en hij slingert mee. Loslaten = gooien met je eigen snelheid.
  let held = null;
  let suppressClick = false;
  function stickerAt(clientX, clientY) {
    const zr = zone.getBoundingClientRect();
    const hit = Matter.Query.point(stickers.map((s) => s.body), { x: clientX - zr.left, y: clientY - zr.top })[0];
    return hit ? stickers.find((s) => s.body === hit) : null;
  }

  function steerHeld() {
    if (!held) return;
    const b = held.s.body;
    Matter.Sleeping.set(b, false);
    const vx = (held.tx - b.position.x) * 0.3;
    const vy = (held.ty - b.position.y) * 0.3;
    Body.setVelocity(b, { x: vx, y: vy });
    const targetAngle = held.a0 + Math.max(-0.45, Math.min(0.45, vx * 0.035));
    Body.setAngularVelocity(b, (targetAngle - b.angle) * 0.2);
  }

  // Touch: tikken = wegschieten, vasthouden (0,3 s) = oppakken, vegen = gewoon scrollen
  let lastPointerType = "mouse";
  let press = null;
  function cancelPress() {
    press?.timer.kill();
    press = null;
  }
  function flick(s) {
    Matter.Sleeping.set(s.body, false);
    Body.setVelocity(s.body, { x: s.body.velocity.x + rnd(-2.5, 2.5), y: -rnd(9, 13) });
    Body.setAngularVelocity(s.body, rnd(-0.25, 0.25));
    gsap.fromTo(s.img, { scale: 1.15 }, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.45)", overwrite: "auto" });
    s.eyes?.startle();
    start();
  }

  function onPointerDown(event) {
    lastPointerType = event.pointerType;
    if (event.button !== 0 || reducedMotion || !inViewNow || zone._stickerHold) return;
    if (event.target.closest("a, button, input, textarea, select, label")) return;
    const s = stickerAt(event.clientX, event.clientY);
    if (!s) return;
    suppressClick = true;
    if (event.pointerType !== "mouse") {
      cancelPress();
      press = {
        s,
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        last: event,
        timer: gsap.delayedCall(0.3, () => {
          if (!press) return;
          const { last } = press;
          press = null;
          if (!stickers.includes(s)) return;
          navigator.vibrate?.(8);
          grab(s, last);
        }),
      };
      return;
    }
    event.preventDefault();
    grab(s, event);
  }

  function grab(s, event) {
    const zr = zone.getBoundingClientRect();
    const px = event.clientX - zr.left;
    const py = event.clientY - zr.top;
    held = {
      s,
      pointerId: event.pointerId,
      ox: px - s.body.position.x,
      oy: py - s.body.position.y,
      tx: s.body.position.x,
      ty: s.body.position.y,
      a0: s.body.angle,
      samples: [{ x: event.clientX, y: event.clientY, t: performance.now() }],
    };
    s.body.isSensor = true;
    try { zone.setPointerCapture(event.pointerId); } catch (e) { /* vinger al los */ }
    s.el.classList.add("is-held");
    zone.classList.add("is-holding-sticker");
    gsap.to(s.img, { scale: 1.12, duration: 0.32, ease: "back.out(2.2)", overwrite: "auto" });
    s.eyes?.shock();
    start();
  }

  function releaseHeld(event) {
    if (press && press.pointerId === event.pointerId) {
      const { s } = press;
      cancelPress();
      if (event.type === "pointerup" && stickers.includes(s)) flick(s);
      return;
    }
    if (!held || held.pointerId !== event.pointerId) return;
    const { s, samples } = held;
    held = null;
    if (zone.hasPointerCapture(event.pointerId)) zone.releasePointerCapture(event.pointerId);
    setTimeout(() => { suppressClick = false; }, 0);
    const now = performance.now();
    const recent = samples.filter((p) => now - p.t < 100);
    let vx = 0;
    let vy = 0;
    if (recent.length >= 2) {
      const a = recent[0];
      const b = recent[recent.length - 1];
      const dt = Math.max(16, b.t - a.t);
      // px per ms → Matter-snelheid (px per stap van 16,7 ms)
      vx = ((b.x - a.x) / dt) * 16.7;
      vy = ((b.y - a.y) / dt) * 16.7;
      const speed = Math.hypot(vx, vy);
      if (speed > 26) { vx = (vx / speed) * 26; vy = (vy / speed) * 26; }
    }
    s.body.isSensor = false;
    Matter.Sleeping.set(s.body, false);
    Body.setVelocity(s.body, { x: vx, y: vy });
    Body.setAngularVelocity(s.body, Math.max(-0.3, Math.min(0.3, vx * 0.012)));
    s.el.classList.remove("is-held");
    zone.classList.remove("is-holding-sticker");
    gsap.to(s.img, { scale: 1, duration: 0.55, ease: "elastic.out(1, 0.45)", overwrite: "auto" });
    s.eyes?.calm();
    start();
  }

  // Hard scrollen = tegen de tafel stoten: wat stilligt springt even op
  let lastHop = 0;
  function onScrollJolt() {
    if (!running || reducedMotion || zone._stickerHold || !lenis) return;
    const v = Math.abs(lenis.velocity);
    if (v < 30) return;
    const now = performance.now();
    if (now - lastHop < 450) return;
    lastHop = now;
    const power = Math.min(1, (v - 24) / 50);
    stickers.forEach((s) => {
      if (held?.s === s) return;
      Matter.Sleeping.set(s.body, false);
      Body.setVelocity(s.body, { x: s.body.velocity.x + rnd(-1.6, 1.6) * power, y: s.body.velocity.y - (2.5 + rnd(2, 5.5) * power) });
      Body.setAngularVelocity(s.body, s.body.angularVelocity + rnd(-0.08, 0.08) * power);
    });
  }
  lenis?.on("scroll", onScrollJolt);

  const swatEnabled = zone.getAttribute("data-sticker-swat") !== "false";
  let lastPointer = null;

  function onPointerMove(event) {
    if (press && press.pointerId === event.pointerId) {
      if (Math.hypot(event.clientX - press.x, event.clientY - press.y) > 10) cancelPress();
      else press.last = event;
      return;
    }
    if (held && held.pointerId === event.pointerId) {
      const zr = zone.getBoundingClientRect();
      held.tx = Math.max(0, Math.min(zr.width, event.clientX - zr.left)) - held.ox;
      held.ty = Math.max(0, Math.min(zr.height, event.clientY - zr.top)) - held.oy;
      held.samples.push({ x: event.clientX, y: event.clientY, t: performance.now() });
      if (held.samples.length > 8) held.samples.shift();
      return;
    }
    if (event.pointerType === "mouse" && !event.buttons && !reducedMotion) {
      zone.classList.toggle("is-over-sticker", !zone._stickerHold && !!stickerAt(event.clientX, event.clientY));
    }
    maybeSpawnFromCursor(event);
    if (!swatEnabled || reducedMotion || !inViewNow || event.pointerType !== "mouse" || event.buttons) {
      lastPointer = null;
      return;
    }

    const zoneRect = zone.getBoundingClientRect();
    const pointer = { x: event.clientX - zoneRect.left, y: event.clientY - zoneRect.top };
    const previous = lastPointer;
    lastPointer = pointer;
    if (!previous) return;

    const moveX = pointer.x - previous.x;
    const moveY = pointer.y - previous.y;
    const movement = Math.hypot(moveX, moveY);
    if (movement < 2) return;

    const radius = Math.max(128, stickerWidth() * 1.45);
    const now = performance.now();
    stickers.forEach((sticker) => {
      // Veeg je over de ogen heen, dan schrikken ze
      if (sticker.eyes && Math.hypot(sticker.body.position.x - pointer.x, sticker.body.position.y - pointer.y) < Math.max(sticker.w, sticker.h) * 0.75) {
        sticker.eyes.startle();
      }
      if (now - (sticker.lastSwatAt || 0) < 220) return;

      const dx = sticker.body.position.x - pointer.x;
      const dy = sticker.body.position.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance >= radius) return;

      const awayX = distance > 0.001 ? dx / distance : moveX / movement;
      const awayY = distance > 0.001 ? dy / distance : moveY / movement;
      const proximity = 1 - distance / radius;
      const kick = Math.min(9, 2.5 + movement * 0.35) * proximity;
      let velocityX = sticker.body.velocity.x + awayX * kick;
      let velocityY = sticker.body.velocity.y + awayY * kick;
      const speed = Math.hypot(velocityX, velocityY);

      if (speed > 15) {
        velocityX = (velocityX / speed) * 15;
        velocityY = (velocityY / speed) * 15;
      }

      Matter.Sleeping.set(sticker.body, false);
      Body.setVelocity(sticker.body, { x: velocityX, y: velocityY });
      const spin = ((moveX * awayY - moveY * awayX) / movement) * 0.12 * proximity;
      Body.setAngularVelocity(sticker.body, Math.max(-0.18, Math.min(0.18, sticker.body.angularVelocity + spin)));
      sticker.lastSwatAt = now;
    });
  }

  function onPointerLeave() {
    lastPointer = null;
    zone.classList.remove("is-over-sticker");
  }

  function onClick(e) {
    if (suppressClick) { suppressClick = false; return; }
    // Touch heeft geen cursor: daar laat een tik op een lege plek een sticker vallen
    if (zone._stickerHold || (spawnMode !== "click" && !(spawnMode === "cursor" && lastPointerType !== "mouse"))) return;
    if (e.target.closest("a, button, input, textarea, select, label") || isStickerTextPoint(zone, e.clientX, e.clientY)) return;
    const zr = zone.getBoundingClientRect();
    spawn(e.clientX - zr.left, e.clientY - zr.top);
  }

  let spawnedStart = false;
  const introCalls = [];
  // De vaste compositie: elk op zijn eigen landingsplek, kort na elkaar
  async function spawnStartSet() {
    if (spawnedStart) return;
    spawnedStart = true;
    // Naar de vloer bij een kop of leeg vlak (werk-hero, 404): ruimte voor meer, standaard 8.
    // Op kaarten of een woordmerk (resultaten, footer): hooguit 4.
    const mode = stickerDropMode(zone);
    const roomy = mode === "floor" && ![...zone.querySelectorAll("[data-sticker-collider]")].some(stickerIsWordmark);
    const cap = stickerCount(roomy ? 12 : STICKER_DROP_LOOKS.length);
    const count = Math.min(isNaN(startCount) ? (roomy ? stickerCount(8) : cap) : startCount, cap);
    if (!(count > 0)) return;
    await loadStickerRatios(sources.filter((source) => source.kind !== "icoon"));
    if (!zone._stickerDestroy) return;
    let plan = mode === "floor" ? await planFloorStickers(zone, picker, stickerWidth(), count) : [];
    // Geen vrije plek bovenin (mobiel: overal tekst), of kaarten: dan erop
    if (!plan.length) plan = await planDropStickers(zone, picker, stickerWidth(), count);
    if (!zone._stickerDestroy) return;
    plan.forEach((p, i) => introCalls.push(gsap.delayedCall(p.delay ?? i * 0.18, () => dropPlanned(p))));
    // Tekst in de zone kan nog binnenkomen terwijl de stickers vallen: als die er staat de vloer en
    // de randen nog één keer meten, terwijl de stickers nog zakken. Daarna ligt alles echt stil.
    const last = Math.max(0, ...plan.map((p, i) => p.delay ?? i * 0.18));
    introCalls.push(gsap.delayedCall(last + 0.9, () => buildStatics()));
  }

  // Alleen rekenen als de zone in beeld is
  // Een scene (zie DONKERE SCENE) kan de zone vasthouden met zone._stickerHold tot de kaarten liggen
  function wake() {
    buildStatics({ wakeAll: false });
    start();
    spawnStartSet();
  }
  const io = new IntersectionObserver(([entry]) => {
    inViewNow = entry.isIntersecting;
    if (!inViewNow) stop();
    else if (!zone._stickerHold) wake();
  }, { threshold: 0.25 });
  io.observe(zone);
  zone._stickerRelease = () => {
    zone._stickerHold = false;
    if (inViewNow) wake();
  };

  let resizeTimer;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildStatics, 150);
  });
  ro.observe(zone);

  zone.addEventListener("click", onClick);
  zone.addEventListener("pointerdown", onPointerDown);
  zone.addEventListener("pointermove", onPointerMove);
  zone.addEventListener("pointerleave", onPointerLeave);
  zone.addEventListener("pointerup", releaseHeld);
  zone.addEventListener("pointercancel", releaseHeld);
  const onTouchMove = (event) => { if (held && event.cancelable) event.preventDefault(); };
  const onContextMenu = (event) => { if (held || press) event.preventDefault(); };
  zone.addEventListener("touchmove", onTouchMove, { passive: false });
  zone.addEventListener("contextmenu", onContextMenu);
  buildStatics();

  zone._stickerDestroy = () => {
    stop();
    io.disconnect();
    ro.disconnect();
    clearTimeout(resizeTimer);
    // Anders spawnen er na een paginawissel nog stickers in een opgeruimde engine
    introCalls.forEach((call) => call.kill());
    zone.removeEventListener("click", onClick);
    zone.removeEventListener("pointerdown", onPointerDown);
    zone.removeEventListener("pointermove", onPointerMove);
    zone.removeEventListener("pointerleave", onPointerLeave);
    zone.removeEventListener("pointerup", releaseHeld);
    zone.removeEventListener("pointercancel", releaseHeld);
    zone.removeEventListener("touchmove", onTouchMove);
    zone.removeEventListener("contextmenu", onContextMenu);
    cancelPress();
    lenis?.off("scroll", onScrollJolt);
    zone.classList.remove("is-over-sticker", "is-holding-sticker");
    held = null;
    stickers.forEach((s) => { s.eyes?.destroy(); s.el.remove(); });
    stickers.length = 0;
    Composite.clear(engine.world, false);
    Engine.clear(engine);
    zone._stickerDestroy = null;
    zone._stickerRelease = null;
  };
}

function destroyStickerZones(scope = document) {
  scope.querySelectorAll("[data-sticker-zone]").forEach((zone) => {
    zone._stickerPending?.disconnect();
    zone._stickerPending = null;
    zone._stickerDestroy?.();
  });
}

// ==========================================================
// ZWARTE SCENE — resultaten
// De zwarte sectie scrolt gewoon binnen, leeg. Pas als het hele scherm zwart is, blijft hij staan
// en komt de inhoud: de kop komt omhoog, elke scrollstap smijt een kaart op tafel (het getal telt op),
// dan de knop, en als de laatste kaart ligt vallen de stickers erop. Daarna scrolt hij gewoon weer weg.
//
// Op class (._100vh_sectie) of data-scene="dark"; data-scene="none" zet hem uit.
// Kaarten: .result of [data-scene-card]. Het eerste h1-h4 in een kaart telt op (data-count="false" niet).
// Past de inhoud niet in beeld (mobiel), dan blijft hij niet staan: zodra het scherm zwart is komt de kop
// en klappen de kaarten neer die in beeld staan, de rest zodra hij in beeld komt.
// ==========================================================

const SCENE_SELECTOR = '[data-scene="dark"], ._100vh_sectie';

function initDarkScenes(scope = document) {
  if (reducedMotion) return;
  scope.querySelectorAll(SCENE_SELECTOR).forEach((section) => {
    if (section._scene || section.getAttribute("data-scene") === "none") return;
    section._scene = createDarkScene(section);
  });
}

function destroyDarkScenes(scope = document) {
  scope.querySelectorAll(SCENE_SELECTOR).forEach((section) => {
    section._scene?.destroy();
    section._scene = null;
  });
}

// Bij een paginawissel: de pin laten staan waar hij staat, de scroll-reset mag hem niet meer verplaatsen
function freezeDarkScenes(scope = document) {
  scope.querySelectorAll(SCENE_SELECTOR).forEach((section) => section._scene?.freeze());
}

function countUp(el) {
  if (!el || el.getAttribute("data-count") === "false") return null;
  const text = el._countText ?? (el._countText = el.textContent);
  const m = text.match(/^(\D*?)(\d+(?:[.,]\d+)?)([\s\S]*)$/);
  if (!m) return null;
  const [, pre, num, post] = m;
  const decimals = (num.split(/[.,]/)[1] || "").length;
  const sep = num.includes(",") ? "," : ".";
  const target = parseFloat(num.replace(",", "."));
  const o = { v: 0 };
  // Breedte vasthouden, anders verspringt de kaart terwijl de cijfers lopen
  el.style.minWidth = el.offsetWidth + "px";
  return gsap.to(o, {
    v: target,
    duration: Math.min(1.1, 0.45 + target * 0.012),
    ease: "power3.out",
    onUpdate: () => { el.textContent = pre + o.v.toFixed(decimals).replace(".", sep) + post; },
    onComplete: () => { el.textContent = text; el.style.minWidth = ""; },
  });
}

function createDarkScene(section) {
  const cards = [...section.querySelectorAll("[data-scene-card], .result")];
  if (!cards.length) return null;
  const inner = section.querySelector(".regular_container") || section;
  const heading = [...section.querySelectorAll("h1, h2, h3")].find((h) => !h.closest("[data-scene-card], .result"));
  const ctas = [...section.querySelectorAll("[data-scene-cta], .button-052")];
  const numbers = cards.map((card) => card.querySelector("h1, h2, h3, h4"));

  const sts = [];
  const anims = [];
  let shown = 0;
  let lastSlam = -1;
  let headingShown = false;
  let done = false;

  const holdsStickers = section.hasAttribute("data-sticker-zone");
  if (holdsStickers) section._stickerHold = true;

  gsap.set(cards, { autoAlpha: 0 });
  if (heading) gsap.set(heading, { autoAlpha: 0 });
  if (ctas.length) gsap.set(ctas, { autoAlpha: 0, scale: 0.3 });

  // Inhoud van de sectie (kop t/m kaarten), los van transforms
  function contentBox() {
    const sr = section.getBoundingClientRect();
    let top = Infinity;
    let bottom = -Infinity;
    [...inner.children].forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.height) return;
      top = Math.min(top, r.top - sr.top);
      bottom = Math.max(bottom, r.bottom - sr.top);
    });
    return { top, bottom };
  }
  const box = contentBox();
  const pinned = box.bottom - box.top <= vh() - 24;
  // Zover staat de sectie boven de rand als hij blijft staan: de inhoud in het midden,
  // maar nooit zo ver dat er onderaan weer pagina onder vandaan komt (het scherm blijft helemaal zwart)
  const offset = () => {
    const b = contentBox();
    const centered = Math.round((b.top + b.bottom) / 2 - vh() / 2);
    return Math.max(0, Math.min(centered, section.offsetHeight - vh()));
  };

  function showHeading() {
    if (headingShown || !heading) return;
    headingShown = true;
    ensureSplit([heading]);
    gsap.set(heading, { autoAlpha: 1 });
    const lines = heading._split?.lines;
    if (lines?.length) anims.push(gsap.fromTo(lines, { yPercent: -140 }, { yPercent: 0, duration: REVEAL_DUR, ease: REVEAL_EASE, stagger: REVEAL_STAGGER, overwrite: "auto" }));
    else anims.push(gsap.fromTo(heading, { y: "1.5rem", autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: REVEAL_DUR, ease: REVEAL_EASE }));
  }

  // Kaart wordt op tafel gelegd: iets groter en scheef, dan plat. Geen schok meer: rustig, maar wel met gewicht.
  function slam(i) {
    const card = cards[i];
    const rot = base(card);
    const now = gsap.ticker.time;
    const delay = Math.max(0, lastSlam + 0.2 - now);
    lastSlam = now + delay;
    const side = i % 2 ? 1 : -1;
    const tl = gsap.timeline({ delay });
    tl.fromTo(card, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.12, ease: "none" }, 0)
      .fromTo(card, { scale: pinned ? 1.35 : 1.25, rotation: rot + side * rnd(6, 10), yPercent: -6 },
        { scale: 1, rotation: rot, yPercent: 0, duration: 0.38, ease: "power3.in" }, 0)
      .to(card, { scaleX: 1.015, scaleY: 0.985, duration: 0.06, ease: "power2.out" }, 0.38)
      .to(card, { scaleX: 1, scaleY: 1, duration: 0.35, ease: "power2.out" }, 0.44)
      .call(() => {
        const c = countUp(numbers[i]);
        if (c) anims.push(c);
      }, null, 0.38);
    if (i === cards.length - 1) tl.call(finish, null, 0.6);
    anims.push(tl);
  }

  function finish() {
    if (done) return;
    done = true;
    if (ctas.length) anims.push(gsap.to(ctas, { autoAlpha: 1, scale: 1, duration: 0.6, ease: POP_EASE, stagger: 0.08 }));
    if (holdsStickers) {
      section._stickerHold = false;
      section._stickerRelease?.();
    }
  }

  function showUpTo(count) {
    while (shown < Math.min(count, cards.length)) slam(shown++);
  }

  if (pinned) {
    // Blijft staan zodra hij het hele scherm vult. Eerste kaart komt vanzelf na de kop, daarna één per scrollstap;
    // na de laatste nog even blijven staan, dan vallen de stickers terwijl je kijkt.
    const steps = cards.length + 2.5;
    sts.push(ScrollTrigger.create({
      trigger: section,
      start: () => "top " + -offset() + "px",
      end: () => "+=" + Math.round(steps * vh() * 0.2),
      pin: true,
      // De page wrapper is flex: dan zet ScrollTrigger pinSpacing standaard uit
      pinSpacing: true,
      // Eerst deze pin meten: triggers verderop (reviews, werk) zijn al eerder aangemaakt
      // en zouden anders de extra scrollruimte van de pin missen en veel te vroeg afgaan
      refreshPriority: 1,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onEnter: () => {
        showHeading();
        anims.push(gsap.delayedCall(0.35, () => showUpTo(1)));
      },
      onUpdate: (self) => {
        if (self.progress === 0) return;
        showHeading();
        showUpTo(Math.floor(self.progress * steps));
      },
    }));
  } else {
    // "Helemaal zwart" = de sectie raakt de onderkant van de vaste menubalk (op mobiel ligt die over de bovenkant),
    // anders verdwijnt de kop er meteen onder
    const headerBottom = () => {
      const bar = [...document.querySelectorAll("[data-header]")].map((el) => el.getBoundingClientRect()).find((r) => r.height > 0 && r.top < vh() * 0.3);
      return bar ? Math.round(bar.bottom) : 0;
    };
    let armed = false;
    sts.push(ScrollTrigger.create({
      trigger: section,
      start: () => "top " + headerBottom() + "px",
      invalidateOnRefresh: true,
      once: true,
      onEnter: () => {
        armed = true;
        showHeading();
        let n = 0;
        cards.forEach((card, i) => { if (card.getBoundingClientRect().top < vh() * 0.88) n = i + 1; });
        showUpTo(n);
      },
    }));
    cards.forEach((card, i) => {
      sts.push(ScrollTrigger.create({ trigger: card, start: "top 88%", onEnter: () => { if (armed) showUpTo(i + 1); } }));
    });
  }

  return {
    freeze() {
      sts.forEach((st) => st.disable(false));
    },
    destroy() {
      sts.forEach((st) => st.kill(true));
      anims.forEach((a) => a.kill());
      if (holdsStickers) section._stickerHold = false;
      numbers.forEach((el) => { if (el?._countText != null) el.textContent = el._countText; });
      gsap.set([...cards, inner, ...(heading ? [heading] : []), ...ctas], { clearProps: "opacity,visibility,transform" });
    },
  };
}

// ==========================================================
// SCROLL-REVEALS — zoals in het prototype
// Wat bij binnenkomst in beeld staat doet de paginatransitie. Al het andere ontvouwt zich één keer
// zodra het in beeld scrolt, met dezelfde bewegingen: regels vallen in hun masker, knoppen poppen,
// beelden vegen of vouwen open, stickers worden erop geplakt. Wat tegelijk binnenkomt, komt kort na elkaar.
//
// Het type komt uit data-tr/data-in (TRANSITIELIJST). REVEAL_MAP hieronder overschrijft het per class.
// In Webflow: data-reveal-in="lines|chars|slide|pop|sticker|wipe|unfold|slap|drop|line" wint altijd,
// data-reveal-in="none" zet het uit. Secties met een eigen choreografie (resultaten, reviews,
// nieuwsbrief, marquees) doen niet mee.
// ==========================================================

const REVEAL_MAP = [
  // Cases komen uit de diepte naar voren: klein, laag en scheef, dan op hun plek (past bij de parallax)
  [".werk_img", "depth"],
  // Nieuwsbrief: de regels vallen in, dan wordt het paarse label erop geplakt en popt het laddertje
  [".cta_items_wrap h2, [data-tag-title]", "tag-title"],
  // Kaarten schuiven rustig één voor één de stapel in
  [".dropping-stack-card", "rise"],
  // Beelden in de boog boven de footer poppen erin (de kaart, niet het item: dat staat al gedraaid op zijn plek)
  [".radial-cards-marquee .demo-card", "pop"],
];
// Groepen: de container bepaalt wanneer, de onderdelen komen na elkaar. [container, onderdelen, volgorde]
// Een kaart in de boog kan buiten beeld staan tot hij rond draait, dus die gaan samen met de boog.
// De stapel: de achterste eerst, de voorste valt als laatste bovenop.
const REVEAL_GROUPS = [
  [".radial-cards-marquee", ".demo-card", "random", 0.05],
  [".dropping-stack", ".dropping-stack-card", "back-first", 0.1],
];
const REVEAL_SKIP = "._100vh_sectie, [data-scene], .review_wrapper, [data-review-talk], .marquee-advanced, [data-reveal-skip], [data-reveal], .w-form-done, .w-form-fail";
// Wrappers met een data-tr die zelf niet ontvouwen: hun inhoud doet het
const REVEAL_WRAPPERS = ".radial-cards-marquee, .dropping-stack, .review";

function revealType(el) {
  const own = el.getAttribute("data-reveal-in");
  if (own) return own;
  const hit = REVEAL_MAP.find(([selector]) => el.matches(selector));
  if (hit) return hit[1];
  const tr = el.getAttribute("data-tr");
  if (tr === "media") return el.getAttribute("data-in") || "wipe";
  return tr;
}

// Section-kleurvlakken (data-tr="wipe") vegen alleen bij paginawissels, niet bij scrollen
const REVEAL_TYPES = new Set(["lines", "chars", "slide", "pop", "sticker", "line", "wipe", "unfold", "slap", "rise", "drop", "depth", "tag-title"]);

// Bij een kop met label: het label en het laddertje ernaast horen bij de kop, niet los
const tagOf = (el) => el.querySelector(".text-span-2, [data-tag]");
const ladderOf = (el) => el.parentElement?.querySelector(":scope > .icon-embed-custom-7, :scope > [data-ladder]") || null;

// Beginstand voor het in beeld komen. "rise" blijft zichtbaar en staat alleen iets lager klaar.
const RISE_FROM = "3rem";
function hideForReveal(el) {
  if (el._revealType === "rise") gsap.set(el, { y: RISE_FROM });
  else gsap.set(el, { autoAlpha: 0 });
}

function revealEl(el, delay = 0) {
  const type = el._revealType;
  const tl = gsap.timeline({ delay });
  gsap.set(el, { autoAlpha: 1 });
  if (type === "lines" || type === "chars") {
    ensureSplit([el]);
    const parts = el._split ? (type === "lines" ? el._split.lines : el._split.chars) : null;
    if (parts?.length) tl.fromTo(parts, { yPercent: type === "lines" ? -140 : -112 }, { yPercent: 0, duration: REVEAL_DUR, ease: REVEAL_EASE, stagger: type === "lines" ? REVEAL_STAGGER : 0.035 });
    else tl.fromTo(el, { y: "1rem", autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: REVEAL_DUR, ease: REVEAL_EASE });
  } else if (type === "slide") tl.fromTo(el, { yPercent: -125 }, { yPercent: 0, duration: REVEAL_DUR, ease: REVEAL_EASE });
  else if (type === "pop") tl.fromTo(el, { scale: 0.6, autoAlpha: 0 }, { scale: 1, autoAlpha: 1, duration: 0.6, ease: POP_EASE });
  else if (type === "sticker") tl.fromTo(el, { scale: 1.2, autoAlpha: 0, rotation: base(el) + rnd(-10, 10) }, { scale: 1, autoAlpha: 1, rotation: base(el), duration: 0.6, ease: POP_EASE });
  else if (type === "line") tl.fromTo(el, { scaleX: 0, transformOrigin: "left center" }, { scaleX: 1, duration: REVEAL_DUR, ease: REVEAL_EASE });
  else if (type === "wipe") tl.fromTo(el, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: REVEAL_DUR, ease: REVEAL_EASE, clearProps: "clipPath" });
  else if (type === "unfold") tl.fromTo(el, { clipPath: "inset(0% 100% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: REVEAL_DUR, ease: REVEAL_EASE, clearProps: "clipPath" });
  else if (type === "slap") tl.fromTo(el, { scale: 1.15, autoAlpha: 0, rotation: base(el) + rnd(-6, 6) }, { scale: 1, autoAlpha: 1, rotation: base(el), duration: 0.6, ease: POP_EASE });
  // Komt rustig van onder op zijn plek (de kaarten in de werk-stapel). Zonder fade: de kaart is er al, hij schuift alleen.
  else if (type === "rise") tl.fromTo(el, { y: RISE_FROM }, { y: 0, duration: REVEAL_DUR, ease: REVEAL_EASE });
  else if (type === "drop") tl.fromTo(el, { y: () => -vh() * 0.85, rotation: base(el) + rnd(-30, 30) }, { y: 0, rotation: base(el), duration: 1.1, ease: "bounce.out" });
  else if (type === "depth") {
    // Van ver weg naar voren: klein, iets lager en scheef; het beeld erin zoomt tegengesteld uit
    const img = el.querySelector("img");
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.35, ease: "none" }, 0)
      .fromTo(el, { scale: 0.86, y: "3rem", rotation: base(el) + rnd(2, 4) * (Math.random() < 0.5 ? -1 : 1) },
        { scale: 1, y: 0, rotation: base(el), duration: 1.2, ease: REVEAL_EASE }, 0);
    if (img) tl.fromTo(img, { scale: 1.2 }, { scale: 1, duration: 1.4, ease: REVEAL_EASE }, 0);
  } else if (type === "tag-title") {
    // Eigen split zonder autoSplit: na het plakken staan de maskers open (anders knippen ze het scheve label af)
    if (!el._split && window.SplitText) el._split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "tr-line" });
    const tag = tagOf(el);
    const ladder = ladderOf(el);
    const lines = el._split?.lines || [];
    const masks = lines.map((l) => l.parentElement).filter((m) => m && m !== el);
    if (tag) gsap.set(tag, { autoAlpha: 0 });
    if (lines.length) tl.fromTo(lines, { yPercent: -140 }, { yPercent: 0, duration: REVEAL_DUR, ease: REVEAL_EASE, stagger: REVEAL_STAGGER }, 0);
    tl.call(() => masks.forEach((m) => { m.style.clipPath = "none"; }), null, 0.55);
    if (tag) tl.fromTo(tag, { autoAlpha: 0, scale: 1.2, rotation: base(tag) - 6 },
      { autoAlpha: 1, scale: 1, rotation: base(tag), duration: 0.6, ease: POP_EASE }, 0.55);
    if (ladder) tl.fromTo(ladder, { autoAlpha: 0, scale: 0.6, transformOrigin: "50% 100%" },
      { autoAlpha: 1, scale: 1, duration: 0.6, ease: POP_EASE }, 0.8);
  }
  return tl;
}

function initScrollReveals(c) {
  if (reducedMotion || !c || c._revealsDone) return;
  c._revealsDone = true;
  const h = vh();
  const candidates = new Set([...c.querySelectorAll("[data-tr], [data-reveal-in]")]);
  REVEAL_MAP.forEach(([selector]) => c.querySelectorAll(selector).forEach((el) => candidates.add(el)));
  const els = [...candidates].filter((el) => {
    if (el.getAttribute("data-reveal-in") === "none") return false;
    if (el.matches(REVEAL_WRAPPERS) && !el.hasAttribute("data-reveal-in")) return false;
    if (el.closest(REVEAL_SKIP)) return false;
    const type = revealType(el);
    if (!REVEAL_TYPES.has(type)) return false;
    // Kleurvlakken (sectie-wipes) niet; een media-wipe (beeld, accordeon) wel
    if (el.getAttribute("data-tr") === "wipe" && !el.hasAttribute("data-reveal-in")) return false;
    // Wat de paginatransitie al deed (of nu in beeld staat), niet nog een keer
    if (el._entered || inView(el, h)) return false;
    el._revealType = type;
    return true;
  });
  // Groepen eruit halen: die gaan op hun container
  const grouped = new Set();
  els.filter((el) => el._revealType === "tag-title").forEach((el) => {
    const ladder = ladderOf(el);
    if (ladder) { grouped.add(ladder); gsap.set(ladder, { autoAlpha: 0 }); }
  });
  REVEAL_GROUPS.forEach(([wrapSel, itemSel, order, each]) => {
    c.querySelectorAll(wrapSel).forEach((wrap) => {
      if (wrap.closest(REVEAL_SKIP) || inView(wrap, h)) return;
      const items = [...wrap.querySelectorAll(itemSel)].filter((el) => els.includes(el));
      if (!items.length) return;
      items.forEach((el) => grouped.add(el));
      items.forEach(hideForReveal);
      ScrollTrigger.create({
        trigger: wrap,
        start: "top 85%",
        once: true,
        refreshPriority: -1,
        onEnter: () => {
          // Alleen wat zichtbaar is telt mee voor de volgorde (de stapel heeft verborgen kopieën)
          let list = items.filter((el) => parseFloat(getComputedStyle(el.parentElement).opacity) > 0.05);
          const rest = items.filter((el) => !list.includes(el));
          if (order === "back-first") list = list.reverse();
          if (order === "random") list = gsap.utils.shuffle(list.slice());
          list.forEach((el, i) => revealEl(el, i * each));
          rest.forEach((el) => revealEl(el, 0));
        },
      });
    });
  });
  const loose = els.filter((el) => !grouped.has(el));
  if (!loose.length) return;
  // Verbergen zonder transform: dan meet ScrollTrigger de echte plek
  loose.forEach(hideForReveal);
  ScrollTrigger.batch(loose, {
    start: "top 88%",
    once: true,
    interval: 0.06,
    batchMax: 10,
    // Na de pins meten (zie de resultaten-scene), anders gaan ze te vroeg af
    refreshPriority: -1,
    // Na een kop met label even wachten, anders komt de tekst eronder al terwijl het label nog geplakt wordt
    onEnter: (batch) => {
      let t = 0;
      batch.forEach((el) => {
        revealEl(el, t);
        t += el._revealType === "tag-title" ? 0.45 : REVEAL_STAGGER;
      });
    },
  });
}

// ==========================================================
// WERK — de cases zweven op verschillende dieptes (uit het prototype)
// Hoe hoger de diepte, hoe dichterbij en hoe sneller hij beweegt; met wat naloop voelt het als zweven.
// .werk_card of [data-depth="0.4–1.2"]. Zonder data-depth: het patroon uit het prototype.
// ==========================================================

const PARALLAX_DEPTHS = [0.55, 0.9, 0.6, 1, 0.7];
const layoutTop = (el) => { let y = 0; for (let n = el; n; n = n.offsetParent) y += n.offsetTop; return y; };

function initParallaxCards(c) {
  if (reducedMotion || !c) return;
  [...c.querySelectorAll("[data-depth], .werk_card")].forEach((el, i) => {
    if (el._parallax || el.getAttribute("data-depth") === "none") return;
    const depth = parseFloat(el.getAttribute("data-depth")) || PARALLAX_DEPTHS[i % PARALLAX_DEPTHS.length];
    const side = i % 2 ? 1 : -1;
    const amp = () => Math.min(vh(), 1000) * (window.innerWidth < 768 ? 0.09 : 0.22) * depth;
    el._parallax = gsap.fromTo(el, { y: () => amp(), rotation: () => base(el) - side * depth * 1.2 }, {
      y: () => -amp(),
      rotation: () => base(el) + side * depth * 1.2,
      ease: "none",
      immediateRender: true,
      // Begin en eind op de layoutplek (offsetTop telt de eigen verschuiving niet mee), anders meet hij zijn eigen parallax mee
      scrollTrigger: {
        trigger: el,
        start: () => layoutTop(el) - vh(),
        end: () => layoutTop(el) + el.offsetHeight,
        scrub: 0.6,
        invalidateOnRefresh: true,
      },
    });
  });
}

// ==========================================================
// SVG-COLLIDERS — een logo als botsvlak voor vallende stickers
// Het pad punt voor punt uitmeten (getPointAtLength) is duur: ruim 100 ms voor het footerlogo.
// Daarom één keer, in de eigen coördinaten van het pad, en het liefst als de browser niets te doen heeft
// (warmStickerColliders), zodat het niet midden in het scrollen gebeurt.
// ==========================================================

// Een collider is een woordmerk als de SVG het grootste deel ervan vult. Een knoppenrij met
// pijltjes-iconen is dat niet: die blijft gewoon een blok.
function stickerIsWordmark(el) {
  const svg = el.querySelector("svg");
  if (!svg || !svg.querySelector("path[d]")) return false;
  const a = el.getBoundingClientRect();
  const b = svg.getBoundingClientRect();
  return a.width * a.height > 0 && (b.width * b.height) / (a.width * a.height) > 0.5;
}

function svgColliderPlan(el) {
  const paths = [...el.querySelectorAll("svg path[d]")];
  if (!paths.length) return null;
  const prepared = paths.map((path) => {
    try {
      const length = path._len ?? (path._len = path.getTotalLength());
      const matrix = path.getScreenCTM();
      if (!length || !matrix) return null;
      const scale = Math.max(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d));
      return scale ? { path, length, matrix, scale } : null;
    } catch (error) {
      return null;
    }
  }).filter(Boolean);
  if (!prepared.length) return null;
  // Houd de hoeveelheid bodies beperkt, ook bij complexe SVG-logo's.
  const screenLength = prepared.reduce((sum, item) => sum + item.length * item.scale, 0);
  const samplePx = Math.min(24, Math.max(10, screenLength / 500));
  return { prepared, samplePx };
}

// Een stuk van het pad uitmeten, hooguit `budget` ms. Gaat de volgende keer verder waar hij was. true = klaar.
function samplePathPart(path, length, step, budget) {
  const key = Math.round(step * 1000);
  if (path._samples?.key === key) return true;
  let job = path._sampling;
  if (!job || job.key !== key) {
    const count = Math.max(1, Math.ceil(length / step));
    job = path._sampling = { key, count, i: 0, pts: new Float32Array((count + 1) * 2) };
  }
  const end = performance.now() + budget;
  while (job.i <= job.count) {
    const point = path.getPointAtLength(Math.min(job.i * step, length));
    job.pts[job.i * 2] = point.x;
    job.pts[job.i * 2 + 1] = point.y;
    job.i++;
    if ((job.i & 7) === 0 && performance.now() > end) break;
  }
  if (job.i <= job.count) return false;
  path._samples = { key, pts: job.pts };
  path._sampling = null;
  return true;
}

function samplePath(path, length, step) {
  samplePathPart(path, length, step, Infinity);
  return path._samples.pts;
}

const onIdle = window.requestIdleCallback
  ? (cb) => window.requestIdleCallback(cb, { timeout: 2500 })
  : (cb) => setTimeout(() => cb({ timeRemaining: () => 12, didTimeout: true }), 300);

// Na het laden van een pagina, in rustige momenten: per pad één stukje werk
function warmStickerColliders(scope = document) {
  const els = [...scope.querySelectorAll("[data-sticker-zone] [data-sticker-collider]")].filter(stickerIsWordmark);
  if (!els.length) return;
  const jobs = [];
  els.forEach((el) => {
    const plan = svgColliderPlan(el);
    if (plan) plan.prepared.forEach(({ path, length, scale }) => jobs.push((budget) => samplePathPart(path, length, plan.samplePx / scale, budget)));
  });
  const run = (deadline) => {
    // Tijdens de preloader niets: dan hapert die. Daarna per rustig moment een paar ms, ook als de
    // browser vindt dat het te lang duurt (anders alles in één keer en hapert de binnenkomst).
    if (document.documentElement.classList.contains("pl-running")) { setTimeout(() => onIdle(run), 500); return; }
    const until = performance.now() + (deadline.didTimeout ? 6 : Math.max(1, deadline.timeRemaining() - 2));
    while (jobs.length && performance.now() < until) if (jobs[0](until - performance.now())) jobs.shift();
    if (jobs.length) onIdle(run);
  };
  onIdle(run);
}

// ==========================================================
// FOOTERLOGO — "stercq." komt letter voor letter in zijn masker, zoals de koppen
// Pas als de letters staan, vallen de stickers erop. Bij een paginawissel zakken ze weer uit hun masker.
// .footer_large_logo_wrap of [data-wordmark]; de letters zijn de paden in de SVG, van links naar rechts.
// ==========================================================

function wordmarkLetters(wrap) {
  const svg = wrap.querySelector("svg");
  if (!svg) return null;
  const items = [...svg.querySelectorAll("path")].map((p) => ({ p, r: p.getBoundingClientRect() })).filter((o) => o.r.width > 0);
  if (items.length < 2) return null;
  items.sort((a, b) => a.r.left - b.r.left);
  const vb = svg.viewBox.baseVal;
  const letters = items.map((o) => o.p);
  // Elk pad kan een eigen transform="translate(…)" hebben. GSAP's x/y vervangen die, dus onthouden we
  // de rustpositie en animeren we daar steeds ten opzichte van (anders schuift bv. de punt omhoog).
  letters.forEach((l) => {
    if (l._y0 != null) return;
    l._x0 = gsap.getProperty(l, "x");
    l._y0 = gsap.getProperty(l, "y");
  });
  return {
    svg,
    // Het masker: het blok waar de SVG in staat
    mask: svg.parentElement,
    letters,
    // Hoogte van de SVG in zijn eigen eenheden: zo ver moeten de letters om helemaal buiten het masker te staan
    h: vb && vb.height ? vb.height : 300,
  };
}

function playWordmark(wm) {
  gsap.set(wm.mask, { clipPath: "inset(0% -5% 0% -5%)" });
  return gsap.timeline({ onComplete: () => gsap.set(wm.mask, { clearProps: "clipPath" }) })
    .fromTo(wm.letters, { autoAlpha: 1, y: (i, el) => el._y0 - wm.h * 1.15 }, { y: (i, el) => el._y0, duration: REVEAL_DUR, ease: REVEAL_EASE, stagger: 0.06 });
}

function initWordmarkIn(scope = document) {
  scope.querySelectorAll("[data-wordmark], .footer_large_logo_wrap").forEach((wrap) => {
    if (wrap._wordmark || wrap.getAttribute("data-wordmark") === "none") return;
    const wm = wordmarkLetters(wrap);
    if (!wm) return;
    wrap._wordmark = wm;
    if (reducedMotion) return;
    const zone = wrap.closest("[data-sticker-zone]");
    // Pas stickers als de letters staan
    const release = () => {
      if (!zone) return;
      zone._stickerHold = false;
      zone._stickerRelease?.();
    };
    if (zone) zone._stickerHold = true;
    gsap.set(wm.letters, { autoAlpha: 0 });
    const show = () => {
      if (wm.played) return;
      wm.played = true;
      wm.tl = playWordmark(wm);
      wm.tl.call(release, null, Math.max(0.5, wm.tl.duration() - 0.3));
    };
    // Al in beeld (korte pagina): na de binnenkomst
    if (inView(wrap)) wm.call = gsap.delayedCall(0.45, show);
    else wm.st = ScrollTrigger.create({ trigger: wrap, start: "top 88%", once: true, refreshPriority: -1, onEnter: show });
  });
}

function destroyWordmarkIn(scope = document) {
  scope.querySelectorAll("[data-wordmark], .footer_large_logo_wrap").forEach((wrap) => {
    const wm = wrap._wordmark;
    if (!wm) return;
    wm.st?.kill();
    wm.call?.kill();
    wm.tl?.kill();
    gsap.killTweensOf(wm.letters);
    gsap.set(wm.letters, { clearProps: "transform,opacity,visibility" });
    gsap.set(wm.mask, { clearProps: "clipPath" });
    const zone = wrap.closest("[data-sticker-zone]");
    if (zone) zone._stickerHold = false;
    wrap._wordmark = null;
  });
}

// Bij een paginawissel zakken de letters uit hun masker, net als de regels van de koppen
function wordmarkOut(c, tl) {
  c.querySelectorAll("[data-wordmark], .footer_large_logo_wrap").forEach((wrap) => {
    const wm = wrap._wordmark;
    if (!wm || !inView(wrap)) return;
    gsap.set(wm.mask, { clipPath: "inset(0% -5% 0% -5%)" });
    tl.to(wm.letters, { y: (i, el) => el._y0 + wm.h * 1.15, duration: 0.42, ease: "power3.in", stagger: 0.03, overwrite: "auto" }, 0.04);
  });
}

// ==========================================================
// PAGE LIFECYCLE
// initPage draait bij eerste load én na elke Barba-transitie.
// Alles wat hier start, moet in destroyPage weer opgeruimd worden.
// ==========================================================

// Wat er al goed moet staan zodra de nieuwe pagina in beeld komt (marquee, kaartenstapel, ogen,
// reviews). Draait bij een Barba-wissel vóór de opbouw, alleen binnen de nieuwe container.
function preparePage(container) {
  initMarqueeScrollDirection(container);
  initOffscreenPause(container);
  initDroppingCardsStack(container);
  initStackedCardsSlider(container);
  initEyes(container);
  initReviewTalk(container);
  // Vóór de binnenkomst: anders springen de kleuren en de kop pas om als de pagina er al staat
  prepareContactForm(container);
}

function initPage(container, { stickers = true } = {}) {
  preparePage(container || document);
  initReveal(container);
  // document: ook wat buiten de Barba-container staat (de oude pagina is dan al weg, zie afterEnter)
  initAccordionCSS(document);
  initFormValidate(document);
  initContactForm(document);
  initMarqueeScrollDirection(document);
  initOffscreenPause(document);
  // Vóór de stickerzones: de scene en het footerlogo houden de stickers vast tot hun show klaar is
  initDarkScenes(container || document);
  // document: de footer staat (nog) buiten de Barba-container
  initWordmarkIn(document);
  initParallaxCards(container);
  // Bij de eerste load staat de transitielijst er nog niet op: dan doet initFirstEnter dit
  if (container?._trApplied) initScrollReveals(container);
  // Bij de eerste load pas na de intro (zie initFirstEnter), anders ontwijken ze tekst die nog niet op zijn plek staat.
  if (stickers) initStickerZones(document);
  ScrollTrigger.refresh();
  // Ook de footer: die staat (nog) buiten de Barba-container
  warmStickerColliders(document);
}

// Alleen deze container opruimen: de nieuwe pagina staat er tijdens de wissel al naast
function killPageTriggers(container) {
  ScrollTrigger.getAll().forEach((st) => {
    const trigger = st.trigger;
    if (!trigger || container.contains(trigger)) st.kill();
  });
}

function destroyPage(container, { triggers = true } = {}) {
  if (!container) return;
  destroyMarqueeScrollDirection(container);
  destroyOffscreenPause(container);
  if (triggers) killPageTriggers(container);
  destroyAccordionCSS(container);
  destroyFormValidate(container);
  destroyEyes(container);
  destroyReviewTalk(container);
  destroyDroppingCardsStack(container);
  destroyStackedCardsSlider(container);
  destroyStickerZones(container);
  destroyDarkScenes(container);
  destroyWordmarkIn(container);
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

// TRANSITIELIJST — welke animatie elk element krijgt, op class, zodat er in Webflow
// niets per element hoeft. Een data-tr die je in Webflow zelf zet wint altijd;
// data-tr="none" zet een element uit. Eerste match wint.
// [selector, data-tr, data-in, data-out]
const TR_MAP = [
  [".button-052", "pop"],
  [".hero_section h1, .hero_section .text_main, .work_container > h2, .card-stack__item-h, .card-stack__item-p, " +
   ".text_wrap_resultaten h3, .text_wrap_review h2, .faq_wrap .text_wrap h2, .cta_items_wrap .text_main, " +
   ".werk_card > h4, .werk_card > .text_main, .heading_wrap h3, .contact_hero_wrap h2, .contact_list .text_main, ._404 h2, .text_main-2, " +
   ".slogan_wrap_footer .text_main", "lines"],
  [".hero_section.werk, .card-stack__item, ._100vh_sectie, .purple_bg, .sidebar, footer.footer", "wipe"],
  [".cta_items_wrap .icon-embed-custom-7", "sticker"],
  [".result", "media", "slap", "pop"],
  [".dropping-stack, .review", "media", "pop", "pop"],
  [".radial-cards-marquee", "media", "pop", "drop"],
  // h2 nieuwsbrief: wipe i.p.v. lines, anders blijft het paarse vlak achter "hoogte" als streep staan
  [".marquee-advanced, .accordion-css__item, .cta_items_wrap h2, .form-field-group[data-validate], .contact_step, .werk_img, " +
   ".rich_text, .document_list_small", "media", "wipe", "wipe"],
];

function applyTrMap(c) {
  c._trApplied = true;
  TR_MAP.forEach(([selector, tr, inType, outType]) => {
    c.querySelectorAll(selector).forEach((el) => {
      if (el.hasAttribute("data-tr")) return;
      el.setAttribute("data-tr", tr);
      if (inType) el.setAttribute("data-in", inType);
      if (outType) el.setAttribute("data-out", outType);
    });
  });
}

const rnd = gsap.utils.random;
// Eén bewegingstaal voor alles wat bij het scrollen binnenkomt (zoals Bodak: rustig en overal hetzelfde).
// Tekst en beeld: REVEAL_EASE. Kleine dingen (knoppen, stickers, labels) poppen met een kleine overshoot.
const REVEAL_DUR = 0.9;
const REVEAL_EASE = "power4.out";
const REVEAL_STAGGER = 0.07;
const POP_EASE = "back.out(1.4)";
// GSAP neemt de CSS-rotate over; onthoud die ontwerphoek zodat elke animatie daar weer eindigt
const base = (el) => (el._base != null ? el._base : (el._base = gsap.getProperty(el, "rotation")));
const setIf = (targets, vars) => { if (targets && targets.length) gsap.set(targets, vars); };
const vh = () => window.innerHeight;
const each = (n, per, max) => (n > 1 && n * per > max ? max / n : per);

const trState = { headerTheme: "light" };
// Zoveel seconden overlapt het eind van de leave met het begin van de nieuwe pagina
const LEAVE_OVERLAP = 0.2;

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

// Splitsen kost layout per kop. Bij binnenkomst alleen wat (bijna) in beeld staat;
// de rest pas als hij meedoet aan een leave (ensureSplit in pageOut) of aan een scene.
function splitEl(el) {
  if (!window.SplitText || el._split) return;
  const t = el.getAttribute("data-tr");
  if (t === "lines") el._split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "tr-line", autoSplit: true });
  else if (t === "chars") el._split = SplitText.create(el, { type: "chars", mask: "chars", charsClass: "tr-char" });
}

function ensureSplit(list) {
  list.forEach((el) => {
    const t = el.getAttribute("data-tr");
    if (t === "lines" || t === "chars") splitEl(el);
  });
}

function splitAll(c, { near = true } = {}) {
  if (!window.SplitText) return;
  const h = vh();
  const els = [...c.querySelectorAll('[data-tr="lines"], [data-tr="chars"]')];
  // Eerst alles lezen, dan pas splitsen: anders meet elke kop opnieuw de hele pagina
  const todo = near ? els.filter((el) => { const r = el.getBoundingClientRect(); return r.bottom > -h * 0.25 && r.top < h * 1.25; }) : els;
  todo.forEach(splitEl);
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
  const indicator = [...document.querySelectorAll("[data-nav-indicator]")];
  if (!indicator.length) return;
  const path = new URL(url, window.location.origin).pathname;
  // [data-nav-link], of anders de links in de desktop-header; links naar "#" tellen niet mee
  const marked = [...document.querySelectorAll("[data-nav-link]")];
  const links = (marked.length ? marked : [...document.querySelectorAll(".header_nav_items_wrapper a")])
    .filter((a) => a.getAttribute("href") && !a.getAttribute("href").startsWith("#"));
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

  ensureSplit(vis);
  const p = collect(vis, h);
  // Stickers die de stickerzones zelf neerleggen (board en zwaartekracht) poppen er ook af.
  // Het img binnenin, want de wrapper krijgt elke frame zijn positie van de zone.
  c.querySelectorAll(".sticker-board__sticker > .sticker-face, .sticker-zone__sticker > .sticker-face").forEach((face) => {
    if (inView(face, h)) p.sticker.push(face);
  });
  const shadows = c.querySelectorAll(".sticker-shadow");
  if (shadows.length) tl.to(shadows, { opacity: 0, duration: 0.15 }, 0);
  wordmarkOut(c, tl);
  // Wat nog niet binnen is (boven/onder zijn masker) slaan we over, anders schiet het er even doorheen
  const inPlace = (el) => Math.abs(gsap.getProperty(el, "yPercent")) < 50;
  p.lines = p.lines.filter(inPlace); p.chars = p.chars.filter(inPlace); p.slide = p.slide.filter(inPlace);

  if (p.sticker.length) tl.to(p.sticker, { keyframes: [
    { scale: 1.12, duration: 0.1, ease: "power2.out" },
    { scale: 0, rotation: () => "+=" + rnd(-35, 35), duration: 0.3, ease: "back.in(2.4)" },
  ], stagger: { each: each(p.sticker.length, 0.045, 0.2), from: "random" }, overwrite: "auto" }, 0);
  if (p.pop.length) tl.to(p.pop, { scale: 0, duration: 0.3, ease: "back.in(2)", stagger: each(p.pop.length, 0.035, 0.15), overwrite: "auto" }, 0.02);
  if (p.lines.length) tl.to(p.lines, { yPercent: 140, duration: 0.42, ease: "power3.in", stagger: each(p.lines.length, 0.035, 0.22), overwrite: "auto" }, 0.04);
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
  const pageTheme = c.getAttribute("data-header-theme") || detectHeaderTheme(c);
  c._pageTheme = pageTheme;

  if (reducedMotion) { gsap.set(c, { autoAlpha: 0 }); c._enter = null; setHeaderTheme(pageTheme); return; }

  const vis = [...c.querySelectorAll("[data-tr]")].filter((el) => !el.closest("[data-tr-defer]") && inView(el, h));
  // Onthouden wat de binnenkomst doet: de scroll-reveals blijven daarvan af (ook als de parallax het straks net onder de rand schuift)
  vis.forEach((el) => { el._entered = true; });
  ensureSplit(vis);
  const p = collect(vis, h);
  c._enter = p;

  // Regels reizen verder dan 100%: het masker heeft extra ruimte boven/onder (zie .tr-line-mask)
  setIf(p.lines, { yPercent: -140 });
  setIf(p.chars, { yPercent: -112 });
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
// PRELOADER
// Eén keer per bezoek (sessionStorage), op elke pagina waar hij staat:
// 1. de letters van het woordmerk stuiteren één voor één binnen, de punt valt als een balletje
// 2. stickers vallen uit de lucht, stuiteren op het woord en vliegen opzij uit beeld
// 3. de laatste sticker neemt het woord mee naar beneden
// 4. leeg crème: daar begint de gewone binnenkomst van de pagina (en schuift de header erin)
// Klik of toets tijdens het laden: alles gaat sneller.
//
// Webflow: <div data-preloader> (buiten de Barba-container) met daarin <div data-preloader-logo>
// en de stercq-SVG als embed (dezelfde als in de footer, zonder data-sticker-collider).
// Optioneel: data-preloader="always" speelt hem elke keer (testen), net als ?preloader in de url.
// <img data-preloader-sticker> in de preloader kiest zelf de stickers, anders 4 uit de bibliotheek.
// ==========================================================

const PRELOADER_KEY = "stercq-preloader";

function hidePreloader(el) {
  document.documentElement.classList.remove("pl-running");
  document.documentElement.classList.add("pl-done");
  if (el) el.style.display = "none";
}

function preloaderSources(el) {
  const own = [...el.querySelectorAll("img[data-preloader-sticker]")];
  if (own.length) return own.map((img) => ({ src: img.currentSrc || img.getAttribute("src"), eyes: false, kind: stickerKindOf(img, img.getAttribute("src")) }));
  const sources = getStickerSources().filter((source) => !source.eyes);
  if (!sources.length) return [];
  const picker = createStickerPicker(el, sources);
  return [["round"], ["wide", "tekst"], ["icoon"], ["round", "tekst"]].map((prefs) => picker.pick(prefs)).filter(Boolean);
}

function startPreloader() {
  const el = document.querySelector("[data-preloader]");
  if (!el) return null;
  const html = document.documentElement;
  const forced = el.getAttribute("data-preloader") === "always" || /[?&]preloader\b/.test(location.search);
  let seen = false;
  try { seen = !!sessionStorage.getItem(PRELOADER_KEY); } catch (e) { /* privémodus: gewoon spelen */ }
  if (forced) html.classList.remove("no-preloader");
  const inEditor = html.classList.contains("w-editor") || window.Webflow?.env?.("editor");
  if (reducedMotion || inEditor || (seen && !forced) || !window.gsap) { hidePreloader(el); return null; }
  html.classList.add("pl-running");
  // Een logo-embed met een clipPath (zoals het header-logo) knipt de letters af zodra ze bewegen,
  // en zijn id's botsen met die van het logo in de header. Hier is dat niet nodig: weg ermee.
  el.querySelectorAll("svg [clip-path]").forEach((n) => n.removeAttribute("clip-path"));
  el.querySelectorAll("svg clipPath").forEach((n) => n.remove());
  el.querySelectorAll("svg [id]").forEach((n) => n.removeAttribute("id"));
  const wm = wordmarkLetters(el.querySelector("[data-preloader-logo]") || el);
  if (!wm) { hidePreloader(el); return null; }
  try { sessionStorage.setItem(PRELOADER_KEY, "1"); } catch (e) { /* niet erg */ }
  lockScroll();
  // Haperingen (de pagina wordt eronder opgebouwd) niet inhalen met een sprong: de animatie wacht even
  gsap.ticker.lagSmoothing(100, 33);

  const letters = wm.letters;
  const last = letters.length - 1;
  // Waar de letters in rust staan (nu nog, vóór ze verstopt worden): daar landen de stickers straks op.
  // Niet meten als ze al bewegen: dan klopt het net niet en vallen stickers soms door het woord.
  const restRects = letters.map((l) => l.getBoundingClientRect());
  // GSAP beweegt SVG-paden in SVG-eenheden: px omrekenen
  const svgRect = wm.svg.getBoundingClientRect();
  const vb = wm.svg.viewBox.baseVal;
  const u = vb && vb.width ? 1 / Math.min(svgRect.width / vb.width, svgRect.height / vb.height) : 1;
  const px = (n) => n * u;
  const tweens = [];
  let speed = 1;
  const track = (t) => { tweens.push(t); if (speed !== 1) t.timeScale(speed); return t; };

  // Stickers alvast laden terwijl de letters binnenkomen
  const loaded = preloaderSources(el).map((source) => {
    const img = new Image();
    img.src = source.src;
    img.alt = "";
    img.draggable = false;
    const item = { source, img, ok: false };
    item.ready = img.decode().then(() => {
      item.ok = true;
      if (img.naturalWidth && img.naturalHeight) stickerRatios.set(source.src, img.naturalHeight / img.naturalWidth);
    }).catch(() => {});
    return item;
  });

  let readyResolve;
  const pageReady = new Promise((resolve) => { readyResolve = resolve; });
  let finishResolve;
  const finished = new Promise((resolve) => { finishResolve = resolve; });
  let done = false;
  const finish = async () => {
    if (done) return;
    done = true;
    await pageReady;
    gsap.ticker.remove(tick);
    tweens.forEach((t) => t.kill());
    el.removeEventListener("pointerdown", hurry);
    window.removeEventListener("keydown", hurry);
    el.querySelectorAll(".pl-sticker").forEach((n) => n.remove());
    hidePreloader(el);
    unlockScroll();
    gsap.ticker.lagSmoothing(500, 33);
    finishResolve();
  };
  // Vangnet: wat er ook misgaat (ook als het opbouwen van de pagina vastloopt), na 7 s is hij weg
  const failSafe = setTimeout(() => { readyResolve(); finish(); }, 7000);
  finished.then(() => clearTimeout(failSafe));

  function hurry() {
    if (speed !== 1) return;
    speed = 2.5;
    tweens.forEach((t) => t.timeScale(speed));
  }
  el.addEventListener("pointerdown", hurry);
  window.addEventListener("keydown", hurry);

  // 1. letters
  // y altijd ten opzichte van de rustpositie van elk pad (_y0, zie wordmarkLetters)
  gsap.set(letters, { opacity: 0, y: (i, l) => l._y0 + px(30), scaleX: 0.6, scaleY: 0.2, transformOrigin: "50% 100%" });
  // Gepauzeerd: hij start pas als het opbouwen van de pagina bij het laden klaar is (zie start())
  const intro = track(gsap.timeline({ paused: true }));
  letters.forEach((l, i) => {
    const at = i * 0.075;
    if (i === last) {
      // De punt: onzichtbaar tot zijn beurt, dan valt hij van boven het scherm als een balletje op zijn plek
      const sky = l._y0 - px(restRects[i].top + restRects[i].height + 30);
      intro.set(l, { opacity: 1, y: sky, scaleX: 1, scaleY: 1 }, at + 0.05)
        .to(l, { y: l._y0, duration: 0.9, ease: "bounce.out" }, at + 0.05);
      return;
    }
    intro.to(l, { keyframes: [
      { opacity: 1, y: l._y0 + px(-14), scaleX: 0.84, scaleY: 1.26, duration: 0.2, ease: "power2.out" },
      { y: l._y0, scaleX: 1.16, scaleY: 0.8, duration: 0.13, ease: "power2.in" },
      { scaleX: 1, scaleY: 1, duration: 0.55, ease: "elastic.out(1, 0.45)" },
    ] }, at);
  });
  intro.call(dropStickers, null, 0.85);

  // Een sticker landt op een letter: die veert even in.
  // Geen transformOrigin meer meegeven (staat al op 50% 100%): bij SVG meet GSAP dan elke keer het pad
  // opnieuw op, en dat kost op een telefoon een hapering.
  function bump(letter) {
    track(gsap.to(letter, { keyframes: [
      { y: letter._y0 + px(8), scaleY: 0.82, scaleX: 1.12, duration: 0.07, ease: "power2.out" },
      { y: letter._y0, scaleY: 1, scaleX: 1, duration: 0.5, ease: "elastic.out(1, 0.35)" },
    ], overwrite: "auto" }));
  }

  // 3. het woord valt, vanaf de letter waar de laatste sticker op kwam
  let falling = false;
  let wordTop = 0;
  function dropWord(from) {
    if (falling) return;
    falling = true;
    const fall = px(window.innerHeight - wordTop + 140);
    letters.forEach((l, i) => track(gsap.to(l, { keyframes: [
      { y: l._y0 + px(-12), rotation: rnd(-8, 8), duration: 0.14, ease: "power2.out" },
      { y: l._y0 + fall, x: l._x0 + px(rnd(-40, 40)), rotation: rnd(-80, 80), duration: 0.8, ease: "power2.in" },
    ], delay: Math.abs(i - from) * 0.05, overwrite: "auto" })));
  }

  // 2. stickers: eigen mini-zwaartekracht, geen physics-bibliotheek nodig
  let bodies = [];
  let cols = [];
  let cx = 0;
  let t = 0;
  let vw = 0;
  let vh = 0;
  function dropStickers() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    const word = wm.svg.getBoundingClientRect();
    wordTop = word.top;
    cx = word.left + word.width / 2;
    // De punt telt niet mee als landingsplek: te klein, daar vallen ze langs
    cols = restRects.slice(0, last);
    const ready = loaded.filter((item) => item.ok);
    if (!ready.length) { gsap.delayedCall(0.25, () => dropWord(Math.floor(letters.length / 2))); }
    // Elke sticker mikt op een letter (t, c, s, r), zodat hij altijd ergens op landt
    const aims = [1, 4, 0, 3].map((i) => Math.min(i, cols.length - 1));
    const baseW = Math.min(120, Math.max(56, word.width * 0.48));
    bodies = ready.map((item, i) => {
      const w = baseW * stickerSizeFactor(item.source);
      const node = document.createElement("div");
      node.className = "pl-sticker";
      node.style.width = `${w}px`;
      node.appendChild(item.img);
      el.appendChild(node);
      const h = node.offsetHeight || w;
      return {
        el: node, w, h, r: Math.min(w, h) * 0.42,
        x: (cols[aims[i % aims.length]].left + cols[aims[i % aims.length]].right) / 2 + rnd(-4, 4), y: -h,
        vx: rnd(-12, 12), vy: rnd(0, 140), rot: rnd(-25, 25), vr: rnd(-40, 40),
        start: i * 0.16, hits: 0, alive: true, last: i === ready.length - 1,
      };
    });
    bodies.forEach(place);
    // Ook zonder stickers: de tick ziet wanneer het woord uit beeld is
    gsap.ticker.add(tick);
  }
  const place = (b) => { b.el.style.transform = `translate3d(${b.x - b.w / 2}px, ${b.y - b.h / 2}px, 0) rotate(${b.rot}deg)`; };
  const G = 2800;
  function tick() {
    const dt = Math.min(1 / 30, gsap.ticker.deltaRatio(60) / 60) * speed;
    t += dt;
    let alive = 0;
    bodies.forEach((b) => {
      if (!b.alive) return;
      alive++;
      if (t < b.start) return;
      const prevBottom = b.y + b.r;
      b.vy += G * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.vr * dt;
      if (!falling && b.hits < 3 && b.vy > 0) {
        // Kwam de onderkant deze frame door de bovenkant van een letter heen? Dan botst hij, ook als een
        // trage telefoon een grote stap maakt (anders vliegt hij er soms tussendoor). De sticker is breder
        // dan de ruimte tussen letters: een letter telt als hij onder een flink stuk van de sticker zit.
        const bottom = b.y + b.r;
        let hit = -1;
        for (let i = 0; i < cols.length; i++) {
          const c = cols[i];
          if (b.x > c.left - b.r * 0.8 && b.x < c.right + b.r * 0.8 && prevBottom <= c.top + c.height * 0.35 && bottom >= c.top) {
            if (hit < 0 || c.top < cols[hit].top) hit = i;
          }
        }
        if (hit >= 0) {
          const i = hit;
          const c = cols[i];
          {
            b.y = c.top - b.r;
            b.vy = -Math.abs(b.vy) * (b.hits ? 0.38 : 0.56);
            const dir = b.x < cx ? -1 : 1;
            b.vx = dir * rnd(170, 320) * (0.8 + b.hits * 0.5) + b.vx * 0.2;
            b.vr = b.vx * rnd(0.6, 1.1);
            b.hits++;
            bump(letters[i]);
            if (b.last) track(gsap.delayedCall(0.1, () => dropWord(i)));
          }
        }
      }
      if (b.y - b.h > vh + 40 || b.x + b.w < -60 || b.x - b.w > vw + 60) {
        b.alive = false;
        b.el.remove();
      } else place(b);
    });
    // Mist de laatste het woord, dan valt het toch
    if (!falling && t > 2.4) dropWord(Math.floor(letters.length / 2));
    if (falling && alive === 0 && !letters.some((l) => gsap.isTweening(l))) {
      gsap.ticker.remove(tick);
      quietResolve();
      track(gsap.delayedCall(0.15, finish));
    }
  }
  let quietResolve;
  const quiet = new Promise((resolve) => { quietResolve = resolve; });
  // Het vangnet: ook als er iets misgaat komt het rustige moment
  setTimeout(() => quietResolve(), 6000);
  let started = false;
  const start = () => {
    if (started) return;
    started = true;
    // Twee frames verder: dan staat het scherm en is de browser klaar met het zware begin
    requestAnimationFrame(() => requestAnimationFrame(() => track(gsap.delayedCall(0.12, () => intro.play()))));
  };
  return { ready: () => readyResolve(), start, quiet, finished };
}

// Na de preloader: de header schuift van boven in beeld
function headerIn() {
  const els = [...document.querySelectorAll("[data-header]")].filter((el) => el.getClientRects().length && getComputedStyle(el).display !== "none");
  if (!els.length || reducedMotion) return null;
  return gsap.fromTo(els, { yPercent: -160 }, { yPercent: 0, duration: REVEAL_DUR, ease: REVEAL_EASE, clearProps: "transform" });
}

// ==========================================================
// BARBA TRANSITIONS
// leave = pageOut, enter = setInitialStates + pageIn.
// Barba prefetcht al op hover, dus de nieuwe pagina staat meestal klaar.
// ==========================================================

function initBarba() {
  if (!window.barba) return;
  // Pagina zonder Barba-wrapper (bv. een CMS-template): gewoon laden, anders gooit Barba een fout
  if (!document.querySelector('[data-barba="wrapper"]')) return;
  // In de Webflow Editor (klant past teksten aan) geen Barba: die links moeten gewoon herladen
  if (window.Webflow?.env?.("editor") || document.documentElement.classList.contains("w-editor")) return;

  // Vanuit het open mobiele menu is het menu zelf de transitie (zie BOLD FULL SCREEN NAVIGATION)
  let navCurtain = false;

  barba.hooks.before((data) => {
    document.documentElement.classList.add("is-transitioning");
    navCurtain = isNavigationOpen() && !reducedMotion;
    if (navCurtain) document.querySelector("[data-navigation-status]").setAttribute("data-navigation-status", "leaving");
    else closeNavigation();
    lockScroll();
    moveIndicator(data.next.url.href);
  });

  barba.hooks.after((data) => {
    reinitWebflow(data.next.html);
    updateCurrentNav();
    bounceHeaderDot();
    unlockScroll();
    document.documentElement.classList.remove("is-transitioning");
  });

  barba.init({
    preventRunning: true,
    timeout: 5000,
    transitions: [
      {
        name: "stercq",

        // Het laatste stukje van de leave loopt over het begin van de nieuwe pagina heen,
        // zodat er geen lege pauze tussen de twee zit
        leave(data) {
          const old = data.current.container;
          freezeDarkScenes(old);
          // Achter het menuvlak: de oude pagina hoeft niet weg te animeren, alleen de links in het menu
          if (navCurtain) {
            old._leaveTl = null;
            return new Promise((resolve) => gsap.delayedCall(0.3, resolve));
          }
          const tl = pageOut(old);
          old._leaveTl = tl;
          return new Promise((resolve) => {
            const at = tl.duration() - LEAVE_OVERLAP;
            if (reducedMotion || at <= 0) tl.then(() => resolve());
            else tl.call(resolve, null, at);
          });
        },

        afterLeave(data) {
          const old = data.current.container;
          const tl = old._leaveTl;
          old._finishLeave = () => {
            if (old._leaveDone) return;
            old._leaveDone = true;
            tl?.kill();
            // Alleen verbergen. Opruimen (triggers, pins, splits) kost op een telefoon ruim 100 ms;
            // dat gebeurt pas in afterEnter, als de nieuwe pagina stilstaat, anders hapert zijn binnenkomst.
            gsap.set(old, { display: "none" });
          };
          if (tl && tl.isActive()) {
            // Uit de flow, op dezelfde plek op het scherm, zodat de nieuwe pagina bovenaan kan beginnen
            gsap.set(old, { position: "fixed", top: -window.scrollY, left: 0, right: 0, zIndex: 1, pointerEvents: "none" });
            tl.then(old._finishLeave);
          } else old._finishLeave();
        },

        beforeEnter(data) {
          resetScroll();
          resetHeaderState();
          applyTrMap(data.next.container);
          preparePage(data.next.container);
          splitAll(data.next.container);
          // Zwevende cases nu al op hun startplek, anders staat er tijdens de binnenkomst een case
          // onderin beeld die daarna wegspringt (en via de reveal weer terugkomt)
          initParallaxCards(data.next.container);
          setInitialStates(data.next.container);
        },

        enter(data) {
          if (!navCurtain) return pageIn(data.next.container);
          // Het vlak trekt weg (CSS: 0,2 s wachten, dan 0,6 s); de pagina komt binnen terwijl hij vrijkomt
          navCurtain = false;
          setNavigationStatus(false, { scroll: false });
          return gsap.timeline().add(pageIn(data.next.container), 0.35);
        },

        afterEnter(data) {
          // Oude pagina helemaal weg vóór initPage, zodat die niets meer van de oude pagina oppakt
          const old = data.current.container;
          old._finishLeave?.();
          old.remove();
          // Alleen de ScrollTriggers van de oude pagina meteen (vóór de refresh in initPage).
          // De rest van het opruimen kost tijd maar heeft geen haast: dan hapert het einde van de wissel niet.
          killPageTriggers(old);
          initPage(data.next.container);
          whenIdle(() => { destroyPage(old, { triggers: false }); unsplitAll(old); });
        },
      },
    ],
  });
}

// Eerste load: dezelfde opbouw als na een transitie. Speelt de preloader, dan gebeurt dit eronder
// en begint de binnenkomst pas als het woord uit beeld is gevallen.
async function initFirstEnter(preloader = null) {
  const c = document.querySelector('[data-barba="container"]');
  if (!c) { preloader?.ready(); return; }
  // Met preloader: pas opbouwen als het woord uit beeld is (dan ziet niemand een hapering)
  if (preloader) await preloader.quiet;
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
  // Met de echte fonts: hoe breed de knop en de links zijn bepaalt hoe klein de balk wordt
  measureHeaderBar();
  applyTrMap(c);
  splitAll(c);
  setInitialStates(c);
  initScrollReveals(c);
  ScrollTrigger.refresh();
  document.documentElement.classList.add("is-ready");
  if (preloader) {
    preloader.ready();
    await preloader.finished;
    headerIn();
  }
  // Stickers plakken pas als koppen en knoppen staan (max 0.9s), anders ontwijken ze tekst die nog onderweg is
  const tl = pageIn(c);
  gsap.delayedCall(Math.min(tl.duration(), 0.9), () => initStickerZones(document));
}

// ==========================================================
// INIT
// ==========================================================

function initSite() {
  initLenis();
  // Zo vroeg mogelijk: hij ligt al over de pagina (CSS), de rest wordt eronder opgebouwd
  const preloader = startPreloader();
  initBarba();
  initBoldFullScreenNavigation();
  initHeaderStates();
  updateCurrentNav();
  moveIndicator(window.location.href, true);
  const container = document.querySelector('[data-barba="container"]');
  // Ook als er bij het opbouwen iets misgaat: de preloader speelt en gaat weer weg
  try { initPage(container || document, { stickers: !container }); } finally { preloader?.start(); }
  initFirstEnter(preloader);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSite);
} else {
  initSite();
}
