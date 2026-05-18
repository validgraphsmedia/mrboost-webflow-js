// MrBoost Homepage — CSS injection
(function(){
  var s = document.createElement("style");
  s.id = "mrboost-home-styles";
  if (document.getElementById("mrboost-home-styles")) return;
  s.textContent = `:root {
  --bg: #131313;
  --bg-soft: #111111;
  --text: #f2f2f2;
  --text-dim: #8a8a8a;
  --cream: #e9e8e3;
  --cream-2: #d9d8d2;
  --yellow: #F8FF88;
  --chip-bg: rgba(255,255,255,0.06);
  --chip-border: rgba(255,255,255,0.10);
  --pill-border: rgba(255,255,255,0.22);
  --display: 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --display-ultra: 'Gotham Ultra', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  --body: 'Helvetica Neue', Helvetica, Arial, sans-serif;
}

* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { background: var(--bg); color: var(--text); font-family: var(--body); font-weight: 500; -webkit-font-smoothing: antialiased; letter-spacing: -0.005em; }
body { position: relative; }
/* Subtle animated grain on the dark background */
body::before {
  content: "";
  position: fixed; inset: -10%;
  pointer-events: none;
  z-index: 1;
  opacity: 0.22;
  mix-blend-mode: overlay;
  background-size: 220px 220px;
  animation: grain 0.7s steps(8) infinite;
  transform: translateZ(0);
  will-change: transform;
  backface-visibility: hidden;
}
@keyframes grain {
  0%   { transform: translate(0, 0); }
  10%  { transform: translate(-3%, -2%); }
  20%  { transform: translate(-5%, 2%); }
  30%  { transform: translate(3%, -4%); }
  40%  { transform: translate(-2%, 5%); }
  50%  { transform: translate(-4%, 1%); }
  60%  { transform: translate(5%, -3%); }
  70%  { transform: translate(-3%, 4%); }
  80%  { transform: translate(2%, -5%); }
  90%  { transform: translate(-1%, 3%); }
  100% { transform: translate(0, 0); }
}
@media (prefers-reduced-motion: reduce) {
  body::before { animation: none; }
}
/* Keep grain above the dark bg but below interactive things */
body > * { position: relative; z-index: 2; }
a { color: inherit; text-decoration: none; }
button { font-family: inherit; cursor: pointer; border: none; background: none; color: inherit; }
img, svg { display: block; max-width: 100%; }

.container { max-width: 1240px; margin: 0 auto; padding: 0 32px; }


/* ============== STORY ROTATOR (header-left) ============== */
.story-badge {
  position: relative;
  width: 50px; height: 50px;
  display: grid; place-items: center;
  flex-shrink: 0;
}
.ring-svg {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  transform: rotate(-90deg);
}
.ring-svg circle {
  fill: none;
  stroke-width: 1.5;
}
.ring-track { stroke: rgba(255,255,255,0.14); }
.ring-progress {
  stroke: var(--cream);
  stroke-linecap: round;
  stroke-dasharray: 149.23;
  stroke-dashoffset: 149.23;
}
.ring-progress.is-running {
  animation: story-ring-fill 4.5s linear forwards;
}
@keyframes story-ring-fill {
  from { stroke-dashoffset: 149.23; }
  to   { stroke-dashoffset: 0; }
}
.story-star { width: 22px; height: 22px; color: var(--cream); position: relative; z-index: 1; }
.story-text {
  position: relative;
  min-width: 130px;
  height: 36px;
  overflow: hidden;
}
.story-line {
  position: absolute; inset: 0;
  display: flex; flex-direction: column; justify-content: center;
  line-height: 1.25;
  opacity: 0;
  transform: translateY(115%);
  filter: blur(3px);
  transition: opacity 0.45s ease, transform 0.55s cubic-bezier(0.7, 0, 0.18, 1), filter 0.45s ease;
  pointer-events: none;
}
.story-line.is-active {
  opacity: 1; transform: translateY(0); filter: none;
}
.story-line.is-leaving {
  opacity: 0; transform: translateY(-115%); filter: blur(3px);
}
.story-line .t1 {
  font-size: 13px; font-weight: 600;
  color: var(--cream);
  letter-spacing: -0.005em;
}
.story-line .t2 {
  font-size: 13px; font-weight: 500;
  color: var(--text-dim);
}
@media (max-width: 720px) {
  .story-text { display: none; }
}

/* ---------- HEADER ---------- */
.header {
  position: sticky; top: 0; z-index: 50;
  padding: 22px 32px;
  display: grid; grid-template-columns: 1fr auto 1fr;
  align-items: center;
  background: linear-gradient(to bottom, rgba(7,7,7,0.95), rgba(7,7,7,0.7) 70%, transparent);
  backdrop-filter: blur(6px);
}
.header-left { display: flex; align-items: center; gap: 12px; }
.star-badge {
  width: 46px; height: 46px; border-radius: 50%;
  border: 1px solid rgba(255,255,255,0.18);
  display: grid; place-items: center;
}
.star-badge svg { width: 22px; height: 22px; }
.header-left-text {
  font-size: 13px; font-weight: 600; line-height: 1.2;
}
.header-left-text .dim { color: var(--text-dim); font-weight: 500; }

.header-center { display: flex; justify-content: center; }
.logo-b {
  width: 48px; height: 56px;
  display: grid; place-items: center;
}
.logo-b img { width: 100%; height: 100%; display: block; }

.header-right { display: flex; justify-content: flex-end; }
.main-nav {
  display: flex; justify-content: flex-end; align-items: center;
  gap: 32px;
}
.main-nav a {
  font-size: 15px; font-weight: 500;
  color: var(--cream);
  transition: opacity 0.2s;
  display: inline-flex; align-items: center; gap: 6px;
  position: relative;
}
.main-nav a:hover { opacity: 0.65; }
.main-nav a.active::after {
  content: ""; position: absolute; left: 0; right: 0; bottom: -6px;
  height: 1.5px; background: var(--cream);
}
.main-nav a .caret { font-size: 9px; margin-top: 2px; }

/* Text-nav fades out smoothly when the hamburger takes over */
.main-nav {
  transition:
    opacity 0.55s cubic-bezier(0.5, 0.5, 0, 1),
    transform 0.7s cubic-bezier(0.5, 0.5, 0, 1),
    filter 0.55s cubic-bezier(0.5, 0.5, 0, 1);
  transform-origin: 100% 50%;
  will-change: opacity, transform, filter;
}
.main-nav a {
  transition:
    opacity 0.5s cubic-bezier(0.5, 0.5, 0, 1),
    transform 0.6s cubic-bezier(0.5, 0.5, 0, 1);
}
.main-nav.is-collapsed {
  opacity: 0;
  pointer-events: none;
  transform: translateY(-6px) scale(0.96);
  filter: blur(2px);
}
.main-nav.is-collapsed a {
  opacity: 0;
  transform: translateY(-4px);
}
/* Stagger the per-link exit so it reads like a sequence, not a block */
.main-nav.is-collapsed a:nth-child(1) { transition-delay: 0ms; }
.main-nav.is-collapsed a:nth-child(2) { transition-delay: 30ms; }
.main-nav.is-collapsed a:nth-child(3) { transition-delay: 60ms; }
.main-nav.is-collapsed a:nth-child(4) { transition-delay: 90ms; }

/* ===================================================
   SCALING HAMBURGER NAVIGATION (Osmo)
   =================================================== */
.navigation {
  z-index: 500;
  pointer-events: none;
  position: fixed;
  inset: 0;
  /* Fade-in / fade-out of the whole hamburger system as you scroll */
  opacity: 0;
  visibility: hidden;
  transition:
    opacity 0.55s cubic-bezier(0.5, 0.5, 0, 1),
    visibility 0s linear 0.55s;
}
.navigation.is-visible {
  opacity: 1;
  visibility: visible;
  transition:
    opacity 0.55s cubic-bezier(0.5, 0.5, 0, 1),
    visibility 0s linear 0s;
}

.navigation__dark-bg {
  transition: all 0.7s cubic-bezier(0.5, 0.5, 0, 1);
  opacity: 0;
  pointer-events: auto;
  visibility: hidden;
  background-color: #000;
  position: absolute;
  inset: 0;
}
[data-navigation-status="active"] .navigation__dark-bg {
  opacity: 0.33;
  visibility: visible;
}

.hamburger-nav {
  border-radius: 1.5em;
  position: absolute;
  top: 1.25em;
  right: 1.5em;
  font-size: 16px;
  /* Smooth scale-in of the toggle when it becomes visible */
  transform: scale(0.65) rotate(0.001deg);
  opacity: 0;
  transition:
    transform 0.7s cubic-bezier(0.5, 0.5, 0, 1),
    opacity 0.55s cubic-bezier(0.5, 0.5, 0, 1);
  transition-delay: 0.05s;
}
.navigation.is-visible .hamburger-nav {
  transform: scale(1) rotate(0.001deg);
  opacity: 1;
}

.hamburger-nav__bg {
  transition: all 0.7s cubic-bezier(0.5, 0.5, 0, 1);
  background-color: var(--cream);
  border-radius: 1.75em;
  width: 3.25em;
  height: 3.25em;
  position: absolute;
  top: 0;
  right: 0;
}
[data-navigation-status="active"] .hamburger-nav__bg {
  width: 100%;
  height: 100%;
}

.hamburger-nav__group {
  transition: all 0.5s cubic-bezier(0.5, 0.5, 0, 1), transform 0.7s cubic-bezier(0.5, 0.5, 0, 1);
  grid-column-gap: 1em;
  grid-row-gap: 1em;
  pointer-events: auto;
  transform-origin: 100% 0;
  flex-flow: column;
  padding: 2.25em 2.5em 2em 2em;
  display: flex;
  position: relative;
  transform: scale(0.15) rotate(0.001deg);
  opacity: 0;
  visibility: hidden;
}
[data-navigation-status="active"] .hamburger-nav__group {
  transform: scale(1) rotate(0.001deg);
  opacity: 1;
  visibility: visible;
}

.hamburger-nav__menu-p {
  opacity: 0.5;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  margin-bottom: 0;
  font-family: var(--mono, ui-monospace, "SF Mono", Menlo, monospace);
  font-size: 0.85em;
  font-weight: 500;
  color: #131313;
}

.hamburger-nav__ul {
  grid-column-gap: 0.375em;
  grid-row-gap: 0.375em;
  flex-flow: column;
  margin: 0;
  padding: 0;
  display: flex;
  position: relative;
}
.hamburger-nav__li {
  margin: 0;
  padding: 0;
  list-style: none;
}

.hamburger-nav__a {
  color: #131313;
  justify-content: space-between;
  align-items: center;
  text-decoration: none;
  display: flex;
  font-family: var(--body);
  font-weight: 500;
}
.hamburger-nav__a[aria-current] .hamburger-nav__p { opacity: 0.33; }

.hamburger-nav__p {
  white-space: nowrap;
  margin: 0;
  padding-right: 1.25em;
  font-size: 1.75em;
  letter-spacing: -0.01em;
}

.hamburger-nav__dot {
  transition: all 0.7s cubic-bezier(0.5, 0.5, 0, 1);
  background-color: currentColor;
  border-radius: 50%;
  flex-shrink: 0;
  width: 0.5em;
  height: 0.5em;
  transform: scale(0) rotate(0.001deg);
  opacity: 0.5;
}
.hamburger-nav__a[aria-current] .hamburger-nav__dot {
  transform: scale(1) rotate(0.001deg);
  opacity: 1;
}
.hamburger-nav:has(.hamburger-nav__a:hover) .hamburger-nav__dot {
  transform: scale(0) rotate(0.001deg);
}
.hamburger-nav .hamburger-nav__a:hover .hamburger-nav__dot {
  transform: scale(1) rotate(0.001deg);
  opacity: 0.25;
}

.hamburger-nav__toggle {
  transition: transform 0.7s cubic-bezier(0.5, 0.5, 0, 1);
  pointer-events: auto;
  cursor: pointer;
  border-radius: 50%;
  justify-content: center;
  align-items: center;
  width: 3.25em;
  height: 3.25em;
  display: flex;
  position: absolute;
  top: 0;
  right: 0;
  transform: translate(0em, 0em) rotate(0.001deg);
}
[data-navigation-status="active"] .hamburger-nav__toggle {
  transform: translate(-1em, 1em) rotate(0.001deg);
}
.hamburger-nav__toggle-bar {
  transition: transform 0.7s cubic-bezier(0.5, 0.5, 0, 1);
  background-color: #131313;
  width: 38%;
  height: 0.125em;
  position: absolute;
  transform: translateY(-0.18em) rotate(0.001deg);
}
.hamburger-nav__toggle:hover .hamburger-nav__toggle-bar {
  transform: translateY(0.18em) rotate(0.001deg);
}
[data-navigation-status="active"] .hamburger-nav__toggle .hamburger-nav__toggle-bar {
  transform: translateY(0) rotate(45deg);
}
.hamburger-nav__toggle .hamburger-nav__toggle-bar:nth-child(2) {
  transform: translateY(0.18em) rotate(0.001deg);
}
.hamburger-nav__toggle:hover .hamburger-nav__toggle-bar:nth-child(2) {
  transform: translateY(-0.18em) rotate(0.001deg);
}
[data-navigation-status="active"] .hamburger-nav__toggle .hamburger-nav__toggle-bar:nth-child(2) {
  transform: translateY(0) rotate(-45deg);
}

@media (max-width: 760px) {
  .hamburger-nav { top: 1em; right: 1em; }
  .hamburger-nav__p { font-size: 1.5em; }
}

/* ===================================================
   START-A-PROJECT FAB + DRAWER
   =================================================== */
.sp-fab {
  position: fixed;
  left: 50%;
  bottom: 28px;
  transform: translate(-50%, 28px) scale(0.92);
  z-index: 60;
  pointer-events: none;
  opacity: 0;
  transition:
    transform 0.7s cubic-bezier(0.5, 0.5, 0, 1),
    opacity 0.55s cubic-bezier(0.5, 0.5, 0, 1);
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 14px 22px 14px 24px;
  border-radius: 999px;
  /* Apple liquid-glass effect */
  -webkit-backdrop-filter: blur(22px) saturate(180%);
  backdrop-filter: blur(22px) saturate(180%);
  background: rgba(20, 20, 20, 0.55);
  border: 1px solid rgba(255, 255, 255, 0.14);
  box-shadow:
    0 18px 48px rgba(0, 0, 0, 0.45),
    inset 0 1px 0 rgba(255, 255, 255, 0.12),
    inset 0 -1px 0 rgba(0, 0, 0, 0.4);
  color: var(--text);
  font-family: var(--body);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.005em;
  cursor: pointer;
  white-space: nowrap;
}
.sp-fab.is-visible {
  opacity: 1;
  pointer-events: auto;
  transform: translate(-50%, 0) scale(1);
}
.sp-fab:hover {
  background: rgba(28, 28, 28, 0.68);
  transform: translate(-50%, -2px) scale(1);
}
.sp-fab__dot-mark {
  display: inline-block;
  width: 16px;
  height: 16px;
  color: var(--cream);
  opacity: 0.9;
}
.sp-fab__dot-mark svg { width: 100%; height: 100%; display: block; }

/* Drawer */
.sp-drawer-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0);
  z-index: 600;
  pointer-events: none;
  transition: background 0.55s cubic-bezier(0.5, 0.5, 0, 1);
}
.sp-drawer-backdrop.is-open {
  background: rgba(0, 0, 0, 0.45);
  pointer-events: auto;
}
.sp-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(640px, 100vw);
  z-index: 700;
  background: #0a0a0a;
  color: var(--text);
  transform: translateX(100%);
  transition: transform 0.7s cubic-bezier(0.5, 0.5, 0, 1);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  overscroll-behavior: contain;
}
.sp-drawer.is-open { transform: translateX(0); }
.sp-drawer__close {
  position: absolute;
  top: 22px;
  right: 22px;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(255, 255, 255, 0.04);
  color: var(--text);
  display: grid;
  place-items: center;
  cursor: pointer;
  z-index: 2;
  transition: background 0.2s;
}
.sp-drawer__close:hover { background: rgba(255, 255, 255, 0.1); }
.sp-drawer__close svg { width: 14px; height: 14px; }
.sp-drawer__inner {
  padding: 56px 48px 48px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.sp-drawer__title {
  font-family: var(--display);
  font-size: clamp(36px, 4.4vw, 56px);
  line-height: 0.98;
  letter-spacing: -0.035em;
  font-weight: 500;
  margin: 0;
  max-width: 12em;
}
.sp-drawer__title .dim { color: rgba(255, 255, 255, 0.42); }
.sp-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.sp-form__row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
}
.sp-field {
  position: relative;
  display: flex;
  flex-direction: column;
}
.sp-field input,
.sp-field textarea {
  width: 100%;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 14px;
  color: var(--text);
  font-family: var(--body);
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.005em;
  padding: 22px 22px;
  outline: none;
  resize: none;
  transition: border-color 0.25s, background 0.25s;
}
.sp-field textarea { min-height: 220px; padding-top: 22px; }
.sp-field input::placeholder,
.sp-field textarea::placeholder {
  color: rgba(255, 255, 255, 0.55);
  font-weight: 500;
}
.sp-field input:focus,
.sp-field textarea:focus {
  border-color: rgba(255, 255, 255, 0.45);
  background: rgba(255, 255, 255, 0.02);
}
.sp-form__eyebrow {
  margin: 12px 0 6px;
  font-family: var(--body);
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--text);
  font-weight: 600;
}
.sp-form__services {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px 28px;
  margin-bottom: 12px;
}
.sp-check {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  font-size: 15px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.72);
  cursor: pointer;
  padding: 6px 0;
  user-select: none;
}
.sp-check input { position: absolute; opacity: 0; pointer-events: none; }
.sp-check__circle {
  width: 18px;
  height: 18px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.32);
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  transition: border-color 0.25s, background 0.25s;
}
.sp-check__circle::after {
  content: "";
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--cream);
  opacity: 0;
  transform: scale(0.4);
  transition: opacity 0.25s, transform 0.25s;
}
.sp-check input:checked + .sp-check__circle::after {
  opacity: 1;
  transform: scale(1);
}
.sp-check input:checked + .sp-check__circle {
  border-color: var(--cream);
}
.sp-check input:checked ~ .sp-check__label { color: var(--text); }
.sp-form__submit {
  align-self: flex-start;
  margin-top: 6px;
  display: inline-flex;
  align-items: center;
  gap: 14px;
  padding: 16px 28px 16px 28px;
  border-radius: 999px;
  background: var(--cream);
  color: #0a0a0a;
  font-family: var(--body);
  font-size: 14px;
  font-weight: 600;
  letter-spacing: -0.005em;
  cursor: pointer;
  transition: background 0.25s, transform 0.25s;
}
.sp-form__submit:hover { background: #fff; transform: translateY(-1px); }
.sp-form__submit .sp-fab__dot-mark { color: #0a0a0a; opacity: 0.9; }

@media (max-width: 600px) {
  .sp-drawer { width: 100vw; }
  .sp-drawer__inner { padding: 56px 22px 32px; }
  .sp-form__row { grid-template-columns: 1fr; }
  .sp-form__services { grid-template-columns: 1fr; }
  .sp-fab { font-size: 14px; padding: 12px 18px 12px 22px; }
}

/* Hide the progressive blur AND the FAB while the footer is visible
   so the user can interact with the footer cleanly. */
.progressive-blur {
  transition: opacity 0.4s cubic-bezier(0.5, 0.5, 0, 1), visibility 0s linear 0s;
}
.progressive-blur.is-hidden {
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.35s cubic-bezier(0.5, 0.5, 0, 1), visibility 0s linear 0.35s;
}
body.is-footer-visible .sp-fab {
  opacity: 0;
  pointer-events: none;
  transform: translate(-50%, 24px) scale(0.95);
}

/* ---------- HERO ---------- */
.hero { padding: 70px 32px 40px; text-align: center; }
.hero h1 {
  font-family: var(--display-ultra);
  font-size: clamp(56px, 9.5vw, 136px);
  line-height: 0.79;
  letter-spacing: -0.027em;
  color: var(--cream);
  text-transform: uppercase;
  font-weight: 900;
}
.hero-sub {
  margin-top: 28px;
  font-size: 15px; color: #cfcfcf;
}
.hero-ctas {
  margin-top: 34px;
  display: flex; justify-content: center; align-items: center; gap: 18px;
  flex-wrap: wrap;
}
.pill-white {
  background: #fff; color: #111;
  padding: 14px 28px; border-radius: 999px;
  font-weight: 600; font-size: 14px;
}
.pill-white:hover { background: #ececec; }

.play-group { display: flex; align-items: center; gap: 12px; }
.play-circle {
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--yellow); color: #111;
  display: grid; place-items: center;
}
.play-circle svg { width: 14px; height: 14px; margin-left: 2px; }
.play-label { font-size: 14px; color: #ddd; }

.hero-image-wrap {
  margin: 70px auto 0;
  max-width: 1080px;
  padding: 0 32px;
  transition: transform 60ms linear;
}
.hero-image {
  position: relative;
  aspect-ratio: 16/9;
  border-radius: 22px;
  overflow: hidden;
  transform: perspective(1600px) rotateX(2deg);
  box-shadow: 0 30px 80px rgba(0,0,0,0.6);
}
.hero-image img {
  width: 100%; height: 100%; object-fit: cover;
}
.hero-image .hero-ph {
  position: absolute; inset: 0;
  background: repeating-linear-gradient(135deg, #1c1c1c 0 14px, #262626 14px 28px);
  display: grid; place-items: center;
  color: #888;
}
.hero-image .hero-ph span {
  font-family: monospace; font-size: 13px; letter-spacing: 0.12em;
  text-transform: uppercase;
  padding: 12px 22px; border: 1px dashed currentColor; border-radius: 999px;
}

/* ---------- HERO BACKGROUND VIDEO (Bunny HLS player) ---------- */
.hero-image .bunny-bg {
  pointer-events: none;
  color: #fff;
  isolation: isolate;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  display: flex;
  position: absolute;
  inset: 0;
  overflow: hidden;
}
.bunny-bg__video {
  object-fit: cover;
  width: 100%;
  height: 100%;
  display: block;
  position: absolute;
  inset: 0;
}
[data-bunny-background-init] :is(.bunny-bg__placeholder, .bunny-bg__loading) {
  transition: opacity 0.3s linear, visibility 0.3s linear;
}
.bunny-bg__placeholder {
  object-fit: cover;
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
}
[data-bunny-background-init][data-player-status="playing"] .bunny-bg__placeholder,
[data-bunny-background-init][data-player-status="paused"] .bunny-bg__placeholder,
[data-bunny-background-init][data-player-activated="true"][data-player-status="ready"] .bunny-bg__placeholder {
  opacity: 0;
  visibility: hidden;
}
.bunny-bg__loading {
  opacity: 0;
  visibility: hidden;
  background-color: rgba(0,0,0,0.33);
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  display: flex;
  position: absolute;
  inset: 0;
}
.bunny-bg__loading-svg { width: 5em; }
[data-bunny-background-init][data-player-status="loading"] .bunny-bg__loading {
  opacity: 1;
  visibility: visible;
}
.bunny-bg__playpause {
  pointer-events: auto;
  justify-content: center;
  align-items: center;
  display: flex;
  position: absolute;
  bottom: 22px;
  right: 22px;
  z-index: 4;
}
.bunny-bg__btn {
  -webkit-backdrop-filter: blur(1em);
  backdrop-filter: blur(1em);
  cursor: pointer;
  background-color: rgba(100,100,100,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 50%;
  justify-content: center;
  align-items: center;
  width: 44px;
  height: 44px;
  padding: 12px;
  display: flex;
  position: relative;
  color: #fff;
  transition: background-color 0.2s;
}
.bunny-bg__btn:hover { background-color: rgba(100,100,100,0.5); }
.bunny-bg__pause-svg { display: none; }
[data-bunny-background-init][data-player-status="playing"] .bunny-bg__play-svg,
[data-bunny-background-init][data-player-status="loading"] .bunny-bg__play-svg { display: none; }
[data-bunny-background-init][data-player-status="playing"] .bunny-bg__pause-svg,
[data-bunny-background-init][data-player-status="loading"] .bunny-bg__pause-svg { display: block; }
.arc-card .arc-ph {
  width: 100%; height: 100%;
  background: repeating-linear-gradient(135deg, #2a2a2a 0 8px, #333 8px 16px);
  display: grid; place-items: center;
  font-family: monospace; font-size: 10px; color: #999;
  letter-spacing: 0.08em; text-transform: uppercase;
  padding: 12px; text-align: center;
}

/* ---------- CLIENTS ---------- */
.clients-section { padding: 120px 32px 40px; text-align: center; }
.clients-chip {
  display: inline-block;
  padding: 12px 22px;
  border-radius: 999px;
  border: 1px solid var(--chip-border);
  background: var(--chip-bg);
  font-size: 13px; color: #cfcfcf;
}
.clients-row {
  margin-top: 48px;
  display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center;
  gap: 40px 28px;
  opacity: 0.75;
}
.client-logo {
  display: inline-flex; align-items: center; justify-content: center;
  height: 32px;
}
.client-logo svg { height: 100%; width: auto; }
.client-logo img { height: 100%; width: auto; object-fit: contain; opacity: 0.75; }

/* ===================================================
   LOGO WALL — Osmo cycle, 1-row variant
   =================================================== */
.logo-wall {
  display: flex;
  justify-content: center;
  width: 100%;
  margin-top: 48px;
  max-width: 1100px;
  margin-left: auto;
  margin-right: auto;
}
.logo-wall__collection { width: 100%; }
.logo-wall__list {
  display: flex;
  flex-flow: row nowrap;
  align-items: center;
}
.logo-wall__item {
  width: calc(100% / 6);
  position: relative;
  overflow: hidden;
}
/* Show only the first 6 logos — the rest sit in the cycle pool */
[data-logo-wall-list] [data-logo-wall-item]:nth-child(n+7) { display: none; }
/* Tablet: 4 in a row */
@media (max-width: 991px) {
  .logo-wall__item { width: 25%; }
  [data-logo-wall-list] [data-logo-wall-item]:nth-child(n+5) { display: none; }
}
/* Mobile: 3 in a row */
@media (max-width: 600px) {
  .logo-wall__item { width: 33.333%; }
  [data-logo-wall-list] [data-logo-wall-item]:nth-child(n+4) { display: none; }
}

.logo-wall__logo {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
.logo-wall__logo-before { padding-top: 50%; }
.logo-wall__logo-target {
  position: absolute;
  inset: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
}
.logo-wall__logo-img {
  max-height: 32px;
  max-width: 70%;
  width: auto;
  height: auto;
  opacity: 0.75;
  display: block;
}

/* ---------- ARC PHOTOS ---------- */
.arc-section { padding: 80px 0 40px; }
.arc-wrap {
  max-width: 1100px; margin: 0 auto;
  position: relative;
  height: 300px;
  perspective: 1200px;
}
.arc-card {
  position: absolute;
  top: 50%; left: 50%;
  width: 150px; height: 220px;
  border-radius: 16px;
  overflow: hidden;
  background: #2a2a2a;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
  transform-origin: center center;
  transition: transform 0.6s ease;
}
.arc-card img {
  width: 100%; height: 100%; object-fit: cover;
}
.built-chip {
  position: absolute;
  top: 46%; left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255,255,255,0.92); color: #111;
  padding: 8px 14px; border-radius: 999px;
  font-size: 13px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 8px;
  box-shadow: 0 6px 20px rgba(0,0,0,0.4);
  z-index: 10;
}
.built-chip .star {
  width: 16px; height: 16px; color: #6a7;
}

.arc-caption {
  max-width: 640px; margin: 50px auto 0;
  text-align: center;
  font-size: 22px; line-height: 1.45;
  color: #efefef;
}

/* ---------- STATS ---------- */
.stats {
  max-width: 1100px; margin: 90px auto 0;
  display: flex; justify-content: center; align-items: flex-start;
  gap: clamp(60px, 10vw, 140px);
  padding: 0 32px;
  text-align: center;
}
.stat-num {
  font-family: var(--display);
  font-size: clamp(40px, 5vw, 60px);
  color: var(--cream);
  letter-spacing: -0.01em;
}
.stat-label {
  margin-top: 12px;
  font-size: 14px; color: var(--text-dim);
}

/* ---------- WORK (light section) ---------- */
.work-section {
  margin-top: 140px;
  background: var(--cream);
  color: #0a0a0a;
  padding: 60px 32px 100px;
  border-radius: 0;
}
.work-grid-new {
  max-width: 1240px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
}
.pf-tile {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 22px;
  overflow: hidden;
  background: var(--tile-bg, #2a2624);
  display: block;
  text-decoration: none;
  color: inherit;
  isolation: isolate;
}
.pf-tile-ph {
  position: absolute;
  inset: 0;
  display: grid;
  place-items: center;
  color: rgba(255,255,255,0.4);
  font-family: monospace;
  font-size: 11px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: var(--tile-bg, #2a2624);
  background-image: repeating-linear-gradient(135deg,
    color-mix(in srgb, var(--tile-bg, #2a2624) 92%, #fff 8%) 0 22px,
    color-mix(in srgb, var(--tile-bg, #2a2624) 88%, #000 12%) 22px 44px);
}
.pf-tile-ph .ph-tag {
  padding: 8px 14px;
  border: 1px dashed currentColor;
  border-radius: 999px;
  background: rgba(0,0,0,0.15);
}
.pf-tile-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transform: scale(1);
  transition: transform 0.7s cubic-bezier(0.4, 0, 0.2, 1);
  will-change: transform;
}
.pf-tile:hover .pf-tile-img,
.pf-tile:focus-visible .pf-tile-img {
  transform: scale(1.06);
}
.pf-tile-tag {
  position: absolute;
  left: 22px;
  bottom: 22px;
  z-index: 3;
  padding: 12px 22px;
  background: rgba(12,12,12,0.94);
  color: var(--cream);
  border-radius: 999px;
  font-size: 15px;
  font-weight: 500;
  letter-spacing: -0.005em;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.pf-tile.is-locked .pf-tile-tag {
  padding: 0;
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
}
.pf-tile.is-locked .pf-tile-tag svg {
  width: 18px;
  height: 18px;
}
.pf-tile-overlay {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  overflow: hidden;
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.45s ease;
  background: linear-gradient(90deg, rgba(0,0,0,0.18), rgba(0,0,0,0.32));
}
.pf-tile:hover .pf-tile-overlay,
.pf-tile:focus-visible .pf-tile-overlay {
  opacity: 1;
}
.pf-marquee {
  width: 100%;
  overflow: hidden;
}
.pf-marquee-track {
  display: flex;
  gap: 0;
  white-space: nowrap;
  width: max-content;
  animation: pf-marquee 32s linear infinite;
}
@keyframes pf-marquee {
  from { transform: translate3d(0, 0, 0); }
  to   { transform: translate3d(-50%, 0, 0); }
}
.pf-marquee-item {
  font-family: var(--display);
  font-weight: 500;
  font-size: clamp(58px, 7.4vw, 112px);
  line-height: 1.15;
  letter-spacing: -0.035em;
  color: rgba(233, 232, 227, 0.82);
  display: inline-flex;
  align-items: center;
  gap: 44px;
  padding-right: 44px;
}
.pf-marquee-star {
  display: inline-block;
  opacity: 0.55;
  font-size: 0.7em;
  line-height: 1;
  transform: translateY(-0.05em);
}
.work-cta {
  display: flex;
  justify-content: center;
  margin-top: 48px;
}
.watch-all-pill {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}
.watch-all-pill .arr {
  display: inline-block;
  transform: translateY(-1px);
  font-size: 14px;
}

.card-chip {
  position: absolute;
  bottom: 16px; left: 50%; transform: translateX(-50%);
  background: rgba(255,255,255,0.95); color: #111;
  padding: 8px 14px; border-radius: 999px;
  font-size: 13px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 8px;
  box-shadow: 0 4px 16px rgba(0,0,0,0.15);
  white-space: nowrap;
}
.card-chip .star { width: 14px; height: 14px; color: #6a7; }

/* Grind logo placeholder (bottom-left) */
.grind-logo {
  font-family: var(--display);
  font-size: 56px; color: #fff;
  font-style: italic;
  letter-spacing: -0.02em;
  transform: skewX(-6deg);
}

/* ---------- SERVICES (dark) ---------- */
.services {
  padding: 140px 32px 80px;
}
.service-row {
  max-width: 1180px; margin: 0 auto;
  display: grid; grid-template-columns: 1fr 1fr;
  gap: 80px; align-items: start;
  padding: 40px 0 80px;
}
.service-row.rev { direction: rtl; }
.service-row.rev > * { direction: ltr; }

/* ---------- WE DOEN VEEL (animated services list) ---------- */
.we-do {
  padding: 80px 32px 60px;
  background: var(--bg);
}
.we-do-inner {
  max-width: 1180px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 60px;
  align-items: center;
  min-height: 560px;
  position: relative;
}
.we-do-inner::before {
  content: "";
  position: absolute;
  top: 8%;
  bottom: 8%;
  left: 50%;
  width: 1px;
  background: rgba(255,255,255,0.18);
}
.we-do-left h3 {
  font-family: var(--display);
  font-size: clamp(38px, 4.8vw, 68px);
  line-height: 0.92;
  letter-spacing: -0.045em;
  color: var(--cream);
  font-weight: 500;
}
.we-do-right {
  position: relative;
  height: 540px;
  overflow: hidden;
  padding-left: 40px;
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
          mask-image: linear-gradient(180deg, transparent 0%, #000 18%, #000 82%, transparent 100%);
}
.we-do-track {
  position: absolute;
  left: 40px;
  right: 0;
  top: 50%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  transform: translateY(0);
  transition: transform 0.7s cubic-bezier(0.6, 0.05, 0.2, 1);
  will-change: transform;
}
.we-do-item {
  font-family: var(--display);
  font-size: clamp(38px, 4.8vw, 68px);
  line-height: 1.12;
  letter-spacing: -0.03em;
  color: #2c2c2c;
  font-weight: 500;
  transition: color 0.55s ease, opacity 0.55s ease, transform 0.55s ease;
  white-space: nowrap;
}
.we-do-item.dim-1 { color: #3a3a3a; }
.we-do-item.dim-2 { color: #4d4d4d; }
.we-do-item.active {
  color: var(--cream);
}

@media (max-width: 900px) {
  .we-do-inner {
    grid-template-columns: 1fr;
    min-height: 0;
    gap: 30px;
  }
  .we-do-inner::before { display: none; }
  .we-do-right {
    height: 380px;
    padding-left: 0;
  }
  .we-do-track { left: 0; }
}

.service-copy h3 {
  font-family: var(--display);
  font-size: clamp(52px, 6.5vw, 82px);
  line-height: 0.9;
  letter-spacing: -0.045em;
  color: var(--cream);
}
.service-copy p {
  margin-top: 26px;
  font-size: 15px; line-height: 1.65; color: #b8b8b8;
  max-width: 380px;
}
.service-actions {
  margin-top: 36px;
  display: flex; gap: 12px; flex-wrap: wrap;
}
.chip-pill {
  padding: 10px 18px;
  border-radius: 999px;
  border: 1px solid var(--chip-border);
  background: var(--chip-bg);
  font-size: 13px; color: #e0e0e0;
  font-weight: 500;
}
.chip-pill:hover { background: rgba(255,255,255,0.1); }

.service-image {
  aspect-ratio: 4/5;
  border-radius: 18px;
  overflow: hidden;
  position: relative;
  background: #1a1a1a;
}
.service-image img {
  width: 100%; height: 100%; object-fit: cover;
}
.service-image .ph {
  width: 100%; height: 100%;
  display: grid; place-items: center;
  color: #666; font-size: 12px; font-family: monospace;
  text-align: center;
}
.service-image.orange .ph {
  background: repeating-linear-gradient(135deg, #7a3a18 0 12px, #8a4320 12px 24px);
  color: #e2b89a;
}
.service-image.blue .ph {
  background: repeating-linear-gradient(135deg, #0e1a2c 0 12px, #13223a 12px 24px);
  color: #556c8a;
}

/* ---------- CAREERS HERO ---------- */
.careers-hero {
  position: relative;
  aspect-ratio: 16/8;
  max-width: 1400px; margin: 40px auto 0;
  border-radius: 18px; overflow: hidden;
  background: #1a1a1a;
}
.careers-hero .bg-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover;
}
.careers-hero .bg-ph {
  position: absolute; inset: 0;
  background:
    radial-gradient(ellipse at 20% 60%, rgba(255,190,100,0.18), transparent 60%),
    repeating-linear-gradient(135deg, #1a1715 0 14px, #221e1a 14px 28px);
}
.careers-hero .overlay {
  position: absolute; inset: 0;
  background: linear-gradient(120deg, rgba(0,0,0,0.65) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.25) 100%);
}
.careers-hero .content {
  position: absolute; inset: 0;
  padding: 5% 6%;
  display: flex; flex-direction: column; justify-content: flex-end;
}
.careers-hero h2 {
  font-family: var(--display);
  font-size: clamp(56px, 8vw, 120px);
  line-height: 0.9; letter-spacing: -0.045em;
  color: var(--cream);
  text-shadow: 0 4px 24px rgba(0,0,0,0.5);
}
.careers-hero .sollic-btn {
  margin-top: 30px;
  align-self: flex-start;
}
.careers-hero .stat-block {
  position: absolute; right: 6%; bottom: 18%;
  max-width: 260px;
}
.careers-hero .stat-block .label {
  font-family: var(--display);
  font-size: 16px; letter-spacing: 0.02em;
  color: var(--cream);
  margin-bottom: 10px;
}
.careers-hero .stat-block p {
  font-size: 14px; line-height: 1.45; color: #cfcfcf;
}

/* ---------- TEAM ---------- */
.team-section {
  max-width: 1240px; margin: 0 auto;
  padding: 100px 32px 80px;
}
.team-section h4 {
  font-size: 15px; font-weight: 600;
  color: var(--cream);
  margin-bottom: 24px;
}
.team-grid {
  display: grid; grid-template-columns: repeat(3, 1fr);
  gap: 20px;
}
.team-card {
  position: relative;
  aspect-ratio: 3/4;
  border-radius: 16px; overflow: hidden;
  background: #1a1a1a;
}
.team-card img {
  width: 100%; height: 100%; object-fit: cover;
}
.team-card .ph {
  width: 100%; height: 100%;
  background: repeating-linear-gradient(135deg, #1a1a1a 0 12px, #222 12px 24px);
}
.team-card .play-badge {
  position: absolute; top: 50%; left: 50%;
  transform: translate(-50%, -50%);
  width: 44px; height: 44px; border-radius: 50%;
  background: rgba(0,0,0,0.55); border: 1px solid rgba(255,255,255,0.3);
  display: grid; place-items: center;
  backdrop-filter: blur(6px);
}
.team-card .play-badge svg { width: 14px; height: 14px; margin-left: 2px; color: #fff; }
.team-card .name-tag {
  position: absolute; bottom: 16px; left: 18px;
  font-size: 13px; font-weight: 600;
  color: #fff;
}

/* ---------- FINAL SECTION (transparent wrapper for footer) ---------- */
.final-section {
  background: transparent;
  color: inherit;
  padding: 0;
  margin-top: 0;
}
.final-hero {
  position: relative;
  max-width: 1400px; margin: 0 auto;
  aspect-ratio: 16/7;
  border-radius: 18px; overflow: hidden;
  background: #1a1a1a;
}
.final-hero .bg-img {
  position: absolute; inset: 0;
  width: 100%; height: 100%; object-fit: cover;
  filter: saturate(0.6) contrast(1.05);
}
.final-hero .bg-overlay {
  position: absolute; inset: 0;
  background: linear-gradient(120deg, rgba(0,0,0,0.55), rgba(0,0,0,0.35));
}
.final-hero .bg-ph {
  position: absolute; inset: 0;
  background:
    linear-gradient(rgba(0,0,0,0.25), rgba(0,0,0,0.4)),
    repeating-linear-gradient(135deg, #1d1d1d 0 14px, #242424 14px 28px);
  filter: saturate(0);
}
.final-hero h2 {
  position: absolute; top: 8%; left: 5%;
  font-family: var(--display);
  font-size: clamp(60px, 8vw, 128px);
  line-height: 0.9; letter-spacing: -0.045em;
  color: var(--cream);
  text-shadow: 0 4px 20px rgba(0,0,0,0.35);
}
.final-hero .yellow-chip {
  position: absolute; left: 50%; top: 42%;
  transform: translateX(-20%);
  background: var(--yellow); color: #111;
  padding: 10px 16px; border-radius: 999px;
  font-size: 14px; font-weight: 600;
  display: inline-flex; align-items: center; gap: 8px;
}
.final-hero .yellow-chip .star { width: 14px; height: 14px; color: #3a6a3a; }
.final-hero .time {
  position: absolute; right: 5%; bottom: 8%;
  font-family: var(--display);
  font-size: clamp(28px, 3.2vw, 46px);
  line-height: 1.0; letter-spacing: 0.01em;
  color: var(--cream);
  text-align: right;
}

/* ---------- FOOTER (clean, consistent) ---------- */
/* ---------- FOOTER (Mr Boost wordmark layout, parallax-ready) ---------- */
.footer-wrap {
  position: relative;
  overflow: hidden;
}
.footer-wrap__dark {
  opacity: 0;
  pointer-events: none;
  background-color: #131313;
  width: 100%;
  height: 100%;
  position: absolute;
  inset: 0;
  z-index: 2;
}
.footer {
  background: var(--cream);
  color: #131313;
  padding: 56px 40px 0;
  display: flex;
  flex-direction: column;
  position: relative;
  z-index: 1;
  font-family: var(--body);
}
.footer-grid {
  display: grid;
  grid-template-columns: 1.6fr 1fr 1fr;
  gap: 40px;
  align-items: start;
  flex: 1;
  padding-bottom: 28px;
}
.footer-col {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.footer-col__eyebrow {
  font-size: 17px;
  font-weight: 500;
  color: rgba(19,19,19,0.42);
  margin: 0 0 20px 0;
  letter-spacing: -0.005em;
}
.footer-contact-stack {
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.footer-contact-link {
  font-family: var(--display);
  font-size: clamp(28px, 3.6vw, 56px);
  line-height: 1.05;
  letter-spacing: -0.035em;
  font-weight: 500;
  color: #131313;
  text-decoration: none;
  position: relative;
  align-self: flex-start;
}
.footer-contact-link::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0.05em;
  height: 2px;
  background: currentColor;
  transform-origin: right;
  transform: scaleX(0);
  transition: transform 0.735s cubic-bezier(0.625, 0.05, 0, 1);
}
.footer-contact-link:hover::after { transform-origin: left; transform: scaleX(1); }
.footer-mark {
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding-top: 6px;
}
.footer-mark__svg {
  width: clamp(56px, 6vw, 92px);
  height: clamp(56px, 6vw, 92px);
  color: var(--yellow);
}
.footer-col__links {
  display: flex;
  flex-direction: column;
  gap: 2px;
}
.footer-col__links a {
  font-size: 17px;
  font-weight: 500;
  color: #131313;
  text-decoration: none;
  line-height: 1.7;
  position: relative;
  align-self: flex-start;
  letter-spacing: -0.005em;
}
.footer-col__links a::after {
  content: "";
  position: absolute;
  left: 0;
  right: 0;
  bottom: 6px;
  height: 1.5px;
  background: currentColor;
  transform-origin: right;
  transform: scaleX(0);
  transition: transform 0.735s cubic-bezier(0.625, 0.05, 0, 1);
}
.footer-col__links a:hover::after {
  transform-origin: left;
  transform: scaleX(1);
}
.footer-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-top: 1px solid rgba(19,19,19,0.18);
  padding: 20px 0 18px;
  font-size: 16px;
  font-weight: 500;
  color: #131313;
}
.footer-meta__copy {
  color: #131313;
}
.footer-meta a.footer-meta__privacy {
  color: #131313;
  text-decoration: none;
  background: rgba(19,19,19,0.06);
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  transition: background 0.25s;
}
.footer-meta a.footer-meta__privacy:hover { background: rgba(19,19,19,0.12); }
.footer-wordmark {
  font-family: var(--display);
  font-weight: 600;
  font-size: clamp(120px, 22vw, 380px);
  line-height: 0.78;
  letter-spacing: -0.05em;
  color: #131313;
  margin: 0;
  padding: 0 0 0;
  white-space: nowrap;
  user-select: none;
  /* Slight overshoot left/right to mimic the screenshot bleed */
  margin-left: -0.04em;
  margin-bottom: -0.04em;
}
@media (max-width: 991px) {
  .footer-grid {
    grid-template-columns: 1fr 1fr;
    gap: 40px 24px;
  }
  .footer-col--contact { grid-column: 1 / -1; }
  .footer-col--pages { grid-column: 1 / 2; }
  .footer-col--socials { grid-column: 2 / 3; }
}
@media (max-width: 600px) {
  .footer { padding: 40px 20px 0; }
  .footer-grid {
    grid-template-columns: 1fr;
    gap: 28px;
    padding-bottom: 22px;
  }
  .footer-col--contact, .footer-col--pages, .footer-col--socials {
    grid-column: 1 / -1;
  }
  .footer-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 14px;
    padding: 18px 0 18px;
  }
  .footer-wordmark { font-size: 32vw; }
}

/* ---------- STAR SVG ---------- */
.star-glyph {
  color: var(--cream);
}

@media (max-width: 900px) {
  .service-row, .team-grid { grid-template-columns: 1fr; gap: 40px; }
  .stats { flex-direction: column; gap: 32px; align-items: center; }
  .work-grid-new { grid-template-columns: 1fr; gap: 18px; }
  .header { grid-template-columns: auto auto auto; }
  .header-left-text { display: none; }
}

/* Progressive blur — fixed to viewport bottom, always visible while scrolling */
.progressive-blur {
  z-index: 40;
  pointer-events: none;
  isolation: isolate;
  contain: paint;
  width: 100%;
  height: 15em;
  transform-style: preserve-3d;
  position: fixed;
  bottom: 0;
  left: 0;
  overflow: hidden;
  transform: translateZ(0);
}
.progressive-blur__layer {
  width: 100%;
  height: 100%;
  position: absolute;
}
.progressive-blur__layer.is--1 {
  -webkit-backdrop-filter: blur(.09375em);
  backdrop-filter: blur(.09375em);
  -webkit-mask: linear-gradient(#0000 50%, #000 62.5% 75%, #0000 87.5%);
  mask: linear-gradient(#0000 50%, #000 62.5% 75%, #0000 87.5%);
}
.progressive-blur__layer.is--2 {
  -webkit-backdrop-filter: blur(.1875em);
  backdrop-filter: blur(.1875em);
  -webkit-mask: linear-gradient(#0000 62.5%, #000 75% 87.5%, #0000 100%);
  mask: linear-gradient(#0000 62.5%, #000 75% 87.5%, #0000 100%);
}
.progressive-blur__layer.is--3 {
  -webkit-backdrop-filter: blur(.375em);
  backdrop-filter: blur(.375em);
  -webkit-mask: linear-gradient(#0000 75%, #000 87.5% 100%);
  mask: linear-gradient(#0000 75%, #000 87.5% 100%);
}
.progressive-blur__layer.is--4 {
  -webkit-backdrop-filter: blur(.75em);
  backdrop-filter: blur(.75em);
  -webkit-mask: linear-gradient(#0000 82%, #000 92% 100%);
  mask: linear-gradient(#0000 82%, #000 92% 100%);
}
.progressive-blur__layer.is--5 {
  -webkit-backdrop-filter: blur(1.5em);
  backdrop-filter: blur(1.5em);
  -webkit-mask: linear-gradient(#0000 88%, #000 100%);
  mask: linear-gradient(#0000 88%, #000 100%);
}

/* ---------- ODOMETER ---------- */
[data-odometer-element] {
  display: inline-flex;
  align-items: center;
  font-variant-numeric: tabular-nums;
}
[data-odometer-part="mask"],
[data-odometer-part="static"] {
  display: inline-block;
  overflow: clip;
  padding: 0.05em;
  margin: -0.05em;
}
[data-odometer-part="roller"] {
  display: block;
  white-space: pre;
  text-align: center;
  will-change: transform;
}
[data-odometer-part="static"] {
  display: inline-block;
}

</style><link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lenis@1.2.3/dist/lenis.css">
</head>
<body>
<div id="root"></div>
`;
  document.head.appendChild(s);
})();
