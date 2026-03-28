// ==========================================================
// VALIDGRAPHS — global.js
// ==========================================================

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, Draggable);
gsap.ticker.lagSmoothing(0);
gsap.ticker.add(ScrollTrigger.update);

// ==========================================================
// LOCOMOTIVE SCROLL
// ==========================================================

const locomotiveScroll = new LocomotiveScroll({
  autoStart: false,
  lenisOptions: {
    lerp: 0.1,
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  },
});

function lockScroll() {
  locomotiveScroll.stop();
  document.body.style.overflow = "hidden";
}

function unlockScroll() {
  locomotiveScroll.start();
  document.body.style.overflow = "";
}

// ==========================================================
// SPLIT TEXT CONFIG
// ==========================================================

const splitConfig = {
  lines: { duration: 0.8, stagger: 0.08 },
  words: { duration: 0.8, stagger: 0.06 },
  chars: { duration: 0.4, stagger: 0.01 },
};

// ==========================================================
// INIT CALLS
// ==========================================================

document.fonts.ready.then(() => {
  locomotiveScroll.init();
  ScrollTrigger.refresh();
});
