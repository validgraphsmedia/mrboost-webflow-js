// ==========================================================
// ELEVATION GROUP — GLOBAL JS
// Stack: GSAP, ScrollTrigger, SplitText, Lenis
// ==========================================================

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, Observer);

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
  const headings = gsap.utils.toArray("h1, h2, h3, h4");
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
    const splits = headings.map((el) =>
      SplitText.create(el, { type: "lines", mask: "lines", autoSplit: true })
    );

    headings.forEach((el, i) => {
      const lines = splits[i].lines;
      const masks = lines.map((line) => line.parentElement);

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
      duration: 12,
      ease: 'sine.inOut',
      repeat: -1,
      yoyo: true,
    });
  }

  if (bg2) {
    gsap.to(bg2, {
      x: '-15vw',
      opacity: 0.25,
      duration: 10,
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

    let segments = parseSegments(newText);
    segments = mapStartDigits(segments, startValue);
    segments = markHiddenSegments(segments, startValue);
    const { rollers, revealEls } = buildRollerDOM(el, segments, step, true);

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
    const rollers = [], revealEls = [];
    const totalCells = 10 * defaults.digitCycles;

    segments.forEach(seg => {
      if (seg.type === 'static') {
        const span = document.createElement('span');
        span.setAttribute('data-odometer-part', 'static');
        span.style.height = step + 'em';
        span.style.lineHeight = step;
        span.textContent = seg.char;
        el.appendChild(span);
        if (grow && seg.hidden) { gsap.set(span, { opacity: 0 }); revealEls.push(span); }
        return;
      }
      const mask   = document.createElement('span');
      mask.setAttribute('data-odometer-part', 'mask');
      mask.style.height = step + 'em';
      mask.style.lineHeight = step;
      const roller = document.createElement('span');
      roller.setAttribute('data-odometer-part', 'roller');
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

  function cleanupElement(el, originalText) {
    el.style.overflow = '';
    el.style.height   = '';
    const digits = [...originalText].filter(c => /\d/.test(c));
    let di = 0;
    el.querySelectorAll('[data-odometer-part="mask"]').forEach(mask => {
      const roller = mask.querySelector('[data-odometer-part="roller"]');
      if (roller) roller.remove();
      mask.textContent = digits[di++] || '';
      mask.style.opacity  = '';
      mask.style.overflow = '';
    });
    el.querySelectorAll('[data-odometer-part="static"]').forEach(stat => {
      stat.style.opacity = '';
    });
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
    const track  = slider.querySelector('[data-odometer-slider-track]');
    const handle = slider.querySelector('[data-odometer-slider-handle]');
    const fill   = slider.querySelector('[data-odometer-slider-fill]');
    const labels = Array.from(slider.querySelectorAll('[data-odometer-slider-label]'));
    if (!track || !handle) return;

    const stepCount = Math.max(1, labels.length - 1);
    let currentStep = 0;
    let isDragging  = false;

    // Odometer targets — zoek eerst de dichtstbijzijnde ancestor, dan via ID
    const groupId = slider.getAttribute('data-odometer-slider-group');
    const group   = slider.closest('[data-odometer-group]')
      || (groupId ? document.querySelector(`[data-odometer-group="${groupId}"]`) : null);
    const targets = group ? Array.from(group.querySelectorAll('[data-odometer-element]')) : [];

    function getUsable() {
      return track.offsetWidth - handle.offsetWidth;
    }

    function applyStep(step, animate) {
      currentStep = Math.max(0, Math.min(stepCount, step));
      const x   = (currentStep / stepCount) * getUsable();
      const pct = currentStep / stepCount;

      if (animate) {
        gsap.to(handle, { x, duration: 0.4, ease: 'expo.out' });
        if (fill) gsap.to(fill, { width: `${pct * 100}%`, duration: 0.4, ease: 'expo.out' });
      } else {
        gsap.set(handle, { x });
        if (fill) gsap.set(fill, { width: `${pct * 100}%` });
      }

      labels.forEach((label, i) => {
        label.setAttribute('data-active', i === currentStep ? 'true' : 'false');
      });

      if (updateOdometer) {
        targets.forEach(el => {
          const values = (el.getAttribute('data-odometer-values') || '').split(',').map(v => v.trim());
          if (values[currentStep]) updateOdometer(el, values[currentStep]);
        });
      }
    }

    applyStep(0, false);

    // Drag op handle
    handle.addEventListener('pointerdown', e => {
      isDragging = true;
      handle.setPointerCapture(e.pointerId);
      e.preventDefault();
    });

    handle.addEventListener('pointermove', e => {
      if (!isDragging) return;
      const rect    = track.getBoundingClientRect();
      const usable  = getUsable();
      const rawX    = e.clientX - rect.left - handle.offsetWidth / 2;
      const x       = Math.max(0, Math.min(usable, rawX));
      gsap.set(handle, { x });
      if (fill) gsap.set(fill, { width: `${(x / usable) * 100}%` });
    });

    handle.addEventListener('pointerup', () => {
      if (!isDragging) return;
      isDragging = false;
      const x    = gsap.getProperty(handle, 'x');
      const step = Math.round((x / getUsable()) * stepCount);
      applyStep(step, true);
    });

    // Klik op track
    track.addEventListener('click', e => {
      if (handle.contains(e.target)) return;
      const rect = track.getBoundingClientRect();
      const step = Math.round(((e.clientX - rect.left) / rect.width) * stepCount);
      applyStep(step, true);
    });

    // Klik op labels
    labels.forEach((label, i) => {
      label.addEventListener('click', () => applyStep(i, true));
    });

    // Herbereken na resize
    window.addEventListener('resize', () => applyStep(currentStep, false), { passive: true });
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
  initStripedButtons();
  initAdvancedFormValidation();
  initLogoWallCycle();
  initHeroGradient();
  initButtonCharacterStagger();
  updateOdometer = initNumberOdometer();
  initOdometerSlider();
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
