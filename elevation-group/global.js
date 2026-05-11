// ==========================================================
// ELEVATION GROUP — GLOBAL JS
// Stack: GSAP, ScrollTrigger, SplitText, Lenis
// ==========================================================

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, Observer, InertiaPlugin, Draggable);

// ==========================================================
// GLOBAL STATE
// ==========================================================

let lenis = null;

const hasLenis = typeof window.Lenis !== "undefined";
const hasScrollTrigger = typeof window.ScrollTrigger !== "undefined";

const rmMQ = window.matchMedia("(prefers-reduced-motion: reduce)");
let reducedMotion = rmMQ.matches;
rmMQ.addEventListener?.("change", (e) => (reducedMotion = e.matches));
rmMQ.addListener?.((e) => (reducedMotion = e.matches));

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
// PRELOADER
// ==========================================================

function initPreloader() {
  const preloader = document.querySelector('.preloader');
  if (!preloader) return null;

  const iconHolder = preloader.querySelector('.logo_icon_holder');
  const words      = gsap.utils.toArray('.h3', preloader);
  const iconWidth  = iconHolder ? iconHolder.offsetWidth : 0;

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

  if (words.length) tl.set(words,     { autoAlpha: 0, yPercent: 15 }, 0);
  if (iconHolder)   tl.set(iconHolder, { width: 0, overflow: 'hidden' }, 0);

  if (words.length) {
    tl.to(words, {
      autoAlpha: 1,
      yPercent: 0,
      duration: 0.7,
      ease: 'expo.out',
      stagger: 0.12,
    }, 0.15);
  }

  if (iconHolder && iconWidth) {
    tl.to(iconHolder, {
      width: iconWidth,
      duration: 0.85,
      ease: 'osmo',
    }, 0.35);
  }

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

  tl.to(preloader, {
    yPercent: -100,
    duration: 1,
    ease: 'osmo',
  }, '>-0.15');

  return tl;
}

// ==========================================================
// NAV ENTRANCE
// ==========================================================

function initNavEntrance() {
  const nav = document.querySelector('.nav_items');
  if (!nav) return;

  gsap.fromTo(nav,
    { autoAlpha: 0, y: -16 },
    { autoAlpha: 1, y: 0, duration: 0.8, ease: 'expo.out', delay: 0.2 }
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

  const hero = document.querySelector('.hero');
  if (!hero) return;

  const nav        = document.querySelector('.nav_items_wrapper');
  const navBarWrap = document.querySelector('.nav_bar_wrap');
  const fadeBg     = document.querySelector('.fade_bg');

  const hasBorder      = document.body.dataset?.navBorder === 'true';
  const navBorderColor = hasBorder ? 'rgba(112, 112, 112, 0.25)' : null;

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
        if (hasBorder && navBarWrap) gsap.set(navBarWrap, { clearProps: 'borderBottomColor' });
      };
    }
  );

  navHideMMCleanup = () => localMM.revert();
}

// ==========================================================
// HEADING REVEAL
// ==========================================================

function initHeadingReveal() {
  const headings = gsap.utils.toArray("h1, h2, h3, h4").filter(el =>
    !el.hasAttribute('data-odometer-element') &&
    !el.hasAttribute('data-no-reveal') &&
    !el.closest('[data-groeipad-grid]')
  );
  if (!headings.length) return;

  headings.forEach((el) => {
    if (el._headingRevealDestroy) {
      el._headingRevealDestroy();
      el._headingRevealDestroy = null;
    }
  });

  // Direct verbergen zodat er geen flash is voor fonts geladen zijn
  gsap.set(headings, { autoAlpha: 0 });

  document.fonts.ready.then(() => {
    // Lock each heading's rendered width before SplitText adds block children,
    // otherwise flex-item sizing shifts the heading horizontally.
    headings.forEach(el => { el.style.width = '100%'; });

    const splits = headings.map((el) =>
      SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true })
    );

    headings.forEach((el, i) => {
      const lines = splits[i].lines;
      const masks = lines.map((line) => line.parentElement);

      masks.forEach(m => { m.style.paddingTop = '0.12em'; m.style.marginTop = '-0.12em'; });

      gsap.set(el, { autoAlpha: 1 });
      gsap.set(lines, { yPercent: 110 });

      const inViewport = el.getBoundingClientRect().top < window.innerHeight;

      gsap.to(lines, {
        yPercent: 0,
        duration: 1.8,
        ease: "power4.out",
        stagger: { amount: 0.3 },
        onComplete: () => {
          try { splits[i].revert(); } catch(_) {}
        },
        ...(inViewport ? {} : {
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
        try { splits[i].revert(); } catch(_) {}
      };
    });

    ScrollTrigger.refresh();
  });
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

  const triggers = gsap.utils.toArray('[data-parallax="trigger"]');
  if (!triggers.length) return;

  const localMM = gsap.matchMedia();

  localMM.add(
    {
      isMobile:          "(max-width:479px)",
      isMobileLandscape: "(max-width:767px)",
      isTablet:          "(max-width:991px)",
      isDesktop:         "(min-width:992px)",
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

          const target        = trigger.querySelector('[data-parallax="target"]') || trigger;
          const direction     = trigger.getAttribute("data-parallax-direction") || "vertical";
          const prop          = direction === "horizontal" ? "xPercent" : "yPercent";
          const scrubAttr     = trigger.getAttribute("data-parallax-scrub");
          const scrub         = scrubAttr ? parseFloat(scrubAttr) : true;
          const startVal      = trigger.getAttribute("data-parallax-start") !== null ? parseFloat(trigger.getAttribute("data-parallax-start")) : 20;
          const endVal        = trigger.getAttribute("data-parallax-end")   !== null ? parseFloat(trigger.getAttribute("data-parallax-end"))   : -20;
          const scrollStartRaw = trigger.getAttribute("data-parallax-scroll-start") || "top bottom";
          const scrollEndRaw   = trigger.getAttribute("data-parallax-scroll-end")   || "bottom top";

          gsap.fromTo(
            target,
            { [prop]: startVal },
            {
              [prop]: endVal,
              ease: "none",
              scrollTrigger: {
                trigger,
                start: `clamp(${scrollStartRaw})`,
                end:   `clamp(${scrollEndRaw})`,
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
  const wrappers = gsap.utils.toArray('[data-sticky-feature-wrap]');
  if (!wrappers.length) return;

  if (!window.matchMedia('(min-width: 992px)').matches) {
    wrappers.forEach((w) => {
      gsap.set(w.querySelectorAll('[data-sticky-feature-visual-wrap]'), { clearProps: 'clipPath' });
      gsap.set(w.querySelectorAll('[data-sticky-feature-item]'),        { clearProps: 'opacity,visibility' });
      gsap.set(w.querySelectorAll('[data-sticky-feature-text]'),        { clearProps: 'opacity,visibility,transform' });
    });
    return;
  }

  wrappers.forEach((w) => {
    if (w._stickyFeaturesDestroy) {
      w._stickyFeaturesDestroy();
      w._stickyFeaturesDestroy = null;
    }

    const visualWraps = Array.from(w.querySelectorAll('[data-sticky-feature-visual-wrap]'));
    const items       = Array.from(w.querySelectorAll('[data-sticky-feature-item]'));
    const progressBar = w.querySelector('[data-sticky-feature-progress]');

    const count = Math.min(visualWraps.length, items.length);
    if (count < 1) return;

    const DURATION      = reducedMotion ? 0.01 : 0.75;
    const EASE          = 'power4.inOut';
    const SCROLL_AMOUNT = 0.5;

    const getTexts = (el) => Array.from(el.querySelectorAll('[data-sticky-feature-text]'));

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
        tl.to(visualWraps[toIndex],   { clipPath: 'inset(0% round 0.75em)',  duration: DURATION, ease: EASE }, 0);
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
// MARQUEE SCROLL DIRECTION
// ==========================================================

function initMarqueeScrollDirection() {
  gsap.utils.toArray('[data-marquee-scroll-direction-target]').forEach((marquee) => {
    const marqueeContent = marquee.querySelector('[data-marquee-collection-target]');
    const marqueeScroll  = marquee.querySelector('[data-marquee-scroll-target]');
    if (!marqueeContent || !marqueeScroll) return;

    const { marqueeSpeed: speed, marqueeDirection: direction, marqueeDuplicate: duplicate, marqueeScrollSpeed: scrollSpeed } = marquee.dataset;

    const marqueeSpeedAttr     = parseFloat(speed);
    const marqueeDirectionAttr = direction === 'right' ? 1 : -1;
    const duplicateAmount      = parseInt(duplicate || 0);
    const scrollSpeedAttr      = parseFloat(scrollSpeed);
    const speedMultiplier      = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;

    const marqueeSpeed = marqueeSpeedAttr * (marqueeContent.offsetWidth / window.innerWidth) * speedMultiplier;

    marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
    marqueeScroll.style.width      = `${(scrollSpeedAttr * 2) + 100}%`;

    if (duplicateAmount > 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < duplicateAmount; i++) {
        fragment.appendChild(marqueeContent.cloneNode(true));
      }
      marqueeScroll.appendChild(fragment);
    }

    const marqueeItems = marquee.querySelectorAll('[data-marquee-collection-target]');
    const animation = gsap.to(marqueeItems, {
      xPercent: -100,
      repeat: -1,
      duration: marqueeSpeed,
      ease: 'linear',
    }).totalProgress(0.5);

    gsap.set(marqueeItems, { xPercent: marqueeDirectionAttr === 1 ? 100 : -100 });
    animation.timeScale(marqueeDirectionAttr);
    animation.play();

    marquee.setAttribute('data-marquee-status', 'normal');
    gsap.to(marquee, { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.2 });

    ScrollTrigger.create({
      trigger: marquee,
      start: 'top bottom',
      end: 'bottom top',
      onUpdate: (self) => {
        const currentDirection = self.direction === 1 ? -marqueeDirectionAttr : marqueeDirectionAttr;
        animation.timeScale(currentDirection);
        marquee.setAttribute('data-marquee-status', self.direction === 1 ? 'normal' : 'inverted');
      },
    });

    const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
    gsap.timeline({
      scrollTrigger: {
        trigger: marquee,
        start: '0% 100%',
        end: '100% 0%',
        scrub: 0,
      },
    }).fromTo(marqueeScroll, { x: `${scrollStart}vw` }, { x: `${-scrollStart}vw`, ease: 'none' });
  });
}

// ==========================================================
// DRAGGABLE MARQUEE
// ==========================================================

function initDraggableMarquee() {
  const wrappers = gsap.utils.toArray('[data-draggable-marquee-init]');
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
          .to(timeScale, { value: restingDirection,  duration: 1.0 });
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

    gsap.to(wrapper, { opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.2 });
  });
}

// ==========================================================
// ACCORDION CSS
// ==========================================================

function initAccordionCSS() {
  gsap.utils.toArray('[data-accordion-css-init]').forEach((accordion) => {
    if (accordion._accordionDestroy) {
      accordion._accordionDestroy();
      accordion._accordionDestroy = null;
    }

    const closeSiblings = accordion.getAttribute('data-accordion-close-siblings') === 'true';

    function onAccordionClick(event) {
      const toggle = event.target.closest('[data-accordion-toggle]');
      if (!toggle) return;

      const singleAccordion = toggle.closest('[data-accordion-status]');
      if (!singleAccordion) return;

      const isActive = singleAccordion.getAttribute('data-accordion-status') === 'active';
      singleAccordion.setAttribute('data-accordion-status', isActive ? 'not-active' : 'active');

      if (closeSiblings && !isActive) {
        accordion.querySelectorAll('[data-accordion-status="active"]').forEach((sibling) => {
          if (sibling !== singleAccordion) sibling.setAttribute('data-accordion-status', 'not-active');
        });
      }
    }

    accordion.addEventListener('click', onAccordionClick);
    accordion._accordionDestroy = () => accordion.removeEventListener('click', onAccordionClick);
  });
}

// ==========================================================
// NAV BORDER SCROLL
// ==========================================================

function initNavBorderScroll() {
  const hero   = document.querySelector('[data-nav-border-hero]');
  const navBar = document.querySelector('.nav_bar_wrap');
  if (!hero || !navBar) return;

  if (navBar._navBorderST) {
    navBar._navBorderST.kill();
    navBar._navBorderST = null;
  }

  const hasBorder = document.body.dataset?.navBorder === 'true';
  if (!hasBorder) return;

  navBar._navBorderST = ScrollTrigger.create({
    trigger: hero,
    start: 'bottom top',
    onLeave:      () => navBar.classList.remove('has-border'),
    onEnterBack:  () => navBar.classList.add('has-border'),
  });
}

// ==========================================================
// NAV BUTTON COLOR ON SCROLL
// ==========================================================

function initNavBtnColorOnScroll() {
  const btn = document.querySelector('[data-nav-btn-color-target]:not([data-nav-btn-color-target="false"])');
  if (!btn) return;

  if (btn._navBtnColorDestroy) {
    btn._navBtnColorDestroy();
    btn._navBtnColorDestroy = null;
  }

  const sections = gsap.utils.toArray('[data-nav-btn-color]');
  if (!sections.length) return;

  const navH    = document.querySelector('.nav_bar_wrap')?.offsetHeight || 64;
  const targets = gsap.utils.toArray('*', btn);
  const active  = new Set();

  function applyColor() {
    if (active.size > 0) {
      const color = [...active].at(-1).dataset.navBtnColor;
      gsap.to(targets, { color, duration: 0.5, ease: 'power3.out', overwrite: 'auto' });
    } else {
      gsap.to(targets, { duration: 0.5, ease: 'power3.out', overwrite: 'auto',
        onComplete: () => gsap.set(targets, { clearProps: 'color' }) });
    }
  }

  const triggers = sections.map(section =>
    ScrollTrigger.create({
      trigger: section,
      start: `top ${navH}px`,
      end:   `bottom ${navH}px`,
      onEnter:     () => { active.add(section);    applyColor(); },
      onLeave:     () => { active.delete(section); applyColor(); },
      onEnterBack: () => { active.add(section);    applyColor(); },
      onLeaveBack: () => { active.delete(section); applyColor(); },
    })
  );

  btn._navBtnColorDestroy = () => {
    triggers.forEach(t => t.kill());
    active.clear();
    gsap.killTweensOf(targets);
    gsap.set(targets, { clearProps: 'color' });
  };
}

// ==========================================================
// NAV LOGO NUDGE
// ==========================================================

function initNavLogoNudge() {
  const logo = document.querySelector('.nav_items.center .normal_img');
  if (!logo) return;

  gsap.timeline({ repeat: -1, repeatDelay: 3.5 })
    .to(logo, { y: -7, duration: 0.35, ease: 'power3.out' })
    .to(logo, { y: 0,  duration: 0.8,  ease: 'elastic.out(1.3, 0.4)' });
}

// ==========================================================
// STRIPED BUTTON UNDERLINE ANIMATION
// ==========================================================

function initStripedButtons() {
  const btns = gsap.utils.toArray('[data-wf--button--variant="striped"]');
  if (!btns.length) return;

  btns.forEach(function(btn) {
    if (btn._stripedDestroy) { btn._stripedDestroy(); btn._stripedDestroy = null; }

    btn.style.borderBottom = 'none';
    btn.style.position     = 'relative';

    var line = btn.querySelector('.btn-underline');
    if (!line) {
      line = document.createElement('span');
      line.className  = 'btn-underline';
      line.style.cssText = 'position:absolute;bottom:0;left:0;width:100%;height:1px;background:currentColor;pointer-events:none;';
      btn.appendChild(line);
    }

    gsap.set(line, { clipPath: 'inset(0 100% 0 0%)' });

    var lineTl      = null;
    var lineVisible = false;

    function playExitAndDrawIn() {
      return gsap.timeline({ onComplete: function() { lineVisible = true; } })
        .to(line,  { clipPath: 'inset(0 0% 0 100%)', duration: 0.35, ease: 'power3.in' })
        .set(line, { clipPath: 'inset(0 100% 0 0%)' })
        .to(line,  { clipPath: 'inset(0 0% 0 0%)',   duration: 0.5,  ease: 'power3.out' });
    }

    function onEnter() {
      if (lineTl) { lineTl.kill(); lineTl = null; }
      var wasVisible = lineVisible;
      lineVisible = false;

      if (wasVisible) {
        lineTl = playExitAndDrawIn();
      } else {
        lineTl = gsap.timeline({ onComplete: function() { lineVisible = true; } })
          .set(line, { clipPath: 'inset(0 100% 0 0%)' })
          .to(line,  { clipPath: 'inset(0 0% 0 0%)',   duration: 0.5, ease: 'power3.out' });
      }
    }

    function onLeave() {
      if (lineTl) { lineTl.kill(); lineTl = null; }
      lineVisible = false;
      lineTl = gsap.to(line, { clipPath: 'inset(0 0% 0 100%)', duration: 0.35, ease: 'power3.in' });
    }

    btn.addEventListener('mouseenter', onEnter);
    btn.addEventListener('mouseleave', onLeave);

    btn._stripedDestroy = function() {
      btn.removeEventListener('mouseenter', onEnter);
      btn.removeEventListener('mouseleave', onLeave);
      if (lineTl) { lineTl.kill(); lineTl = null; }
      gsap.set(line, { clearProps: 'clipPath' });
      btn.style.borderBottom = '';
      btn.style.position     = '';
    };
  });
}

// ==========================================================
// ADVANCED FORM VALIDATION
// ==========================================================

function initAdvancedFormValidation() {
  const forms = gsap.utils.toArray('[data-form-validate]');
  if (!forms.length) return;

  forms.forEach(form => {
    form.querySelectorAll('input, textarea, select').forEach(el => {
      el.style.backgroundColor = 'transparent';
    });
  });

  forms.forEach((formContainer) => {
    const startTime = new Date().getTime();

    const form = formContainer.querySelector('form');
    if (!form) return;

    const validateFields  = form.querySelectorAll('[data-validate]');
    const dataSubmit      = form.querySelector('[data-submit]');
    if (!dataSubmit) return;

    const realSubmitInput = dataSubmit.querySelector('input[type="submit"]');
    if (!realSubmitInput) return;

    if (formContainer._formValidateDestroy) {
      formContainer._formValidateDestroy();
      formContainer._formValidateDestroy = null;
    }

    function isSpam() {
      return new Date().getTime() - startTime < 5000;
    }

    validateFields.forEach(function(fieldGroup) {
      const select = fieldGroup.querySelector('select');
      if (!select) return;
      select.querySelectorAll('option').forEach(function(option) {
        if (['', 'disabled', 'null', 'false'].includes(option.value)) {
          option.setAttribute('disabled', 'disabled');
        }
      });
    });

    function isValid(fieldGroup) {
      const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
      if (radioCheckGroup) {
        const inputs       = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        const checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;
        const min          = parseInt(radioCheckGroup.getAttribute('min')) || 1;
        const max          = parseInt(radioCheckGroup.getAttribute('max')) || inputs.length;
        if (inputs[0] && inputs[0].type === 'radio') return checkedCount >= 1;
        if (inputs.length === 1) return inputs[0].checked;
        return checkedCount >= min && checkedCount <= max;
      }

      const input = fieldGroup.querySelector('input, textarea, select');
      if (!input) return false;

      const value  = input.value.trim();
      const length = value.length;

      if (input.tagName.toLowerCase() === 'select') {
        return !['', 'disabled', 'null', 'false'].includes(value);
      } else if (input.type === 'email') {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      } else {
        const min = parseInt(input.getAttribute('min')) || 0;
        const max = parseInt(input.getAttribute('max')) || Infinity;
        if (input.hasAttribute('min') && length < min) return false;
        if (input.hasAttribute('max') && length > max) return false;
        return true;
      }
    }

    function updateFieldStatus(fieldGroup) {
      const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
      if (radioCheckGroup) {
        const inputs       = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        const checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;
        fieldGroup.classList.toggle('is--filled', checkedCount > 0);
        const valid = isValid(fieldGroup);
        if (valid) {
          fieldGroup.classList.add('is--success');
          fieldGroup.classList.remove('is--error');
        } else {
          fieldGroup.classList.remove('is--success');
          const anyStarted = Array.from(inputs).some(i => i.__validationStarted);
          fieldGroup.classList.toggle('is--error', anyStarted);
        }
      } else {
        const input = fieldGroup.querySelector('input, textarea, select');
        if (!input) return;
        fieldGroup.classList.toggle('is--filled', !!input.value.trim());
        const valid = isValid(fieldGroup);
        if (valid) {
          fieldGroup.classList.add('is--success');
          fieldGroup.classList.remove('is--error');
        } else {
          fieldGroup.classList.remove('is--success');
          fieldGroup.classList.toggle('is--error', !!input.__validationStarted);
        }
      }
    }

    function validateAll() {
      let allValid    = true;
      let firstInvalid = null;

      validateFields.forEach(function(fieldGroup) {
        const input          = fieldGroup.querySelector('input, textarea, select');
        const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');
        if (!input && !radioCheckGroup) return;

        if (input) input.__validationStarted = true;
        if (radioCheckGroup) {
          radioCheckGroup.__validationStarted = true;
          radioCheckGroup.querySelectorAll('input').forEach(i => { i.__validationStarted = true; });
        }

        updateFieldStatus(fieldGroup);

        if (!isValid(fieldGroup)) {
          allValid = false;
          if (!firstInvalid) firstInvalid = input || radioCheckGroup.querySelector('input');
        }
      });

      if (!allValid && firstInvalid) firstInvalid.focus();
      return allValid;
    }

    const successEl = formContainer.querySelector('.w-form-done');
    const errorEl   = formContainer.querySelector('.w-form-fail');

    async function onSubmit() {
      if (!validateAll()) return;
      if (isSpam()) { alert('Form submitted too quickly. Please try again.'); return; }

      const siteId   = document.documentElement.getAttribute('data-wf-site');
      const formName = form.getAttribute('data-name') || form.getAttribute('name') || '';
      const fields   = {};
      new FormData(form).forEach((value, key) => { fields[key] = value; });

      try {
        const res = await fetch(`https://webflow.com/api/v1/form/${siteId}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ name: formName, source: window.location.href, test: false, fields, dolphin: false }),
        });

        if (res.ok) {
          form.style.display = 'none';
          if (successEl) successEl.style.display = 'block';
        } else {
          if (errorEl) errorEl.style.display = 'block';
        }
      } catch (e) {
        if (errorEl) errorEl.style.display = 'block';
      }
    }

    validateFields.forEach(function(fieldGroup) {
      const input           = fieldGroup.querySelector('input, textarea, select');
      const radioCheckGroup = fieldGroup.querySelector('[data-radiocheck-group]');

      if (radioCheckGroup) {
        const inputs = radioCheckGroup.querySelectorAll('input[type="radio"], input[type="checkbox"]');
        inputs.forEach(function(inp) {
          inp.__validationStarted = false;
          inp.addEventListener('change', function() {
            requestAnimationFrame(function() {
              if (!inp.__validationStarted) {
                const checkedCount = radioCheckGroup.querySelectorAll('input:checked').length;
                const min = parseInt(radioCheckGroup.getAttribute('min')) || 1;
                if (checkedCount >= min) inp.__validationStarted = true;
              }
              if (inp.__validationStarted) updateFieldStatus(fieldGroup);
            });
          });
          inp.addEventListener('blur', function() {
            inp.__validationStarted = true;
            updateFieldStatus(fieldGroup);
          });
        });
      } else if (input) {
        input.__validationStarted = false;
        if (input.tagName.toLowerCase() === 'select') {
          input.addEventListener('change', function() {
            input.__validationStarted = true;
            updateFieldStatus(fieldGroup);
          });
        } else {
          input.addEventListener('input', function() {
            if (!input.__validationStarted) {
              const value  = input.value.trim();
              const length = value.length;
              const min    = parseInt(input.getAttribute('min')) || 0;
              const max    = parseInt(input.getAttribute('max')) || Infinity;
              if (input.type === 'email') {
                if (isValid(fieldGroup)) input.__validationStarted = true;
              } else if (
                (input.hasAttribute('min') && length >= min) ||
                (input.hasAttribute('max') && length <= max)
              ) {
                input.__validationStarted = true;
              }
            }
            if (input.__validationStarted) updateFieldStatus(fieldGroup);
          });
          input.addEventListener('blur', function() {
            input.__validationStarted = true;
            updateFieldStatus(fieldGroup);
          });
        }
      }
    });

    dataSubmit.addEventListener('click', onSubmit);
    form.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        onSubmit();
      }
    });

    formContainer._formValidateDestroy = function() {
      dataSubmit.removeEventListener('click', onSubmit);
    };
  });
}

// ==========================================================
// HERO GRADIENT ANIMATION
// ==========================================================

function initHeroGradient() {
  const bg1 = document.querySelector('.background_gradient:not(.reversed)');
  const bg2 = document.querySelector('.background_gradient.reversed');
  if (!bg1 && !bg2) return;

  if (bg1) {
    gsap.to(bg1, {
      x: '15vw',
      duration: 3,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  }

  if (bg2) {
    gsap.to(bg2, {
      x: '-15vw',
      opacity: 0.25,
      duration: 2.5,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
      delay: 1,
    });
  }
}

// ==========================================================
// NUMBER ODOMETER
// ==========================================================

let updateOdometer = null;

function initNumberOdometer() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const initFlag = 'data-odometer-initialized';
  const activeTweens = new WeakMap();

  const defaults = {
    duration: 1,
    ease: 'power3.out',
    elementStagger: 0.1,
    digitStagger: 0.04,
    revealDuration: 0.5,
    revealEase: 'power2.out',
    triggerStart: 'top 80%',
    staggerOrder: 'left',
    digitCycles: 2,
  };

  document.querySelectorAll('[data-odometer-group]').forEach(group => {
    if (group.hasAttribute(initFlag)) return;
    group.setAttribute(initFlag, '');

    const elements = Array.from(group.querySelectorAll('[data-odometer-element]'));
    if (!elements.length || prefersReducedMotion) return;

    const staggerOrder  = group.getAttribute('data-odometer-stagger-order') || defaults.staggerOrder;
    const triggerStart  = group.getAttribute('data-odometer-trigger-start') || defaults.triggerStart;
    const elementStagger = parseFloat(group.getAttribute('data-odometer-stagger')) || defaults.elementStagger;

    const elementData = elements.map(el => {
      const originalText    = el.textContent.trim();
      const hasExplicitStart = el.hasAttribute('data-odometer-start');
      const startValue      = parseFloat(el.getAttribute('data-odometer-start')) || 0;
      const duration        = parseFloat(el.getAttribute('data-odometer-duration')) || defaults.duration;
      const step            = getLineHeightRatio(el);

      let segments = parseSegments(originalText);
      segments = mapStartDigits(segments, startValue);
      segments = markHiddenSegments(segments, startValue);

      const grow = shouldGrow(el, hasExplicitStart, startValue, segments);
      const { rollers, revealEls } = buildRollerDOM(el, segments, step, grow);

      const fontSize   = parseFloat(getComputedStyle(el).fontSize);
      const revealData = revealEls.map(revealEl => {
        const widthEm = revealEl.offsetWidth / fontSize;
        gsap.set(revealEl, { width: 0, overflow: 'hidden' });
        return { el: revealEl, widthEm };
      });

      return { el, rollers, duration, step, revealData, originalText };
    });

    const ordered = applyStaggerOrder(elementData, staggerOrder);

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: group,
        start: triggerStart,
        once: true,
      },
      onComplete() {
        elementData.forEach(({ el, originalText }) => {
          cleanupElement(el, originalText);
        });
      },
    });

    ordered.forEach((data, orderIdx) => {
      const { rollers, duration, step, revealData } = data;
      const offset = orderIdx * elementStagger;

      revealData.forEach(({ el, widthEm }) => {
        tl.to(el, {
          width: widthEm + 'em',
          opacity: 1,
          duration: defaults.revealDuration,
          ease: defaults.revealEase,
        }, offset);
      });

      rollers.forEach(({ roller, targetPos }, digitIdx) => {
        const reversedIdx = rollers.length - 1 - digitIdx;
        tl.to(roller, {
          y: -targetPos * step + 'em',
          duration,
          ease: defaults.ease,
          force3D: true,
        }, offset + reversedIdx * defaults.digitStagger);
      });
    });
  });

  return function updateOdometerFn(el, newText, options = {}) {
    const currentText = el.textContent.trim();
    if (currentText === newText) return;

    const duration = options.duration || defaults.duration;
    const ease     = options.ease     || defaults.ease;
    const step     = getLineHeightRatio(el);

    const existing = activeTweens.get(el);
    if (existing) {
      existing.kill();
      gsap.set(el, { clearProps: 'width,overflow' });
    }

    const fontSize   = parseFloat(getComputedStyle(el).fontSize);
    const oldWidthEm = el.getBoundingClientRect().width / fontSize;

    const startSegments  = parseSegments(currentText);
    const startDigitsStr = startSegments.filter(s => s.type === 'digit').map(s => s.char).join('');
    const startValue     = parseInt(startDigitsStr, 10) || 0;

    // Measure natural width of each target digit before clearing DOM
    const cs = getComputedStyle(el);
    const measurer = document.createElement('span');
    measurer.style.cssText = `position:absolute;visibility:hidden;white-space:nowrap;font-size:${cs.fontSize};font-family:${cs.fontFamily};font-weight:${cs.fontWeight};letter-spacing:${cs.letterSpacing};`;
    document.body.appendChild(measurer);
    const targetDigitWidths = [...newText].filter(c => /\d/.test(c)).map(c => {
      measurer.textContent = c;
      return measurer.getBoundingClientRect().width;
    });
    document.body.removeChild(measurer);

    let segments = parseSegments(newText);
    segments = mapStartDigits(segments, startValue);
    segments = markHiddenSegments(segments, startValue);
    const { rollers, revealEls } = buildRollerDOM(el, segments, step, true);

    // Pin each mask to its target digit's natural width
    Array.from(el.querySelectorAll('[data-odometer-part="mask"]')).forEach((mask, i) => {
      if (targetDigitWidths[i] != null) mask.style.width = targetDigitWidths[i] + 'px';
    });

    const newWidthEm    = el.getBoundingClientRect().width / fontSize;
    const widthChanged  = Math.abs(oldWidthEm - newWidthEm) > 0.01;

    if (widthChanged) gsap.set(el, { width: oldWidthEm + 'em', overflow: 'hidden' });

    const tl = gsap.timeline({
      onComplete() {
        cleanupElement(el, newText);
        activeTweens.delete(el);
      },
    });
    activeTweens.set(el, tl);

    if (widthChanged) {
      tl.to(el, { width: newWidthEm + 'em', duration: defaults.revealDuration, ease: defaults.revealEase }, 0);
    }

    revealEls.forEach(revealEl => {
      if (revealEl.getAttribute('data-odometer-part') === 'static') {
        tl.to(revealEl, { opacity: 1, duration: 0.2 }, 0);
      }
    });

    rollers.forEach(({ roller, targetPos }, digitIdx) => {
      const reversedIdx = rollers.length - 1 - digitIdx;
      tl.to(roller, {
        y: -targetPos * step + 'em',
        duration,
        ease,
        force3D: true,
      }, reversedIdx * defaults.digitStagger);
    });
  };

  function getLineHeightRatio(el) {
    const cs = getComputedStyle(el);
    const lh = cs.lineHeight;
    if (lh === 'normal') return 1.2;
    return parseFloat(lh) / parseFloat(cs.fontSize);
  }

  function parseSegments(text) {
    return [...text].map(char => ({
      type: /\d/.test(char) ? 'digit' : 'static',
      char,
    }));
  }

  function mapStartDigits(segments, startValue) {
    const digitSlots = segments.filter(s => s.type === 'digit');
    const padded = String(Math.floor(Math.abs(startValue)))
      .padStart(digitSlots.length, '0')
      .slice(-digitSlots.length);
    let di = 0;
    return segments.map(s =>
      s.type === 'digit' ? { ...s, startDigit: parseInt(padded[di++], 10) } : s
    );
  }

  function markHiddenSegments(segments, startValue) {
    const totalDigits   = segments.filter(s => s.type === 'digit').length;
    const absStart      = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const leadingZeros  = Math.max(0, totalDigits - startDigitCount);
    if (leadingZeros === 0) return segments;
    let digitsSeen = 0, firstDigitSeen = false, prevDigitHidden = false;
    return segments.map(seg => {
      if (seg.type === 'digit') {
        firstDigitSeen = true;
        const hidden = digitsSeen < leadingZeros;
        prevDigitHidden = hidden;
        digitsSeen++;
        return { ...seg, hidden };
      }
      const hidden = firstDigitSeen && prevDigitHidden;
      return { ...seg, hidden };
    });
  }

  function shouldGrow(el, hasExplicitStart, startValue, segments) {
    if (el.hasAttribute('data-odometer-grow')) return el.getAttribute('data-odometer-grow') !== 'false';
    if (!hasExplicitStart) return false;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const endDigitCount   = segments.filter(s => s.type === 'digit').length;
    return startDigitCount < endDigitCount;
  }

  function buildRollerDOM(el, segments, step, grow) {
    el.innerHTML = '';
    el.style.height = '';
    el.style.whiteSpace = 'nowrap';
    const rollers = [], revealEls = [];
    const totalCells = 10 * defaults.digitCycles;

    segments.forEach(seg => {
      if (seg.type === 'static') {
        const span = document.createElement('span');
        span.setAttribute('data-odometer-part', 'static');
        span.style.display = 'inline-block';
        span.style.verticalAlign = 'top';
        span.style.height = step + 'em';
        span.style.lineHeight = step;
        span.textContent = seg.char;
        el.appendChild(span);
        if (grow && seg.hidden) { gsap.set(span, { opacity: 0 }); revealEls.push(span); }
        return;
      }
      const mask   = document.createElement('span');
      mask.setAttribute('data-odometer-part', 'mask');
      mask.style.display = 'inline-block';
      mask.style.verticalAlign = 'top';
      mask.style.overflow = 'hidden';
      mask.style.height = step + 'em';
      mask.style.lineHeight = step;
      const roller = document.createElement('span');
      roller.setAttribute('data-odometer-part', 'roller');
      roller.style.display = 'block';
      roller.style.whiteSpace = 'pre';
      roller.style.lineHeight = step;
      const digits = [];
      for (let d = 0; d < totalCells; d++) digits.push(d % 10);
      roller.textContent = digits.join('\n');
      mask.appendChild(roller);
      el.appendChild(mask);
      const startDigit = seg.startDigit || 0;
      const isReveal   = grow && seg.hidden;
      gsap.set(roller, { y: isReveal ? step + 'em' : -startDigit * step + 'em' });
      const endDigit  = parseInt(seg.char, 10);
      const targetPos = endDigit > startDigit ? endDigit : 10 + endDigit;
      rollers.push({ roller, targetPos });
      if (isReveal) revealEls.push(mask);
    });

    return { rollers, revealEls };
  }

  function cleanupElement(el, text) {
    el.innerHTML   = '';
    el.textContent = text;
    el.style.overflow   = '';
    el.style.height     = '';
    el.style.whiteSpace = '';
    el.style.width      = '';
  }

  function recalcOnResize() {
    document.querySelectorAll('[data-odometer-element]').forEach(el => {
      const running = activeTweens.get(el);
      if (running) { running.progress(1); activeTweens.delete(el); }
      const hasRollers = el.querySelector('[data-odometer-part="roller"]');
      if (hasRollers) {
        const step = getLineHeightRatio(el);
        el.querySelectorAll('[data-odometer-part="mask"]').forEach(m => { m.style.height = step + 'em'; m.style.lineHeight = step; });
        el.querySelectorAll('[data-odometer-part="roller"]').forEach(r => { r.style.lineHeight = step; });
        el.querySelectorAll('[data-odometer-part="static"]').forEach(s => { s.style.lineHeight = step; });
      }
    });
    ScrollTrigger.refresh();
  }

  let resizeTimer, lastWidth = window.innerWidth;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth === lastWidth) return;
      lastWidth = window.innerWidth;
      recalcOnResize();
    }, 250);
  });

  function applyStaggerOrder(items, order) {
    const arr = [...items];
    if (order === 'right') return arr.reverse();
    if (order === 'random') return shuffleArray(arr);
    return arr;
  }

  function shuffleArray(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

// ==========================================================
// ODOMETER SLIDER
// ==========================================================

function initOdometerSlider() {
  document.querySelectorAll('[data-odometer-slider]').forEach(slider => {
    const input  = slider.querySelector('[data-odometer-slider-input]');
    const labels = Array.from(slider.querySelectorAll('[data-odometer-slider-label]'));
    if (!input) return;

    const stepCount = Math.max(1, labels.length - 1);
    input.min   = 0;
    input.max   = stepCount;
    input.step  = 1;
    input.value = 0;

    const groupId = slider.getAttribute('data-odometer-slider-group');
    const group   = slider.closest('[data-odometer-group]')
      || (groupId ? document.querySelector(`[data-odometer-group="${groupId}"]`) : null)
      || document.querySelector('[data-odometer-group]');
    let targets = group ? Array.from(group.querySelectorAll('[data-odometer-element]')) : [];
    if (!targets.length) {
      targets = Array.from(document.querySelectorAll('[data-odometer-element][data-odometer-values]'));
    }

    // Kill any CSS transition on the input track so --slider-pct updates are instant
    const noTransId = 'odometer-slider-no-transition';
    if (!document.getElementById(noTransId)) {
      const s = document.createElement('style');
      s.id = noTransId;
      s.textContent = [
        '[data-odometer-slider-input]',
        '[data-odometer-slider-input]::-webkit-slider-runnable-track',
        '[data-odometer-slider-input]::-webkit-slider-thumb',
        '[data-odometer-slider-input]::-moz-range-track',
        '[data-odometer-slider-input]::-moz-range-thumb',
      ].join(',') + '{ transition: none !important; }';
      document.head.appendChild(s);
    }

    function updateFill(step) {
      input.style.setProperty('--slider-pct', `${(step / stepCount) * 100}%`);
    }

    function goToStep(step, animate) {
      input.value = step;
      updateFill(step);
      labels.forEach((l, i) => l.setAttribute('data-active', i === step ? 'true' : 'false'));
      if (animate && typeof updateOdometer === 'function') {
        targets.forEach(el => {
          const values = (el.getAttribute('data-odometer-values') || '').split(',').map(v => v.trim());
          if (values[step]) updateOdometer(el, values[step]);
        });
      }
    }

    function stepFromPointer(e) {
      const rect = slider.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      return Math.round(pct * stepCount);
    }

    let isDragging = false;
    slider.addEventListener('pointerdown', e => {
      isDragging = true;
      slider.setPointerCapture(e.pointerId);
      goToStep(stepFromPointer(e), true);
    });
    slider.addEventListener('pointermove', e => {
      if (!isDragging) return;
      goToStep(stepFromPointer(e), true);
    });
    slider.addEventListener('pointerup',     () => { isDragging = false; });
    slider.addEventListener('pointercancel', () => { isDragging = false; });

    labels.forEach((label, i) => label.addEventListener('click', () => goToStep(i, true)));

    goToStep(0, false);
  });
}

// ==========================================================
// BUTTON CHARACTER STAGGER
// ==========================================================

function initButtonCharacterStagger() {
  const offsetIncrement = 0.01;
  const buttons = document.querySelectorAll('[data-button-animate-chars]');
  if (!buttons.length) return;

  buttons.forEach(button => {
    const text = button.textContent;
    button.innerHTML = '';

    [...text].forEach((char, index) => {
      const span = document.createElement('span');
      span.textContent = char;
      span.style.transitionDelay = `${index * offsetIncrement}s`;

      if (char === ' ') {
        span.style.whiteSpace = 'pre';
      }

      button.appendChild(span);
    });
  });
}

// ==========================================================
// LOGO WALL CYCLE
// ==========================================================

function initLogoWallCycle() {
  const loopDelay = 1.5;
  const duration  = 0.9;

  document.querySelectorAll('[data-logo-wall-cycle-init]').forEach(root => {
    const list = root.querySelector('[data-logo-wall-list]');
    if (!list) return;

    const items = Array.from(list.querySelectorAll('[data-logo-wall-item]'));
    if (!items.length) return;

    const shuffleFront    = root.getAttribute('data-logo-wall-shuffle') !== 'false';
    const originalTargets = items
      .map(item => item.querySelector('[data-logo-wall-target]'))
      .filter(Boolean);

    if (!originalTargets.length) return;

    let visibleItems = [];
    let visibleCount = 0;
    let pool         = [];
    let pattern      = [];
    let patternIndex = 0;
    let tl;

    function isVisible(el) {
      return window.getComputedStyle(el).display !== 'none';
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

      items.forEach(item => {
        item.querySelectorAll('[data-logo-wall-target]').forEach(old => old.remove());
      });

      pool = originalTargets.map(n => n.cloneNode(true));

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
          visibleItems[i].querySelector('[data-logo-wall-target-parent]') ||
          visibleItems[i];
        parent.appendChild(pool.shift());
      }

      // Als pool leeg is (evenveel logo's als slots) hervullen met shuffled clones
      if (!pool.length) {
        pool = shuffleArray(originalTargets.map(n => n.cloneNode(true)));
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
        container.querySelector('[data-logo-wall-target-parent]') ||
        container.querySelector('*:has(> [data-logo-wall-target])') ||
        container;

      const existing = parent.querySelectorAll('[data-logo-wall-target]');
      if (existing.length > 1) return;

      const current  = parent.querySelector('[data-logo-wall-target]');
      const incoming = pool.shift();

      gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
      parent.appendChild(incoming);

      if (current) {
        gsap.to(current, {
          yPercent: -50,
          autoAlpha: 0,
          duration,
          ease: 'expo.inOut',
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
        ease: 'expo.inOut',
      });
    }

    setup();

    ScrollTrigger.create({
      trigger: root,
      start: 'top bottom',
      end: 'bottom top',
      onEnter:     () => tl?.play(),
      onLeave:     () => tl?.pause(),
      onEnterBack: () => tl?.play(),
      onLeaveBack: () => tl?.pause(),
    });

    document.addEventListener('visibilitychange', () =>
      document.hidden ? tl?.pause() : tl?.play()
    );
  });
}

// ==========================================================
// INIT ALL
// ==========================================================

// ==========================================================
// MOMENTUM BASED HOVER (INERTIA)
// ==========================================================

function initMomentumBasedHover() {
  if (!window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;

  const xyMultiplier       = 30;
  const rotationMultiplier = 20;
  const inertiaResistance  = 200;

  const clampXY  = gsap.utils.clamp(-1080, 1080);
  const clampRot = gsap.utils.clamp(-60, 60);

  document.querySelectorAll('[data-momentum-hover-init]').forEach(root => {
    let prevX = 0, prevY = 0;
    let velX  = 0, velY  = 0;
    let rafId = null;

    root.addEventListener('mousemove', e => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        velX = e.clientX - prevX;
        velY = e.clientY - prevY;
        prevX = e.clientX;
        prevY = e.clientY;
        rafId = null;
      });
    });

    function getOriginalRotation(el) {
      const t = getComputedStyle(el).transform;
      if (!t || t === 'none') return 0;
      const m = new DOMMatrix(t);
      return Math.atan2(m.b, m.a) * (180 / Math.PI);
    }

    function applyInertia(target, e, endRotation) {
      const { left, top, width, height } = target.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const offsetX = e.clientX - centerX;
      const offsetY = e.clientY - centerY;

      const rawTorque    = offsetX * velY - offsetY * velX;
      const leverDist    = Math.hypot(offsetX, offsetY) || 1;
      const angularForce = rawTorque / leverDist;

      gsap.to(target, {
        inertia: {
          x:          { velocity: clampXY(velX * xyMultiplier),                end: 0 },
          y:          { velocity: clampXY(velY * xyMultiplier),                end: 0 },
          rotation:   { velocity: clampRot(angularForce * rotationMultiplier), end: endRotation },
          resistance: inertiaResistance,
        }
      });
    }

    root.querySelectorAll('[data-momentum-hover-element]').forEach(el => {
      const targets = Array.from(el.querySelectorAll('[data-momentum-hover-target]'));
      if (!targets.length) return;

      if (targets.length === 1) {
        const endRot = getOriginalRotation(targets[0]);
        el.addEventListener('mouseenter', e => applyInertia(targets[0], e, endRot));
      } else {
        targets.forEach(target => {
          const endRot = getOriginalRotation(target);
          target.addEventListener('mouseenter', e => applyInertia(target, e, endRot));
        });
      }
    });
  });
}


// ==========================================================
// CURSOR MARQUEE EFFECT
// ==========================================================

function initCursorMarqueeEffect() {
  const hoverOutDelay  = 0.4;
  const followDuration = 0.4;
  const speedMultiplier = 5;

  const cursor = document.querySelector('[data-cursor-marquee-status]');
  if (!cursor) return;
  const targets = cursor.querySelectorAll('[data-cursor-marquee-text-target]');

  const xTo = gsap.quickTo(cursor, 'x', { duration: followDuration, ease: 'power3' });
  const yTo = gsap.quickTo(cursor, 'y', { duration: followDuration, ease: 'power3' });

  let pauseTimeout = null;
  let activeEl     = null;
  let lastX = 0;
  let lastY = 0;

  function playFor(el) {
    if (!el) return;
    if (pauseTimeout) clearTimeout(pauseTimeout);
    const text = el.getAttribute('data-cursor-marquee-text') || '';
    const sec  = (text.length || 1) / speedMultiplier;
    targets.forEach(t => {
      t.textContent = text;
      t.style.animationPlayState = 'running';
      t.style.animationDuration  = sec + 's';
    });
    cursor.setAttribute('data-cursor-marquee-status', 'active');
    activeEl = el;
  }

  function pauseLater() {
    cursor.setAttribute('data-cursor-marquee-status', 'not-active');
    if (pauseTimeout) clearTimeout(pauseTimeout);
    pauseTimeout = setTimeout(() => {
      targets.forEach(t => { t.style.animationPlayState = 'paused'; });
    }, hoverOutDelay * 1000);
    activeEl = null;
  }

  function checkTarget() {
    const el  = document.elementFromPoint(lastX, lastY);
    const hit = el && el.closest('[data-cursor-marquee-text]');
    if (hit !== activeEl) {
      if (activeEl) pauseLater();
      if (hit) playFor(hit);
    }
  }

  window.addEventListener('pointermove', e => {
    lastX = e.clientX;
    lastY = e.clientY;
    xTo(lastX);
    yTo(lastY);
    checkTarget();
  }, { passive: true });

  window.addEventListener('scroll', () => {
    xTo(lastX);
    yTo(lastY);
    checkTarget();
  }, { passive: true });

  setTimeout(() => {
    cursor.setAttribute('data-cursor-marquee-status', 'not-active');
  }, 500);
}

function initAll() {
  initStickyFeatures();
  initNavEntrance();
  initHeadingReveal();
  initGlobalParallax();
  initMarqueeScrollDirection();
  initDraggableMarquee();
  initNavHideOnScroll();
  initAccordionCSS();
  initNavBorderScroll();
  initNavBtnColorOnScroll();
  initNavLogoNudge();
  initStripedButtons();
  initAdvancedFormValidation();
  initLogoWallCycle();
  initHeroGradient();
  initButtonCharacterStagger();
  updateOdometer = initNumberOdometer();
  initOdometerSlider();
  initMomentumBasedHover();
  initCursorMarqueeEffect();
  initFlagCards();
  initMobilePhotosMarquee();
  initFlickCards();
  initStepGrid();
  initGroeipadCards();
  initStartCircle();
  initEmojiRainActions();
  initRotatingImageTrail();
  initMediaSetup();
  initBunnyLightboxPlayer();
  initBunnyPlayerBasic();
}

// ==========================================================
// ROTATING IMAGE TRAIL
// ==========================================================

function initRotatingImageTrail() {
  var area = document.querySelector('[data-trail-area]');
  if (!area) return;

  var collection = area.querySelector('[data-trail-collection]');
  if (!collection) return;

  var items = collection.querySelectorAll('[data-trail-item]');
  if (!items.length) return;

  // area itself must not block clicks — listen on document instead
  area.style.pointerEvents = 'none';

  var index        = 0;
  var lastCloneX   = null;
  var lastCloneY   = null;
  var cardWidth    = items[0].getBoundingClientRect().width;
  var stepDistance = cardWidth * 0.5;

  function spawnTrailItem(x, y) {
    var original = items[index];
    var clone = original.cloneNode(true);

    clone.style.left          = x + 'px';
    clone.style.top           = y + 'px';
    clone.style.pointerEvents = 'none';
    clone.setAttribute('data-trail-item', 'hidden');
    area.appendChild(clone);

    void clone.getBoundingClientRect();
    clone.setAttribute('data-trail-item', 'visible');

    setTimeout(function() { clone.setAttribute('data-trail-item', 'transition-out'); }, 400);
    setTimeout(function() { clone.remove(); }, 1200);

    index      = (index + 1) % items.length;
    lastCloneX = x;
    lastCloneY = y;
  }

  var pauseZoneEls = Array.from(document.querySelectorAll('.start_circle, .down_part_footer'));

  function inPauseZone(cx, cy) {
    return pauseZoneEls.some(function(el) {
      var r = el.getBoundingClientRect();
      return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
    });
  }

  document.addEventListener('mousemove', function(event) {
    var rect = area.getBoundingClientRect();
    var x = event.clientX - rect.left;
    var y = event.clientY - rect.top;

    if (x < 0 || y < 0 || x > rect.width || y > rect.height) {
      lastCloneX = null;
      lastCloneY = null;
      return;
    }

    if (inPauseZone(event.clientX, event.clientY)) {
      lastCloneX = null;
      lastCloneY = null;
      return;
    }

    if (lastCloneX === null || lastCloneY === null) {
      spawnTrailItem(x, y);
      return;
    }

    var dx = x - lastCloneX;
    var dy = y - lastCloneY;

    if (Math.sqrt(dx * dx + dy * dy) >= stepDistance) {
      spawnTrailItem(x, y);
    }
  });
}

// ==========================================================
// MEDIA SETUP (autoplay / hover / click)
// ==========================================================

function initMediaSetup() {
  const mediaElements = document.querySelectorAll('[data-media-init]');
  if (!mediaElements.length) return;

  const pauseDelay      = 200;
  const viewportOffset  = 0.1;
  const isHoverDevice   = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  initMediaSetup._cleanup?.forEach(fn => fn());
  const cleanupFns     = [];
  const rootMarginValue = viewportOffset * 100;

  mediaElements.forEach(mediaEl => {
    const video = mediaEl.querySelector('[data-media-video-src]');
    if (!video) return;

    const mode           = mediaEl.dataset.mediaMode || 'autoplay';
    const touchMode      = mediaEl.dataset.mediaTouchMode;
    const resetAttr      = mediaEl.dataset.mediaReset;
    const pausedStatusAttr = mediaEl.dataset.mediaOnPause;
    const toggleElements = [...mediaEl.querySelectorAll('[data-media-toggle]')];

    const activeMode         = !isHoverDevice ? (touchMode || (mode === 'hover' ? 'autoplay' : mode)) : mode;
    const shouldResetOnPause = resetAttr === 'true' ? true : resetAttr === 'false' ? false : activeMode === 'hover';
    const pausedStatus       = pausedStatusAttr === 'paused' ? 'paused' : 'not-active';

    const clickTargets       = toggleElements.length ? toggleElements : [mediaEl];
    const shouldUseClickToggle = activeMode === 'click' || (activeMode === 'autoplay' && toggleElements.length);

    let isInView      = false;
    let isHovering    = false;
    let hasLoaded     = false;
    let userPaused    = false;
    let userActivated = false;
    let isActivated   = false;
    let shouldBePlaying = false;
    let pauseTimer    = null;

    const setStatus      = status => { mediaEl.dataset.mediaStatus = status; };
    const clearPauseTimer = () => { clearTimeout(pauseTimer); };
    const addCleanup     = fn => { cleanupFns.push(fn); };
    const on = (target, event, handler) => {
      target.addEventListener(event, handler);
      addCleanup(() => target.removeEventListener(event, handler));
    };

    const playAttempt = () => {
      video.play().then(() => { if (shouldBePlaying) setStatus('playing'); }).catch(() => {});
    };

    const loadVideo = () => {
      if (hasLoaded) return;
      const src = video.dataset.mediaVideoSrc;
      if (!src) return;
      video.muted = true;
      video.playsInline = true;
      video.setAttribute('muted', '');
      video.setAttribute('playsinline', '');
      video.setAttribute('webkit-playsinline', '');
      video.src = src;
      video.load();
      hasLoaded = true;
    };

    const shouldResume = () => {
      if (!isInView || document.hidden) return false;
      if (activeMode === 'autoplay') return !userPaused;
      if (activeMode === 'click')    return userActivated && !userPaused;
      return isHovering;
    };

    const playVideo = () => {
      if (!isInView || document.hidden) return;
      shouldBePlaying = true;
      clearPauseTimer();
      loadVideo();
      setStatus(video.readyState < 3 ? 'loading' : 'playing');
      playAttempt();
    };

    const pauseVideo = (delay = 0, reset = false) => {
      shouldBePlaying = false;
      clearPauseTimer();
      pauseTimer = setTimeout(() => { video.pause(); if (reset) video.currentTime = 0; }, delay);
    };

    const handleHoverIn = () => {
      if (!isInView || document.hidden) return;
      isHovering = true;
      clearPauseTimer();
      if (!video.paused) { shouldBePlaying = true; setStatus('playing'); return; }
      playVideo();
    };

    const handleHoverOut = () => {
      if (!isInView) return;
      isHovering = false;
      setStatus(pausedStatus);
      pauseVideo(pauseDelay, shouldResetOnPause);
    };

    const handleClick = () => {
      if (!isInView || document.hidden) return;
      clearPauseTimer();
      if (video.paused) {
        userActivated = true; userPaused = false; playVideo();
      } else {
        userActivated = true; userPaused = true;
        setStatus(pausedStatus);
        pauseVideo(pauseDelay, shouldResetOnPause);
      }
    };

    const handleViewport = entries => {
      entries.forEach(entry => {
        if (entry.target !== mediaEl) return;
        if (!isActivated && entry.isIntersecting) {
          isActivated = true;
          if (shouldUseClickToggle) clickTargets.forEach(t => on(t, 'click', handleClick));
          if (activeMode === 'hover') { on(mediaEl, 'mouseenter', handleHoverIn); on(mediaEl, 'mouseleave', handleHoverOut); }
        }
        isInView = entry.isIntersecting;
        if (isInView) {
          if (shouldResume()) playVideo();
        } else {
          isHovering = false;
          if (!video.paused || shouldBePlaying) { setStatus('paused'); pauseVideo(0, false); }
        }
      });
    };

    const handlePageVisibilityChange = () => {
      if (document.hidden) {
        if (!video.paused || shouldBePlaying) { setStatus('paused'); pauseVideo(0, false); }
        return;
      }
      if (shouldResume()) playVideo();
    };

    mediaEl.dataset.mediaStatus = 'not-active';

    const observer = new IntersectionObserver(handleViewport, {
      rootMargin: `${rootMarginValue}% 0px ${rootMarginValue}% 0px`,
      threshold: 0,
    });
    observer.observe(mediaEl);

    on(video, 'playing',    () => { if (shouldBePlaying) setStatus('playing'); });
    on(video, 'waiting',    () => { if (shouldBePlaying) setStatus('loading'); });
    on(video, 'canplay',    () => { if (shouldBePlaying && isInView && !document.hidden) playAttempt(); });
    on(video, 'loadeddata', () => { if (shouldBePlaying && isInView && !document.hidden) playAttempt(); });
    on(video, 'ended',      () => { if (!shouldBePlaying || !isInView || document.hidden) return; video.currentTime = 0; playAttempt(); });
    on(document, 'visibilitychange', handlePageVisibilityChange);

    addCleanup(() => observer.disconnect());
    addCleanup(() => { clearPauseTimer(); shouldBePlaying = false; video.pause(); });
  });

  initMediaSetup._cleanup = cleanupFns;
}

// ==========================================================
// FLAG CARDS FAN REVEAL
// ==========================================================

function initFlagCards() {
  document.querySelectorAll('.rf_gf_wrap').forEach(wrap => {
    const cards = gsap.utils.toArray('.flag_card', wrap);
    if (!cards.length) return;

    // Each card starts stacked behind the one above it (negative y = upward)
    // parallax owns yPercent, so using pixel-y here is safe — they compose additively
    cards.forEach((card, i) => {
      gsap.set(card, { autoAlpha: 0, y: -(i * 56), scale: 0.94 });
    });

    ScrollTrigger.create({
      trigger: wrap,
      start: 'top 78%',
      once: true,
      onEnter: () => {
        gsap.to(cards, {
          autoAlpha: 1,
          y: 0,
          scale: 1,
          duration: 1,
          ease: 'back.out(1.4)',
          stagger: 0.13,
        });
      },
    });
  });
}

// ==========================================================
// MOBILE PHOTOS MARQUEE
// ==========================================================

function initMobilePhotosMarquee() {
  const rows = document.querySelectorAll('.mobile-photos-row');
  if (!rows.length) return;

  if (!document.getElementById('mobile-marquee-style')) {
    const style = document.createElement('style');
    style.id = 'mobile-marquee-style';
    style.textContent = '@keyframes mobileMarqueeLeft { to { transform: translateX(-50%); } }';
    document.head.appendChild(style);
  }

  rows.forEach((row, i) => {
    const items = Array.from(row.children);
    items.forEach(item => row.appendChild(item.cloneNode(true)));
    row.style.flexWrap    = 'nowrap';
    row.style.width       = 'max-content';
    row.style.willChange  = 'transform';
    const dir = i % 2 === 0 ? 'normal' : 'reverse';
    row.style.animation   = `mobileMarqueeLeft ${22 + i * 8}s linear infinite ${dir}`;
  });
}

// ==========================================================
// FLICK CARDS SLIDER
// ==========================================================

function initFlickCards() {
  const sliders = document.querySelectorAll('[data-flick-cards-init]');

  sliders.forEach(slider => {
    const list = slider.querySelector('[data-flick-cards-list]');
    const cards = Array.from(list.querySelectorAll('[data-flick-cards-item]'));
    const total = cards.length;
    let activeIndex = 0;

    const sliderWidth = slider.offsetWidth;
    const threshold = 0.1;

    const draggers = [];
    cards.forEach(card => {
      const dragger = document.createElement('div');
      dragger.setAttribute('data-flick-cards-dragger', '');
      card.appendChild(dragger);
      draggers.push(dragger);
    });

    slider.setAttribute('data-flick-drag-status', 'grab');

    function getConfig(i, currentIndex) {
      let diff = i - currentIndex;
      if (diff > total / 2) diff -= total;
      else if (diff < -total / 2) diff += total;

      switch (diff) {
        case  0: return { x: 0,   y: 0, rot: 0,   s: 1,   o: 1, z: 5 };
        case  1: return { x: 25,  y: 1, rot: 10,  s: 0.9, o: 1, z: 4 };
        case -1: return { x: -25, y: 1, rot: -10, s: 0.9, o: 1, z: 4 };
        case  2: return { x: 45,  y: 5, rot: 15,  s: 0.8, o: 1, z: 3 };
        case -2: return { x: -45, y: 5, rot: -15, s: 0.8, o: 1, z: 3 };
        default: {
          const dir = diff > 0 ? 1 : -1;
          return { x: 55 * dir, y: 5, rot: 20 * dir, s: 0.6, o: 0, z: 2 };
        }
      }
    }

    function renderCards(currentIndex) {
      cards.forEach((card, i) => {
        const cfg = getConfig(i, currentIndex);
        let status;
        if      (cfg.x === 0)   status = 'active';
        else if (cfg.x === 25)  status = '2-after';
        else if (cfg.x === -25) status = '2-before';
        else if (cfg.x === 45)  status = '3-after';
        else if (cfg.x === -45) status = '3-before';
        else                    status = 'hidden';

        card.setAttribute('data-flick-cards-item-status', status);
        card.style.zIndex = cfg.z;

        gsap.to(card, {
          duration: 0.6,
          ease: 'elastic.out(1.2, 1)',
          xPercent: cfg.x,
          yPercent: cfg.y,
          rotation: cfg.rot,
          scale: cfg.s,
          opacity: cfg.o,
        });
      });
    }

    renderCards(activeIndex);

    let pressClientX = 0;
    let pressClientY = 0;

    Draggable.create(draggers, {
      type: 'x',
      edgeResistance: 0.8,
      bounds: { minX: -sliderWidth / 2, maxX: sliderWidth / 2 },
      inertia: false,

      onPress() {
        pressClientX = this.pointerEvent.clientX;
        pressClientY = this.pointerEvent.clientY;
        slider.setAttribute('data-flick-drag-status', 'grabbing');
      },

      onDrag() {
        const rawProgress = this.x / sliderWidth;
        const progress    = Math.min(1, Math.abs(rawProgress));
        const direction   = rawProgress > 0 ? -1 : 1;
        const nextIndex   = (activeIndex + direction + total) % total;

        cards.forEach((card, i) => {
          const from = getConfig(i, activeIndex);
          const to   = getConfig(i, nextIndex);
          const mix  = prop => from[prop] + (to[prop] - from[prop]) * progress;

          gsap.set(card, {
            xPercent: mix('x'),
            yPercent: mix('y'),
            rotation: mix('rot'),
            scale:    mix('s'),
            opacity:  mix('o'),
          });
        });
      },

      onRelease() {
        slider.setAttribute('data-flick-drag-status', 'grab');

        const releaseClientX = this.pointerEvent.clientX;
        const releaseClientY = this.pointerEvent.clientY;
        const dragDistance   = Math.hypot(releaseClientX - pressClientX, releaseClientY - pressClientY);

        const raw = this.x / sliderWidth;
        let shift = 0;
        if (raw > threshold)       shift = -1;
        else if (raw < -threshold) shift =  1;

        if (shift !== 0) {
          activeIndex = (activeIndex + shift + total) % total;
          renderCards(activeIndex);
        }

        gsap.to(this.target, { x: 0, duration: 0.3, ease: 'power1.out' });

        if (dragDistance < 4) {
          this.target.style.pointerEvents = 'none';
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              const el = document.elementFromPoint(releaseClientX, releaseClientY);
              if (el) el.dispatchEvent(new MouseEvent('click', { view: window, bubbles: true, cancelable: true }));
              this.target.style.pointerEvents = 'auto';
            });
          });
        }
      },
    });
  });
}

// ==========================================================
// STEP GRID
// ==========================================================

function initStepGrid() {
  const osmo = CustomEase.create('osmo', 'M0,0 C0.5,0 0.5,1 1,1');

  document.querySelectorAll('.stepgrid').forEach(grid => {
    const fills = Array.from(grid.querySelectorAll('.white_step_fill'));
    if (!fills.length) return;

    const count = fills.length;
    gsap.set(fills, { height: '0%' });

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: grid,
        start: 'top 80%',
        end: 'center center',
        scrub: 1.5,
      }
    });

    fills.forEach((fill, i) => {
      tl.to(fill, {
        height: (i / (count - 1) * 100) + '%',
        ease: osmo,
      }, i * 0.15);
    });
  });
}

// ==========================================================
// GROEIPAD CARDS
// ==========================================================

function initGroeipadCards() {
  const grid = document.querySelector('[data-groeipad-grid]');
  if (!grid) return;

  const cards   = gsap.utils.toArray('.groeipad_card', grid);
  if (!cards.length) return;

  const icons   = gsap.utils.toArray('.icon', grid);
  const bottoms = cards.map(c => c.querySelector('.btm_text_wrap, .btm_text_wrap_dif')).filter(Boolean);

  gsap.set(cards,   { autoAlpha: 0, y: 80 });
  gsap.set(icons,   { autoAlpha: 0, scale: 0.5 });
  gsap.set(bottoms, { autoAlpha: 0, y: 30 });

  gsap.timeline({
    scrollTrigger: {
      trigger: grid,
      start: 'top 70%',
      once: true,
    }
  })
  .to(cards, {
    autoAlpha: 1,
    y: 0,
    duration: 1,
    ease: 'expo.out',
    stagger: 0.1,
  })
  .to(icons, {
    autoAlpha: 1,
    scale: 1,
    duration: 0.7,
    ease: 'back.out(2)',
    stagger: 0.1,
  }, 0.15)
  .to(bottoms, {
    autoAlpha: 1,
    y: 0,
    duration: 0.9,
    ease: 'expo.out',
    stagger: 0.1,
  }, 0.2);
}

// ==========================================================
// START CIRCLE HOVER
// ==========================================================

function initStartCircle() {
  const el = document.querySelector('.start_circle');
  if (!el) return;

  const ring  = el.querySelector('[data-start-ring]');
  const label = el.querySelector('[data-start-label]');

  let rotTween = null;

  const xTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' });
  const yTo = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' });

  el.addEventListener('mouseenter', () => {
    gsap.to(el, { scale: 1.06, duration: 0.5, ease: 'back.out(2)' });

    if (ring) {
      if (rotTween) rotTween.kill();
      rotTween = gsap.to(ring, { rotation: '+=360', duration: 7, ease: 'none', repeat: -1 });
    }
  });

  el.addEventListener('click', () => {
    gsap.timeline()
      .to(el, { scale: 0.92, duration: 0.1, ease: 'power2.in' })
      .to(el, { scale: 1.06, duration: 0.5, ease: 'elastic.out(1.2, 0.4)' });
  });

  el.addEventListener('mousemove', e => {
    const b  = el.getBoundingClientRect();
    const dx = (e.clientX - (b.left + b.width  / 2)) * 0.22;
    const dy = (e.clientY - (b.top  + b.height / 2)) * 0.22;
    xTo(dx);
    yTo(dy);
  });

  el.addEventListener('mouseleave', () => {
    if (rotTween) { rotTween.kill(); rotTween = null; }
    if (ring) gsap.to(ring, { rotation: 0, duration: 0.8, ease: 'power3.out' });
    gsap.to(el, { x: 0, y: 0, scale: 1, duration: 0.8, ease: 'elastic.out(1.2, 0.4)' });
  });
}

// ==========================================================
// EMOJI RAIN
// ==========================================================

let emojiAnimationRunning = false;

function initEmojiRain(emojiTypes, emojiContainer) {
  if (emojiAnimationRunning) return;
  emojiAnimationRunning = true;

  const emojiContainerHeight = emojiContainer.offsetHeight;
  const emojiQuantity = 60;
  const getRandomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  const createEmojiElement = () => {
    const emojiScale    = Math.random() * 0.6 + 0.4;
    const emojiRotate   = getRandomInt(1, 5);
    const emojiDelay    = 0.001 * getRandomInt(0, 1250);
    const emojiSpeed    = getRandomInt(500, 1500) * 0.001;
    const emojiPosition = `${getRandomInt(0, 10)}0%`;
    const emojiClass    = `single-rain-emoji-image-${emojiTypes[Math.floor(Math.random() * emojiTypes.length)]}`;

    const singleEmoji = document.createElement('div');
    singleEmoji.className = 'single-rain-emoji append';
    singleEmoji.style.left = emojiPosition;

    const singleEmojiChild = document.createElement('div');
    singleEmojiChild.className = emojiClass;
    singleEmoji.appendChild(singleEmojiChild);

    gsap.fromTo(singleEmoji,
      { y: emojiContainerHeight, xPercent: -50, rotate: 0.001, scale: emojiScale },
      { y: '-100%', xPercent: -50, rotate: 0.001, delay: emojiDelay, ease: 'power1.in', duration: emojiSpeed }
    );
    gsap.fromTo(singleEmojiChild,
      { xPercent: -25, rotate: emojiRotate },
      { xPercent: 25, rotate: -emojiRotate, ease: 'power1.inOut', delay: emojiDelay, duration: 0.8, repeat: -1, yoyo: true }
    );

    emojiContainer.appendChild(singleEmoji);
  };

  Array.from({ length: emojiQuantity }).forEach(createEmojiElement);

  setTimeout(() => {
    emojiContainer.querySelectorAll('.single-rain-emoji.append').forEach(el => el.remove());
    emojiAnimationRunning = false;
  }, 2750);
}

function initEmojiRainActions() {
  document.querySelectorAll('[data-emoji-rain-type-1]').forEach(trigger => {
    trigger.addEventListener('click', () => {
      const type1 = trigger.getAttribute('data-emoji-rain-type-1');
      const type2 = trigger.getAttribute('data-emoji-rain-type-2') || type1;
      const emojiContainer = document.querySelector('[data-emoji-rain-container]');
      if (!emojiContainer) return;
      initEmojiRain([type1, type2], emojiContainer);
    });
  });
}

// ==========================================================
// BUNNY LIGHTBOX PLAYER
// ==========================================================

function initBunnyLightboxPlayer() {
  var player = document.querySelector('[data-bunny-lightbox-init]');
  if (!player) return;

  var wrapper = player.closest('[data-bunny-lightbox-status]');
  if (!wrapper) return;

  var video = player.querySelector('video');
  if (!video) return;

  try { video.pause(); } catch(_) {}
  try { video.removeAttribute('src'); video.load(); } catch(_) {}

  function setAttr(el, name, val) {
    var str = (typeof val === 'boolean') ? (val ? 'true' : 'false') : String(val);
    if (el.getAttribute(name) !== str) el.setAttribute(name, str);
  }
  function setStatus(s) { setAttr(player, 'data-player-status', s); }
  function setMutedState(v) { video.muted = !!v; setAttr(player, 'data-player-muted', video.muted); }
  function setFsAttr(v) { setAttr(player, 'data-player-fullscreen', !!v); }
  function setActivated(v) { setAttr(player, 'data-player-activated', !!v); }
  if (!player.hasAttribute('data-player-activated')) setActivated(false);

  var timeline          = player.querySelector('[data-player-timeline]');
  var progressBar       = player.querySelector('[data-player-progress]');
  var bufferedBar       = player.querySelector('[data-player-buffered]');
  var handle            = player.querySelector('[data-player-timeline-handle]');
  var timeDurationEls   = player.querySelectorAll('[data-player-time-duration]');
  var timeProgressEls   = player.querySelectorAll('[data-player-time-progress]');
  var playerPlaceholderImg = player.querySelector('[data-bunny-lightbox-placeholder]');

  var updateSize   = player.getAttribute('data-player-update-size');
  var autoplay     = player.getAttribute('data-player-autoplay') === 'true';
  var initialMuted = player.getAttribute('data-player-muted') === 'true';

  var pendingPlay = false;

  video.loop = false;
  setMutedState(initialMuted);
  video.setAttribute('playsinline', '');
  video.setAttribute('webkit-playsinline', '');
  video.playsInline = true;
  if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
  if (autoplay) video.autoplay = false;

  var isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl');
  var canUseHlsJs    = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

  var isAttached       = false;
  var currentSrc       = '';
  var lastPauseBy      = '';
  var rafId;
  var autoStartOnReady = false;

  function setupLightboxClamp(player, wrapper, video, updateSize) {
    var calcBox = wrapper.querySelector('[data-bunny-lightbox-calc-height]');
    if (!calcBox) return;

    function getRatio() {
      if (updateSize === 'cover') return null;
      if (updateSize === 'true') {
        if (video.videoWidth && video.videoHeight) return video.videoWidth / video.videoHeight;
        var before = player.querySelector('[data-player-before]');
        if (before && before.style && before.style.paddingTop) {
          var pct = parseFloat(before.style.paddingTop);
          if (pct > 0) return 100 / pct;
        }
        var r = player.getBoundingClientRect();
        if (r.height > 0) return r.width / r.height;
        return 16 / 9;
      }
      var beforeFalse = player.querySelector('[data-player-before]');
      if (beforeFalse && beforeFalse.style && beforeFalse.style.paddingTop) {
        var pad = parseFloat(beforeFalse.style.paddingTop);
        if (pad > 0) return 100 / pad;
      }
      var rb = player.getBoundingClientRect();
      if (rb.height > 0) return rb.width / rb.height;
      return 16 / 9;
    }

    function applyClamp() {
      if (updateSize === 'cover') { calcBox.style.maxWidth = ''; calcBox.style.maxHeight = ''; return; }
      var parent = wrapper;
      var cs = getComputedStyle(parent);
      var cw = parent.clientWidth  - (parseFloat(cs.paddingLeft)  || 0) - (parseFloat(cs.paddingRight)  || 0);
      var ch = parent.clientHeight - (parseFloat(cs.paddingTop)   || 0) - (parseFloat(cs.paddingBottom) || 0);
      if (cw <= 0 || ch <= 0) return;
      var ratio = getRatio();
      if (!ratio) { calcBox.style.maxWidth = ''; calcBox.style.maxHeight = ''; return; }
      var hIfFullWidth = cw / ratio;
      if (hIfFullWidth <= ch) {
        calcBox.style.maxWidth  = '100%';
        calcBox.style.maxHeight = (hIfFullWidth / ch * 100) + '%';
      } else {
        calcBox.style.maxHeight = '100%';
        calcBox.style.maxWidth  = ((ch * ratio) / cw * 100) + '%';
      }
    }

    var rafPending = false;
    function debouncedApply() {
      if (rafPending) return;
      if (wrapper.getAttribute('data-bunny-lightbox-status') !== 'active') return;
      rafPending = true;
      requestAnimationFrame(function() { rafPending = false; applyClamp(); });
    }

    var ro = new ResizeObserver(debouncedApply);
    ro.observe(wrapper);
    window.addEventListener('resize', debouncedApply);
    window.addEventListener('orientationchange', debouncedApply);
    if (updateSize === 'true') {
      video.addEventListener('loadedmetadata', debouncedApply);
      video.addEventListener('loadeddata', debouncedApply);
      video.addEventListener('playing', debouncedApply);
    }
    player._applyClamp = debouncedApply;
    debouncedApply();
  }

  setupLightboxClamp(player, wrapper, video, updateSize);

  function withAttach(src, onReady) {
    if (isSafariNative) {
      video.preload = 'auto'; video.src = src;
      video.addEventListener('loadedmetadata', onReady, { once: true });
      return;
    }
    if (canUseHlsJs) {
      var hls = new Hls({ maxBufferLength: 10 });
      player._hls = hls;
      hls.attachMedia(video);
      hls.on(Hls.Events.MEDIA_ATTACHED, function() { hls.loadSource(src); });
      hls.on(Hls.Events.MANIFEST_PARSED, function() { onReady(); });
      hls.on(Hls.Events.LEVEL_LOADED, function(e, data) {
        if (data && data.details && isFinite(data.details.totalduration) && timeDurationEls.length) {
          setText(timeDurationEls, formatTime(data.details.totalduration));
        }
      });
      return;
    }
    video.preload = 'auto'; video.src = src;
    video.addEventListener('loadedmetadata', onReady, { once: true });
  }

  function attachMediaFor(src) {
    if (currentSrc === src && isAttached) return;
    if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }
    if (timeDurationEls.length) setText(timeDurationEls, '00:00');
    currentSrc = src; isAttached = true;
    withAttach(src, function onReady() {
      readyIfIdle(player, pendingPlay);
      updateBeforeRatioIOSSafe();
      if (typeof player._applyClamp === 'function') player._applyClamp();
      if (timeDurationEls.length && video.duration) setText(timeDurationEls, formatTime(video.duration));
      if (autoStartOnReady && wrapper.getAttribute('data-bunny-lightbox-status') === 'active') {
        setStatus('loading'); safePlay(video); autoStartOnReady = false;
      }
    });
  }

  function ensureOpenUI(isActive) {
    var state = isActive ? 'active' : 'not-active';
    if (wrapper.getAttribute('data-bunny-lightbox-status') !== state) wrapper.setAttribute('data-bunny-lightbox-status', state);
    if (isActive && typeof player._applyClamp === 'function') player._applyClamp();
  }

  function isSameSrc(next) { return currentSrc && currentSrc === next; }
  function planOnOpen(next) {
    var same = isSameSrc(next);
    if (!same) {
      try { if (!video.paused && !video.ended) video.pause(); } catch(_) {}
      if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }
      isAttached = false; currentSrc = '';
      if (timeDurationEls.length) setText(timeDurationEls, '00:00');
      setActivated(false); setStatus('idle');
      attachMediaFor(next);
      autoStartOnReady = !!autoplay; pendingPlay = !!autoplay;
      return;
    }
    autoStartOnReady = !!autoplay;
    if (autoplay) { setStatus('loading'); safePlay(video); }
    else { try { if (!video.paused && !video.ended) video.pause(); } catch(_) {} setActivated(false); setStatus('paused'); }
  }

  function openLightbox(src, placeholderUrl) {
    if (!src) return;
    function activate() { ensureOpenUI(true); planOnOpen(src); }
    if (playerPlaceholderImg && placeholderUrl) {
      var needsSwap = playerPlaceholderImg.getAttribute('src') !== placeholderUrl;
      if (needsSwap || !playerPlaceholderImg.complete || !playerPlaceholderImg.naturalWidth) {
        playerPlaceholderImg.onload  = function() { playerPlaceholderImg.onload  = null; activate(); };
        playerPlaceholderImg.onerror = function() { playerPlaceholderImg.onerror = null; activate(); };
        if (needsSwap) playerPlaceholderImg.setAttribute('src', placeholderUrl);
        else playerPlaceholderImg.dispatchEvent(new Event('load'));
      } else { activate(); }
    } else { activate(); }
  }

  function togglePlay() {
    if (video.paused || video.ended) { pendingPlay = true; lastPauseBy = ''; setStatus('loading'); safePlay(video); }
    else { lastPauseBy = 'manual'; video.pause(); }
  }
  function toggleMute() { setMutedState(!video.muted); }

  player.addEventListener('click', function(e) {
    var btn = e.target.closest('[data-player-control]');
    if (!btn || !player.contains(btn)) return;
    var type = btn.getAttribute('data-player-control');
    if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
    else if (type === 'mute') toggleMute();
    else if (type === 'fullscreen') toggleFullscreen();
  });

  function isFsActive() { return !!(document.fullscreenElement || document.webkitFullscreenElement); }
  function enterFullscreen() {
    if (player.requestFullscreen) return player.requestFullscreen();
    if (video.requestFullscreen) return video.requestFullscreen();
    if (video.webkitSupportsFullscreen && typeof video.webkitEnterFullscreen === 'function') return video.webkitEnterFullscreen();
  }
  function exitFullscreen() {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    if (video.webkitDisplayingFullscreen && typeof video.webkitExitFullscreen === 'function') return video.webkitExitFullscreen();
  }
  function toggleFullscreen() { if (isFsActive() || video.webkitDisplayingFullscreen) exitFullscreen(); else enterFullscreen(); }
  document.addEventListener('fullscreenchange', function() { setFsAttr(isFsActive()); });
  document.addEventListener('webkitfullscreenchange', function() { setFsAttr(isFsActive()); });
  video.addEventListener('webkitbeginfullscreen', function() { setFsAttr(true); });
  video.addEventListener('webkitendfullscreen', function() { setFsAttr(false); });

  function updateTimeTexts() {
    if (timeDurationEls.length) setText(timeDurationEls, formatTime(video.duration));
    if (timeProgressEls.length) setText(timeProgressEls, formatTime(video.currentTime));
  }
  video.addEventListener('timeupdate', updateTimeTexts);
  video.addEventListener('loadedmetadata', function() { updateTimeTexts(); updateBeforeRatioIOSSafe(); });
  video.addEventListener('loadeddata', function() { updateBeforeRatioIOSSafe(); });
  video.addEventListener('playing', function() { updateBeforeRatioIOSSafe(); });
  video.addEventListener('durationchange', updateTimeTexts);

  function updateProgressVisuals() {
    if (!video.duration) return;
    var playedPct = (video.currentTime / video.duration) * 100;
    if (progressBar) progressBar.style.transform = 'translateX(' + (-100 + playedPct) + '%)';
    if (handle) handle.style.left = pctClamp(playedPct) + '%';
  }
  function pctClamp(p) { return p < 0 ? 0 : p > 100 ? 100 : p; }
  function loop() { updateProgressVisuals(); if (!video.paused && !video.ended) rafId = requestAnimationFrame(loop); }

  function updateBufferedBar() {
    if (!bufferedBar || !video.duration || !video.buffered.length) return;
    var end = video.buffered.end(video.buffered.length - 1);
    bufferedBar.style.transform = 'translateX(' + (-100 + (end / video.duration) * 100) + '%)';
  }
  video.addEventListener('progress', updateBufferedBar);
  video.addEventListener('loadedmetadata', updateBufferedBar);
  video.addEventListener('durationchange', updateBufferedBar);

  video.addEventListener('play',    function() { setActivated(true); cancelAnimationFrame(rafId); loop(); setStatus('playing'); });
  video.addEventListener('playing', function() { pendingPlay = false; setStatus('playing'); });
  video.addEventListener('pause',   function() { pendingPlay = false; cancelAnimationFrame(rafId); updateProgressVisuals(); setStatus('paused'); });
  video.addEventListener('waiting', function() { setStatus('loading'); });
  video.addEventListener('canplay', function() { readyIfIdle(player, pendingPlay); });
  video.addEventListener('ended',   function() {
    pendingPlay = false; cancelAnimationFrame(rafId); updateProgressVisuals(); setActivated(false); video.currentTime = 0;
    if (document.fullscreenElement || document.webkitFullscreenElement || video.webkitDisplayingFullscreen) {
      if (document.exitFullscreen) document.exitFullscreen();
      else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
      else if (video.webkitExitFullscreen) video.webkitExitFullscreen();
    }
    closeLightbox();
  });

  if (timeline) {
    var dragging = false, wasPlaying = false, targetTime = 0, lastSeekTs = 0, seekThrottle = 180, rect = null;
    window.addEventListener('resize', function() { if (!dragging) rect = null; });
    function getFractionFromX(x) {
      if (!rect) rect = timeline.getBoundingClientRect();
      var f = (x - rect.left) / rect.width; return f < 0 ? 0 : f > 1 ? 1 : f;
    }
    function previewAtFraction(f) {
      if (!video.duration) return;
      var pct = f * 100;
      if (progressBar) progressBar.style.transform = 'translateX(' + (-100 + pct) + '%)';
      if (handle) handle.style.left = pct + '%';
      if (timeProgressEls.length) setText(timeProgressEls, formatTime(f * video.duration));
    }
    function maybeSeek(now) {
      if (!video.duration || (now - lastSeekTs) < seekThrottle) return;
      lastSeekTs = now; video.currentTime = targetTime;
    }
    function onPointerDown(e) {
      if (!video.duration) return;
      dragging = true; wasPlaying = !video.paused && !video.ended; if (wasPlaying) video.pause();
      player.setAttribute('data-timeline-drag', 'true'); rect = timeline.getBoundingClientRect();
      var f = getFractionFromX(e.clientX); targetTime = f * video.duration; previewAtFraction(f); maybeSeek(performance.now());
      timeline.setPointerCapture && timeline.setPointerCapture(e.pointerId);
      window.addEventListener('pointermove', onPointerMove, { passive: false });
      window.addEventListener('pointerup', onPointerUp, { passive: true });
      e.preventDefault();
    }
    function onPointerMove(e) {
      if (!dragging) return;
      var f = getFractionFromX(e.clientX); targetTime = f * video.duration; previewAtFraction(f); maybeSeek(performance.now()); e.preventDefault();
    }
    function onPointerUp() {
      if (!dragging) return;
      dragging = false; player.setAttribute('data-timeline-drag', 'false'); rect = null; video.currentTime = targetTime;
      if (wasPlaying) safePlay(video); else { updateProgressVisuals(); updateTimeTexts(); }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
    }
    timeline.addEventListener('pointerdown', onPointerDown, { passive: false });
    if (handle) handle.addEventListener('pointerdown', onPointerDown, { passive: false });
  }

  var hoverTimer; var hoverHideDelay = 3000;
  function setHover(state) { if (player.getAttribute('data-player-hover') !== state) player.setAttribute('data-player-hover', state); }
  function scheduleHide() { clearTimeout(hoverTimer); hoverTimer = setTimeout(function() { setHover('idle'); }, hoverHideDelay); }
  function wakeControls() { setHover('active'); scheduleHide(); }
  player.addEventListener('pointerdown', wakeControls);
  document.addEventListener('fullscreenchange', wakeControls);
  document.addEventListener('webkitfullscreenchange', wakeControls);
  var trackingMove = false;
  function onPointerMoveGlobal(e) {
    var r = player.getBoundingClientRect();
    if (e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom) wakeControls();
  }
  player.addEventListener('pointerenter', function() {
    wakeControls();
    if (!trackingMove) { trackingMove = true; window.addEventListener('pointermove', onPointerMoveGlobal, { passive: true }); }
  });
  player.addEventListener('pointerleave', function() {
    setHover('idle'); clearTimeout(hoverTimer);
    if (trackingMove) { trackingMove = false; window.removeEventListener('pointermove', onPointerMoveGlobal); }
  });

  function closeLightbox() {
    ensureOpenUI(false);
    var hasPlayed = false;
    try {
      if (video.played && video.played.length) {
        for (var i = 0; i < video.played.length; i++) { if (video.played.end(i) > 0) { hasPlayed = true; break; } }
      } else { hasPlayed = video.currentTime > 0; }
    } catch(_) {}
    try { if (!video.paused && !video.ended) video.pause(); } catch(_) {}
    setActivated(false);
    setStatus(hasPlayed ? 'paused' : 'idle');
  }

  document.addEventListener('click', function(e) {
    var openBtn = e.target.closest('[data-bunny-lightbox-control="open"]');
    if (openBtn) {
      var src = openBtn.getAttribute('data-bunny-lightbox-src') || '';
      if (!src) return;
      var imgEl = openBtn.querySelector('[data-bunny-lightbox-placeholder]');
      openLightbox(src, imgEl ? imgEl.getAttribute('src') : '');
      return;
    }
    var closeBtn = e.target.closest('[data-bunny-lightbox-control="close"]');
    if (closeBtn && closeBtn.closest('[data-bunny-lightbox-status]') === wrapper) closeLightbox();
  });

  document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeLightbox(); });

  function pad2(n) { return (n < 10 ? '0' : '') + n; }
  function formatTime(sec) {
    if (!isFinite(sec) || sec < 0) return '00:00';
    var s = Math.floor(sec), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
    return h > 0 ? (h + ':' + pad2(m) + ':' + pad2(r)) : (pad2(m) + ':' + pad2(r));
  }
  function setText(nodes, text) { nodes.forEach(function(n) { n.textContent = text; }); }
  function safePlay(v) { var p = v.play(); if (p && typeof p.then === 'function') p.catch(function() {}); }
  function readyIfIdle(player, pendingPlay) {
    if (!pendingPlay && player.getAttribute('data-player-activated') !== 'true' && player.getAttribute('data-player-status') === 'idle') {
      player.setAttribute('data-player-status', 'ready');
    }
  }
  function setBeforeRatio(player, updateSize, w, h) {
    if (updateSize !== 'true' || !w || !h) return;
    var before = player.querySelector('[data-player-before]');
    if (before) before.style.paddingTop = (h / w * 100) + '%';
  }
  function updateBeforeRatioIOSSafe() {
    if (updateSize !== 'true') return;
    var before = player.querySelector('[data-player-before]');
    if (!before) return;
    function apply(w, h) {
      if (!w || !h) return;
      before.style.paddingTop = (h / w * 100) + '%';
      if (typeof player._applyClamp === 'function') player._applyClamp();
    }
    if (video.videoWidth && video.videoHeight) { apply(video.videoWidth, video.videoHeight); return; }
    if (player._hls && player._hls.levels && player._hls.levels.length) {
      var lvls = player._hls.levels;
      var best = lvls.reduce(function(a, b) { return ((b.width||0) > (a.width||0)) ? b : a; }, lvls[0]);
      if (best && best.width && best.height) { apply(best.width, best.height); return; }
    }
    requestAnimationFrame(function() {
      if (video.videoWidth && video.videoHeight) { apply(video.videoWidth, video.videoHeight); return; }
      var master = (typeof currentSrc === 'string' && currentSrc) ? currentSrc : '';
      if (!master || !/^https?:/i.test(master)) return;
      fetch(master, { credentials: 'omit', cache: 'no-store' })
        .then(function(r) { if (!r.ok) throw new Error(); return r.text(); })
        .then(function(txt) {
          var lines = txt.split(/\r?\n/), bestW = 0, bestH = 0, last = null;
          for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.indexOf('#EXT-X-STREAM-INF:') === 0) { last = line; }
            else if (last && line && line[0] !== '#') {
              var m = /RESOLUTION=(\d+)x(\d+)/.exec(last);
              if (m) { var W = parseInt(m[1], 10), H = parseInt(m[2], 10); if (W > bestW) { bestW = W; bestH = H; } }
              last = null;
            }
          }
          if (bestW && bestH) apply(bestW, bestH);
        })
        .catch(function() {});
    });
  }
}

// ==========================================================
// BUNNY PLAYER (HLS autoplay / click / hover)
// ==========================================================

function initBunnyPlayerBasic() {
  document.querySelectorAll('[data-bunny-player-init]').forEach(function(player) {
    var src = player.getAttribute('data-player-src');
    if (!src) return;

    var video = player.querySelector('video');
    if (!video) return;

    try { video.pause(); } catch(_) {}
    try { video.removeAttribute('src'); video.load(); } catch(_) {}

    function setStatus(s) {
      if (player.getAttribute('data-player-status') !== s) player.setAttribute('data-player-status', s);
    }
    function setActivated(v) { player.setAttribute('data-player-activated', v ? 'true' : 'false'); }
    if (!player.hasAttribute('data-player-activated')) setActivated(false);

    var updateSize = player.getAttribute('data-player-update-size');
    var lazyMode   = player.getAttribute('data-player-lazy');
    var isLazyTrue = lazyMode === 'true';
    var isLazyMeta = lazyMode === 'meta';
    var autoplay   = player.getAttribute('data-player-autoplay') === 'true';

    var pendingPlay = false;

    video.muted = !!autoplay;
    if (autoplay) video.loop = true;
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
    if (autoplay) video.autoplay = false;

    var isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl');
    var canUseHlsJs    = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

    if (updateSize === 'true' && !isLazyMeta && !isLazyTrue) {
      var prev = video.preload;
      video.preload = 'metadata';
      video.addEventListener('loadedmetadata', function onMeta2() {
        setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
        video.removeEventListener('loadedmetadata', onMeta2);
        video.preload = prev || '';
      });
      video.src = src;
    }

    function fetchMetaOnce() {
      getSourceMeta(src, canUseHlsJs).then(function(meta) {
        if (meta.width && meta.height) setBeforeRatio(player, updateSize, meta.width, meta.height);
        readyIfIdle(player, pendingPlay);
      });
    }

    var isAttached = false;
    var userInteracted = false;
    var lastPauseBy = '';

    function attachMediaOnce() {
      if (isAttached) return;
      isAttached = true;
      if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }
      if (isSafariNative) {
        video.preload = (isLazyTrue || isLazyMeta) ? 'auto' : video.preload;
        video.src = src;
        video.addEventListener('loadedmetadata', function() {
          readyIfIdle(player, pendingPlay);
          if (updateSize === 'true') setBeforeRatio(player, updateSize, video.videoWidth, video.videoHeight);
        }, { once: true });
      } else if (canUseHlsJs) {
        var hls = new Hls({ maxBufferLength: 10 });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function() { hls.loadSource(src); });
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          readyIfIdle(player, pendingPlay);
          if (updateSize === 'true') {
            var best = bestLevel(hls.levels || []);
            if (best && best.width && best.height) setBeforeRatio(player, updateSize, best.width, best.height);
          }
        });
        player._hls = hls;
      } else {
        video.src = src;
      }
    }

    if (isLazyMeta) {
      if (updateSize === 'true') fetchMetaOnce();
      video.preload = 'none';
    } else if (isLazyTrue) {
      video.preload = 'none';
    } else {
      attachMediaOnce();
    }

    function togglePlay() {
      userInteracted = true;
      if (video.paused || video.ended) {
        if ((isLazyTrue || isLazyMeta) && !isAttached) attachMediaOnce();
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

    player.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-player-control]');
      if (!btn || !player.contains(btn)) return;
      var type = btn.getAttribute('data-player-control');
      if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
      else if (type === 'mute') toggleMute();
    });

    video.addEventListener('play',    function() { setActivated(true); setStatus('playing'); });
    video.addEventListener('playing', function() { pendingPlay = false; setStatus('playing'); });
    video.addEventListener('pause',   function() { pendingPlay = false; setStatus('paused'); });
    video.addEventListener('waiting', function() { setStatus('loading'); });
    video.addEventListener('canplay', function() { readyIfIdle(player, pendingPlay); });
    video.addEventListener('ended',   function() { pendingPlay = false; setStatus('paused'); setActivated(false); });

    var ratioSet = false;
    function maybeSetRatioOnce() {
      if (ratioSet || updateSize !== 'true') return;
      var before = player.querySelector('[data-player-before]');
      if (!before || !video.videoWidth || !video.videoHeight) return;
      before.style.paddingTop = (video.videoHeight / video.videoWidth * 100) + '%';
      ratioSet = true;
    }
    video.addEventListener('loadedmetadata', maybeSetRatioOnce);
    video.addEventListener('loadeddata',     maybeSetRatioOnce);
    video.addEventListener('playing',        maybeSetRatioOnce);

    function setHover(state) {
      if (player.getAttribute('data-player-hover') !== state) player.setAttribute('data-player-hover', state);
    }
    player.addEventListener('pointerenter', function() { setHover('active'); });
    player.addEventListener('pointerleave', function() { setHover('idle'); });

    if (autoplay) {
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          var inView = entry.isIntersecting && entry.intersectionRatio > 0;
          if (inView) {
            if ((isLazyTrue || isLazyMeta) && !isAttached) attachMediaOnce();
            if (lastPauseBy === 'io' || (video.paused && lastPauseBy !== 'manual')) {
              setStatus('loading');
              if (video.paused) togglePlay();
              lastPauseBy = '';
            }
          } else {
            if (!video.paused && !video.ended) { lastPauseBy = 'io'; video.pause(); }
          }
        });
      }, { threshold: 0.1 });
      io.observe(player);
    }
  });

  function readyIfIdle(player, pendingPlay) {
    if (!pendingPlay &&
        player.getAttribute('data-player-activated') !== 'true' &&
        player.getAttribute('data-player-status') === 'idle') {
      player.setAttribute('data-player-status', 'ready');
    }
  }

  function setBeforeRatio(player, updateSize, w, h) {
    if (updateSize !== 'true' || !w || !h) return;
    var before = player.querySelector('[data-player-before]');
    if (before) before.style.paddingTop = (h / w * 100) + '%';
  }

  function bestLevel(levels) {
    if (!levels || !levels.length) return null;
    return levels.reduce(function(a, b) { return (b.width || 0) > (a.width || 0) ? b : a; }, levels[0]);
  }

  function safePlay(video) {
    var p = video.play();
    if (p && typeof p.then === 'function') p.catch(function() {});
  }

  function resolveUrl(base, rel) { try { return new URL(rel, base).toString(); } catch(_) { return rel; } }

  function getSourceMeta(src, useHlsJs) {
    return new Promise(function(resolve) {
      if (useHlsJs && window.Hls && Hls.isSupported()) {
        try {
          var tmp = new Hls();
          var out = { width: 0, height: 0, duration: NaN };
          tmp.on(Hls.Events.MANIFEST_PARSED, function(e, data) {
            var best = bestLevel((data && data.levels) || tmp.levels || []);
            if (best && best.width && best.height) { out.width = best.width; out.height = best.height; }
          });
          tmp.on(Hls.Events.LEVEL_LOADED, function(e, data) {
            if (data && data.details && isFinite(data.details.totalduration)) out.duration = data.details.totalduration;
          });
          tmp.on(Hls.Events.ERROR, function() { try { tmp.destroy(); } catch(_) {} resolve(out); });
          tmp.on(Hls.Events.LEVEL_LOADED, function() { try { tmp.destroy(); } catch(_) {} resolve(out); });
          tmp.loadSource(src);
          return;
        } catch(_) { resolve({ width: 0, height: 0, duration: NaN }); return; }
      }
      function parseMaster(text) {
        var lines = text.split(/\r?\n/), bestW = 0, bestH = 0, firstMedia = null, lastInf = null;
        for (var i = 0; i < lines.length; i++) {
          var line = lines[i];
          if (line.indexOf('#EXT-X-STREAM-INF:') === 0) { lastInf = line; }
          else if (lastInf && line && line[0] !== '#') {
            if (!firstMedia) firstMedia = line.trim();
            var m = /RESOLUTION=(\d+)x(\d+)/.exec(lastInf);
            if (m) { var w = parseInt(m[1], 10), h = parseInt(m[2], 10); if (w > bestW) { bestW = w; bestH = h; } }
            lastInf = null;
          }
        }
        return { bestW: bestW, bestH: bestH, media: firstMedia };
      }
      function sumDuration(text) {
        var dur = 0, re = /#EXTINF:([\d.]+)/g, m;
        while ((m = re.exec(text))) dur += parseFloat(m[1]);
        return dur;
      }
      fetch(src, { credentials: 'omit', cache: 'no-store' }).then(function(r) {
        if (!r.ok) throw new Error('master');
        return r.text();
      }).then(function(master) {
        var info = parseMaster(master);
        if (!info.media) { resolve({ width: info.bestW || 0, height: info.bestH || 0, duration: NaN }); return; }
        return fetch(resolveUrl(src, info.media), { credentials: 'omit', cache: 'no-store' }).then(function(r) {
          if (!r.ok) throw new Error('media');
          return r.text();
        }).then(function(mediaText) {
          resolve({ width: info.bestW || 0, height: info.bestH || 0, duration: sumDuration(mediaText) });
        });
      }).catch(function() { resolve({ width: 0, height: 0, duration: NaN }); });
    });
  }
}

// ==========================================================
// BOOT
// ==========================================================

document.addEventListener('DOMContentLoaded', () => {
  initLenis();

  const preloaderTl = initPreloader();
  if (preloaderTl) {
    preloaderTl.eventCallback('onComplete', () => {
      initAll();
      if (hasScrollTrigger) ScrollTrigger.refresh();
    });
  } else {
    initAll();
    if (hasScrollTrigger) ScrollTrigger.refresh();
  }
});
