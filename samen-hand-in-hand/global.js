// ==========================================================
// SAMEN HAND IN HAND — GLOBAL JS
// Stack: GSAP, ScrollTrigger, SplitText, Lenis
// ==========================================================

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
gsap.ticker.lagSmoothing(0);

history.scrollRestoration = "manual";

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
  if (typeof Lenis === "undefined") return;

  lenis = new Lenis({
    autoRaf: false,
    lerp: 0.1,
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  });

  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.add(ScrollTrigger.update);
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
// SCROLL TEXT REVEAL
// ==========================================================

function initMaskTextScrollReveal() {
  const elements = document.querySelectorAll("[data-split]");
  if (!elements.length) return;

  elements.forEach((el) => {
    if (el._splitDestroy) {
      el._splitDestroy();
      el._splitDestroy = null;
    }

    const type = el.dataset.splitReveal || "lines";
    const config = splitConfig[type] || splitConfig.lines;

    const split = SplitText.create(el, {
      type: type,
      mask: "lines",
      autoSplit: true,
    });

    const units = split[type] || split.lines;

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "clamp(top 85%)",
        once: true,
      },
    });

    tl.from(units, {
      yPercent: 110,
      duration: config.duration,
      stagger: config.stagger,
      ease: "expo.out",
    });

    el._splitDestroy = () => {
      tl.kill();
      split.revert();
    };
  });
}

// ==========================================================
// BUTTON HOVER
// ==========================================================

function initBtnHover() {
  const buttons = document.querySelectorAll("[data-btn-hover]");
  if (!buttons.length) return;

  buttons.forEach((btn) => {
    if (btn._btnDestroy) {
      btn._btnDestroy();
      btn._btnDestroy = null;
    }

    const onEnter = () => gsap.to(btn, { scale: 1.04, duration: 0.4, ease: "elastic.out(1.2, 0.4)" });
    const onLeave = () => gsap.to(btn, { scale: 1, duration: 0.4, ease: "elastic.out(1.2, 0.4)" });
    const onDown = () => gsap.to(btn, { scale: 0.97, duration: 0.15, ease: "power2.out" });
    const onUp = () => gsap.to(btn, { scale: 1, duration: 0.4, ease: "elastic.out(1.2, 0.4)" });

    btn.addEventListener("mouseenter", onEnter);
    btn.addEventListener("mouseleave", onLeave);
    btn.addEventListener("mousedown", onDown);
    btn.addEventListener("mouseup", onUp);

    btn._btnDestroy = () => {
      btn.removeEventListener("mouseenter", onEnter);
      btn.removeEventListener("mouseleave", onLeave);
      btn.removeEventListener("mousedown", onDown);
      btn.removeEventListener("mouseup", onUp);
    };
  });
}

// ==========================================================
// STICKY TITLE SCROLL
// ==========================================================

function initStickyTitleScroll() {
  const wraps = document.querySelectorAll('[data-sticky-title="wrap"]');
  if (!wraps.length) return;

  wraps.forEach((wrap) => {
    if (wrap._stickyDestroy) {
      wrap._stickyDestroy();
      wrap._stickyDestroy = null;
    }

    const headings = Array.from(wrap.querySelectorAll('[data-sticky-title="heading"]'));
    if (!headings.length) return;

    const splits = [];

    const masterTl = gsap.timeline({
      scrollTrigger: {
        trigger: wrap,
        start: "top 40%",
        end: "bottom bottom",
        scrub: true,
      },
    });

    const revealDuration = 0.7;
    const fadeOutDuration = 0.7;
    const overlapOffset = 0.15;

    headings.forEach((heading, index) => {
      heading.setAttribute("aria-label", heading.textContent);

      const split = SplitText.create(heading, { type: "words,chars" });
      splits.push(split);

      split.words.forEach((word) => word.setAttribute("aria-hidden", "true"));

      gsap.set(heading, { visibility: "visible" });

      const headingTl = gsap.timeline();
      headingTl.from(split.chars, {
        autoAlpha: 0,
        stagger: { amount: revealDuration, from: "start" },
        duration: revealDuration,
      });

      if (index < headings.length - 1) {
        headingTl.to(split.chars, {
          autoAlpha: 0,
          stagger: { amount: fadeOutDuration, from: "end" },
          duration: fadeOutDuration,
        });
      }

      masterTl.add(headingTl, index === 0 ? undefined : `-=${overlapOffset}`);
    });

    wrap._stickyDestroy = () => {
      masterTl.kill();
      splits.forEach((s) => s.revert());
    };
  });
}


// ==========================================================
// SCROLL FADE
// ==========================================================

function initScrollFade() {
  const elements = document.querySelectorAll("[data-scroll-fade]");
  if (!elements.length) return;

  elements.forEach((el) => {
    if (el._scrollFadeDestroy) {
      el._scrollFadeDestroy();
      el._scrollFadeDestroy = null;
    }

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: el,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
      },
    });

    // fade in (first 25%) → hold → fade out (last 25%)
    tl.fromTo(el, { autoAlpha: 0 }, { autoAlpha: 1, duration: 0.25, ease: "none" })
      .to(el, { autoAlpha: 1, duration: 0.5, ease: "none" })
      .to(el, { autoAlpha: 0, duration: 0.25, ease: "none" });

    el._scrollFadeDestroy = () => tl.kill();
  });
}

// ==========================================================
// HERO IMAGE SCROLL SCALE
// ==========================================================

function initHeroImgScale() {
  const el = document.querySelector(".hero_text_img");
  if (!el) return;

  if (el._heroImgDestroy) {
    el._heroImgDestroy();
    el._heroImgDestroy = null;
  }

  const tween = gsap.to(el, {
    width: "28rem",
    ease: "none",
    scrollTrigger: {
      trigger: el,
      start: "top center",
      end: "top top",
      scrub: 1,
    },
  });

  el._heroImgDestroy = () => tween.scrollTrigger?.kill();
}

// ==========================================================
// PAGE ENTRANCE ANIMATION
// ==========================================================

function initPageEntranceAnimation() {
  const hero = document.querySelector(".hero");
  if (!hero) return;

  const textEls = hero.querySelectorAll("h1, h2, h3, h4, h5, h6, p, a, span");
  if (!textEls.length) return;

  gsap.from(textEls, {
    autoAlpha: 0,
    duration: 1.2,
    stagger: 0.08,
    ease: "expo.out",
  });
}

// ==========================================================
// INIT
// ==========================================================

initLenis();
initHeroImgScale();
initPageEntranceAnimation();
initMaskTextScrollReveal();
initBtnHover();
initStickyTitleScroll();
initScrollFade();
