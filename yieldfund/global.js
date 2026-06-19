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
// INIT ALL
// ==========================================================

function initAll() {
  initNavEntrance();
  initHeadingReveal();
  initGlobalParallax();
  initMarqueeScrollDirection();
  initAccordionCSS();
  initBtnHover();
  initBasicFormValidation();
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
