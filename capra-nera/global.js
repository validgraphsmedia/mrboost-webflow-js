// ==========================================================
// CAPRA NERA — GLOBAL JS
// Stack: GSAP, ScrollTrigger, SplitText, Lenis, Barba.js
// ==========================================================

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, Draggable);
gsap.ticker.lagSmoothing(0);

// ==========================================================
// LENIS SMOOTH SCROLL
// ==========================================================

const lenis = new Lenis({
  lerp: 0.1,
  duration: 1.2,
  easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
});

lenis.on("scroll", ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));

function lockScroll() {
  lenis.stop();
  document.body.style.overflow = "hidden";
}

function unlockScroll() {
  lenis.start();
  document.body.style.overflow = "";
}

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
// BARBA.JS PAGE TRANSITIONS
// ==========================================================

function initBarba() {
  barba.init({
    transitions: [
      {
        name: "default",

        leave(data) {
          return gsap.to(data.current.container, {
            opacity: 0,
            duration: 0.4,
            ease: "expo.inOut",
            onComplete: () => {
              ScrollTrigger.getAll().forEach((st) => st.kill());
            },
          });
        },

        enter(data) {
          gsap.set(data.next.container, { opacity: 0 });
        },

        afterEnter(data) {
          lenis.scrollTo(0, { immediate: true });

          // Update Webflow w--current nav state
          const newPath = window.location.pathname;
          document.querySelectorAll("[data-barba-nav-link]").forEach((link) => {
            link.classList.toggle("w--current", link.getAttribute("href") === newPath);
          });

          initAll();

          gsap.to(data.next.container, {
            opacity: 1,
            duration: 0.4,
            ease: "expo.out",
            onComplete: () => ScrollTrigger.refresh(),
          });
        },
      },
    ],
  });
}

// ==========================================================
// INIT ALL (called on load + after every Barba transition)
// ==========================================================

function initAll() {
  // voeg hier init-functies toe naarmate features worden gebouwd
}

// ==========================================================
// BOOT
// ==========================================================

document.fonts.ready.then(() => {
  initBarba();
  initAll();
  ScrollTrigger.refresh();
});
