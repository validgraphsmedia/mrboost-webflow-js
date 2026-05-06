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
// PRELOADER
// ==========================================================

function initPreloader() {
  const targets = document.querySelectorAll("h1, h2, h3, h4, h5, h6, p, a, img, video");
  if (!targets.length) return;

  lockScroll();
  gsap.set(targets, { autoAlpha: 0 });

  gsap.to(targets, {
    autoAlpha: 1,
    duration: 1.8,
    stagger: 0.04,
    ease: "power2.out",
    delay: 1,
    onStart: unlockScroll,
  });
}

// ==========================================================
// HIGHLIGHT TEXT
// ==========================================================

function initHighlightText() {
  const headings = document.querySelectorAll("[data-highlight-text]");
  if (!headings.length) return;

  headings.forEach((heading) => {
    if (heading._highlightDestroy) {
      heading._highlightDestroy();
      heading._highlightDestroy = null;
    }

    const scrollStart = heading.getAttribute("data-highlight-scroll-start") || "top 90%";
    const scrollEnd = heading.getAttribute("data-highlight-scroll-end") || "center 40%";
    const fadedValue = parseFloat(heading.getAttribute("data-highlight-fade")) || 0.2;
    const staggerValue = parseFloat(heading.getAttribute("data-highlight-stagger")) || 0.1;

    const split = SplitText.create(heading, {
      type: "words,chars",
      autoSplit: true,
      onSplit(self) {
        const ctx = gsap.context(() => {
          gsap.timeline({
            scrollTrigger: {
              scrub: true,
              trigger: heading,
              start: scrollStart,
              end: scrollEnd,
            },
          }).from(self.chars, {
            autoAlpha: fadedValue,
            stagger: staggerValue,
            ease: "linear",
          });
        });
        return ctx;
      },
    });

    heading._highlightDestroy = () => split.revert();
  });
}

// ==========================================================
// TIMELINE
// ==========================================================

function initTimeline() {
  const wrap = document.querySelector('[data-timeline="wrap"]');
  if (!wrap) return;

  if (wrap._timelineDestroy) {
    wrap._timelineDestroy();
    wrap._timelineDestroy = null;
  }

  const line = wrap.querySelector('[data-timeline="line"]');
  const items = wrap.querySelectorAll(".point_wrap");
  const killList = [];

  if (line) {
    gsap.set(line, { scaleY: 0, transformOrigin: "top center" });
    const tween = gsap.to(line, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: {
        trigger: wrap,
        start: "top 80%",
        end: "bottom 20%",
        scrub: 1,
      },
    });
    killList.push(tween.scrollTrigger);
  }

  items.forEach((item) => {
    gsap.set(item, { autoAlpha: 0, y: 30 });
    const st = ScrollTrigger.create({
      trigger: item,
      start: "top 85%",
      once: true,
      onEnter: () => gsap.to(item, { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out" }),
    });
    killList.push(st);
  });

  wrap._timelineDestroy = () => {
    killList.forEach((st) => st?.kill());
    if (line) gsap.set(line, { clearProps: "scaleY,transformOrigin" });
    items.forEach((item) => gsap.set(item, { clearProps: "all" }));
  };
}

// ==========================================================
// GLOBAL PARALLAX
// ==========================================================

function initGlobalParallax() {
  mm.add(
    {
      isMobile: "(max-width:479px)",
      isMobileLandscape: "(max-width:767px)",
      isTablet: "(max-width:991px)",
      isDesktop: "(min-width:992px)",
    },
    (context) => {
      const { isMobile, isMobileLandscape, isTablet } = context.conditions;

      const ctx = gsap.context(() => {
        document.querySelectorAll('[data-parallax="trigger"]').forEach((trigger) => {
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
          const startVal = parseFloat(trigger.getAttribute("data-parallax-start") ?? 20);
          const endVal = parseFloat(trigger.getAttribute("data-parallax-end") ?? -20);
          const scrollStart = `clamp(${trigger.getAttribute("data-parallax-scroll-start") || "top bottom"})`;
          const scrollEnd = `clamp(${trigger.getAttribute("data-parallax-scroll-end") || "bottom top"})`;

          gsap.fromTo(target, { [prop]: startVal }, {
            [prop]: endVal,
            ease: "none",
            scrollTrigger: { trigger, start: scrollStart, end: scrollEnd, scrub },
          });
        });
      });

      return () => ctx.revert();
    }
  );
}

// ==========================================================
// ROTATING IMAGE TRAIL
// ==========================================================

function initRotatingImageTrail() {
  const area = document.querySelector("[data-trail-area]");
  if (!area) return;

  const collection = area.querySelector("[data-trail-collection]");
  if (!collection) return;

  const items = collection.querySelectorAll("[data-trail-item]");
  if (!items.length) return;

  if (area._trailDestroy) {
    area._trailDestroy();
    area._trailDestroy = null;
  }

  let index = 0;
  let lastCloneX = null;
  let lastCloneY = null;

  const cardWidth = items[0].getBoundingClientRect().width;
  const stepDistance = cardWidth * 0.5;

  function spawnTrailItem(x, y) {
    const clone = items[index].cloneNode(true);
    clone.style.left = x + "px";
    clone.style.top = y + "px";
    clone.setAttribute("data-trail-item", "hidden");
    area.appendChild(clone);

    void clone.getBoundingClientRect();
    clone.setAttribute("data-trail-item", "visible");

    setTimeout(() => clone.setAttribute("data-trail-item", "transition-out"), 400);
    setTimeout(() => clone.remove(), 1200);

    index = (index + 1) % items.length;
    lastCloneX = x;
    lastCloneY = y;
  }

  function onMouseMove(event) {
    const rect = area.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      lastCloneX = null;
      lastCloneY = null;
      return;
    }

    if (lastCloneX === null || lastCloneY === null) {
      spawnTrailItem(x, y);
      return;
    }

    const dx = x - lastCloneX;
    const dy = y - lastCloneY;

    if (Math.sqrt(dx * dx + dy * dy) >= stepDistance) {
      spawnTrailItem(x, y);
    }
  }

  area.addEventListener("mousemove", onMouseMove);

  area._trailDestroy = () => {
    area.removeEventListener("mousemove", onMouseMove);
    area.querySelectorAll("[data-trail-item]").forEach((el) => el.remove());
  };
}

// ==========================================================
// INIT
// ==========================================================

initLenis();
initHeroImgScale();
initPreloader();
initMaskTextScrollReveal();
initHighlightText();
initBtnHover();
initStickyTitleScroll();
initScrollFade();
initTimeline();
initGlobalParallax();
initRotatingImageTrail();
