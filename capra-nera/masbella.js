 // Init Locomotive Scroll v5
 const locomotiveScroll = new LocomotiveScroll({
   autoStart: false,
   lenisOptions: {
     lerp: 0.1,
     duration: 1.2,
     easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
   }
 });

 function isDesktop() {
   return window.innerWidth > 1024; // tweak breakpoint if you want
 }

 let savedScroll = 0;

 // Scroll pauzeren én blokkeren
 function lockScroll() {
   locomotiveScroll.stop(); // Smooth scroll loop pauzeren
   document.body.style.overflow = "hidden"; // Native scroll blokkeren
 }

 // Scroll weer activeren
 function unlockScroll() {
   locomotiveScroll.start(); // Smooth scroll weer starten
   document.body.style.overflow = "";
 }

 document.querySelectorAll(".disable").forEach(btn => {
   btn.addEventListener("click", lockScroll);
 });

 // Alle enable-knoppen
 document.querySelectorAll(".enable").forEach(btn => {
   btn.addEventListener("click", unlockScroll);
 });

 // GSAP plugins
 gsap.registerPlugin(ScrollTrigger, Draggable, SplitText, CustomEase);
 gsap.ticker.lagSmoothing(0);

 // ScrollTrigger elke tick updaten
 gsap.ticker.add(ScrollTrigger.update);

 // Refresh alles
 ScrollTrigger.refresh();

 // ==========================================================
 // GLOBAL PARALLAX
 // ==========================================================

 function initGlobalParallax() {
   const mm = gsap.matchMedia();
   mm.add(
     {
       isMobile: "(max-width:479px)",
       isMobileLandscape: "(max-width:767px)",
       isTablet: "(max-width:991px)",
       isDesktop: "(min-width:992px)"
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
           ) {
             return;
           }
           const target = trigger.querySelector('[data-parallax="target"]') || trigger;
           const direction = trigger.getAttribute("data-parallax-direction") ||
             "vertical";
           const prop = direction === "horizontal" ? "xPercent" : "yPercent";
           const scrubAttr = trigger.getAttribute("data-parallax-scrub");
           const scrub = scrubAttr ? parseFloat(scrubAttr) : true;
           const startAttr = trigger.getAttribute("data-parallax-start");
           const startVal = startAttr !== null ? parseFloat(startAttr) : 20;
           const endAttr = trigger.getAttribute("data-parallax-end");
           const endVal = endAttr !== null ? parseFloat(endAttr) : -20;
           const scrollStartRaw = trigger.getAttribute("data-parallax-scroll-start") ||
             "top bottom";
           const scrollStart = `clamp(${scrollStartRaw})`;
           const scrollEndRaw = trigger.getAttribute("data-parallax-scroll-end") ||
             "bottom top";
           const scrollEnd = `clamp(${scrollEndRaw})`;
           gsap.fromTo(
             target, {
               [prop]: startVal
             },
             {
               [prop]: endVal,
               ease: "none",
               scrollTrigger: {
                 trigger,
                 start: scrollStart,
                 end: scrollEnd,
                 scrub,
               },
             }
           );
         });
       });
       return () => ctx.revert();
     }
   );
 }

 // ==========================================================
 // Split Config (custom durations per split type)
 // ==========================================================
 const splitConfig = {
   lines: { duration: 0.8, stagger: 0.08 },
   words: { duration: 0.8, stagger: 0.06 },
   chars: { duration: 0.4, stagger: 0.01 }
 };

 // ==========================================================
 // Navbar config
 // ==========================================================

 const navElements = [
   document.querySelector(".logo_wrapper"),
   document.querySelector(".nav_items"),
   document.querySelector(".nav_btn_wrap"),
 ].filter(Boolean);

 // ===========================================================
 // NAV ANIMATIE — run after preloader or immediately
 // ===========================================================

 function animateNav() {
   if (navElements.length > 0) {
     gsap.to(navElements, {
       y: 0,
       autoAlpha: 1,
       duration: 0.8,
       ease: "expo.out",
       stagger: 0.15,
     });
   }
 }

 // ==========================================================
 // ✅ PRELOADER CHECK — only run if .preloader exists
 // ==========================================================
 const preloaderEl = document.querySelector(".preloader");
 const hasPreloader = Boolean(preloaderEl);

 if (!hasPreloader) {
   unlockScroll?.();
   locomotiveScroll?.start?.();
   ScrollTrigger.refresh();
   animateNav();

   // Wait a tiny bit before starting video players
   setTimeout(() => {
     if (window.BunnyPlayer) {
       BunnyPlayer.initLightbox();
       BunnyPlayer.initBackground();
     }
   }, 300);
 }
 else {

   lockScroll();
   document.body.style.cursor = "wait";

   if (window.locomotiveScroll) {
     locomotiveScroll.scrollTo(0, { immediate: true, disableLerp: true });
   } else {
     window.scrollTo(0, 0);
   }

   // ✅ EARLY UNLOCK function, runs once
   let didEarlyUnlock = false;

   function earlyUnlock() {
     if (didEarlyUnlock) return;
     didEarlyUnlock = true;
     document.body.style.cursor = "";
     unlockScroll?.();
     locomotiveScroll?.start?.();
     ScrollTrigger.refresh();

     // ⭐ BUNNY FIX — required on pages WITH preloader
     setTimeout(() => {
       if (window.BunnyPlayer) {
         BunnyPlayer.initLightbox();
         BunnyPlayer.initBackground();
       }
     }, 350);
   }

   const svgPaths = gsap.utils.toArray(".svg_icon path");
   const bgHero = document.querySelector(".background_image_hero");
   const revealItems = gsap.utils.toArray("[data-preload-reveal]:not([data-hero-heading])");

   if (svgPaths.length) gsap.set(svgPaths, { opacity: 0.2, yPercent: 20, rotate: 5 });
   if (bgHero) gsap.set(bgHero, { scale: 1.6, transformOrigin: "center center" });
   if (revealItems.length) gsap.set(revealItems, { opacity: 0, y: 40 });

   const master = gsap.timeline({
     defaults: { ease: "sine.inOut" },
     onComplete: () => earlyUnlock() // fallback safety
   });

   if (svgPaths.length) {
     svgPaths.forEach((path, i) => {
       const tl = gsap.timeline({ delay: i * 0.05 });
       tl.to(path, {
         opacity: 1,
         yPercent: 0,
         rotate: 0,
         duration: 0.45,
         ease: "expo.out"
       }).to(path, {
         opacity: 1,
         duration: 0.25
       });
       master.add(tl, 0);
     });
   }

   if (document.querySelector(".svg_icon")) {
     master.to(".svg_icon", {
       scale: 0.9,
       opacity: 0,
       duration: 0.7,
       ease: "expo.inOut"
     }, ">0.2");
   }

   // ✅ EARLY UNLOCK 0.1s before the slide animation (A-choice)
   master.add("earlyUnlockPoint", "-=0.1").call(earlyUnlock, null, "earlyUnlockPoint");

   master.to(".preloader", {
     yPercent: -100,
     duration: 1.4, // ORIGINAL DURATION — untouched
     ease: "expo.inOut"
   }, "-=0.55");

   master.call(animateNav, null, "-=0.3");

   if (bgHero) {
     master.to(bgHero, {
       scale: 1.2,
       duration: 4, // ORIGINAL — untouched
       ease: CustomEase.create("custom",
         "M0,0 C0.084,0.61 0.04,0.786 0.157,0.889 0.23,0.953 0.374,1 1,1"
       )
     }, "-=1.1");
   }

   if (revealItems.length) {
     master.to(revealItems, {
       opacity: 1,
       y: 0,
       duration: 1.1,
       stagger: 0.08,
       ease: "expo.out"
     }, "-=0.9");
   }

   const heroHeadings = document.querySelectorAll("[data-hero-heading]");
   heroHeadings.forEach((heroHeading) => {
     const type = heroHeading.dataset.splitReveal || "words";
     const typesToSplit =
       type === "lines" ? ["lines"] :
       type === "words" ? ["lines", "words"] : ["lines", "words", "chars"];

     SplitText.create(heroHeading, {
       type: typesToSplit.join(", "),
       mask: "lines",
       autoSplit: true,
       linesClass: "line",
       wordsClass: "word",
       charsClass: "letter",
       onSplit(instance) {
         const targets = instance[type];
         const config = splitConfig[type];

         gsap.set(heroHeading, { autoAlpha: 1 });

         master.from(targets, {
           yPercent: 110,
           duration: config.duration,
           stagger: config.stagger,
           ease: "expo.out"
         }, "-=3.7"); // ORIGINAL offset — untouched
       }
     });
   });

 } // end if hasPreloader

 // ==========================================================
 // MARQUEE
 // ==========================================================

 function initMarqueeScrollDirection() {
   document.querySelectorAll('[data-marquee-scroll-direction-target]').forEach((marquee) => {
     // Query marquee elements
     const marqueeContent = marquee.querySelector('[data-marquee-collection-target]');
     const marqueeScroll = marquee.querySelector('[data-marquee-scroll-target]');
     if (!marqueeContent || !marqueeScroll) return;

     // Get data attributes
     const {
       marqueeSpeed: speed,
       marqueeDirection: direction,
       marqueeDuplicate: duplicate,
       marqueeScrollSpeed: scrollSpeed
     } = marquee.dataset;

     // Convert data attributes to usable types
     const marqueeSpeedAttr = parseFloat(speed);
     const marqueeDirectionAttr = direction === 'right' ? 1 : -1; // 1 for right, -1 for left
     const duplicateAmount = parseInt(duplicate || 0);
     const scrollSpeedAttr = parseFloat(scrollSpeed);
     const speedMultiplier = window.innerWidth < 479 ? 0.25 : window.innerWidth < 991 ? 0.5 :
       1;

     let marqueeSpeed = marqueeSpeedAttr * (marqueeContent.offsetWidth / window.innerWidth) *
       speedMultiplier;

     // Precompute styles for the scroll container
     marqueeScroll.style.marginLeft = `${scrollSpeedAttr * -1}%`;
     marqueeScroll.style.width = `${(scrollSpeedAttr * 2) + 100}%`;

     // Duplicate marquee content
     if (duplicateAmount > 0) {
       const fragment = document.createDocumentFragment();
       for (let i = 0; i < duplicateAmount; i++) {
         fragment.appendChild(marqueeContent.cloneNode(true));
       }
       marqueeScroll.appendChild(fragment);
     }

     // GSAP animation for marquee content
     const marqueeItems = marquee.querySelectorAll('[data-marquee-collection-target]');
     const animation = gsap.to(marqueeItems, {
       xPercent: -100, // Move completely out of view
       repeat: -1,
       duration: marqueeSpeed,
       ease: 'linear'
     }).totalProgress(0.5);

     // Initialize marquee in the correct direction
     gsap.set(marqueeItems, { xPercent: marqueeDirectionAttr === 1 ? 100 : -100 });
     animation.timeScale(marqueeDirectionAttr); // Set correct direction
     animation.play(); // Start animation immediately

     // Set initial marquee status
     marquee.setAttribute('data-marquee-status', 'normal');

     // ScrollTrigger logic for direction inversion
     ScrollTrigger.create({
       trigger: marquee,
       start: 'top bottom',
       end: 'bottom top',
       onUpdate: (self) => {
         const isInverted = self.direction === 1; // Scrolling down
         const currentDirection = isInverted ? -marqueeDirectionAttr :
           marqueeDirectionAttr;

         // Update animation direction and marquee status
         animation.timeScale(currentDirection);
         marquee.setAttribute('data-marquee-status', isInverted ? 'normal' :
           'inverted');
       }
     });

     // Extra speed effect on scroll
     const tl = gsap.timeline({
       scrollTrigger: {
         trigger: marquee,
         start: '0% 100%',
         end: '100% 0%',
         scrub: 0
       }
     });

     const scrollStart = marqueeDirectionAttr === -1 ? scrollSpeedAttr : -scrollSpeedAttr;
     const scrollEnd = -scrollStart;

     tl.fromTo(marqueeScroll, { x: `${scrollStart}vw` }, {
       x: `${scrollEnd}vw`,
       ease: 'none'
     });
   });
 }

 // =========================================================
 // Mobile Menu Animation 
 // =========================================================
 function initMobileMenuAnimation() {
   const menu = document.querySelector(".mobile_menu");
   const trigger = document.querySelector(".menu_open_btn");
   const hamburger = document.querySelector(".hamburger_icon");
   const navLinks = document.querySelectorAll(".mobile_nav_link");
   const closeButtons = document.querySelectorAll(".menu-close");

   if (!menu || !trigger || !hamburger || navLinks.length === 0) {
     console.warn("Missing elements, aborting.");
     return;
   }

   // SplitText with masked wrapper (scoped, non-destructive)
   const splitResults = [];
   navLinks.forEach((el) => {
     const split = new SplitText(el, { type: "lines", linesClass: "mm-line" });

     // Wrap each line in a mask once
     split.lines.forEach((line) => {
       if (line.parentElement && line.parentElement.classList.contains("mm-mask")) return;
       const mask = document.createElement("div");
       mask.classList.add("mm-mask");
       line.parentNode.insertBefore(mask, line);
       mask.appendChild(line);
     });

     splitResults.push(split);
   });

   const menuTl = gsap.timeline({ paused: true, reversed: true });

   // Slide menu in
   menuTl
     .set(menu, { display: "flex" })
     .to(menu, { y: "0%", duration: 0.8, ease: "expo.out" });

   function animateTextReveal() {
     splitResults.forEach((split) => {
       gsap.set(split.lines, { yPercent: 100 }); // reset
     });

     splitResults.forEach((split) => {
       menuTl.to(
         split.lines,
         {
           yPercent: 0,
           duration: 0.6,
           ease: "expo.out",
           stagger: 0.06,
         },
         "-=0.5"
       );
     });
   }

   animateTextReveal();

   menuTl.eventCallback("onReverseComplete", () => {
     gsap.set(menu, { display: "none" });
     unlockScroll?.();
   });

   function toggleHamburger(isOpen) {
     gsap.to(".bar1", { rotation: isOpen ? 45 : 0, y: isOpen ? 6 : 0, duration: 0.3 });
     gsap.to(".bar2", { opacity: isOpen ? 0 : 1, duration: 0.2 });
     gsap.to(".bar3", { rotation: isOpen ? -45 : 0, y: isOpen ? -6 : 0, duration: 0.3 });
   }

   trigger.addEventListener("click", (e) => {
     e.preventDefault();
     const isOpening = menuTl.reversed();
     if (isOpening) {
       animateTextReveal();
       lockScroll?.();
     }
     menuTl.reversed() ? menuTl.play() : menuTl.reverse();
     toggleHamburger(isOpening);
   });

   [...navLinks, ...closeButtons].forEach((el) => {
     el.addEventListener("click", (e) => {
       if (!menuTl.reversed()) {
         menuTl.reverse();
         toggleHamburger(false);
       }
     });
   });
 }
 // ==========================================================
 // Reviews
 // ==========================================================
 function initDraggables() {
   const track = document.querySelector(".review_wrapper");
   const wrapper = document.querySelector(".review_sectie");
   const cards = document.querySelectorAll(".review_card, .photo_review_card");

   if (!(track && wrapper && cards.length)) return;

   let startX = 0;
   const maxX = 0;
   const minX = wrapper.offsetWidth - track.scrollWidth;

   const getSnapPositions = () => {
     const positions = [];
     const trackRect = track.getBoundingClientRect();
     cards.forEach(card => {
       positions.push(-(card.getBoundingClientRect().left - trackRect.left));
     });
     return positions;
   };

   const findClosestSnapPosition = (currentX, snapPositions, startX) => {
     const dragDistance = currentX - startX;
     const threshold = 50;
     let currentIndex = 0;
     let smallestDistance = Math.abs(startX - snapPositions[0]);

     snapPositions.forEach((position, index) => {
       const distance = Math.abs(startX - position);
       if (distance < smallestDistance) {
         smallestDistance = distance;
         currentIndex = index;
       }
     });

     if (dragDistance < -threshold && currentIndex < snapPositions.length - 1) {
       return snapPositions[currentIndex + 1];
     }
     if (dragDistance > threshold && currentIndex > 0) {
       return snapPositions[currentIndex - 1];
     }
     return snapPositions[currentIndex];
   };

   let snapPositions = getSnapPositions();

   const draggable = Draggable.create(track, {
     type: "x",
     bounds: { minX, maxX },
     edgeResistance: 0.8,
     dragClickables: true,
     zIndexBoost: false,
     onDragStart: function () {
       startX = this.x;
     },
     onDragEnd: function () {
       const targetX = findClosestSnapPosition(this.x, snapPositions, startX);
       const clampedX = Math.max(minX, Math.min(maxX, targetX));
       gsap.to(track, { x: clampedX, duration: 0.3, ease: "power2.out" });
     }
   })[0];

   window.addEventListener("resize", () => {
     gsap.set(track, { x: 0 });
     draggable.applyBounds({ minX: wrapper.offsetWidth - track.scrollWidth, maxX: 0 });
     snapPositions = getSnapPositions();
   });

   // ADD THIS PART INSIDE THE FUNCTION
   const forwardBtn = document.querySelector("a.forward");
   const backwardBtn = document.querySelector("a.backward");

   function moveToSnap(direction) {
     const currentX = gsap.getProperty(track, "x");

     let closestIndex = 0;
     let smallestDiff = Math.abs(currentX - snapPositions[0]);
     snapPositions.forEach((pos, i) => {
       const diff = Math.abs(currentX - pos);
       if (diff < smallestDiff) {
         smallestDiff = diff;
         closestIndex = i;
       }
     });

     let newIndex = closestIndex;
     if (direction === "forward" && closestIndex < snapPositions.length - 1) {
       newIndex++;
     } else if (direction === "backward" && closestIndex > 0) {
       newIndex--;
     }

     const newX = Math.max(minX, Math.min(maxX, snapPositions[newIndex]));
     gsap.to(track, { x: newX, duration: 0.4, ease: "power2.out" });
   }

   if (forwardBtn) {
     forwardBtn.addEventListener("click", (e) => {
       e.preventDefault();
       moveToSnap("forward");
     });
   }

   if (backwardBtn) {
     backwardBtn.addEventListener("click", (e) => {
       e.preventDefault();
       moveToSnap("backward");
     });
   }
 }

 // ==========================================================
 // Carousel / Slideshow
 // ==========================================================

 gsap.registerPlugin(Observer, CustomEase);
 CustomEase.create("slideshow-wipe", "0.6, 0.08, 0.02, 0.99");
 /*
  function initSlideShow(el) {
    // ✅ voorkom dubbele init op dezelfde wrap
    if (el._slideshowDestroy) {
      el._slideshowDestroy();
      el._slideshowDestroy = null;
    }

    // ✅ reset eventuele oude transforms/state
    const slidesReset = Array.from(el.querySelectorAll('[data-slideshow="slide"]'));
    const innersReset = slidesReset
      .map(s => s.querySelector('[data-slideshow="parallax"]'))
      .filter(Boolean);

    gsap.set(slidesReset, { clearProps: "transform" });
    gsap.set(innersReset, { clearProps: "transform" });

    const slides = Array.from(el.querySelectorAll('[data-slideshow="slide"]'));
    const inner = slides.map(slide => slide.querySelector('[data-slideshow="parallax"]'));

    if (!slides.length) return;

    let current = 0;
    let animating = false;
    let observer = { disable() {}, enable() {}, kill() {} };

    const CLICK_DURATION = 0.9;
    const HOLD_DURATION = 0.35;

    const arrowFwd = el.querySelector('[data-slideshow="arrow_fwd"]');
    const arrowBack = el.querySelector('[data-slideshow="arrow_back"]');

    // ✅ index slides
    slides.forEach((slide, i) => (slide.dataset.index = i));

    // ✅ index thumbs (ook voor sliders buiten modal die dit niet hebben)
    const initialThumbs = Array.from(el.querySelectorAll('[data-slideshow="thumb"]'));
    initialThumbs.forEach((thumb, i) => {
      if (!thumb.dataset.index) thumb.dataset.index = i;
    });

    // ✅ respecteer bestaande current
    const existing = el.querySelector('[data-slideshow="slide"].is--current');
    if (existing) {
      const idx = Number(existing.dataset.index);
      if (!Number.isNaN(idx)) current = idx;
    } else {
      slides[0].classList.add("is--current");
    }

    // helper: actuele thumbs ophalen (na rebuilds)
    const getThumbs = () => Array.from(el.querySelectorAll('[data-slideshow="thumb"]'));

    // helper: zorg dat alle thumbs een index hebben
    function ensureThumbIndexes() {
      const thumbs = getThumbs();
      thumbs.forEach((thumb, i) => {
        if (!thumb.dataset.index) thumb.dataset.index = i;
      });
      return thumbs;
    }

    // helper: active thumb sync
    function syncThumbs(prev, next) {
      const thumbs = ensureThumbIndexes();
      if (!thumbs.length) return;

      thumbs.forEach(t => t.classList.remove("is--current"));

      const active =
        thumbs.find(t => Number(t.dataset.index) === next) ||
        thumbs[next];

      if (active) active.classList.add("is--current");
    }

    // initial sync
    syncThumbs(null, current);
    el.dispatchEvent(new CustomEvent("slideshow:change", { detail: { current } }));

    function navigate(direction, targetIndex = null, duration = CLICK_DURATION) {
      if (animating) return;
      animating = true;
      observer.disable();

      const previous = current;

      if (targetIndex !== null && targetIndex !== undefined) {
        current = targetIndex;
      } else {
        current =
          direction === 1 ?
          (current < slides.length - 1 ? current + 1 : 0) :
          (current > 0 ? current - 1 : slides.length - 1);
      }

      const currentSlide = slides[previous];
      const currentInner = inner[previous];
      const upcomingSlide = slides[current];
      const upcomingInner = inner[current];

      gsap.timeline({
          defaults: { duration, ease: "slideshow-wipe" },

          onStart: () => {
            upcomingSlide.classList.add("is--current");
            syncThumbs(previous, current);
            el.dispatchEvent(new CustomEvent("slideshow:change", { detail: { current } }));
          },

          onComplete: () => {
            currentSlide.classList.remove("is--current");
            animating = false;
            setTimeout(() => observer.enable(), duration * 1000);
          }
        })
        .to(currentSlide, { xPercent: -direction * 100 }, 0)
        .to(currentInner, { xPercent: direction * 50 }, 0)
        .fromTo(upcomingSlide, { xPercent: direction * 100 }, { xPercent: 0 }, 0)
        .fromTo(upcomingInner, { xPercent: -direction * 50 }, { xPercent: 0 }, 0);
    }

    // ✅ thumbs click (delegated) - werkt ook zonder data-index + outside modal
    function onWrapClick(e) {
      const thumb = e.target.closest('[data-slideshow="thumb"]');
      if (!thumb || animating) return;

      // pak index uit data-index, of fallback naar DOM-volgorde
      let targetIndex = Number(thumb.dataset.index);
      if (Number.isNaN(targetIndex)) {
        const thumbs = ensureThumbIndexes();
        targetIndex = thumbs.indexOf(thumb);
      }

      if (targetIndex < 0 || targetIndex === current) return;

      navigate(targetIndex > current ? 1 : -1, targetIndex);
    }

    el.addEventListener("click", onWrapClick);

    // arrow logic (click + hold)
    let holdTimer = null;
    let holdInterval = null;

    function stopHold() {
      clearTimeout(holdTimer);
      clearInterval(holdInterval);
      holdTimer = null;
      holdInterval = null;
    }

    function startHold(direction) {
      stopHold();
      holdTimer = setTimeout(() => {
        if (!animating) navigate(direction, null, HOLD_DURATION);
        holdInterval = setInterval(() => {
          if (!animating) navigate(direction, null, HOLD_DURATION);
        }, 120);
      }, 180);
    }

    function onArrowFwdClick(e) {
      e.preventDefault();
      navigate(1);
    }

    function onArrowBackClick(e) {
      e.preventDefault();
      navigate(-1);
    }

    function onArrowFwdDown(e) {
      e.preventDefault();
      startHold(1);
    }

    function onArrowBackDown(e) {
      e.preventDefault();
      startHold(-1);
    }

    arrowFwd?.addEventListener("click", onArrowFwdClick);
    arrowBack?.addEventListener("click", onArrowBackClick);

    arrowFwd?.addEventListener("pointerdown", onArrowFwdDown);
    arrowBack?.addEventListener("pointerdown", onArrowBackDown);

    ["pointerup", "pointerleave", "pointercancel"].forEach(evt => {
      arrowFwd?.addEventListener(evt, stopHold);
      arrowBack?.addEventListener(evt, stopHold);
    });

    const api = {
      destroy() {
        stopHold();
        observer.kill();

        el.removeEventListener("click", onWrapClick);

        arrowFwd?.removeEventListener("click", onArrowFwdClick);
        arrowBack?.removeEventListener("click", onArrowBackClick);

        arrowFwd?.removeEventListener("pointerdown", onArrowFwdDown);
        arrowBack?.removeEventListener("pointerdown", onArrowBackDown);

        ["pointerup", "pointerleave", "pointercancel"].forEach(evt => {
          arrowFwd?.removeEventListener(evt, stopHold);
          arrowBack?.removeEventListener(evt, stopHold);
        });
      }
    };

    // ✅ expose destroy zodat volgende init eerst kan opruimen
    el._slideshowDestroy = api.destroy;

    return api;
  }
 */

 function initSlideShow(el) {
   // ==========================================================
   // Prevent dubbele init
   // ==========================================================
   if (!el) return;
   if (el._slideshowDestroy) {
     el._slideshowDestroy();
     el._slideshowDestroy = null;
   }

   // ==========================================================
   // Reset transforms/state
   // ==========================================================
   const slidesReset = Array.from(el.querySelectorAll('[data-slideshow="slide"]'));
   const innersReset = slidesReset
     .map(s => s.querySelector('[data-slideshow="parallax"]'))
     .filter(Boolean);

   gsap.set(slidesReset, { clearProps: "transform" });
   gsap.set(innersReset, { clearProps: "transform" });

   // ==========================================================
   // Elements
   // ==========================================================
   const slides = Array.from(el.querySelectorAll('[data-slideshow="slide"]'));
   const inner = slides.map(slide => slide.querySelector('[data-slideshow="parallax"]'));

   if (!slides.length) return;

   let current = 0;
   let animating = false;

   // Observer plugin gebruik je nu niet echt. Laat het placeholder blijven.
   let observer = { disable() {}, enable() {}, kill() {} };

   const CLICK_DURATION = 0.9;
   const HOLD_DURATION = 0.35;

   const arrowFwd = el.querySelector('[data-slideshow="arrow_fwd"]');
   const arrowBack = el.querySelector('[data-slideshow="arrow_back"]');

   // ==========================================================
   // Indexing
   // ==========================================================
   slides.forEach((slide, i) => (slide.dataset.index = String(i)));

   const initialThumbs = Array.from(el.querySelectorAll('[data-slideshow="thumb"]'));
   initialThumbs.forEach((thumb, i) => {
     if (!thumb.dataset.index) thumb.dataset.index = String(i);
   });

   const existing = el.querySelector('[data-slideshow="slide"].is--current');
   if (existing) {
     const idx = Number(existing.dataset.index);
     if (Number.isFinite(idx)) current = idx;
   } else {
     slides[0].classList.add("is--current");
   }

   // ==========================================================
   // Thumb helpers
   // ==========================================================
   const getThumbs = () => Array.from(el.querySelectorAll('[data-slideshow="thumb"]'));

   function ensureThumbIndexes() {
     const thumbs = getThumbs();
     thumbs.forEach((thumb, i) => {
       if (!thumb.dataset.index) thumb.dataset.index = String(i);
     });
     return thumbs;
   }

   function syncThumbs(next) {
     const thumbs = ensureThumbIndexes();
     if (!thumbs.length) return;

     thumbs.forEach(t => t.classList.remove("is--current"));

     const active =
       thumbs.find(t => Number(t.dataset.index) === next) ||
       thumbs[next];

     if (active) active.classList.add("is--current");
   }

   // initial sync
   syncThumbs(current);
   el.dispatchEvent(new CustomEvent("slideshow:change", { detail: { current } }));

   // ==========================================================
   // Navigation
   // ==========================================================
   function navigate(direction, targetIndex = null, duration = CLICK_DURATION) {
     if (animating) return;
     animating = true;
     observer.disable();

     const previous = current;

     if (targetIndex !== null && targetIndex !== undefined) {
       current = targetIndex;
     } else {
       current =
         direction === 1 ?
         (current < slides.length - 1 ? current + 1 : 0) :
         (current > 0 ? current - 1 : slides.length - 1);
     }

     const currentSlide = slides[previous];
     const currentInner = inner[previous];
     const upcomingSlide = slides[current];
     const upcomingInner = inner[current];

     gsap.timeline({
         defaults: { duration, ease: "slideshow-wipe" },
         onStart: () => {
           upcomingSlide.classList.add("is--current");
           syncThumbs(current);
           el.dispatchEvent(new CustomEvent("slideshow:change", { detail: { current } }));
         },
         onComplete: () => {
           currentSlide.classList.remove("is--current");
           animating = false;
           setTimeout(() => observer.enable(), Math.max(0, duration) * 1000);
         }
       })
       .to(currentSlide, { xPercent: -direction * 100 }, 0)
       .to(currentInner, { xPercent: direction * 50 }, 0)
       .fromTo(upcomingSlide, { xPercent: direction * 100 }, { xPercent: 0 }, 0)
       .fromTo(upcomingInner, { xPercent: -direction * 50 }, { xPercent: 0 }, 0);
   }

   // ==========================================================
   // Thumb click (delegated)
   // ==========================================================
   function onWrapClick(e) {
     const thumb = e.target.closest('[data-slideshow="thumb"]');
     if (!thumb || animating) return;

     let targetIndex = Number(thumb.dataset.index);
     if (!Number.isFinite(targetIndex)) {
       const thumbs = ensureThumbIndexes();
       targetIndex = thumbs.indexOf(thumb);
     }

     if (!Number.isFinite(targetIndex)) return;
     if (targetIndex < 0 || targetIndex >= slides.length) return;
     if (targetIndex === current) return;

     navigate(targetIndex > current ? 1 : -1, targetIndex);
   }

   el.addEventListener("click", onWrapClick);

   // ==========================================================
   // Arrow logic (click + hold) - met removeEventListener support
   // ==========================================================
   let holdTimer = null;
   let holdInterval = null;

   function stopHold() {
     clearTimeout(holdTimer);
     clearInterval(holdInterval);
     holdTimer = null;
     holdInterval = null;
   }

   function startHold(direction) {
     stopHold();
     holdTimer = setTimeout(() => {
       if (!animating) navigate(direction, null, HOLD_DURATION);
       holdInterval = setInterval(() => {
         if (!animating) navigate(direction, null, HOLD_DURATION);
       }, 120);
     }, 180);
   }

   function onArrowFwdClick(e) {
     e.preventDefault();
     navigate(1);
   }

   function onArrowBackClick(e) {
     e.preventDefault();
     navigate(-1);
   }

   function onArrowFwdDown(e) {
     e.preventDefault();
     startHold(1);
   }

   function onArrowBackDown(e) {
     e.preventDefault();
     startHold(-1);
   }

   function onArrowStop(e) {
     e.preventDefault?.();
     stopHold();
   }

   if (arrowFwd) {
     arrowFwd.addEventListener("click", onArrowFwdClick);
     arrowFwd.addEventListener("pointerdown", onArrowFwdDown);
     ["pointerup", "pointerleave", "pointercancel"].forEach(evt => {
       arrowFwd.addEventListener(evt, onArrowStop);
     });
   }

   if (arrowBack) {
     arrowBack.addEventListener("click", onArrowBackClick);
     arrowBack.addEventListener("pointerdown", onArrowBackDown);
     ["pointerup", "pointerleave", "pointercancel"].forEach(evt => {
       arrowBack.addEventListener(evt, onArrowStop);
     });
   }

   // ==========================================================
   // External jump (overview → slider)
   // ==========================================================
   function onJump(e) {
     const target = Number(e?.detail?.index);
     if (!Number.isFinite(target)) return;
     if (target < 0 || target >= slides.length) return;
     if (target === current) return;

     // ultra-fast jump, maar niet 0 om GSAP gekkigheid te voorkomen
     navigate(target > current ? 1 : -1, target, 0.01);
   }

   el.addEventListener("slideshow:jump", onJump);

   // ==========================================================
   // Destroy
   // ==========================================================
   el._slideshowDestroy = function () {
     stopHold();
     observer.kill();

     el.removeEventListener("click", onWrapClick);
     el.removeEventListener("slideshow:jump", onJump);

     if (arrowFwd) {
       arrowFwd.removeEventListener("click", onArrowFwdClick);
       arrowFwd.removeEventListener("pointerdown", onArrowFwdDown);
       ["pointerup", "pointerleave", "pointercancel"].forEach(evt => {
         arrowFwd.removeEventListener(evt, onArrowStop);
       });
     }

     if (arrowBack) {
       arrowBack.removeEventListener("click", onArrowBackClick);
       arrowBack.removeEventListener("pointerdown", onArrowBackDown);
       ["pointerup", "pointerleave", "pointercancel"].forEach(evt => {
         arrowBack.removeEventListener(evt, onArrowStop);
       });
     }
   };
 }

 function initParallaxImageGalleryThumbnails() {
   document.querySelectorAll('[data-slideshow="wrap"]').forEach(wrap => {
     // Skip sliders die in een modal zitten (die init je on open)
     const isInModal = !!wrap.closest('[data-modal-name]');
     if (isInModal) return;

     initSlideShow(wrap);
   });
 }

 function initLightboxAutoThumbs() {
   const wrap = document.querySelector('.modal__content [data-slideshow="wrap"].img-slider._2');
   if (!wrap) return;

   let nav = wrap.querySelector('.img-slider__nav');
   if (!nav) {
     nav = document.createElement('div');
     nav.className = 'img-slider__nav';
     wrap.appendChild(nav);
   }

   // Pak ALLE slide images uit de lightbox, dit is betrouwbaarder dan alleen slide divs
   const slideImgs = Array.from(
     wrap.querySelectorAll(
       '[data-slideshow="slide"] [data-slideshow="parallax"], [data-slideshow="slide"] img')
   ).filter(Boolean);

   if (!slideImgs.length) return;

   // Template thumb van een ANDERE slider (niet uit de lightbox)
   const templateThumb =
     document.querySelector(
       '[data-slideshow="wrap"]:not(.img-slider._2) .img-slider__thumb[data-slideshow="thumb"]') ||
     document.querySelector('.img-slider__thumb[data-slideshow="thumb"]');

   // FORCE rebuild: altijd leegmaken
   nav.innerHTML = '';

   const frag = document.createDocumentFragment();

   slideImgs.forEach((imgEl, index) => {
     let thumb;
     if (templateThumb) {
       thumb = templateThumb.cloneNode(true);
     } else {
       thumb = document.createElement('div');
       thumb.className = 'img-slider__thumb hide_mobile';
       const i = document.createElement('img');
       i.className = 'slider-thumb__img';
       i.loading = 'lazy';
       thumb.appendChild(i);
     }

     thumb.setAttribute('data-slideshow', 'thumb');
     thumb.setAttribute('data-index', String(index));
     thumb.classList.remove('is--current');
     thumb.style.pointerEvents = 'auto';

     const thumbImg = thumb.querySelector('img');
     if (thumbImg) {
       // Eerst clean
       thumbImg.removeAttribute('srcset');
       thumbImg.removeAttribute('sizes');

       // Dan exact overnemen van de slide image
       const src = imgEl.getAttribute('src') || imgEl.currentSrc;
       const srcset = imgEl.getAttribute('srcset');
       const sizes = imgEl.getAttribute('sizes');

       if (src) thumbImg.src = src;
       if (srcset) thumbImg.setAttribute('srcset', srcset);
       if (sizes) thumbImg.setAttribute('sizes', sizes);

       thumbImg.loading = 'lazy';
       thumbImg.classList.add('slider-thumb__img');
     }

     frag.appendChild(thumb);
   });

   nav.appendChild(frag);

   const thumbCount = nav.querySelectorAll('[data-slideshow="thumb"]').length;

   // Zet scroll mode aan als >3
   if (thumbCount > 3) {
     nav.classList.add('is--scrolling-thumbs');
     nav.style.setProperty('--thumb-w', '7rem');
     nav.style.setProperty('--thumb-gap', '0.5rem');
   } else {
     nav.classList.remove('is--scrolling-thumbs');
   }

   // Reset sync flag zodat bind opnieuw kan na rebuild
   delete nav.dataset.thumbSyncBound;
   bindThumbStripSync(wrap, nav);
 }

 function bindThumbStripSync(wrap, nav) {
   if (nav.dataset.thumbSyncBound === "true") return;
   nav.dataset.thumbSyncBound = "true";

   function getStep() {
     const first = nav.querySelector('[data-slideshow="thumb"]');
     if (!first) return 0;

     const thumbRect = first.getBoundingClientRect();

     const styles = window.getComputedStyle(nav);
     const gap =
       parseFloat(styles.columnGap) ||
       parseFloat(styles.gap) ||
       parseFloat(styles.rowGap) ||
       0;

     return thumbRect.width + gap;
   }

   function clamp(n, min, max) {
     return Math.max(min, Math.min(max, n));
   }

   function syncToCurrent() {
     if (!nav.classList.contains("is--scrolling-thumbs")) return;

     const active = nav.querySelector('[data-slideshow="thumb"].is--current');
     if (!active) return;

     const idx = parseInt(active.getAttribute("data-index"), 10);
     if (Number.isNaN(idx)) return;

     const step = getStep();
     if (!step) return;

     // “3 zichtbaar” window: actieve thumb in het midden (slot 2) zodra mogelijk
     // idx 0 -> left 0
     // idx 1 -> left 0 (nog steeds 0-2)
     // idx 2 -> left 1*step (1-3)
     // idx 3 -> left 2*step (2-4)
     const desiredLeft = (idx - 1) * step;

     // clamp zodat je niet voorbij het einde scrollt
     const maxLeft = nav.scrollWidth - nav.clientWidth;
     const targetLeft = clamp(desiredLeft, 0, Math.max(0, maxLeft));

     nav.scrollTo({ left: targetLeft, behavior: "smooth" });
   }

   wrap.addEventListener("slideshow:change", syncToCurrent);

   // eerste keer (na modal open / rebuild)
   setTimeout(syncToCurrent, 60);

   // responsive: widths kunnen veranderen
   window.addEventListener("resize", () => {
     setTimeout(syncToCurrent, 80);
   });
 }

 function initLightboxOverview(modalScope) {
   const scope = modalScope || document;

   const wrap = scope.querySelector('[data-slideshow="wrap"].img-slider._2');
   const overview = scope.querySelector('[data-gallery="overview"].img-gallery__overview');

   // Als wrap ontbreekt: klaar
   if (!wrap) return;

   const isTabletOrLower = window.matchMedia("(max-width: 991px)").matches;

   // ==========================================================
   // Tablet + mobiel: geen overview - altijd slideshow tonen
   // ==========================================================
   if (isTabletOrLower) {
     // Zorg dat slider zichtbaar/actief is
     wrap.classList.add("is--active");

     // Als er toevallig toch een overview element in de modal zit: verstop het
     if (overview) overview.classList.add("is--hidden");

     // Belangrijk: op mobile geen click-to-back bindings
     // Eventuele oude handlers opruimen als modal heropent
     if (overview && overview._overviewClick) {
       overview.removeEventListener("click", overview._overviewClick);
       overview._overviewClick = null;
     }
     if (wrap._overviewBackClick) {
       wrap.removeEventListener("click", wrap._overviewBackClick);
       wrap._overviewBackClick = null;
     }

     return;
   }

   // ==========================================================
   // Desktop: overview build + toggles
   // ==========================================================
   if (!overview) return;

   const slideImgs = Array.from(
     wrap.querySelectorAll('[data-slideshow="slide"] img')
   ).filter(Boolean);

   if (!slideImgs.length) return;

   // Build overview
   overview.innerHTML = "";
   const frag = document.createDocumentFragment();

   slideImgs.forEach((imgEl, index) => {
     const item = document.createElement("div");
     item.className = "gallery-overview__item";
     item.setAttribute("data-index", String(index));

     const img = document.createElement("img");
     img.loading = "lazy";

     const src = imgEl.getAttribute("src") || imgEl.currentSrc;
     const srcset = imgEl.getAttribute("srcset");
     const sizes = imgEl.getAttribute("sizes");

     if (src) img.src = src;
     if (srcset) img.setAttribute("srcset", srcset);
     if (sizes) img.setAttribute("sizes", sizes);

     item.appendChild(img);
     frag.appendChild(item);
   });

   overview.appendChild(frag);

   // Start state (desktop): overview aan, slider uit
   overview.classList.remove("is--hidden");
   wrap.classList.remove("is--active");

   function onOverviewClick(e) {
     const item = e.target.closest('.gallery-overview__item[data-index]');
     if (!item) return;

     const idx = Number(item.getAttribute("data-index"));
     if (Number.isNaN(idx)) return;

     overview.classList.add("is--hidden");
     wrap.classList.add("is--active");

     wrap.dispatchEvent(new CustomEvent("slideshow:jump", { detail: { index: idx } }));
   }

   // prevent double bind on reopen
   if (overview._overviewClick) {
     overview.removeEventListener("click", overview._overviewClick);
   }
   overview._overviewClick = onOverviewClick;
   overview.addEventListener("click", onOverviewClick);

   // Desktop: klik op slide = terug naar overview
   function onSlideClick(e) {
     const slide = e.target.closest('[data-slideshow="slide"]');
     if (!slide) return;

     wrap.classList.remove("is--active");
     overview.classList.remove("is--hidden");
   }

   if (wrap._overviewBackClick) {
     wrap.removeEventListener("click", wrap._overviewBackClick);
   }
   wrap._overviewBackClick = onSlideClick;
   wrap.addEventListener("click", onSlideClick);
 }

 // ==========================================================
 // Modal
 // ==========================================================

 function initModalBasic() {
   const modalGroup = document.querySelector('[data-modal-group-status]');
   const modals = document.querySelectorAll('[data-modal-name]');
   const modalTargets = document.querySelectorAll('[data-modal-target]');

   function closeAllModals() {
     modalTargets.forEach(target => target.setAttribute('data-modal-status', 'not-active'));
     modals.forEach(modal => modal.setAttribute('data-modal-status', 'not-active'));
     unlockScroll();
     if (modalGroup) modalGroup.setAttribute('data-modal-group-status', 'not-active');
   }

   function openModal(modalName) {
     // reset states
     modalTargets.forEach(target => target.setAttribute('data-modal-status', 'not-active'));
     modals.forEach(modal => modal.setAttribute('data-modal-status', 'not-active'));
     lockScroll();

     // activate clicked target + modal
     document.querySelector(`[data-modal-target="${modalName}"]`)
       ?.setAttribute('data-modal-status', 'active');

     const modalEl = document.querySelector(`[data-modal-name="${modalName}"]`);
     modalEl?.setAttribute('data-modal-status', 'active');

     if (modalGroup) modalGroup.setAttribute('data-modal-group-status', 'active');

     // Only lightbox: init slider stuff if slider exists inside that modal
     if (modalName === "lightbox" && modalEl) {
       setTimeout(() => {
         initLightboxSliderInsideModal(modalEl);
       }, 0);
     }
   }

   // Open modal
   modalTargets.forEach(btn => {
     btn.addEventListener('click', function () {
       const name = this.getAttribute('data-modal-target');
       if (!name) return;
       openModal(name);
     });
   });

   // Close modal buttons
   document.querySelectorAll('[data-modal-close]').forEach(btn => {
     btn.addEventListener('click', closeAllModals);
   });

   // Escape close
   document.addEventListener('keydown', e => {
     if (e.key === 'Escape') closeAllModals();
   });
 }

 // Scope naar de slider in de modal
 const wrap = document.querySelector('.modal__content [data-slideshow="wrap"].img-slider._2');
 if (!wrap) {
   console.warn("Slide counter: wrap not found");
 } else {
   const slides = wrap.querySelectorAll('[data-slideshow="slide"]');
   const currentEl = wrap.querySelector('[data-counter="current"]');
   const totalEl = wrap.querySelector('[data-counter="total"]');

   if (!slides.length || !currentEl || !totalEl) {
     console.warn("Slide counter: missing slides or counter elements.");
   } else {
     // Total is echt het aantal slides in deze wrap
     totalEl.textContent = slides.length;

     const updateCounter = () => {
       const currentSlide = wrap.querySelector('[data-slideshow="slide"].is--current');
       if (!currentSlide) return;

       // Gebruik dataset.index, maar val terug op DOM-index als index ontbreekt/raar is
       const idx = Number(currentSlide.dataset.index);
       currentEl.textContent = Number.isFinite(idx) ?
         String(idx + 1) :
         String(Array.from(slides).indexOf(currentSlide) + 1);
     };

     updateCounter();

     // Observer op class changes binnen deze wrap
     const observer = new MutationObserver(updateCounter);
     slides.forEach(slide => observer.observe(slide, {
       attributes: true,
       attributeFilter: [
         "class"
       ]
     }));
   }
 }

 function initLightboxSliderInsideModal(modalEl) {
   if (!modalEl) return;

   const modalContent = modalEl.querySelector('.modal__content') || modalEl;
   const wrap = modalContent.querySelector('[data-slideshow="wrap"].img-slider._2');

   // Lightbox modal kan soms andere content hebben: dan stop je hier netjes
   if (!wrap) return;

   // 1) thumbs rebuild (jouw bestaande functie gebruikt .modal__content selector,
   // dus dit werkt zolang je lightbox modal maar 1 .modal__content heeft)
   initLightboxAutoThumbs();

   // 2) slideshow init (jouw initSlideShow is idempotent door _slideshowDestroy)
   initSlideShow(wrap);

   // 3) overview init (als overview element bestaat)
   initLightboxOverview(modalContent);
 }

 // ==========================================================
 // Text Animations (with SplitText + GSAP + ScrollTrigger)
 // ==========================================================
 function initMaskTextScrollReveal() {
   const headings = document.querySelectorAll('[data-split="heading"]');
   if (!headings.length) return;

   headings.forEach(heading => {
     // Zorg dat GSAP controle heeft over visibility
     gsap.set(heading, { autoAlpha: 1 });

     // Bepaal type split (default = lines)
     const type = heading.dataset.splitReveal || 'lines';
     const typesToSplit =
       type === 'lines' ? ['lines'] :
       type === 'words' ? ['lines', 'words'] : ['lines', 'words', 'chars'];

     // Split de tekst
     SplitText.create(heading, {
       type: typesToSplit.join(', '),
       mask: 'lines',
       autoSplit: true,
       linesClass: 'line',
       wordsClass: 'word',
       charsClass: 'letter',
       onSplit(instance) {
         const targets = instance[type];
         const config = splitConfig[type] || { duration: 1.6, stagger: 0.2 };

         gsap.from(targets, {
           yPercent: 110,
           duration: config.duration,
           stagger: config.stagger,
           ease: 'expo.out',
           scrollTrigger: {
             trigger: heading,
             start: 'clamp(top 80%)',
             once: true
           }
         });
       }
     });
   });

   // Herbereken ScrollTrigger posities
   ScrollTrigger.refresh();
 }
 // ==========================================================
 // Mask on scroll
 // ==========================================================

 function initHighlightText() {

   let splitHeadingTargets = document.querySelectorAll("[data-highlight-text]")
   splitHeadingTargets.forEach((heading) => {

     const scrollStart = heading.getAttribute("data-highlight-scroll-start") || "top 90%"
     const scrollEnd = heading.getAttribute("data-highlight-scroll-end") || "center 40%"
     const fadedValue = heading.getAttribute("data-highlight-fade") || 0.2 // Opacity of letter
     const staggerValue = heading.getAttribute("data-highlight-stagger") ||
       0.1 // Smoother reveal

     new SplitText(heading, {
       type: "words, chars",
       autoSplit: true,
       onSplit(self) {
         let ctx = gsap.context(() => {
           let tl = gsap.timeline({
             scrollTrigger: {
               scrub: true,
               trigger: heading,
               start: scrollStart,
               end: scrollEnd,
             }
           })
           tl.from(self.chars, {
             autoAlpha: fadedValue,
             stagger: staggerValue,
             ease: "linear"
           })
         });
         return ctx; // return our animations so GSAP can clean them up when onSplit fires
       }
     });
   });
 }

 gsap.utils.toArray('[rotated]').forEach((el) => {
   gsap.fromTo(
     el, { rotate: -360, opacity: 1 },
     {
       rotate: 0,
       opacity: 1,
       ease: "expo.inOut",
       scrollTrigger: {
         trigger: el,
         start: "top 90%",
         end: "bottom top",
         scrub: true,
       }
     }
   );
 });

 gsap.fromTo(
   ".wide_image_wrap", { height: 0, overflow: "hidden" },
   {
     height: "40vh",
     ease: "power2.out",
     scrollTrigger: {
       trigger: ".wide_image_wrap",
       start: "bottom bottom",
       end: "bottom top",
       scrub: true,
     },
   }
 );

 const fullSizeBg = document.querySelector(".full_size_background");

 if (fullSizeBg) {
   gsap.to(".full_size_background", {
     width: "100%",
     height: "100%",
     scrollTrigger: {
       trigger: ".full_size_background",
       start: "center bottom",
       end: "bottom top",
       scrub: true
     }
   });
 }

 // ==========================================================
 // FAQ
 // ==========================================================
 function initAccordionCSS() {
   document.querySelectorAll('[data-accordion-css-init]').forEach((accordion) => {
     const closeSiblings = accordion.getAttribute('data-accordion-close-siblings') === 'true';

     accordion.addEventListener('click', (event) => {
       const toggle = event.target.closest('[data-accordion-toggle]');
       if (!toggle) return; // Exit if the clicked element is not a toggle

       const singleAccordion = toggle.closest('[data-accordion-status]');
       if (!singleAccordion) return; // Exit if no accordion container is found

       const isActive = singleAccordion.getAttribute('data-accordion-status') === 'active';
       singleAccordion.setAttribute('data-accordion-status', isActive ? 'not-active' :
         'active');

       // When [data-accordion-close-siblings="true"]
       if (closeSiblings && !isActive) {
         accordion.querySelectorAll('[data-accordion-status="active"]').forEach((
           sibling) => {
           if (sibling !== singleAccordion) sibling.setAttribute(
             'data-accordion-status', 'not-active');
         });
       }
     });
   });
 }

 // ==========================================================
 // Button
 // ==========================================================
 document.querySelectorAll('[data-btn-hover]').forEach(btn => {
   btn.style.position = 'relative';

   btn.addEventListener('mouseenter', () => {
     // Elastic bounce on hover
     gsap.to(btn, {
       scale: 1.05,
       duration: 0.8,
       ease: 'elastic.out(1.2, 0.4)'
     });
   });

   btn.addEventListener('mouseleave', () => {
     // Elastic bounce back
     gsap.to(btn, {
       scale: 1,
       duration: 0.7,
       ease: 'elastic.out(1, 0.5)'
     });
   });

   // Squish click animation with elastic rebound
   btn.addEventListener('mousedown', () => {
     gsap.to(btn, {
       scale: 0.92,
       duration: 0.2,
       ease: 'power3.out'
     });
   });

   btn.addEventListener('mouseup', () => {
     gsap.to(btn, {
       scale: 1.05,
       duration: 0.6,
       ease: 'elastic.out(1.5, 0.3)'
     });
   });
 });
 // ==========================================================
 // Nav dropwdown
 // ==========================================================
 function setupDropdownsWithStagger() {
   document.querySelectorAll('.dropdown_nav_link_wrap').forEach((wrap) => {
     const content = wrap.querySelector('.dropdown_content_wrap');
     if (!content) return;

     const links = content.querySelectorAll('.nav_link');
     const arrow = wrap.querySelector('.dd_arrow');

     let isOpen = false;

     // Base state (hidden, masked)
     gsap.set(content, {
       display: "none",
       clipPath: "inset(0 0 100% 0)" // fully clipped from top
     });

     // Shared timeline for open & close
     const tl = gsap.timeline({ paused: true })
       .set(content, { display: "flex" }) // only once on play
       .to(arrow, { rotate: 0, duration: 0.2, ease: "power2.out" }, 0)
       .to(content, {
         clipPath: "inset(0 0 0% 0)", // reveal down
         duration: 0.6,
         ease: "expo.inOut"
       }, 0)
       .from(links, {
         opacity: 0,
         y: 8,
         stagger: 0.06,
         duration: 0.25,
         ease: "power2.out"
       }, "-=0.22");

     // Reverse state (autoplay back)
     tl.eventCallback("onReverseComplete", () => {
       gsap.set(content, { display: "none" });
       gsap.set(arrow, { rotate: 180 });
     });

     function showDropdown() {
       if (isOpen) return;
       isOpen = true;
       tl.play();
     }

     function hideDropdown() {
       if (!isOpen) return;
       isOpen = false;
       tl.reverse();
     }

     wrap.addEventListener('mouseenter', showDropdown);
     wrap.addEventListener('mouseleave', hideDropdown);
   });
 }

 // ==========================================================
 // Contact form
 // ==========================================================

 function initBasicFormValidation() {
   const forms = document.querySelectorAll('[data-form-validate]');

   forms.forEach((form) => {
     const fields = form.querySelectorAll('[data-validate] input, [data-validate] textarea');
     const submitButtonDiv = form.querySelector(
       '[data-submit]'); // The div wrapping the submit button
     const submitInput = submitButtonDiv.querySelector(
       'input[type="submit"]'); // The actual submit button

     // Capture the form load time
     const formLoadTime = new Date().getTime(); // Timestamp when the form was loaded

     // Function to validate individual fields (input or textarea)
     const validateField = (field) => {
       const parent = field.closest('[data-validate]'); // Get the parent div
       const minLength = field.getAttribute('min');
       const maxLength = field.getAttribute('max');
       const type = field.getAttribute('type');
       let isValid = true;

       // Check if the field has content
       if (field.value.trim() !== '') {
         parent.classList.add('is--filled');
       } else {
         parent.classList.remove('is--filled');
       }

       // Validation logic for min and max length
       if (minLength && field.value.length < minLength) {
         isValid = false;
       }

       if (maxLength && field.value.length > maxLength) {
         isValid = false;
       }

       // Validation logic for email input type
       if (type === 'email' && !/\S+@\S+\.\S+/.test(field.value)) {
         isValid = false;
       }

       // Add or remove success/error classes on the parent div
       if (isValid) {
         parent.classList.remove('is--error');
         parent.classList.add('is--success');
       } else {
         parent.classList.remove('is--success');
         parent.classList.add('is--error');
       }

       return isValid;
     };

     // Function to start live validation for a field
     const startLiveValidation = (field) => {
       field.addEventListener('input', function () {
         validateField(field);
       });
     };

     // Function to validate and start live validation for all fields, focusing on the first field with an error
     const validateAndStartLiveValidationForAll = () => {
       let allValid = true;
       let firstInvalidField = null;

       fields.forEach((field) => {
         const valid = validateField(field);
         if (!valid && !firstInvalidField) {
           firstInvalidField = field; // Track the first invalid field
         }
         if (!valid) {
           allValid = false;
         }
         startLiveValidation(field); // Start live validation for all fields
       });

       // If there is an invalid field, focus on the first one
       if (firstInvalidField) {
         firstInvalidField.focus();
       }

       return allValid;
     };

     // Anti-spam: Check if form was filled too quickly
     const isSpam = () => {
       const currentTime = new Date().getTime();
       const timeDifference = (currentTime - formLoadTime) /
         1000; // Convert milliseconds to seconds
       return timeDifference < 5; // Return true if form is filled within 5 seconds
     };

     // Handle clicking the custom submit button
     submitButtonDiv.addEventListener('click', function () {
       // Validate the form first
       if (validateAndStartLiveValidationForAll()) {
         // Only check for spam after all fields are valid
         if (isSpam()) {
           alert('Form submitted too quickly. Please try again.');
           return; // Stop form submission
         }
         submitInput.click(); // Simulate a click on the <input type="submit">
       }
     });

     // Handle pressing the "Enter" key
     form.addEventListener('keydown', function (event) {
       if (event.key === 'Enter' && event.target.tagName !== 'TEXTAREA') {
         event.preventDefault(); // Prevent the default form submission

         // Validate the form first
         if (validateAndStartLiveValidationForAll()) {
           // Only check for spam after all fields are valid
           if (isSpam()) {
             alert('Form submitted too quickly. Please try again.');
             return; // Stop form submission
           }
           submitInput.click(); // Trigger our custom form submission
         }
       }
     });
   });
 }

 // ==========================================================
 // Pageload split text
 // ==========================================================
 function initPageLoadSplitText() {
   const targets = document.querySelectorAll('[pageload-split-text]');
   if (!targets.length) return;

   targets.forEach((el) => {
     const type = el.dataset.splitReveal || 'lines';
     const typesToSplit =
       type === 'lines' ? ['lines'] :
       type === 'words' ? ['lines', 'words'] : ['lines', 'words', 'chars'];

     SplitText.create(el, {
       type: typesToSplit.join(', '),
       mask: 'lines',
       autoSplit: true,
       linesClass: 'line',
       wordsClass: 'word',
       charsClass: 'letter',
       onSplit(instance) {
         const targets = instance[type];
         const config = splitConfig[type] || { duration: 1.4, stagger: 0.06 };

         // Make all visible now that SplitText is ready
         gsap.set([el, ...targets], { visibility: 'visible' });

         gsap.from(targets, {
           yPercent: 110,
           duration: config.duration,
           stagger: config.stagger,
           delay: 0.3,
           ease: 'expo.out',
         });
       }
     });
   });
 }

 // ==========================================================
 // DATA NAV LINK
 // ==========================================================

 const currentPath = window.location.pathname;
 const links = document.querySelectorAll('[data-underline-link]');

 links.forEach(link => {
   const href = link.getAttribute("href");

   if (href === currentPath || currentPath.startsWith(href + "/")) {
     link.setAttribute("data-underline-link", "alt");
   }
 });

 // ==========================================================
 // Wacht tot fonts geladen zijn (met fallback)
 // ==========================================================
 if (document.fonts && document.fonts.ready) {
   document.fonts.ready.then(() => {
     initMaskTextScrollReveal();
   });
 } else {
   initMaskTextScrollReveal();
 }

 locomotiveScroll.start();
 initPageLoadSplitText();
 initGlobalParallax();
 initMarqueeScrollDirection();
 initDraggables();
 initMobileMenuAnimation();
 setupDropdownsWithStagger();
 initParallaxImageGalleryThumbnails();
 initHighlightText();
 initAccordionCSS();
 initModalBasic();
 initBasicFormValidation();
