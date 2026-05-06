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
// ORBIT TILES
// ==========================================================

function initOrbitTiles() {
  document.querySelectorAll("[data-orbit-tiles-init]").forEach((container) => {
    if (container._orbitDestroy) {
      container._orbitDestroy();
      container._orbitDestroy = null;
    }

    const list = container.querySelector("[data-orbit-tiles-list]");
    const tiles = container.querySelectorAll("[data-orbit-tiles-item]");
    const tileCount = tiles.length;
    if (tileCount < 2) return;

    const radiusXMultiplier = 1;
    const radiusYMultiplier = 0;
    const blurMultiplier = 0.04;
    const minScale = 0.2;
    const minOpacity = 1;
    const minDarkness = 0.3;
    const moveDuration = 2.5;
    const pauseDuration = 0;
    const staggerAmount = moveDuration * 0.03;
    const linearRotateDuration = 24;

    const tileStates = Array.from(tiles, () => ({ progress: 0 }));
    let isActive = false;
    let stepTimeline;
    let delayedCall;
    let activeTileIndex = -1;

    function getActiveIndex() {
      return tileStates.reduce((closest, state, index) => {
        const current = Math.min(((index - state.progress) % tileCount + tileCount) % tileCount, tileCount - (((index - state.progress) % tileCount + tileCount) % tileCount));
        const previous = Math.min(((closest - tileStates[closest].progress) % tileCount + tileCount) % tileCount, tileCount - (((closest - tileStates[closest].progress) % tileCount + tileCount) % tileCount));
        return current < previous ? index : closest;
      }, 0);
    }

    function updateTileStatus() {
      const currentActiveIndex = getActiveIndex();
      if (currentActiveIndex === activeTileIndex) return;
      activeTileIndex = currentActiveIndex;
      tiles.forEach((tile, index) => {
        tile.setAttribute("data-orbit-tiles-item-status", index === activeTileIndex ? "active" : "not-active");
      });
    }

    function renderOrbit() {
      const tileWidth = tiles[0].offsetWidth;
      const radiusX = tileWidth * radiusXMultiplier;
      const radiusY = tileWidth * radiusYMultiplier;
      const maxBlur = tileWidth * blurMultiplier;

      updateTileStatus();

      tiles.forEach((tile, index) => {
        const angle = ((index - tileStates[index].progress) / tileCount) * Math.PI * 2;
        const depth = (Math.cos(angle) + 1) / 2;
        const adjustedDepth = Math.pow(depth, 1.3);

        gsap.set(tile, {
          x: Math.sin(angle) * radiusX,
          y: Math.cos(angle) * radiusY,
          scale: gsap.utils.interpolate(minScale, 1, adjustedDepth),
          opacity: gsap.utils.interpolate(minOpacity, 1, adjustedDepth),
          filter: `blur(${gsap.utils.interpolate(maxBlur, 0, adjustedDepth)}px) brightness(${gsap.utils.interpolate(minDarkness, 1, adjustedDepth)})`,
          zIndex: Math.round(adjustedDepth * 1000),
        });
      });
    }

    const rotations = !list || linearRotateDuration === 0 ? [] : [
      gsap.to(list, { rotate: 360, duration: linearRotateDuration, ease: "none", repeat: -1, paused: true }),
      gsap.to(tiles, { rotate: -360, duration: linearRotateDuration, ease: "none", repeat: -1, paused: true }),
    ];

    function goToNextTile() {
      if (!isActive) return;
      const activeIndex = getActiveIndex();
      const orderedStates = tileStates
        .map((state, index) => ({ state, offset: (index - activeIndex + tileCount) % tileCount }))
        .sort((a, b) => a.offset - b.offset);

      stepTimeline = gsap.timeline({
        paused: true,
        onComplete: () => { if (isActive) delayedCall = gsap.delayedCall(pauseDuration, goToNextTile); },
      });

      orderedStates.forEach(({ state }, index) => {
        stepTimeline.to(state, { progress: state.progress + 1, duration: moveDuration, ease: "osmo", onUpdate: renderOrbit }, index * staggerAmount);
      });

      stepTimeline.play();
    }

    function pauseOrbit() {
      isActive = false;
      if (stepTimeline) stepTimeline.pause();
      if (delayedCall) delayedCall.pause();
      rotations.forEach((r) => r.pause());
    }

    function playOrbit() {
      isActive = true;
      rotations.forEach((r) => r.play());
      if (stepTimeline && stepTimeline.progress() < 1) {
        stepTimeline.play();
      } else {
        goToNextTile();
      }
    }

    renderOrbit();

    if (pauseDuration > 0) new ResizeObserver(renderOrbit).observe(container);

    const st = ScrollTrigger.create({
      trigger: container,
      start: "top bottom",
      end: "bottom top",
      onToggle: (self) => self.isActive ? playOrbit() : pauseOrbit(),
    });

    container._orbitDestroy = () => {
      pauseOrbit();
      st.kill();
      if (stepTimeline) stepTimeline.kill();
      if (delayedCall) delayedCall.kill();
      rotations.forEach((r) => r.kill());
    };
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
initOrbitTiles();
