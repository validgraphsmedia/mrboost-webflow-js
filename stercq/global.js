// ==========================================================
// STERCQ — global.js
// Stack: GSAP (+ ScrollTrigger, CustomEase), Lenis, Barba
// Doel: licht, snel, smooth — Lenis bijna native, korte Barba-transities
// ==========================================================

if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}

gsap.registerPlugin(ScrollTrigger, CustomEase);

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
    const linkPath = new URL(link.href, window.location.origin).pathname;
    const isCurrent = linkPath === path;
    link.classList.toggle("w--current", isCurrent);
    if (isCurrent) link.setAttribute("aria-current", "page");
    else link.removeAttribute("aria-current");
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
// PAGE LIFECYCLE
// initPage draait bij eerste load én na elke Barba-transitie.
// Alles wat hier start, moet in destroyPage weer opgeruimd worden.
// ==========================================================

function initPage(container) {
  initReveal(container);
  ScrollTrigger.refresh();
}

function destroyPage() {
  ScrollTrigger.getAll().forEach((st) => st.kill());
}

// ==========================================================
// BARBA TRANSITIONS
// Kort en snappy: oude pagina ~0.35s weg, nieuwe ~0.55s erin.
// Barba prefetcht al op hover, dus de nieuwe pagina staat meestal klaar.
// ==========================================================

function initBarba() {
  if (!window.barba) return;

  barba.hooks.before(() => {
    document.documentElement.classList.add("is-transitioning");
    lockScroll();
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
        name: "default",

        leave(data) {
          if (reducedMotion) return;
          return gsap.to(data.current.container, {
            autoAlpha: 0,
            y: "-1.5rem",
            duration: 0.35,
            ease: "power2.in",
          });
        },

        afterLeave() {
          destroyPage();
          resetScroll();
        },

        enter(data) {
          if (reducedMotion) return;
          return gsap.from(data.next.container, {
            autoAlpha: 0,
            y: "1.5rem",
            duration: 0.55,
            ease: "expo.out",
            clearProps: "all",
          });
        },

        afterEnter(data) {
          initPage(data.next.container);
        },
      },
    ],
  });
}

// ==========================================================
// INIT
// ==========================================================

function initSite() {
  initLenis();
  initBarba();
  updateCurrentNav();
  initPage(document.querySelector('[data-barba="container"]') || document);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSite);
} else {
  initSite();
}
