
/* ===== Story rotator (header-left) =====
   Retries on rAF until React has mounted the header markup. */
(() => {
  function start() {
    const lines = [...document.querySelectorAll('.story-line')];
    const ring = document.querySelector('.ring-progress');
    if (!lines.length || !ring) return false;
    let idx = lines.findIndex(l => l.classList.contains('is-active'));
    if (idx < 0) { idx = 0; lines[0].classList.add('is-active'); }
    const DURATION = 4500;
    let anim = null;
    function play() {
      if (anim) { try { anim.cancel(); } catch (e) {} }
      anim = ring.animate(
        [{ strokeDashoffset: 149.23 }, { strokeDashoffset: 0 }],
        { duration: DURATION, easing: 'linear', fill: 'forwards' }
      );
      anim.onfinish = next;
    }
    function next() {
      const cur = lines[idx];
      cur.classList.remove('is-active');
      cur.classList.add('is-leaving');
      setTimeout(() => cur.classList.remove('is-leaving'), 650);
      idx = (idx + 1) % lines.length;
      lines[idx].classList.add('is-active');
      play();
    }
    play();
    return true;
  }
  if (start()) return;
  let tries = 0;
  const retry = () => {
    if (start() || ++tries > 600) return;
    requestAnimationFrame(retry);
  };
  requestAnimationFrame(retry);
})();


// ===== Number Odometer (GSAP) =====
function initNumberOdometer() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const initFlag = 'data-odometer-initialized';

  const defaults = {
    duration: 1,
    ease: 'power3.out',
    elementStagger: 0.1,
    digitStagger: 0.04,
    revealDuration: 0.5,
    revealEase: 'power2.out',
    triggerStart: 'top 80%',
    staggerOrder: 'left',
    digitCycles: 2
  };

  document.querySelectorAll('[data-odometer-group]').forEach(group => {
    if (group.hasAttribute(initFlag)) return;
    group.setAttribute(initFlag, '');

    const elements = Array.from(group.querySelectorAll('[data-odometer-element]'));
    if (!elements.length || prefersReducedMotion) return;

    const staggerOrder = group.getAttribute('data-odometer-stagger-order') || defaults.staggerOrder;
    const triggerStart = group.getAttribute('data-odometer-trigger-start') || defaults.triggerStart;
    const elementStagger = parseFloat(group.getAttribute('data-odometer-stagger')) || defaults.elementStagger;

    const elementData = elements.map(el => {
      const originalText = el.textContent.trim();
      const hasExplicitStart = el.hasAttribute('data-odometer-start');
      const startValue = parseFloat(el.getAttribute('data-odometer-start')) || 0;
      const duration = parseFloat(el.getAttribute('data-odometer-duration')) || defaults.duration;
      const step = getLineHeightRatio(el);

      let segments = parseSegments(originalText);
      segments = mapStartDigits(segments, startValue);
      segments = markHiddenSegments(segments, startValue);

      const grow = shouldGrow(el, hasExplicitStart, startValue, segments);
      const { rollers, revealEls } = buildRollerDOM(el, segments, step, grow);

      const fontSize = parseFloat(getComputedStyle(el).fontSize);
      const revealData = revealEls.map(revealEl => {
        const widthEm = revealEl.offsetWidth / fontSize;
        gsap.set(revealEl, { width: 0, overflow: 'hidden' });
        return { el: revealEl, widthEm };
      });

      return { el, rollers, duration, step, revealData, originalText };
    });

    const ordered = applyStaggerOrder(elementData, staggerOrder);

    const tl = gsap.timeline({
      scrollTrigger: { trigger: group, start: triggerStart, once: true },
      onComplete() {
        elementData.forEach(({ el, originalText }) => cleanupElement(el, originalText));
      }
    });

    ordered.forEach((data, orderIdx) => {
      const { rollers, duration, step, revealData } = data;
      const offset = orderIdx * elementStagger;

      revealData.forEach(({ el, widthEm }) => {
        tl.to(el, {
          width: widthEm + 'em',
          opacity: 1,
          duration: defaults.revealDuration,
          ease: defaults.revealEase
        }, offset);
      });

      rollers.forEach(({ roller, targetPos }, digitIdx) => {
        const reversedIdx = rollers.length - 1 - digitIdx;
        tl.to(roller, {
          y: -targetPos * step + 'em',
          duration,
          ease: defaults.ease,
          force3D: true
        }, offset + reversedIdx * defaults.digitStagger);
      });
    });
  });

  function getLineHeightRatio(el) {
    const cs = getComputedStyle(el);
    const lh = cs.lineHeight;
    if (lh === 'normal') return 1.2;
    return parseFloat(lh) / parseFloat(cs.fontSize);
  }
  function parseSegments(text) {
    return [...text].map(char => ({ type: /\d/.test(char) ? 'digit' : 'static', char }));
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
    const totalDigits = segments.filter(s => s.type === 'digit').length;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const leadingZeros = Math.max(0, totalDigits - startDigitCount);
    if (leadingZeros === 0) return segments;
    let digitsSeen = 0;
    let firstDigitSeen = false;
    let prevDigitHidden = false;
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
    if (el.hasAttribute('data-odometer-grow')) {
      return el.getAttribute('data-odometer-grow') !== 'false';
    }
    if (!hasExplicitStart) return false;
    const absStart = Math.floor(Math.abs(startValue));
    const startDigitCount = absStart === 0 ? 1 : String(absStart).length;
    const endDigitCount = segments.filter(s => s.type === 'digit').length;
    return startDigitCount < endDigitCount;
  }
  function buildRollerDOM(el, segments, step, grow) {
    el.innerHTML = '';
    el.style.height = '';
    const rollers = [];
    const revealEls = [];
    const totalCells = 10 * defaults.digitCycles;
    segments.forEach(seg => {
      if (seg.type === 'static') {
        const span = document.createElement('span');
        span.setAttribute('data-odometer-part', 'static');
        span.style.height = step + 'em';
        span.style.lineHeight = step;
        span.textContent = seg.char;
        el.appendChild(span);
        if (grow && seg.hidden) {
          gsap.set(span, { opacity: 0 });
          revealEls.push(span);
        }
        return;
      }
      const mask = document.createElement('span');
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
      const isReveal = grow && seg.hidden;
      gsap.set(roller, { y: isReveal ? step + 'em' : -startDigit * step + 'em' });
      const endDigit = parseInt(seg.char, 10);
      const targetPos = endDigit > startDigit ? endDigit : 10 + endDigit;
      rollers.push({ roller, targetPos });
      if (isReveal) revealEls.push(mask);
    });
    return { rollers, revealEls };
  }
  function cleanupElement(el, originalText) {
    el.style.overflow = '';
    el.style.height = '';
    const digits = [...originalText].filter(c => /\d/.test(c));
    let di = 0;
    el.querySelectorAll('[data-odometer-part="mask"]').forEach(mask => {
      const roller = mask.querySelector('[data-odometer-part="roller"]');
      if (roller) roller.remove();
      mask.textContent = digits[di++] || '';
      mask.style.opacity = '';
      mask.style.overflow = '';
    });
    el.querySelectorAll('[data-odometer-part="static"]').forEach(stat => {
      stat.style.opacity = '';
    });
  }
  function applyStaggerOrder(items, order) {
    const arr = [...items];
    if (order === 'right') return arr.reverse();
    if (order === 'random') {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    }
    return arr;
  }
}

// Initialize after React mounts
requestAnimationFrame(() => {
  requestAnimationFrame(() => {
    initNumberOdometer();
  });
});

<div class="progressive-blur" aria-hidden="true">
  <div class="progressive-blur__layer is--3"></div>
  <div class="progressive-blur__layer is--5"></div>
</div>
// Preserve preview query string (e.g. ?token=...) on internal HTML link clicks
(function(){
  var qs = window.location.search;
  if(!qs) return;
  document.addEventListener('click', function(e){
    var a = e.target.closest && e.target.closest('a[href]');
    if(!a) return;
    if(a.target && a.target !== '' && a.target !== '_self') return;
    var href = a.getAttribute('href');
    if(!href) return;
    // only same-page relative links ending in .html (or just .html with #/? )
    if(!/^[^?#]*\.html(?:[?#]|$)/i.test(href)) return;
    if(/^https?:\/\//i.test(href)) return;
    // don't double-append if it already has query
    if(href.indexOf('?') !== -1) return;
    var hashIdx = href.indexOf('#');
    var newHref = hashIdx === -1
      ? href + qs
      : href.slice(0, hashIdx) + qs + href.slice(hashIdx);
    a.setAttribute('href', newHref);
  }, true);
})();



<!-- enhancement-scripts -->
/* =====================================================
   MR BOOST — Smooth page fade transition
   Lightweight, no Barba required. On any internal HTML
   link click: fade an overlay in, then navigate. On page
   load: overlay fades out, revealing the new page.
   ===================================================== */
(function () {
  if (window.__pageFadeReady) return;
  window.__pageFadeReady = true;

  var FADE_OUT_MS = 380; // duration of the cover-up fade before navigation
  var FADE_IN_MS = 520;  // duration of the reveal fade on page load

  /* ---------- Styles ---------- */
  var css = [
    '.page-fade{position:fixed;inset:0;background:#131313;z-index:9999;pointer-events:none;opacity:1;visibility:visible;transition:opacity ' + FADE_IN_MS + 'ms cubic-bezier(.625,.05,0,1),visibility ' + FADE_IN_MS + 'ms;}',
    '.page-fade.is-revealed{opacity:0;visibility:hidden;}',
    '.page-fade.is-covering{opacity:1;visibility:visible;pointer-events:auto;transition:opacity ' + FADE_OUT_MS + 'ms cubic-bezier(.625,.05,0,1),visibility 0s;}',
    '@media (prefers-reduced-motion: reduce){',
    '  .page-fade{transition:none !important;}',
    '}'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.setAttribute('data-page-fade-style', '');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- Build overlay ---------- */
  function ensureOverlay() {
    var el = document.querySelector('.page-fade');
    if (el) return el;
    el = document.createElement('div');
    el.className = 'page-fade';
    el.setAttribute('aria-hidden', 'true');
    // Insert as first child of body so it sits on top of everything else
    document.body.insertBefore(el, document.body.firstChild);
    return el;
  }

  /* ---------- Reveal on load ---------- */
  function revealOnLoad() {
    var overlay = ensureOverlay();
    // Two RAFs to ensure the browser registers the initial visible state
    // before transitioning to hidden — otherwise it would skip the animation.
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        overlay.classList.add('is-revealed');
      });
    });
  }

  /* ---------- Intercept link clicks ---------- */
  function isInternalHtmlHref(href) {
    if (!href) return false;
    if (href.charAt(0) === '#') return false; // pure anchor
    if (/^(mailto:|tel:|javascript:|data:)/i.test(href)) return false;
    if (/^https?:\/\//i.test(href)) {
      // Allow same-origin .html navigation
      try {
        var url = new URL(href);
        if (url.origin !== window.location.origin) return false;
        return /\.html(?:[?#]|$)/i.test(url.pathname);
      } catch (e) { return false; }
    }
    // Relative URL
    return /^[^?#]*\.html(?:[?#]|$)/i.test(href);
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented) return;
    if (e.button !== 0) return; // only left-click
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // open-in-new-tab gestures
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    if (a.hasAttribute('download')) return;
    var target = a.getAttribute('target');
    if (target && target !== '' && target !== '_self') return;
    var href = a.getAttribute('href');
    if (!isInternalHtmlHref(href)) return;

    // Build the destination URL, preserving the current query string
    // (so the preview-token survives across navigation).
    var dest = href;
    var qs = window.location.search;
    if (qs && dest.indexOf('?') === -1 && !/^https?:\/\//i.test(dest)) {
      var hashIdx = dest.indexOf('#');
      dest = hashIdx === -1 ? dest + qs : dest.slice(0, hashIdx) + qs + dest.slice(hashIdx);
    }

    // Skip if this is just an in-page jump within the same path
    try {
      var resolved = new URL(dest, window.location.href);
      if (resolved.pathname === window.location.pathname &&
          resolved.search === window.location.search &&
          resolved.hash && resolved.hash !== window.location.hash) {
        return; // let the browser handle the hash jump
      }
    } catch (err) {}

    e.preventDefault();

    var overlay = ensureOverlay();
    overlay.classList.remove('is-revealed');
    // Trigger cover-up animation
    requestAnimationFrame(function () {
      overlay.classList.add('is-covering');
    });

    // Navigate once the cover is opaque
    var done = false;
    function go() {
      if (done) return;
      done = true;
      window.location.href = dest;
    }
    setTimeout(go, FADE_OUT_MS + 20);
  }, true);

  /* ---------- Back/forward cache handling ---------- */
  // When user uses browser back button, pageshow fires — make sure overlay is hidden
  window.addEventListener('pageshow', function (e) {
    if (e.persisted) {
      var overlay = document.querySelector('.page-fade');
      if (overlay) {
        overlay.classList.remove('is-covering');
        overlay.classList.add('is-revealed');
      }
    }
  });

  /* ---------- Boot ---------- */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', revealOnLoad);
  } else {
    revealOnLoad();
  }
})();

/* =====================================================
   MR BOOST — WhatsApp QR Modal + floating button
   Osmo Supply pattern, restyled to match the dark site.
   ===================================================== */
(function () {
  if (window.__waModalReady) return;
  window.__waModalReady = true;

  var WA_NUMBER = '31637344570';
  var WA_URL = 'https://wa.me/' + WA_NUMBER;

  var WA_ICON_SVG =
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
      '<path fill-rule="evenodd" clip-rule="evenodd" d="M19.049 4.90701C17.3493 3.20721 15.0898 2.18312 12.6912 2.02547C10.2926 1.86782 7.91847 2.58735 6.01096 4.05007C4.10345 5.51278 2.7926 7.61896 2.32257 9.97633C1.85254 12.3337 2.25535 14.7816 3.456 16.864L2.049 22L7.3 20.621C8.75245 21.4124 10.3799 21.8277 12.034 21.829C13.9949 21.8301 15.912 21.2495 17.5429 20.1607C19.1737 19.072 20.445 17.5239 21.1958 15.7125C21.9467 13.9011 22.1434 11.9077 21.7611 9.98441C21.3788 8.06116 20.4346 6.29453 19.048 4.90801L19.049 4.90701ZM12.041 20.157C10.5648 20.1573 9.11572 19.76 7.846 19.007L7.546 18.827L4.428 19.644L5.261 16.605L5.066 16.293C4.38658 15.2118 3.96778 13.9875 3.84265 12.7167C3.71752 11.4459 3.88948 10.1634 4.34497 8.97049C4.80045 7.77755 5.52699 6.70681 6.46722 5.84279C7.40746 4.97877 8.53566 4.34513 9.76277 3.99188C10.9899 3.63863 12.2823 3.57544 13.538 3.8073C14.7937 4.03916 15.9783 4.55973 16.9984 5.3279C18.0184 6.09608 18.8459 7.09084 19.4156 8.23366C19.9853 9.37647 20.2816 10.6361 20.281 11.913C20.2778 14.0977 19.4088 16.192 17.8642 17.7371C16.3197 19.2822 14.2257 20.153 12.041 20.157ZM16.557 13.985C16.311 13.86 15.092 13.263 14.865 13.185C14.638 13.107 14.474 13.06 14.306 13.31C14.138 13.56 13.666 14.11 13.521 14.283C13.376 14.456 13.233 14.47 12.986 14.345C12.2559 14.0533 11.5819 13.6371 10.994 13.115C10.4534 12.6137 9.98909 12.0359 9.616 11.4C9.471 11.154 9.6 11.018 9.726 10.9C9.852 10.782 9.972 10.611 10.097 10.466C10.1992 10.3409 10.2824 10.2014 10.344 10.052C10.3769 9.98367 10.3922 9.90823 10.3887 9.83248C10.3852 9.75674 10.363 9.68304 10.324 9.61801C10.261 9.49301 9.765 8.27401 9.562 7.77801C9.359 7.28201 9.156 7.35201 9 7.34401C8.844 7.33601 8.69 7.33601 8.527 7.33601C8.40171 7.33967 8.2785 7.36898 8.16498 7.42213C8.05147 7.47527 7.95005 7.55113 7.867 7.64501C7.58693 7.9105 7.36521 8.23139 7.21594 8.58725C7.06667 8.94312 6.99313 9.32616 7 9.71201C7.08057 10.6462 7.43193 11.5365 8.011 12.274C9.07331 13.8657 10.5309 15.1541 12.241 16.013C12.831 16.267 13.292 16.419 13.651 16.537C14.156 16.6901 14.6896 16.7244 15.21 16.637C15.5548 16.567 15.8813 16.4264 16.1691 16.224C16.4569 16.0216 16.6996 15.7618 16.882 15.461C17.0444 15.0917 17.0948 14.6827 17.027 14.285C16.969 14.174 16.805 14.114 16.555 13.985H16.557Z" fill="currentColor"></path>' +
    '</svg>';

  /* ---------- Styles ---------- */
  var css = [
    /* Floating action button */
    '.wa-fab{position:fixed;right:24px;bottom:24px;width:60px;height:60px;border-radius:50%;background:#25D366;color:#fff;cursor:pointer;z-index:999;border:none;padding:0;box-shadow:0 8px 28px rgba(0,0,0,.35),0 2px 8px rgba(0,0,0,.25);transition:transform .35s cubic-bezier(.625,.05,0,1),box-shadow .25s,background .25s;overflow:hidden;display:flex;align-items:center;justify-content:center;}',
    '.wa-fab:hover{transform:translateY(-3px);box-shadow:0 14px 38px rgba(0,0,0,.5),0 3px 10px rgba(0,0,0,.35);background:#1ebe5b;}',
    '.wa-fab:focus{outline:none;}',
    '.wa-fab:focus-visible{outline:2px solid #F8FF88;outline-offset:4px;}',

    /* Icon stack — two icons, translate up on hover to reveal the duplicate */
    '.wa-fab__icon{position:relative;width:28px;height:28px;display:block;overflow:hidden;line-height:0;}',
    '.wa-fab__icon svg{width:28px;height:28px;display:block;position:absolute;left:0;transition:translate .45s cubic-bezier(.625,.05,0,1);}',
    '.wa-fab__icon svg:nth-child(1){top:0;translate:0 0;}',
    '.wa-fab__icon svg:nth-child(2){top:100%;translate:0 0;}',
    '@media (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference){',
    '  .wa-fab:hover .wa-fab__icon svg:nth-child(1){translate:0 -100%;}',
    '  .wa-fab:hover .wa-fab__icon svg:nth-child(2){translate:0 -100%;}',
    '}',
    '@media (max-width: 720px){.wa-fab{right:16px;bottom:16px;width:54px;height:54px;}.wa-fab__icon,.wa-fab__icon svg{width:25px;height:25px;}}',

    /* Modal shell */
    '.whatsapp-modal{z-index:1001;pointer-events:none;display:flex;flex-flow:column;justify-content:center;align-items:center;position:fixed;inset:0;}',
    '.whatsapp-modal__dark{transition:opacity .5s cubic-bezier(.5,.1,0,1),visibility .5s;pointer-events:auto;background-color:rgba(0,0,0,.72);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);width:100%;height:100%;position:absolute;inset:0;opacity:0;visibility:hidden;}',
    '[data-whatsapp-modal-status="active"] .whatsapp-modal__dark{opacity:1;visibility:visible;}',

    /* Modal card */
    '.whatsapp-modal__card{transition:transform .6s cubic-bezier(.625,.05,0,1),opacity .5s,visibility .5s;pointer-events:auto;background-color:#0e0e0e;border:1px solid rgba(255,255,255,.08);border-radius:24px;display:flex;flex-flow:column;align-items:center;gap:20px;width:320px;max-width:calc(100vw - 40px);padding:56px 30px 36px;position:relative;transform:translateY(30px);opacity:0;visibility:hidden;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;}',
    '[data-whatsapp-modal-status="active"] .whatsapp-modal__card{transform:translateY(0);opacity:1;visibility:visible;}',

    '.whatsapp-modal__qr-canvas{background-color:#fff;width:200px;height:200px;border-radius:14px;padding:14px;display:grid;place-items:center;}',
    '.whatsapp-modal__qr-canvas svg{width:100%;height:100%;display:block;}',
    '.whatsapp-modal__qr-canvas svg rect[fill="#FFFFFF"],.whatsapp-modal__qr-canvas svg rect[fill="#ffffff"]{fill:transparent;}',

    '.whatsapp-modal__text{display:flex;flex-flow:column;align-items:center;gap:8px;padding-top:4px;}',
    '.whatsapp-modal__h2{color:#e9e8e3;text-align:center;margin:0;font-size:22px;font-weight:700;letter-spacing:-0.01em;line-height:1.1;}',
    '.whatsapp-modal__p{color:#8a8a8a;text-align:center;font-size:13px;line-height:1.5;max-width:230px;margin:0;}',

    '.whatsapp-modal__btn{color:#0a0a0a;cursor:pointer;background-color:#F8FF88;border-radius:999px;padding:12px 24px;text-decoration:none;display:inline-flex;align-items:center;gap:8px;position:relative;font-size:13px;font-weight:600;letter-spacing:-0.005em;transition:background .2s,transform .25s;}',
    '.whatsapp-modal__btn:hover{background:#e9e8e3;transform:translateY(-1px);}',

    '.whatsapp-modal__close{cursor:pointer;display:grid;place-items:center;width:32px;height:32px;position:absolute;top:16px;right:16px;border-radius:50%;transition:background .2s;background:transparent;border:none;color:inherit;}',
    '.whatsapp-modal__close:hover{background:rgba(255,255,255,.08);}',
    '.whatsapp-modal__close-bar{background-color:#e9e8e3;width:14px;height:1.5px;position:absolute;transform:rotate(-45deg);}',
    '.whatsapp-modal__close-bar.is--duplicate{transform:rotate(45deg);}'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.setAttribute('data-wa-modal-style', '');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- Inject HTML ---------- */
  var modalHtml =
    '<div data-whatsapp-modal-status="not-active" data-whatsapp-modal="' + WA_URL + '" class="whatsapp-modal">' +
      '<div data-whatsapp-modal-toggle="" class="whatsapp-modal__dark"></div>' +
      '<div class="whatsapp-modal__card">' +
        '<div data-whatsapp-modal-qr-canvas="" class="whatsapp-modal__qr-canvas"></div>' +
        '<div class="whatsapp-modal__text">' +
          '<h2 class="whatsapp-modal__h2">App ons</h2>' +
          '<p class="whatsapp-modal__p">Scan de QR-code om direct te chatten via WhatsApp.</p>' +
        '</div>' +
        '<a data-whatsapp-modal-link="" href="#" class="whatsapp-modal__btn">' +
          '<span>Open WhatsApp</span>' +
        '</a>' +
        '<button type="button" data-whatsapp-modal-toggle="" class="whatsapp-modal__close" aria-label="Sluiten">' +
          '<span class="whatsapp-modal__close-bar"></span>' +
          '<span class="whatsapp-modal__close-bar is--duplicate"></span>' +
        '</button>' +
      '</div>' +
    '</div>';

  var fabHtml =
    '<button type="button" data-whatsapp-modal-toggle="" class="wa-fab" aria-label="WhatsApp ons">' +
      '<span class="wa-fab__icon" aria-hidden="true">' + WA_ICON_SVG + WA_ICON_SVG + '</span>' +
    '</button>';

  function mount() {
    var holder = document.createElement('div');
    holder.setAttribute('data-wa-modal-root', '');
    holder.innerHTML = modalHtml + fabHtml;
    while (holder.firstChild) document.body.appendChild(holder.firstChild);
    loadKjua(init);
  }

  /* ---------- Load kjua ---------- */
  function loadKjua(cb) {
    if (typeof window.kjua !== 'undefined') { cb(); return; }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/kjua@0.10.0/dist/kjua.min.js';
    s.onload = cb;
    s.onerror = function () { console.warn('[wa-modal] kjua failed to load — QR not generated'); cb(); };
    document.head.appendChild(s);
  }

  /* ---------- Init ---------- */
  function init() {
    var modal = document.querySelector('[data-whatsapp-modal]');
    if (!modal) return;
    var url = (modal.getAttribute('data-whatsapp-modal') || '').trim();
    if (!url) return;

    // Generate SVG QR (when kjua loaded successfully)
    if (typeof kjua !== 'undefined') {
      try {
        var svg = kjua({
          text: url,
          render: 'svg',
          crisp: true,
          minVersion: 1,
          ecLevel: 'M',
          size: 540,
          fill: '#0a0a0a',
          back: '#FFFFFF',
          rounded: 0
        });
        svg.removeAttribute('width');
        svg.removeAttribute('height');
        svg.removeAttribute('style');
        modal.querySelectorAll('[data-whatsapp-modal-qr-canvas]').forEach(function (ph, i) {
          ph.innerHTML = '';
          ph.appendChild(i === 0 ? svg : svg.cloneNode(true));
        });
      } catch (e) {
        console.error('[wa-modal] QR generation failed', e);
      }
    }

    // Link elements
    document.querySelectorAll('[data-whatsapp-modal-link]').forEach(function (link) {
      link.setAttribute('href', url);
      link.setAttribute('target', '_blank');
      link.setAttribute('rel', 'noopener noreferrer');
    });

    var isTouch = window.matchMedia && window.matchMedia('(hover:none) and (pointer:coarse)').matches;

    // Toggle buttons
    document.querySelectorAll('[data-whatsapp-modal-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        // On touch devices, the FAB navigates directly to WhatsApp instead of opening the modal.
        if (isTouch && btn.classList.contains('wa-fab')) {
          window.open(url, '_blank', 'noopener,noreferrer');
          return;
        }
        var isActive = modal.getAttribute('data-whatsapp-modal-status') === 'active';
        modal.setAttribute('data-whatsapp-modal-status', isActive ? 'not-active' : 'active');
      });
    });

    // ESC closes
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' || e.keyCode === 27) {
        modal.setAttribute('data-whatsapp-modal-status', 'not-active');
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();

/* =====================================================
   MR BOOST — Masked text reveal (chars) on scroll
   GSAP SplitText + ScrollTrigger (Osmo pattern)
   Selector: [data-split="heading"][data-split-reveal="chars"]
   ===================================================== */
(function () {
  if (window.__splitRevealLoading || window.__splitRevealDone) return;
  window.__splitRevealLoading = true;

  function load(url, cb) {
    var existing = document.querySelector('script[data-split-dep="' + url + '"]');
    if (existing) {
      if (existing.dataset.loaded === '1') { cb && cb(); return; }
      existing.addEventListener('load', function () { cb && cb(); });
      return;
    }
    var s = document.createElement('script');
    s.src = url;
    s.setAttribute('data-split-dep', url);
    s.onload = function () { s.dataset.loaded = '1'; cb && cb(); };
    s.onerror = function () { console.warn('[split-reveal] failed to load', url); };
    document.head.appendChild(s);
  }

  function run() {
    if (window.__splitRevealDone) return;
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined' || typeof SplitText === 'undefined') return;
    window.__splitRevealDone = true;
    gsap.registerPlugin(SplitText, ScrollTrigger);

    var cfg = {
      lines: { duration: 0.8, stagger: 0.08 },
      words: { duration: 0.6, stagger: 0.06 },
      chars: { duration: 0.55, stagger: 0.02 }
    };

    var headings = document.querySelectorAll('[data-split="heading"]');
    headings.forEach(function (heading) {
      var type = heading.dataset.splitReveal || 'lines';
      var split =
        type === 'lines' ? ['lines'] :
        type === 'words' ? ['lines','words'] :
        ['lines','words','chars'];

      SplitText.create(heading, {
        type: split.join(', '),
        mask: 'lines',
        autoSplit: true,
        linesClass: 'split-line',
        wordsClass: 'split-word',
        charsClass: 'split-char',
        onSplit: function (instance) {
          var targets = instance[type];
          var c = cfg[type];
          gsap.set(heading, { autoAlpha: 1 });
          // If the heading is already in the viewport at init, play immediately
          // (no waiting for scroll). Otherwise let ScrollTrigger handle it.
          var rect = heading.getBoundingClientRect();
          var vh = window.innerHeight || document.documentElement.clientHeight;
          var inView = rect.top < vh * 0.95 && rect.bottom > 0;
          if (inView) {
            return gsap.from(targets, {
              yPercent: 115,
              duration: c.duration,
              stagger: c.stagger,
              ease: 'expo.out'
            });
          }
          return gsap.from(targets, {
            yPercent: 115,
            duration: c.duration,
            stagger: c.stagger,
            ease: 'expo.out',
            scrollTrigger: {
              trigger: heading,
              start: 'clamp(top 85%)',
              once: true
            }
          });
        }
      });
    });
  }

  function go() {
    if (typeof gsap === 'undefined') {
      load('https://cdn.jsdelivr.net/npm/gsap@3.15/dist/gsap.min.js', go);
      return;
    }
    if (typeof ScrollTrigger === 'undefined') {
      load('https://cdn.jsdelivr.net/npm/gsap@3.15/dist/ScrollTrigger.min.js', go);
      return;
    }
    if (typeof SplitText === 'undefined') {
      load('https://cdn.jsdelivr.net/npm/gsap@3.15/dist/SplitText.min.js', go);
      return;
    }
    var ready = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    ready.then(run);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', go);
  } else {
    go();
  }
})();

/* =====================================================
   MR BOOST — Copy email to clipboard (Osmo pattern)
   Injects an animated copy-email pill into .footer-contact-block.
   ===================================================== */
(function () {
  if (window.__copyEmailReady) return;
  window.__copyEmailReady = true;

  var EMAIL = 'mail@mrbrews.nl';

  /* ---------- Styles ---------- */
  var css = [
    '.copy-email-eyebrow{display:block;font-size:11px;font-weight:500;letter-spacing:0.16em;text-transform:uppercase;color:#8a8a8a;margin:24px 0 10px;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;}',

    '.copy-email-button{display:inline-flex;align-items:center;gap:12px;background:#141414;border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:8px 18px 8px 8px;cursor:pointer;color:#e9e8e3;font-family:"Helvetica Neue",Helvetica,Arial,sans-serif;transition:border-color .25s,background .25s;text-decoration:none;-webkit-tap-highlight-color:transparent;}',
    '.copy-email-button:hover{border-color:rgba(255,255,255,0.18);background:#181818;}',
    '.copy-email-button:focus{outline:none;}',
    '.copy-email-button:focus-visible{outline:2px solid #F8FF88;outline-offset:3px;}',

    '.copy-email-icon__wrap{flex-shrink:0;display:grid;place-items:center;width:40px;height:40px;border-radius:10px;background:#F8FF88;color:#0a0a0a;transition:background .25s,color .25s;}',
    '.copy-email-icon__wrap svg{width:18px;height:18px;display:block;}',

    '.copy-email-text__wrap{height:1.2em;font-size:18px;line-height:1.2;font-weight:600;letter-spacing:-0.01em;display:flex;flex-direction:column;align-items:flex-start;overflow:hidden;color:#e9e8e3;}',
    '.copy-email-text__el{white-space:nowrap;transition:transform .45s cubic-bezier(.65,0,0,1);}',

    '@media (hover:hover){.copy-email-button:hover .copy-email-text__el{transform:translateY(-100%);}}',

    '[data-copy-button="copied"] .copy-email-icon__wrap{background:#25D366 !important;color:#fff !important;}',
    '[data-copy-button="copied"] .copy-email-text__el{transform:translateY(-200%) !important;}',

    '@media (max-width:720px){.copy-email-text__wrap{font-size:15px;}.copy-email-icon__wrap{width:36px;height:36px;}}'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.setAttribute('data-copy-email-style', '');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- Markup ---------- */
  function buildButton() {
    var wrap = document.createElement('div');
    wrap.className = 'copy-email-wrapper';
    wrap.innerHTML =
      '<p class="copy-email-eyebrow">Direct mailen</p>' +
      '<button type="button" aria-label="Kopieer e-mailadres naar klembord" data-copy-button="" data-copy-email="' + EMAIL + '" class="copy-email-button">' +
        '<span class="copy-email-icon__wrap" aria-hidden="true">' +
          '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">' +
            '<path d="M16 2H8V5H16V2Z" stroke="currentColor" stroke-width="1.7" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>' +
            '<path d="M16 3H17.5L19 4.5V19.5L17.5 21H6.5L5 19.5V4.5L6.5 3H8" stroke="currentColor" stroke-width="1.7" stroke-miterlimit="10" stroke-linecap="round" stroke-linejoin="round"/>' +
          '</svg>' +
        '</span>' +
        '<span class="copy-email-text__wrap">' +
          '<span data-copy-email-element="" class="copy-email-text__el">' + EMAIL + '</span>' +
          '<span class="copy-email-text__el">Klik om te kopiëren</span>' +
          '<span class="copy-email-text__el">Gekopieerd!</span>' +
        '</span>' +
      '</button>';
    return wrap;
  }

  /* ---------- Init ---------- */
  function bind(button) {
    function copy() {
      var email = button.getAttribute('data-copy-email') ||
                  (button.querySelector('[data-copy-email-element]') && button.querySelector('[data-copy-email-element]').textContent.trim());
      if (!email) return;
      var doSet = function () {
        button.setAttribute('data-copy-button', 'copied');
        button.setAttribute('aria-label', 'E-mailadres gekopieerd!');
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(email).then(doSet).catch(function () { fallbackCopy(email); doSet(); });
      } else {
        fallbackCopy(email);
        doSet();
      }
    }
    function fallbackCopy(text) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.left = '-9999px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta);
    }
    function reset() {
      button.removeAttribute('data-copy-button');
      button.setAttribute('aria-label', 'Kopieer e-mailadres naar klembord');
    }
    button.addEventListener('click', function (e) { e.preventDefault(); copy(); });
    button.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); copy(); }
    });
    button.addEventListener('mouseleave', function () { reset(); button.blur(); });
    button.addEventListener('blur', reset);
  }

  function injectInto(footerBlock) {
    if (!footerBlock || footerBlock.querySelector('.copy-email-wrapper')) return;
    var wrapper = buildButton();
    // Insert right after the .footer-contact-btn (the yellow Contact pill) if present,
    // otherwise prepend.
    var contactBtn = footerBlock.querySelector('.footer-contact-btn');
    if (contactBtn && contactBtn.parentNode === footerBlock) {
      contactBtn.insertAdjacentElement('afterend', wrapper);
    } else {
      footerBlock.insertBefore(wrapper, footerBlock.firstChild);
    }
    bind(wrapper.querySelector('.copy-email-button'));
  }

  function tryInject() {
    var blocks = document.querySelectorAll('.footer-contact-block');
    blocks.forEach(injectInto);
    return blocks.length > 0;
  }

  function start() {
    if (tryInject()) return;
    // Watch for late-rendered footers (e.g. React-rendered home page)
    var observer = new MutationObserver(function () {
      if (tryInject()) observer.disconnect();
    });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { observer.disconnect(); }, 8000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

/* =====================================================
   MR BOOST — Button 038 (text-stagger slide-up on hover)
   Osmo Supply pattern; auto-applied to CTA buttons.
   ===================================================== */
(function () {
  if (window.__btn038Ready) return;
  window.__btn038Ready = true;

  /* Selectors of buttons that should receive the effect. */
  var SELECTORS = [
    '.pill-white',
    '.check-match-btn',
    '.case-live-btn .case-live-btn-text',     // we'll wrap the text part below
    '.case-live-btn > span',                    // existing markup uses bare <span>
    '.footer-contact-btn',
    '.chip-pill'
  ];

  /* Inject styles */
  var css = [
    '[data-btn-letter-slide]{display:inline-flex;align-items:center;gap:inherit;}',
    '[data-btn-letter-slide-text]{display:inline-block;line-height:1.2;clip-path:inset(-10% 0%);}',
    '[data-btn-letter-slide-text] > span{display:inline-block;white-space:pre;translate:0 0 0;text-shadow:0 1.3em currentColor;transition:translate .55s cubic-bezier(.625,.05,0,1);transition-delay:calc(var(--bl-i, 0) * 0.015s);}',
    '@media (hover:hover) and (pointer:fine) and (prefers-reduced-motion:no-preference){',
    '  [data-btn-letter-slide-host]:hover [data-btn-letter-slide-text] > span,',
    '  [data-btn-letter-slide-host]:focus-visible [data-btn-letter-slide-text] > span{',
    '    translate:0 -1.3em 0;',
    '    transition-delay:calc(var(--bl-i, 0) * 0.015s + 0.05s);',
    '  }',
    '}'
  ].join('\n');

  var styleEl = document.createElement('style');
  styleEl.setAttribute('data-btn038-style', '');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  /* ---------- Transform ---------- */
  function splitChars(target, text) {
    target.setAttribute('data-btn-letter-slide-text', '');
    target.innerHTML = '';
    var chars = Array.from(text);
    chars.forEach(function (ch, i) {
      var s = document.createElement('span');
      s.style.setProperty('--bl-i', i);
      s.textContent = ch;
      target.appendChild(s);
    });
  }

  function transformButton(btn) {
    if (btn.dataset.btnLetterSlideHost !== undefined) return;
    // Find the text-bearing element:
    //   1) explicit child <span> that contains only text
    //   2) otherwise, wrap the button's own text node
    var textHost = null;
    var spans = btn.querySelectorAll(':scope > span');
    for (var i = 0; i < spans.length; i++) {
      var sp = spans[i];
      // Skip spans that contain icons or other elements
      if (sp.children.length === 0 && sp.textContent.trim()) {
        textHost = sp;
        break;
      }
    }
    if (!textHost) {
      // Button has no wrapping span. If it has icon children we skip;
      // if it's pure text we wrap it ourselves.
      var hasIcon = !!btn.querySelector('svg, img, .play-circle');
      if (hasIcon) return; // unsupported markup
      var wrap = document.createElement('span');
      wrap.textContent = btn.textContent.trim();
      btn.innerHTML = '';
      btn.appendChild(wrap);
      textHost = wrap;
    }
    var text = textHost.textContent;
    if (!text) return;
    btn.setAttribute('data-btn-letter-slide-host', '');
    btn.setAttribute('data-btn-letter-slide', '');
    splitChars(textHost, text);
  }

  function run() {
    var targets = document.querySelectorAll(
      '.pill-white, .check-match-btn, .case-live-btn, .footer-contact-btn, .chip-pill'
    );
    targets.forEach(transformButton);
  }

  function start() {
    run();
    // Watch for late-mounted buttons (e.g. React-rendered homepage)
    var observer = new MutationObserver(function () { run(); });
    observer.observe(document.body, { childList: true, subtree: true });
    setTimeout(function () { observer.disconnect(); }, 10000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

<!-- enhancement-scripts -->

<!-- Bunny HLS Background Video (hero) -->
function initBunnyPlayerBackground() {
  document.querySelectorAll('[data-bunny-background-init]').forEach(function(player) {
    if (player._bunnyInit) return;
    player._bunnyInit = true;
    var src = player.getAttribute('data-player-src');
    if (!src) return;

    var video = player.querySelector('video');
    if (!video) return;

    try { video.pause(); } catch(_) {}
    try { video.removeAttribute('src'); video.load(); } catch(_) {}

    function setStatus(s) {
      if (player.getAttribute('data-player-status') !== s) {
        player.setAttribute('data-player-status', s);
      }
    }
    function setActivated(v) { player.setAttribute('data-player-activated', v ? 'true' : 'false'); }
    if (!player.hasAttribute('data-player-activated')) setActivated(false);

    var lazyMode   = player.getAttribute('data-player-lazy');
    var isLazyTrue = lazyMode === 'true';
    var autoplay   = player.getAttribute('data-player-autoplay') === 'true';
    var initialMuted = player.getAttribute('data-player-muted') === 'true';

    var pendingPlay = false;

    if (autoplay) { video.muted = true; video.loop = true; }
    else { video.muted = initialMuted; }

    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');
    video.setAttribute('webkit-playsinline', '');
    video.playsInline = true;
    if (typeof video.disableRemotePlayback !== 'undefined') video.disableRemotePlayback = true;
    if (autoplay) video.autoplay = false;

    var isSafariNative = !!video.canPlayType('application/vnd.apple.mpegurl');
    var canUseHlsJs    = !!(window.Hls && Hls.isSupported()) && !isSafariNative;

    var isAttached = false;
    var userInteracted = false;
    var lastPauseBy = '';
    function attachMediaOnce() {
      if (isAttached) return;
      isAttached = true;

      if (player._hls) { try { player._hls.destroy(); } catch(_) {} player._hls = null; }

      if (isSafariNative) {
        video.preload = isLazyTrue ? 'none' : 'auto';
        video.src = src;
        video.addEventListener('loadedmetadata', function() {
          readyIfIdle(player, pendingPlay);
        }, { once: true });
      } else if (canUseHlsJs) {
        var hls = new Hls({ maxBufferLength: 10 });
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, function() { hls.loadSource(src); });
        hls.on(Hls.Events.MANIFEST_PARSED, function() {
          readyIfIdle(player, pendingPlay);
        });
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
      userInteracted = true;
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

    player.addEventListener('click', function(e) {
      var btn = e.target.closest('[data-player-control]');
      if (!btn || !player.contains(btn)) return;
      var type = btn.getAttribute('data-player-control');
      if (type === 'play' || type === 'pause' || type === 'playpause') togglePlay();
      else if (type === 'mute') toggleMute();
    });

    video.addEventListener('play', function() { setActivated(true); setStatus('playing'); });
    video.addEventListener('playing', function() { pendingPlay = false; setStatus('playing'); });
    video.addEventListener('pause', function() { pendingPlay = false; setStatus('paused'); });
    video.addEventListener('waiting', function() { setStatus('loading'); });
    video.addEventListener('canplay', function() { readyIfIdle(player, pendingPlay); });
    video.addEventListener('ended', function() { pendingPlay = false; setStatus('paused'); setActivated(false); });

    if (autoplay) {
      if (player._io) { try { player._io.disconnect(); } catch(_) {} }
      var io = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          var inView = entry.isIntersecting && entry.intersectionRatio > 0;
          if (inView) {
            if (isLazyTrue && !isAttached) attachMediaOnce();
            if ((lastPauseBy === 'io') || (video.paused && lastPauseBy !== 'manual')) {
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
      player._io = io;
    }
  });

  function readyIfIdle(player, pendingPlay) {
    if (!pendingPlay &&
        player.getAttribute('data-player-activated') !== 'true' &&
        player.getAttribute('data-player-status') === 'idle') {
      player.setAttribute('data-player-status', 'ready');
    }
  }

  function safePlay(video) {
    var p = video.play();
    if (p && typeof p.then === 'function') p.catch(function(){});
  }
}

// React renders the markup asynchronously, so retry until the bunny container exists.
(function bootBunny() {
  var tries = 0;
  function tick() {
    var el = document.querySelector('[data-bunny-background-init]');
    if (el) {
      initBunnyPlayerBackground();
      return;
    }
    if (tries++ > 200) return; // give up after ~10s
    setTimeout(tick, 50);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', tick);
  } else {
    tick();
  }
})();
</script><!-- Lenis Smooth Scroll (site-wide, GSAP ScrollTrigger compatible) -->
(function(){
  function start(){
    if (typeof Lenis === 'undefined') { return setTimeout(start, 50); }
    if (window.__lenis) return;
    var lenis = new Lenis({
      lerp: 0.09,
      duration: 1.2,
      smoothWheel: true,
      easing: function(t){ return Math.min(1, 1.001 - Math.pow(2, -10 * t)); }
    });
    window.__lenis = lenis;
    // Run Lenis on its own rAF loop (do NOT pipe through gsap.ticker — that breaks
    // autonomous GSAP tweens by freezing the ticker clock).
    function raf(time){ lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    // ScrollTrigger sync — Lenis scroll events poke ScrollTrigger so scrub timelines
    // stay in lockstep with the smooth scroll.
    if (window.gsap && window.ScrollTrigger) {
      lenis.on('scroll', ScrollTrigger.update);
    }
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();

