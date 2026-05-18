// ===========================================================
// MRBOOST — HOME PAGE (WEBFLOW NATIVE)
// Interactive features: WeDoALot, HamburgerNav, StartProjectFAB
// ===========================================================

// ==========================================================
// WE DO A LOT — cycling services list
// ==========================================================
function initWeDoALot() {
  const track = document.querySelector('[data-we-do-track]');
  if (!track) return;

  if (track._weDoDestroy) {
    track._weDoDestroy();
    track._weDoDestroy = null;
  }

  const items = [...track.querySelectorAll('.mb-we-do-item')];
  if (!items.length) return;

  let active = 0;

  function positionTrack() {
    const el = items[active];
    if (!el) return;
    const offset = el.offsetTop + el.offsetHeight / 2;
    track.style.transform = `translateY(${-offset}px)`;
  }

  function setActive(idx) {
    items.forEach((item, i) => {
      item.classList.remove('active', 'dim-1', 'dim-2');
      const dist = Math.abs(i - idx);
      if (i === idx) item.classList.add('active');
      else if (dist === 1) item.classList.add('dim-1');
      else if (dist === 2) item.classList.add('dim-2');
    });
    active = idx;
    positionTrack();
  }

  setActive(0);

  const id = setInterval(() => {
    setActive((active + 1) % items.length);
  }, 1400);

  const onResize = () => positionTrack();
  window.addEventListener('resize', onResize, { passive: true });

  track._weDoDestroy = () => {
    clearInterval(id);
    window.removeEventListener('resize', onResize);
  };
}

// ==========================================================
// HAMBURGER NAV — scroll reveal + toggle
// ==========================================================
function initHamburgerNav() {
  const nav = document.querySelector('[data-mb-nav]');
  if (!nav) return;

  if (nav._navDestroy) {
    nav._navDestroy();
    nav._navDestroy = null;
  }

  // Collapse the header text-nav when hamburger appears
  const mainNav = document.querySelector('.mb-main-nav') || document.querySelector('[data-mb-main-nav]');
  const toggle = nav.querySelector('[data-navigation-toggle="toggle"]');
  const darkBg = nav.querySelector('[data-navigation-toggle="close"]');
  const navLinks = [...nav.querySelectorAll('.hamburger-nav__a')];

  let raf = null;

  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      const show = (window.scrollY || 0) > 80;
      nav.classList.toggle('is-visible', show);
      if (mainNav) mainNav.classList.toggle('is-collapsed', show);
      if (!show) close();
    });
  }

  function open() {
    nav.setAttribute('data-navigation-status', 'active');
    if (toggle) {
      toggle.setAttribute('aria-label', 'Sluit menu');
      toggle.setAttribute('aria-expanded', 'true');
    }
  }

  function close() {
    nav.setAttribute('data-navigation-status', 'not-active');
    if (toggle) {
      toggle.setAttribute('aria-label', 'Open menu');
      toggle.setAttribute('aria-expanded', 'false');
    }
  }

  function handleToggleClick() {
    nav.getAttribute('data-navigation-status') === 'active' ? close() : open();
  }

  function handleToggleKey(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggleClick();
    }
  }

  function handleKeydown(e) {
    if (e.key === 'Escape') close();
  }

  toggle && toggle.addEventListener('click', handleToggleClick);
  toggle && toggle.addEventListener('keydown', handleToggleKey);
  darkBg && darkBg.addEventListener('click', close);
  navLinks.forEach(a => a.addEventListener('click', close));
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  nav._navDestroy = () => {
    toggle && toggle.removeEventListener('click', handleToggleClick);
    toggle && toggle.removeEventListener('keydown', handleToggleKey);
    darkBg && darkBg.removeEventListener('click', close);
    navLinks.forEach(a => a.removeEventListener('click', close));
    document.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('scroll', onScroll);
  };
}

// ==========================================================
// START A PROJECT FAB + DRAWER
// ==========================================================
function initStartProjectFAB() {
  const fab = document.querySelector('[data-sp-fab]');
  if (!fab) return;

  if (fab._fabDestroy) {
    fab._fabDestroy();
    fab._fabDestroy = null;
  }

  const backdrop = document.querySelector('[data-sp-backdrop]');
  const drawer = document.querySelector('[data-sp-drawer]');
  const closeBtn = document.querySelector('[data-sp-close]');
  const form = drawer && drawer.querySelector('.sp-form');

  let raf = null;
  let isOpen = false;
  let prevOverflow = '';

  function onScroll() {
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = null;
      const show = (window.scrollY || 0) > 80;
      fab.classList.toggle('is-visible', show && !isOpen);
    });
  }

  function openDrawer() {
    isOpen = true;
    fab.classList.remove('is-visible');
    if (backdrop) backdrop.classList.add('is-open');
    if (drawer) {
      drawer.classList.add('is-open');
      drawer.setAttribute('aria-hidden', 'false');
    }
    prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (window.__lenis && typeof window.__lenis.stop === 'function') window.__lenis.stop();
  }

  function closeDrawer() {
    isOpen = false;
    if (backdrop) backdrop.classList.remove('is-open');
    if (drawer) {
      drawer.classList.remove('is-open');
      drawer.setAttribute('aria-hidden', 'true');
    }
    document.body.style.overflow = prevOverflow;
    if (window.__lenis && typeof window.__lenis.start === 'function') window.__lenis.start();
    const show = (window.scrollY || 0) > 80;
    fab.classList.toggle('is-visible', show);
  }

  function handleKeydown(e) {
    if (e.key === 'Escape' && isOpen) closeDrawer();
  }

  function handleSubmit(e) {
    e.preventDefault();
    closeDrawer();
  }

  fab.addEventListener('click', openDrawer);
  backdrop && backdrop.addEventListener('click', closeDrawer);
  closeBtn && closeBtn.addEventListener('click', closeDrawer);
  form && form.addEventListener('submit', handleSubmit);
  document.addEventListener('keydown', handleKeydown);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // Hide FAB and blur when footer is in view
  const blur = document.querySelector('.progressive-blur');
  const footer = document.querySelector('[data-footer-parallax]') || document.querySelector('.mb-footer');
  if (footer) {
    const io = new IntersectionObserver((entries) => {
      const inView = entries.some(e => e.isIntersecting);
      document.body.classList.toggle('is-footer-visible', inView);
      if (blur) blur.classList.toggle('is-hidden', inView);
    }, { threshold: 0.05 });
    io.observe(footer);
    fab._io = io;
  }

  fab._fabDestroy = () => {
    fab.removeEventListener('click', openDrawer);
    backdrop && backdrop.removeEventListener('click', closeDrawer);
    closeBtn && closeBtn.removeEventListener('click', closeDrawer);
    form && form.removeEventListener('submit', handleSubmit);
    document.removeEventListener('keydown', handleKeydown);
    window.removeEventListener('scroll', onScroll);
    if (fab._io) { fab._io.disconnect(); fab._io = null; }
    document.body.classList.remove('is-footer-visible');
    if (blur) blur.classList.remove('is-hidden');
  };
}

// ==========================================================
// INIT
// ==========================================================
(function () {
  function boot() {
    initWeDoALot();
    initHamburgerNav();
    initStartProjectFAB();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
