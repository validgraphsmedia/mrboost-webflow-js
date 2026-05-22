// ==========================================================
// NISPEN — GLOBAL JS
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
// PRELOADER
// ==========================================================

function initPreloader() {
  const preloader = document.querySelector(".preloader");
  if (!preloader) return null;

  document.body.style.cursor = "wait";

  const tl = gsap.timeline({
    onComplete: () => {
      preloader.remove();
      document.body.style.cursor = "";
    },
  });

  if (reducedMotion) {
    tl.set(preloader, { autoAlpha: 0 });
    return tl;
  }

  tl.to(preloader, {
    yPercent: -100,
    duration: 1,
    ease: "osmo",
    delay: 0.4,
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
// NAV HIDE ON SCROLL
// ==========================================================

let navHideMMCleanup = null;

function initNavHideOnScroll() {
  if (navHideMMCleanup) {
    navHideMMCleanup();
    navHideMMCleanup = null;
  }

  const hero = document.querySelector(".hero");
  if (!hero) return;

  const nav = document.querySelector(".nav_items_wrapper");
  if (!nav) return;

  const localMM = gsap.matchMedia();

  localMM.add(
    {
      isMobile: "(max-width:479px)",
      isTablet: "(max-width:991px)",
      isDesktop: "(min-width:992px)",
    },
    (context) => {
      const { isDesktop } = context.conditions;
      const navChildren = Array.from(nav.children);

      if (navChildren.length) gsap.set(navChildren, { yPercent: 0, autoAlpha: 1 });

      const st = ScrollTrigger.create({
        trigger: hero,
        start: "bottom top",
        onEnter: () => {
          if (!navChildren.length || !isDesktop) return;
          gsap.to(navChildren, {
            yPercent: -40,
            autoAlpha: 0,
            duration: 0.9,
            ease: "expo.inOut",
            stagger: { each: 0.06, from: "end" },
          });
        },
        onLeaveBack: () => {
          if (!navChildren.length || !isDesktop) return;
          gsap.to(navChildren, {
            yPercent: 0,
            autoAlpha: 1,
            duration: 0.9,
            ease: "expo.out",
            stagger: { each: 0.06, from: "start" },
          });
        },
      });

      navHideMMCleanup = () => st.kill();
      return () => st.kill();
    }
  );
}

// ==========================================================
// HEADING REVEAL (SPLIT TEXT)
// ==========================================================

function initHeadingReveal() {
  const headings = gsap.utils.toArray("[data-split]");
  if (!headings.length) return;

  // Verberg headings direct — voorkomt flash als fonts nog laden
  gsap.set(headings, { autoAlpha: 0 });

  // Wacht op fonts — anders meet SplitText met fallback font en kloppen de line breaks niet
  document.fonts.ready.then(() => {
    const splits = headings.map((el) =>
      SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true })
    );

    headings.forEach((el, i) => {
      const lines = splits[i].lines;
      const masks = lines.map((line) => line.parentElement);

      // Padding/margin fix — voorkomt clipping van ascenders/descenders door het masker
      masks.forEach((m) => { m.style.paddingTop = "0.12em"; m.style.marginTop = "-0.12em"; });

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

  triggers.forEach((trigger) => {
    const target = trigger.querySelector("[data-parallax='target']") || trigger;
    const direction = trigger.dataset.parallaxDirection || "vertical";
    const start = parseFloat(trigger.dataset.parallaxStart) || -60;
    const end = parseFloat(trigger.dataset.parallaxEnd) || 60;
    const scrub = parseFloat(trigger.dataset.parallaxScrub) || 1;
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
// SIDE NAV WIPE EFFECT
// ==========================================================

function initSideNavWipeEffect() {
  const navWrap = document.querySelector("[data-sidenav-wrap]");
  if (!navWrap) return;

  if (navWrap._sideNavDestroy) {
    navWrap._sideNavDestroy();
    navWrap._sideNavDestroy = null;
  }

  const overlay        = navWrap.querySelector("[data-sidenav-overlay]");
  const menu           = navWrap.querySelector("[data-sidenav-menu]");
  const bgPanels       = navWrap.querySelectorAll("[data-sidenav-panel]");
  const menuToggles    = document.querySelectorAll("[data-sidenav-toggle]");
  const menuLinks      = navWrap.querySelectorAll("[data-sidenav-link]");
  const fadeTargets    = navWrap.querySelectorAll("[data-sidenav-fade]");
  const menuButton     = document.querySelector("[data-sidenav-button]");
  const menuButtonTexts = menuButton ? menuButton.querySelectorAll("[data-sidenav-label]") : [];
  const menuButtonIcon  = menuButton ? menuButton.querySelector("[data-sidenav-icon]") : null;

  const tl = gsap.timeline();

  const openNav = () => {
    navWrap.setAttribute("data-nav-state", "open");
    lockScroll();
    tl.clear()
      .set(navWrap, { display: "block" })
      .set(menu, { xPercent: 0 }, "<")
      .fromTo(menuButtonTexts, { yPercent: 0 }, { yPercent: -100, stagger: 0.2 })
      .fromTo(menuButtonIcon, { rotate: 0 }, { rotate: 315 }, "<")
      .fromTo(overlay, { autoAlpha: 0 }, { autoAlpha: 1 }, "<")
      .fromTo(bgPanels, { xPercent: 101 }, { xPercent: 0, stagger: 0.12, duration: 0.575 }, "<")
      .fromTo(menuLinks, { yPercent: 140, rotate: 10 }, { yPercent: 0, rotate: 0, stagger: 0.05 }, "<+=0.35")
      .fromTo(fadeTargets, { autoAlpha: 0, yPercent: 50 }, { autoAlpha: 1, yPercent: 0, stagger: 0.04 }, "<+=0.2");
  };

  const closeNav = () => {
    navWrap.setAttribute("data-nav-state", "closed");
    unlockScroll();
    tl.clear()
      .to(overlay, { autoAlpha: 0 })
      .to(menu, { xPercent: 120 }, "<")
      .to(menuButtonTexts, { yPercent: 0 }, "<")
      .to(menuButtonIcon, { rotate: 0 }, "<")
      .set(navWrap, { display: "none" });
  };

  const handleToggleClick = () => {
    const state = navWrap.getAttribute("data-nav-state");
    if (state === "open") closeNav();
    else openNav();
  };

  const handleKeydown = (e) => {
    if (e.key === "Escape" && navWrap.getAttribute("data-nav-state") === "open") closeNav();
  };

  menuToggles.forEach((toggle) => toggle.addEventListener("click", handleToggleClick));
  document.addEventListener("keydown", handleKeydown);

  navWrap._sideNavDestroy = () => {
    menuToggles.forEach((toggle) => toggle.removeEventListener("click", handleToggleClick));
    document.removeEventListener("keydown", handleKeydown);
    tl.kill();
  };
}

// ==========================================================
// PROGRESS NAVIGATION
// ==========================================================

function initProgressNavigation() {
  const navProgress = document.querySelector("[data-progress-nav-list]");
  if (!navProgress) return;

  if (navProgress._progressNavDestroy) {
    navProgress._progressNavDestroy();
    navProgress._progressNavDestroy = null;
  }

  let indicator = navProgress.querySelector(".progress-nav__indicator");
  if (!indicator) {
    indicator = document.createElement("div");
    indicator.className = "progress-nav__indicator";
    navProgress.appendChild(indicator);
  }

  function updateIndicator(activeLink) {
    const parentRect = navProgress.getBoundingClientRect();
    const linkRect = activeLink.getBoundingClientRect();
    const pw = navProgress.offsetWidth;
    const ph = navProgress.offsetHeight;

    indicator.style.left   = ((linkRect.left - parentRect.left) / pw) * 100 + "%";
    indicator.style.top    = ((linkRect.top  - parentRect.top)  / ph) * 100 + "%";
    indicator.style.width  = (activeLink.offsetWidth  / pw) * 100 + "%";
    indicator.style.height = (activeLink.offsetHeight / ph) * 100 + "%";
  }

  const triggers = [];

  gsap.utils.toArray("[data-progress-nav-anchor]").forEach((anchor) => {
    const anchorID = anchor.getAttribute("id");

    function setActive() {
      const activeLink = navProgress.querySelector('[data-progress-nav-target="#' + anchorID + '"]');
      if (!activeLink) return;
      navProgress.querySelectorAll("[data-progress-nav-target]").forEach((sib) => {
        sib.classList.toggle("is--active", sib === activeLink);
      });
      updateIndicator(activeLink);
    }

    triggers.push(
      ScrollTrigger.create({
        trigger: anchor,
        start: "0% 50%",
        end: "100% 50%",
        onEnter: setActive,
        onEnterBack: setActive,
      })
    );
  });

  navProgress._progressNavDestroy = () => triggers.forEach((st) => st.kill());
}

// ==========================================================
// INIT ALL
// ==========================================================

function initAll() {
  initNavEntrance();
  initNavHideOnScroll();
  initHeadingReveal();
  initGlobalParallax();
  initMarqueeScrollDirection();
  initAccordionCSS();
  initBtnHover();
  initSideNavWipeEffect();
  initProgressNavigation();
}

// ==========================================================
// BOOT
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
  initLenis();

  const preloaderTl = initPreloader();
  if (preloaderTl) {
    preloaderTl.eventCallback("onComplete", () => {
      initAll();
      if (hasScrollTrigger) ScrollTrigger.refresh();
    });
  } else {
    initAll();
    if (hasScrollTrigger) ScrollTrigger.refresh();
  }
});
