const { useState, useEffect, useRef } = React;

// Count-up hook — triggers when element enters viewport
const useCountUp = (target, duration = 2000) => {
  const ref = useRef(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting && !started.current) {
            started.current = true;
            const start = performance.now();
            const step = (now) => {
              const p = Math.min(1, (now - start) / duration);
              const eased = 1 - Math.pow(1 - p, 3);
              setValue(Math.round(target * eased));
              if (p < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }
        });
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [target, duration]);

  return [ref, value];
};

// Subtle parallax on scroll — returns ref + translateY value
const useParallax = (strength = 0.08) => {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        if (!ref.current) return;
        const rect = ref.current.getBoundingClientRect();
        const vh = window.innerHeight;
        // center-relative — element center vs viewport center
        const center = rect.top + rect.height / 2;
        const delta = center - vh / 2;
        setOffset(-delta * strength);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [strength]);
  return [ref, offset];
};

// Shared icons & small components

const StarGlyph = ({ size = 20 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M12 2 L13.2 10 L21 10.5 L14.5 13 L17.5 20 L12 15.5 L6.5 20 L9.5 13 L3 10.5 L10.8 10 Z"/>
  </svg>
);

const PlayIcon = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M7 4 L20 12 L7 20 Z"/>
  </svg>
);

const ArrowRight = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 12 H19"/>
    <path d="M13 6 L19 12 L13 18"/>
  </svg>
);

const CopyIcon = ({ size = 14 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="8" y="8" width="12" height="12" rx="2"/>
    <path d="M16 8 V5 a2 2 0 0 0 -2 -2 H6 a2 2 0 0 0 -2 2 V14 a2 2 0 0 0 2 2 H8"/>
  </svg>
);

// "Built for sales winners" chip
const BuiltChip = ({ style, className = "" }) => (
  <span className={`built-chip ${className}`} style={style}>
    <span className="star" style={{color: "#3d7a3d"}}><StarGlyph size={14} /></span>
    Built for sales winners
  </span>
);

// Header
const Header = () => {
  const [navCollapsed, setNavCollapsed] = useState(false);
  useEffect(() => {
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const y = window.scrollY || window.pageYOffset || 0;
        setNavCollapsed(y > 80);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
  <header className="header">
    <div className="header-left">
    <div className="story-badge">
      <svg className="ring-svg" viewBox="0 0 50 50" aria-hidden="true">
        <circle className="ring-track" cx="25" cy="25" r="23.75"/>
        <circle className="ring-progress" cx="25" cy="25" r="23.75"/>
      </svg>
      <svg className="story-star" viewBox="0 0 29.705 29.161" aria-hidden="true">
        <path d="M14.23.591a.6.6,0,0,1,.206-.443.66.66,0,0,1,.832,0,.6.6,0,0,1,.206.443l.508,9.726a.615.615,0,0,0,.127.349.635.635,0,0,0,.625.23.615.615,0,0,0,.323-.183l6.7-7.082a.6.6,0,0,1,.444-.2.661.661,0,0,1,.633.541.6.6,0,0,1-.131.471l-5.9,7.676a.615.615,0,0,0-.13.35.635.635,0,0,0,.332.582.615.615,0,0,0,.368.066l9.625-1.172a.6.6,0,0,1,.472.127.661.661,0,0,1,.142.821.6.6,0,0,1-.4.278L19.784,15.3a.615.615,0,0,0-.325.187.635.635,0,0,0-.115.661.615.615,0,0,0,.242.285l8.152,5.192a.6.6,0,0,1,.284.4.661.661,0,0,1-.411.724.6.6,0,0,1-.487-.04l-8.694-4.366a.615.615,0,0,0-.367-.062.635.635,0,0,0-.509.432.615.615,0,0,0,0,.372l2.894,9.268a.6.6,0,0,1-.039.487.66.66,0,0,1-.781.289.6.6,0,0,1-.347-.344L15.425,19.82a.615.615,0,0,0-.24-.282.635.635,0,0,0-.665,0,.615.615,0,0,0-.24.282l-3.858,8.961a.6.6,0,0,1-.347.344.66.66,0,0,1-.781-.289.6.6,0,0,1-.039-.487l2.894-9.268a.615.615,0,0,0,0-.372.635.635,0,0,0-.509-.432.615.615,0,0,0-.367.062L2.58,22.7a.6.6,0,0,1-.487.04.661.661,0,0,1-.411-.724.6.6,0,0,1,.284-.4l8.152-5.192a.615.615,0,0,0,.242-.285.635.635,0,0,0-.115-.661A.615.615,0,0,0,9.92,15.3L.487,13.166a.6.6,0,0,1-.4-.278.661.661,0,0,1,.142-.821A.6.6,0,0,1,.7,11.94l9.625,1.172a.615.615,0,0,0,.368-.066.635.635,0,0,0,.332-.582.615.615,0,0,0-.13-.35L5,4.438a.6.6,0,0,1-.131-.471A.661.661,0,0,1,5.5,3.427a.6.6,0,0,1,.444.2l6.7,7.082a.615.615,0,0,0,.323.183.635.635,0,0,0,.625-.23.615.615,0,0,0,.127-.349Z" fill="currentColor"/>
      </svg>
    </div>
    <div className="story-text" aria-live="polite">
      <div className="story-line is-active">
        <span className="t1">Web &amp; Branding</span>
        <span className="t2">Experts</span>
      </div>
      <div className="story-line">
        <span className="t1">Foto &amp; Video</span>
        <span className="t2">Productie</span>
      </div>
      <div className="story-line">
        <span className="t1">1.000.000</span>
        <span className="t2">Bereik p/m</span>
      </div>
      <div className="story-line">
        <span className="t1">70.000+</span>
        <span className="t2">Followers</span>
      </div>
      <div className="story-line">
        <span className="t1">11 Years</span>
        <span className="t2">Experience</span>
      </div>
    </div>
  </div>
    <div className="header-center">
      <div className="logo-b">
      </div>
    </div>
    <nav className={`main-nav ${navCollapsed ? 'is-collapsed' : ''}`}>
      <a href="index.html" className="active">Home</a>
      <a href="portfolio.html">Portfolio</a>
      <a href="about.html">About</a>
      <a href="contact.html">Contact</a>
    </nav>
  </header>
  );
};

// Hero
const Hero = () => {
  const [parRef, parOffset] = useParallax(0.06);
  const [growProgress, setGrowProgress] = useState(0);
  useEffect(() => {
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const y = window.scrollY || window.pageYOffset || 0;
        // Reach max growth ~700px into the scroll
        const p = Math.max(0, Math.min(1, y / 700));
        setGrowProgress(p);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Grow from scale 1 (1080px) up to ~1.222 (1320px) via transform — avoids reflow
  const wrapScale = 1 + growProgress * 0.222;
  return (
    <section className="hero">
      <h1>We create<br/>web &amp; brand<br/>experiences</h1>
      <p className="hero-sub">Wij zoeken 90 ambitieuze starters voor Amsterdam en Den Bosch.</p>
      <div className="hero-ctas">
        <button className="pill-white">Bekijk ons werk</button>
        <div className="play-group">
          <span className="play-circle"><PlayIcon size={14}/></span>
          <span className="play-label">So… who is Mr Boost?</span>
        </div>
      </div>
      <div
        className="hero-image-wrap"
        style={{
          transform: `scale(${wrapScale})`,
          transformOrigin: 'center top',
          willChange: 'transform',
        }}
      >
        <div className="hero-image" ref={parRef}>
          <div
            className="bunny-bg"
            data-bunny-background-init=""
            data-player-activated="false"
            data-player-src="https://vz-45716865-4aa.b-cdn.net/725773da-c19e-4af4-b07a-92577ef45ec7/playlist.m3u8"
            data-player-status="idle"
            data-player-lazy="false"
            data-player-autoplay="true"
            style={{ transform: `translateY(${parOffset}px) scale(1.08)` }}
          >
            <video className="bunny-bg__video" preload="auto" width="1920" height="1080" playsInline muted></video>
            <div className="bunny-bg__loading">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" className="bunny-bg__loading-svg" fill="none">
                <path fill="currentColor" d="M73,50c0-12.7-10.3-23-23-23S27,37.3,27,50 M30.9,50c0-10.5,8.5-19.1,19.1-19.1S69.1,39.5,69.1,50"></path>
                <animateTransform attributeName="transform" attributeType="XML" type="rotate" dur="1s" from="0 50 50" to="360 50 50" repeatCount="indefinite"></animateTransform>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// Clients
const Clients = () => {
  useEffect(() => {
    if (typeof gsap === 'undefined') return;
    let cleanups = [];
    const loopDelay = 1.5;
    const duration = 0.9;
    document.querySelectorAll('[data-logo-wall-cycle-init]').forEach((root) => {
      if (root.__cycleInit) return;
      root.__cycleInit = true;
      const list = root.querySelector('[data-logo-wall-list]');
      const items = Array.from(list.querySelectorAll('[data-logo-wall-item]'));
      const shuffleFront = root.getAttribute('data-logo-wall-shuffle') !== 'false';
      const originalTargets = items
        .map((item) => item.querySelector('[data-logo-wall-target]'))
        .filter(Boolean);
      let visibleItems = [];
      let visibleCount = 0;
      let pool = [];
      let pattern = [];
      let patternIndex = 0;
      let tl;
      const isVisible = (el) => window.getComputedStyle(el).display !== 'none';
      const shuffleArray = (arr) => {
        const a = arr.slice();
        for (let i = a.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
      };
      function setup() {
        if (tl) tl.kill();
        visibleItems = items.filter(isVisible);
        visibleCount = visibleItems.length;
        pattern = shuffleArray(Array.from({ length: visibleCount }, (_, i) => i));
        patternIndex = 0;
        items.forEach((item) => {
          item.querySelectorAll('[data-logo-wall-target]').forEach((old) => old.remove());
        });
        pool = originalTargets.map((n) => n.cloneNode(true));
        let front, rest;
        if (shuffleFront) {
          const shuffledAll = shuffleArray(pool);
          front = shuffledAll.slice(0, visibleCount);
          rest = shuffleArray(shuffledAll.slice(visibleCount));
        } else {
          front = pool.slice(0, visibleCount);
          rest = shuffleArray(pool.slice(visibleCount));
        }
        pool = front.concat(rest);
        for (let i = 0; i < visibleCount; i++) {
          const parent =
            visibleItems[i].querySelector('[data-logo-wall-target-parent]') ||
            visibleItems[i];
          parent.appendChild(pool.shift());
        }
        tl = gsap.timeline({ repeat: -1, repeatDelay: loopDelay });
        tl.call(swapNext);
        tl.play();
      }
      function swapNext() {
        const nowCount = items.filter(isVisible).length;
        if (nowCount !== visibleCount) { setup(); return; }
        if (!pool.length) return;
        const idx = pattern[patternIndex % visibleCount];
        patternIndex++;
        const container = visibleItems[idx];
        const parent =
          container.querySelector('[data-logo-wall-target-parent]') ||
          container;
        const existing = parent.querySelectorAll('[data-logo-wall-target]');
        if (existing.length > 1) return;
        const current = parent.querySelector('[data-logo-wall-target]');
        const incoming = pool.shift();
        gsap.set(incoming, { yPercent: 50, autoAlpha: 0 });
        parent.appendChild(incoming);
        if (current) {
          gsap.to(current, {
            yPercent: -50,
            autoAlpha: 0,
            duration,
            ease: 'expo.inOut',
            onComplete: () => {
              current.remove();
              pool.push(current);
            },
          });
        }
        gsap.to(incoming, {
          yPercent: 0,
          autoAlpha: 1,
          duration,
          delay: 0.1,
          ease: 'expo.inOut',
        });
      }
      setup();
      const st = ScrollTrigger.create({
        trigger: root,
        start: 'top bottom',
        end: 'bottom top',
        onEnter:     () => tl && tl.play(),
        onLeave:     () => tl && tl.pause(),
        onEnterBack: () => tl && tl.play(),
        onLeaveBack: () => tl && tl.pause(),
      });
      const onVis = () => (document.hidden ? tl && tl.pause() : tl && tl.play());
      document.addEventListener('visibilitychange', onVis);
      cleanups.push(() => {
        if (tl) tl.kill();
        st && st.kill();
        document.removeEventListener('visibilitychange', onVis);
        root.__cycleInit = false;
      });
    });
    return () => cleanups.forEach((fn) => fn());
  }, []);
  const logos = [
  ];
  return (
    <section className="clients-section">
      <span className="clients-chip">+ nog meer dan 200 andere MKB, corporates en agencies</span>
      <div data-logo-wall-shuffle="true" data-logo-wall-cycle-init="" className="logo-wall">
        <div className="logo-wall__collection">
          <div data-logo-wall-list="" className="logo-wall__list">
            {logos.concat(logos).map((l, i) => (
              <div key={i} data-logo-wall-item="" className="logo-wall__item">
                <div data-logo-wall-target-parent="" className="logo-wall__logo">
                  <div className="logo-wall__logo-before"></div>
                  <div data-logo-wall-target="" className="logo-wall__logo-target">
                    <img src={l.src} alt={l.alt} loading="lazy" className="logo-wall__logo-img" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

// Odometer stat component — renders target text, initNumberOdometer transforms into rollers
const CountStat = ({ target, suffix = "", label, format = (v) => v.toLocaleString("nl-NL") }) => {
  const text = format(target) + suffix;
  return (
    <div>
      <h3 className="stat-num" data-odometer-element data-odometer-duration="2.2">{text}</h3>
      <div className="stat-label">{label}</div>
    </div>
  );
};

// Arc of photo cards
const PhotoArc = () => {
  // 6 cards arranged in an arc
  const cards = [
    { rotate: -22, x: -420, y: 50,  label: "photo 01" },
    { rotate: -13, x: -255, y: 10,  label: "photo 02" },
    { rotate:  -4, x:  -90, y: -10, label: "photo 03" },
    { rotate:   5, x:   80, y: -10, label: "photo 04" },
    { rotate:  14, x:  240, y: 10,  label: "photo 05" },
    { rotate:  23, x:  410, y: 50,  label: "photo 06" },
  ];
  const [parRef, parOffset] = useParallax(0.04);
  return (
    <section className="arc-section">
      <div className="arc-wrap" ref={parRef} style={{ transform: `translateY(${parOffset}px)` }}>
        {cards.map((c, i) => (
          <div
            key={i}
            className="arc-card"
            style={{
              transform: `translate(-50%, -50%) translate(${c.x}px, ${c.y}px) rotate(${c.rotate}deg)`
            }}
          >
            <div className="arc-ph"><span>{c.label}</span></div>
          </div>
        ))}
        <BuiltChip />
      </div>
      <p className="arc-caption">
        MRBOOST® is a global branding and digital design agency building products, services, and eCommerce experiences that turn cultural values into company value.
      </p>
      <div className="stats" data-odometer-group>
        <CountStat target={1070200} label="Maandelijks bereik" />
        <CountStat target={70000} suffix="+" label="Volgers online" />
        <CountStat target={200} suffix="+" label="Bedrijven geboost" />
      </div>
    </section>
  );
};

// Fade-cycling slot — swaps through a list of images every `interval` ms
const FadeSlot = ({ images, interval = 3800, delay = 0, children }) => {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const startT = setTimeout(() => {
      const t = setInterval(() => {
        setIdx((i) => (i + 1) % images.length);
      }, interval);
      return () => clearInterval(t);
    }, delay);
    return () => clearTimeout(startT);
  }, [images.length, interval, delay]);
  return (
    <>
      {images.map((src, i) => (
        <div key={i} className={`slide ${i === idx ? "active" : ""}`}>
          <img src={src} alt="" loading="lazy" />
        </div>
      ))}
      {children}
    </>
  );
};

// Latest work data — keep the 4 newest portfolio items here.
// Order: top-left, top-right, bottom-left, bottom-right.
const LATEST_WORK = [
  { id: 'coming-watch', title: 'Coming soon', img: window.CASE_IMAGES['case-watch'],     locked: true,  accent: '#a8aaad' },
  { id: 'govolt',       title: 'GoVolt',      img: window.CASE_IMAGES['case-govolt'],    locked: false, accent: '#1b2520' },
  { id: 'gloow',        title: 'Gloow',       img: window.CASE_IMAGES['case-gloow'],     locked: false, accent: '#5b3f5a' },
  { id: 'mt',           title: 'Land Rover',  img: window.CASE_IMAGES['case-landrover'], locked: false, accent: '#2a2e33' },
];

const LockIcon = ({ size = 18 }) => (
  <svg viewBox="0 0 24 24" width={size} height={size} fill="currentColor" aria-hidden="true">
    <path d="M17 9V7a5 5 0 0 0-10 0v2H5v13h14V9h-2zm-8-2a3 3 0 1 1 6 0v2H9V7z"/>
  </svg>
);

const PortfolioTile = ({ item }) => {
  const marqueeText = item.locked ? 'Coming soon' : item.title;
  // Repeat enough times for a seamless infinite loop (track is duplicated 2x)
  const reps = 8;
  const sequence = Array.from({ length: reps });
  return (
    <a
      className={`pf-tile ${item.locked ? 'is-locked' : ''}`}
      href={item.locked ? '#' : `portfolio-case.html#${item.id}`}
      onClick={(e) => { if (item.locked) e.preventDefault(); }}
      style={{ '--tile-bg': item.accent }}
      aria-label={item.locked ? `${item.title} — coming soon` : item.title}
    >
      <div className="pf-tile-ph">
        {item.img
          ? <img className="pf-tile-img" src={item.img} alt={item.title} />
          : <span className="ph-tag">{item.title}</span>}
      </div>
      <div className="pf-tile-overlay" aria-hidden="true">
        <div className="pf-marquee">
          <div className="pf-marquee-track">
            {sequence.map((_, i) => (
              <span key={`a-${i}`} className="pf-marquee-item">
                <span>{marqueeText}</span>
                <span className="pf-marquee-star">✦</span>
              </span>
            ))}
            {sequence.map((_, i) => (
              <span key={`b-${i}`} className="pf-marquee-item" aria-hidden="true">
                <span>{marqueeText}</span>
                <span className="pf-marquee-star">✦</span>
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="pf-tile-tag">
        {item.locked ? <LockIcon /> : <span>{item.title}</span>}
      </div>
    </a>
  );
};

// Work section (light)
const Work = () => (
  <section className="work-section">
    <div className="work-grid-new">
      {LATEST_WORK.map((item) => (
        <PortfolioTile key={item.id} item={item} />
      ))}
    </div>
    <div className="work-cta">
      <a className="pill-white watch-all-pill" href="portfolio.html">
        Watch all cases <span className="arr">↗</span>
      </a>
    </div>
  </section>
);

// Services
const Services = () => (
  <section className="services">
    <div className="service-row">
      <div className="service-copy">
        <h3>Maat<br/>werk<br/>brands.</h3>
        <p>MRBOOST® is een high-end branding en digital agency dat merken bouwt die direct opvallen ze vertalen visie en identiteit naar sterke concepten die groeien en waarde creëren online</p>
        <div className="service-actions">
          <button className="chip-pill">Diensten &amp; Service</button>
          <button className="chip-pill">Diensten &amp; Service</button>
        </div>
      </div>
      <div className="service-image orange"><div className="ph"><span>Maatwerk brands</span></div></div>
    </div>

    <div className="service-row rev">
      <div className="service-copy">
        <h3>Names&amp;<br/>Brands</h3>
        <p>MRBOOST® is een high-end branding en digital agency dat merken bouwt die direct opvallen ze vertalen visie en identiteit naar sterke concepten die groeien en waarde creëren online</p>
        <div className="service-actions">
          <button className="chip-pill">Diensten &amp; Service</button>
          <button className="chip-pill">Diensten &amp; Service</button>
        </div>
      </div>
      <div className="service-image blue"><div className="ph"><span>Names & Brands</span></div></div>
    </div>
  </section>
);

// We do a lot — animated vertical list of services
const WeDoALot = () => {
  const services = [
    "Webdesign",
    "Webdevelopment",
    "Webshops",
    "Photography",
    "Videography",
    "Shortform",
    "Branding",
    "Logo design",
    "Naming",
    "Campaigns",
    "Brandbooks",
    "Social media",
  ];
  const [active, setActive] = React.useState(0);
  const trackRef = React.useRef(null);
  const itemRefs = React.useRef([]);

  React.useEffect(() => {
    const id = setInterval(() => {
      setActive((a) => (a + 1) % services.length);
    }, 1400);
    return () => clearInterval(id);
  }, [services.length]);

  React.useEffect(() => {
    const track = trackRef.current;
    const el = itemRefs.current[active];
    if (!track || !el) return;
    // Position the active item at the vertical center of the track wrapper
    const offset = el.offsetTop + el.offsetHeight / 2;
    track.style.transform = `translateY(${-offset}px)`;
  }, [active]);

  return (
    <section className="we-do">
      <div className="we-do-inner">
        <div className="we-do-left">
          <h3>We Build<br/>A Lot:</h3>
        </div>
        <div className="we-do-right">
          <div className="we-do-track" ref={trackRef}>
            {services.map((s, i) => {
              const dist = Math.abs(i - active);
              let cls = "we-do-item";
              if (i === active) cls += " active";
              else if (dist === 1) cls += " dim-1";
              else if (dist === 2) cls += " dim-2";
              return (
                <div
                  key={s}
                  ref={(el) => (itemRefs.current[i] = el)}
                  className={cls}
                >
                  {s}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

// Careers hero + team
const Careers = () => {
  const teamPhotos = ["", "", ""];
  return (
    <>
      <section className="careers-hero">
        <div className="bg-ph" />
        <div className="overlay"/>
        <div className="content">
          <h2>Not a<br/>average<br/>brand.</h2>
          <button className="pill-white sollic-btn">Solliciteer nu</button>
        </div>
        <div className="stat-block">
          <div className="label">11 YEAR EXPERIENCE</div>
          <p>Community die ook buiten werk bestaat. Dit zijn je collega's en je vrienden</p>
        </div>
      </section>

      <section className="team-section">
        <h4>Maak een website voor</h4>
        <div className="team-grid">
          {[
            { name: "Floris (5J Sales Consultant)", src: teamPhotos[0], play: true },
            { name: "Remco (2J Sales Consultant)",  src: teamPhotos[1], play: false },
            { name: "Anne-Fleur (5J Sales Consultant)", src: teamPhotos[2], play: false },
          ].map((m, i) => (
            <div key={i} className="team-card">
              <div className="ph"><span style={{padding:"6px 12px",border:"1px dashed currentColor",borderRadius:"999px",fontFamily:"monospace",fontSize:"10px",letterSpacing:"0.08em",textTransform:"uppercase"}}>team photo</span></div>
              {m.play && (
                <div className="play-badge"><PlayIcon size={14}/></div>
              )}
              <div className="name-tag">{m.name}</div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
};

// Final + Footer
const FinalAndFooter = () => {
  useEffect(() => {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;
    const triggers = [];
    document.querySelectorAll('[data-footer-parallax]').forEach((el) => {
      const inner = el.querySelector('[data-footer-parallax-inner]');
      const dark = el.querySelector('[data-footer-parallax-dark]');
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: el,
          start: 'clamp(top bottom)',
          end: 'clamp(top top)',
          scrub: true,
        },
      });
      if (inner) tl.from(inner, { yPercent: -25, ease: 'linear' });
      if (dark) tl.from(dark, { opacity: 0.5, ease: 'linear' }, '<');
      triggers.push(tl);
    });
    return () => {
      triggers.forEach((tl) => {
        if (tl.scrollTrigger) tl.scrollTrigger.kill();
        tl.kill();
      });
    };
  }, []);
  return (
  <section className="final-section">
    <div data-footer-parallax="" className="footer-wrap">
      <footer data-footer-parallax-inner="" className="footer" data-screen-label="99 Footer">
        <div className="footer-grid">
          <div className="footer-col footer-col--contact">
            <p className="footer-col__eyebrow">Contact</p>
            <div className="footer-contact-stack">
              <a className="footer-contact-link" href="mailto:mail@mrboost.nl">mail@mrboost.nl</a>
              <a className="footer-contact-link" href="tel:+31637344570">06 37 34 45 70</a>
            </div>
          </div>

          <div className="footer-col footer-col--pages">
            <p className="footer-col__eyebrow">Pagina&apos;s</p>
            <div className="footer-col__links">
              <a href="index.html">Home</a>
              <a href="portfolio.html">Cases</a>
              <a href="about.html">Over ons</a>
              <a href="contact.html">Contact</a>
            </div>
          </div>

          <div className="footer-col footer-col--socials">
            <p className="footer-col__eyebrow">Socials</p>
            <div className="footer-col__links">
              <a href="#">Instagram</a>
              <a href="#">LinkedIn</a>
              <a href="#">Behance</a>
            </div>
          </div>
        </div>

        <div className="footer-meta">
          <span className="footer-meta__copy">© 2026 Mr Boost</span>
          <a href="#" className="footer-meta__privacy">Privacy Policy</a>
        </div>

        <div className="footer-wordmark" aria-hidden="true">Mr Boost</div>
      </footer>
      <div data-footer-parallax-dark="" className="footer-wrap__dark"></div>
    </div>
  </section>
  );
};

// Inline MR BOOST logo (from uploaded SVG, dark variant)
const MrBoostLogo = () => (
  <svg viewBox="0 0 721.842 343.735" height="38" width="auto" fill="currentColor" aria-label="MR BOOST">
    <path d="M115.719,390.207c-4.326-2.236-9.963-3.645-16.816-4.229-6.9-.583-15.747.049-26.245,1.9L12.636,398.42,0,539.85l73.193-12.831c11.664-2.041,21.53-4.86,29.355-8.457,7.776-3.548,13.948-7.631,18.371-12.248a34.444,34.444,0,0,0,8.8-14.775,36.981,36.981,0,0,0,.729-16.33c-1.166-6.658-4.131-11.907-8.8-15.6a30.954,30.954,0,0,0-16.962-6.415l-6.027-.486,5.492-2.479c9.866-4.472,16.962-10.352,21.093-17.545a33.166,33.166,0,0,0,4.131-22.794,31.863,31.863,0,0,0-4.277-11.276A22.481,22.481,0,0,0,115.719,390.207ZM82.67,488.818c-2.965,3.013-7.533,5.054-13.463,6.124l-24.3,4.277,2.236-24.738,21.141-3.694c10.838-1.9,16.962.583,18.128,7.387C87.045,482.063,85.83,485.659,82.67,488.818Zm3.548-51.128c-2.624,3.013-7,5.055-13.365,6.172l-23.329,4.082,2.041-23.475,20.364-3.6c5.3-.924,9.234-.924,11.956.048a8.379,8.379,0,0,1,5.492,6.852C89.961,431.226,88.94,434.58,86.218,437.69Z" transform="translate(0 -196.115)"/>
    <path d="M413.551,342.543a65.881,65.881,0,0,0-23.474-9.186,76.871,76.871,0,0,0-28.091.049,79.112,79.112,0,0,0-30.522,12,81.7,81.7,0,0,0-22.21,21.967,84.516,84.516,0,0,0-12.3,28.432,77.316,77.316,0,0,0-.826,31.153,60.647,60.647,0,0,0,9.088,23.183,58.063,58.063,0,0,0,17.156,16.913,65.9,65.9,0,0,0,23.475,9.185,76.87,76.87,0,0,0,28.091-.048,79.134,79.134,0,0,0,30.521-12.005,81.705,81.705,0,0,0,22.211-21.968,84.489,84.489,0,0,0,12.3-28.432,77.31,77.31,0,0,0,.827-31.153,59.954,59.954,0,0,0-9.137-23.183A58.488,58.488,0,0,0,413.551,342.543Zm-16.33,65.806a40.914,40.914,0,0,1-4.569,13.268,36.428,36.428,0,0,1-8.894,10.6,28.258,28.258,0,0,1-13.268,5.88,31.02,31.02,0,0,1-12-.048,23.448,23.448,0,0,1-9.478-4.471,26.419,26.419,0,0,1-6.658-7.922,32.874,32.874,0,0,1-3.645-10.45,41.961,41.961,0,0,1,0-13.948,39.807,39.807,0,0,1,4.568-13.268,35.812,35.812,0,0,1,8.894-10.594,28.245,28.245,0,0,1,13.268-5.881,31.55,31.55,0,0,1,11.907.048,23.687,23.687,0,0,1,9.623,4.422,26.444,26.444,0,0,1,6.658,7.922,32.9,32.9,0,0,1,3.645,10.449A43.632,43.632,0,0,1,397.221,408.349Z" transform="translate(-149.898 -168.526)"/>
    <path d="M753.607,302.956a58.056,58.056,0,0,0-17.156-16.914,66.25,66.25,0,0,0-23.475-9.186,76.877,76.877,0,0,0-28.091.049,79.129,79.129,0,0,0-30.521,12,81.69,81.69,0,0,0-22.211,21.968,84.51,84.51,0,0,0-12.3,28.432,77.34,77.34,0,0,0-.827,31.153,60.667,60.667,0,0,0,9.089,23.183,58.073,58.073,0,0,0,17.156,16.913,65.892,65.892,0,0,0,23.474,9.186,76.851,76.851,0,0,0,28.092-.048,79.128,79.128,0,0,0,30.522-12,81,81,0,0,0,22.21-21.967,84.486,84.486,0,0,0,12.3-28.432,77.326,77.326,0,0,0,.826-31.153A60.951,60.951,0,0,0,753.607,302.956ZM720.12,351.848h0a40.889,40.889,0,0,1-4.568,13.268,36.448,36.448,0,0,1-8.893,10.6,28.263,28.263,0,0,1-13.268,5.88,31.018,31.018,0,0,1-12-.049,23.434,23.434,0,0,1-9.477-4.471,26.42,26.42,0,0,1-6.659-7.922A32.9,32.9,0,0,1,661.6,358.7a42.013,42.013,0,0,1,0-13.949,39.826,39.826,0,0,1,4.569-13.268,35.8,35.8,0,0,1,8.894-10.6,28.253,28.253,0,0,1,13.269-5.88,31.542,31.542,0,0,1,11.906.048,23.681,23.681,0,0,1,9.623,4.423,26.427,26.427,0,0,1,6.659,7.922,32.891,32.891,0,0,1,3.645,10.449A43.638,43.638,0,0,1,720.12,351.848Z" transform="translate(-314.01 -140.171)"/>
    <path d="M1036.622,284.871a52.015,52.015,0,0,0-13.172-5.881c-5.054-1.507-10.789-2.867-17.058-4.082-5.006-.875-9.088-1.653-12.2-2.236-3.111-.632-5.588-1.215-7.337-1.75a9.766,9.766,0,0,1-4.181-2.09,6.148,6.148,0,0,1-1.7-3.4,6,6,0,0,1,2.673-6.269h0a19.644,19.644,0,0,1,7.728-2.819,56.294,56.294,0,0,1,22.939.778,84.7,84.7,0,0,1,19.3,7.1L1053,230.681a84.421,84.421,0,0,0-27.9-9.478,105.492,105.492,0,0,0-34.9.486,79.811,79.811,0,0,0-24.495,8.165,61.413,61.413,0,0,0-17.3,13.462,45.569,45.569,0,0,0-9.525,16.913,40.712,40.712,0,0,0-1.118,18.906,34.77,34.77,0,0,0,4.375,12.345,28.607,28.607,0,0,0,8.262,8.505,47.574,47.574,0,0,0,12.733,5.929,154.264,154.264,0,0,0,17.836,4.229c5.347.972,9.671,1.847,12.928,2.527,3.353.729,5.832,1.409,7.63,1.992a8.622,8.622,0,0,1,4.228,2.527,7.673,7.673,0,0,1,1.508,3.451,6.665,6.665,0,0,1-2.528,6.512,16.368,16.368,0,0,1-7.776,3.208,64.534,64.534,0,0,1-24.3-.729,88.076,88.076,0,0,1-25.37-10.061L927.9,353.107a96.335,96.335,0,0,0,31.4,12,103.62,103.62,0,0,0,38.735.146,84.276,84.276,0,0,0,25.32-8.311,59.206,59.206,0,0,0,17.351-13.56,43.751,43.751,0,0,0,9.964-36.791,33.367,33.367,0,0,0-4.86-12.831A32.069,32.069,0,0,0,1036.622,284.871Z" transform="translate(-471.791 -111.877)"/>
    <path d="M1212.055,175.073l-3.355,37.665,40.678-7.1-9.328,103.764,43.01-7.533,9.283-103.763,40.679-7.1,3.354-37.714Z" transform="translate(-614.534 -77.928)"/>
    <path d="M12.149,44.616,85.633,31.735l73-12.733L267.158,0,255.009,136.809,181.525,149.69l-73,12.781L0,181.477Zm38.831,17.2-7.723,86.413,25.658-4.469L73,97.735l17.494,29.6,23.767-37.28-4.134,46.463,26.15-4.565,7.728-86.413-29.26,5.1L93.265,85.925,77.47,57.2ZM187.358,38l-32.222,5.641-7.728,86.409L173.7,125.44l2.283-25.274,8.359-1.459,13.609,22.456,28.332-5.005-16.427-25.71.924-.488A39.928,39.928,0,0,0,220.4,83.3a28.38,28.38,0,0,0,5.881-7.876,25.5,25.5,0,0,0,2.627-8.8,33.813,33.813,0,0,0-.244-9.383,29.535,29.535,0,0,0-3.158-8.991,20.655,20.655,0,0,0-6.173-6.8,27.914,27.914,0,0,0-12.541-4.421,45.692,45.692,0,0,0-5.857-.353A78.693,78.693,0,0,0,187.358,38ZM179.29,61.77l10.738-1.895c4.278-.727,7.34-.388,9.479,1.12a7.206,7.206,0,0,1,2.962,4.809,9.579,9.579,0,0,1-2.67,8.264c-2.235,2.479-5.833,4.13-10.79,5.005l-11.47,1.991Z" transform="translate(13.949 0)"/>
  </svg>
);

Object.assign(window, {
  StarGlyph, PlayIcon, ArrowRight, CopyIcon, BuiltChip, LockIcon, PortfolioTile,
  Header, Hero, Clients, PhotoArc, Work, Services, WeDoALot, Careers, FinalAndFooter, MrBoostLogo,
});


// Small 4-dot ornamental mark (matches the Mr Boost dot motif used on buttons)
const DotMark = () => (
  <svg viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <circle cx="8" cy="2" r="1.4" fill="currentColor" />
    <circle cx="14" cy="8" r="1.4" fill="currentColor" />
    <circle cx="8" cy="14" r="1.4" fill="currentColor" />
    <circle cx="2" cy="8" r="1.4" fill="currentColor" />
  </svg>
);

// Floating "Start a project" CTA + slide-in form drawer
const StartProjectFAB = () => {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [services, setServices] = useState({});
  // Show after scrolling past ~80px (same threshold as hamburger nav)
  useEffect(() => {
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        setScrolled((window.scrollY || 0) > 80);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  // Hide both the FAB and the progressive blur while the footer is in view
  useEffect(() => {
    const blur = document.querySelector('.progressive-blur');
    const footer = document.querySelector('[data-footer-parallax]') ||
                   document.querySelector('.footer');
    if (!footer) return;
    const io = new IntersectionObserver((entries) => {
      const inView = entries.some((e) => e.isIntersecting);
      document.body.classList.toggle('is-footer-visible', inView);
      if (blur) blur.classList.toggle('is-hidden', inView);
    }, { threshold: 0.05 });
    io.observe(footer);
    return () => {
      io.disconnect();
      document.body.classList.remove('is-footer-visible');
      if (blur) blur.classList.remove('is-hidden');
    };
  }, []);
  // ESC closes the drawer
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', onKey);
    // lock scroll while open (both native + Lenis)
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (window.__lenis && typeof window.__lenis.stop === 'function') window.__lenis.stop();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
      if (window.__lenis && typeof window.__lenis.start === 'function') window.__lenis.start();
    };
  }, [open]);
  const toggleService = (key) => {
    setServices((s) => ({ ...s, [key]: !s[key] }));
  };
  const SERVICES = [
    'Webdesign',
    'E-commerce',
    'Branding',
    'Logo design',
    'Photography',
    'Videography',
    'Shortform',
    'Campagnes',
  ];
  return ReactDOM.createPortal((
    <>
      <button
        type="button"
        className={`sp-fab ${scrolled && !open ? 'is-visible' : ''}`}
        onClick={() => setOpen(true)}
        aria-label="Start een project"
      >
        Start a project
        <span className="sp-fab__dot-mark"><DotMark /></span>
      </button>

      <div
        className={`sp-drawer-backdrop ${open ? 'is-open' : ''}`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      ></div>

      <aside
        className={`sp-drawer ${open ? 'is-open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Start een project"
        aria-hidden={!open}
        data-lenis-prevent=""
      >
        <button
          type="button"
          className="sp-drawer__close"
          onClick={() => setOpen(false)}
          aria-label="Sluit formulier"
        >
          <svg viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M1 1L13 13M13 1L1 13" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
          </svg>
        </button>
        <div className="sp-drawer__inner">
          <h2 className="sp-drawer__title">
            Klaar om te <span className="dim">beginnen?</span>
          </h2>

          <form
            className="sp-form"
            onSubmit={(e) => { e.preventDefault(); setOpen(false); }}
          >
            <div className="sp-form__row">
              <div className="sp-field">
                <input type="text" required placeholder="Jouw naam *" name="name" />
              </div>
              <div className="sp-field">
                <input type="email" required placeholder="E-mail *" name="email" />
              </div>
            </div>
            <div className="sp-field">
              <input type="tel" placeholder="Telefoon (optioneel)" name="phone" />
            </div>
            <div className="sp-field">
              <textarea required placeholder="Vertel ons over je project *" name="message"></textarea>
            </div>

            <p className="sp-form__eyebrow">Ik ben geïnteresseerd in</p>
            <div className="sp-form__services">
              {SERVICES.map((s) => (
                <label key={s} className="sp-check">
                  <input
                    type="checkbox"
                    checked={!!services[s]}
                    onChange={() => toggleService(s)}
                  />
                  <span className="sp-check__circle"></span>
                  <span className="sp-check__label">{s}</span>
                </label>
              ))}
            </div>

            <button type="submit" className="sp-form__submit">
              Verstuur bericht
              <span className="sp-fab__dot-mark"><DotMark /></span>
            </button>
          </form>
        </div>
      </aside>
    </>
  ), document.body);
};

// Scaling Hamburger Navigation (Osmo) — fades in once the user scrolls past the hero text-nav
const HamburgerNav = () => {
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState("not-active");
  useEffect(() => {
    let raf = null;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = null;
        const y = window.scrollY || window.pageYOffset || 0;
        setVisible(y > 80);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && status === "active") setStatus("not-active");
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [status]);
  // When the toggle hides itself, also close any open panel
  useEffect(() => { if (!visible) setStatus("not-active"); }, [visible]);
  const toggle = () => setStatus((s) => (s === "active" ? "not-active" : "active"));
  const close = () => setStatus("not-active");
  return (
    <nav
      data-navigation-status={status}
      className={`navigation ${visible ? 'is-visible' : ''}`}
      aria-label="Hoofdmenu"
    >
      <div data-navigation-toggle="close" className="navigation__dark-bg" onClick={close}></div>
      <div className="hamburger-nav">
        <div className="hamburger-nav__bg"></div>
        <div className="hamburger-nav__group">
          <p className="hamburger-nav__menu-p">Menu</p>
          <ul className="hamburger-nav__ul">
            <div className="hamburger-nav__li">
              <a href="index.html" aria-current="page" className="hamburger-nav__a" onClick={close}>
                <p className="hamburger-nav__p">Home</p>
                <div className="hamburger-nav__dot"></div>
              </a>
            </div>
            <div className="hamburger-nav__li">
              <a href="portfolio.html" className="hamburger-nav__a" onClick={close}>
                <p className="hamburger-nav__p">Portfolio</p>
                <div className="hamburger-nav__dot"></div>
              </a>
            </div>
            <div className="hamburger-nav__li">
              <a href="about.html" className="hamburger-nav__a" onClick={close}>
                <p className="hamburger-nav__p">About</p>
                <div className="hamburger-nav__dot"></div>
              </a>
            </div>
            <div className="hamburger-nav__li">
              <a href="contact.html" className="hamburger-nav__a" onClick={close}>
                <p className="hamburger-nav__p">Contact</p>
                <div className="hamburger-nav__dot"></div>
              </a>
            </div>
          </ul>
        </div>
        <div
          data-navigation-toggle="toggle"
          className="hamburger-nav__toggle"
          onClick={toggle}
          role="button"
          tabIndex={0}
          aria-label={status === "active" ? "Sluit menu" : "Open menu"}
          aria-expanded={status === "active"}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } }}
        >
          <div className="hamburger-nav__toggle-bar"></div>
          <div className="hamburger-nav__toggle-bar"></div>
        </div>
      </div>
    </nav>
  );
};


const App = () => (
  <>
    <Header />
    <Hero />
    <Clients />
    <PhotoArc />
    <Work />
    <Services />
    <WeDoALot />
    <Careers />
    <FinalAndFooter />
    <HamburgerNav />
    <StartProjectFAB />
  </>
);

ReactDOM.createRoot(document.getElementById('root')).render(<App />);


