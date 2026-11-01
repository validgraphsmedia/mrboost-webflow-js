// ==========================================================
// STERCQ — global.js
// Stack: GSAP (+ ScrollTrigger, CustomEase, SplitText), Lenis, Barba.
// Draggable en matter-js laden we zelf, alleen op pagina's die ze nodig hebben.
// Doel: licht, snel, smooth — Lenis bijna native, korte Barba-transities
// ==========================================================

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

gsap.registerPlugin(ScrollTrigger, CustomEase);
if (window.Draggable) gsap.registerPlugin(Draggable);

// SplitText is nodig voor data-tr="lines|chars" — laat een ontbrekende plugin global.js niet breken
if (window.SplitText) gsap.registerPlugin(SplitText);

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
// LENIS SCROLL
// Hoge lerp = korte nasleep, voelt bijna native (Bodak draait op 0.2).
// Touch blijft native scroll.
// ==========================================================

function initLenis() {
  if (lenis) return;
  if (reducedMotion) return;

  lenis = new Lenis({
    lerp: 0.2,
    wheelMultiplier: 1,
    smoothWheel: true,
    syncTouch: false,
    stopInertiaOnNavigate: true,
  });

  lenis.on("scroll", ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
}

function lockScroll() {
  lenis?.stop();
  document.documentElement.classList.add("is-scroll-locked");
}

function unlockScroll() {
  lenis?.start();
  document.documentElement.classList.remove("is-scroll-locked");
}

function resetScroll() {
  if (lenis) lenis.scrollTo(0, { immediate: true, force: true });
  else window.scrollTo(0, 0);
}

// ==========================================================
// WEBFLOW REINIT
// Webflow koppelt IX2/forms aan data-wf-page — na een Barba-swap overnemen.
// ==========================================================

function reinitWebflow(nextHtml) {
  if (nextHtml) {
    const nextDoc = new DOMParser().parseFromString(nextHtml, "text/html");
    const pageId = nextDoc.documentElement.getAttribute("data-wf-page");
    if (pageId) document.documentElement.setAttribute("data-wf-page", pageId);
  }

  if (!window.Webflow) return;
  window.Webflow.destroy?.();
  window.Webflow.ready?.();
  window.Webflow.require?.("ix2")?.init();
}

function updateCurrentNav() {
  const path = window.location.pathname;
  document.querySelectorAll("a[href]").forEach((link) => {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || link.origin !== window.location.origin) return;
    const linkPath = new URL(link.href, window.location.origin).pathname;
    const isCurrent = linkPath === path;
    link.classList.toggle("w--current", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
  });
}

// ==========================================================
// BOLD FULL SCREEN NAVIGATION
// Staat buiten de Barba-container → één keer initten, niet per pagina.
// data-navigation-status="not-active|active" op de nav-wrapper
// data-navigation-toggle="toggle|close" op de knoppen
// ==========================================================

function setNavigationStatus(isActive) {
  const navStatusEl = document.querySelector("[data-navigation-status]");
  if (!navStatusEl) return;

  const wasActive = navStatusEl.getAttribute("data-navigation-status") === "active";
  if (wasActive === isActive) return;

  navStatusEl.setAttribute("data-navigation-status", isActive ? "active" : "not-active");
  if (isActive) lockScroll();
  else unlockScroll();
}

function closeNavigation() {
  setNavigationStatus(false);
}

function initBoldFullScreenNavigation() {
  const navStatusEl = document.querySelector("[data-navigation-status]");
  if (!navStatusEl || navStatusEl._navInit) return;
  navStatusEl._navInit = true;

  // Altijd dicht starten, ook als hij in de Designer op "active" staat
  navStatusEl.setAttribute("data-navigation-status", "not-active");

  document.addEventListener("click", (e) => {
    const toggleBtn = e.target.closest("[data-navigation-toggle]");
    if (!toggleBtn) return;

    if (toggleBtn.getAttribute("data-navigation-toggle") === "close") {
      closeNavigation();
    } else {
      const isActive = navStatusEl.getAttribute("data-navigation-status") === "active";
      setNavigationStatus(!isActive);
    }
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeNavigation();
  });
}

// ==========================================================
// REVEAL — data-reveal (fade-up bij in beeld komen)
// data-reveal-delay="0.1" optioneel
// ==========================================================

function initReveal(scope = document) {
  const items = scope.querySelectorAll("[data-reveal]");
  if (!items.length) return;

  if (reducedMotion) {
    gsap.set(items, { autoAlpha: 1, y: 0 });
    return;
  }

  items.forEach((el) => {
    gsap.fromTo(
      el,
      { autoAlpha: 0, y: "2rem" },
      {
        autoAlpha: 1,
        y: 0,
        duration: 0.9,
        ease: "expo.out",
        delay: parseFloat(el.getAttribute("data-reveal-delay")) || 0,
        scrollTrigger: { trigger: el, start: "clamp(top 90%)", once: true },
      }
    );
  });
}

// ==========================================================
// MARQUEE — scroll-richting en scroll-snelheid
// data-marquee-scroll-direction-target op de wrapper
// ==========================================================

function initMarqueeScrollDirection(scope = document) {
  const marquees = [
    ...(scope.nodeType === 1 && scope.matches("[data-marquee-scroll-direction-target]") ? [scope] : []),
    ...scope.querySelectorAll("[data-marquee-scroll-direction-target]"),
  ];

  marquees.forEach((marquee) => {
    if (marquee._marqueeScrollDirectionDestroy) return;

    const marqueeContent = marquee.querySelector("[data-marquee-collection-target]");
    const marqueeScroll = marquee.querySelector("[data-marquee-scroll-target]");
    if (!marqueeContent || !marqueeScroll) return;

    const {
      marqueeSpeed: speed,
      marqueeDirection: direction,
      marqueeDuplicate: duplicate,
      marqueeScrollSpeed: scrollSpeed,
    } = marquee.dataset;

    const marqueeSpeedAttr = parseFloat(speed);
    const marqueeDirectionAttr = direction === "right" ? 1 : -1;
    const duplicateAmount = Math.max(0, parseInt(duplicate || 0, 10) || 0);
    const scrollSpeedAttr = parseFloat(scrollSpeed) || 0;
    const speedMultiplier = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 : 1;
    const marqueeSpeed = marqueeSpeedAttr * (marqueeContent.offsetWidth / Math.max(1, window.innerWidth)) * speedMultiplier;

    if (!Number.isFinite(marqueeSpeed) || marqueeSpeed <= 0) return;

    const originalMarginLeft = marqueeScroll.style.marginLeft;
    const originalWidth = marqueeScroll.style.width;
    const originalScrollTransform = marqueeScroll.style.transform;
    const originalStatus = marquee.getAttribute("data-marquee-status");
    const clones = [];

    marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
    marqueeScroll.style.width = `${(scrollSpeedAttr * 2) + 100}%`;

    if (duplicateAmount > 0) {
      const fragment = document.createDocumentFragment();
      for (let i = 0; i < duplicateAmount; i++) {
        const clone = marqueeContent.cloneNode(true);
        clone.setAttribute("data-marquee-generated-clone", "");
        clone.setAttribute("aria-hidden", "true");
        clones.push(clone);
        fragment.appendChild(clone);
      }
      marqueeScroll.appendChild(fragment);
    }

    const marqueeItems = [...marquee.querySelectorAll("[data-marquee-collection-target]")];
    const originalTransforms = marqueeItems.map((item) => item.style.transform);
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

    const directionTrigger = ScrollTrigger.create({
      trigger: marquee,
      start: "top bottom",
      end: "bottom top",
      onUpdate: (self) => {
        const isInverted = self.direction === 1;
        const currentDirection = isInverted ? -marqueeDirectionAttr : marqueeDirectionAttr;
        animation.timeScale(currentDirection);
        marquee.setAttribute("data-marquee-status", isInverted ? "normal" : "inverted");
      },
      // Buiten beeld stil: anders rekent elke marquee elke frame door
      onToggle: (self) => animation.paused(!self.isActive),
    });
    animation.paused(!directionTrigger.isActive);

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: marquee,
        start: "0% 100%",
        end: "100% 0%",
        scrub: 0,
      },
    });

    const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
    const scrollEnd = -scrollStart;
    timeline.fromTo(marqueeScroll, { x: `${scrollStart}vw` }, { x: `${scrollEnd}vw`, ease: "none" });

    marquee._marqueeScrollDirectionDestroy = () => {
      animation.kill();
      directionTrigger.kill();
      timeline.scrollTrigger?.kill();
      timeline.kill();
      marqueeItems.forEach((item, index) => { item.style.transform = originalTransforms[index]; });
      marqueeScroll.style.marginLeft = originalMarginLeft;
      marqueeScroll.style.width = originalWidth;
      marqueeScroll.style.transform = originalScrollTransform;
      clones.forEach((clone) => clone.remove());
      if (originalStatus == null) marquee.removeAttribute("data-marquee-status");
      else marquee.setAttribute("data-marquee-status", originalStatus);
      marquee._marqueeScrollDirectionDestroy = null;
    };
  });
}

function destroyMarqueeScrollDirection(scope = document) {
  const marquees = [
    ...(scope.nodeType === 1 && scope.matches("[data-marquee-scroll-direction-target]") ? [scope] : []),
    ...scope.querySelectorAll("[data-marquee-scroll-direction-target]"),
  ];
  marquees.forEach((marquee) => marquee._marqueeScrollDirectionDestroy?.());
}

// ==========================================================
// CSS-ANIMATIES BUITEN BEELD PAUZEREN
// De radial marquee draait oneindig in CSS; buiten beeld zetten we hem stil.
// ==========================================================

function initOffscreenPause(scope = document) {
  scope.querySelectorAll("[data-radial-cards-marquee-list]").forEach((el) => {
    if (el._offscreenPauseDestroy || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(([entry]) => {
      el.style.animationPlayState = entry.isIntersecting ? "" : "paused";
    });
    io.observe(el.parentElement || el);
    el._offscreenPauseDestroy = () => {
      io.disconnect();
      el.style.animationPlayState = "";
      el._offscreenPauseDestroy = null;
    };
  });
}

function destroyOffscreenPause(scope = document) {
  scope.querySelectorAll("[data-radial-cards-marquee-list]").forEach((el) => el._offscreenPauseDestroy?.());
}

// ==========================================================
// CSS ACCORDION
// [data-accordion-css-init] op de wrapper; toggle/status via data-attributen.
// ==========================================================

function initAccordionCSS(scope = document) {
  const accordions = [
    ...(scope.nodeType === 1 && scope.matches("[data-accordion-css-init]") ? [scope] : []),
    ...scope.querySelectorAll("[data-accordion-css-init]"),
  ];

  accordions.forEach((accordion) => {
    if (accordion._accordionCssDestroy) return;

    const closeSiblings = accordion.getAttribute("data-accordion-close-siblings") === "true";
    const onClick = (event) => {
      const toggle = event.target.closest?.("[data-accordion-toggle]");
      if (!toggle || toggle.closest("[data-accordion-css-init]") !== accordion) return;

      const item = toggle.closest("[data-accordion-status]");
      if (!item || !accordion.contains(item)) return;

      const isActive = item.getAttribute("data-accordion-status") === "active";
      item.setAttribute("data-accordion-status", isActive ? "not-active" : "active");

      if (closeSiblings && !isActive) {
        accordion.querySelectorAll('[data-accordion-status="active"]').forEach((sibling) => {
          if (sibling !== item && sibling.closest("[data-accordion-css-init]") === accordion) {
            sibling.setAttribute("data-accordion-status", "not-active");
          }
        });
      }
    };

    accordion.addEventListener("click", onClick);
    accordion._accordionCssDestroy = () => {
      accordion.removeEventListener("click", onClick);
      accordion._accordionCssDestroy = null;
    };
  });
}

function destroyAccordionCSS(scope = document) {
  const accordions = [
    ...(scope.nodeType === 1 && scope.matches("[data-accordion-css-init]") ? [scope] : []),
    ...scope.querySelectorAll("[data-accordion-css-init]"),
  ];
  accordions.forEach((accordion) => accordion._accordionCssDestroy?.());
}

// ==========================================================
// FORMULIER — Osmo-opmaak met [data-form-validate]
// De echte submit (input.form-submit) is onzichtbaar, dus een klik op de knop
// bereikt hem niet. [data-submit] valideert en verstuurt via requestSubmit,
// zodat Webflow het formulier gewoon afhandelt (succes/fout-states).
// [data-validate] op een veldgroep krijgt is--error / is--success.
// ==========================================================

function initFormValidate(scope = document) {
  scope.querySelectorAll("[data-form-validate] form").forEach((form) => {
    if (form._formValidateDestroy) return;

    let tried = false;
    const fieldsOf = (group) => [...group.querySelectorAll("input, textarea, select")]
      .filter((field) => !["submit", "hidden", "button"].includes(field.type));
    const check = (group) => {
      const ok = fieldsOf(group).every((field) => field.checkValidity());
      group.classList.toggle("is--error", !ok);
      group.classList.toggle("is--success", ok);
      return ok;
    };
    const submit = () => {
      tried = true;
      const ok = [...form.querySelectorAll("[data-validate]")].map(check).every(Boolean);
      if (!ok) {
        form.querySelector("[data-validate].is--error input, [data-validate].is--error textarea, [data-validate].is--error select")?.focus();
        return;
      }
      const submitter = form.querySelector('[type="submit"]');
      if (form.requestSubmit) form.requestSubmit(submitter || undefined);
      else if (submitter) submitter.click();
      else form.submit();
    };

    const onClick = (event) => {
      if (!event.target.closest("[data-submit]")) return;
      event.preventDefault();
      submit();
    };
    // Enter in een veld volgt dezelfde route als de knop
    const onKeyDown = (event) => {
      if (event.key !== "Enter" || event.target.tagName === "TEXTAREA" || event.target.closest("[data-submit]")) return;
      event.preventDefault();
      submit();
    };
    // Na de eerste poging meteen terugkoppelen tijdens het typen
    const onInput = (event) => {
      if (!tried) return;
      const group = event.target.closest("[data-validate]");
      if (group) check(group);
    };

    form.addEventListener("click", onClick);
    form.addEventListener("keydown", onKeyDown);
    form.addEventListener("input", onInput);
    form._formValidateDestroy = () => {
      form.removeEventListener("click", onClick);
      form.removeEventListener("keydown", onKeyDown);
      form.removeEventListener("input", onInput);
      form._formValidateDestroy = null;
    };
  });
}

function destroyFormValidate(scope = document) {
  scope.querySelectorAll("[data-form-validate] form").forEach((form) => form._formValidateDestroy?.());
}

// ==========================================================
// DROPPING CARD STACK
// [data-dropping-stack-init] op de wrapper; kaarten en controls via data-attributen.
// ==========================================================

let draggablePromise = null;

// Zelfde versie als de GSAP-core die Webflow laadt
function loadDraggable() {
  if (window.Draggable) return Promise.resolve(window.Draggable);
  if (draggablePromise) return draggablePromise;
  draggablePromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `https://cdn.jsdelivr.net/npm/gsap@${gsap.version}/dist/Draggable.min.js`;
    script.onload = () => {
      gsap.registerPlugin(window.Draggable);
      resolve(window.Draggable);
    };
    script.onerror = () => {
      draggablePromise = null;
      reject();
    };
    document.head.appendChild(script);
  });
  return draggablePromise;
}

function initDroppingCardsStack(scope = document) {
  const stacks = [
    ...(scope.nodeType === 1 && scope.matches("[data-dropping-stack-init]") ? [scope] : []),
    ...scope.querySelectorAll("[data-dropping-stack-init]"),
  ];

  stacks.forEach((stackEl) => {
    if (stackEl._droppingStackDestroy) return;

    const list = stackEl.querySelector(".dropping-stack__list");
    if (!list) return;

    const originalCards = [...list.querySelectorAll("[data-dropping-stack-item]")];
    if (originalCards.length < 3) return;

    // Draggable laden we pas als er een stack op de pagina staat; daarna deze stack alsnog opzetten
    if (!window.Draggable) {
      loadDraggable()
        .then(() => { if (stackEl.isConnected && stackEl.offsetParent) initDroppingCardsStack(stackEl); })
        .catch(() => console.warn("Stercq: GSAP Draggable kon niet laden"));
      return;
    }

    const visibleCount = 4;
    const minTotalForLoop = 5;
    const duration = 0.75;
    const mainEase = "osmo";
    const dragThresholdPercent = 20;
    const originalStyles = new Map(originalCards.map((card) => [card, card.getAttribute("style")]));
    const generatedCards = [];
    const listeners = [];

    let cards = [...originalCards];
    const setsNeeded = Math.ceil(minTotalForLoop / cards.length);
    const clonesToAdd = (setsNeeded * cards.length) - cards.length;

    for (let i = 0; i < clonesToAdd; i++) {
      const clone = cards[i % originalCards.length].cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      clone.setAttribute("data-dropping-stack-generated", "");
      clone.removeAttribute("id");
      clone.querySelectorAll("[id]").forEach((el) => el.removeAttribute("id"));
      generatedCards.push(clone);
      list.appendChild(clone);
    }
    cards = [...list.querySelectorAll("[data-dropping-stack-item]")];

    const total = cards.length;
    let activeIndex = 0;
    let isAnimating = false;
    let dragCard = null;
    let draggableInstance = null;
    let limitX = 1;
    let limitY = 1;
    let offsetX = "0px";
    let offsetY = "0px";
    let isActive = true;

    const nextBtn = stackEl.querySelector("[data-dropping-stack-next]");
    const prevBtn = stackEl.querySelector("[data-dropping-stack-prev]");
    const collectionEl = stackEl.querySelector("[data-dropping-stack-collection]");
    const mod = (n, m) => ((n % m) + m) % m;
    const cardAt = (offset) => cards[mod(activeIndex + offset, total)];
    const getUnitValue = (value, depth) => {
      const amount = parseFloat(value) || 0;
      const unit = String(value).replace(/[0-9.-]/g, "") || "px";
      return (amount * depth) + unit;
    };

    function updateOffsetsFromPadding() {
      if (!collectionEl) return;
      const styles = getComputedStyle(collectionEl);
      const padRight = parseFloat(styles.paddingRight) || 0;
      const padLeft = parseFloat(styles.paddingLeft) || 0;
      const padBottom = parseFloat(styles.paddingBottom) || 0;
      const padTop = parseFloat(styles.paddingTop) || 0;
      const steps = Math.max(1, visibleCount - 1);
      const usePadX = Math.max(padRight, padLeft);
      const usePadY = Math.max(padBottom, padTop);
      const signX = padLeft > padRight ? -1 : 1;
      const signY = padTop > padBottom ? -1 : 1;
      offsetX = `${(usePadX / steps) * signX}px`;
      offsetY = `${(usePadY / steps) * signY}px`;
    }

    function updateDragLimits() {
      if (!dragCard) return;
      const rect = dragCard.getBoundingClientRect();
      limitX = rect.width || 1;
      limitY = rect.height || 1;
    }

    function applyState() {
      updateOffsetsFromPadding();

      cards.forEach((card) => {
        gsap.set(card, {
          opacity: 0,
          pointerEvents: "none",
          zIndex: 0,
          x: 0,
          y: 0,
          xPercent: 0,
          yPercent: 0,
        });
      });

      for (let depth = 0; depth < visibleCount; depth++) {
        const card = cardAt(depth);
        const xVal = getUnitValue(offsetX, depth);
        const yVal = getUnitValue(offsetY, depth);
        const state = {
          opacity: 1,
          zIndex: 999 - depth,
          pointerEvents: depth === 0 ? "auto" : "none",
        };

        if (offsetX.includes("%")) state.xPercent = parseFloat(xVal);
        else state.x = xVal;
        if (offsetY.includes("%")) state.yPercent = parseFloat(yVal);
        else state.y = yVal;
        gsap.set(card, state);
      }

      dragCard = cardAt(0);
      gsap.set(dragCard, { touchAction: "none" });
      updateDragLimits();

      draggableInstance?.kill();
      const magnetize = (raw, limit) => {
        const sign = Math.sign(raw) || 1;
        return sign * limit * Math.tanh(Math.abs(raw) / limit);
      };

      draggableInstance = Draggable.create(dragCard, {
        type: "x,y",
        inertia: false,
        onPress() {
          if (isAnimating) return;
          gsap.killTweensOf(dragCard);
          gsap.set(dragCard, { zIndex: 2000, opacity: 1 });
        },
        onDrag() {
          if (isAnimating) return;
          gsap.set(dragCard, {
            x: magnetize(this.x, limitX),
            y: magnetize(this.y, limitY),
            opacity: 1,
          });
        },
        onRelease() {
          if (isAnimating) return;
          const currentX = gsap.getProperty(dragCard, "x");
          const currentY = gsap.getProperty(dragCard, "y");
          const movedXPercent = Math.abs(currentX) / limitX * 100;
          const movedYPercent = Math.abs(currentY) / limitY * 100;
          const movedPercent = Math.max(movedXPercent, movedYPercent);

          if (movedPercent >= dragThresholdPercent) {
            animateNext(true, currentX, currentY);
            return;
          }

          gsap.to(dragCard, {
            x: 0,
            y: 0,
            opacity: 1,
            duration: 1,
            ease: "elastic.out(1, 0.7)",
            onComplete: applyState,
          });
        },
      })[0];
    }

    function animateNext(fromDrag = false, releaseX = 0, releaseY = 0) {
      if (isAnimating) return;
      isAnimating = true;

      const outgoing = cardAt(0);
      const incomingBack = cardAt(visibleCount);
      const tl = gsap.timeline({
        defaults: { duration, ease: mainEase },
        onComplete() {
          activeIndex = mod(activeIndex + 1, total);
          applyState();
          isAnimating = false;
        },
      });

      gsap.set(outgoing, { zIndex: 2000, opacity: 1 });
      if (fromDrag) gsap.set(outgoing, { x: releaseX, y: releaseY });
      tl.to(outgoing, { yPercent: 200 }, 0);
      tl.to(outgoing, { opacity: 0, duration: duration * 0.2, ease: "none" }, duration * 0.4);

      for (let depth = 1; depth < visibleCount; depth++) {
        const xVal = getUnitValue(offsetX, depth - 1);
        const yVal = getUnitValue(offsetY, depth - 1);
        const move = { zIndex: 999 - (depth - 1) };
        if (offsetX.includes("%")) move.xPercent = parseFloat(xVal);
        else move.x = xVal;
        if (offsetY.includes("%")) move.yPercent = parseFloat(yVal);
        else move.y = yVal;
        tl.to(cardAt(depth), move, 0);
      }

      const backX = getUnitValue(offsetX, visibleCount);
      const backY = getUnitValue(offsetY, visibleCount);
      const startX = getUnitValue(offsetX, visibleCount - 1);
      const startY = getUnitValue(offsetY, visibleCount - 1);
      const incomingSet = { opacity: 0, zIndex: 999 - visibleCount };
      if (offsetX.includes("%")) incomingSet.xPercent = parseFloat(backX);
      else incomingSet.x = backX;
      if (offsetY.includes("%")) incomingSet.yPercent = parseFloat(backY);
      else incomingSet.y = backY;
      gsap.set(incomingBack, incomingSet);

      const incomingTo = { opacity: 1 };
      if (offsetX.includes("%")) incomingTo.xPercent = parseFloat(startX);
      else incomingTo.x = startX;
      if (offsetY.includes("%")) incomingTo.yPercent = parseFloat(startY);
      else incomingTo.y = startY;
      tl.to(incomingBack, incomingTo, 0);
    }

    function animatePrev() {
      if (isAnimating) return;
      isAnimating = true;

      const incomingTop = cardAt(-1);
      const leavingBack = cardAt(visibleCount - 1);
      const tl = gsap.timeline({
        defaults: { duration, ease: mainEase },
        onComplete() {
          activeIndex = mod(activeIndex - 1, total);
          applyState();
          isAnimating = false;
        },
      });

      gsap.set(leavingBack, { zIndex: 1 });
      gsap.set(incomingTop, { opacity: 0, x: 0, xPercent: 0, y: 0, yPercent: -200, zIndex: 2000 });
      tl.to(incomingTop, { yPercent: 0 }, 0);
      tl.to(incomingTop, { opacity: 1, duration: duration * 0.2, ease: "none" }, duration * 0.3);

      for (let depth = 0; depth < visibleCount - 1; depth++) {
        const xVal = getUnitValue(offsetX, depth + 1);
        const yVal = getUnitValue(offsetY, depth + 1);
        const move = { zIndex: 999 - (depth + 1) };
        if (offsetX.includes("%")) move.xPercent = parseFloat(xVal);
        else move.x = xVal;
        if (offsetY.includes("%")) move.yPercent = parseFloat(yVal);
        else move.y = yVal;
        tl.to(cardAt(depth), move, 0);
      }

      const backX = getUnitValue(offsetX, visibleCount);
      const backY = getUnitValue(offsetY, visibleCount);
      const hideBack = { opacity: 0 };
      if (offsetX.includes("%")) hideBack.xPercent = parseFloat(backX);
      else hideBack.x = backX;
      if (offsetY.includes("%")) hideBack.yPercent = parseFloat(backY);
      else hideBack.y = backY;
      tl.to(leavingBack, hideBack, 0);
    }

    const observer = "IntersectionObserver" in window
      ? new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            isActive = entry.isIntersecting && entry.intersectionRatio >= 0.6;
          });
        }, { threshold: [0, 0.6, 1] })
      : null;
    observer?.observe(stackEl);

    const onKeyDown = (event) => {
      // Al afgehandeld (bv. een sticker die je met de pijltjes verschuift)
      if (event.defaultPrevented || !isActive || isAnimating) return;
      const target = event.target;
      const tag = target?.tagName?.toLowerCase() || "";
      if (["input", "textarea", "select"].includes(tag) || target?.isContentEditable) return;

      if (event.key === "ArrowRight") {
        event.preventDefault();
        animateNext();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        animatePrev();
      }
    };

    const addListener = (element, type, handler) => {
      if (!element) return;
      element.addEventListener(type, handler);
      listeners.push(() => element.removeEventListener(type, handler));
    };
    const onResize = () => applyState();

    addListener(window, "keydown", onKeyDown);
    addListener(window, "resize", onResize);
    addListener(nextBtn, "click", () => animateNext());
    addListener(prevBtn, "click", animatePrev);
    applyState();

    stackEl._droppingStackDestroy = () => {
      observer?.disconnect();
      listeners.forEach((removeListener) => removeListener());
      draggableInstance?.kill();
      gsap.killTweensOf(cards);
      originalCards.forEach((card) => {
        const style = originalStyles.get(card);
        if (style == null) card.removeAttribute("style");
        else card.setAttribute("style", style);
      });
      generatedCards.forEach((card) => card.remove());
      stackEl._droppingStackDestroy = null;
    };
  });
}

function destroyDroppingCardsStack(scope = document) {
  const stacks = [
    ...(scope.nodeType === 1 && scope.matches("[data-dropping-stack-init]") ? [scope] : []),
    ...scope.querySelectorAll("[data-dropping-stack-init]"),
  ];
  stacks.forEach((stackEl) => stackEl._droppingStackDestroy?.());
}

// ==========================================================
// OGEN — levende ogen: kijken naar je cursor, knipperen, en schrikken (WAAA!) als je ze oppakt.
// In een stickerzone wordt de ogen-sticker uit je CMS vanzelf levend: herkend aan "ogen" in de
// bestandsnaam of alt, of zet data-sticker-kind="ogen" op dat item.
// Zelf plaatsen: een lege div met data-eyes. data-eyes="controlled": volgt de muis niet,
// je stuurt hem zelf aan via el._eyes.lookAt(x, y) / lookAtEl(el) / lookAtYou().
// Buiten beeld rekenen ze niet.
// ==========================================================

// De definitieve ogen-sticker in lagen: crème rand, per pupil een crème randje, oogwit + inktlijn, pupillen
const EYE = {"rim":["M28.03,99.41c-6.63,0-12.66-2.91-17-8.2-.04-.05-.08-.1-.11-.14C2.61,80.16.65,64.22,5.08,43.69c0-.03.05-.22.05-.22,1.74-7.12,5.07-17.35,11.14-25.88,6.55-9.21,14.97-14.33,24.36-14.81.07,0,.15,0,.22,0h.18c16.57,0,26.92,16.26,28.28,31.6,1.38,11.71-1.48,26.07-7.66,38.44-7.13,14.27-17.48,23.56-29.14,26.16-.06.01-.12.03-.18.04-1.44.27-2.89.4-4.31.4h0Z","M28.03,102.19h0c-7.48,0-14.28-3.27-19.15-9.21-.06-.08-.12-.15-.18-.22C-.11,81.17-2.24,64.46,2.37,43.1l.06-.27c1.8-7.36,5.26-17.97,11.58-26.85C21.07,6.06,30.23.54,40.49.01c.12,0,.23,0,.35-.01h.19c18.21,0,29.58,17.56,31.05,34.09,1.43,12.22-1.53,27.16-7.94,39.97-7.51,15.03-18.53,24.84-31.02,27.63-.1.02-.19.04-.28.06-1.61.3-3.23.45-4.81.45ZM28.03,96.64h0c1.25,0,2.53-.12,3.8-.35l.09-.02c10.81-2.42,20.49-11.18,27.24-24.69,5.95-11.9,8.71-25.68,7.39-36.87v-.08c-1.25-14.09-10.61-29.06-25.52-29.06h-.27c-8.5.44-16.19,5.16-22.23,13.65-5.81,8.17-9.03,18.06-10.71,24.93l-.04.16c-4.25,19.69-2.46,34.87,5.33,45.1l.05.07c3.79,4.63,9.07,7.18,14.85,7.18Z","M69.57,101.64c-6.63,0-12.66-2.91-17-8.2-.04-.05-.08-.1-.11-.14-8.3-10.91-10.26-26.86-5.83-47.39,0-.03.06-.24.06-.26,1.73-7.08,5.06-17.31,11.13-25.84,6.55-9.21,14.97-14.33,24.36-14.81.07,0,.15,0,.22,0h.18c16.57,0,26.92,16.26,28.28,31.6,1.38,11.71-1.48,26.07-7.66,38.44-7.13,14.27-17.48,23.56-29.14,26.16-.06.01-.12.03-.18.04-1.44.27-2.89.4-4.31.4h0Z","M69.57,104.41h0c-7.48,0-14.28-3.27-19.15-9.21-.06-.08-.12-.15-.18-.22-8.82-11.59-10.95-28.29-6.34-49.66l.07-.32c1.79-7.33,5.25-17.92,11.57-26.8,7.06-9.92,16.22-15.44,26.48-15.97.12,0,.23,0,.35-.01h.19c18.2,0,29.58,17.56,31.05,34.09,1.43,12.22-1.53,27.16-7.94,39.97-7.51,15.03-18.53,24.84-31.02,27.63-.1.02-.19.04-.29.06-1.6.3-3.22.45-4.81.45ZM69.57,98.86h0c1.25,0,2.53-.12,3.8-.35l.09-.02c10.81-2.42,20.49-11.18,27.25-24.69,5.95-11.9,8.71-25.68,7.39-36.87v-.08c-1.25-14.09-10.61-29.06-25.52-29.06h-.27c-8.5.44-16.19,5.16-22.23,13.65-5.81,8.17-9.03,18.04-10.7,24.89l-.05.21c-4.25,19.68-2.46,34.86,5.33,45.09l.05.07c3.79,4.63,9.07,7.18,14.85,7.18Z"],"prim":[["M16.64,77.96c-.67,0-1.33-.06-1.97-.17-3.46-.61-6.57-2.84-9-6.45-3.88-5.76-5.42-14.03-3.92-21.07,1.93-9.08,8.92-18.74,18.08-18.74.29,0,.59.01.89.03,4.44.3,8.58,2.9,11.65,7.32,2.41,3.46,4.02,7.82,4.43,11.95.68,7-2.06,14.64-7.32,20.43-3.92,4.32-8.48,6.7-12.83,6.7h0Z","M16.64,78.21h0c-.68,0-1.36-.06-2.02-.18-3.53-.63-6.7-2.89-9.17-6.56C1.54,65.66-.02,57.32,1.49,50.21c2.02-9.47,9.52-19.56,19.23-18.9,4.52.31,8.72,2.95,11.84,7.43,2.44,3.5,4.06,7.9,4.47,12.07.69,7.07-2.07,14.78-7.38,20.63-3.97,4.37-8.59,6.78-13.01,6.78ZM19.82,31.78c-9.02,0-15.92,9.55-17.83,18.54-1.48,6.98.04,15.18,3.88,20.88,2.39,3.55,5.45,5.74,8.84,6.34.63.11,1.28.17,1.93.17h0c4.28,0,8.77-2.35,12.64-6.62,5.21-5.74,7.92-13.31,7.25-20.24-.4-4.09-1.99-8.4-4.38-11.83-3.03-4.35-7.1-6.91-11.46-7.21-.29-.02-.58-.03-.87-.03Z"],["M59.8,77.96c-.67,0-1.33-.06-1.97-.17-3.46-.61-6.57-2.84-9-6.45-3.88-5.76-5.42-14.03-3.92-21.07,1.93-9.08,8.92-18.74,18.08-18.74.29,0,.59.01.89.03,4.44.3,8.58,2.9,11.65,7.32,2.41,3.46,4.02,7.82,4.43,11.95.68,7-2.06,14.64-7.32,20.43-3.92,4.32-8.48,6.7-12.83,6.7h0Z","M59.81,78.21h0c-.68,0-1.36-.06-2.02-.18-3.53-.63-6.7-2.89-9.17-6.56-3.92-5.81-5.47-14.16-3.96-21.27,2.01-9.47,9.53-19.56,19.23-18.9,4.52.31,8.72,2.95,11.84,7.43,2.44,3.5,4.06,7.9,4.47,12.07.69,7.07-2.07,14.78-7.38,20.63-3.97,4.37-8.59,6.78-13.01,6.78ZM62.98,31.78c-9.02,0-15.92,9.55-17.83,18.54-1.48,6.98.04,15.18,3.88,20.88,2.39,3.55,5.45,5.74,8.84,6.34.63.11,1.28.17,1.93.17h0c4.28,0,8.77-2.35,12.64-6.62,5.21-5.74,7.92-13.31,7.25-20.24-.4-4.09-1.99-8.4-4.38-11.83-3.03-4.35-7.1-6.91-11.46-7.21-.29-.02-.58-.03-.87-.03Z"]],"white":["M10.02,45.87c-3.23,14.96-3.8,31.81,4.91,43.26,4.18,5.1,10.12,7.2,16.48,6.03,22.21-4.96,35.42-37.96,32.87-59.15-1.09-12.7-9.51-27.17-23.4-27.06-17.48.9-26.9,20.68-30.84,36.8l-.03.12Z","M51.57,48.09c-3.23,14.96-3.8,31.81,4.91,43.26,4.18,5.1,10.12,7.2,16.48,6.03,22.21-4.96,35.42-37.96,32.87-59.15-1.09-12.7-9.51-27.17-23.4-27.06-17.48.9-26.9,20.68-30.84,36.8l-.03.12Z"],"line":["M28.05,98.25c-5.92,0-11.34-2.58-15.26-7.36l-.06-.08c-7.88-10.36-9.7-25.68-5.42-45.53l.04-.17c1.69-6.91,4.92-16.85,10.78-25.09,6.22-8.74,13.83-13.4,22.62-13.85h.12c.06,0,.11,0,.17,0,7.22,0,13.63,3.39,18.55,9.82,4.12,5.37,6.83,12.56,7.46,19.74,1.34,11.29-1.43,25.19-7.43,37.19-6.82,13.64-16.62,22.51-27.6,24.96l-.1.02c-1.31.24-2.6.36-3.88.36ZM17.12,87.4c3.48,4.22,8.36,6.01,13.75,5.03,9.29-2.1,17.74-9.91,23.79-22.01,5.46-10.91,8.09-23.98,6.88-34.09v-.09c-.54-6.16-2.85-12.31-6.35-16.88-2.68-3.49-7.3-7.64-14.14-7.64h-.06c-6.98.38-13.14,4.26-18.32,11.52-5.35,7.52-8.34,16.74-9.91,23.16l-.02.07c-2.69,12.49-4.11,29.72,4.38,40.93Z","M69.59,100.47c-5.92,0-11.34-2.58-15.26-7.36l-.06-.08c-7.88-10.36-9.7-25.68-5.42-45.53l.04-.17c1.69-6.91,4.92-16.85,10.78-25.09,6.22-8.74,13.83-13.4,22.62-13.85h.12c.06,0,.11,0,.17,0,7.22,0,13.63,3.39,18.55,9.82,4.12,5.37,6.83,12.56,7.46,19.74,1.34,11.29-1.43,25.19-7.43,37.19-6.82,13.64-16.62,22.51-27.6,24.96l-.1.02c-1.31.24-2.6.36-3.88.36ZM58.67,89.62c3.48,4.22,8.36,6.01,13.75,5.03,9.29-2.1,17.74-9.91,23.79-22.01,5.46-10.91,8.09-23.98,6.88-34.09v-.09c-.54-6.16-2.85-12.31-6.35-16.88-2.68-3.49-7.3-7.64-14.14-7.64h-.07c-6.98.38-13.14,4.26-18.32,11.52-5.35,7.52-8.34,16.74-9.91,23.16l-.02.07c-2.69,12.49-4.11,29.72,4.38,40.93Z"],"pupil":["M6.68,52.42c-1.93,9.08,2.57,20.38,8.86,21.5,7.14,1.27,17.28-10.46,16.21-21.5-.61-6.28-5.04-14.28-11.4-14.72-6.89-.47-12.29,8.2-13.68,14.72Z","M49.85,52.42c-1.93,9.08,2.57,20.38,8.86,21.5,7.14,1.27,17.28-10.46,16.21-21.5-.61-6.28-5.04-14.28-11.4-14.72-6.89-.47-12.29,8.2-13.68,14.72Z"]};
const EYE_W = 113.98;
const EYE_H = 104.41;
const SVG_NS = "http://www.w3.org/2000/svg";

function eyesSVG() {
  const P = (d, cls, fill) => `<path class="${cls}" d="${d}" fill="${fill}"/>`;
  return `<svg class="eyes-svg" viewBox="0 0 ${EYE_W} ${EYE_H}" aria-hidden="true" focusable="false">`
    + `<g>${EYE.rim.map((d) => P(d, "rim", "#eeeae1")).join("")}</g>`
    + EYE.prim.map((ds) => `<g class="prim">${ds.map((d) => P(d, "rim", "#eeeae1")).join("")}</g>`).join("")
    // Het rechteroog ligt over het linker, dus de linkerpupil schuift eronder door
    + [0, 1].map((i) => `<g class="eye"><g class="white">${P(EYE.white[i], "wh", "#fff")}</g>${P(EYE.line[i], "ink", "#1d1d1b")}</g>`
      + `<g class="pupil">${P(EYE.pupil[i], "ink", "#1d1d1b")}</g>`).join("")
    + `</svg>`;
}

function isEyesSource(img) {
  return !!img && (img.closest?.('[data-sticker-kind="ogen"]') || /ogen/i.test(`${img.getAttribute?.("src") || ""} ${img.getAttribute?.("alt") || ""}`));
}

const eyesFollowers = new Set();
let eyesPointer = null;
let eyesRaf = 0;
const eyesIO = "IntersectionObserver" in window
  ? new IntersectionObserver((entries) => entries.forEach((entry) => {
      const eyes = entry.target._eyes;
      if (eyes) eyes.visible = entry.isIntersecting;
    }))
  : null;

let eyesFromScroll = false;
function eyesUpdate() {
  eyesRaf = 0;
  if (!eyesPointer) return;
  const cached = eyesFromScroll;
  eyesFromScroll = false;
  eyesFollowers.forEach((eyes) => { if (eyes.visible) eyes.lookAt(eyesPointer.x, eyesPointer.y, cached); });
}
function eyesSchedule() {
  if (!eyesRaf && eyesFollowers.size) eyesRaf = requestAnimationFrame(eyesUpdate);
}
window.addEventListener("pointermove", (event) => {
  if (event.pointerType === "touch") return;
  eyesPointer = { x: event.clientX, y: event.clientY };
  eyesFromScroll = false;
  eyesSchedule();
}, { passive: true });
// Scrollt de pagina onder een stilstaande muis door, dan blijven ze je volgen.
// Dan rekenen we met de laatst gemeten positie plus de scroll, zonder layout op te vragen.
window.addEventListener("scroll", () => {
  if (!eyesRaf) eyesFromScroll = true;
  eyesSchedule();
}, { passive: true });

class Eyes {
  constructor(svg, host, { follow = true } = {}) {
    this.svg = svg;
    this.host = host;
    this.eyes = [...svg.querySelectorAll(".eye")];
    this.pupils = [...svg.querySelectorAll(".pupil")];
    this.prims = [...svg.querySelectorAll(".prim")];
    this.held = false;
    this.visible = !eyesIO;
    // Pupil en zijn randje bewegen samen
    const both = (i) => [this.pupils[i], this.prims[i]].filter(Boolean);
    this.qx = this.pupils.map((p, i) => gsap.quickTo(both(i), "x", { duration: 0.5, ease: "power3.out" }));
    this.qy = this.pupils.map((p, i) => gsap.quickTo(both(i), "y", { duration: 0.5, ease: "power3.out" }));
    svg._eyes = this;
    eyesIO?.observe(svg);
    if (follow) {
      eyesFollowers.add(this);
      this.blinkLoop();
    }
  }

  parts(i) { return [this.eyes[i], this.pupils[i], this.prims[i]].filter(Boolean); }
  get all() { return [...this.eyes, ...this.pupils, ...this.prims]; }

  // Oogwit, pupil en randje van één oog knijpen samen rond hetzelfde punt
  squash(vars, fy) {
    this.eyes.forEach((eye, i) => {
      const w = eye.querySelector(".white").getBBox();
      gsap.to(this.parts(i), { ...vars, svgOrigin: `${w.x + w.width / 2} ${w.y + w.height * fy}` });
    });
  }

  // Maten pas meten als de ogen zichtbaar zijn (in een verborgen element is alles 0)
  get geo() {
    if (this._geo) return this._geo;
    const g = this.eyes.map((eye, i) => {
      const w = eye.querySelector(".white").getBBox();
      const p = this.pupils[i].getBBox();
      const cx = w.x + w.width / 2;
      const cy = w.y + w.height / 2;
      return { cx, cy, dx: p.x + p.width / 2 - cx, dy: p.y + p.height / 2 - cy, rx: Math.max(4, (w.width - p.width) / 2 - 1), ry: Math.max(6, (w.height - p.height) / 2 - 3) };
    });
    if (g[0] && g[0].rx > 4) this._geo = g;
    return g;
  }

  // In de eigen coördinaten van de SVG, zodat het ook klopt als de sticker scheef of op zijn kop ligt.
  // cached: alleen gescrold, dus de vorige meting plus de scrollafstand gebruiken
  lookAt(px, py, cached = false) {
    if (this.held) return;
    let dy = 0;
    if (cached && this.inv) {
      dy = window.scrollY - this.invScroll;
    } else {
      const m = this.svg.getScreenCTM();
      // Nog niet zichtbaar of op schaal 0 (net aan het ploppen): niets te meten
      if (!m || Math.abs(m.a * m.d - m.b * m.c) < 1e-6) return;
      this.inv = m.inverse();
      this.invScroll = window.scrollY;
    }
    const p = new DOMPoint(px, py + dy).matrixTransform(this.inv);
    this.geo.forEach((g, i) => {
      const dx = p.x - g.cx;
      const dy = p.y - g.cy;
      const a = Math.atan2(dy, dx);
      const k = Math.min(1, Math.hypot(dx, dy) / 70);
      this.qx[i](Math.cos(a) * g.rx * k - g.dx);
      this.qy[i](Math.sin(a) * g.ry * k - g.dy);
    });
  }
  lookAtEl(el, fx = 0.5, fy = 0.5) {
    const r = el.getBoundingClientRect();
    this.lookAt(r.left + r.width * fx, r.top + r.height * fy);
  }
  lookAtYou() {
    if (this.held) return;
    this.geo.forEach((g, i) => { this.qx[i](-g.dx); this.qy[i](2 - g.dy); });
  }

  blink() {
    if (reducedMotion || this.held || !this.visible) return;
    this.squash({ scaleY: 0.1, duration: 0.07, ease: "power2.in", yoyo: true, repeat: 1, overwrite: "auto" }, 0.55);
  }
  blinkLoop() {
    const go = () => { this.blink(); this.timer = gsap.delayedCall(rnd(2.6, 6), go); };
    this.timer = gsap.delayedCall(rnd(1.4, 3.5), go);
  }

  // Eén extra laag om elke pupil, voor het heen en weer schieten
  get darts() {
    if (!this._darts) this._darts = this.pupils.map((p) => {
      const d = document.createElementNS(SVG_NS, "g");
      d.setAttribute("class", "dart");
      while (p.firstChild) d.appendChild(p.firstChild);
      p.appendChild(d);
      return d;
    });
    return this._darts;
  }

  // Oppakken: ogen springen open, pupillen krimpen en schieten heen en weer, de gil groeit zolang je vasthoudt
  shock() {
    if (this.held || reducedMotion) return;
    const D = this.darts;
    this.lookAtYou();
    this.held = true;
    this.calmCall?.kill();
    gsap.killTweensOf(this.all, "scaleX,scaleY");
    gsap.set(this.all, { scaleX: 1, scaleY: 1 });
    this.squash({ scaleX: 1.12, scaleY: 1.26, duration: 0.22, ease: "back.out(3.5)" }, 0.62);
    gsap.to(D, { scale: 0.48, transformOrigin: "50% 50%", duration: 0.18, ease: "back.out(3)" });
    const dart = () => {
      const ax = rnd(-6, 6);
      const ay = rnd(-7, 7);
      D.forEach((d) => gsap.to(d, { x: ax + rnd(-1.5, 1.5), y: ay + rnd(-1.5, 1.5), duration: 0.07, ease: "power2.out", overwrite: "auto" }));
      this.dartCall = gsap.delayedCall(rnd(0.08, 0.17), dart);
    };
    dart();
    this.shake = gsap.fromTo(this.svg, { x: -1.2, y: 0.6 }, { x: 1.2, y: -0.6, duration: 0.045, repeat: -1, yoyo: true, ease: "none" });

    let b = this.host.querySelector(":scope > .waaa");
    if (!b) {
      b = document.createElement("span");
      b.className = "waaa";
      b.setAttribute("aria-hidden", "true");
      this.host.appendChild(b);
    }
    let n = 3;
    b.textContent = "WAAA!";
    b.style.fontSize = `${Math.min(34, Math.max(14, this.host.offsetWidth * 0.22))}px`;
    gsap.killTweensOf(b);
    gsap.fromTo(b, { scale: 0, rotation: -26, autoAlpha: 1 }, { scale: 1, rotation: -7, duration: 0.42, ease: "back.out(3)" });
    clearInterval(this.waaaTimer);
    this.waaaTimer = setInterval(() => { if (n < 10) b.textContent = `W${"A".repeat(++n)}!`; }, 110);
  }

  // Loslaten: pupillen terug, ballon popt weg, twee keer knipperen en weer meekijken
  calm() {
    if (!this.held) return;
    this.dartCall?.kill();
    this.shake?.kill();
    clearInterval(this.waaaTimer);
    gsap.to(this.svg, { x: 0, y: 0, duration: 0.2 });
    gsap.to(this.darts, { x: 0, y: 0, scale: 1, duration: 0.5, ease: "back.out(2)", overwrite: "auto" });
    this.squash({ scaleX: 1, scaleY: 1, duration: 0.6, ease: "elastic.out(1, 0.45)" }, 0.62);
    const b = this.host.querySelector(":scope > .waaa");
    if (b) gsap.to(b, { scale: 0, rotation: 8, duration: 0.2, ease: "back.in(2)", delay: 0.06, onComplete: () => gsap.set(b, { autoAlpha: 0 }) });
    this.calmCall = gsap.delayedCall(0.6, () => {
      this.held = false;
      this.blink();
      gsap.delayedCall(0.24, () => this.blink());
      if (eyesPointer) this.lookAt(eyesPointer.x, eyesPointer.y);
    });
  }

  // Weggeslagen in een zwaartekrachtzone: kort schrikken
  startle() {
    if (this.held) return;
    this.shock();
    this.startleCall = gsap.delayedCall(0.7, () => this.calm());
  }

  destroy() {
    this.timer?.kill();
    this.dartCall?.kill();
    this.calmCall?.kill();
    this.startleCall?.kill();
    this.shake?.kill();
    clearInterval(this.waaaTimer);
    gsap.killTweensOf([...this.all, ...(this._darts || []), this.svg]);
    eyesFollowers.delete(this);
    eyesIO?.unobserve(this.svg);
    this.svg._eyes = null;
  }
}

// Losse ogen die je zelf in Webflow plaatst: <div data-eyes></div>
function initEyes(scope = document) {
  scope.querySelectorAll("[data-eyes]").forEach((slot) => {
    if (slot._eyes) return;
    if (!slot.querySelector(".eyes-svg")) slot.innerHTML = eyesSVG();
    slot._eyes = new Eyes(slot.querySelector(".eyes-svg"), slot, { follow: slot.dataset.eyes !== "controlled" });
  });
}

function destroyEyes(scope = document) {
  scope.querySelectorAll("[data-eyes]").forEach((slot) => {
    slot._eyes?.destroy();
    slot._eyes = null;
  });
}

// Inhoud van een sticker: een <img>, of levende ogen als het de ogen-sticker is
async function createStickerFace(source) {
  if (source.eyes) {
    const face = document.createElement("div");
    face.className = "sticker-face sticker-eyes";
    face.innerHTML = eyesSVG();
    return { face, ratio: EYE_H / EYE_W, eyes: new Eyes(face.firstElementChild, face) };
  }
  const img = new Image();
  img.src = source.src;
  img.alt = "";
  img.draggable = false;
  img.className = "sticker-face";
  await img.decode();
  return { face: img, ratio: img.naturalWidth && img.naturalHeight ? img.naturalHeight / img.naturalWidth : 1, eyes: null };
}

// Welke sticker komt er: nooit twee ogen in één zone, en een zone met een h1 (hero) krijgt altijd ogen.
// data-sticker-eyes="always" | "never" op de zone overschrijft dat.
function createStickerPicker(zone, sources) {
  const eyesSource = sources.find((source) => source.eyes) || null;
  const setting = zone.getAttribute("data-sticker-eyes");
  const wanted = setting === "always" || (setting !== "never" && !!zone.querySelector("h1"));
  const allowed = setting !== "never";
  let eyesTaken = false;
  let last = null;
  return {
    pick() {
      if (eyesSource && wanted && !eyesTaken) {
        eyesTaken = true;
        last = eyesSource;
        return eyesSource;
      }
      const usable = sources.filter((source) => !source.eyes || (allowed && !eyesTaken));
      const pool = usable.length > 1 ? usable.filter((source) => source !== last) : usable;
      last = pool[Math.floor(Math.random() * pool.length)] || sources[0];
      if (last.eyes) eyesTaken = true;
      return last;
    },
    // De ogen kwamen er niet (geen plek) of zijn weg: mogen weer gekozen worden
    release() { eyesTaken = false; },
  };
}

// ==========================================================
// STICKER ZONES
// Standaard: stickers vallen met zwaartekracht. data-sticker-mode="board":
// stickers blijven liggen en zijn binnen hun zone versleepbaar.
// Matter.js wordt alleen geladen als een zwaartekrachtzone op de pagina staat.
//
// data-sticker-library        wrapper met sticker-<img>'s, bv. CMS Collection List
// .sticker_list                statische fallback-library voor pagina's zonder CMS Collection, zoals 404
// data-sticker-zone           de sectie voor een van beide sticker-modi
//   data-sticker-mode="board" geen zwaartekracht, stickers blijven liggen en zijn versleepbaar
// Een board met een H1 krijgt ook het gedeelde muisveld; andere boards blijven simpel versleepbaar.
//   data-sticker-count="6"    aantal stickers als de zone in beeld komt (0 = alleen cursor/klik)
//   data-sticker-max="24"     max aantal tegelijk, de oudste popt weg
//   data-sticker-size="6"     breedte in rem (standaard 6)
//   data-sticker-edge-inset="1rem" spawn-/zijmarge in px of rem; standaard 1rem
//   data-sticker-floor-inset="0px" boardmarge onder; standaard 0 zodat stickers de vloer raken
//   data-sticker-swat="false"     optioneel: muisduw in gravity uitschakelen
//   data-sticker-spawn="click"    optioneel: klikbediening; standaard spawnen via cursorbeweging
//   data-sticker-spawn-distance="180"  optionele minimale cursorafstand in px
// data-sticker-collider       elementen in de zone waar stickers op landen (koppen, tekst)
// Nieuwe stickers worden alleen in vrije ruimte geplaatst, met afstand tot tekst, colliders en andere stickers.
// Het effect is alleen actief vanaf 992px; op mobiel en tablet wordt het volledig opgeruimd.
// ==========================================================

let matterPromise = null;
let stickerSourceWarningShown = false;
const stickerDesktopMQ = window.matchMedia("(min-width: 992px)");

function loadMatter() {
  if (window.Matter) return Promise.resolve(window.Matter);
  if (matterPromise) return matterPromise;
  matterPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/matter-js@0.20.0/build/matter.min.js";
    script.onload = () => resolve(window.Matter);
    script.onerror = reject;
    document.head.appendChild(script);
  });
  return matterPromise;
}

// Elke bron: { src, eyes } — eyes = de ogen-sticker, die wordt levend
function getStickerSources() {
  const toSource = (img) => ({ src: img.currentSrc || img.getAttribute("src") || img.getAttribute("data-src"), eyes: isEyesSource(img) });
  const librarySources = [...document.querySelectorAll("[data-sticker-library] img")]
    .map(toSource)
    .filter((source) => source.src);
  const fallbackSources = librarySources.length ? [] : [...document.querySelectorAll(".sticker_list img")]
    .map(toSource)
    .filter((source) => source.src);
  const sources = librarySources.length ? librarySources : fallbackSources;

  if (sources.length) {
    stickerSourceWarningShown = false;
  } else if (!stickerSourceWarningShown) {
    stickerSourceWarningShown = true;
    console.warn("Stercq: geen stickerafbeeldingen gevonden. Gebruik [data-sticker-library] of plaats statische afbeeldingen in .sticker_list.");
  }

  return sources;
}

// Draaiing + schaal van een element: transform (Webflow) én de losse rotate-property
function getElementRotation(el) {
  const style = getComputedStyle(el);
  let angle = 0;
  let scale = 1;
  if (style.transform && style.transform !== "none") {
    const m = new DOMMatrixReadOnly(style.transform);
    angle = Math.atan2(m.b, m.a);
    scale = Math.hypot(m.a, m.b) || 1;
  }
  if (style.rotate && style.rotate !== "none") {
    const deg = parseFloat(style.rotate.split(" ").pop());
    if (!Number.isNaN(deg)) angle += (deg * Math.PI) / 180;
  }
  return { angle, scale };
}

const stickerBlockedSelector ="[data-sticker-collider], a, button, input, textarea, select, label, h1, h2, h3, h4, h5, h6, p, blockquote, li, dt, dd, figcaption";

function stickerLengthToPx(value, fallback) {
  if (value == null || !value.trim()) return fallback;
  const amount = parseFloat(value);
  if (!Number.isFinite(amount)) return fallback;
  return value.trim().toLowerCase().endsWith("rem")
    ? amount * (parseFloat(getComputedStyle(document.documentElement).fontSize) || 16)
    : amount;
}

function getStickerEdgeInset(zone) {
  const defaultInset = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  return Math.max(0, stickerLengthToPx(zone.getAttribute("data-sticker-edge-inset"), defaultInset));
}

function getStickerFloorInset(zone) {
  return Math.max(0, stickerLengthToPx(zone.getAttribute("data-sticker-floor-inset"), 0));
}

function getStickerBlockedRects(zone, zoneRect) {
  const rects = [];
  const addRect = (rect) => {
    if (!rect.width || !rect.height) return;
    rects.push({
      left: rect.left - zoneRect.left,
      right: rect.right - zoneRect.left,
      top: rect.top - zoneRect.top,
      bottom: rect.bottom - zoneRect.top,
    });
  };

  zone.querySelectorAll(stickerBlockedSelector).forEach((el) => {
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) < 0.05) return;
    addRect(el.getBoundingClientRect());
  });

  const walker = document.createTreeWalker(zone, NodeFilter.SHOW_TEXT);
  let textNode;
  while ((textNode = walker.nextNode())) {
    if (!textNode.textContent.trim()) continue;
    const parent = textNode.parentElement;
    if (!parent || parent.closest("[data-sticker-library], [data-sticker-board-item], .sticker-zone__sticker, [data-sticker-collider]")) continue;

    const range = document.createRange();
    range.selectNodeContents(textNode);
    [...range.getClientRects()].forEach(addRect);
    range.detach?.();
  }

  // Board: een vaste header ligt over de zone heen, daar geen stickers neerleggen of naartoe slepen.
  // (Bij zwaartekracht vallen ze er toch onder vandaan.)
  if (zone.getAttribute("data-sticker-mode") !== "board") return rects;
  document.querySelectorAll("[data-header]").forEach((el) => {
    if (zone.contains(el)) return;
    const position = getComputedStyle(el).position;
    if (position === "fixed" || position === "sticky") addRect(el.getBoundingClientRect());
  });

  return rects;
}

function isStickerTextPoint(zone, clientX, clientY) {
  const zoneRect = zone.getBoundingClientRect();
  const x = clientX - zoneRect.left;
  const y = clientY - zoneRect.top;
  return getStickerBlockedRects(zone, zoneRect).some((rect) =>
    x >= rect.left - 4 && x <= rect.right + 4 && y >= rect.top - 4 && y <= rect.bottom + 4
  );
}

function findStickerSpawnPosition(zone, w, h, {
  x,
  y,
  automatic = false,
  autoTopRatio = 1,
  maxRotation = 0.4,
  minimumClearance = 0,
  ignoreElement = null,
  cachedBlockedRects = null,
} = {}) {
  const zoneRect = zone.getBoundingClientRect();
  const edgeInset = getStickerEdgeInset(zone);
  const clearance = Math.max(18, Math.min(w, h) * 0.12, minimumClearance);
  const cos = Math.cos(maxRotation);
  const sin = Math.sin(maxRotation);
  const footprintW = Math.abs(w * cos) + Math.abs(h * sin);
  const footprintH = Math.abs(h * cos) + Math.abs(w * sin);
  const minX = footprintW / 2 + edgeInset;
  const maxX = zoneRect.width - footprintW / 2 - edgeInset;
  const minY = footprintH / 2 + edgeInset;
  const maxY = zoneRect.height - footprintH / 2 - edgeInset;
  if (maxX <= minX || maxY <= minY) return null;

  const blockedRects = cachedBlockedRects || getStickerBlockedRects(zone, zoneRect);
  const occupiedRects = [...zone.querySelectorAll("[data-sticker-board-item], .sticker-zone__sticker")]
    .filter((el) => el !== ignoreElement)
    .map((el) => {
      const rect = el.getBoundingClientRect();
      return {
        left: rect.left - zoneRect.left,
        right: rect.right - zoneRect.left,
        top: rect.top - zoneRect.top,
        bottom: rect.bottom - zoneRect.top,
      };
    })
    .filter((rect) => rect.right > rect.left && rect.bottom > rect.top);
  const allBlockers = [...blockedRects, ...occupiedRects];

  function isOpen(centerX, centerY) {
    if (centerX < minX || centerX > maxX || centerY < minY || centerY > maxY) return false;
    const left = centerX - footprintW / 2 - clearance;
    const right = centerX + footprintW / 2 + clearance;
    const top = centerY - footprintH / 2 - clearance;
    const bottom = centerY + footprintH / 2 + clearance;
    return !allBlockers.some((rect) =>
      right > rect.left && left < rect.right && bottom > rect.top && top < rect.bottom
    );
  }

  if (!automatic) return Number.isFinite(x) && Number.isFinite(y) && isOpen(x, y) ? { x, y } : null;

  const upperLimit = Math.min(maxY, Math.max(minY, zoneRect.height * autoTopRatio));
  const searchRanges = upperLimit < maxY ? [upperLimit, maxY] : [maxY];
  for (const searchMaxY of searchRanges) {
    if (searchMaxY <= minY) continue;
    for (let attempt = 0; attempt < 48; attempt++) {
      const candidateX = minX + Math.random() * (maxX - minX);
      const candidateY = minY + Math.random() * (searchMaxY - minY);
      if (isOpen(candidateX, candidateY)) return { x: candidateX, y: candidateY };
    }
  }

  return null;
}

function initStickerZones(scope = document) {
  const zones = [...scope.querySelectorAll("[data-sticker-zone]")];
  if (!zones.length) return;
  if (!stickerDesktopMQ.matches) {
    destroyStickerZones(scope);
    return;
  }

  if (!getStickerSources().length) return;

  const boardZones = zones.filter((zone) => zone.getAttribute("data-sticker-mode") === "board");
  boardZones.forEach(initStickerBoard);

  const gravityZones = zones.filter((zone) => !boardZones.includes(zone));
  if (!gravityZones.length) return;

  loadMatter()
    .then((Matter) => gravityZones.forEach((zone) => initStickerZone(zone, Matter)))
    .catch(() => console.warn("Stercq: matter-js kon niet laden"));
}

function initStickerBoard(zone) {
  if (!stickerDesktopMQ.matches || zone._stickerDestroy || !zone.isConnected) return;

  const sources = getStickerSources();
  if (!sources.length) return;

  const startCount = parseInt(zone.getAttribute("data-sticker-count"), 10);
  const maxCount = parseInt(zone.getAttribute("data-sticker-max"), 10) || 24;
  const sizeRem = parseFloat(zone.getAttribute("data-sticker-size")) || 6;
  const spawnMode = zone.getAttribute("data-sticker-spawn") || "cursor";
  const spawnDistance = parseFloat(zone.getAttribute("data-sticker-spawn-distance"));
  const stickers = [];
  const picker = createStickerPicker(zone, sources);
  let nextZIndex = 3;
  let activeDrag = null;
  let spawnedStart = false;
  let suppressNextClick = false;
  let pointerInside = false;
  let pointerPosition = null;
  let lastCursorSpawn = null;
  let lastCursorSpawnAt = 0;
  let cursorSpawnPending = false;
  let zoneSize = { width: 0, height: 0 };
  let introCalls = [];
  let zoneVisible = true;
  const hasStickerHeading = !!zone.querySelector("[data-sticker-anchor], h1");

  const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const stickerWidth = () => sizeRem * remPx();
  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const edgeInset = getStickerEdgeInset(zone);
  const floorInset = getStickerFloorInset(zone);

  function getPositionBounds(sticker, rect) {
    const radians = Math.abs(sticker.angle * Math.PI / 180);
    const footprintW = sticker.w * Math.cos(radians) + sticker.h * Math.sin(radians);
    const footprintH = sticker.h * Math.cos(radians) + sticker.w * Math.sin(radians);
    const xExtra = Math.max(0, (footprintW - sticker.w) / 2);
    const yExtra = Math.max(0, (footprintH - sticker.h) / 2);
    const xInset = Math.min(edgeInset, Math.max(0, (rect.width - footprintW) / 2)) + xExtra;
    const topInset = Math.min(edgeInset, Math.max(0, (rect.height - footprintH) / 2)) + yExtra;

    return {
      minX: xInset,
      maxX: Math.max(xInset, rect.width - sticker.w - xInset),
      minY: topInset,
      maxY: Math.max(topInset, rect.height - sticker.h - yExtra - floorInset),
    };
  }

  // Wiebel in rust. Staat de zone buiten beeld, dan pauzeert hij (zie io hieronder).
  function startIdle(sticker) {
    if (reducedMotion || pointerInside || !sticker.el.isConnected) return;
    sticker.idleTween?.kill();
    sticker.idleTween = gsap.to(sticker.img, {
      y: rnd(-2.4, -1.4),
      rotation: rnd(-0.7, 0.7),
      duration: rnd(3.8, 5.4),
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      delay: rnd(0, 1.1),
      paused: !zoneVisible,
    });
  }

  function render(sticker) {
    sticker.el.style.transform = `translate3d(${sticker.x}px, ${sticker.y}px, 0) rotate(${sticker.angle}deg)`;
  }

  function applyPointerField(clientX, clientY) {
    if (!hasStickerHeading || reducedMotion || !stickerDesktopMQ.matches) return;

    pointerInside = true;
    pointerPosition = { x: clientX, y: clientY };

    const rect = zone.getBoundingClientRect();
    const normalizedX = clamp((clientX - rect.left - rect.width / 2) / Math.max(1, rect.width / 2), -1, 1);
    const normalizedY = clamp((clientY - rect.top - rect.height / 2) / Math.max(1, rect.height / 2), -1, 1);
    const sharedX = -normalizedX * 9;
    const sharedY = -normalizedY * 7;
    const radius = Math.max(240, Math.hypot(rect.width, rect.height) * 0.55);

    stickers.forEach((sticker) => {
      if (activeDrag?.sticker === sticker) return;

      sticker.idleRestartCall?.kill();
      sticker.idleTween?.kill();
      sticker.idleTween = null;

      const stickerRect = sticker.el.getBoundingClientRect();
      const dx = stickerRect.left + stickerRect.width / 2 - clientX;
      const dy = stickerRect.top + stickerRect.height / 2 - clientY;
      const distance = Math.max(1, Math.hypot(dx, dy));
      const proximity = 1 - clamp(distance / radius, 0, 1);
      const localPush = proximity * 10;

      sticker.pointerToX?.(clamp(sharedX + (dx / distance) * localPush, -16, 16));
      sticker.pointerToY?.(clamp(sharedY + (dy / distance) * localPush, -14, 14));
      sticker.pointerToRotation?.(clamp(normalizedX * 3.5 + (dx / radius) * proximity * 2.5, -6, 6));
      sticker.pointerToScale?.(1 + proximity * 0.04);
    });
  }

  function resetPointerField() {
    pointerInside = false;
    pointerPosition = null;

    stickers.forEach((sticker) => {
      sticker.pointerToX?.(0);
      sticker.pointerToY?.(0);
      sticker.pointerToRotation?.(0);
      sticker.pointerToScale?.(1);
      sticker.idleRestartCall?.kill();
      sticker.idleRestartCall = gsap.delayedCall(0.55, () => startIdle(sticker));
    });
  }

  function updateZoneSize() {
    const rect = zone.getBoundingClientRect();
    const scaleX = zoneSize.width ? rect.width / zoneSize.width : 1;
    const scaleY = zoneSize.height ? rect.height / zoneSize.height : 1;

    stickers.forEach((sticker) => {
      sticker.w = stickerWidth();
      sticker.h = sticker.w * sticker.ratio;
      const bounds = getPositionBounds(sticker, rect);
      sticker.x = clamp(sticker.x * scaleX, bounds.minX, bounds.maxX);
      sticker.y = clamp(sticker.y * scaleY, bounds.minY, bounds.maxY);
      sticker.el.style.width = `${sticker.w}px`;
      sticker.el.style.height = `${sticker.h}px`;
      render(sticker);
    });

    zoneSize = { width: rect.width, height: rect.height };
  }

  function removeSticker(sticker) {
    const index = stickers.indexOf(sticker);
    if (index === -1) return;
    stickers.splice(index, 1);
    sticker.idleTween?.kill();
    sticker.idleRestartCall?.kill();
    sticker.popTween?.kill();
    gsap.killTweensOf(sticker.img);
    if (sticker.eyes) {
      sticker.eyes.destroy();
      picker.release();
    }
    if (activeDrag?.sticker === sticker) activeDrag = null;

    if (reducedMotion) {
      sticker.el.remove();
      return;
    }

    gsap.to(sticker.img, {
      scale: 0.6,
      opacity: 0,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => sticker.el.remove(),
    });
  }

  async function spawn(centerX, centerY, automatic = false) {
    if (!stickerDesktopMQ.matches || !zone._stickerDestroy) return;

    const source = picker.pick();
    let made;
    try { made = await createStickerFace(source); } catch (error) { if (source.eyes) picker.release(); return; }
    // img heet zo omdat het meestal een <img> is; bij de ogen is het een div met de SVG
    const { face: img, ratio, eyes } = made;
    const abort = () => { eyes?.destroy(); if (source.eyes) picker.release(); };
    if (!zone._stickerDestroy || !stickerDesktopMQ.matches) return abort();

    const w = stickerWidth();
    const h = w * ratio;
    const position = findStickerSpawnPosition(zone, w, h, {
      x: centerX,
      y: centerY,
      automatic,
      maxRotation: Math.PI / 15,
      minimumClearance: 24,
    });
    if (!position) return abort();
    const sticker = {
      el: document.createElement("div"),
      img,
      eyes,
      x: position.x - w / 2,
      y: position.y - h / 2,
      w,
      h,
      ratio,
      angle: rnd(-12, 12),
    };
    sticker.pointerToX = gsap.quickTo(img, "x", { duration: 0.48, ease: "power3.out" });
    sticker.pointerToY = gsap.quickTo(img, "y", { duration: 0.48, ease: "power3.out" });
    sticker.pointerToRotation = gsap.quickTo(img, "rotation", { duration: 0.48, ease: "power3.out" });
    // quickTo kan "scale" niet resetten (GSAP splitst die in scaleX/scaleY), dus beide apart
    const pointerToScaleX = gsap.quickTo(img, "scaleX", { duration: 0.48, ease: "power3.out" });
    const pointerToScaleY = gsap.quickTo(img, "scaleY", { duration: 0.48, ease: "power3.out" });
    sticker.pointerToScale = (value) => { pointerToScaleX(value); pointerToScaleY(value); };

    sticker.el.className = "sticker-board__sticker";
    sticker.el.setAttribute("data-sticker-board-item", "");
    sticker.el.setAttribute("role", "button");
    sticker.el.setAttribute("aria-label", "Sticker verplaatsen met de pijltjestoetsen");
    sticker.el.tabIndex = 0;
    sticker.el.style.width = `${w}px`;
    sticker.el.style.height = `${h}px`;
    sticker.el.style.zIndex = String(nextZIndex++);
    sticker.el.appendChild(img);
    zone.appendChild(sticker.el);

    stickers.push(sticker);
    render(sticker);

    if (!reducedMotion) {
      sticker.popTween = gsap.fromTo(img, { scale: 0.72, rotate: -7 }, {
        scale: 1,
        rotate: 0,
        duration: 0.48,
        ease: "back.out(1.8)",
        onComplete: () => {
          sticker.popTween = null;
          if (pointerInside && pointerPosition) applyPointerField(pointerPosition.x, pointerPosition.y);
          else startIdle(sticker);
        },
      });
    }

    // De oudste popt weg, maar de ogen blijven
    if (stickers.length > maxCount) removeSticker(stickers.find((item) => !item.eyes) || stickers[0]);
  }

  function maybeSpawnFromCursor(event) {
    if (spawnMode !== "cursor" || event.pointerType !== "mouse" || event.buttons || activeDrag) return;
    if (event.target.closest("[data-sticker-board-item], a, button, input, textarea, select, label")) return;
    if (cursorSpawnPending) return;

    const rect = zone.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const minimumDistance = Number.isFinite(spawnDistance) && spawnDistance > 0
      ? spawnDistance
      : stickerWidth() * 1.8;
    const now = performance.now();
    if (lastCursorSpawn && Math.hypot(point.x - lastCursorSpawn.x, point.y - lastCursorSpawn.y) < minimumDistance) return;
    if (now - lastCursorSpawnAt < 360) return;
    if (isStickerTextPoint(zone, event.clientX, event.clientY)) return;

    lastCursorSpawn = point;
    lastCursorSpawnAt = now;
    cursorSpawnPending = true;
    spawn(point.x, point.y).finally(() => { cursorSpawnPending = false; });
  }

  function onClick(event) {
    if (suppressNextClick) {
      suppressNextClick = false;
      return;
    }
    if (spawnMode !== "click") return;
    if (event.target.closest("[data-sticker-board-item], a, button, input, textarea, select, label") || isStickerTextPoint(zone, event.clientX, event.clientY)) return;
    const rect = zone.getBoundingClientRect();
    spawn(event.clientX - rect.left, event.clientY - rect.top);
  }

  function onPointerDown(event) {
    const el = event.target.closest("[data-sticker-board-item]");
    if (!el || event.button !== 0) return;
    const sticker = stickers.find((item) => item.el === el);
    if (!sticker) return;

    event.preventDefault();
    event.stopPropagation();
    suppressNextClick = true;
    sticker.idleTween?.kill();
    sticker.idleTween = null;
    sticker.idleRestartCall?.kill();
    sticker.popTween?.kill();
    sticker.popTween = null;
    sticker.pointerToX?.(0);
    sticker.pointerToY?.(0);
    sticker.pointerToRotation?.(0);
    sticker.el.style.zIndex = String(nextZIndex++);
    sticker.el.classList.add("is-dragging");

    const rect = zone.getBoundingClientRect();
    activeDrag = {
      sticker,
      pointerId: event.pointerId,
      offsetX: event.clientX - rect.left - sticker.x - sticker.w / 2,
      offsetY: event.clientY - rect.top - sticker.y - sticker.h / 2,
      blockedRects: getStickerBlockedRects(zone, rect),
    };
    zone.setPointerCapture(event.pointerId);

    // Optillen via de quickTo's: een losse tween met overwrite zou die stilzetten,
    // en dan reageert de sticker na het slepen niet meer goed op hover
    if (!reducedMotion) sticker.pointerToScale?.(1.045);
    sticker.eyes?.shock();
  }

  function onPointerMove(event) {
    if (activeDrag && activeDrag.pointerId === event.pointerId) {
      event.preventDefault();

      const rect = zone.getBoundingClientRect();
      const sticker = activeDrag.sticker;
      const centerX = event.clientX - rect.left - activeDrag.offsetX;
      const centerY = event.clientY - rect.top - activeDrag.offsetY;
      const bounds = getPositionBounds(sticker, rect);
      const nextX = clamp(centerX - sticker.w / 2, bounds.minX, bounds.maxX);
      const nextY = clamp(centerY - sticker.h / 2, bounds.minY, bounds.maxY);
      const safePosition = findStickerSpawnPosition(zone, sticker.w, sticker.h, {
        x: nextX + sticker.w / 2,
        y: nextY + sticker.h / 2,
        maxRotation: Math.abs(sticker.angle * Math.PI / 180),
        minimumClearance: 24,
        ignoreElement: sticker.el,
        cachedBlockedRects: activeDrag.blockedRects,
      });

      if (safePosition) {
        sticker.x = safePosition.x - sticker.w / 2;
        sticker.y = safePosition.y - sticker.h / 2;
        render(sticker);
      }
    }

    if (event.pointerType === "mouse") {
      applyPointerField(event.clientX, event.clientY);
      maybeSpawnFromCursor(event);
    }
  }

  function onPointerLeave() {
    if (!activeDrag && pointerInside) resetPointerField();
  }

  function finishDrag(event) {
    if (!activeDrag || activeDrag.pointerId !== event.pointerId) return;
    const sticker = activeDrag.sticker;
    activeDrag = null;
    sticker.el.classList.remove("is-dragging");
    sticker.eyes?.calm();
    setTimeout(() => { suppressNextClick = false; }, 0);
    if (zone.hasPointerCapture(event.pointerId)) zone.releasePointerCapture(event.pointerId);

    if (!reducedMotion) {
      gsap.fromTo(sticker.img, { scale: 1.08, y: -3 }, {
        scale: 1,
        y: 0,
        duration: 0.34,
        ease: "elastic.out(1, 0.55)",
        onComplete: () => {
          if (pointerInside && pointerPosition) applyPointerField(pointerPosition.x, pointerPosition.y);
          else startIdle(sticker);
        },
      });
    } else startIdle(sticker);
  }

  function onKeyDown(event) {
    const el = event.target.closest("[data-sticker-board-item]");
    if (!el || !event.key.startsWith("Arrow")) return;
    const sticker = stickers.find((item) => item.el === el);
    if (!sticker) return;

    event.preventDefault();
    const rect = zone.getBoundingClientRect();
    const distance = event.shiftKey ? 24 : 8;
    let proposedX = sticker.x;
    let proposedY = sticker.y;
    if (event.key === "ArrowLeft") proposedX -= distance;
    if (event.key === "ArrowRight") proposedX += distance;
    if (event.key === "ArrowUp") proposedY -= distance;
    if (event.key === "ArrowDown") proposedY += distance;
    const bounds = getPositionBounds(sticker, rect);
    const nextX = clamp(proposedX, bounds.minX, bounds.maxX);
    const nextY = clamp(proposedY, bounds.minY, bounds.maxY);
    const safePosition = findStickerSpawnPosition(zone, sticker.w, sticker.h, {
      x: nextX + sticker.w / 2,
      y: nextY + sticker.h / 2,
      maxRotation: Math.abs(sticker.angle * Math.PI / 180),
      minimumClearance: 24,
      ignoreElement: sticker.el,
    });
    if (!safePosition) return;
    sticker.x = safePosition.x - sticker.w / 2;
    sticker.y = safePosition.y - sticker.h / 2;
    sticker.el.style.zIndex = String(nextZIndex++);
    render(sticker);
  }

  function spawnStartSet() {
    if (spawnedStart) return;
    spawnedStart = true;
    const count = Number.isNaN(startCount) ? 6 : startCount;
    for (let i = 0; i < count; i++) {
      introCalls.push(gsap.delayedCall(i * 0.09, () => {
        spawn(null, null, true);
      }));
    }
  }

  const io = new IntersectionObserver(([entry]) => {
    if (entry.isIntersecting) spawnStartSet();
  }, { threshold: 0.25 });
  // Buiten beeld wiebelt er niets: anders rekent elke sticker elke frame door
  const visibilityIO = new IntersectionObserver(([entry]) => {
    zoneVisible = entry.isIntersecting;
    stickers.forEach((sticker) => sticker.idleTween?.paused(!zoneVisible));
  });
  visibilityIO.observe(zone);
  const ro = new ResizeObserver(updateZoneSize);

  zoneSize = { width: zone.getBoundingClientRect().width, height: zone.getBoundingClientRect().height };
  zone.addEventListener("click", onClick);
  zone.addEventListener("pointerdown", onPointerDown);
  zone.addEventListener("pointermove", onPointerMove);
  zone.addEventListener("pointerleave", onPointerLeave);
  zone.addEventListener("pointerup", finishDrag);
  zone.addEventListener("pointercancel", finishDrag);
  zone.addEventListener("keydown", onKeyDown);

  zone._stickerDestroy = () => {
    io.disconnect();
    visibilityIO.disconnect();
    ro.disconnect();
    introCalls.forEach((call) => call.kill());
    if (activeDrag && zone.hasPointerCapture(activeDrag.pointerId)) {
      zone.releasePointerCapture(activeDrag.pointerId);
    }
    zone.removeEventListener("click", onClick);
    zone.removeEventListener("pointerdown", onPointerDown);
    zone.removeEventListener("pointermove", onPointerMove);
    zone.removeEventListener("pointerleave", onPointerLeave);
    zone.removeEventListener("pointerup", finishDrag);
    zone.removeEventListener("pointercancel", finishDrag);
    zone.removeEventListener("keydown", onKeyDown);
    stickers.forEach((sticker) => {
      sticker.idleTween?.kill();
      sticker.idleRestartCall?.kill();
      sticker.popTween?.kill();
      gsap.killTweensOf(sticker.img);
      sticker.eyes?.destroy();
      sticker.el.remove();
    });
    stickers.length = 0;
    zone._stickerDestroy = null;
  };

  ro.observe(zone);
  io.observe(zone);
}

function initStickerZone(zone, Matter) {
  if (!stickerDesktopMQ.matches || zone._stickerDestroy || !zone.isConnected) return;

  const sources = getStickerSources();
  if (!sources.length) return;

  const { Engine, Bodies, Composite, Body } = Matter;
  const startCount = parseInt(zone.getAttribute("data-sticker-count"), 10);
  const maxCount = parseInt(zone.getAttribute("data-sticker-max"), 10) || 24;
  const sizeRem = parseFloat(zone.getAttribute("data-sticker-size")) || 6;
  const spawnMode = zone.getAttribute("data-sticker-spawn") || "cursor";
  const spawnDistance = parseFloat(zone.getAttribute("data-sticker-spawn-distance"));

  const engine = Engine.create({ enableSleeping: true });
  engine.gravity.y = reducedMotion ? 0 : 1;

  const stickers = [];
  const picker = createStickerPicker(zone, sources);
  let statics = [];
  let running = false;
  let inViewNow = false;
  let lastCursorSpawn = null;
  let lastCursorSpawnAt = 0;
  let cursorSpawnPending = false;

  const remPx = () => parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
  const stickerWidth = () => sizeRem * remPx() * (window.innerWidth < 768 ? 0.7 : 1);

  // Vloer, wanden en tekst als statische bodies, in zone-coördinaten
  // Inline SVG-colliders gebruiken benaderde lijnsegmenten langs de SVG-paden,
  // zodat stickers op de logo-vorm landen in plaats van op één grote rechthoek.
  function createSvgPathBodies(el, zr) {
    const paths = [...el.querySelectorAll("svg path[d]")];
    if (!paths.length) return [];

    const prepared = paths.map((path) => {
      try {
        const length = path.getTotalLength();
        const matrix = path.getScreenCTM();
        if (!length || !matrix) return null;
        const scale = Math.max(Math.hypot(matrix.a, matrix.b), Math.hypot(matrix.c, matrix.d));
        return scale ? { path, length, matrix, scale } : null;
      } catch (error) {
        return null;
      }
    }).filter(Boolean);

    if (!prepared.length) return [];

    // Houd de hoeveelheid bodies beperkt, ook bij complexe SVG-logo's.
    const screenLength = prepared.reduce((sum, item) => sum + item.length * item.scale, 0);
    const samplePx = Math.min(24, Math.max(10, screenLength / 500));
    const thickness = Math.max(6, Math.min(12, samplePx * 0.75));
    const bodies = [];

    prepared.forEach(({ path, length, matrix, scale }) => {
      const step = samplePx / scale;
      let previous = null;
      const sampleCount = Math.max(1, Math.ceil(length / step));

      for (let i = 0; i <= sampleCount; i++) {
        const point = path.getPointAtLength(Math.min(i * step, length));
        const current = {
          x: point.x * matrix.a + point.y * matrix.c + matrix.e - zr.left,
          y: point.x * matrix.b + point.y * matrix.d + matrix.f - zr.top,
        };

        if (previous) {
          const dx = current.x - previous.x;
          const dy = current.y - previous.y;
          const segmentLength = Math.hypot(dx, dy);

          // Skip SVG subpath jumps (M commands) instead of bridging empty space.
          if (segmentLength > samplePx * 2.5) {
            previous = current;
            continue;
          }

          if (segmentLength > 1) {
            bodies.push(Bodies.rectangle(
              (previous.x + current.x) / 2,
              (previous.y + current.y) / 2,
              segmentLength + thickness * 0.35,
              thickness,
              { isStatic: true, angle: Math.atan2(dy, dx), friction: 0.8 }
            ));
          }
        }

        previous = current;
      }
    });

    return bodies;
  }

  function buildStatics() {
    Composite.remove(engine.world, statics);
    const zr = zone.getBoundingClientRect();
    const t = 200;
    statics = [
      Bodies.rectangle(zr.width / 2, zr.height + t / 2, zr.width * 3, t, { isStatic: true }),
      Bodies.rectangle(-t / 2, zr.height / 2, t, zr.height * 4, { isStatic: true }),
      Bodies.rectangle(zr.width + t / 2, zr.height / 2, t, zr.height * 4, { isStatic: true }),
    ];
    zone.querySelectorAll("[data-sticker-collider]").forEach((el) => {
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const pathBodies = createSvgPathBodies(el, zr);
      if (pathBodies.length) {
        statics.push(...pathBodies);
      } else {
        // Gedraaide kaart (Webflow-transform of rotate): de echte, schuine rechthoek als collider,
        // anders blijven stickers op de onzichtbare hoeken van de bounding box liggen.
        const { angle, scale } = getElementRotation(el);
        const w = el.offsetWidth ? el.offsetWidth * scale : r.width;
        const h = el.offsetHeight ? el.offsetHeight * scale : r.height;
        statics.push(Bodies.rectangle(
          r.left - zr.left + r.width / 2,
          r.top - zr.top + r.height / 2,
          w, h,
          { isStatic: true, angle, chamfer: { radius: Math.min(12, h / 2) } }
        ));
      }
    });
    Composite.add(engine.world, statics);
    stickers.forEach((s) => Matter.Sleeping.set(s.body, false));
  }

  function removeSticker(s) {
    Composite.remove(engine.world, s.body);
    stickers.splice(stickers.indexOf(s), 1);
    if (s.eyes) {
      s.eyes.destroy();
      picker.release();
    }
    gsap.to(s.img, { scale: 0, rotation: "+=" + rnd(-30, 30), duration: 0.3, ease: "back.in(2)", onComplete: () => s.el.remove() });
  }

  async function spawn(x, y, automatic = false) {
    const source = picker.pick();
    let made;
    try { made = await createStickerFace(source); } catch (e) { if (source.eyes) picker.release(); return; }
    const { face: img, ratio, eyes } = made;
    const abort = () => { eyes?.destroy(); if (source.eyes) picker.release(); };
    if (!zone._stickerDestroy) return abort();

    const w = stickerWidth();
    const h = w * ratio;

    const position = findStickerSpawnPosition(zone, w, h, {
      x,
      y,
      automatic,
      autoTopRatio: 0.58,
      maxRotation: 0.4,
    });
    if (!position) return abort();

    const el = document.createElement("div");
    el.className = "sticker-zone__sticker";
    el.style.width = w + "px";
    el.style.height = h + "px";
    el.appendChild(img);
    zone.appendChild(el);

    const body = Bodies.rectangle(position.x, position.y, w * 0.96, h * 0.96, {
      chamfer: { radius: Math.min(w, h) * 0.08 },
      restitution: 0.45,
      friction: 0.3,
      frictionAir: 0.01,
      angle: rnd(-0.4, 0.4),
    });
    Body.setAngularVelocity(body, rnd(-0.08, 0.08));
    Composite.add(engine.world, body);

    const s = { el, img, body, w, h, eyes };
    stickers.push(s);
    render(s);

    // Pop: schaal op de img, de wrapper is van de physics
    if (!reducedMotion) gsap.fromTo(img, { scale: 0 }, { scale: 1, duration: 0.5, ease: "back.out(2.2)" });

    if (stickers.length > maxCount) removeSticker(stickers.find((item) => !item.eyes) || stickers[0]);
    start();
  }

  function maybeSpawnFromCursor(event) {
    if (spawnMode !== "cursor" || event.pointerType !== "mouse" || event.buttons || !inViewNow) return;
    if (event.target.closest("a, button, input, textarea, select, label")) return;
    if (cursorSpawnPending) return;

    const rect = zone.getBoundingClientRect();
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
    const minimumDistance = Number.isFinite(spawnDistance) && spawnDistance > 0
      ? spawnDistance
      : stickerWidth() * 1.8;
    const now = performance.now();
    if (lastCursorSpawn && Math.hypot(point.x - lastCursorSpawn.x, point.y - lastCursorSpawn.y) < minimumDistance) return;
    if (now - lastCursorSpawnAt < 360) return;
    if (isStickerTextPoint(zone, event.clientX, event.clientY)) return;

    lastCursorSpawn = point;
    lastCursorSpawnAt = now;
    cursorSpawnPending = true;
    spawn(point.x, point.y).finally(() => { cursorSpawnPending = false; });
  }

  function render(s) {
    const { x, y } = s.body.position;
    s.el.style.transform = `translate(${x - s.w / 2}px, ${y - s.h / 2}px) rotate(${s.body.angle}rad)`;
  }

  // Matter wil stappen van max ~16.7ms: lange frames (120Hz-wissels, haperende tab)
  // in gelijke substappen hakken, zodat stickers niet door een collider schieten.
  function tick() {
    // Alles ligt stil (Matter-sleeping): niet rekenen en geen transforms schrijven.
    // Spawnen en wegslaan maken bodies wakker, dan loopt hij weer.
    if (stickers.every((s) => s.body.isSleeping)) return;
    const dt = Math.min(gsap.ticker.deltaRatio(60) * (1000 / 60), 50);
    const steps = Math.max(1, Math.ceil(dt / (1000 / 60)));
    for (let i = 0; i < steps; i++) Engine.update(engine, dt / steps);
    stickers.forEach(render);
    // Ogen die vallen of rollen blijven naar de cursor kijken
    if (eyesPointer) stickers.forEach((s) => { if (s.eyes && !s.body.isSleeping) s.eyes.lookAt(eyesPointer.x, eyesPointer.y); });
  }

  function start() {
    if (running || !inViewNow) return;
    running = true;
    gsap.ticker.add(tick);
  }

  function stop() {
    if (!running) return;
    running = false;
    gsap.ticker.remove(tick);
  }

  const swatEnabled = zone.getAttribute("data-sticker-swat") !== "false";
  let lastPointer = null;

  function onPointerMove(event) {
    maybeSpawnFromCursor(event);
    if (!swatEnabled || reducedMotion || !inViewNow || event.pointerType !== "mouse" || event.buttons) {
      lastPointer = null;
      return;
    }

    const zoneRect = zone.getBoundingClientRect();
    const pointer = { x: event.clientX - zoneRect.left, y: event.clientY - zoneRect.top };
    const previous = lastPointer;
    lastPointer = pointer;
    if (!previous) return;

    const moveX = pointer.x - previous.x;
    const moveY = pointer.y - previous.y;
    const movement = Math.hypot(moveX, moveY);
    if (movement < 2) return;

    const radius = Math.max(128, stickerWidth() * 1.45);
    const now = performance.now();
    stickers.forEach((sticker) => {
      // Veeg je over de ogen heen, dan schrikken ze
      if (sticker.eyes && Math.hypot(sticker.body.position.x - pointer.x, sticker.body.position.y - pointer.y) < Math.max(sticker.w, sticker.h) * 0.75) {
        sticker.eyes.startle();
      }
      if (now - (sticker.lastSwatAt || 0) < 220) return;

      const dx = sticker.body.position.x - pointer.x;
      const dy = sticker.body.position.y - pointer.y;
      const distance = Math.hypot(dx, dy);
      if (distance >= radius) return;

      const awayX = distance > 0.001 ? dx / distance : moveX / movement;
      const awayY = distance > 0.001 ? dy / distance : moveY / movement;
      const proximity = 1 - distance / radius;
      const kick = Math.min(9, 2.5 + movement * 0.35) * proximity;
      let velocityX = sticker.body.velocity.x + awayX * kick;
      let velocityY = sticker.body.velocity.y + awayY * kick;
      const speed = Math.hypot(velocityX, velocityY);

      if (speed > 15) {
        velocityX = (velocityX / speed) * 15;
        velocityY = (velocityY / speed) * 15;
      }

      Matter.Sleeping.set(sticker.body, false);
      Body.setVelocity(sticker.body, { x: velocityX, y: velocityY });
      const spin = ((moveX * awayY - moveY * awayX) / movement) * 0.12 * proximity;
      Body.setAngularVelocity(sticker.body, Math.max(-0.18, Math.min(0.18, sticker.body.angularVelocity + spin)));
      sticker.lastSwatAt = now;
    });
  }

  function onPointerLeave() {
    lastPointer = null;
  }

  function onClick(e) {
    if (spawnMode !== "click") return;
    if (e.target.closest("a, button, input, textarea, select, label") || isStickerTextPoint(zone, e.clientX, e.clientY)) return;
    const zr = zone.getBoundingClientRect();
    spawn(e.clientX - zr.left, e.clientY - zr.top);
  }

  let spawnedStart = false;
  const introCalls = [];
  function spawnStartSet() {
    if (spawnedStart) return;
    spawnedStart = true;
    const count = isNaN(startCount) ? 6 : startCount;
    for (let i = 0; i < count; i++) {
      introCalls.push(gsap.delayedCall(i * 0.12, () => spawn(null, null, true)));
    }
  }

  // Alleen rekenen als de zone in beeld is
  const io = new IntersectionObserver(([entry]) => {
    inViewNow = entry.isIntersecting;
    if (inViewNow) {
      buildStatics();
      start();
      spawnStartSet();
    } else {
      stop();
    }
  }, { threshold: 0.25 });
  io.observe(zone);

  let resizeTimer;
  const ro = new ResizeObserver(() => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(buildStatics, 150);
  });
  ro.observe(zone);

  zone.addEventListener("click", onClick);
  zone.addEventListener("pointermove", onPointerMove);
  zone.addEventListener("pointerleave", onPointerLeave);
  buildStatics();

  zone._stickerDestroy = () => {
    stop();
    io.disconnect();
    ro.disconnect();
    clearTimeout(resizeTimer);
    // Anders spawnen er na een paginawissel nog stickers in een opgeruimde engine
    introCalls.forEach((call) => call.kill());
    zone.removeEventListener("click", onClick);
    zone.removeEventListener("pointermove", onPointerMove);
    zone.removeEventListener("pointerleave", onPointerLeave);
    stickers.forEach((s) => { s.eyes?.destroy(); s.el.remove(); });
    stickers.length = 0;
    Composite.clear(engine.world, false);
    Engine.clear(engine);
    zone._stickerDestroy = null;
  };
}

function destroyStickerZones(scope = document) {
  scope.querySelectorAll("[data-sticker-zone]").forEach((zone) => zone._stickerDestroy?.());
}

stickerDesktopMQ.addEventListener?.("change", (event) => {
  if (event.matches) initStickerZones(document);
  else destroyStickerZones(document);
});

// ==========================================================
// PAGE LIFECYCLE
// initPage draait bij eerste load én na elke Barba-transitie.
// Alles wat hier start, moet in destroyPage weer opgeruimd worden.
// ==========================================================

function initPage(container, { stickers = true } = {}) {
  initReveal(container);
  // Document zodat persistente accordions buiten de Barba-container ook worden meegenomen.
  initAccordionCSS(document);
  initDroppingCardsStack(container || document);
  // document, want de nieuwsbrief zit in de footer
  initFormValidate(document);
  initEyes(container || document);
  // document zodat ook een marquee buiten de Barba-container meegaat
  initMarqueeScrollDirection(document);
  initOffscreenPause(document);
  // document, zodat ook een footer buiten de Barba-container meedoet (idempotent).
  // Bij de eerste load pas na de intro (zie initFirstEnter), anders ontwijken ze tekst die nog niet op zijn plek staat.
  if (stickers) initStickerZones(document);
  ScrollTrigger.refresh();
}

function destroyPage(container) {
  destroyMarqueeScrollDirection(document);
  if (container) destroyOffscreenPause(container);
  ScrollTrigger.getAll().forEach((st) => st.kill());
  if (container) {
    destroyAccordionCSS(container);
    destroyFormValidate(container);
    destroyEyes(container);
    destroyDroppingCardsStack(container);
    destroyStickerZones(container);
  }
}

// ==========================================================
// TRANSITIE-ENGINE (data-tr) — overgezet uit "Stercq Showcase animaties.html"
// Geen overlay: alles wat in beeld staat gaat op zijn eigen manier weg,
// de nieuwe pagina bouwt zich op met één veegrand over de kleurvlakken.
//
// data-tr="lines"    tekst, valt per regel in zijn masker (SplitText)
// data-tr="chars"    tekst per letter
// data-tr="slide"    knoppen/kleine blokken, schuiven in hun masker
// data-tr="line"     lijnen, schalen in/uit
// data-tr="pop"      kleine elementen, poppen
// data-tr="sticker"  stickers, worden erop geplakt / poppen eraf met draai
// data-tr="media"    beelden — data-in="wipe|pop|slap|drop", data-out="wipe|pop|drop"
// data-tr="wipe"     gekleurde secties, de veegrand loopt hierover
// data-header-theme="light|dark" op de container → html[data-header-theme] voor de header-CSS
// data-tr-hidden / data-tr-defer op een wrapper: niet meenemen in leave / enter
// ==========================================================

// TRANSITIELIJST — welke animatie elk element krijgt, op class, zodat er in Webflow
// niets per element hoeft. Een data-tr die je in Webflow zelf zet wint altijd;
// data-tr="none" zet een element uit. Eerste match wint.
// [selector, data-tr, data-in, data-out]
const TR_MAP = [
  [".button-052", "pop"],
  [".hero_section h1, .hero_section .text_main, .work_container > h2, .card-stack__item-h, .card-stack__item-p, " +
   ".text_wrap_resultaten h3, .text_wrap_review h2, .faq_wrap .text_wrap h2, .cta_items_wrap .text_main, " +
   ".werk_card > h4, .werk_card > .text_main, .heading_wrap h3, .contact_list .text_main, ._404 h2, .text_main-2, " +
   ".slogan_wrap_footer .text_main", "lines"],
  [".hero_section.werk, .card-stack__item, ._100vh_sectie, .purple_bg, .sidebar, footer.footer", "wipe"],
  [".cta_items_wrap .icon-embed-custom-7", "sticker"],
  [".result", "media", "slap", "pop"],
  [".dropping-stack, .review", "media", "pop", "pop"],
  [".radial-cards-marquee", "media", "pop", "drop"],
  // h2 nieuwsbrief: wipe i.p.v. lines, anders blijft het paarse vlak achter "hoogte" als streep staan
  [".marquee-advanced, .accordion-css__item, .cta_items_wrap h2, .form-field-group[data-validate], .werk_img, " +
   ".rich_text, .document_list_small, .footer_large_logo_wrap", "media", "wipe", "wipe"],
];

function applyTrMap(c) {
  TR_MAP.forEach(([selector, tr, inType, outType]) => {
    c.querySelectorAll(selector).forEach((el) => {
      if (el.hasAttribute("data-tr")) return;
      el.setAttribute("data-tr", tr);
      if (inType) el.setAttribute("data-in", inType);
      if (outType) el.setAttribute("data-out", outType);
    });
  });
}

const rnd = gsap.utils.random;
// GSAP neemt de CSS-rotate over; onthoud die ontwerphoek zodat elke animatie daar weer eindigt
const base = (el) => (el._base != null ? el._base : (el._base = gsap.getProperty(el, "rotation")));
const setIf = (targets, vars) => { if (targets && targets.length) gsap.set(targets, vars); };
const vh = () => window.innerHeight;
const each = (n, per, max) => (n > 1 && n * per > max ? max / n : per);

const trState = { headerTheme: "light" };

function inView(el, h = vh(), w = window.innerWidth) {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < h && r.right > 0 && r.left < w;
}

// Alleen wat echt te zien is doet mee met de leave
function isShown(el) {
  const cs = getComputedStyle(el);
  if (cs.visibility === "hidden" || parseFloat(cs.opacity) < 0.05) return false;
  if (gsap.getProperty(el, "scaleX") < 0.05) return false;
  return !(el.style.clipPath || "").includes("100%");
}

function splitAll(c) {
  if (!window.SplitText) return;
  c.querySelectorAll('[data-tr="lines"]').forEach((el) => {
    if (el._split) return;
    el._split = SplitText.create(el, { type: "lines", mask: "lines", linesClass: "tr-line", autoSplit: true });
  });
  c.querySelectorAll('[data-tr="chars"]').forEach((el) => {
    if (!el._split) el._split = SplitText.create(el, { type: "chars", mask: "chars", charsClass: "tr-char" });
  });
}

function unsplitAll(c) {
  c.querySelectorAll('[data-tr="lines"],[data-tr="chars"]').forEach((el) => {
    if (el._split) { el._split.revert(); el._split = null; }
  });
}

function collect(list, h) {
  const p = { sticker: [], pop: [], lines: [], chars: [], slide: [], line: [], media: [], wipe: [] };
  list.forEach((el) => {
    const t = el.getAttribute("data-tr");
    if (t === "lines") (el._split ? el._split.lines : [el]).forEach((l) => { if (inView(l.parentElement, h)) p.lines.push(l); });
    else if (t === "chars") p.chars.push(...(el._split ? el._split.chars : [el]));
    else if (p[t]) p[t].push(el);
  });
  return p;
}

function setHeaderTheme(name) {
  if (name === trState.headerTheme) return;
  trState.headerTheme = name;
  document.documentElement.setAttribute("data-header-theme", name);
}

function headerLine() {
  const header = document.querySelector("[data-header]");
  if (!header) return 0;
  const r = header.getBoundingClientRect();
  return r.top + r.height / 2;
}

// Eén veegrand over alle zichtbare kleurvlakken, in viewport-coördinaten
function sweep(sections, dir, opts = {}) {
  const h = vh();
  const rects = sections.map((s) => s.getBoundingClientRect());
  const from = Math.max(0, Math.min(...rects.map((r) => r.top)));
  const to = Math.min(h, Math.max(...rects.map((r) => r.bottom)));
  const duration = 0.62 * (0.55 + (0.45 * Math.max(0, to - from)) / h);
  const edge = { y: from };
  let passed = false;

  const apply = () => {
    rects.forEach((r, i) => {
      const cut = gsap.utils.clamp(0, r.height, edge.y - r.top);
      sections[i].style.clipPath = dir === "out" ? `inset(${cut}px 0px 0px 0px)` : `inset(0px 0px ${r.height - cut}px 0px)`;
    });
    if (!passed && opts.onHeader && edge.y >= headerLine()) { passed = true; opts.onHeader(); }
  };

  return gsap.to(edge, {
    y: to, duration, ease: "power2.inOut", onStart: apply, onUpdate: apply,
    onComplete() {
      apply();
      if (!passed && opts.onHeader) opts.onHeader();
      if (dir === "in") sections.forEach((s) => { s.style.clipPath = ""; });
    },
  });
}

// Streepje onder de actieve nav-link schuift mee (desktop)
// [data-nav-indicator] in dezelfde parent als de [data-nav-link]'s
function moveIndicator(url, instant) {
  const indicator = document.querySelector("[data-nav-indicator]");
  if (!indicator) return;
  const path = new URL(url, window.location.origin).pathname;
  const links = [...document.querySelectorAll("[data-nav-link]")];
  const link = links.find((a) => {
    const p = new URL(a.href, window.location.origin).pathname;
    return p === "/" ? path === "/" : path === p || path.startsWith(p + "/");
  });
  links.forEach((a) => a.classList.toggle("is-active", a === link));
  if (!link) { gsap.to(indicator, { scaleX: 0, duration: instant ? 0 : 0.3 }); return; }
  const v = { x: link.offsetLeft, width: link.offsetWidth, scaleX: 1 };
  instant ? gsap.set(indicator, v) : gsap.to(indicator, { ...v, duration: 0.7, ease: "power3.inOut", overwrite: "auto" });
}

function pageOut(c) {
  const h = vh();
  const all = [...c.querySelectorAll("[data-tr]")];
  const vis = all.filter((el) => inView(el, h) && isShown(el) && !el.closest("[data-tr-hidden]"));
  setIf(all.filter((el) => !vis.includes(el) && el.getAttribute("data-tr") !== "wipe"), { autoAlpha: 0 });

  const tl = gsap.timeline();
  if (reducedMotion) { tl.to(c, { autoAlpha: 0, duration: 0.2 }); return tl; }

  const p = collect(vis, h);
  // Stickers die de stickerzones zelf neerleggen (board en zwaartekracht) poppen er ook af.
  // Het img binnenin, want de wrapper krijgt elke frame zijn positie van de zone.
  c.querySelectorAll(".sticker-board__sticker > .sticker-face, .sticker-zone__sticker > .sticker-face").forEach((face) => {
    if (inView(face, h)) p.sticker.push(face);
  });
  // Wat nog niet binnen is (boven/onder zijn masker) slaan we over, anders schiet het er even doorheen
  const inPlace = (el) => Math.abs(gsap.getProperty(el, "yPercent")) < 50;
  p.lines = p.lines.filter(inPlace); p.chars = p.chars.filter(inPlace); p.slide = p.slide.filter(inPlace);

  if (p.sticker.length) tl.to(p.sticker, { keyframes: [
    { scale: 1.12, duration: 0.1, ease: "power2.out" },
    { scale: 0, rotation: () => "+=" + rnd(-35, 35), duration: 0.3, ease: "back.in(2.4)" },
  ], stagger: { each: each(p.sticker.length, 0.045, 0.2), from: "random" }, overwrite: "auto" }, 0);
  if (p.pop.length) tl.to(p.pop, { scale: 0, duration: 0.3, ease: "back.in(2)", stagger: each(p.pop.length, 0.035, 0.15), overwrite: "auto" }, 0.02);
  if (p.lines.length) tl.to(p.lines, { yPercent: 140, duration: 0.42, ease: "power3.in", stagger: each(p.lines.length, 0.035, 0.22), overwrite: "auto" }, 0.04);
  if (p.chars.length) tl.to(p.chars, { yPercent: 112, duration: 0.42, ease: "power3.in", stagger: each(p.chars.length, 0.025, 0.16) }, 0.04);
  if (p.slide.length) tl.to(p.slide, { yPercent: 125, duration: 0.4, ease: "power3.in", stagger: each(p.slide.length, 0.03, 0.18), overwrite: "auto" }, 0.06);
  if (p.line.length) tl.to(p.line, { scaleX: 0, transformOrigin: "right center", duration: 0.42, ease: "power3.in", stagger: each(p.line.length, 0.03, 0.15) }, 0.06);

  if (p.media.length) {
    const out = (k) => p.media.filter((el) => (el.getAttribute("data-out") || "wipe") === k);
    const wipe = out("wipe"), pop = out("pop"), drop = out("drop");
    if (wipe.length) tl.fromTo(wipe, { clipPath: "inset(0% 0% 0% 0%)" }, { clipPath: "inset(100% 0% 0% 0%)", duration: 0.5, ease: "power3.in", overwrite: "auto" }, 0.06);
    if (pop.length) tl.to(pop, { keyframes: [
      { scale: 1.06, duration: 0.12, ease: "power2.out" },
      { scale: 0, rotation: () => "+=" + rnd(-22, 22), duration: 0.38, ease: "back.in(1.7)" },
    ], stagger: 0.06, overwrite: "auto" }, 0.03);
    if (drop.length) tl.to(drop, { keyframes: [
      { y: -14, duration: 0.14, ease: "power2.out" },
      { y: () => vh() * 1.15, rotation: (i, el) => base(el) + rnd(-28, 28), duration: 0.72, ease: "power2.in" },
    ], stagger: 0.07, overwrite: "auto" }, 0.02);
  }

  const hasEls = tl.duration() > 0;
  if (p.wipe.length) tl.add(sweep(p.wipe, "out", { onHeader: () => setHeaderTheme("light") }), hasEls ? 0.3 : 0);
  else tl.call(() => setHeaderTheme("light"), null, 0);
  if (tl.duration() < 0.15) tl.to({}, { duration: 0.15 });
  return tl;
}

function setInitialStates(c) {
  const h = vh();
  const pageTheme = c.getAttribute("data-header-theme") || "light";
  c._pageTheme = pageTheme;

  if (reducedMotion) { gsap.set(c, { autoAlpha: 0 }); c._enter = null; setHeaderTheme(pageTheme); return; }

  const vis = [...c.querySelectorAll("[data-tr]")].filter((el) => !el.closest("[data-tr-defer]") && inView(el, h));
  const p = collect(vis, h);
  c._enter = p;

  // Regels reizen verder dan 100%: het masker heeft extra ruimte boven/onder (zie .tr-line-mask)
  setIf(p.lines, { yPercent: -140 });
  setIf(p.chars, { yPercent: -112 });
  setIf(p.slide, { yPercent: -125 });
  setIf(p.sticker, { scale: 1.6, autoAlpha: 0, rotation: (i, el) => base(el) + rnd(-28, 28) });
  setIf(p.pop, { scale: 0 });
  setIf(p.line, { scaleX: 0, transformOrigin: "left center" });

  const mIn = (k) => p.media.filter((el) => (el.getAttribute("data-in") || "wipe") === k);
  setIf(mIn("wipe"), { clipPath: "inset(0% 0% 100% 0%)" });
  setIf(mIn("pop"), { scale: 0, rotation: (i, el) => base(el) + rnd(-10, 10) });
  setIf(mIn("slap"), { scale: 1.3, autoAlpha: 0, rotation: (i, el) => base(el) + rnd(-12, 12) });
  setIf(mIn("drop"), { y: () => -vh(), rotation: (i, el) => base(el) + rnd(-20, 20) });
  p.wipe.forEach((s) => { s.style.clipPath = "inset(0px 0px 100% 0px)"; });

  if (pageTheme === "light" || !p.wipe.length) setHeaderTheme(pageTheme);
}

function pageIn(c) {
  const tl = gsap.timeline();
  gsap.set(c, { autoAlpha: 1 });
  if (reducedMotion || !c._enter) { setHeaderTheme(c._pageTheme || "light"); return tl; }

  const p = c._enter;
  let t = 0;
  if (p.wipe.length) { tl.add(sweep(p.wipe, "in", { onHeader: () => setHeaderTheme(c._pageTheme) }), 0); t = 0.26; }
  if (p.lines.length) tl.to(p.lines, { yPercent: 0, duration: 0.95, ease: "power4.out", stagger: each(p.lines.length, 0.06, 0.42) }, t);
  if (p.chars.length) tl.to(p.chars, { yPercent: 0, duration: 1, ease: "power4.out", stagger: each(p.chars.length, 0.035, 0.3) }, t + 0.05);

  if (p.media.length) {
    const mIn = (k) => p.media.filter((el) => (el.getAttribute("data-in") || "wipe") === k);
    const wipe = mIn("wipe"), pop = mIn("pop"), slap = mIn("slap"), drop = mIn("drop");
    if (wipe.length) tl.to(wipe, { clipPath: "inset(0% 0% 0% 0%)", duration: 1, ease: "power3.inOut", clearProps: "clipPath" }, t + 0.1);
    if (pop.length) tl.to(pop, { scale: 1, rotation: (i, el) => base(el), duration: 0.8, ease: "back.out(1.6)", stagger: 0.08 }, t + 0.15);
    if (slap.length) tl.to(slap, { scale: 1, autoAlpha: 1, rotation: (i, el) => base(el), duration: 0.6, ease: "back.out(2)", stagger: 0.1 }, t + 0.25);
    if (drop.length) tl.to(drop, { y: 0, rotation: (i, el) => base(el), duration: 1.1, ease: "bounce.out", stagger: 0.1 }, t + 0.05);
  }

  if (p.line.length) tl.to(p.line, { scaleX: 1, duration: 0.9, ease: "power3.inOut", stagger: each(p.line.length, 0.07, 0.3) }, t + 0.15);
  if (p.slide.length) tl.to(p.slide, { yPercent: 0, duration: 0.8, ease: "power3.out", stagger: each(p.slide.length, 0.05, 0.25) }, t + 0.2);
  if (p.pop.length) tl.to(p.pop, { scale: 1, duration: 0.55, ease: "back.out(2.2)", stagger: each(p.pop.length, 0.05, 0.25) }, t + 0.3);
  if (p.sticker.length) tl.to(p.sticker, { scale: 1, autoAlpha: 1, rotation: (i, el) => base(el), duration: 0.55, ease: "back.out(2.4)", stagger: { each: each(p.sticker.length, 0.08, 0.35), from: "random" } }, t + 0.45);

  return tl;
}

// ==========================================================
// BARBA TRANSITIONS
// leave = pageOut, enter = setInitialStates + pageIn.
// Barba prefetcht al op hover, dus de nieuwe pagina staat meestal klaar.
// ==========================================================

function initBarba() {
  if (!window.barba) return;
  // In de Webflow Editor (klant past teksten aan) geen Barba: die links moeten gewoon herladen
  if (window.Webflow?.env?.("editor") || document.documentElement.classList.contains("w-editor")) return;

  barba.hooks.before((data) => {
    document.documentElement.classList.add("is-transitioning");
    closeNavigation();
    lockScroll();
    moveIndicator(data.next.url.href);
  });

  barba.hooks.after((data) => {
    reinitWebflow(data.next.html);
    updateCurrentNav();
    unlockScroll();
    document.documentElement.classList.remove("is-transitioning");
  });

  barba.init({
    preventRunning: true,
    timeout: 5000,
    transitions: [
      {
        name: "stercq",

        leave(data) {
          return pageOut(data.current.container);
        },

        afterLeave(data) {
          destroyPage(data.current.container);
          unsplitAll(data.current.container);
          gsap.set(data.current.container, { display: "none" });
        },

        beforeEnter(data) {
          resetScroll();
          applyTrMap(data.next.container);
          splitAll(data.next.container);
          setInitialStates(data.next.container);
        },

        enter(data) {
          return pageIn(data.next.container);
        },

        afterEnter(data) {
          initPage(data.next.container);
        },
      },
    ],
  });
}

// Eerste load: dezelfde opbouw als na een transitie
async function initFirstEnter() {
  const c = document.querySelector('[data-barba="container"]');
  if (!c) return;
  await Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]);
  applyTrMap(c);
  splitAll(c);
  setInitialStates(c);
  document.documentElement.classList.add("is-ready");
  // Stickers plakken pas als koppen en knoppen staan (max 0.9s), anders ontwijken ze tekst die nog onderweg is
  const tl = pageIn(c);
  gsap.delayedCall(Math.min(tl.duration(), 0.9), () => initStickerZones(document));
}

// ==========================================================
// INIT
// ==========================================================

function initSite() {
  initLenis();
  initBarba();
  initBoldFullScreenNavigation();
  updateCurrentNav();
  moveIndicator(window.location.href, true);
  const container = document.querySelector('[data-barba="container"]');
  initPage(container || document, { stickers: !container });
  initFirstEnter();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSite);
} else {
  initSite();
}
