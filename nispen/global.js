// ==========================================================
// NISPEN — GLOBAL JS
// Stack: GSAP, ScrollTrigger, SplitText, Lenis (geen Barba)
// ==========================================================

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, Observer, Draggable);

// Voorkomt dat de browser bij een refresh de scrollpositie herstelt vóórdat onze JS draait —
// anders denken de inViewport-checks (hero-checklist, fade-up, stagger-reveal) dat alles
// rond die positie al zichtbaar was bij het laden en slaan ze de scroll-animatie over.
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

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

      // clipPath op masks — knipt ascenders/descenders zonder de layout-hoogte te wijzigen (voorkomt jump bij revert)
      gsap.set(masks, { overflow: "visible", clipPath: "inset(-0.5em 0 -0.3em 0)" });;

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
// CARDS
// ==========================================================

function initCards() {
  const allCards = gsap.utils.toArray("[data-cards='card']");
  if (!allCards.length) return;

  // Groepeer per parent zodat siblings elkaar kunnen beïnvloeden
  const rowMap = new Map();
  allCards.forEach((card) => {
    const parent = card.parentElement;
    if (!rowMap.has(parent)) rowMap.set(parent, []);
    rowMap.get(parent).push(card);
  });

  rowMap.forEach((cards, row) => {
    if (row._cardsDestroy) {
      row._cardsDestroy();
      row._cardsDestroy = null;
    }

    // Lees de CSS rotatie uit voordat GSAP de transform overneemt
    const rotations = cards.map((card) => {
      const matrix = window.getComputedStyle(card).transform;
      if (!matrix || matrix === "none") return 0;
      const values = matrix.match(/matrix\(([^)]+)\)/);
      if (!values) return 0;
      const [a, b] = values[1].split(",").map(Number);
      return Math.round(Math.atan2(b, a) * (180 / Math.PI) * 10) / 10;
    });

    gsap.set(cards, { transformPerspective: 600, autoAlpha: 0 });
    cards.forEach((card, i) => gsap.set(card, { rotation: rotations[i] }));

    function playEntrance() {
      gsap.fromTo(
        cards,
        { y: 70, autoAlpha: 0, rotation: (i) => rotations[i] * 2.5 },
        {
          y: 0, autoAlpha: 1, rotation: (i) => rotations[i],
          duration: 1.2, ease: "elastic.out(0.8, 0.6)",
          stagger: { each: 0.08 },
        }
      );
    }

    const inViewport = row.getBoundingClientRect().top < window.innerHeight;
    let entranceST = null;

    if (inViewport) {
      playEntrance();
    } else {
      entranceST = ScrollTrigger.create({
        trigger: row,
        start: "clamp(top 85%)",
        once: true,
        onEnter: playEntrance,
      });
    }

    const mm = gsap.matchMedia();

    // Desktop: elastic hover + 3D tilt
    mm.add("(hover: hover)", () => {
      const cleanup = [];

      cards.forEach((card, i) => {
        const onEnter = () => {
          gsap.to(card, {
            rotation: 0, scale: 1.05, y: -10,
            duration: 0.55, ease: "elastic.out(1, 0.5)", overwrite: "auto",
          });
          cards.forEach((sib, j) => {
            if (j !== i) gsap.to(sib, { scale: 0.97, duration: 0.4, ease: "power2.out", overwrite: "auto" });
          });
        };

        const onLeave = () => {
          gsap.to(card, {
            rotation: rotations[i], scale: 1, y: 0, rotateX: 0, rotateY: 0,
            duration: 0.7, ease: "elastic.out(0.9, 0.4)", overwrite: "auto",
          });
          cards.forEach((sib, j) => {
            if (j !== i) gsap.to(sib, { scale: 1, duration: 0.5, ease: "elastic.out(1, 0.4)", overwrite: "auto" });
          });
        };

        const onMove = (e) => {
          const rect = card.getBoundingClientRect();
          const dx = (e.clientX - (rect.left + rect.width  / 2)) / (rect.width  / 2);
          const dy = (e.clientY - (rect.top  + rect.height / 2)) / (rect.height / 2);
          gsap.to(card, {
            rotateY:  dx * 8,
            rotateX: -dy * 8,
            duration: 0.4, ease: "power2.out", overwrite: "auto",
          });
        };

        card.addEventListener("mouseenter", onEnter);
        card.addEventListener("mouseleave", onLeave);
        card.addEventListener("mousemove", onMove);
        cleanup.push(() => {
          card.removeEventListener("mouseenter", onEnter);
          card.removeEventListener("mouseleave", onLeave);
          card.removeEventListener("mousemove", onMove);
        });
      });

      return () => cleanup.forEach((fn) => fn());
    });

    // Mobile: tap bounce
    mm.add("(hover: none)", () => {
      const cleanup = [];

      cards.forEach((card, i) => {
        const onTap = () => {
          gsap.timeline()
            .to(card, { rotation: 0, scale: 1.06, y: -14, duration: 0.35, ease: "power3.out" })
            .to(card, { rotation: rotations[i], scale: 1, y: 0, duration: 0.7, ease: "elastic.out(1, 0.4)" });
        };
        card.addEventListener("click", onTap);
        cleanup.push(() => card.removeEventListener("click", onTap));
      });

      return () => cleanup.forEach((fn) => fn());
    });

    row._cardsDestroy = () => {
      if (entranceST) entranceST.kill();
      mm.revert();
      gsap.killTweensOf(cards);
    };
  });
}

// ==========================================================
// DRAGGABLE MARQUEE
// ==========================================================

function initDraggableMarquee() {
  const wrappers = gsap.utils.toArray("[data-draggable-marquee-init]");
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

    const collection = wrapper.querySelector("[data-draggable-marquee-collection]");
    const list       = wrapper.querySelector("[data-draggable-marquee-list]");
    if (!collection || !list) return;

    const duration    = getNumberAttr(wrapper, "data-duration", 20);
    const multiplier  = getNumberAttr(wrapper, "data-multiplier", 40);
    const sensitivity = getNumberAttr(wrapper, "data-sensitivity", 0.01);

    const wrapperWidth = wrapper.getBoundingClientRect().width;
    const listWidth    = list.scrollWidth || list.getBoundingClientRect().width;
    if (!wrapperWidth || !listWidth) return;

    // Dupliceer totdat de collectie breed genoeg is
    const minRequiredWidth = wrapperWidth + listWidth + 2;
    while (collection.scrollWidth < minRequiredWidth) {
      const listClone = list.cloneNode(true);
      listClone.setAttribute("data-draggable-marquee-clone", "");
      listClone.setAttribute("aria-hidden", "true");
      collection.appendChild(listClone);
    }

    const wrapX = gsap.utils.wrap(-listWidth, 0);
    gsap.set(collection, { x: 0 });

    const marqueeLoop = gsap.to(collection, {
      x: -listWidth,
      duration,
      ease: "none",
      repeat: -1,
      onReverseComplete: () => marqueeLoop.progress(1),
      modifiers: { x: (x) => wrapX(parseFloat(x)) + "px" },
    });

    const initialDirectionAttr = (wrapper.getAttribute("data-direction") || "left").toLowerCase();
    const baseDirection = initialDirectionAttr === "right" ? -1 : 1;
    const timeScale = { value: baseDirection };

    wrapper.setAttribute("data-direction", baseDirection < 0 ? "right" : "left");
    if (baseDirection < 0) marqueeLoop.progress(1);

    function applyTimeScale() {
      marqueeLoop.timeScale(timeScale.value);
      wrapper.setAttribute("data-direction", timeScale.value < 0 ? "right" : "left");
    }
    applyTimeScale();

    const marqueeObserver = Observer.create({
      target: wrapper,
      type: "pointer,touch",
      preventDefault: true,
      debounce: false,
      onDrag: (self) => {
        let velocityTimeScale = self.velocityX * -sensitivity;
        velocityTimeScale = gsap.utils.clamp(-multiplier, multiplier, velocityTimeScale);
        gsap.killTweensOf(timeScale);
        const restingDirection = velocityTimeScale < 0 ? -1 : 1;
        gsap.timeline({ onUpdate: applyTimeScale })
          .to(timeScale, { value: velocityTimeScale, duration: 0.1, overwrite: true })
          .to(timeScale, { value: restingDirection, duration: 1.0 });
      },
    });

    // IntersectionObserver ipv ScrollTrigger — niet gevoelig voor pin-spacer layout shifts
    const io = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        marqueeLoop.resume();
        applyTimeScale();
        marqueeObserver.enable();
      } else {
        marqueeLoop.pause();
        marqueeObserver.disable();
      }
    }, { threshold: 0 });

    io.observe(wrapper);

    wrapper._marqueeDestroy = () => {
      io.disconnect();
      marqueeLoop.kill();
      marqueeObserver.kill();
      gsap.killTweensOf(timeScale);
      gsap.set(collection, { clearProps: "x" });
      collection.querySelectorAll("[data-draggable-marquee-clone]").forEach((el) => el.remove());
    };

    gsap.to(wrapper, { opacity: 1, duration: 0.6, ease: "power2.out", delay: 0.2 });
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

    const arrow = btn.querySelector("[data-btn-arrow]");

    const onDown = () => gsap.to(btn, { scale: 0.97, duration: 0.15, ease: "power2.out", overwrite: "auto" });
    const onUp   = () => gsap.to(btn, { scale: 1.04, duration: 0.3, ease: "elastic.out(1.2, 0.4)", overwrite: "auto" });

    btn.addEventListener("mousedown", onDown);
    btn.addEventListener("mouseup", onUp);

    // Magnetic pull + arrow-slide — alleen op devices met een echte cursor
    const mm = gsap.matchMedia();

    mm.add("(hover: hover)", () => {
      const xTo = gsap.quickTo(btn, "x", { duration: 0.5, ease: "power3.out" });
      const yTo = gsap.quickTo(btn, "y", { duration: 0.5, ease: "power3.out" });
      const arrowXTo = arrow ? gsap.quickTo(arrow, "x", { duration: 0.4, ease: "power3.out" }) : null;

      const onEnter = () => {
        gsap.to(btn, { scale: 1.04, duration: 0.4, ease: "elastic.out(1.2, 0.4)", overwrite: "auto" });
        if (arrowXTo) arrowXTo(6);
      };
      const onLeave = () => {
        gsap.to(btn, { scale: 1, duration: 0.4, ease: "elastic.out(1.2, 0.4)", overwrite: "auto" });
        xTo(0);
        yTo(0);
        if (arrowXTo) arrowXTo(0);
      };
      const onMove = (e) => {
        const rect = btn.getBoundingClientRect();
        xTo((e.clientX - (rect.left + rect.width / 2)) * 0.25);
        yTo((e.clientY - (rect.top + rect.height / 2)) * 0.25);
      };

      btn.addEventListener("mouseenter", onEnter);
      btn.addEventListener("mousemove", onMove);
      btn.addEventListener("mouseleave", onLeave);

      return () => {
        btn.removeEventListener("mouseenter", onEnter);
        btn.removeEventListener("mousemove", onMove);
        btn.removeEventListener("mouseleave", onLeave);
        gsap.set(btn, { clearProps: "x,y" });
        if (arrow) gsap.set(arrow, { clearProps: "x" });
      };
    });

    btn._btnHoverDestroy = () => {
      btn.removeEventListener("mousedown", onDown);
      btn.removeEventListener("mouseup", onUp);
      mm.revert();
    };
  });
}

// ==========================================================
// IMAGE HOVER (SCALE + TAG PARALLAX)
// ==========================================================

function initImageHover() {
  const wraps = gsap.utils.toArray("[data-image-hover]");
  if (!wraps.length) return;

  wraps.forEach((wrap) => {
    if (wrap._imageHoverDestroy) {
      wrap._imageHoverDestroy();
      wrap._imageHoverDestroy = null;
    }

    const image = wrap.querySelector("[data-image-hover-target]") || wrap.querySelector("img");
    if (!image) return;

    const tag = wrap.querySelector("[data-image-hover-tag]");

    const mm = gsap.matchMedia();

    mm.add("(hover: hover)", () => {
      const onEnter = () => {
        gsap.to(image, { scale: 1.08, duration: 0.8, ease: "expo.out", overwrite: "auto" });
        if (tag) gsap.to(tag, { y: -6, duration: 0.6, ease: "expo.out", overwrite: "auto" });
      };
      const onLeave = () => {
        gsap.to(image, { scale: 1, duration: 0.9, ease: "expo.out", overwrite: "auto" });
        if (tag) gsap.to(tag, { y: 0, duration: 0.7, ease: "expo.out", overwrite: "auto" });
      };

      wrap.addEventListener("mouseenter", onEnter);
      wrap.addEventListener("mouseleave", onLeave);

      return () => {
        wrap.removeEventListener("mouseenter", onEnter);
        wrap.removeEventListener("mouseleave", onLeave);
        gsap.set(image, { clearProps: "scale" });
        if (tag) gsap.set(tag, { clearProps: "y" });
      };
    });

    wrap._imageHoverDestroy = () => mm.revert();
  });
}

// ==========================================================
// LINK UNDERLINE WIPE
// ==========================================================

function initLinkUnderline() {
  const links = gsap.utils.toArray("[data-link-underline]");
  if (!links.length) return;

  links.forEach((link) => {
    if (link._underlineDestroy) {
      link._underlineDestroy();
      link._underlineDestroy = null;
    }

    let underline = link.querySelector(":scope > .js-link-underline");
    if (!underline) {
      underline = document.createElement("span");
      underline.className = "js-link-underline";
      underline.style.cssText =
        "position:absolute;left:0;bottom:-0.1em;width:100%;height:1px;background:currentColor;transform:scaleX(0);pointer-events:none;";
      if (!link.style.position) link.style.position = "relative";
      if (getComputedStyle(link).display === "inline") link.style.display = "inline-block";
      link.appendChild(underline);
    }

    gsap.set(underline, { scaleX: 0, transformOrigin: "left" });

    const onEnter = () => gsap.to(underline, { scaleX: 1, transformOrigin: "left", duration: 0.5, ease: "expo.out", overwrite: "auto" });
    const onLeave = () => gsap.to(underline, { scaleX: 0, transformOrigin: "right", duration: 0.4, ease: "expo.inOut", overwrite: "auto" });

    link.addEventListener("mouseenter", onEnter);
    link.addEventListener("mouseleave", onLeave);

    link._underlineDestroy = () => {
      link.removeEventListener("mouseenter", onEnter);
      link.removeEventListener("mouseleave", onLeave);
    };
  });
}

// ==========================================================
// STAGGER REVEAL (GRIDS/LISTS)
// ==========================================================

function initStaggerReveal() {
  const wraps = gsap.utils.toArray("[data-stagger-reveal]");
  if (!wraps.length) return;

  wraps.forEach((wrap) => {
    if (wrap._staggerRevealDestroy) {
      wrap._staggerRevealDestroy();
      wrap._staggerRevealDestroy = null;
    }

    const items = Array.from(wrap.children);
    if (!items.length) return;

    gsap.set(items, { autoAlpha: 0, y: 24 });

    function playReveal() {
      gsap.to(items, {
        autoAlpha: 1,
        y: 0,
        duration: 0.5,
        ease: "expo.out",
        stagger: 0.06,
      });
    }

    const inViewport = wrap.getBoundingClientRect().top < window.innerHeight;
    let st = null;

    if (inViewport) {
      playReveal();
    } else {
      st = ScrollTrigger.create({
        trigger: wrap,
        start: "top 85%",
        once: true,
        onEnter: playReveal,
      });
    }

    wrap._staggerRevealDestroy = () => { if (st) st.kill(); };
  });
}

// ==========================================================
// TEXT ROTATE (CYCLE THROUGH ITEMS)
// ==========================================================

function initTextRotate() {
  const wraps = gsap.utils.toArray("[data-text-rotate]");
  if (!wraps.length) return;

  wraps.forEach((wrap) => {
    if (wrap._textRotateDestroy) {
      wrap._textRotateDestroy();
      wrap._textRotateDestroy = null;
    }

    const items = Array.from(wrap.children);
    if (items.length < 2) return;

    const hold = parseFloat(wrap.dataset.textRotateInterval) || 2.5;

    // Eén item blijft staan (met zijn eigen icoon) en wisselt van tekst — geen stapelen,
    // meten of matchMedia nodig. Wrap-gedrag per breakpoint regel je gewoon in Webflow,
    // want dit is weer normale in-flow content.
    const activeItem = items[0];
    const textEl = activeItem.querySelector(".text_main") || activeItem;
    const words = items.map((item) => (item.querySelector(".text_main") || item).textContent.trim());

    items.slice(1).forEach((item) => item.remove());

    if (reducedMotion) return;

    let index = 0;

    const tl = gsap.timeline({ repeat: -1, repeatDelay: hold });

    tl.to(textEl, { autoAlpha: 0, yPercent: -20, duration: 0.4, ease: "expo.inOut" })
      .call(() => {
        index = (index + 1) % words.length;
        textEl.textContent = words[index];
      })
      .fromTo(textEl, { yPercent: 20 }, { autoAlpha: 1, yPercent: 0, duration: 0.4, ease: "expo.out" });

    const onVisibilityChange = () => {
      if (document.hidden) tl.pause();
      else tl.play();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    wrap._textRotateDestroy = () => {
      tl.kill();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      gsap.set(textEl, { clearProps: "all" });
    };
  });
}

// ==========================================================
// FADE UP (GENERIC SCROLL REVEAL)
// ==========================================================

function initFadeUp() {
  const els = gsap.utils.toArray("[data-fade-up]");
  if (!els.length) return;

  els.forEach((el) => {
    if (el._fadeUpDestroy) {
      el._fadeUpDestroy();
      el._fadeUpDestroy = null;
    }

    gsap.set(el, { autoAlpha: 0, y: 24 });

    function playReveal() {
      gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" });
    }

    const inViewport = el.getBoundingClientRect().top < window.innerHeight;
    let st = null;

    if (inViewport) {
      playReveal();
    } else {
      st = ScrollTrigger.create({
        trigger: el,
        start: "top 85%",
        once: true,
        onEnter: playReveal,
      });
    }

    el._fadeUpDestroy = () => { if (st) st.kill(); };
  });
}

// ==========================================================
// LIVE PULSE (INFINITE DOT)
// ==========================================================

function initLivePulse() {
  const dots = gsap.utils.toArray("[data-live-pulse]");
  if (!dots.length) return;

  dots.forEach((dot) => {
    if (dot._livePulseTween) dot._livePulseTween.kill();
    dot._livePulseTween = gsap.to(dot, {
      scale: 1.4,
      opacity: 0.4,
      duration: 1,
      ease: "power1.inOut",
      repeat: -1,
      yoyo: true,
      transformOrigin: "center center",
    });
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
// PIN GROW
// ==========================================================

function initPinGrow() {
  const sections = gsap.utils.toArray("[data-pin-grow='section']");
  if (!sections.length) return;

  sections.forEach((section) => {
    if (section._pinGrowDestroy) {
      section._pinGrowDestroy();
      section._pinGrowDestroy = null;
    }

    const wrapper = section.querySelector("[data-pin-grow='wrapper']");
    const content = section.querySelector("[data-pin-grow='content']");
    if (!wrapper) return;

    const mm = gsap.matchMedia();

    mm.add("(min-width: 992px)", () => {
      gsap.set(wrapper, { scale: 0.75, transformOrigin: "center center" });
      if (content) gsap.set(content, { y: 60, autoAlpha: 0 });

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=90%",
          pin: true,
          scrub: 0.5,
          pinSpacing: true,
        },
      });

      tl
        .to(wrapper, { scale: 1, duration: 1, ease: "none" }, 0)
        .to(content, { y: 0, autoAlpha: 1, duration: 0.35, ease: "none" }, 0.65);

      return () => {
        gsap.set([wrapper, content].filter(Boolean), { clearProps: "all" });
      };
    });

    section._pinGrowDestroy = () => mm.revert();
  });
}

// ==========================================================
// STAT COUNTERS
// ==========================================================

function initCounters() {
  const els = gsap.utils.toArray("[data-counter]");
  if (!els.length) return;

  els.forEach((el) => {
    const text   = el.textContent.trim();
    const match  = text.match(/^([\d.]+)(.*)/);
    if (!match) return;

    const numStr = match[1]; // e.g. "345.725.00" or "859.234"
    const suffix = match[2]; // e.g. " M²" or ""

    // Splits: als laatste groep na punt 2 cijfers heeft → decimaal, anders duizendtal-sep
    const groups    = numStr.split(".");
    const lastGroup = groups[groups.length - 1];
    const hasDecimals = groups.length >= 3 && lastGroup.length === 2;

    let target, format;

    if (hasDecimals) {
      target = parseInt(groups.slice(0, -1).join(""), 10) + parseInt(lastGroup, 10) / 100;
      format = (n) => {
        const int = Math.floor(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
        const dec = (n % 1).toFixed(2).slice(2);
        return int + "." + dec;
      };
    } else {
      target = parseInt(groups.join(""), 10);
      format = (n) => Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    }

    if (!Number.isFinite(target)) return;

    gsap.set(el, { autoAlpha: 0, y: 16 });

    ScrollTrigger.create({
      trigger: el,
      start: "clamp(top 88%)",
      once: true,
      onEnter: () => {
        gsap.to(el, { autoAlpha: 1, y: 0, duration: 0.5, ease: "expo.out" });

        const counter = { value: 0 };
        gsap.to(counter, {
          value: target,
          duration: 2.2,
          ease: "power4.out",
          onUpdate: () => { el.textContent = format(counter.value) + suffix; },
          onComplete: () => { el.textContent = format(target) + suffix; },
        });
      },
    });
  });
}

// ==========================================================
// BUNNY PLAYER BACKGROUND
// ==========================================================

function initBunnyPlayerBackground() {
  document.querySelectorAll('[data-bunny-background-init]').forEach((player) => {
    if (player._bunnyDestroy) {
      player._bunnyDestroy();
      player._bunnyDestroy = null;
    }

    const src = player.getAttribute('data-player-src');
    if (!src) return;

    const video = player.querySelector('video');
    if (!video) return;

    try { video.pause(); } catch (_) {}
    try { video.removeAttribute('src'); video.load(); } catch (_) {}

    function setStatus(s) {
      if (player.getAttribute('data-player-status') !== s) {
        player.setAttribute('data-player-status', s);
      }
    }
    function setActivated(v) { player.setAttribute('data-player-activated', v ? 'true' : 'false'); }
    if (!player.hasAttribute('data-player-activated')) setActivated(false);

    const lazyMode    = player.getAttribute('data-player-lazy');
    const isLazyTrue  = lazyMode === 'true';
    const autoplay    = player.getAttribute('data-player-autoplay') === 'true';
    const initialMuted = player.getAttribute('data-player-muted') === 'true';

    let pendingPlay = false;
    let isAttached  = false;
    let lastPauseBy = '';

    if (autoplay) { video.muted = true; video.loop = true; }
    else { video.muted = initialMuted; }

    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
    if (autoplay) video.autoplay = false;

    const isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl');
    const canUseHlsJs    = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

    function attachMediaOnce() {
      if (isAttached) return;
      isAttached = true;

      if (player._hls) { try { player._hls.destroy(); } catch (_) {} player._hls = null; }

      if (isSafariNative) {
        video.preload = isLazyTrue ? 'none' : 'auto';
        video.src = src;
        video.addEventListener('loadedmetadata', () => readyIfIdle(player, pendingPlay), { once: true });
      } else if (canUseHlsJs) {
        const hls = new Hls({ maxBufferLength: 10 });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
        hls.on(Hls.Events.MANIFEST_PARSED, () => readyIfIdle(player, pendingPlay));
        player._hls = hls;
      } else {
        video.src = src;
      }
    }

    if (isLazyTrue) {
      video.preload = 'none';
    } else {
      attachMediaOnce();
    }

    function togglePlay() {
      if (video.paused || video.ended) {
        if (isLazyTrue && !isAttached) attachMediaOnce();
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

    function handleControlClick(e) {
      const btn = e.target.closest('[data-player-control]');
      if (!btn || !player.contains(btn)) return;
      const type = btn.getAttribute('data-player-control');
      if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
      else if (type === 'mute') toggleMute();
    }

    player.addEventListener('click', handleControlClick);

    video.addEventListener('play',    () => { setActivated(true); setStatus('playing'); });
    video.addEventListener('playing', () => { pendingPlay = false; setStatus('playing'); });
    video.addEventListener('pause',   () => { pendingPlay = false; setStatus('paused'); });
    video.addEventListener('waiting', () => { setStatus('loading'); });
    video.addEventListener('canplay', () => {
      if (pendingPlay) safePlay(video);
      readyIfIdle(player, pendingPlay);
    });
    video.addEventListener('ended',   () => { pendingPlay = false; setStatus('paused'); setActivated(false); });

    let io = null;

    if (autoplay) {
      io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const inView = entry.isIntersecting && entry.intersectionRatio > 0;
          if (inView) {
            if (isLazyTrue && !isAttached) attachMediaOnce();
            if (lastPauseBy === 'io' || (video.paused && lastPauseBy !== 'manual')) {
              setStatus('loading');
              if (video.paused) togglePlay();
              lastPauseBy = '';
            }
          } else {
            if (!video.paused && !video.ended) {
              lastPauseBy = 'io';
              video.pause();
            }
          }
        });
      }, { threshold: 0.1 });
      io.observe(player);
    }

    player._bunnyDestroy = () => {
      player.removeEventListener('click', handleControlClick);
      if (io) { io.disconnect(); io = null; }
      if (player._hls) { try { player._hls.destroy(); } catch (_) {} player._hls = null; }
      try { video.pause(); } catch (_) {}
    };
  });

  function readyIfIdle(player, pendingPlay) {
    if (
      !pendingPlay &&
      player.getAttribute('data-player-activated') !== 'true' &&
      player.getAttribute('data-player-status') === 'idle'
    ) {
      player.setAttribute('data-player-status', 'ready');
    }
  }

  function safePlay(video) {
    const p = video.play();
    if (p && typeof p.then === 'function') p.catch(() => {});
  }
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
  initNavHideOnScroll();
  initHeadingReveal();
  initGlobalParallax();
  initPinGrow();
  initMarqueeScrollDirection();
  initAccordionCSS();
  initCards();
  initDraggableMarquee();
  initBtnHover();
  initImageHover();
  initLinkUnderline();
  initStaggerReveal();
  initTextRotate();
  initFadeUp();
  initLivePulse();
  initSideNavWipeEffect();
  initProgressNavigation();
  initCounters();
  initBasicFormValidation();
  initBunnyPlayerBackground();
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
