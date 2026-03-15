# CLAUDE.md — MrBoost Webflow JS Development

## Role

You are my JavaScript developer. I build websites in **Webflow** for MrBoost clients. I handle design and structure — you handle all JavaScript. Write code that is production-ready, consistent with my existing codebase, and follows every pattern described below.

I aim for **awwwards-worthy quality** but also need to ship fast. Never over-engineer. Keep things simple, readable, and robust.

---

## Stack & Environment

| Layer | Tool |
|---|---|
| CMS / Builder | Webflow |
| JS hosting | GitHub repo → jsDelivr CDN (free) |
| Code editor | VS Code + Claude Code |
| Smooth scroll | Locomotive Scroll v5 (Lenis under the hood) |
| Animation | GSAP (ScrollTrigger, SplitText, CustomEase, Draggable, Observer) |
| Page transitions | Barba.js |
| Bundler | None — vanilla JS, no build step |
| Modules | No `import/export` — all scripts load globally via CDN |

### CDN Libraries (always available globally)

```
- gsap (core)
- ScrollTrigger
- SplitText
- CustomEase
- Draggable
- Observer
- Locomotive Scroll v5
- Barba.js
```

---

## Deployment: GitHub → jsDelivr → Webflow

All JavaScript lives in a **GitHub repository per client** (or one mono-repo for MrBoost). Files are served to Webflow via jsDelivr CDN — no Slater, no manual copy-pasting.

### Repository structure

```
mrboost-webflow-js/
├── projects/
│   ├── client-name/
│   │   ├── global.js        ← site-wide: scroll, nav, GSAP setup, Barba
│   │   ├── home.js          ← homepage-specific animations
│   │   ├── project.js       ← project detail pages
│   │   └── contact.js       ← contact page specific
│   └── another-client/
│       ├── global.js
│       └── home.js
├── shared/
│   ├── barba-base.js        ← reusable Barba setup template
│   ├── scroll-setup.js      ← Locomotive + GSAP ticker setup
│   └── components/
│       ├── marquee.js        ← reusable marquee init
│       ├── parallax.js       ← reusable parallax init
│       ├── modal.js          ← reusable modal init
│       ├── slideshow.js      ← reusable slideshow init
│       └── split-text.js     ← reusable text reveal init
└── CLAUDE.md
```

### How jsDelivr works

jsDelivr serves any file from a public GitHub repo as a CDN URL:

```
https://cdn.jsdelivr.net/gh/{username}/{repo}@{version}/{filepath}
```

**Examples:**

```
# Latest from main branch (auto-updates on push, cached ~24h)
https://cdn.jsdelivr.net/gh/mrboost/webflow-js@latest/projects/client-name/global.js

# Pinned version (permanent cache, use for production)
https://cdn.jsdelivr.net/gh/mrboost/webflow-js@1.0.0/projects/client-name/global.js

# Specific branch
https://cdn.jsdelivr.net/gh/mrboost/webflow-js@main/projects/client-name/global.js
```

### Webflow integration

In Webflow → Project Settings → Custom Code → **Before `</body>` tag**:

```html
<!-- Libraries (CDN) -->
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/gsap.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/ScrollTrigger.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/gsap@3/dist/Draggable.min.js"></script>
<!-- ... other GSAP plugins ... -->
<script src="https://cdn.jsdelivr.net/npm/locomotive-scroll@5/dist/locomotive-scroll.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/@barba/core@2/dist/barba.umd.min.js"></script>

<!-- Project JS (global — loads on every page) -->
<script src="https://cdn.jsdelivr.net/gh/mrboost/webflow-js@latest/projects/client-name/global.js"></script>
```

For **page-specific JS**, add script tags in Webflow's per-page custom code settings (Before `</body>` on that page):

```html
<!-- Homepage only -->
<script src="https://cdn.jsdelivr.net/gh/mrboost/webflow-js@latest/projects/client-name/home.js"></script>
```

### Workflow: edit → push → live

```
1. Edit JS in VS Code (or Claude Code)
2. git add . && git commit -m "update home animations" && git push
3. jsDelivr @latest auto-purges within ~24h (or instant purge via API)
4. Live on client site — no Webflow publish needed
```

**Force instant cache purge** (when you need changes live NOW):

```
https://purge.jsdelivr.net/gh/mrboost/webflow-js@latest/projects/client-name/global.js
```

Just visit that URL in a browser or `curl` it — jsDelivr clears the cache immediately.

### Version pinning for production

During development, use `@latest`. When a site is stable and live:

```bash
git tag 1.0.0
git push --tags
```

Then update the Webflow script URL to `@1.0.0` — this version is permanently cached and will never break even if you push new code.

### Rules for this workflow

- **One `global.js` per project** — contains Locomotive, GSAP setup, Barba, nav, and all shared init functions
- **Page-specific files are optional** — only create them if a page has unique heavy logic
- **Shared components** (`shared/components/`) are copy-paste templates, not imported — remember: no build step
- **Always test locally first** — open the Webflow preview and check console for errors before pushing
- **Tag stable releases** — never leave a live client site on `@latest` long-term

---

## Architecture Pattern

### Init-function pattern

Every feature is a **self-contained init function**. All init functions are called at the bottom of the script.

```js
function initFeatureName() {
  // query DOM
  // set up GSAP / events
  // guard clause if elements don't exist
}

// Bottom of file
initFeatureName();
initAnotherFeature();
```

**Rules:**
- Always start with a DOM guard clause: `if (!element) return;`
- Never assume elements exist — Webflow pages vary
- One function = one feature (parallax, marquee, modal, etc.)
- Functions must be **idempotent** — safe to call multiple times (critical for Barba re-init)

### Data-attribute driven

All behavior is hooked via `data-*` attributes, never classes or IDs. This keeps Webflow visual styling separate from JS logic.

```
data-parallax="trigger"
data-parallax="target"
data-parallax-direction="horizontal"
data-parallax-scrub="0.5"
data-slideshow="wrap"
data-slideshow="slide"
data-accordion-css-init
data-accordion-status="active"
data-split="heading"
data-split-reveal="words"
data-btn-hover
data-highlight-text
data-marquee-scroll-direction-target
data-form-validate
data-modal-name="lightbox"
data-modal-target="lightbox"
```

**Rules:**
- Prefer `data-*` attributes for all JS hooks
- Use `data-*` for configuration too (speeds, directions, breakpoints)
- Parse attribute values with sensible defaults: `parseFloat(attr) || defaultValue`
- Boolean states use attribute values: `data-status="active"` / `data-status="not-active"`

---

## Locomotive Scroll v5 Setup

Always initialize like this:

```js
const locomotiveScroll = new LocomotiveScroll({
  autoStart: false,
  lenisOptions: {
    lerp: 0.1,
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
  }
});
```

### Scroll lock helpers (global)

```js
function lockScroll() {
  locomotiveScroll.stop();
  document.body.style.overflow = "hidden";
}

function unlockScroll() {
  locomotiveScroll.start();
  document.body.style.overflow = "";
}
```

Use `lockScroll()` / `unlockScroll()` for modals, menus, preloaders — never manipulate scroll state directly.

---

## GSAP Conventions

### Plugin registration (once, top of file)

```js
gsap.registerPlugin(ScrollTrigger, Draggable, SplitText, CustomEase);
gsap.ticker.lagSmoothing(0);
gsap.ticker.add(ScrollTrigger.update);
```

### matchMedia for responsive

Always use `gsap.matchMedia()` for responsive animations:

```js
const mm = gsap.matchMedia();
mm.add(
  {
    isMobile: "(max-width:479px)",
    isMobileLandscape: "(max-width:767px)",
    isTablet: "(max-width:991px)",
    isDesktop: "(min-width:992px)"
  },
  (context) => {
    const { isMobile, isTablet } = context.conditions;
    const ctx = gsap.context(() => {
      // animations here
    });
    return () => ctx.revert();
  }
);
```

### SplitText config (shared)

```js
const splitConfig = {
  lines:  { duration: 0.8, stagger: 0.08 },
  words:  { duration: 0.8, stagger: 0.06 },
  chars:  { duration: 0.4, stagger: 0.01 }
};
```

Always use `SplitText.create()` with `autoSplit: true` and `mask: "lines"` for scroll reveals.

### ScrollTrigger defaults

- Use `clamp()` for start/end values: `start: "clamp(top 80%)"`
- Use `once: true` for scroll-reveal animations (no replay)
- Always call `ScrollTrigger.refresh()` after DOM changes or page load

### Easing preferences

- Enter/reveal: `"expo.out"`
- Exit/leave: `"expo.inOut"`
- UI interactions (buttons): `"elastic.out(1.2, 0.4)"`
- Parallax/scrub: `"none"`
- Preloader wipes: `"expo.inOut"`

---

## Barba.js Integration

### Critical rules for Barba

Since all features use init functions, Barba must **re-initialize everything** on each page transition. This is the most important architectural concern.

#### Destroy / cleanup pattern

Every init function that adds event listeners or creates GSAP instances **must support cleanup**. Use this pattern:

```js
function initFeature() {
  const el = document.querySelector('[data-feature]');
  if (!el) return;

  // Cleanup previous instance
  if (el._featureDestroy) {
    el._featureDestroy();
    el._featureDestroy = null;
  }

  // ... setup code ...

  // Store destroy function
  el._featureDestroy = function() {
    // kill ScrollTriggers
    // remove event listeners
    // kill GSAP tweens/timelines
  };
}
```

#### Barba lifecycle

```js
barba.init({
  transitions: [{
    name: 'default',

    leave(data) {
      // Transition-out animation
      // Kill all ScrollTriggers
      // Kill Locomotive Scroll listeners
    },

    enter(data) {
      // Transition-in animation
    },

    afterEnter(data) {
      // RE-INIT everything for the new page
      // Reset scroll position
      // Call all init functions
      // ScrollTrigger.refresh()
    }
  }]
});
```

#### Barba re-init checklist

After every page transition, these must be called:

```js
// Reset scroll
locomotiveScroll.scrollTo(0, { immediate: true, disableLerp: true });
locomotiveScroll.start();

// Kill stale ScrollTriggers
ScrollTrigger.getAll().forEach(st => st.kill());

// Re-init all features
initGlobalParallax();
initMaskTextScrollReveal();
initHighlightText();
initMarqueeScrollDirection();
initDraggables();
initMobileMenuAnimation();
setupDropdownsWithStagger();
initParallaxImageGalleryThumbnails();
initAccordionCSS();
initModalBasic();
initBasicFormValidation();
initPageLoadSplitText();

// Refresh positions
ScrollTrigger.refresh();
```

#### Persistent elements (never re-init on transition)

The **navbar** and any global elements that live outside `[data-barba="container"]` should be initialized **once** and excluded from re-init. Use Barba's `wrapper` vs `container` distinction.

#### Webflow-specific Barba gotchas

- Webflow injects `class="w--current"` on nav links — update these manually in `afterEnter`
- Webflow forms: re-bind validation after transition
- Webflow interactions (IX2): may conflict — prefer GSAP for all animations
- `<script>` tags inside Webflow embeds won't re-execute on Barba transitions — move all JS to the GitHub-hosted global.js

---

## Code Style

### Naming

- Functions: `camelCase`, prefixed with `init` for setup functions — `initFeatureName()`
- Variables: `camelCase`
- Constants: `camelCase` (not UPPER_SNAKE — keep it readable)
- DOM queries: descriptive — `const track = document.querySelector(".review_wrapper")`

### Selectors

- Use `document.querySelectorAll()` and `document.querySelector()` everywhere
- Use `gsap.utils.toArray()` when passing to GSAP
- Scope queries to parent elements when possible: `el.querySelector()`

### Event listeners

- Always use `addEventListener`, never inline handlers
- For delegated events on dynamic content, bind to a parent and use `e.target.closest()`
- Store handler references for cleanup (Barba destroy pattern)

### Error handling

- Guard clauses at function top: `if (!el) return;`
- Never let missing DOM elements throw errors
- Use `console.warn()` for debugging, never `console.log()` in production
- Check array/nodelist length before iterating

### Comments

```js
// ==========================================================
// SECTION NAME
// ==========================================================
```

Use this divider style for major sections. Keep inline comments short and Dutch or English — whatever is clearest.

---

## Common Patterns Reference

### Parallax (data-attribute driven)

Reads from: `data-parallax-direction`, `data-parallax-start`, `data-parallax-end`, `data-parallax-scrub`, `data-parallax-scroll-start`, `data-parallax-scroll-end`, `data-parallax-disable`

### Scroll text reveal

Trigger: `data-split="heading"` with optional `data-split-reveal="lines|words|chars"`

Uses `SplitText.create()` with `mask: "lines"`, `autoSplit: true`. Animation: `yPercent: 110` → `0` with `expo.out`.

### Marquee

Trigger: `data-marquee-scroll-direction-target` with config attributes: `data-marquee-speed`, `data-marquee-direction`, `data-marquee-duplicate`, `data-marquee-scroll-speed`

### Modal system

Uses `data-modal-name`, `data-modal-target`, `data-modal-status`, `data-modal-group-status`, `data-modal-close`. Always `lockScroll()` on open, `unlockScroll()` on close.

### Slideshow / Carousel

Trigger: `data-slideshow="wrap"`. Uses destroy/re-init pattern via `el._slideshowDestroy`. Supports thumbs, arrow navigation (click + hold), and parallax inner slides.

### Button hover

Trigger: `data-btn-hover`. Elastic scale effect on hover/click with GSAP.

### Accordion

Trigger: `data-accordion-css-init` with `data-accordion-toggle` and `data-accordion-status`. Pure CSS height transitions, JS only toggles status attributes.

### Form validation

Trigger: `data-form-validate` with `data-validate` on field wrappers. Includes anti-spam timer check.

---

## What NOT to do

- **Never use jQuery** — everything is vanilla JS
- **Never use `import`/`export`** — no build step, everything is global
- **Never use Webflow IX2 for animations** — use GSAP exclusively
- **Never add classes for JS hooks** — use `data-*` attributes
- **Never hardcode breakpoints** — use `gsap.matchMedia()` with the standard breakpoints
- **Never create animations without cleanup** — everything must be destroyable for Barba
- **Never assume scroll position** — always reset after transitions
- **Never use `window.onload`** — use `document.fonts.ready` for text animations, direct calls for everything else
- **Never inline large scripts in Webflow embeds** — keep everything in the GitHub repo

---

## When I ask you to build something

1. **Match existing patterns** — look at how similar features are already built in my codebase
2. **Use init-function pattern** — wrap everything in an `initFeatureName()` function
3. **Data-attribute driven** — all config and hooks via `data-*` attributes
4. **Include destroy/cleanup** — store a `_destroy` function on the root element
5. **Guard against missing elements** — never throw errors on pages where the feature doesn't exist
6. **Use the shared splitConfig** — don't create custom duration/stagger unless I specifically ask
7. **Keep it minimal** — don't add features I didn't ask for
8. **Barba-safe** — everything must work after a page transition re-init
