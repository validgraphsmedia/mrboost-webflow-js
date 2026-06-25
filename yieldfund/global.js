// ==========================================================
// YIELDFUND — GLOBAL JS
// Stack: GSAP, ScrollTrigger, SplitText, Lenis (geen Barba)
// ==========================================================

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, Observer, Draggable);

// ==========================================================
// GLOBAL STATE
// ==========================================================

let lenis = null;

const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", (e) => (reducedMotion = e.matches));

const durationDefault = 0.6;

CustomEase.create("osmo", "0.625, 0.05, 0, 1");
gsap.defaults({ ease: "osmo", duration: durationDefault });

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
  if (typeof window.Lenis === "undefined") return;

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
// PRELOADER
// ==========================================================

function initPreloader() {
  const preloader = document.querySelector(".preloader");
  if (!preloader) return null;

  document.body.style.cursor = "wait";

  const tl = gsap.timeline();

  if (reducedMotion) {
    tl.set(preloader, { autoAlpha: 0 });
    return tl;
  }

  tl.to(preloader, {
    yPercent: -100,
    duration: 1,
    ease: "expo.inOut",
    delay: 0.3,
  });

  return tl;
}

// ==========================================================
// HERO LOAD
// ==========================================================

function initHeroLoad() {
  const section = document.querySelector(".hero_section");
  if (!section) return;

  const bg  = section.querySelector(".background_image");
  const nav = section.querySelector(".navbar");

  gsap.set(section, { clipPath: "inset(7% round 48px)" });
  if (bg)  gsap.set(bg,  { scale: 1.12, transformOrigin: "center center" });
  if (nav) gsap.set(nav, { autoAlpha: 0, y: -24 });

  const tl = gsap.timeline({ defaults: { ease: "expo.out" }, delay: 0.1 });

  tl.to(section, { clipPath: "inset(0% round 8px)", duration: 1.6 }, 0)
    .to(bg,      { scale: 1, duration: 3.0 }, 0)
    .to(nav,     { autoAlpha: 1, y: 0, duration: 0.9 }, 0.55);
}

// ==========================================================
// HEADING REVEAL (SPLIT TEXT)
// ==========================================================

function initHeadingReveal() {
  const headings = gsap.utils.toArray("[data-split]");
  if (!headings.length) return;

  gsap.set(headings, { autoAlpha: 0 });

  document.fonts.ready.then(() => {
    const splits = headings.map((el) =>
      SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true })
    );

    headings.forEach((el, i) => {
      const lines = splits[i].lines;
      const masks = lines.map((line) => line.parentElement);

      gsap.set(masks, { overflow: "visible", clipPath: "inset(-0.5em 0 -0.3em 0)" });

      gsap.set(el, { autoAlpha: 1 });
      gsap.set(lines, { yPercent: 150 });

      const inViewport  = el.getBoundingClientRect().top < window.innerHeight;
      const heroSection = document.querySelector(".hero_section");
      const isHero      = heroSection && heroSection.contains(el);

      gsap.to(lines, {
        yPercent: 0,
        duration: 1.1,
        ease: "expo.out",
        stagger: splitConfig.lines.stagger,
        delay: isHero ? 1.2 : 0,
        onComplete: () => {
          try { splits[i].revert(); } catch (_) {}
        },
        ...(inViewport ? {} : {
          scrollTrigger: {
            trigger: el,
            start: "clamp(top 88%)",
            once: true,
          },
        }),
      });

      el._headingRevealDestroy = () => {
        gsap.killTweensOf(lines);
        ScrollTrigger.getAll()
          .filter((st) => st.vars.trigger === el)
          .forEach((st) => st.kill());
        try { splits[i].revert(); } catch (_) {}
      };
    });

    ScrollTrigger.refresh();
  });
}

// ==========================================================
// GLOBAL PARALLAX
// ==========================================================

function initGlobalParallax() {
  const triggers = gsap.utils.toArray("[data-parallax='trigger']");
  if (!triggers.length) return;

  const getNum = (el, name, fallback) => {
    const v = parseFloat(el.getAttribute(name));
    return Number.isFinite(v) ? v : fallback;
  };

  triggers.forEach((trigger) => {
    const target = trigger.querySelector("[data-parallax='target']") || trigger;
    const direction = trigger.dataset.parallaxDirection || "vertical";
    const start = getNum(trigger, "data-parallax-start", -60);
    const end = getNum(trigger, "data-parallax-end", 60);
    const scrub = getNum(trigger, "data-parallax-scrub", 1);
    const scrollStart = trigger.dataset.parallaxScrollStart || "top bottom";
    const scrollEnd = trigger.dataset.parallaxScrollEnd || "bottom top";

    const prop = direction === "horizontal" ? "xPercent" : "yPercent";

    gsap.fromTo(
      target,
      { [prop]: start },
      {
        [prop]: end,
        ease: "none",
        scrollTrigger: {
          trigger: trigger,
          start: scrollStart,
          end: scrollEnd,
          scrub: scrub,
        },
      }
    );
  });
}

// ==========================================================
// ACCORDION CSS
// ==========================================================

function initAccordionCSS() {
  const accordions = gsap.utils.toArray("[data-accordion-css-init]");
  if (!accordions.length) return;

  accordions.forEach((wrap) => {
    const toggle = wrap.querySelector("[data-accordion-toggle]");
    if (!toggle) return;

    if (wrap._accordionDestroy) {
      wrap._accordionDestroy();
      wrap._accordionDestroy = null;
    }

    const closeSiblings = wrap.hasAttribute("data-accordion-close-siblings");

    function handleClick() {
      const isActive = wrap.dataset.accordionStatus === "active";

      if (closeSiblings) {
        const group = wrap.closest("[data-accordion-group]");
        const siblings = group
          ? gsap.utils.toArray("[data-accordion-css-init]", group)
          : [];
        siblings.forEach((sib) => {
          if (sib !== wrap) sib.dataset.accordionStatus = "not-active";
        });
      }

      wrap.dataset.accordionStatus = isActive ? "not-active" : "active";
    }

    toggle.addEventListener("click", handleClick);
    wrap._accordionDestroy = () => toggle.removeEventListener("click", handleClick);
  });
}

// ==========================================================
// MARQUEE (SCROLL DIRECTION)
// ==========================================================

function initMarqueeScrollDirection() {
  document.querySelectorAll("[data-marquee-scroll-direction-target]").forEach((marquee) => {
    const marqueeContent = marquee.querySelector("[data-marquee-collection-target]");
    const marqueeScroll  = marquee.querySelector("[data-marquee-scroll-target]");
    if (!marqueeContent || !marqueeScroll) return;

    const { marqueeSpeed: speed, marqueeDirection: direction, marqueeDuplicate: duplicate, marqueeScrollSpeed: scrollSpeed } = marquee.dataset;

    const marqueeSpeedAttr    = parseFloat(speed);
    const marqueeDirectionAttr = direction === "right" ? 1 : -1;
    const duplicateAmount     = parseInt(duplicate || 0);
    const scrollSpeedAttr     = parseFloat(scrollSpeed);
    const speedMultiplier     = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;

    let marqueeSpeed = marqueeSpeedAttr * (marqueeContent.offsetWidth / window.innerWidth) * speedMultiplier;

    marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
    marqueeScroll.style.width      = `${scrollSpeedAttr * 2 + 100}%`;

    if (duplicateAmount > 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < duplicateAmount; i++) {
        fragment.appendChild(marqueeContent.cloneNode(true));
      }
      marqueeScroll.appendChild(fragment);
    }

    const marqueeItems = marquee.querySelectorAll("[data-marquee-collection-target]");
    const animation = gsap.to(marqueeItems, {
      xPercent: -100,
      repeat: -1,
      duration: marqueeSpeed,
      ease: "linear",
    }).totalProgress(0.5);

    gsap.set(marqueeItems, { xPercent: marqueeDirectionAttr === 1 ? 100 : -100 });
    animation.timeScale(marqueeDirectionAttr);
    animation.play();

    marquee.setAttribute("data-marquee-status", "normal");

    ScrollTrigger.create({
      trigger: marquee,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const isInverted = self.direction === 1;
        animation.timeScale(isInverted ? -marqueeDirectionAttr : marqueeDirectionAttr);
        marquee.setAttribute("data-marquee-status", isInverted ? "normal" : "inverted");
      },
    });

    const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
    gsap.timeline({
      scrollTrigger: {
        trigger: marquee,
        start: "0% 100%",
        end: "100% 0%",
        scrub: 0,
      },
    }).fromTo(marqueeScroll, { x: `${scrollStart}vw` }, { x: `${-scrollStart}vw`, ease: "none" });
  });
}

// ==========================================================
// DRAGGABLE MARQUEE
// ==========================================================

function initDraggableMarquee() {
  const wrappers = gsap.utils.toArray("[data-draggable-marquee-init]");
  if (!wrappers.length) return;

  wrappers.forEach((wrapper) => {
    const collection = wrapper.querySelector("[data-draggable-marquee-collection]");
    const lists = gsap.utils.toArray("[data-draggable-marquee-list]", wrapper);
    if (!collection || !lists.length) return;

    if (wrapper._draggableMarqueeDestroy) {
      wrapper._draggableMarqueeDestroy();
      wrapper._draggableMarqueeDestroy = null;
    }

    const duration    = parseFloat(wrapper.dataset.duration)    || 20;
    const multiplier  = parseFloat(wrapper.dataset.multiplier)  || 35;
    const sensitivity = parseFloat(wrapper.dataset.sensitivity) || 0.01;
    const baseDir     = wrapper.dataset.direction === "right" ? 1 : -1;

    // Clone items inside each list for seamless loop
    const rowStates = lists.map((list, i) => {
      Array.from(list.children).forEach((item) => list.appendChild(item.cloneNode(true)));

      const halfWidth = list.scrollWidth / 2;
      const dir = i % 2 === 0 ? baseDir : -baseDir;
      const startX = dir > 0 ? -halfWidth : 0;

      gsap.set(list, { x: startX });
      return { list, dir, halfWidth, x: startX };
    });

    const pxPerFrame = (rowStates[0]?.halfWidth || 500) / (duration * 60);

    let dragVel    = 0;
    let isDragging = false;
    let prevX      = 0;
    let rafId;

    function tick() {
      dragVel *= 0.92;

      rowStates.forEach((state) => {
        state.x += pxPerFrame * state.dir + dragVel * sensitivity * multiplier;

        // Seamless wrap within [-halfWidth, 0)
        state.x = state.x % state.halfWidth;
        if (state.x > 0) state.x -= state.halfWidth;

        gsap.set(state.list, { x: state.x });
      });

      rafId = requestAnimationFrame(tick);
    }

    const onPointerDown = (e) => {
      isDragging = true;
      prevX = e.clientX;
      collection.style.cursor = "grabbing";
      collection.setPointerCapture(e.pointerId);
    };

    const onPointerMove = (e) => {
      if (!isDragging) return;
      dragVel = e.clientX - prevX;
      prevX   = e.clientX;
    };

    const onPointerUp = () => {
      isDragging = false;
      collection.style.cursor = "grab";
    };

    collection.style.cursor      = "grab";
    collection.style.touchAction = "pan-y";

    collection.addEventListener("pointerdown",   onPointerDown);
    collection.addEventListener("pointermove",   onPointerMove);
    collection.addEventListener("pointerup",     onPointerUp);
    collection.addEventListener("pointercancel", onPointerUp);

    rafId = requestAnimationFrame(tick);

    wrapper._draggableMarqueeDestroy = () => {
      cancelAnimationFrame(rafId);
      collection.removeEventListener("pointerdown",   onPointerDown);
      collection.removeEventListener("pointermove",   onPointerMove);
      collection.removeEventListener("pointerup",     onPointerUp);
      collection.removeEventListener("pointercancel", onPointerUp);
      rowStates.forEach((state) => {
        const items = Array.from(state.list.children);
        items.slice(items.length / 2).forEach((el) => el.remove());
        gsap.set(state.list, { clearProps: "x" });
      });
    };
  });
}

// ==========================================================
// LOGO WALL CYCLE
// ==========================================================

function initLogoWallCycle() {
  const loopDelay = 1.5;
  const duration  = 0.9;

  document.querySelectorAll("[data-logo-wall-cycle-init]").forEach((root) => {
    const list = root.querySelector("[data-logo-wall-list]");
    if (!list) return;

    const items = Array.from(list.querySelectorAll("[data-logo-wall-item]"));
    if (!items.length) return;

    const shuffleFront    = root.getAttribute("data-logo-wall-shuffle") !== "false";
    const originalTargets = items
      .map((item) => item.querySelector("[data-logo-wall-target]"))
      .filter(Boolean);

    if (!originalTargets.length) return;

    function shuffleArray(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    }

    const mm = gsap.matchMedia();

    // ── Desktop: logo cycle ─────────────────────────────────────
    mm.add("(min-width: 992px)", () => {
      let visibleItems = [];
      let visibleCount = 0;
      let pool         = [];
      let pattern      = [];
      let patternIndex = 0;
      let tl;

      function isVisible(el) {
        return window.getComputedStyle(el).display !== "none";
      }

      function setup() {
        if (tl) tl.kill();

        visibleItems = items.filter(isVisible);
        visibleCount = visibleItems.length;
        pattern      = shuffleArray(Array.from({ length: visibleCount }, (_, i) => i));
        patternIndex = 0;

        items.forEach((item) => {
          item.querySelectorAll("[data-logo-wall-target]").forEach((old) => old.remove());
        });

        pool = originalTargets.map((n) => n.cloneNode(true));

        let front, rest;
        if (shuffleFront) {
          const shuffledAll = shuffleArray(pool);
          front = shuffledAll.slice(0, visibleCount);
          rest  = shuffleArray(shuffledAll.slice(visibleCount));
        } else {
          front = pool.slice(0, visibleCount);
          rest  = shuffleArray(pool.slice(visibleCount));
        }
        pool = front.concat(rest);

        for (let i = 0; i < visibleCount; i++) {
          const parent =
            visibleItems[i].querySelector("[data-logo-wall-target-parent]") ||
            visibleItems[i];
          parent.appendChild(pool.shift());
        }

        if (!pool.length) {
          pool = shuffleArray(originalTargets.map((n) => n.cloneNode(true)));
        }

        tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay });
        tl.call(swapNext);
        tl.play();
      }

      function swapNext() {
        const nowCount = items.filter(isVisible).length;
        if (nowCount !== visibleCount) { setup(); return; }
        if (!pool.length) return;

        const idx = pattern[patternIndex % visibleCount];
        patternIndex++;

        const container = visibleItems[idx];
        const parent =
          container.querySelector("[data-logo-wall-target-parent]") ||
          container.querySelector("*:has(> [data-logo-wall-target])") ||
          container;

        const existing = parent.querySelectorAll("[data-logo-wall-target]");
        if (existing.length > 1) return;

        const current  = parent.querySelector("[data-logo-wall-target]");
        const incoming = pool.shift();

        gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
        parent.appendChild(incoming);

        if (current) {
          gsap.to(current, {
            yPercent: -50, autoAlpha: 0, duration, ease: "expo.inOut",
            onComplete: () => { current.remove(); pool.push(current); },
          });
        }

        gsap.to(incoming, { yPercent: 0, autoAlpha: 1, duration, delay: 0.1, ease: "expo.inOut" });
      }

      setup();

      const st = ScrollTrigger.create({
        trigger: root, start: "top bottom", end: "bottom top",
        onEnter:     () => tl?.play(),
        onLeave:     () => tl?.pause(),
        onEnterBack: () => tl?.play(),
        onLeaveBack: () => tl?.pause(),
      });

      const onVisibility = () => document.hidden ? tl?.pause() : tl?.play();
      document.addEventListener("visibilitychange", onVisibility);

      return () => {
        tl?.kill();
        st.kill();
        document.removeEventListener("visibilitychange", onVisibility);
        items.forEach((item) => {
          item.querySelectorAll("[data-logo-wall-target]").forEach((el) => el.remove());
        });
        originalTargets.forEach((t) => {
          const parent =
            items[originalTargets.indexOf(t)]?.querySelector("[data-logo-wall-target-parent]") ||
            items[originalTargets.indexOf(t)];
          if (parent) parent.appendChild(t.cloneNode(true));
        });
      };
    });

    // ── Tablet + mobiel: marquee ────────────────────────────────
    mm.add("(max-width: 991px)", () => {
      const clones = items.map((item) => {
        const clone = item.cloneNode(true);
        list.appendChild(clone);
        return clone;
      });

      list.style.width    = "max-content";
      list.style.flexWrap = "nowrap";

      const marqueeAnim = gsap.to(list, {
        x: () => -(list.scrollWidth / 2),
        duration: items.length * 3,
        ease: "linear",
        repeat: -1,
      });

      return () => {
        marqueeAnim.kill();
        clones.forEach((c) => c.remove());
        list.style.width    = "";
        list.style.flexWrap = "";
        gsap.set(list, { clearProps: "x" });
      };
    });
  });
}

// ==========================================================
// REVIEWS TRACK
// ==========================================================

function initReviewsTrack() {
  const wrap  = document.querySelector(".review_wrap");
  const track = document.querySelector(".reviews_track");
  if (!wrap || !track) return;

  const cards = gsap.utils.toArray(".review_card", track);
  if (!cards.length) return;

  if (wrap._reviewsDestroy) {
    wrap._reviewsDestroy();
    wrap._reviewsDestroy = null;
  }

  // ── Scroll reveal ──────────────────────────────────────────
  gsap.set(cards, { autoAlpha: 0, y: 48 });

  const revealST = ScrollTrigger.create({
    trigger: wrap,
    start: "clamp(top 88%)",
    once: true,
    onEnter: () => {
      gsap.to(cards, {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "expo.out",
        stagger: { each: 0.09, from: "start" },
      });
    },
  });

  // ── Horizontal drag met snap ───────────────────────────────
  let posX        = 0;
  let velX        = 0;
  let isDragging  = false;
  let prevClientX = 0;
  let rafId;
  let snapTween;

  const getMaxX = () => -(track.scrollWidth - wrap.offsetWidth);

  function snapToNearest() {
    const snapPoints = cards.map((card) =>
      Math.max(getMaxX(), Math.min(0, -card.offsetLeft))
    );
    const nearest = snapPoints.reduce((prev, curr) =>
      Math.abs(curr - posX) < Math.abs(prev - posX) ? curr : prev
    );
    if (snapTween) snapTween.kill();
    const proxy = { x: posX };
    snapTween = gsap.to(proxy, {
      x: nearest,
      duration: 0.6,
      ease: "expo.out",
      onUpdate: () => { posX = proxy.x; },
    });
  }

  function tick() {
    if (!isDragging && !snapTween?.isActive()) {
      velX *= 0.92;
      posX = Math.min(0, Math.max(getMaxX(), posX + velX));
    }
    gsap.set(track, { x: posX });
    rafId = requestAnimationFrame(tick);
  }

  const onPointerDown = (e) => {
    if (snapTween) snapTween.kill();
    isDragging  = true;
    prevClientX = e.clientX;
    wrap.style.cursor = "grabbing";
    wrap.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    if (!isDragging) return;
    const dx    = e.clientX - prevClientX;
    posX        = Math.min(0, Math.max(getMaxX(), posX + dx));
    velX        = dx;
    prevClientX = e.clientX;
  };

  const onPointerUp = () => {
    isDragging = false;
    wrap.style.cursor = "grab";
    velX = 0;
    snapToNearest();
  };

  wrap.style.cursor      = "grab";
  wrap.style.userSelect  = "none";
  wrap.style.touchAction = "pan-y";
  wrap.style.overflow    = "hidden";

  wrap.addEventListener("pointerdown",   onPointerDown);
  wrap.addEventListener("pointermove",   onPointerMove);
  wrap.addEventListener("pointerup",     onPointerUp);
  wrap.addEventListener("pointercancel", onPointerUp);

  rafId = requestAnimationFrame(tick);

  wrap._reviewsDestroy = () => {
    revealST.kill();
    cancelAnimationFrame(rafId);
    if (snapTween) snapTween.kill();
    wrap.removeEventListener("pointerdown",   onPointerDown);
    wrap.removeEventListener("pointermove",   onPointerMove);
    wrap.removeEventListener("pointerup",     onPointerUp);
    wrap.removeEventListener("pointercancel", onPointerUp);
    gsap.set(track, { clearProps: "x" });
    gsap.set(cards, { clearProps: "all" });
  };
}

// ==========================================================
// FOTO TEKST CARDS
// ==========================================================

function initFotoTekstCards() {
  const wrapper = document.querySelector(".div-block-12");
  if (!wrapper) return;

  const cards = gsap.utils.toArray(".foto_tekst", wrapper);
  if (cards.length < 2) return;

  const arrow = document.querySelector(".icon-embed-custom-13");

  if (wrapper._fotoDestroy) {
    wrapper._fotoDestroy();
    wrapper._fotoDestroy = null;
  }

  const rotations = cards.map((card) => {
    const matrix = window.getComputedStyle(card).transform;
    if (!matrix || matrix === "none") return 0;
    const m = matrix.match(/matrix\(([^)]+)\)/);
    if (!m) return 0;
    const [a, b] = m[1].split(",").map(Number);
    return Math.round(Math.atan2(b, a) * (180 / Math.PI) * 10) / 10;
  });

  gsap.set(cards, { autoAlpha: 0, y: 70 });
  cards.forEach((card, i) => gsap.set(card, { rotation: 0 }));
  if (arrow) gsap.set(arrow, { scale: 0, transformOrigin: "20% 30%" });

  const st = ScrollTrigger.create({
    trigger: wrapper,
    start: "clamp(top 82%)",
    once: true,
    onEnter: () => {
      cards.forEach((card, i) => {
        gsap.to(card, {
          autoAlpha: 1,
          y: 0,
          rotation: rotations[i],
          duration: 1.3,
          ease: "expo.out",
          delay: i * 0.18,
        });
      });

      if (arrow) {
        gsap.to(arrow, {
          scale: 1,
          duration: 1.0,
          ease: "back.out(2.5)",
          delay: 0.75,
        });
      }
    },
  });

  const mm = gsap.matchMedia();
  mm.add("(hover: hover)", () => {
    const onEnter = () => {
      gsap.to(cards[0], { x: -14, y: -6, rotation: rotations[0] - 4, duration: 0.7, ease: "expo.out" });
      gsap.to(cards[1], { x: 14,  y:  6, rotation: rotations[1] + 4, duration: 0.7, ease: "expo.out" });
    };
    const onLeave = () => {
      gsap.to(cards[0], { x: 0, y: 0, rotation: rotations[0], duration: 0.7, ease: "expo.out" });
      gsap.to(cards[1], { x: 0, y: 0, rotation: rotations[1], duration: 0.7, ease: "expo.out" });
    };
    wrapper.addEventListener("mouseenter", onEnter);
    wrapper.addEventListener("mouseleave", onLeave);
    return () => {
      wrapper.removeEventListener("mouseenter", onEnter);
      wrapper.removeEventListener("mouseleave", onLeave);
    };
  });

  wrapper._fotoDestroy = () => {
    st.kill();
    mm.revert();
    gsap.killTweensOf(cards);
    gsap.set(cards, { clearProps: "all" });
    if (arrow) gsap.set(arrow, { clearProps: "scale,transformOrigin" });
  };
}

// ==========================================================
// WAAIER
// ==========================================================

function initWaaier() {
  const wrapper = document.querySelector(".image_waaier");
  if (!wrapper) return;

  const cards = gsap.utils.toArray(".waaier_image", wrapper);
  if (!cards.length) return;

  if (wrapper._waaierDestroy) {
    wrapper._waaierDestroy();
    wrapper._waaierDestroy = null;
  }

  // CSS-rotaties uitlezen vóór GSAP de transform overneemt
  const rotations = cards.map((card) => {
    const matrix = window.getComputedStyle(card).transform;
    if (!matrix || matrix === "none") return 0;
    const m = matrix.match(/matrix\(([^)]+)\)/);
    if (!m) return 0;
    const [a, b] = m[1].split(",").map(Number);
    return Math.round(Math.atan2(b, a) * (180 / Math.PI) * 10) / 10;
  });

  gsap.set(cards, { autoAlpha: 0, y: 100 });
  cards.forEach((card, i) => gsap.set(card, { rotation: rotations[i] }));

  const st = ScrollTrigger.create({
    trigger: wrapper,
    start: "clamp(top 82%)",
    once: true,
    onEnter: () => {
      gsap.to(cards, {
        autoAlpha: 1,
        y: 0,
        duration: 1.6,
        ease: "expo.out",
        stagger: { each: 0.12, from: "center" },
      });
    },
  });

  wrapper._waaierDestroy = () => {
    st.kill();
    gsap.killTweensOf(cards);
    gsap.set(cards, { clearProps: "all" });
  };
}

// ==========================================================
// TABS
// ==========================================================

function initTabs() {
  function setupGroup(scope, btns, panes) {
    if (scope._tabsDestroy) {
      scope._tabsDestroy();
      scope._tabsDestroy = null;
    }

    gsap.set(panes, { autoAlpha: 0, y: 16 });
    const initiallyActive = panes.filter((p) => p.classList.contains("is-active"));
    if (initiallyActive.length) gsap.set(initiallyActive, { autoAlpha: 1, y: 0 });

    function activate(idx, instant = false) {
      const prev = panes.find((p) => p.classList.contains("is-active"));
      const next = panes.find((p) => p.dataset.pane === idx);
      if (!next || next === prev) return;

      btns.forEach((b) => b.classList.toggle("is-active", b.dataset.tab === idx));

      if (instant || !prev) {
        if (prev) prev.classList.remove("is-active");
        next.classList.add("is-active");
        gsap.set(next, { autoAlpha: 1, y: 0 });
        return;
      }

      gsap.to(prev, {
        autoAlpha: 0, y: -10,
        duration: 0.25, ease: "power2.in",
        onComplete: () => {
          prev.classList.remove("is-active");
          next.classList.add("is-active");
          gsap.fromTo(next,
            { autoAlpha: 0, y: 16 },
            { autoAlpha: 1, y: 0, duration: 0.45, ease: "expo.out" }
          );
        },
      });
    }

    // Activeer de al-actieve tab (of de eerste)
    const initialBtn = btns.find((b) => b.classList.contains("is-active")) || btns[0];
    activate(initialBtn.dataset.tab, true);

    const handlers = btns.map((btn) => {
      const handler = () => activate(btn.dataset.tab);
      btn.addEventListener("click", handler);
      return { btn, handler };
    });

    scope._tabsDestroy = () => {
      handlers.forEach(({ btn, handler }) => btn.removeEventListener("click", handler));
      gsap.set(panes, { clearProps: "all" });
    };
  }

  const groups = gsap.utils.toArray("[data-tabs]");

  if (groups.length) {
    groups.forEach((group) => {
      const btns  = gsap.utils.toArray("[data-tab]", group);
      const panes = gsap.utils.toArray("[data-pane]", group);
      if (!btns.length || !panes.length) return;
      setupGroup(group, btns, panes);
    });
  } else {
    const btns  = gsap.utils.toArray("[data-tab]");
    const panes = gsap.utils.toArray("[data-pane]");
    if (!btns.length || !panes.length) return;
    setupGroup(document.body, btns, panes);
  }
}

// ==========================================================
// BUTTON HOVER
// ==========================================================

function initBtnHover() {
  const btns = gsap.utils.toArray("[data-btn-hover]");
  if (!btns.length) return;

  btns.forEach((btn) => {
    if (btn._btnHoverDestroy) {
      btn._btnHoverDestroy();
      btn._btnHoverDestroy = null;
    }

    const onEnter = () => gsap.to(btn, { scale: 1.04, duration: 0.4, ease: "elastic.out(1.2, 0.4)" });
    const onLeave = () => gsap.to(btn, { scale: 1, duration: 0.4, ease: "elastic.out(1.2, 0.4)" });
    const onDown  = () => gsap.to(btn, { scale: 0.97, duration: 0.15, ease: "power2.out" });
    const onUp    = () => gsap.to(btn, { scale: 1.04, duration: 0.3, ease: "elastic.out(1.2, 0.4)" });

    btn.addEventListener("mouseenter", onEnter);
    btn.addEventListener("mouseleave", onLeave);
    btn.addEventListener("mousedown", onDown);
    btn.addEventListener("mouseup", onUp);

    btn._btnHoverDestroy = () => {
      btn.removeEventListener("mouseenter", onEnter);
      btn.removeEventListener("mouseleave", onLeave);
      btn.removeEventListener("mousedown", onDown);
      btn.removeEventListener("mouseup", onUp);
    };
  });
}

// ==========================================================
// FORM VALIDATION
// ==========================================================

function initBasicFormValidation() {
  const forms = gsap.utils.toArray("[data-form-validate]");
  if (!forms.length) return;

  forms.forEach((form) => {
    if (form._formDestroy) {
      form._formDestroy();
      form._formDestroy = null;
    }

    const fields          = form.querySelectorAll("[data-validate] input, [data-validate] textarea");
    const submitButtonDiv = form.querySelector("[data-submit]");
    const submitInput     = submitButtonDiv ? submitButtonDiv.querySelector('input[type="submit"]') : null;
    if (!submitButtonDiv || !submitInput) return;

    const formLoadTime = Date.now();

    const validateField = (field) => {
      const parent    = field.closest("[data-validate]");
      const minLength = field.getAttribute("min");
      const maxLength = field.getAttribute("max");
      const type      = field.getAttribute("type");
      let isValid     = true;

      field.value.trim() !== ""
        ? parent.classList.add("is--filled")
        : parent.classList.remove("is--filled");

      if (minLength && field.value.length < minLength) isValid = false;
      if (maxLength && field.value.length > maxLength) isValid = false;
      if (type === "email" && !/\S+@\S+\.\S+/.test(field.value)) isValid = false;

      parent.classList.toggle("is--error",   !isValid);
      parent.classList.toggle("is--success",  isValid);
      return isValid;
    };

    const startLiveValidation = (field) => {
      const handler = () => validateField(field);
      field.addEventListener("input", handler);
      return () => field.removeEventListener("input", handler);
    };

    const liveCleanups = [];

    const validateAll = () => {
      let allValid = true;
      let firstInvalid = null;

      fields.forEach((field) => {
        const valid = validateField(field);
        if (!valid && !firstInvalid) firstInvalid = field;
        if (!valid) allValid = false;
        liveCleanups.push(startLiveValidation(field));
      });

      if (firstInvalid) firstInvalid.focus();
      return allValid;
    };

    const isSpam = () => (Date.now() - formLoadTime) / 1000 < 5;

    const handleSubmit = () => {
      if (!validateAll()) return;
      if (isSpam()) { alert("Formulier te snel ingestuurd. Probeer opnieuw."); return; }
      submitInput.click();
    };

    const handleKeydown = (e) => {
      if (e.key === "Enter" && e.target.tagName !== "TEXTAREA") {
        e.preventDefault();
        handleSubmit();
      }
    };

    submitButtonDiv.addEventListener("click", handleSubmit);
    form.addEventListener("keydown", handleKeydown);

    form._formDestroy = () => {
      submitButtonDiv.removeEventListener("click", handleSubmit);
      form.removeEventListener("keydown", handleKeydown);
      liveCleanups.forEach((fn) => fn());
    };
  });
}

// ==========================================================
// FIXED UNDERLAY NAVIGATION
// ==========================================================

function initFixedUnderlayNavigation() {
  CustomEase.create("energy", "M0,0 C0.32,0.72 0,1 1,1");

  const toggleBtn      = document.querySelector("[data-underlay-nav-toggle]");
  const toggleLabels   = document.querySelectorAll(".underlay-nav__toggle-label");
  const toggleBars     = document.querySelectorAll(".underlay-nav__toggle-bar");
  const menuEl         = document.querySelector("[data-underlay-nav-menu]");
  const largeItems     = document.querySelectorAll("[data-reveal-l]");
  const smallItems     = document.querySelectorAll("[data-reveal-s]");
  const menuBorder     = document.querySelector(".underlay-nav__bottom-border");
  const mainEl         = document.querySelector("[data-main]");
  const overlayEl      = document.querySelector("[data-underlay-nav-overlay]");
  const darkEl         = document.querySelector(".underlay-nav__dark");
  const corners        = document.querySelectorAll(".underlay-nav__corner");
  const overlayBorders = document.querySelectorAll(".underlay-nav__border-row");
  const logoHideEls    = document.querySelectorAll(".hide_on_menu_open:not(.navbar__logo)");
  const logoImg        = document.querySelector(".navbar__logo-img");
  const navInner       = document.querySelector(".navbar__inner");
  const navList        = document.querySelector(".underlay-nav__list");

  if (!toggleBtn || !menuEl || !mainEl || !overlayEl) return;

  // Padding-top nav list = hoogte navbar inner (ook bijhouden bij resize)
  let menuLogoEl = null;
  function syncNavListPadding() {
    if (!navList || !navInner) return;
    const h = navInner.offsetHeight;
    navList.style.paddingTop = h + "px";
    if (menuLogoEl) menuLogoEl.style.height = h + "px";
  }
  syncNavListPadding();

  // Logo-clone in het witte menu-paneel, absoluut in de padding-top ruimte
  const underlayNavInner = document.querySelector(".underlay-nav__inner");
  if (logoImg && underlayNavInner && navInner) {
    const logoW = logoImg.offsetWidth;
    const logoH = logoImg.offsetHeight;
    const padL  = parseFloat(getComputedStyle(underlayNavInner).paddingLeft) || 0;

    menuLogoEl = document.createElement("div");
    menuLogoEl.style.cssText = [
      "position:absolute", "top:0", "left:0", "right:0",
      `height:${navInner.offsetHeight}px`,
      "display:flex", "align-items:center",
      `padding-left:${padL}px`,
      "color:#1a1a1a", "pointer-events:none", "box-sizing:border-box",
    ].join(";") + ";";

    const svgWrap = document.createElement("div");
    svgWrap.style.cssText = `width:${logoW}px;height:${logoH}px;flex-shrink:0;`;
    svgWrap.innerHTML = logoImg.innerHTML;
    menuLogoEl.appendChild(svgWrap);

    underlayNavInner.style.position = "relative";
    underlayNavInner.prepend(menuLogoEl);
    gsap.set(menuLogoEl, { autoAlpha: 0 });
  }

  const closedColor = getComputedStyle(toggleBtn).color;

  let isOpen      = false;
  let tl;
  let enterEndTime = 0;

  const getMenuOffset = () => -menuEl.offsetWidth;

  gsap.set(overlayEl,      { visibility: "hidden", pointerEvents: "none" });
  gsap.set(menuEl,         { opacity: 1 });
  if (logoHideEls.length) gsap.set(logoHideEls, { autoAlpha: 1 });
  gsap.set(darkEl,         { autoAlpha: 0 });
  gsap.set(mainEl,         { x: 0 });
  gsap.set(toggleLabels,   { yPercent: 0 });
  gsap.set(toggleBars,     { y: 0, rotation: 0 });
  gsap.set(menuBorder,     { scaleX: 0 });
  gsap.set(overlayBorders[0], { yPercent: -100 });
  gsap.set(overlayBorders[1], { yPercent: 100 });
  gsap.set(corners,        { scale: 0 });

  function buildTimeline() {
    tl = gsap.timeline({ paused: true, defaults: { ease: "energy" } });

    tl.set(overlayEl, { visibility: "visible", pointerEvents: "auto" }, 0)

      .to([mainEl, overlayEl], { x: getMenuOffset, duration: 0.7 }, 0)

      .to(darkEl,    { autoAlpha: 1, duration: 0.5 }, 0)
      .to(corners,   { scale: 1,    duration: 0.5 }, 0)
      .to(overlayBorders, { yPercent: 0, duration: 0.5 }, 0)

      .to(toggleLabels, { yPercent: -100, duration: 0.4 }, 0)
      .to(toggleBtn,    { color: "#000000", duration: 0.4 }, 0)
      .to(logoHideEls,  { autoAlpha: 0, duration: 0.3 }, 0)

      .to(toggleBars[0], {
        y: "0.25em", rotation: 45,
        duration: 0.35, ease: "back.out(1.4)",
      }, 0.05)
      .to(toggleBars[1], {
        y: "-0.25em", rotation: -45,
        duration: 0.35, ease: "back.out(1.4)",
      }, 0.05)

      .fromTo(largeItems,
        { autoAlpha: 0, xPercent: 25 },
        { autoAlpha: 1, xPercent: 0, duration: 0.7, stagger: 0.05 },
        0
      )
      .fromTo(smallItems,
        { autoAlpha: 0, yPercent: 100 },
        { autoAlpha: 1, yPercent: 0, duration: 0.5, stagger: 0.03, ease: "power3.out" },
        0.3
      )
      .to(menuBorder, { scaleX: 1, duration: 0.5 }, "<");

    if (menuLogoEl) tl.fromTo(menuLogoEl,
      { autoAlpha: 0 },
      { autoAlpha: 1, duration: 0.4, ease: "expo.out" },
      "<"
    );

    enterEndTime = tl.duration();

    tl.addPause()

      .to([...largeItems, ...smallItems], { autoAlpha: 0, duration: 0.3 }, "<")
      .to([mainEl, overlayEl], { x: 0, duration: 0.6 }, "<")
      .to(darkEl,  { autoAlpha: 0, duration: 0.35, ease: "power2.inOut" }, "<")
      .to(corners, { scale: 0,     duration: 0.5 }, "<")
      .to(overlayBorders[0], { yPercent: -100, duration: 0.5 }, "<")
      .to(overlayBorders[1], { yPercent: 100,  duration: 0.5 }, "<")
      .to(toggleBtn,    { color: closedColor, duration: 0.25 }, "<+=0.1")
      .to(logoHideEls,  { autoAlpha: 1, duration: 0.25 }, "<")
      .to(toggleLabels, { yPercent: 0, duration: 0.25, ease: "power3.in" }, "<")
      .to(toggleBars,   { y: 0, rotation: 0, duration: 0.25, ease: "power3.in" }, "<")

      .set(overlayEl, { visibility: "hidden", pointerEvents: "none" });

    if (menuLogoEl) tl.to(menuLogoEl, { autoAlpha: 0, duration: 0.2 }, enterEndTime);
  }

  function toggle() {
    isOpen = !isOpen;
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
    toggleBtn.setAttribute("aria-label", isOpen ? "close menu" : "open menu");
    document.body.setAttribute("data-menu-status", isOpen ? "open" : "");

    // Logo SVG: currentColor → #000 bij open, CSS-waarde terug bij sluiten
    if (isOpen) {
      tl.invalidate();
      if (tl.time() >= enterEndTime) tl.timeScale(1).restart();
      else tl.timeScale(1).play();
    } else {
      if (tl.time() < enterEndTime) tl.timeScale(1).reverse();
      else tl.timeScale(1).play();
    }
  }

  buildTimeline();

  toggleBtn.addEventListener("click", toggle);

  overlayEl.addEventListener("click", () => {
    if (isOpen) toggle();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && isOpen) {
      toggle();
      toggleBtn.focus();
    }
  });

  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      syncNavListPadding();
      if (isOpen) {
        gsap.set([mainEl, overlayEl], { x: getMenuOffset() });
      } else {
        tl.invalidate();
      }
    }, 150);
  });
}

// ==========================================================
// PHOTO ROWS MARQUEE
// ==========================================================

function initPhotoRowsMarquee() {
  const cards = document.querySelectorAll("[data-marquee-card]");
  if (!cards.length) return;

  cards.forEach((card) => {
    const rows = card.querySelectorAll(".top_row");
    if (!rows.length) return;

    card.style.overflow = "hidden";

    rows.forEach((row, i) => {
      const items = Array.from(row.querySelectorAll(".small_img"));
      if (!items.length) return;

      const gap      = parseFloat(getComputedStyle(row).columnGap) || 0;
      const itemW    = items[0].offsetWidth;
      const loopW    = items.length * (itemW + gap);
      const duration = items.length * 4;

      const track = document.createElement("div");
      track.style.cssText = `display:flex;flex-wrap:nowrap;column-gap:${gap}px;`;
      items.forEach((item) => track.appendChild(item));
      // 2 clone-sets: card centreert de rows waardoor de track niet bij x:0 begint;
      // 2 extra sets zorgen dat het zichtbare venster altijd gevuld is (N ≥ cardW/loopW + 2)
      items.forEach((item) => track.appendChild(item.cloneNode(true)));
      items.forEach((item) => track.appendChild(item.cloneNode(true)));
      row.appendChild(track);

      if (i % 2 === 0) {
        gsap.to(track, { x: -loopW, duration, ease: "linear", repeat: -1 });
      } else {
        gsap.set(track, { x: -loopW });
        gsap.to(track, { x: 0, duration, ease: "linear", repeat: -1 });
      }
    });
  });
}

// ==========================================================
// INIT ALL
// ==========================================================

// ==========================================================
// SCRATCH UNDERLINE
// ==========================================================

function initScratchUnderline() {
  const el = document.querySelector(".icon-embed-custom-11");
  if (!el) return;

  gsap.set(el, { clipPath: "inset(0 100% 0 0)" });

  ScrollTrigger.create({
    trigger: el,
    start: "clamp(top 90%)",
    once: true,
    onEnter: () => {
      gsap.to(el, {
        clipPath: "inset(0 0% 0 0)",
        duration: 0.85,
        ease: "expo.out",
        delay: 0.5,
      });
    },
  });
}

// ==========================================================
// NAV DROPDOWNS
// ==========================================================

function initNavDropdowns() {
  const dropdowns = gsap.utils.toArray(".navbar__dropdown");
  if (!dropdowns.length) return;

  const mm = gsap.matchMedia();

  mm.add("(min-width: 992px)", () => {
    const cleanups  = [];
    const instances = [];

    function closeAll(except) {
      instances.forEach(({ wrap, close }) => { if (wrap !== except) close(); });
    }

    dropdowns.forEach((wrap) => {
      const panel = wrap.querySelector(".navbar__dropdown-panel");
      const icon  = wrap.querySelector(".navbar__icon");
      if (!panel) return;

      const items = gsap.utils.toArray(".navbar__link", panel);

      // Measure natural height once — avoids all clipPath/transform conflicts
      gsap.set(panel, { display: "flex", height: "auto", bottom: "auto",
        visibility: "hidden", overflow: "hidden" });
      const panelH = panel.offsetHeight;
      gsap.set(panel, { display: "none", height: 0,
        clearProps: "visibility,bottom" });

      if (items.length) gsap.set(items, { opacity: 0, y: 8 });

      let tl         = null;
      let isOpen     = false;
      let closeTimer = null;

      function open() {
        if (closeTimer) { clearTimeout(closeTimer); closeTimer = null; }
        if (isOpen) return;
        isOpen = true;
        closeAll(wrap);
        if (tl) tl.kill();
        gsap.set(panel, { display: "flex", height: 0, overflow: "hidden" });
        tl = gsap.timeline();
        tl.to(panel, { height: panelH, duration: 0.45, ease: "expo.out" }, 0);
        if (icon) tl.to(icon, { rotation: 180, duration: 0.4, ease: "expo.out" }, 0);
        if (items.length) {
          tl.to(items, { opacity: 1, y: 0, duration: 0.32, ease: "expo.out", stagger: 0.07 }, 0.1);
        }
      }

      function close() {
        if (!isOpen) return;
        isOpen = false;
        if (tl) tl.kill();
        tl = gsap.timeline();
        if (items.length) {
          tl.to(items, { opacity: 0, y: 6, duration: 0.15, ease: "expo.in" }, 0);
        }
        tl.to(panel, { height: 0, duration: 0.3, ease: "expo.in",
          onComplete: () => gsap.set(panel, { display: "none" }),
        }, 0);
        if (icon) tl.to(icon, { rotation: 0, duration: 0.26, ease: "expo.in" }, 0);
      }

      const onEnter = () => open();
      const onLeave = () => { closeTimer = setTimeout(close, 120); };

      wrap.addEventListener("mouseenter", onEnter);
      wrap.addEventListener("mouseleave", onLeave);

      instances.push({ wrap, close });
      cleanups.push(() => {
        wrap.removeEventListener("mouseenter", onEnter);
        wrap.removeEventListener("mouseleave", onLeave);
        if (closeTimer) clearTimeout(closeTimer);
        if (tl) tl.kill();
        gsap.set(panel, { display: "none", clearProps: "height,overflow" });
        if (icon) gsap.set(icon, { clearProps: "rotation" });
        if (items.length) gsap.set(items, { clearProps: "opacity,y" });
      });
    });

    const onDocClick = (e) => {
      if (!e.target.closest(".navbar__dropdown")) {
        instances.forEach(({ close }) => close());
      }
    };
    const onKeyDown = (e) => {
      if (e.key === "Escape") instances.forEach(({ close }) => close());
    };
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cleanups.forEach((fn) => fn());
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKeyDown);
    };
  });
}

function initAll() {
  initHeroLoad();
  initHeadingReveal();
  initScratchUnderline();
  initFotoTekstCards();
  initGlobalParallax();
  initMarqueeScrollDirection();
  initDraggableMarquee();
  initLogoWallCycle();
  initReviewsTrack();
  initWaaier();
  initTabs();
  initAccordionCSS();
  initBtnHover();
  initBasicFormValidation();
  initNavDropdowns();
  initPhotoRowsMarquee();
  initFixedUnderlayNavigation();
}

// ==========================================================
// BOOT
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
  initLenis();

  const preloaderTl = initPreloader();
  if (preloaderTl) {
    preloaderTl.eventCallback("onComplete", () => {
      document.querySelector(".preloader")?.remove();
      document.body.style.cursor = "";
      initAll();
      if (hasScrollTrigger) ScrollTrigger.refresh();
    });
  } else {
    initAll();
    if (hasScrollTrigger) ScrollTrigger.refresh();
  }
});
