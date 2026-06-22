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
// NAV ENTRANCE
// ==========================================================

function initNavEntrance() {
  const nav = document.querySelector(".nav_component");
  if (!nav) return;

  gsap.fromTo(
    nav,
    { autoAlpha: 0, y: -16 },
    { autoAlpha: 1, y: 0, duration: 0.8, ease: "expo.out", delay: 0.2 }
  );
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
      gsap.set(lines, { yPercent: 110 });

      const inViewport = el.getBoundingClientRect().top < window.innerHeight;

      gsap.to(lines, {
        yPercent: 0,
        duration: 1,
        ease: "expo.out",
        stagger: splitConfig.lines.stagger,
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
  const marquees = gsap.utils.toArray("[data-marquee-scroll-direction-target]");
  if (!marquees.length) return;

  marquees.forEach((marquee) => {
    const speed = parseFloat(marquee.dataset.marqueeSpeed) || 1;
    const baseDirection = marquee.dataset.marqueeDirection === "right" ? 1 : -1;
    const duplicate = marquee.dataset.marqueeDuplicate !== "false";
    const scrollSpeedMultiplier = parseFloat(marquee.dataset.marqueeScrollSpeed) || 3;

    const inner = marquee.querySelector("[data-marquee-inner]") || marquee.firstElementChild;
    if (!inner) return;

    if (duplicate) {
      const clone = inner.cloneNode(true);
      marquee.appendChild(clone);
    }

    const totalWidth = inner.offsetWidth;
    let direction = baseDirection;
    let scrollVelocity = 0;
    let currentX = 0;
    let rafId = null;

    function tick() {
      scrollVelocity *= 0.9;
      currentX -= (speed + Math.abs(scrollVelocity) * scrollSpeedMultiplier) * direction;
      if (Math.abs(currentX) >= totalWidth) currentX = 0;
      gsap.set(marquee.children, { x: currentX });
      rafId = requestAnimationFrame(tick);
    }

    const onScroll = ScrollTrigger.create({
      onUpdate: (self) => {
        scrollVelocity = self.getVelocity() / 100;
        direction = scrollVelocity < 0 ? -baseDirection : baseDirection;
      },
    });

    rafId = requestAnimationFrame(tick);

    marquee._marqueeDestroy = () => {
      onScroll.kill();
      cancelAnimationFrame(rafId);
    };
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
        state.x += -pxPerFrame * state.dir + dragVel * sensitivity * multiplier;

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

    let visibleItems = [];
    let visibleCount = 0;
    let pool         = [];
    let pattern      = [];
    let patternIndex = 0;
    let tl;

    function isVisible(el) {
      return window.getComputedStyle(el).display !== "none";
    }

    function shuffleArray(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
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
      if (nowCount !== visibleCount) {
        setup();
        return;
      }
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
          yPercent: -50,
          autoAlpha: 0,
          duration,
          ease: "expo.inOut",
          onComplete: () => {
            current.remove();
            pool.push(current);
          },
        });
      }

      gsap.to(incoming, {
        yPercent: 0,
        autoAlpha: 1,
        duration,
        delay: 0.1,
        ease: "expo.inOut",
      });
    }

    setup();

    ScrollTrigger.create({
      trigger: root,
      start: "top bottom",
      end: "bottom top",
      onEnter:     () => tl?.play(),
      onLeave:     () => tl?.pause(),
      onEnterBack: () => tl?.play(),
      onLeaveBack: () => tl?.pause(),
    });

    document.addEventListener("visibilitychange", () =>
      document.hidden ? tl?.pause() : tl?.play()
    );
  });
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

  if (!toggleBtn || !menuEl || !mainEl || !overlayEl) return;

  const closedColor = getComputedStyle(toggleBtn).color;
  const openColor   = getComputedStyle(menuEl).color;

  let isOpen      = false;
  let tl;
  let enterEndTime = 0;

  const getMenuOffset = () => -menuEl.offsetWidth;

  gsap.set(overlayEl,      { visibility: "hidden", pointerEvents: "none" });
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
      .to(toggleBtn,    { color: openColor, duration: 0.4 }, 0)

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

    enterEndTime = tl.duration();

    tl.addPause()

      .to([largeItems, smallItems], { autoAlpha: 0, duration: 0.3 }, "<")
      .to([mainEl, overlayEl], { x: 0, duration: 0.6 }, "<")
      .to(darkEl,  { autoAlpha: 0, duration: 0.35, ease: "power2.inOut" }, "<")
      .to(corners, { scale: 0,     duration: 0.5 }, "<")
      .to(overlayBorders[0], { yPercent: -100, duration: 0.5 }, "<")
      .to(overlayBorders[1], { yPercent: 100,  duration: 0.5 }, "<")
      .to(toggleBtn,    { color: closedColor, duration: 0.25 }, "<+=0.1")
      .to(toggleLabels, { yPercent: 0, duration: 0.25, ease: "power3.in" }, "<")
      .to(toggleBars,   { y: 0, rotation: 0, duration: 0.25, ease: "power3.in" }, "<")

      .set(overlayEl, { visibility: "hidden", pointerEvents: "none" });
  }

  function toggle() {
    isOpen = !isOpen;
    toggleBtn.setAttribute("aria-expanded", String(isOpen));
    toggleBtn.setAttribute("aria-label", isOpen ? "close menu" : "open menu");
    document.body.setAttribute("data-menu-status", isOpen ? "open" : "");

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
      if (isOpen) {
        gsap.set([mainEl, overlayEl], { x: getMenuOffset() });
      } else {
        tl.invalidate();
      }
    }, 150);
  });
}

// ==========================================================
// INIT ALL
// ==========================================================

function initAll() {
  initNavEntrance();
  initHeadingReveal();
  initGlobalParallax();
  initMarqueeScrollDirection();
  initDraggableMarquee();
  initLogoWallCycle();
  initAccordionCSS();
  initBtnHover();
  initBasicFormValidation();
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
