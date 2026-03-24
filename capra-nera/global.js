// ==========================================================
// CAPRA NERA — GLOBAL JS
// Stack: GSAP, ScrollTrigger, SplitText, Lenis, Barba.js
// ==========================================================

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, Draggable, InertiaPlugin, Observer);

history.scrollRestoration = "manual";

// ==========================================================
// GLOBAL STATE
// ==========================================================

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

// Hide nav immediately to prevent flash on first load
gsap.set('.nav_items', { autoAlpha: 0, y: -16 });

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", (e) => (reducedMotion = e.matches));
rmMQ.addListener?.((e) => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.6;
let lastMouseX = window.innerWidth / 2;
let lastMouseY = window.innerHeight / 2;
window.addEventListener('pointermove', (e) => { lastMouseX = e.clientX; lastMouseY = e.clientY; }, { passive: true });

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: durationDefault });

// ==========================================================
// GSAP MATCHMEDIA BREAKPOINTS
// ==========================================================

const mm = gsap.matchMedia();

// ==========================================================
// SPLIT TEXT CONFIG
// ==========================================================

const splitConfig = {
  lines: { duration: 0.8, stagger: 0.08 },
  words: { duration: 0.8, stagger: 0.06 },
  chars: { duration: 0.4, stagger: 0.01 },
};

// ==========================================================
// LENIS SMOOTH SCROLL
// ==========================================================

function initLenis() {
  if (lenis) return;
  if (!hasLenis) return;

  lenis = new Lenis({
    lerp: 0.13,
  });

  if (hasScrollTrigger) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
  });

  gsap.ticker.lagSmoothing(0);
}

function lockScroll() {
  if (lenis) lenis.stop();
  document.body.style.overflow = "hidden";
}

function unlockScroll() {
  if (lenis) lenis.start();
  document.body.style.overflow = "";
}

// ==========================================================
// FUNCTION REGISTRY
// ==========================================================

function initOnceFunctions() {
  initLenis();
  applyNavVariant(document.querySelector('[data-barba="container"]'));
  if (onceFunctionsInitialized) return;
  onceFunctionsInitialized = true;

  // Runs once on first load
  // if (has('[data-something]')) initSomething();
}

function initBeforeEnterFunctions(next) {
  nextPage = next || document;

  // Headings verbergen vóór de reveal-animatie:
  // — altijd bij een Barba-transitie (onceFunctionsInitialized)
  // — op eerste load alleen als er een preloader aanwezig is (anders flash na exit)
  if (onceFunctionsInitialized || document.querySelector('.preloader')) {
    const headings = gsap.utils.toArray("h1, h2, h3, h4", nextPage)
      .filter(el => !el.closest('.referentie_card'));
    if (headings.length) gsap.set(headings, { autoAlpha: 0 });

    const autograph = nextPage.querySelector(".italian_coffee_small");
    if (autograph) gsap.set(autograph, { autoAlpha: 0 });

    const autographLarge = nextPage.querySelector(".italian_coffee_large");
    if (autographLarge) gsap.set(autographLarge, { autoAlpha: 0 });

    const stickers = gsap.utils.toArray('.proef_sticker', nextPage);
    if (stickers.length) gsap.set(stickers, { opacity: 0 });

    const heroBg = nextPage.querySelector('.hero .bunny-bg');
    if (heroBg) gsap.set(heroBg, { opacity: 0, scale: 1.05 });

    const trustpilot = nextPage.querySelector('.hero .trustpilot_score');
    if (trustpilot) gsap.set(trustpilot, { opacity: 0, y: 12 });

    const heroIcon = nextPage.querySelector('.hero .capra_nera_icon');
    if (heroIcon) gsap.set(heroIcon, { opacity: 0, y: 10 });

    const heroSubtext = nextPage.querySelector('.hero .text_ultrasmall');
    if (heroSubtext) gsap.set(heroSubtext, { opacity: 0, y: 8 });

    const heroMarquee = nextPage.querySelector('.hero .marquee-advanced');
    if (heroMarquee) gsap.set(heroMarquee, { opacity: 0 });

    const heroBodyText = nextPage.querySelector('.hero .text_main');
    if (heroBodyText) gsap.set(heroBodyText, { opacity: 0, y: 10 });


  }
}

function initAfterEnterFunctions(next) {
  nextPage = next || document;

  initAll();

  if (hasLenis) {
    lenis.resize();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
}

// ==========================================================
// PRELOADER
// ==========================================================

function initPreloader() {
  const preloader = document.querySelector('.preloader');
  if (!preloader) return null;

  const iconHolder = preloader.querySelector('.logo_icon_holder');
  const words      = gsap.utils.toArray('.h3', preloader);

  // Meten vóór we de breedte op 0 zetten
  const iconWidth = iconHolder ? iconHolder.offsetWidth : 0;

  document.body.style.cursor = 'wait';

  const tl = gsap.timeline({
    onComplete: () => {
      preloader.remove();
      document.body.style.cursor = '';
    },
  });

  if (reducedMotion) {
    tl.set(preloader, { autoAlpha: 0 });
    return tl;
  }

  // — Beginstate —
  if (words.length) tl.set(words,     { autoAlpha: 0, yPercent: 15 }, 0);
  if (iconHolder)   tl.set(iconHolder, { width: 0, overflow: 'hidden' }, 0);

  // Fase 1 — woorden driften omhoog en verschijnen
  if (words.length) {
    tl.to(words, {
      autoAlpha: 1,
      yPercent: 0,
      duration: 0.7,
      ease: 'expo.out',
      stagger: 0.12,
    }, 0.15);
  }

  // Fase 2 — icon groeit, duwt woorden uiteen
  if (iconHolder && iconWidth) {
    tl.to(iconHolder, {
      width: iconWidth,
      duration: 0.85,
      ease: 'osmo',
    }, 0.35);
  }

  // Fase 3 — logo + woorden faden uit
  const logoContent = [iconHolder, ...words].filter(Boolean);
  if (logoContent.length) {
    tl.to(logoContent, {
      autoAlpha: 0,
      yPercent: -20,
      duration: 0.6,
      ease: 'expo.in',
      stagger: 0.06,
    }, '+=0.4');
  }

  // Fase 4 — curtain slijpt omhoog, start als fade bijna klaar is
  tl.to(preloader, {
    yPercent: -100,
    duration: 1,
    ease: 'osmo',
  }, '>-0.15');

  return tl;
}

// ==========================================================
// PAGE TRANSITIONS — CAPRA NERA
// ==========================================================

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  const preloaderTl = initPreloader();
  if (preloaderTl) {
    tl.add(preloaderTl, 0);
    // Reset layout (fixed → flow) op het moment dat de preloader begint te exiten
    // Preloader dekt de pagina dan nog — geen visuele jump
    tl.call(() => resetPage(next), null, '>-1');
    // Pagina beweegt omhoog mee, net als bij runPageEnterAnimation
    if (!reducedMotion) {
      tl.from(next, { y: '15vh', duration: 1, ease: 'osmo' }, '<');
    }
  } else {
    tl.call(() => resetPage(next), null, 0);
  }

  return tl;
}

function runPageLeaveAnimation(current, next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  if (!transitionWrap) return gsap.timeline();
  const transitionPanel = transitionWrap.querySelector("[data-transition-panel]");
  const transitionLabel = transitionWrap.querySelector("[data-transition-label]");
  const transitionLabelText = transitionWrap.querySelector("[data-transition-label-text]");

  const nextPageName = next.getAttribute("data-page-name");
  transitionLabelText.innerText = nextPageName || "Hi there";

  document.body.style.cursor = 'wait';

  const tl = gsap.timeline({
    onComplete: () => { current.remove(); },
  });

  if (reducedMotion) {
    return tl.set(current, { autoAlpha: 0 });
  }

  tl.set(transitionPanel, { autoAlpha: 1 }, 0);
  tl.set(next, { autoAlpha: 0 }, 0);

  const nav = document.querySelector('.nav_items');
  if (nav) tl.to(nav, { autoAlpha: 0, y: -16, duration: 0.3, ease: 'expo.in' }, 0);

  tl.fromTo(transitionPanel, { yPercent: 0 }, { yPercent: -100, duration: 0.8 }, 0);
  tl.fromTo(transitionLabel, { autoAlpha: 0 }, { autoAlpha: 1 }, "<+=0.2");
  tl.fromTo(current, { y: "0vh" }, { y: "-15vh", duration: 0.8 }, 0);

  // Zodra het panel de pagina volledig bedekt — ScrollTriggers killen zodat elementen
  // onzichtbaar terugspringen (niet meer zichtbaar voor gebruiker)
  tl.call(() => {
    if (hasScrollTrigger) ScrollTrigger.getAll().forEach((st) => st.kill());
  }, null, 0.75);

  return tl;
}

function runPageEnterAnimation(next) {
  const transitionWrap = document.querySelector("[data-transition-wrap]");
  const transitionPanel = transitionWrap.querySelector("[data-transition-panel]");
  const transitionLabel = transitionWrap.querySelector("[data-transition-label]");

  const tl = gsap.timeline();

  if (reducedMotion) {
    tl.set(next, { autoAlpha: 1 });
    tl.add("pageReady");
    tl.call(resetPage, [next], "pageReady");
    return new Promise((resolve) => tl.call(resolve, null, "pageReady"));
  }

  tl.add("startEnter", 1.25);

  tl.set(next, { autoAlpha: 1 }, "startEnter");

  tl.fromTo(transitionPanel, { yPercent: -100 }, {
    yPercent: -200,
    duration: 1,
    overwrite: "auto",
    immediateRender: false,
  }, "startEnter");

  tl.set(transitionPanel, { autoAlpha: 0 }, ">");

  tl.fromTo(transitionLabel, { autoAlpha: 1 }, {
    autoAlpha: 0,
    duration: 0.4,
    overwrite: "auto",
    immediateRender: false,
  }, "startEnter+=0.1");

  tl.from(next, { y: "15vh", duration: 1 }, "startEnter");

  tl.add("pageReady");
  tl.call(resetPage, [next], "pageReady");
  tl.call(() => { document.body.style.cursor = ''; }, null, "pageReady");

  return new Promise((resolve) => {
    tl.call(resolve, null, "pageReady");
  });
}

// ==========================================================
// BARBA HOOKS + INIT
// ==========================================================

window.addEventListener("popstate", () => {
  history.scrollRestoration = "manual";
  // overflow:hidden stopt de compositor thread van Chrome met scroll-herstel
  document.documentElement.style.overflow = "hidden";
  // Toon het panel direct om eventuele flash te maskeren
  const transitionPanel = document.querySelector("[data-transition-panel]");
  if (transitionPanel) {
    gsap.set(transitionPanel, { autoAlpha: 1, yPercent: 0 });
  }
  window.scrollTo(0, 0);
  if (hasLenis && lenis) {
    lenis.scrollTo(0, { immediate: true });
    lenis.stop();
  }
}, { capture: true });

barba.hooks.before(() => {
  // Sluit het mobile menu met animatie als het open is bij het starten van een transitie
  if (closeNavFn) closeNavFn();
});

barba.hooks.beforeEnter((data) => {
  // Herstel overflow (zowel na back als forward navigatie)
  document.documentElement.style.overflow = "";

  gsap.set(data.next.container, {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
  });

  if (lenis && typeof lenis.stop === "function") {
    lenis.stop();
  }

  initBeforeEnterFunctions(data.next.container);
  applyThemeFrom(data.next.container);
  applyWebflowPageClass(data.next.html);
});


barba.hooks.enter((data) => {
  initBarbaNavUpdate(data);
});

barba.hooks.afterEnter((data) => {
  history.scrollRestoration = "manual";
  applyNavVariant(data.next.container);
  initAfterEnterFunctions(data.next.container);

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }

  if (hasScrollTrigger) {
    ScrollTrigger.refresh();
  }
});

barba.init({
  debug: true, // Zet op 'false' in productie
  timeout: 7000,
  preventRunning: true,
  transitions: [
    {
      name: "default",
      sync: true,

      async once(data) {
        initOnceFunctions();
        return runPageOnceAnimation(data.next.container);
      },

      async leave(data) {
        const navBar = document.querySelector('.nav_bar_wrap');
        if (navBar) { navBar.style.removeProperty('border-bottom-color'); navBar.classList.remove('has-border'); }
        const hint = document.querySelector('.drag_hint');
        if (hint) {
          const hintCursor = hint.querySelector('.cursor');
          if (hintCursor) { gsap.killTweensOf(hintCursor); gsap.set(hintCursor, { scale: 0 }); }
        }
        return runPageLeaveAnimation(data.current.container, data.next.container);
      },

      async enter(data) {
        return runPageEnterAnimation(data.next.container);
      },
    },
  ],
});

// ==========================================================
// HELPERS
// ==========================================================

const themeConfig = {
  light: { nav: "dark", transition: "light" },
  dark: { nav: "light", transition: "dark" },
};

function applyWebflowPageClass(nextHtml) {
  const match = nextHtml.match(/<body[^>]+class="([^"]+)"/);
  if (!match) return;
  const nextPageClass = match[1].split(' ').find(c => c.startsWith('wf-page-'));
  if (!nextPageClass) return;

  Array.from(document.body.classList)
    .filter(c => c.startsWith('wf-page-'))
    .forEach(c => document.body.classList.remove(c));

  document.body.classList.add(nextPageClass);
}

function applyNavVariant(container) {
  const hasBorder = container?.dataset?.navBorder === 'true';
  const navBar = document.querySelector('.nav_bar_wrap');
  if (!navBar) return;
  navBar.style.removeProperty('border-bottom-color');
  navBar.classList.toggle('has-border', hasBorder);
}

function applyThemeFrom(container) {
  const pageTheme = container?.dataset?.pageTheme || "light";
  const config = themeConfig[pageTheme] || themeConfig.light;

  document.body.dataset.pageTheme = pageTheme;

  const transitionEl = document.querySelector("[data-theme-transition]");
  if (transitionEl) {
    transitionEl.dataset.themeTransition = config.transition;
  }

  const nav = document.querySelector("[data-theme-nav]");
  if (nav) {
    nav.dataset.themeNav = config.nav;
  }
}

function resetPage(container) {
  window.scrollTo(0, 0);
  gsap.set(container, { clearProps: "position,top,left,right" });

  if (hasLenis) {
    lenis.resize();
    lenis.start();
  }
}

function debounceOnWidthChange(fn, ms) {
  let last = innerWidth, timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (innerWidth !== last) {
        last = innerWidth;
        fn.apply(this, args);
      }
    }, ms);
  };
}

function initBarbaNavUpdate(data) {
  const tpl = document.createElement("template");
  tpl.innerHTML = data.next.html.trim();

  // Bouw een map van href → next node zodat meerdere nav varianten
  // elk hun eigen links correct updaten ongeacht index
  const nextStateMap = new Map();
  tpl.content.querySelectorAll("[data-barba-update]").forEach((el) => {
    const href = el.getAttribute("href");
    if (href) nextStateMap.set(href, el);
  });

  document.querySelectorAll("[data-barba-update]").forEach((curr) => {
    const href = curr.getAttribute("href");
    const next = href ? nextStateMap.get(href) : null;
    if (!next) return;

    const newStatus = next.getAttribute("aria-current");
    if (newStatus !== null) {
      curr.setAttribute("aria-current", newStatus);
    } else {
      curr.removeAttribute("aria-current");
    }

    curr.setAttribute("class", next.getAttribute("class") || "");
  });
}

// ==========================================================
// HEADING REVEAL — h1 t/m h4 animeren na transitie
// ==========================================================

function initHeadingReveal() {
  const headings = gsap.utils.toArray("h1, h2, h3, h4", nextPage)
    .filter(el => !el.closest('.referentie_card'));
  if (!headings.length) return;

  headings.forEach((el) => {
    if (el._headingRevealDestroy) {
      el._headingRevealDestroy();
      el._headingRevealDestroy = null;
    }
  });

  // Wacht op fonts — anders meet SplitText met fallback font en kloppen de line breaks niet
  document.fonts.ready.then(() => {
    const splits = headings.map((el) =>
      SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true })
    );

    // Per heading een eigen ScrollTrigger — speelt meteen als al in viewport
    headings.forEach((el, i) => {
      const lines = splits[i].lines;
      const masks = lines.map((line) => line.parentElement);

      gsap.set(masks, { overflow: "visible", clipPath: "inset(-0.5em 0 -0.3em 0)" });
      gsap.set(el, { autoAlpha: 1 });
      gsap.set(lines, { y: 100, skewY: 7 });

      const inHero = !!el.closest(".hero");

      gsap.to(lines, {
        y: 0,
        skewY: 0,
        duration: 1.8,
        ease: "power4.out",
        stagger: { amount: 0.3 },
        ...(inHero ? {} : {
          scrollTrigger: {
            trigger: el,
            start: "clamp(top bottom)",
            once: true,
          },
        }),
      });

      el._headingRevealDestroy = () => {
        gsap.killTweensOf(lines);
        ScrollTrigger.getAll()
          .filter((st) => st.vars.trigger === el)
          .forEach((st) => st.kill());
        gsap.set(masks, { clearProps: "overflow,clipPath" });
        splits[i].revert();
      };
    });

    ScrollTrigger.refresh();
  });
}

// ==========================================================
// ITALIAN COFFEE — HANDWRITTEN SVG ANIMATIE
// ==========================================================

function initItalianCoffeeAutograph() {
  const svg = document.querySelector(".italian_coffee_small");
  if (!svg) return;

  if (svg._autographDestroy) {
    svg._autographDestroy();
    svg._autographDestroy = null;
  }

  const pathList = Array.from(svg.querySelectorAll("path"));

  // Verwijder eventuele clip-path attributes van vorige JS run
  pathList.forEach((path) => path.removeAttribute("clip-path"));

  // Sorteer op data-order, anders op visuele x-positie (links → rechts)
  const sortedPaths = pathList.sort((a, b) => {
    const oa = a.dataset.order, ob = b.dataset.order;
    if (oa !== undefined && ob !== undefined) return parseInt(oa) - parseInt(ob);
    return a.getBBox().x - b.getBBox().x;
  });

  // SVG verbergen totdat de animatie start (voorkomt flash)
  gsap.set(svg, { autoAlpha: 0 });

  sortedPaths.forEach((path) => {
    const length = path.getTotalLength();
    gsap.set(path, {
      strokeDasharray: length,
      strokeDashoffset: length, // Altijd positief — Safari-compatible
    });
  });

  const tl = gsap.timeline({
    onStart: () => gsap.set(svg, { autoAlpha: 0.3 }),
    ...(svg.closest(".hero") ? {} : {
      scrollTrigger: {
        trigger: svg,
        start: "clamp(top bottom)",
        once: true,
      },
    }),
  });

  sortedPaths.forEach((path) => {
    const length = path.getTotalLength();
    const isReverse = path.dataset.reverse === "true";
    tl.to(path, {
      // Reverse: length → 2*length (tekent van achter naar voren, geen negatieve waarden)
      // Normaal:  length → 0       (tekent van voor naar achter)
      strokeDashoffset: isReverse ? length * 2 : 0,
      duration: length / 370,
      ease: "expo.inOut",
    }, "=-0.5");
  });

  svg._autographDestroy = () => {
    if (tl.scrollTrigger) tl.scrollTrigger.kill();
    tl.kill();
    gsap.set(sortedPaths, { clearProps: "strokeDasharray,strokeDashoffset,opacity,visibility" });
  };
}

function initItalianCoffeeLarge() {
  const svg = nextPage.querySelector(".italian_coffee_large");
  if (!svg) return;

  if (svg._autographDestroy) {
    svg._autographDestroy();
    svg._autographDestroy = null;
  }

  const pathList = Array.from(svg.querySelectorAll("path"));
  pathList.forEach((path) => path.removeAttribute("clip-path"));

  const sortedPaths = pathList.sort((a, b) => {
    const oa = a.dataset.order, ob = b.dataset.order;
    if (oa !== undefined && ob !== undefined) return parseInt(oa) - parseInt(ob);
    return a.getBBox().x - b.getBBox().x;
  });

  gsap.set(svg, { autoAlpha: 0 });

  sortedPaths.forEach((path) => {
    const length = path.getTotalLength();
    gsap.set(path, {
      strokeDasharray: length,
      strokeDashoffset: length,
    });
  });

  const tl = gsap.timeline({
    onStart: () => gsap.set(svg, { autoAlpha: 0.3 }),
    scrollTrigger: {
      trigger: svg,
      start: "clamp(top 80%)",
      once: true,
    },
  });

  sortedPaths.forEach((path) => {
    const length = path.getTotalLength();
    const isReverse = path.dataset.reverse === "true";
    tl.to(path, {
      strokeDashoffset: isReverse ? length * 2 : 0,
      duration: length / 370,
      ease: "expo.inOut",
    }, "=-0.5");
  });

  svg._autographDestroy = () => {
    if (tl.scrollTrigger) tl.scrollTrigger.kill();
    tl.kill();
    gsap.set(sortedPaths, { clearProps: "strokeDasharray,strokeDashoffset,opacity,visibility" });
  };
}

// ==========================================================
// NAV HIDE ON SCROLL
// ==========================================================

let navHideMMCleanup = null;
let closeNavFn = null;
let followerDestroyFns = [];

// ==========================================================
// NAV ENTRANCE
// ==========================================================

function initNavEntrance() {
  const nav = document.querySelector('.nav_items');
  if (!nav) return;

  gsap.fromTo(nav,
    { autoAlpha: 0, y: -16 },
    { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: 0.2 }
  );
}

function initNavHideOnScroll() {
  if (navHideMMCleanup) {
    navHideMMCleanup();
    navHideMMCleanup = null;
  }

  const hero   = nextPage.querySelector('.hero');
  if (!hero) return;

  const nav        = document.querySelector('.nav_items_wrapper');
  const navBarWrap = document.querySelector('.nav_bar_wrap');
  const fadeBg     = document.querySelector('.fade_bg');

  // Check of er een zichtbare border-bottom aanwezig is
  const hasBorder = nextPage?.dataset?.navBorder === 'true';
  const navBorderColor = hasBorder ? 'rgba(112, 112, 112, 0.25)' : null;

  const localMM = gsap.matchMedia();

  localMM.add(
    {
      isMobile:  "(max-width:479px)",
      isTablet:  "(max-width:991px)",
      isDesktop: "(min-width:992px)",
    },
    (context) => {
      const { isDesktop } = context.conditions;

      const navChildren = nav ? Array.from(nav.children) : [];

      if (navChildren.length) gsap.set(navChildren, { yPercent: 0, autoAlpha: 1 });
      if (fadeBg) gsap.set(fadeBg, { autoAlpha: 0 });

      const st = ScrollTrigger.create({
        trigger: hero,
        start: 'bottom top',
        onEnter: () => {
          const tl = gsap.timeline();
          if (navChildren.length && isDesktop) {
            tl.to(navChildren, {
              yPercent: -40,
              autoAlpha: 0,
              duration: 0.9,
              ease: 'expo.inOut',
              stagger: { each: 0.06, from: 'end' },
            }, 0);
          }
          if (hasBorder) {
            tl.to(navBarWrap, { borderBottomColor: 'transparent', duration: 0.5, ease: 'expo.inOut' }, 0);
          }
          if (fadeBg) {
            tl.to(fadeBg, { autoAlpha: 1, duration: 0.5, ease: 'expo.out' }, isDesktop ? 0.15 : 0);
          }
        },
        onLeaveBack: () => {
          const tl = gsap.timeline();
          if (fadeBg) {
            tl.to(fadeBg, { autoAlpha: 0, duration: 0.4, ease: 'expo.inOut' }, 0);
          }
          if (hasBorder) {
            tl.to(navBarWrap, { borderBottomColor: navBorderColor, duration: 0.5, ease: 'expo.out' }, 0);
          }
          if (navChildren.length && isDesktop) {
            tl.to(navChildren, {
              yPercent: 0,
              autoAlpha: 1,
              duration: 0.6,
              ease: 'expo.out',
              stagger: { each: 0.06, from: 'start' },
            }, 0.15);
          }
        },
      });

      return () => {
        st.kill();
        if (navChildren.length) gsap.set(navChildren, { clearProps: 'transform,opacity,visibility' });
        if (fadeBg) gsap.set(fadeBg, { clearProps: 'opacity,visibility' });
        if (hasBorder) gsap.set(navBarWrap, { clearProps: 'borderBottomColor' });
      };
    }
  );

  navHideMMCleanup = () => localMM.revert();
}

// ==========================================================
// GLOBAL PARALLAX
// ==========================================================

let parallaxMMCleanup = null;

function initGlobalParallax() {
  if (parallaxMMCleanup) {
    parallaxMMCleanup();
    parallaxMMCleanup = null;
  }

  const triggers = gsap.utils.toArray('[data-parallax="trigger"]', nextPage);
  if (!triggers.length) return;

  const localMM = gsap.matchMedia();

  localMM.add(
    {
      isMobile: "(max-width:479px)",
      isMobileLandscape: "(max-width:767px)",
      isTablet: "(max-width:991px)",
      isDesktop: "(min-width:992px)",
    },
    (context) => {
      const { isMobile, isMobileLandscape, isTablet } = context.conditions;

      const ctx = gsap.context(() => {
        triggers.forEach((trigger) => {
          const disable = trigger.getAttribute("data-parallax-disable");
          if (
            (disable === "mobile" && isMobile) ||
            (disable === "mobileLandscape" && isMobileLandscape) ||
            (disable === "tablet" && isTablet)
          ) return;

          const target = trigger.querySelector('[data-parallax="target"]') || trigger;
          const direction = trigger.getAttribute("data-parallax-direction") || "vertical";
          const prop = direction === "horizontal" ? "xPercent" : "yPercent";
          const scrubAttr = trigger.getAttribute("data-parallax-scrub");
          const scrub = scrubAttr ? parseFloat(scrubAttr) : true;
          const startAttr = trigger.getAttribute("data-parallax-start");
          const startVal = startAttr !== null ? parseFloat(startAttr) : 20;
          const endAttr = trigger.getAttribute("data-parallax-end");
          const endVal = endAttr !== null ? parseFloat(endAttr) : -20;
          const scrollStartRaw = trigger.getAttribute("data-parallax-scroll-start") || "top bottom";
          const scrollEndRaw = trigger.getAttribute("data-parallax-scroll-end") || "bottom top";

          gsap.fromTo(
            target,
            { [prop]: startVal },
            {
              [prop]: endVal,
              ease: "none",
              scrollTrigger: {
                trigger,
                start: `clamp(${scrollStartRaw})`,
                end: `clamp(${scrollEndRaw})`,
                scrub,
              },
            }
          );
        });
      });

      return () => ctx.revert();
    }
  );

  parallaxMMCleanup = () => localMM.revert();
}

// ==========================================================
// STICKY FEATURES
// ==========================================================

function initStickyFeatures() {
  const wrappers = gsap.utils.toArray('[data-sticky-feature-wrap]', nextPage);
  if (!wrappers.length) return;

  // Alleen op desktop — pinning breekt layout op mobile/tablet
  if (!window.matchMedia('(min-width: 992px)').matches) {
    wrappers.forEach((w) => {
      gsap.set(w.querySelectorAll('[data-sticky-feature-visual-wrap]'), { clearProps: 'clipPath' });
      gsap.set(w.querySelectorAll('[data-sticky-feature-item]'), { clearProps: 'opacity,visibility' });
      gsap.set(w.querySelectorAll('[data-sticky-feature-text]'), { clearProps: 'opacity,visibility,transform' });
    });
    return;
  }

  wrappers.forEach((w) => {
    if (w._stickyFeaturesDestroy) {
      w._stickyFeaturesDestroy();
      w._stickyFeaturesDestroy = null;
    }

    const visualWraps = Array.from(w.querySelectorAll('[data-sticky-feature-visual-wrap]'))
      .filter(el => !el.closest('.only--mobile'));
    const items       = Array.from(w.querySelectorAll('[data-sticky-feature-item]'))
      .filter(el => !el.closest('.only--mobile'));
    const progressBar = w.querySelector('[data-sticky-feature-progress]');

    if (visualWraps.length !== items.length) {
      console.warn('[initStickyFeatures] visualWraps en items tellen niet overeen:', {
        visualWraps: visualWraps.length, items: items.length, wrap: w,
      });
    }

    const count = Math.min(visualWraps.length, items.length);
    if (count < 1) return;

    const DURATION     = reducedMotion ? 0.01 : 0.75;
    const EASE         = 'power4.inOut';
    const SCROLL_AMOUNT = 0.5;

    const getTexts = (el) => Array.from(el.querySelectorAll('[data-sticky-feature-text]'));

    // Expliciete beginstate — ook na Barba-transitie correct
    gsap.set(items, { autoAlpha: 0 });
    visualWraps.forEach((vw, i) => {
      gsap.set(vw, { clipPath: i === 0 ? 'inset(0% round 0.75em)' : 'inset(50% round 0.75em)' });
    });
    gsap.set(items[0], { autoAlpha: 1 });
    gsap.set(getTexts(items[0]), { autoAlpha: 1, y: 0 });

    let currentIndex = 0;

    function transition(fromIndex, toIndex) {
      if (fromIndex === toIndex) return;
      const tl = gsap.timeline({ defaults: { overwrite: 'auto' } });
      if (fromIndex < toIndex) {
        tl.to(visualWraps[toIndex], { clipPath: 'inset(0% round 0.75em)', duration: DURATION, ease: EASE }, 0);
      } else {
        tl.to(visualWraps[fromIndex], { clipPath: 'inset(50% round 0.75em)', duration: DURATION, ease: EASE }, 0);
      }
      animateOut(items[fromIndex]);
      animateIn(items[toIndex]);
    }

    function animateOut(itemEl) {
      const texts = getTexts(itemEl);
      gsap.to(texts, {
        autoAlpha: 0, y: -30, ease: 'power4.out', duration: 0.4,
        onComplete: () => gsap.set(itemEl, { autoAlpha: 0 }),
      });
    }

    function animateIn(itemEl) {
      const texts = getTexts(itemEl);
      gsap.set(itemEl, { autoAlpha: 1 });
      gsap.fromTo(texts,
        { autoAlpha: 0, y: 30 },
        { autoAlpha: 1, y: 0, ease: 'power4.out', duration: DURATION, stagger: 0.1 }
      );
    }

    const steps = Math.max(1, count - 1);

    const st = ScrollTrigger.create({
      trigger: w,
      start: 'center center',
      end: () => `+=${steps * 150}%`,
      pin: true,
      pinType: 'transform',
      scrub: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => {
        const p   = Math.min(self.progress, SCROLL_AMOUNT) / SCROLL_AMOUNT;
        let idx   = Math.floor(p * steps + 1e-6);
        idx       = Math.max(0, Math.min(steps, idx));

        if (progressBar) gsap.to(progressBar, { scaleX: self.progress, ease: 'none' });

        if (idx !== currentIndex) {
          transition(currentIndex, idx);
          currentIndex = idx;
        }
      },
    });

    w._stickyFeaturesDestroy = () => {
      st.kill();
      gsap.set(visualWraps, { clearProps: 'clipPath' });
      gsap.set(items, { clearProps: 'opacity,visibility' });
      gsap.set(w.querySelectorAll('[data-sticky-feature-text]'), { clearProps: 'opacity,visibility,transform' });
      if (progressBar) gsap.set(progressBar, { clearProps: 'transform' });
    };
  });
}

// ==========================================================
// MARQUEE SCROLL DIRECTION
// ==========================================================

function initMarqueeScrollDirection() {
  gsap.utils.toArray('[data-marquee-scroll-direction-target]', nextPage).forEach((marquee) => {
    const marqueeContent = marquee.querySelector('[data-marquee-collection-target]');
    const marqueeScroll  = marquee.querySelector('[data-marquee-scroll-target]');
    if (!marqueeContent || !marqueeScroll) return;

    const { marqueeSpeed: speed, marqueeDirection: direction, marqueeDuplicate: duplicate, marqueeScrollSpeed: scrollSpeed } = marquee.dataset;

    const marqueeSpeedAttr     = parseFloat(speed);
    const marqueeDirectionAttr = direction === 'right' ? 1 : -1;
    const duplicateAmount      = parseInt(duplicate || 0);
    const scrollSpeedAttr      = parseFloat(scrollSpeed);
    const speedMultiplier      = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;

    let marqueeSpeed = marqueeSpeedAttr * (marqueeContent.offsetWidth / window.innerWidth) * speedMultiplier;

    marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
    marqueeScroll.style.width      = `${(scrollSpeedAttr * 2) + 100}%`;

    if (duplicateAmount > 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < duplicateAmount; i++) {
        fragment.appendChild(marqueeContent.cloneNode(true));
      }
      marqueeScroll.appendChild(fragment);
    }

    const marqueeItems = marquee.querySelectorAll('[data-marquee-collection-target]');
    const animation = gsap.to(marqueeItems, {
      xPercent: -100,
      repeat: -1,
      duration: marqueeSpeed,
      ease: 'linear'
    }).totalProgress(0.5);

    gsap.set(marqueeItems, { xPercent: marqueeDirectionAttr === 1 ? 100 : -100 });
    animation.timeScale(marqueeDirectionAttr);
    animation.play();

    marquee.setAttribute('data-marquee-status', 'normal');

    ScrollTrigger.create({
      trigger: marquee,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const currentDirection = self.direction === 1 ? -marqueeDirectionAttr : marqueeDirectionAttr;
        animation.timeScale(currentDirection);
        marquee.setAttribute('data-marquee-status', self.direction === 1 ? 'normal' : 'inverted');
      }
    });

    const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
    gsap.timeline({
      scrollTrigger: {
        trigger: marquee,
        start: '0% 100%',
        end: '100% 0%',
        scrub: 0
      }
    }).fromTo(marqueeScroll, { x: `${scrollStart}vw` }, { x: `${-scrollStart}vw`, ease: 'none' });
  });
}

// ==========================================================
// DRAGGABLE MARQUEE
// ==========================================================

function initDraggableMarquee() {
  const wrappers = gsap.utils.toArray('[data-draggable-marquee-init]', nextPage);
  if (!wrappers.length) return;

  const getNumberAttr = (el, name, fallback) => {
    const value = parseFloat(el.getAttribute(name));
    return Number.isFinite(value) ? value : fallback;
  };

  wrappers.forEach((wrapper) => {
    if (wrapper._marqueeDestroy) {
      wrapper._marqueeDestroy();
      wrapper._marqueeDestroy = null;
    }

    const collection = wrapper.querySelector('[data-draggable-marquee-collection]');
    const list       = wrapper.querySelector('[data-draggable-marquee-list]');
    if (!collection || !list) return;

    const duration    = getNumberAttr(wrapper, 'data-duration', 20);
    const multiplier  = getNumberAttr(wrapper, 'data-multiplier', 40);
    const sensitivity = getNumberAttr(wrapper, 'data-sensitivity', 0.01);

    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const listWidth    = list.scrollWidth || list.getBoundingClientRect().width;
    if (!wrapperWidth || !listWidth) return;

    // Dupliceer totdat de collectie breed genoeg is
    const minRequiredWidth = wrapperWidth + listWidth + 2;
    while (collection.scrollWidth < minRequiredWidth) {
      const listClone = list.cloneNode(true);
      listClone.setAttribute('data-draggable-marquee-clone', '');
      listClone.setAttribute('aria-hidden', 'true');
      collection.appendChild(listClone);
    }

    const wrapX = gsap.utils.wrap(-listWidth, 0);
    gsap.set(collection, { x: 0 });

    const marqueeLoop = gsap.to(collection, {
      x: -listWidth,
      duration,
      ease: 'none',
      repeat: -1,
      onReverseComplete: () => marqueeLoop.progress(1),
      modifiers: { x: (x) => wrapX(parseFloat(x)) + 'px' },
    });

    const initialDirectionAttr = (wrapper.getAttribute('data-direction') || 'left').toLowerCase();
    const baseDirection = initialDirectionAttr === 'right' ? -1 : 1;
    const timeScale = { value: baseDirection };

    wrapper.setAttribute('data-direction', baseDirection < 0 ? 'right' : 'left');
    if (baseDirection < 0) marqueeLoop.progress(1);

    function applyTimeScale() {
      marqueeLoop.timeScale(timeScale.value);
      wrapper.setAttribute('data-direction', timeScale.value < 0 ? 'right' : 'left');
    }
    applyTimeScale();

    const marqueeObserver = Observer.create({
      target: wrapper,
      type: 'pointer,touch',
      preventDefault: true,
      debounce: false,
      onChangeX: (observerEvent) => {
        let velocityTimeScale = observerEvent.velocityX * -sensitivity;
        velocityTimeScale = gsap.utils.clamp(-multiplier, multiplier, velocityTimeScale);
        gsap.killTweensOf(timeScale);
        const restingDirection = velocityTimeScale < 0 ? -1 : 1;
        gsap.timeline({ onUpdate: applyTimeScale })
          .to(timeScale, { value: velocityTimeScale, duration: 0.1, overwrite: true })
          .to(timeScale, { value: restingDirection, duration: 1.0 });
      },
    });

    const st = ScrollTrigger.create({
      trigger: wrapper,
      start: 'top bottom',
      end: 'bottom top',
      onEnter:     () => { marqueeLoop.resume(); applyTimeScale(); marqueeObserver.enable(); },
      onEnterBack: () => { marqueeLoop.resume(); applyTimeScale(); marqueeObserver.enable(); },
      onLeave:     () => { marqueeLoop.pause(); marqueeObserver.disable(); },
      onLeaveBack: () => { marqueeLoop.pause(); marqueeObserver.disable(); },
    });

    wrapper._marqueeDestroy = () => {
      st.kill();
      marqueeLoop.kill();
      marqueeObserver.kill();
      gsap.killTweensOf(timeScale);
      gsap.set(collection, { clearProps: 'x' });
      collection.querySelectorAll('[data-draggable-marquee-clone]').forEach(el => el.remove());
    };
  });
}

// ==========================================================
// BUNNY BACKGROUND VIDEO
// ==========================================================

function initBunnyPlayerBackground() {
  const players = gsap.utils.toArray('[data-bunny-background-init]', nextPage);
  if (!players.length) return;

  function readyIfIdle(player, pendingPlay) {
    if (!pendingPlay &&
        player.getAttribute('data-player-activated') !== 'true' &&
        player.getAttribute('data-player-status') === 'idle') {
      player.setAttribute('data-player-status', 'ready');
    }
  }

  function safePlay(video) {
    var p = video.play();
    if (p && typeof p.then === 'function') p.catch(function(){});
  }

  players.forEach(function(player) {
    // Cleanup previous instance
    if (player._bunnyDestroy) {
      player._bunnyDestroy();
      player._bunnyDestroy = null;
    }

    var src = player.getAttribute('data-player-src');
    if (!src) return;

    var video = player.querySelector('video');
    if (!video) return;

    try { video.pause(); } catch(_) {}
    try { video.removeAttribute('src'); video.load(); } catch(_) {}

    function setStatus(s) {
      if (player.getAttribute('data-player-status') !== s) {
        player.setAttribute('data-player-status', s);
      }
    }
    function setActivated(v) { player.setAttribute('data-player-activated', v ? 'true' : 'false'); }
    if (!player.hasAttribute('data-player-activated')) setActivated(false);

    var lazyMode   = player.getAttribute('data-player-lazy');
    var isLazyTrue = lazyMode === 'true';
    var autoplay   = player.getAttribute('data-player-autoplay') === 'true';
    var initialMuted = player.getAttribute('data-player-muted') === 'true';
    var pendingPlay = false;

    if (autoplay) { video.muted = true; video.loop = true; }
    else { video.muted = initialMuted; }

    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
    if (autoplay) video.autoplay = false;

    var isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl');
    var canUseHlsJs    = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

    var isAttached = false;
    var lastPauseBy = '';

    function attachMediaOnce() {
      if (isAttached) return;
      isAttached = true;

      if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }

      if (isSafariNative) {
        video.preload = isLazyTrue ? 'none' : 'auto';
        video.src = src;
        video.addEventListener('loadedmetadata', function() {
          readyIfIdle(player, pendingPlay);
        }, { once: true });
      } else if (canUseHlsJs) {
        var hls = new Hls({ maxBufferLength: 10 });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function() { hls.loadSource(src); });
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          readyIfIdle(player, pendingPlay);
        });
        player._hls = hls;
      } else {
        video.src = src;
      }
    }

    if (isLazyTrue) {
      video.preload = 'none';
    } else {
      attachMediaOnce();
    }

    function togglePlay() {
      if (video.paused || video.ended) {
        if (isLazyTrue && !isAttached) attachMediaOnce();
        pendingPlay = true;
        lastPauseBy = '';
        setStatus('loading');
        safePlay(video);
      } else {
        lastPauseBy = 'manual';
        video.pause();
      }
    }

    function toggleMute() {
      video.muted = !video.muted;
      player.setAttribute('data-player-muted', video.muted ? 'true' : 'false');
    }

    function onPlayerClick(e) {
      var btn = e.target.closest('[data-player-control]');
      if (!btn || !player.contains(btn)) return;
      var type = btn.getAttribute('data-player-control');
      if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
      else if (type === 'mute') toggleMute();
    }

    player.addEventListener('click', onPlayerClick);

    video.addEventListener('play',    function() { setActivated(true); setStatus('playing'); });
    video.addEventListener('playing', function() {
      pendingPlay = false;
      setStatus('playing');
      // Exclusief afspelen binnen .referentie_card: pauzeer alle andere card-spelers
      if (player.closest('.referentie_card')) {
        players.forEach(function(other) {
          if (other === player) return;
          if (!other.closest('.referentie_card')) return;
          var otherVideo = other.querySelector('video');
          if (otherVideo && !otherVideo.paused) otherVideo.pause();
        });
      }
    });
    video.addEventListener('pause',   function() { pendingPlay = false; setStatus('paused'); });
    video.addEventListener('waiting', function() { setStatus('loading'); });
    video.addEventListener('canplay', function() { readyIfIdle(player, pendingPlay); });
    video.addEventListener('ended',   function() { pendingPlay = false; setStatus('paused'); setActivated(false); });

    if (autoplay) {
      if (player._io) { try { player._io.disconnect(); } catch(_) {} }
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          var inView = entry.isIntersecting && entry.intersectionRatio > 0;
          if (inView) {
            if (isLazyTrue && !isAttached) attachMediaOnce();
            if ((lastPauseBy === 'io') || (video.paused && lastPauseBy !== 'manual')) {
              setStatus('loading');
              if (video.paused) togglePlay();
              lastPauseBy = '';
            }
          } else {
            if (!video.paused && !video.ended) {
              lastPauseBy = 'io';
              video.pause();
            }
          }
        });
      }, { threshold: 0.1 });
      io.observe(player);
      player._io = io;
    }

    // Card animations — alleen actief als player in een .referentie_card zit
    var cardFade        = null;
    var cardSplits      = [];
    var cardTl          = null;
    var onCardPlaying   = null;
    var onCardPause     = null;
    var onCardEnded     = null;

    var refCard = player.closest('.referentie_card');
    if (refCard) {
      cardFade = refCard.querySelector('.card_fade');
      var cardContent = refCard.querySelector('.referentie_card_content');
      var contentEls  = cardContent ? gsap.utils.toArray('h3, p, [class*="text"]', cardContent) : [];

      function buildSplits() {
        cardSplits.forEach(function(s) { try { s.revert(); } catch(_) {} });
        cardSplits = contentEls.map(function(el) {
          return SplitText.create(el, { type: 'lines', mask: 'lines', autoSplit: true });
        });
      }

      function animateCardOut() {
        if (cardTl) cardTl.kill();
        cardTl = gsap.timeline();
        if (cardFade) cardTl.to(cardFade, { opacity: 0, duration: 0.5, ease: 'expo.out' }, 0);
        cardSplits.forEach(function(split) {
          if (split.lines.length) {
            cardTl.to(split.lines, { yPercent: -110, duration: 0.6, ease: 'expo.out', stagger: 0.06 }, 0);
          }
        });
      }

      function animateCardIn() {
        if (cardTl) cardTl.kill();
        cardTl = gsap.timeline();
        if (cardFade) cardTl.to(cardFade, { opacity: 1, duration: 0.7, ease: 'expo.out' }, 0);
        cardSplits.forEach(function(split) {
          if (split.lines.length) {
            cardTl.fromTo(split.lines,
              { yPercent: 110 },
              { yPercent: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08 },
              0.05
            );
          }
        });
      }

      buildSplits();

      onCardPlaying = animateCardOut;
      onCardPause   = animateCardIn;
      onCardEnded   = animateCardIn;

      video.addEventListener('playing', onCardPlaying);
      video.addEventListener('pause',   onCardPause);
      video.addEventListener('ended',   onCardEnded);
    }

    player._bunnyDestroy = function() {
      player.removeEventListener('click', onPlayerClick);
      if (player._io) { try { player._io.disconnect(); } catch(_) {} player._io = null; }
      if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }
      try { video.pause(); video.removeAttribute('src'); video.load(); } catch(_) {}
      if (onCardPlaying) video.removeEventListener('playing', onCardPlaying);
      if (onCardPause)   video.removeEventListener('pause',   onCardPause);
      if (onCardEnded)   video.removeEventListener('ended',   onCardEnded);
      cardSplits.forEach(function(s) { try { s.revert(); } catch(_) {} });
      if (cardTl) cardTl.kill();
    };
  });
}

// ==========================================================
// FULLSCREEN NAVIGATION
// ==========================================================

function initBoldFullScreenNavigation() {
  const navStatusEl = document.querySelector('[data-navigation-status]');
  if (!navStatusEl) return;

  if (navStatusEl._navDestroy) {
    navStatusEl._navDestroy();
    navStatusEl._navDestroy = null;
  }

  // Stripes binnen de nav
  const stripes = gsap.utils.toArray('.stripe', navStatusEl);
  let stripeTl = null;

  function buildStripeTl() {
    if (stripeTl) stripeTl.kill();
    if (!stripes.length) return;
    stripeTl = gsap.timeline({ paused: true });
    stripeTl.fromTo(stripes,
      { scaleX: 0, transformOrigin: 'left center' },
      { scaleX: 1, duration: 1.2, ease: 'osmo', stagger: 0.15 }
    );
  }
  buildStripeTl();

  function openNav() {
    navStatusEl.setAttribute('data-navigation-status', 'active');
    lockScroll();
    buildStripeTl();
    if (stripeTl) stripeTl.play(0);
  }

  function closeNav() {
    if (navStatusEl.getAttribute('data-navigation-status') !== 'active') return;
    navStatusEl.setAttribute('data-navigation-status', 'not-active');
    unlockScroll();
    if (stripeTl) stripeTl.reverse();
  }

  // Globaal beschikbaar maken zodat barba.hooks.before en same-page links hem kunnen aanroepen
  closeNavFn = closeNav;

  function onToggleClick() {
    navStatusEl.getAttribute('data-navigation-status') === 'not-active' ? openNav() : closeNav();
  }

  function onCloseClick() { closeNav(); }

  function onKeyDown(e) {
    if (e.keyCode === 27) closeNav();
  }

  // Sluit nav bij klik op een nav-link (ook als het de huidige pagina is — Barba navigeert dan niet)
  function onNavLinkClick() { closeNav(); }
  const navLinks = navStatusEl.querySelectorAll('a[href]');

  const toggleBtns = document.querySelectorAll('[data-navigation-toggle="toggle"]');
  const closeBtns  = document.querySelectorAll('[data-navigation-toggle="close"]');

  toggleBtns.forEach(btn => btn.addEventListener('click', onToggleClick));
  closeBtns.forEach(btn  => btn.addEventListener('click', onCloseClick));
  navLinks.forEach(link  => link.addEventListener('click', onNavLinkClick));
  document.addEventListener('keydown', onKeyDown);

  navStatusEl._navDestroy = () => {
    toggleBtns.forEach(btn => btn.removeEventListener('click', onToggleClick));
    closeBtns.forEach(btn  => btn.removeEventListener('click', onCloseClick));
    navLinks.forEach(link  => link.removeEventListener('click', onNavLinkClick));
    document.removeEventListener('keydown', onKeyDown);
    if (stripeTl) { stripeTl.kill(); stripeTl = null; }
    closeNavFn = null;
  };
}

// ==========================================================
// STRIPE REVEAL
// ==========================================================

function initStripeReveal() {
  const wrappers = gsap.utils.toArray('.stripe_wrapper', nextPage);
  if (!wrappers.length) return;

  wrappers.forEach((wrapper) => {
    if (wrapper._stripeRevealDestroy) {
      wrapper._stripeRevealDestroy();
      wrapper._stripeRevealDestroy = null;
    }

    const stripes = gsap.utils.toArray('.stripe', wrapper);
    if (!stripes.length) return;

    const isScrub = wrapper.closest('.regular_container[data-on-scroll="true"]') !== null;

    if (isScrub) {
      // Aparte ScrollTrigger per stripe met offset start voor stagger-effect
      stripes.forEach((stripe, i) => {
        const offset = i * 8; // % offset per stripe
        gsap.from(stripe, {
          scaleX: 0,
          transformOrigin: 'left center',
          ease: 'none',
          scrollTrigger: {
            trigger: wrapper,
            start: `clamp(top ${80 - offset}%)`,
            end: `clamp(bottom ${50 - offset}%)`,
            scrub: true,
          },
        });
      });
    } else {
      gsap.from(stripes, {
        scaleX: 0,
        transformOrigin: 'left center',
        duration: 1.2,
        ease: 'osmo',
        stagger: 0.15,
        scrollTrigger: {
          trigger: wrapper,
          start: 'clamp(top bottom)',
          once: true,
        },
      });
    }

    wrapper._stripeRevealDestroy = () => {
      ScrollTrigger.getAll()
        .filter((st) => st.vars.trigger === wrapper)
        .forEach((st) => st.kill());
      gsap.set(stripes, { clearProps: 'transform' });
    };
  });
}

// ==========================================================
// FOOTER PARALLAX
// ==========================================================

function initFooterParallax() {
  const els = gsap.utils.toArray('[data-footer-parallax]', nextPage);
  if (!els.length) return;

  els.forEach((el) => {
    if (el._footerParallaxDestroy) {
      el._footerParallaxDestroy();
      el._footerParallaxDestroy = null;
    }

    const inner = el.querySelector('[data-footer-parallax-inner]');
    const dark  = el.querySelector('[data-footer-parallax-dark]');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: 'clamp(top bottom)',
        end: 'clamp(top top)',
        scrub: true,
      },
    });

    if (inner) tl.from(inner, { yPercent: -40, ease: 'none' });
    if (dark)  tl.from(dark,  { opacity: 0.5,  ease: 'none' }, '<');

    el._footerParallaxDestroy = () => {
      if (tl.scrollTrigger) tl.scrollTrigger.kill();
      tl.kill();
    };
  });
}

// ==========================================================
// ROTATED CARD SCROLL ANIMATION
// ==========================================================

function initRotatedCard() {
  const card = nextPage.querySelector('.rotated_card');
  if (!card) return;

  if (card._rotatedCardDestroy) {
    card._rotatedCardDestroy();
    card._rotatedCardDestroy = null;
  }

  const trigger = card.closest('.cta_wrapper') || card;
  const borderRadius = getComputedStyle(document.documentElement)
    .getPropertyValue('--_spacing---border-radius--large').trim() || '1.25rem';

  gsap.fromTo(card,
    { rotation: 0, clipPath: `inset(12% round ${borderRadius})` },
    {
      rotation: 6,
      clipPath: `inset(0% round ${borderRadius})`,
      ease: 'none',
      scrollTrigger: {
        trigger,
        start: 'clamp(top 90%)',
        end: 'clamp(bottom 60%)',
        scrub: true,
      }
    }
  );

  card._rotatedCardDestroy = () => {
    ScrollTrigger.getAll()
      .filter(st => st.vars.trigger === trigger)
      .forEach(st => st.kill());
    gsap.set(card, { clearProps: 'transform,clipPath' });
  };
}

// ==========================================================
// PREVIEW FOLLOWER CURSOR
// ==========================================================

function initPreviewFollower() {
  // Ruim altijd vorige instanties op — ook als de oude wrap al uit de DOM is (Barba)
  followerDestroyFns.forEach(fn => fn());
  followerDestroyFns = [];

  const wrappers = gsap.utils.toArray('[data-follower-wrap]', nextPage);
  if (!wrappers.length) return;

  // Cursor-element is persistent — uit de Barba container halen zodat het transitions overleeft
  const follower = document.querySelector('[data-follower-cursor]');
  const followerInner = follower ? follower.querySelector('[data-follower-cursor-inner]') : null;
  if (follower && follower.closest('[data-barba="container"]')) {
    document.body.appendChild(follower);
  }

  if (!follower || !followerInner) return;

  wrappers.forEach(wrap => {

    const collection = wrap.querySelector('[data-follower-collection]');
    const items      = wrap.querySelectorAll('[data-follower-item]');

    if (!collection || !items.length) return;

    let prevIndex  = null;
    let firstEntry = true;

    const offset   = 100;
    const duration = 0.5;
    const ease     = 'power2.inOut';

    gsap.set(follower, { xPercent: -50, yPercent: -50 });

    const xTo = gsap.quickTo(follower, 'x', { duration: 0.6, ease: 'power3' });
    const yTo = gsap.quickTo(follower, 'y', { duration: 0.6, ease: 'power3' });

    function onMouseMove(e) { xTo(e.clientX); yTo(e.clientY); }
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    function onItemEnter(index) {
      const forward = prevIndex === null || index > prevIndex;
      prevIndex = index;

      follower.querySelectorAll('[data-follower-visual]').forEach(el => {
        gsap.killTweensOf(el);
        gsap.to(el, { yPercent: forward ? -offset : offset, duration, ease, overwrite: 'auto', onComplete: () => el.remove() });
      });

      const visual = items[index].querySelector('[data-follower-visual]');
      if (!visual) return;
      const clone = visual.cloneNode(true);
      followerInner.appendChild(clone);

      if (!firstEntry) {
        gsap.fromTo(clone,
          { yPercent: forward ? offset : -offset },
          { yPercent: 0, duration, ease, overwrite: 'auto' }
        );
      } else {
        firstEntry = false;
      }
    }

    function onItemLeave() {
      const el = follower.querySelector('[data-follower-visual]');
      if (!el) return;
      gsap.killTweensOf(el);
      gsap.to(el, { yPercent: -offset, duration, ease, overwrite: 'auto', onComplete: () => el.remove() });
    }

    function onCollectionLeave() {
      follower.querySelectorAll('[data-follower-visual]').forEach(el => {
        gsap.killTweensOf(el);
        gsap.delayedCall(duration, () => el.remove());
      });
      firstEntry = true;
      prevIndex  = null;
    }

    const enterHandlers = Array.from(items).map((item, i) => {
      const fn = () => onItemEnter(i);
      item.addEventListener('mouseenter', fn);
      return fn;
    });

    const leaveHandlers = Array.from(items).map((item) => {
      item.addEventListener('mouseleave', onItemLeave);
      return onItemLeave;
    });

    collection.addEventListener('mouseleave', onCollectionLeave);

    wrap._followerDestroy = () => {
      window.removeEventListener('mousemove', onMouseMove);
      Array.from(items).forEach((item, i) => {
        item.removeEventListener('mouseenter', enterHandlers[i]);
        item.removeEventListener('mouseleave', leaveHandlers[i]);
      });
      collection.removeEventListener('mouseleave', onCollectionLeave);
      followerInner.querySelectorAll('[data-follower-visual]').forEach(el => el.remove());
    };

    followerDestroyFns.push(wrap._followerDestroy);
  });
}

// ==========================================================
// DRAG HINT CURSOR
// ==========================================================

function initDragHint() {
  const hint = document.querySelector('.drag_hint');
  if (!hint) return;

  // Uit de Barba container halen zodat het element page transitions overleeft
  if (hint.closest('[data-barba="container"]')) {
    document.body.appendChild(hint);
  }

  if (hint._dragHintDestroy) {
    hint._dragHintDestroy();
    hint._dragHintDestroy = null;
  }

  // Always hide first — only show if this page has draggable targets
  gsap.set(hint, { autoAlpha: 0 });

  const targets = gsap.utils.toArray('[data-draggable-marquee-init], [data-cursor]', nextPage);
  if (!targets.length) return;

  const cursor = hint.querySelector('.cursor');
  const cursorText = hint.querySelector('.cursor__text');
  const defaultText = cursorText ? cursorText.textContent : '';

  // Positie op hint, scale op cursor — zodat killTweensOf nooit conflicteert
  gsap.set(hint,   { xPercent: -50, yPercent: -50, x: lastMouseX, y: lastMouseY, autoAlpha: 1 });
  gsap.set(cursor, { scale: 0 });

  // Cursor volgt muis
  const xTo = gsap.quickTo(hint, 'x', { duration: 0.6, ease: 'power3' });
  const yTo = gsap.quickTo(hint, 'y', { duration: 0.6, ease: 'power3' });

  let isVisible = false;

  function onMove(e) {
    xTo(e.clientX);
    yTo(e.clientY);
  }

  function show(e) {
    if (cursorText) {
      const text = e.currentTarget.getAttribute('data-cursor-text');
      cursorText.textContent = text || defaultText;
    }
    if (isVisible) return;
    isVisible = true;
    gsap.killTweensOf(cursor);
    gsap.to(cursor, { scale: 1, duration: 0.6, ease: 'elastic.out(1, 0.55)' });
  }

  function hide() {
    if (!isVisible) return;
    isVisible = false;
    gsap.killTweensOf(cursor);
    gsap.to(cursor, { scale: 0, duration: 0.25, ease: 'back.in(2)' });
  }

  window.addEventListener('pointermove', onMove, { passive: true });

  targets.forEach((el) => {
    el.addEventListener('mouseenter', show);
    el.addEventListener('mouseleave', hide);
  });

  hint._dragHintDestroy = () => {
    window.removeEventListener('pointermove', onMove);
    targets.forEach((el) => {
      el.removeEventListener('mouseenter', show);
      el.removeEventListener('mouseleave', hide);
    });
    gsap.killTweensOf(hint);
    gsap.killTweensOf(cursor);
    gsap.set(cursor, { scale: 0 });
  };
}

// ==========================================================
// HERO ENTRANCE
// ==========================================================

function initHeroEntrance() {
  const hero = nextPage.querySelector('.hero');
  if (!hero) return;

  if (hero._heroEntranceDestroy) {
    hero._heroEntranceDestroy();
    hero._heroEntranceDestroy = null;
  }

  const bg         = hero.querySelector('.bunny-bg');
  const icon       = hero.querySelector('.capra_nera_icon');
  const trustpilot = hero.querySelector('.trustpilot_score');
  const subtext    = hero.querySelector('.text_ultrasmall');
  const marquee    = hero.querySelector('.marquee-advanced');
  const bodyText   = hero.querySelector('.text_main');

  // BG — langzame fade + zoom out, start direct
  if (bg) {
    gsap.to(bg, { opacity: 1, scale: 1, duration: 1.8, ease: 'power2.out', delay: 0.1 });
  }

  // Icon — drifts omhoog vóór de heading
  if (icon) {
    gsap.to(icon, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', delay: 0.3 });
  }

  // Trustpilot score — na headings
  if (trustpilot) {
    gsap.to(trustpilot, { opacity: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: 0.9 });
  }

  // Kleine trustpilot tekst — iets na de score
  if (subtext) {
    gsap.to(subtext, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', delay: 1.05 });
  }

  // Marquee — verborgen tot hij na init gesettled is
  if (marquee) {
    gsap.to(marquee, { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 1.3 });
  }

  // Body tekst — na de heading
  if (bodyText) {
    gsap.to(bodyText, { opacity: 1, y: 0, duration: 0.7, ease: 'expo.out', delay: 0.75 });
  }

  hero._heroEntranceDestroy = () => {
    [bg, icon, trustpilot, subtext, marquee, bodyText].forEach(el => {
      if (el) gsap.killTweensOf(el);
    });
    gsap.set([bg, icon, trustpilot, subtext, marquee, bodyText].filter(Boolean), { clearProps: 'all' });
  };
}

// ==========================================================
// STARS REVEAL
// ==========================================================

function initStarsReveal() {
  const wrappers = gsap.utils.toArray('.stars_wrapper', nextPage);
  if (!wrappers.length) return;

  wrappers.forEach((wrapper) => {
    const stars = gsap.utils.toArray('.star', wrapper);
    if (!stars.length) return;

    gsap.set(stars, { opacity: 0, scale: 0, rotation: -20, y: 10, transformOrigin: 'center center' });

    ScrollTrigger.create({
      trigger: wrapper,
      start: 'clamp(top 85%)',
      once: true,
      onEnter: () => {
        gsap.to(stars, {
          opacity: 1,
          scale: 1,
          rotation: 0,
          y: 0,
          duration: 0.9,
          ease: 'back.out(2)',
          stagger: 0.1,
        });
      },
    });
  });
}

// ==========================================================
// PROEF STICKER
// ==========================================================

function initProefSticker() {
  const stickers = gsap.utils.toArray('.proef_sticker', nextPage);
  if (!stickers.length) return;

  stickers.forEach((sticker) => {
    if (sticker._stickerDestroy) {
      sticker._stickerDestroy();
      sticker._stickerDestroy = null;
    }

    const arrow    = sticker.querySelector('.svg');
    const inHero   = !!sticker.closest('.hero');

    gsap.set(sticker, { scale: 0, rotation: -25, opacity: 0, transformOrigin: 'center center' });

    // Entrance — hero: delay, anders ScrollTrigger
    const entranceTl = gsap.timeline(
      inHero
        ? { delay: 1.4 }
        : { scrollTrigger: { trigger: sticker, start: 'clamp(top 85%)', once: true } }
    );
    entranceTl.to(sticker, {
      scale: 1,
      rotation: 0,
      opacity: 1,
      duration: 1,
      ease: 'elastic.out(1, 0.5)',
    });

    // Nudge — start pas nadat entrance klaar is
    const nudgeDelay = 0.2;
    const nudgeTl = gsap.timeline({ repeat: -1, repeatDelay: 4, delay: nudgeDelay, paused: true });
    nudgeTl
      .to(sticker, { rotation: 6,  duration: 0.25, ease: 'power2.out' })
      .to(sticker, { rotation: -4, duration: 0.2,  ease: 'power2.inOut' })
      .to(sticker, { rotation: 0,  duration: 0.5,  ease: 'elastic.out(1, 0.4)' });

    const arrowNudge = arrow
      ? gsap.timeline({ repeat: -1, repeatDelay: 4, delay: nudgeDelay + 0.15, paused: true })
      : null;
    if (arrowNudge) {
      arrowNudge
        .to(arrow, { x: 5,  duration: 0.2,  ease: 'power2.out' })
        .to(arrow, { x: -3, duration: 0.15, ease: 'power2.inOut' })
        .to(arrow, { x: 0,  duration: 0.4,  ease: 'elastic.out(1, 0.4)' });
    }

    // Start nudge pas zodra entrance klaar is
    entranceTl.call(() => {
      nudgeTl.play();
      if (arrowNudge) arrowNudge.play();
    });

    sticker._stickerDestroy = () => {
      entranceTl.kill();
      nudgeTl.kill();
      if (arrowNudge) arrowNudge.kill();
      if (entranceTl.scrollTrigger) entranceTl.scrollTrigger.kill();
      gsap.killTweensOf(sticker);
      if (arrow) gsap.killTweensOf(arrow);
      gsap.set(sticker, { clearProps: 'all' });
    };
  });
}

// ==========================================================
// INIT ALL (called na elke Barba transitie)
// ==========================================================
// PARALLAX SLIDESHOW
// ==========================================================

CustomEase.create("slideshow-wipe", "0.6, 0.08, 0.02, 0.99");

function initSlideShow(el) {
  if (el._slideshowDestroy) {
    el._slideshowDestroy();
    el._slideshowDestroy = null;
  }

  const slides  = Array.from(el.querySelectorAll('[data-slideshow="slide"]'));
  const inner   = Array.from(el.querySelectorAll('[data-slideshow="parallax"]'));
  const btnNext = el.querySelector('[arrow-direction="forward"]');
  const btnPrev = el.querySelector('[arrow-direction="back"]');

  if (!slides.length) return;

  let current  = 0;
  let animating = false;
  const length = slides.length;
  const animationDuration = 0.9;

  slides[current].classList.add('is--current');

  function navigate(direction) {
    if (animating) return;
    animating = true;

    const previous = current;
    current = direction === 1
      ? current < length - 1 ? current + 1 : 0
      : current > 0 ? current - 1 : length - 1;

    const currentSlide  = slides[previous];
    const currentInner  = inner[previous];
    const upcomingSlide = slides[current];
    const upcomingInner = inner[current];

    gsap.timeline({
      defaults: { duration: animationDuration, ease: 'slideshow-wipe' },
      onStart() {
        upcomingSlide.classList.add('is--current');
      },
      onComplete() {
        currentSlide.classList.remove('is--current');
        animating = false;
      }
    })
      .to(currentSlide,  { xPercent: -direction * 100 }, 0)
      .to(currentInner,  { xPercent:  direction * 50  }, 0)
      .fromTo(upcomingSlide, { xPercent: direction * 100 }, { xPercent: 0 }, 0)
      .fromTo(upcomingInner, { xPercent: -direction * 50 }, { xPercent: 0 }, 0);
  }

  function onNext() { navigate(1);  }
  function onPrev() { navigate(-1); }

  if (btnNext) btnNext.addEventListener('click', onNext);
  if (btnPrev) btnPrev.addEventListener('click', onPrev);

  el._slideshowDestroy = () => {
    if (btnNext) btnNext.removeEventListener('click', onNext);
    if (btnPrev) btnPrev.removeEventListener('click', onPrev);
    slides.forEach(s => s.classList.remove('is--current'));
    gsap.killTweensOf([...slides, ...inner]);
  };
}

function initParallaxSlideshow() {
  gsap.utils.toArray('[data-slideshow="wrap"]', nextPage).forEach(wrap => initSlideShow(wrap));
}

// ==========================================================
// CENTERED SLIDER
// ==========================================================

function initSliders() {
  const sliderWrappers = gsap.utils.toArray(document.querySelectorAll('[data-centered-slider="wrapper"]'));

  sliderWrappers.forEach((sliderWrapper) => {
    const slides = gsap.utils.toArray(sliderWrapper.querySelectorAll('[data-centered-slider="slide"]'));
    const bullets = gsap.utils.toArray(sliderWrapper.querySelectorAll('[data-centered-slider="bullet"]'));
    const prevButton = sliderWrapper.querySelector('[data-centered-slider="prev-button"]');
    const nextButton = sliderWrapper.querySelector('[data-centered-slider="next-button"]');

    let activeElement;
    let activeBullet;
    let currentIndex = 0;
    let autoplay;
    let isInitializing = true;
    let goatTimer = null;

    const autoplayEnabled = sliderWrapper.getAttribute('data-slider-autoplay') === 'true';
    const autoplayDuration = autoplayEnabled ? parseFloat(sliderWrapper.getAttribute('data-slider-autoplay-duration')) || 0 : 0;

    slides.forEach((slide, i) => {
      slide.setAttribute("id", `slide-${i}`);
    });

    // Alle goats verbergen bij init
    slides.forEach((slide) => {
      const goat = slide.querySelector('.goat_absolute');
      if (goat) gsap.set(goat, { scale: 0, opacity: 0, transformOrigin: 'center center' });
    });

    if (bullets && bullets.length > 0) {
      bullets.forEach((bullet, i) => {
        bullet.setAttribute("aria-controls", `slide-${i}`);
        bullet.setAttribute("aria-selected", i === currentIndex ? "true" : "false");
      });
    }

    const loop = horizontalLoop(slides, {
      paused: true,
      draggable: true,
      center: true,
      onChange: (element, index) => {
        currentIndex = index;

        // Goat uit op vorige slide
        if (activeElement) {
          const prevGoat = activeElement.querySelector('.goat_absolute');
          if (prevGoat) gsap.to(prevGoat, { scale: 0, rotation: -15, opacity: 0, duration: 0.25, ease: 'back.in(2)', overwrite: true, transformOrigin: 'center center' });
          activeElement.classList.remove("active");
        }

        // Goat in — debounced zodat alleen de eindbestemming animeert
        if (goatTimer) goatTimer.kill();
        const newGoat = element.querySelector('.goat_absolute');
        if (newGoat) {
          if (isInitializing) {
            gsap.set(newGoat, { scale: 1, opacity: 1 });
          } else {
            goatTimer = gsap.delayedCall(0.15, () => {
              gsap.fromTo(newGoat,
                { scale: 0, rotation: -25, opacity: 0 },
                { scale: 1, rotation: 0, opacity: 1, duration: 0.7, ease: 'elastic.out(1, 0.5)', transformOrigin: 'center center' }
              );
            });
          }
        }
        element.classList.add("active");
        activeElement = element;

        if (bullets && bullets.length > 0) {
          if (activeBullet) activeBullet.classList.remove("active");
          if (bullets[index]) {
            bullets[index].classList.add("active");
            activeBullet = bullets[index];
          }
          bullets.forEach((bullet, i) => {
            bullet.setAttribute("aria-selected", i === index ? "true" : "false");
          });
        }
      }
    });

    loop.toIndex(2, { duration: 0.01 });
    gsap.delayedCall(0.05, () => { isInitializing = false; });

    function startAutoplay() {
      if (autoplayDuration > 0 && !autoplay) {
        const repeat = () => {
          loop.next({ ease: "osmo", duration: 0.725 });
          autoplay = gsap.delayedCall(autoplayDuration, repeat);
        };
        autoplay = gsap.delayedCall(autoplayDuration, repeat);
      }
    }

    function stopAutoplay() {
      if (autoplay) {
        autoplay.kill();
        autoplay = null;
      }
    }

    ScrollTrigger.create({
      trigger: sliderWrapper,
      start: "top bottom",
      end: "bottom top",
      onEnter: startAutoplay,
      onLeave: stopAutoplay,
      onEnterBack: startAutoplay,
      onLeaveBack: stopAutoplay
    });

    sliderWrapper.addEventListener("mouseenter", stopAutoplay);
    sliderWrapper.addEventListener("mouseleave", () => {
      if (ScrollTrigger.isInViewport(sliderWrapper)) startAutoplay();
    });

    slides.forEach((slide, i) => {
      slide.addEventListener("click", () => {
        loop.toIndex(i, { ease: "osmo", duration: 0.725 });
      });
    });

    if (bullets && bullets.length > 0) {
      bullets.forEach((bullet, i) => {
        bullet.addEventListener("click", () => {
          loop.toIndex(i, { ease: "osmo", duration: 0.725 });
          if (activeBullet) activeBullet.classList.remove("active");
          bullet.classList.add("active");
          activeBullet = bullet;
          bullets.forEach((b, j) => {
            b.setAttribute("aria-selected", j === i ? "true" : "false");
          });
        });
      });
    }

    if (prevButton) {
      prevButton.addEventListener("click", () => {
        let newIndex = currentIndex - 1;
        if (newIndex < 0) newIndex = slides.length - 1;
        loop.toIndex(newIndex, { ease: "osmo", duration: 0.725 });
      });
    }

    if (nextButton) {
      nextButton.addEventListener("click", () => {
        let newIndex = currentIndex + 1;
        if (newIndex >= slides.length) newIndex = 0;
        loop.toIndex(newIndex, { ease: "osmo", duration: 0.725 });
      });
    }
  });
}

// ==========================================================
// ACCORDION CSS
// ==========================================================

function initAccordionCSS() {
  gsap.utils.toArray('[data-accordion-css-init]', nextPage).forEach((accordion) => {
    if (accordion._accordionDestroy) {
      accordion._accordionDestroy();
      accordion._accordionDestroy = null;
    }

    const closeSiblings = accordion.getAttribute('data-accordion-close-siblings') === 'true';

    function onAccordionClick(event) {
      const toggle = event.target.closest('[data-accordion-toggle]');
      if (!toggle) return;

      const singleAccordion = toggle.closest('[data-accordion-status]');
      if (!singleAccordion) return;

      const isActive = singleAccordion.getAttribute('data-accordion-status') === 'active';
      singleAccordion.setAttribute('data-accordion-status', isActive ? 'not-active' : 'active');

      if (closeSiblings && !isActive) {
        accordion.querySelectorAll('[data-accordion-status="active"]').forEach((sibling) => {
          if (sibling !== singleAccordion) sibling.setAttribute('data-accordion-status', 'not-active');
        });
      }
    }

    accordion.addEventListener('click', onAccordionClick);
    accordion._accordionDestroy = () => accordion.removeEventListener('click', onAccordionClick);
  });
}

// ==========================================================
// NAV BORDER SCROLL
// ==========================================================

function initNavBorderScroll() {
  const hero = nextPage.querySelector('[data-nav-border-hero]');
  const navBar = document.querySelector('.nav_bar_wrap');
  if (!hero || !navBar) return;

  if (navBar._navBorderST) {
    navBar._navBorderST.kill();
    navBar._navBorderST = null;
  }

  const hasBorder = nextPage === document
    ? document.querySelector('[data-barba="container"]')?.dataset?.navBorder === 'true'
    : nextPage.dataset?.navBorder === 'true';

  if (!hasBorder) return;

  navBar._navBorderST = ScrollTrigger.create({
    trigger: hero,
    start: 'bottom top',
    onLeave: () => navBar.classList.remove('has-border'),
    onEnterBack: () => navBar.classList.add('has-border'),
  });
}

// ==========================================================

function initAll() {
  initStickyFeatures(); // Eerst pinned sections — spacers in DOM vóór andere triggers
  initNavEntrance();
  initHeroEntrance();
  initHeadingReveal();
  if (has(".italian_coffee_small")) initItalianCoffeeAutograph();
  if (has(".italian_coffee_large")) initItalianCoffeeLarge();
  initGlobalParallax();
  initFooterParallax();
  initParallaxSlideshow();
  initStripeReveal();
  initStarsReveal();
  initMarqueeScrollDirection();
  initDraggableMarquee();
  initDragHint();
  initPreviewFollower();
  initProefSticker();
  initBunnyPlayerBackground();
  initBoldFullScreenNavigation();
  initNavHideOnScroll();
  initRotatedCard();
  initSliders();
  initDatePlaceholders();
  initAdvancedFormValidation();
  initAccordionCSS();
  initNavBorderScroll();
}

// ==========================================================
// DATE INPUT PLACEHOLDER
// ==========================================================

function initDatePlaceholders() {
  if (typeof flatpickr === 'undefined') return;

  const inputs = gsap.utils.toArray('input[type="date"]', nextPage);
  if (!inputs.length) return;

  inputs.forEach(input => {
    if (input._flatpickr) {
      input._flatpickr.destroy();
    }

    flatpickr(input, {
      locale: 'nl',
      dateFormat: 'd-m-Y',
      disableMobile: true,
      allowInput: false,
      minDate: 'today',
    });

    input.placeholder = input.getAttribute('data-placeholder') || 'Datum *';
    input.style.cursor = 'pointer';
    input.style.backgroundColor = 'transparent';
  });
}

// ==========================================================
// ADVANCED FORM VALIDATION
// ==========================================================

function initAdvancedFormValidation() {
  const forms = gsap.utils.toArray('[data-form-validate]', nextPage);
  if (!forms.length) return;

  // Force transparent background — Webflow sets this via its own stylesheet
  forms.forEach(form => {
    form.querySelectorAll('input, textarea, select').forEach(el => {
      el.style.backgroundColor = 'transparent';
    });
  });

  forms.forEach((formContainer) => {
    const startTime = new Date().getTime();

    const form = formContainer.querySelector('form');
    if (!form) return;

    const validateFields = form.querySelectorAll('[data-validate]');
    const dataSubmit = form.querySelector('[data-submit]');
    if (!dataSubmit) return;

    const realSubmitInput = dataSubmit.querySelector('input[type="submit"]');
    if (!realSubmitInput) return;

    // Cleanup previous listeners
    if (formContainer._formValidateDestroy) {
      formContainer._formValidateDestroy();
      formContainer._formValidateDestroy = null;
    }

    function isSpam() {
      return new Date().getTime() - startTime < 5000;
    }

    // Disable placeholder select options
    validateFields.forEach(function (fieldGroup) {
      const select = fieldGroup.querySelector('select');
      if (!select) return;
      select.querySelectorAll('option').forEach(function (option) {
        if (['', 'disabled', 'null', 'false'].includes(option.value)) {
          option.setAttribute('disabled', 'disabled');
        }
      });
    });

    function isValid(fieldGroup) {
      const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
      if (radioCheckGroup) {
        const inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        const checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;
        const min = parseInt(radioCheckGroup.getAttribute('min')) || 1;
        const max = parseInt(radioCheckGroup.getAttribute('max')) || inputs.length;
        if (inputs[0] && inputs[0].type === 'radio') return checkedCount >= 1;
        if (inputs.length === 1) return inputs[0].checked;
        return checkedCount >= min && checkedCount <= max;
      }

      const input = fieldGroup.querySelector('input, textarea, select');
      if (!input) return false;

      const value = input.value.trim();
      const length = value.length;

      if (input.tagName.toLowerCase() === 'select') {
        return !['', 'disabled', 'null', 'false'].includes(value);
      } else if (input.type === 'email') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      } else {
        const min = parseInt(input.getAttribute('min')) || 0;
        const max = parseInt(input.getAttribute('max')) || Infinity;
        if (input.hasAttribute('min') && length < min) return false;
        if (input.hasAttribute('max') && length > max) return false;
        return true;
      }
    }

    function updateFieldStatus(fieldGroup) {
      const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
      if (radioCheckGroup) {
        const inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        const checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;
        fieldGroup.classList.toggle('is--filled', checkedCount > 0);
        const valid = isValid(fieldGroup);
        if (valid) {
          fieldGroup.classList.add('is--success');
          fieldGroup.classList.remove('is--error');
        } else {
          fieldGroup.classList.remove('is--success');
          const anyStarted = Array.from(inputs).some(i => i.__validationStarted);
          fieldGroup.classList.toggle('is--error', anyStarted);
        }
      } else {
        const input = fieldGroup.querySelector('input, textarea, select');
        if (!input) return;
        fieldGroup.classList.toggle('is--filled', !!input.value.trim());
        const valid = isValid(fieldGroup);
        if (valid) {
          fieldGroup.classList.add('is--success');
          fieldGroup.classList.remove('is--error');
        } else {
          fieldGroup.classList.remove('is--success');
          fieldGroup.classList.toggle('is--error', !!input.__validationStarted);
        }
      }
    }

    function validateAll() {
      let allValid = true;
      let firstInvalid = null;

      validateFields.forEach(function (fieldGroup) {
        const input = fieldGroup.querySelector('input, textarea, select');
        const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
        if (!input && !radioCheckGroup) return;

        if (input) input.__validationStarted = true;
        if (radioCheckGroup) {
          radioCheckGroup.__validationStarted = true;
          radioCheckGroup.querySelectorAll('input').forEach(i => { i.__validationStarted = true; });
        }

        updateFieldStatus(fieldGroup);

        if (!isValid(fieldGroup)) {
          allValid = false;
          if (!firstInvalid) firstInvalid = input || radioCheckGroup.querySelector('input');
        }
      });

      if (!allValid && firstInvalid) firstInvalid.focus();
      return allValid;
    }

    const successEl = formContainer.querySelector('.w-form-done');
    const errorEl = formContainer.querySelector('.w-form-fail');

    async function onSubmit() {
      if (!validateAll()) return;
      if (isSpam()) { alert('Form submitted too quickly. Please try again.'); return; }

      const siteId = document.documentElement.getAttribute('data-wf-site');
      const formName = form.getAttribute('data-name') || form.getAttribute('name') || '';
      const fields = {};
      new FormData(form).forEach((value, key) => { fields[key] = value; });

      try {
        const res = await fetch(`https://webflow.com/api/v1/form/${siteId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ name: formName, source: window.location.href, test: false, fields, dolphin: false }),
        });

        if (res.ok) {
          form.style.display = 'none';
          if (successEl) successEl.style.display = 'block';
        } else {
          if (errorEl) errorEl.style.display = 'block';
        }
      } catch (e) {
        if (errorEl) errorEl.style.display = 'block';
      }
    }

    // Bind field listeners
    validateFields.forEach(function (fieldGroup) {
      const input = fieldGroup.querySelector('input, textarea, select');
      const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');

      if (radioCheckGroup) {
        const inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        inputs.forEach(function (inp) {
          inp.__validationStarted = false;
          inp.addEventListener('change', function () {
            requestAnimationFrame(function () {
              if (!inp.__validationStarted) {
                const checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;
                const min = parseInt(radioCheckGroup.getAttribute('min')) || 1;
                if (checkedCount >= min) inp.__validationStarted = true;
              }
              if (inp.__validationStarted) updateFieldStatus(fieldGroup);
            });
          });
          inp.addEventListener('blur', function () {
            inp.__validationStarted = true;
            updateFieldStatus(fieldGroup);
          });
        });
      } else if (input) {
        input.__validationStarted = false;
        if (input.tagName.toLowerCase() === 'select') {
          input.addEventListener('change', function () {
            input.__validationStarted = true;
            updateFieldStatus(fieldGroup);
          });
        } else {
          input.addEventListener('input', function () {
            if (!input.__validationStarted) {
              const value = input.value.trim();
              const length = value.length;
              const min = parseInt(input.getAttribute('min')) || 0;
              const max = parseInt(input.getAttribute('max')) || Infinity;
              if (input.type === 'email') {
                if (isValid(fieldGroup)) input.__validationStarted = true;
              } else if (
                (input.hasAttribute('min') && length >= min) ||
                (input.hasAttribute('max') && length <= max)
              ) {
                input.__validationStarted = true;
              }
            }
            if (input.__validationStarted) updateFieldStatus(fieldGroup);
          });
          input.addEventListener('blur', function () {
            input.__validationStarted = true;
            updateFieldStatus(fieldGroup);
          });
        }
      }
    });

    dataSubmit.addEventListener('click', onSubmit);
    form.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        onSubmit();
      }
    });

    formContainer._formValidateDestroy = function () {
      dataSubmit.removeEventListener('click', onSubmit);
    };
  });
}

// ==========================================================
// GSAP HELPER — HORIZONTAL LOOP (seamless centered carousel)
// https://gsap.com/docs/v3/HelperFunctions/helpers/seamlessLoop
// ==========================================================

function horizontalLoop(items, config) {
  let timeline;
  items = gsap.utils.toArray(items);
  config = config || {};
  gsap.context(() => {
    let onChange = config.onChange,
      lastIndex = 0,
      tl = gsap.timeline({repeat: config.repeat, onUpdate: onChange && function() {
          let i = tl.closestIndex();
          if (lastIndex !== i) {
            lastIndex = i;
            onChange(items[i], i);
          }
        }, paused: config.paused, defaults: {ease: "none"}, onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100)}),
      length = items.length,
      startX = items[0].offsetLeft,
      times = [],
      widths = [],
      spaceBefore = [],
      xPercents = [],
      curIndex = 0,
      indexIsDirty = false,
      center = config.center,
      pixelsPerSecond = (config.speed || 1) * 100,
      snap = config.snap === false ? v => v : gsap.utils.snap(config.snap || 1),
      timeOffset = 0,
      container = center === true ? items[0].parentNode : gsap.utils.toArray(center)[0] || items[0].parentNode,
      totalWidth,
      getTotalWidth = () => items[length-1].offsetLeft + xPercents[length-1] / 100 * widths[length-1] - startX + spaceBefore[0] + items[length-1].offsetWidth * gsap.getProperty(items[length-1], "scaleX") + (parseFloat(config.paddingRight) || 0),
      populateWidths = () => {
        let b1 = container.getBoundingClientRect(), b2;
        items.forEach((el, i) => {
          widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
          xPercents[i] = snap(parseFloat(gsap.getProperty(el, "x", "px")) / widths[i] * 100 + gsap.getProperty(el, "xPercent"));
          b2 = el.getBoundingClientRect();
          spaceBefore[i] = b2.left - (i ? b1.right : b1.left);
          b1 = b2;
        });
        gsap.set(items, {
          xPercent: i => xPercents[i]
        });
        totalWidth = getTotalWidth();
      },
      timeWrap,
      populateOffsets = () => {
        timeOffset = center ? tl.duration() * (container.offsetWidth / 2) / totalWidth : 0;
        center && times.forEach((t, i) => {
          times[i] = timeWrap(tl.labels["label" + i] + tl.duration() * widths[i] / 2 / totalWidth - timeOffset);
        });
      },
      getClosest = (values, value, wrap) => {
        let i = values.length,
          closest = 1e10,
          index = 0, d;
        while (i--) {
          d = Math.abs(values[i] - value);
          if (d > wrap / 2) {
            d = wrap - d;
          }
          if (d < closest) {
            closest = d;
            index = i;
          }
        }
        return index;
      },
      populateTimeline = () => {
        let i, item, curX, distanceToStart, distanceToLoop;
        tl.clear();
        for (i = 0; i < length; i++) {
          item = items[i];
          curX = xPercents[i] / 100 * widths[i];
          distanceToStart = item.offsetLeft + curX - startX + spaceBefore[0];
          distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");
          tl.to(item, {xPercent: snap((curX - distanceToLoop) / widths[i] * 100), duration: distanceToLoop / pixelsPerSecond}, 0)
            .fromTo(item, {xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100)}, {xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false}, distanceToLoop / pixelsPerSecond)
            .add("label" + i, distanceToStart / pixelsPerSecond);
          times[i] = distanceToStart / pixelsPerSecond;
        }
        timeWrap = gsap.utils.wrap(0, tl.duration());
      },
      refresh = (deep) => {
        let progress = tl.progress();
        tl.progress(0, true);
        populateWidths();
        deep && populateTimeline();
        populateOffsets();
        deep && tl.draggable ? tl.time(times[curIndex], true) : tl.progress(progress, true);
      },
      onResize = () => refresh(true),
      proxy;
    gsap.set(items, {x: 0});
    populateWidths();
    populateTimeline();
    populateOffsets();
    window.addEventListener("resize", onResize);
    function toIndex(index, vars) {
      vars = vars || {};
      (Math.abs(index - curIndex) > length / 2) && (index += index > curIndex ? -length : length);
      let newIndex = gsap.utils.wrap(0, length, index),
        time = times[newIndex];
      if (time > tl.time() !== index > curIndex && index !== curIndex) {
        time += tl.duration() * (index > curIndex ? 1 : -1);
      }
      if (time < 0 || time > tl.duration()) {
        vars.modifiers = {time: timeWrap};
      }
      curIndex = newIndex;
      vars.overwrite = true;
      gsap.killTweensOf(proxy);
      return vars.duration === 0 ? tl.time(timeWrap(time)) : tl.tweenTo(time, vars);
    }
    tl.toIndex = (index, vars) => toIndex(index, vars);
    tl.closestIndex = setCurrent => {
      let index = getClosest(times, tl.time(), tl.duration());
      if (setCurrent) {
        curIndex = index;
        indexIsDirty = false;
      }
      return index;
    };
    tl.current = () => indexIsDirty ? tl.closestIndex(true) : curIndex;
    tl.next = vars => toIndex(tl.current()+1, vars);
    tl.previous = vars => toIndex(tl.current()-1, vars);
    tl.times = times;
    tl.progress(1, true).progress(0, true);
    if (config.reversed) {
      tl.vars.onReverseComplete();
      tl.reverse();
    }
    if (config.draggable && typeof(Draggable) === "function") {
      proxy = document.createElement("div");
      let wrap = gsap.utils.wrap(0, 1),
        ratio, startProgress, draggable, lastSnap, initChangeX, wasPlaying,
        align = () => tl.progress(wrap(startProgress + (draggable.startX - draggable.x) * ratio)),
        syncIndex = () => tl.closestIndex(true);
      typeof(InertiaPlugin) === "undefined" && console.warn("InertiaPlugin required for momentum-based scrolling and snapping. https://greensock.com/club");
      draggable = Draggable.create(proxy, {
        trigger: items[0].parentNode,
        type: "x",
        onPressInit() {
          let x = this.x;
          gsap.killTweensOf(tl);
          wasPlaying = !tl.paused();
          tl.pause();
          startProgress = tl.progress();
          refresh();
          ratio = 1 / totalWidth;
          initChangeX = (startProgress / -ratio) - x;
          gsap.set(proxy, {x: startProgress / -ratio});
        },
        onDrag: align,
        onThrowUpdate: align,
        overshootTolerance: 0,
        inertia: true,
        snap(value) {
          if (Math.abs(startProgress / -ratio - this.x) < 10) {
            return lastSnap + initChangeX;
          }
          let time = -(value * ratio) * tl.duration(),
            wrappedTime = timeWrap(time),
            snapTime = times[getClosest(times, wrappedTime, tl.duration())],
            dif = snapTime - wrappedTime;
          Math.abs(dif) > tl.duration() / 2 && (dif += dif < 0 ? tl.duration() : -tl.duration());
          lastSnap = (time + dif) / tl.duration() / -ratio;
          return lastSnap;
        },
        onRelease() {
          syncIndex();
          draggable.isThrowing && (indexIsDirty = true);
        },
        onThrowComplete: () => {
          syncIndex();
          wasPlaying && tl.play();
        }
      })[0];
      tl.draggable = draggable;
    }
    tl.closestIndex(true);
    lastIndex = curIndex;
    onChange && onChange(items[curIndex], curIndex);
    timeline = tl;
    return () => window.removeEventListener("resize", onResize);
  });
  return timeline;
}
