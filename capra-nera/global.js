// ==========================================================
// CAPRA NERA — GLOBAL JS
// Stack: GSAP, ScrollTrigger, SplitText, Lenis, Barba.js
// ==========================================================

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, Draggable);

history.scrollRestoration = "manual";

// ==========================================================
// GLOBAL STATE
// ==========================================================

let lenis = null;
let nextPage = document;
let onceFunctionsInitialized = false;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", (e) => (reducedMotion = e.matches));
rmMQ.addListener?.((e) => (reducedMotion = e.matches));

const has = (s) => !!nextPage.querySelector(s);

let staggerDefault = 0.05;
let durationDefault = 0.6;

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
    const headings = gsap.utils.toArray("h1, h2, h3, h4", nextPage);
    if (headings.length) gsap.set(headings, { autoAlpha: 0 });

    const autograph = nextPage.querySelector(".italian_coffee_small");
    if (autograph) gsap.set(autograph, { autoAlpha: 0 });

    const stickers = gsap.utils.toArray('.proef_sticker', nextPage);
    if (stickers.length) gsap.set(stickers, { opacity: 0 });

    const heroBg = nextPage.querySelector('.hero .bunny-bg');
    if (heroBg) gsap.set(heroBg, { opacity: 0, scale: 1.05 });

    const trustpilot = nextPage.querySelector('.hero .trustpilot_score');
    if (trustpilot) gsap.set(trustpilot, { opacity: 0, y: 12 });
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

  tl.fromTo(transitionPanel, { yPercent: 0 }, { yPercent: -100, duration: 0.8 }, 0);
  tl.fromTo(transitionLabel, { autoAlpha: 0 }, { autoAlpha: 1 }, "<+=0.2");
  tl.fromTo(current, { y: "0vh" }, { y: "-15vh", duration: 0.8 }, 0);

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
  // Sluit het mobile menu als het open is bij het starten van een transitie
  const navStatusEl = document.querySelector('[data-navigation-status]');
  if (navStatusEl && navStatusEl.getAttribute('data-navigation-status') === 'active') {
    navStatusEl.setAttribute('data-navigation-status', 'not-active');
    unlockScroll();
  }
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
});

barba.hooks.afterLeave(() => {
  if (hasScrollTrigger) {
    ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
  }
});

barba.hooks.enter((data) => {
  initBarbaNavUpdate(data);
});

barba.hooks.afterEnter((data) => {
  history.scrollRestoration = "manual";
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
  const headings = gsap.utils.toArray("h1, h2, h3, h4", nextPage);
  if (!headings.length) return;

  headings.forEach((el) => {
    if (el._headingRevealDestroy) {
      el._headingRevealDestroy();
      el._headingRevealDestroy = null;
    }
  });

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

// ==========================================================
// NAV HIDE ON SCROLL
// ==========================================================

let navHideMMCleanup = null;

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
  const navBorderColor = navBarWrap
    ? getComputedStyle(navBarWrap).borderBottomColor
    : null;
  const hasBorder = navBorderColor && navBorderColor !== 'rgba(0, 0, 0, 0)' && navBorderColor !== 'transparent';

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
      if (hasBorder) gsap.set(navBarWrap, { borderBottomColor: navBorderColor });

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
    video.addEventListener('playing', function() { pendingPlay = false; setStatus('playing'); });
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

    player._bunnyDestroy = function() {
      player.removeEventListener('click', onPlayerClick);
      if (player._io) { try { player._io.disconnect(); } catch(_) {} player._io = null; }
      if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }
      try { video.pause(); video.removeAttribute('src'); video.load(); } catch(_) {}
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
    navStatusEl.setAttribute('data-navigation-status', 'not-active');
    unlockScroll();
    if (stripeTl) stripeTl.reverse();
  }

  function onToggleClick() {
    navStatusEl.getAttribute('data-navigation-status') === 'not-active' ? openNav() : closeNav();
  }

  function onCloseClick() { closeNav(); }

  function onKeyDown(e) {
    if (e.keyCode === 27 && navStatusEl.getAttribute('data-navigation-status') === 'active') {
      closeNav();
    }
  }

  const toggleBtns = document.querySelectorAll('[data-navigation-toggle="toggle"]');
  const closeBtns  = document.querySelectorAll('[data-navigation-toggle="close"]');

  toggleBtns.forEach(btn => btn.addEventListener('click', onToggleClick));
  closeBtns.forEach(btn  => btn.addEventListener('click', onCloseClick));
  document.addEventListener('keydown', onKeyDown);

  navStatusEl._navDestroy = () => {
    toggleBtns.forEach(btn => btn.removeEventListener('click', onToggleClick));
    closeBtns.forEach(btn  => btn.removeEventListener('click', onCloseClick));
    document.removeEventListener('keydown', onKeyDown);
    if (stripeTl) { stripeTl.kill(); stripeTl = null; }
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

  const targets = gsap.utils.toArray('[data-draggable-marquee-init]', nextPage);
  if (!targets.length) return;

  const cursor = hint.querySelector('.cursor');

  // Positie op hint, scale op cursor — zodat killTweensOf nooit conflicteert
  gsap.set(hint,   { xPercent: -50, yPercent: -50, autoAlpha: 1 });
  gsap.set(cursor, { scale: 0 });

  // Cursor volgt muis
  const xTo = gsap.quickTo(hint, 'x', { duration: 0.6, ease: 'power3' });
  const yTo = gsap.quickTo(hint, 'y', { duration: 0.6, ease: 'power3' });

  let isVisible = false;
  let hasPosition = false;

  function onMove(e) {
    if (!hasPosition) {
      gsap.set(hint, { x: e.clientX, y: e.clientY });
      hasPosition = true;
      return;
    }
    xTo(e.clientX);
    yTo(e.clientY);
  }

  function show() {
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
  const trustpilot = hero.querySelector('.trustpilot_score');

  // BG — langzame fade + zoom out, start direct
  if (bg) {
    gsap.to(bg, {
      opacity: 1,
      scale: 1,
      duration: 1.8,
      ease: 'power2.out',
      delay: 0.1,
    });
  }

  // Trustpilot — drifts omhoog na headings
  if (trustpilot) {
    gsap.to(trustpilot, {
      opacity: 1,
      y: 0,
      duration: 0.8,
      ease: 'expo.out',
      delay: 0.9,
    });
  }

  hero._heroEntranceDestroy = () => {
    if (bg) gsap.killTweensOf(bg);
    if (trustpilot) gsap.killTweensOf(trustpilot);
    gsap.set([bg, trustpilot].filter(Boolean), { clearProps: 'all' });
  };
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
    const nudgeDelay = inHero ? 3 : 0.2;
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

function initAll() {
  initStickyFeatures(); // Eerst pinned sections — spacers in DOM vóór andere triggers
  initHeroEntrance();
  initHeadingReveal();
  if (has(".italian_coffee_small")) initItalianCoffeeAutograph();
  initGlobalParallax();
  initFooterParallax();
  initStripeReveal();
  initDraggableMarquee();
  initDragHint();
  initProefSticker();
  initBunnyPlayerBackground();
  initBoldFullScreenNavigation();
  initNavHideOnScroll();
  initRotatedCard();
}
