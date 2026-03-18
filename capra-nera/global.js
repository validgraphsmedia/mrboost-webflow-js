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

  // Op transitions: headings verbergen zodat ze niet zichtbaar zijn
  // voordat de reveal-animatie in afterEnter start
  if (onceFunctionsInitialized) {
    const headings = gsap.utils.toArray("h1, h2, h3, h4", nextPage);
    if (headings.length) gsap.set(headings, { autoAlpha: 0 });

    const autograph = nextPage.querySelector(".italian_coffee_small");
    if (autograph) gsap.set(autograph, { autoAlpha: 0 });
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
// PAGE TRANSITIONS — CAPRA NERA
// ==========================================================

function runPageOnceAnimation(next) {
  const tl = gsap.timeline();

  tl.call(() => {
    resetPage(next);
  }, null, 0);

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
  const nextNodes = tpl.content.querySelectorAll("[data-barba-update]");
  const currentNodes = document.querySelectorAll("nav [data-barba-update]");

  currentNodes.forEach((curr, index) => {
    const next = nextNodes[index];
    if (!next) return;

    const newStatus = next.getAttribute("aria-current");
    if (newStatus !== null) {
      curr.setAttribute("aria-current", newStatus);
    } else {
      curr.removeAttribute("aria-current");
    }

    const newClassList = next.getAttribute("class") || "";
    curr.setAttribute("class", newClassList);
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
      strokeDashoffset: path.dataset.reverse === "true" ? -length : length,
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
    tl.to(path, {
      strokeDashoffset: 0,
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

    gsap.from(stripes, {
      scaleX: 0,
      transformOrigin: 'left center',
      duration: 1.6,
      ease: 'osmo',
      stagger: 0.15,
      scrollTrigger: {
        trigger: wrapper,
        start: 'clamp(top 85%)',
        once: true,
      },
    });

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
// INIT ALL (called na elke Barba transitie)
// ==========================================================

function initAll() {
  initHeadingReveal();
  if (has(".italian_coffee_small")) initItalianCoffeeAutograph();
  initGlobalParallax();
  initFooterParallax();
  initStripeReveal();
}
