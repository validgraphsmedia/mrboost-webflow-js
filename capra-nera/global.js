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
    lerp: 0.1,
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

  // Runs before the enter animation
  // if (has('[data-something]')) initSomething();
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

barba.hooks.beforeEnter((data) => {
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

  const allLines = splits.flatMap((s) => s.lines);

  gsap.from(allLines, {
    y: 100,
    skewY: 7,
    duration: 1.8,
    ease: "power4.out",
    stagger: { amount: 0.3 },
  });

  headings.forEach((el, i) => {
    el._headingRevealDestroy = () => {
      gsap.killTweensOf(splits[i].lines);
      splits[i].revert();
    };
  });
}

// ==========================================================
// INIT ALL (called na elke Barba transitie)
// ==========================================================

function initAll() {
  initHeadingReveal();
}
