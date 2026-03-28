// ==========================================================
// VALIDGRAPHS — global.js
// ==========================================================

if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}

let pageID;

// ==========================================================
// LENIS SCROLL
// ==========================================================

let lenis;

function initializeLenis() {
    if (lenis && typeof lenis.destroy === 'function') {
        lenis.stop();
        lenis.destroy();
    }

    lenis = new Lenis({
        duration: 1.2,
        easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
        smoothTouch: false,
        touchMultiplier: 2,
        infinite: false
    });

    lenis.on('scroll', () => requestAnimationFrame(() => ScrollTrigger.update()));

    gsap.ticker.lagSmoothing(0);

    gsap.ticker.add((time) => {
        lenis.raf(time * 1000);
    });
}

// ==========================================================
// WEBFLOW REINIT
// ==========================================================

function reinitializeWebflow(container) {
    if (window.Webflow && Webflow.require) {
        Webflow.require("ix2").init();
    }

    const $newContainer = $(container);

    if ($newContainer.find(".swiper.is-team").length) {
        new Swiper(".swiper.is-team", {
            loop: false,
            slidesPerView: 1,
            spaceBetween: 16,
            navigation: {
                nextEl: ".swiper-btn-next",
                prevEl: ".swiper-btn-prev",
            },
            breakpoints: {
                480: {
                    slidesPerView: 2.35,
                },
            },
        });
    }
}

// ==========================================================
// PRELOADER
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(() => {
        if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
            const textElement = document.querySelector(".preloader-text");
            if (!textElement) return;

            const splitText = new SplitType(textElement, { type: "words" });

            splitText.words.forEach((word) => {
                const wrapper = document.createElement("div");
                wrapper.style.overflow = "hidden";
                wrapper.style.display = "inline-block";
                word.parentNode.insertBefore(wrapper, word);
                wrapper.appendChild(word);
            });

            const tlText = gsap.timeline({ delay: 0.5 });
            const tlBg = gsap.timeline({ delay: 0.5 });
            const tlTextWrap = gsap.timeline({ delay: 0.4 });

            tlTextWrap.to(".text-wrap", { opacity: 1, ease: "power3.out" });

            tlText
                .from(splitText.words, {
                    y: "100%",
                    opacity: 0,
                    duration: 0.8,
                    stagger: 0.1,
                    ease: "power3.out"
                })
                .to(splitText.words, {
                    y: "-100%",
                    opacity: 0,
                    duration: 0.8,
                    ease: "power3.in",
                    stagger: 0.1,
                    delay: 0.2
                })
                .to(".preloader", {
                    y: "-100%",
                    duration: 1.25,
                    ease: "power4.inOut"
                }, "-=0.3")
                .call(() => {
                    const container = document.querySelector(".main-content");
                    if (container) PreloadAnimation(container);
                }, null, "-=1.2")
                .set(".preloader", { display: "none" });

            tlBg
                .from(".preloader-bg", { opacity: 0, duration: 0.6, ease: "power2.out" })
                .to(".preloader-bg", { opacity: 0.2, duration: 1.1, ease: "power2.out" })
                .to(".preloader-bg", { opacity: 0, duration: 0.6, ease: "power2.in" });

            const PreloadAnimation = (container) => {
                gsap.from(container.children, {
                    delay: 0.7,
                    opacity: 0,
                    scale: 0.98,
                    y: 10,
                    duration: 0.5,
                    ease: "power4.out",
                    stagger: 0.1,
                });
            };
        }
    }, 250);
});

// ==========================================================
// IMAGE FOLLOWER
// ==========================================================

function initializeImageFollow() {
    if (window.innerWidth < 768) return;

    const textElements = document.querySelectorAll('.achterhoek');
    const image = document.querySelector('.image-follow');
    if (!textElements.length || !image) return;

    let lastX = 0;
    let targetX = 0, targetY = 0;
    let currentX = 0, currentY = 0;
    let isVisible = false;
    let animationFrame;

    function smoothFollow() {
        if (!isVisible) return;
        currentX += (targetX - currentX) * 0.1;
        currentY += (targetY - currentY) * 0.1;
        const skewX = (currentX - lastX) * 1.5;
        lastX = currentX;
        gsap.set(image, { x: currentX, y: currentY, skewX: skewX });
        animationFrame = requestAnimationFrame(smoothFollow);
    }

    document.addEventListener('mousemove', (e) => {
        targetX = e.clientX;
        targetY = e.clientY;
    }, { passive: true });

    textElements.forEach(text => {
        text.addEventListener('mouseenter', () => {
            isVisible = true;
            gsap.to(image, { scale: 1, opacity: 1, duration: 0.5, ease: "power3.out" });
            if (!animationFrame) smoothFollow();
        });

        text.addEventListener('mouseleave', () => {
            isVisible = false;
            gsap.to(image, { scale: 0, opacity: 0, duration: 0.5, ease: "power3.out" });
            cancelAnimationFrame(animationFrame);
            animationFrame = null;
        });
    });
}

// ==========================================================
// MARQUEE
// ==========================================================

function initMarqueeWithLenis() {
    const marqueeContent = document.querySelector(".marquee-content-container");
    if (!marqueeContent) return;

    const marqueeTl = gsap.timeline({
        repeat: -1,
        paused: false,
        defaults: { ease: "none" }
    });

    marqueeTl.to(".marquee-content-container", {
        xPercent: -100,
        duration: 10
    });

    let isScrollingDown = true;
    let currentScroll = window.scrollY;
    const scrollThreshold = 5;

    window.addEventListener("scroll", () => {
        const newScroll = window.scrollY;
        if (Math.abs(newScroll - currentScroll) > scrollThreshold) {
            const newDirection = newScroll > currentScroll;
            if (newDirection !== isScrollingDown) {
                isScrollingDown = newDirection;
                gsap.to(".marquee-arrow", { rotate: isScrollingDown ? 0 : 180, duration: 0.3, ease: "power2.out" });
                gsap.to(marqueeTl, { timeScale: isScrollingDown ? 1 : -1, duration: 0.3, ease: "power2.out" });
            }
            currentScroll = newScroll;
        }
    });
}

// ==========================================================
// CUSTOM CURSOR
// ==========================================================

function initCustomCursor() {
    if (window.innerWidth < 1024) return;

    const cursor = document.querySelector('.cursor-2');
    const cursorText = document.querySelector('.cursor-content');
    if (!cursor || !cursorText) return;

    cursor.style.width = "0px";
    cursor.style.height = "0px";
    cursor.style.opacity = "0";
    cursorText.style.transform = "scale(0)";

    let mouseX = 0, mouseY = 0;
    let posX = 0, posY = 0;
    const speed = 0.1;

    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });

    (function animate() {
        posX += ((mouseX / window.innerWidth) * 100 - 50 - posX) * speed;
        posY += ((mouseY / window.innerHeight) * 100 - 50 - posY) * speed;
        cursor.style.transform = `translate(${posX}vw, ${posY}vh)`;
        requestAnimationFrame(animate);
    })();

    let isClickable = true;

    const hoverElements = document.querySelectorAll('.hover-element');
    hoverElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            if (!isClickable) return;
            cursor.style.width = "16rem";
            cursor.style.height = "8rem";
            cursor.style.opacity = "1";
            cursorText.style.transform = "scale(1)";
        });

        element.addEventListener('mouseleave', () => {
            if (!isClickable) return;
            cursor.style.width = "0px";
            cursor.style.height = "0px";
            cursor.style.opacity = "0";
            cursorText.style.transform = "scale(0)";
        });

        element.querySelectorAll('a').forEach(link => {
            link.addEventListener('mouseenter', () => {
                cursor.style.width = "0px";
                cursor.style.height = "0px";
                cursor.style.opacity = "0";
                cursorText.style.transform = "scale(0)";
            });

            link.addEventListener('mouseleave', () => {
                cursor.style.width = "16rem";
                cursor.style.height = "8rem";
                cursor.style.opacity = "1";
                cursorText.style.transform = "scale(1)";
            });
        });
    });

    document.addEventListener('click', () => {
        if (!isClickable) return;
        cursor.style.width = "0px";
        cursor.style.height = "0px";
        cursor.style.opacity = "0";
        cursorText.style.transform = "scale(0)";
        isClickable = false;
        setTimeout(() => { isClickable = true; }, 2000);
    });
}

// ==========================================================
// BARBA TRANSITIONS
// ==========================================================

const enterBasicAnimation = (container) => gsap.from(container.children, {
    opacity: 0,
    scale: 0.98,
    y: 20,
    duration: 0.6,
    ease: "power2.out",
    stagger: 0.1,
});

const leaveBasicAnimation = (container) => gsap.to(container.children, {
    opacity: 0,
    y: -20,
    duration: 0.4,
    ease: "power2.in",
    stagger: 0.1,
});

// ==========================================================
// SCROLLTRIGGER REFRESH
// ==========================================================

function manualScrollTriggerRefresh() {
    setTimeout(() => {
        ScrollTrigger.refresh();
    }, 2500);
}

// ==========================================================
// SCROLL ANIMATIONS
// ==========================================================

function initializeScrollAnimations() {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;

    const paragraphs = document.querySelectorAll('.animate');
    if (paragraphs.length > 0) {
        paragraphs.forEach((char) => {
            const text = new SplitType(char, { types: ['chars', 'words'] });
            gsap.from(text.chars, {
                scrollTrigger: {
                    trigger: char,
                    start: 'top 80%',
                    end: 'top 20%',
                    scrub: true
                },
                opacity: 0.2,
                stagger: 0.1
            });
        });
    }

    document.querySelectorAll("[scroll-up]").forEach((element) => {
        gsap.to(element, {
            scrollTrigger: { trigger: element, start: "top bottom", end: "bottom 15%", scrub: true },
            y: -85,
            ease: "none"
        });
    });

    document.querySelectorAll("[scroll-up-fast]").forEach((element) => {
        gsap.to(element, {
            scrollTrigger: { trigger: element, start: "top bottom", end: "bottom 15%", scrub: true },
            y: -135,
            ease: "none"
        });
    });

    document.querySelectorAll("[scroll-up-slow]").forEach((element) => {
        gsap.to(element, {
            scrollTrigger: { trigger: element, start: "top bottom", end: "bottom 15%", scrub: true },
            y: -25,
            ease: "none"
        });
    });

    const projectImages = document.querySelectorAll(".project-image-image");
    projectImages.forEach((projectImage) => {
        gsap.timeline({
            scrollTrigger: {
                trigger: projectImage.closest(".project-container-large"),
                start: "top top",
                end: "15% top",
                scrub: true
            }
        }).fromTo(projectImage,
            { width: "1300px", height: "650px", top: "15vh" },
            { width: "1500px", height: "70vh", top: "3rem", duration: 1 }
        );
    });

    gsap.fromTo(".line",
        { x: 0 },
        { x: 30, scrollTrigger: { trigger: ".line", start: "top bottom", end: "bottom top", scrub: true } }
    );

    if (document.querySelector(".cards-container .service")) {
        gsap.utils.toArray(".cards-container .service").forEach((card) => {
            gsap.from(card, {
                y: 20, opacity: 0, duration: 0.6, scale: 0.95, ease: "power3.out",
                scrollTrigger: { trigger: card, start: "top 90%", toggleActions: "play none none none" }
            });
        });
    }

    $('.background-wrapper').each(function () {
        gsap.fromTo($(this),
            { backgroundPosition: '40% 5%' },
            {
                backgroundPosition: '90% 5%',
                scrollTrigger: {
                    trigger: $(this).closest('.project-image-big'),
                    start: 'top top', end: '50% top', scrub: true
                }
            }
        );
    });

    if (document.querySelector(".steps-grid .number")) {
        gsap.from(".steps-grid .number", {
            opacity: 0, duration: 0.8, scale: 0.7, ease: "power3.out", stagger: 0.2,
            scrollTrigger: { trigger: ".steps-grid", start: "top 90%", toggleActions: "play none none none" }
        });
    }

    if ($('.project-image-image-large').length) {
        gsap.utils.toArray('.project-image-image-large img').forEach((image) => {
            gsap.fromTo(image,
                { scale: 1.2 },
                { scale: 1, scrollTrigger: { trigger: image, start: 'top bottom', end: 'bottom top', scrub: true } }
            );
        });
    }

    if ($('.project-image').length) {
        gsap.utils.toArray('.project-image').forEach((container) => {
            gsap.fromTo(container,
                { opacity: 1 },
                { opacity: 0, scrollTrigger: { trigger: container, start: 'bottom+=100% top', end: 'bottom+=150% top', scrub: true } }
            );
        });
    }

    if ($('.scale-image-container').length) {
        gsap.utils.toArray('.scale-image-container img').forEach((image) => {
            gsap.fromTo(image,
                { scale: 1.2 },
                { scale: 1, scrollTrigger: { trigger: image, start: 'top bottom', end: 'bottom top', scrub: true } }
            );
        });
    }

    gsap.timeline({
        scrollTrigger: {
            trigger: ".cards-grid",
            start: "top top",
            toggleActions: "play reverse play reverse"
        }
    })
        .to(".middle-card", { y: "10vh", ease: "power2.out", duration: 1 })
        .to(".right-card", { y: "20vh", ease: "power2.out", duration: 1 }, 0);

    const growingImage = document.querySelector(".growing-image");
    const imageGrow = document.querySelector(".image-grow");
    if (growingImage && imageGrow) {
        const timeline = gsap.timeline({
            scrollTrigger: {
                trigger: ".regular-container-stickycontainer",
                start: "top top", end: "bottom bottom", scrub: true
            }
        });
        timeline.fromTo(growingImage,
            { width: "1300px", height: "650px", borderRadius: "0.75rem", top: "15vh" },
            { width: "100vw", height: "100vh", borderRadius: "0rem", top: "0vh", duration: 1 }
        );
        timeline.fromTo(imageGrow, { scale: 1.8 }, { scale: 1, duration: 1 }, 0);
    }
}

// ==========================================================
// TEXT ANIMATIONS
// ==========================================================

function animateText() {
    gsap.matchMedia().add("(min-width: 768px)", () => {
        document.querySelectorAll("[animate]").forEach((el) => {
            const typeSplit = new SplitType(el, { types: "lines", tagName: "span" });

            el.querySelectorAll(".line").forEach((line) => {
                const wrapper = document.createElement("div");
                wrapper.style.overflow = "hidden";
                wrapper.style.display = "block";
                line.parentNode.insertBefore(wrapper, line);
                wrapper.appendChild(line);
            });

            gsap.from(el.querySelectorAll(".line"), {
                y: "75%", opacity: 0, duration: 1.5, ease: "power3.inOut", stagger: 0.2,
                scrollTrigger: { trigger: el, start: "top 110%" }
            });
        });
    });
}

function animateTextWFW() {
    gsap.matchMedia().add("(min-width: 768px)", () => {
        document.querySelectorAll("[animate-wfw]").forEach((el) => {
            const typeSplit = new SplitType(el, { types: "words", tagName: "span" });

            el.querySelectorAll(".word").forEach((word) => {
                const wrapper = document.createElement("div");
                wrapper.style.overflow = "hidden";
                wrapper.style.display = "inline-block";
                word.parentNode.insertBefore(wrapper, word);
                wrapper.appendChild(word);
            });

            gsap.from(el.querySelectorAll(".word"), {
                y: "75%", opacity: 0, duration: 0.75, ease: "power3.inOut", stagger: 0.1,
                scrollTrigger: { trigger: el, start: "top 100%" }
            });
        });
    });
}

// ==========================================================
// FAQ
// ==========================================================

function initFaqToggle() {
    const questions = document.querySelectorAll(".faq4_question");
    if (!questions.length) return;

    questions.forEach((question) => {
        const answer = question.nextElementSibling;
        const icon = question.querySelector(".faq4_icon-wrappper svg");

        gsap.set(answer, { height: 0, overflow: "hidden" });
        let isOpen = false;

        question.addEventListener("click", () => {
            if (isOpen) {
                gsap.to(answer, { height: 0, duration: 0.5, ease: "power3.inOut" });
                if (icon) gsap.to(icon, { rotate: 0, duration: 0.5, ease: "power3.inOut" });
            } else {
                gsap.to(answer, {
                    height: answer.scrollHeight,
                    duration: 0.5,
                    ease: "power3.inOut",
                    onComplete: () => { answer.style.height = "auto"; }
                });
                if (icon) gsap.to(icon, { rotate: 45, duration: 0.5, ease: "power3.inOut" });
            }
            isOpen = !isOpen;
        });
    });
}

// ==========================================================
// REAL VH (iOS fix)
// ==========================================================

function setRealVH() {
    document.documentElement.style.setProperty('--_sizes---100vh', `${window.innerHeight}px`);
}

window.addEventListener('resize', setRealVH);
window.addEventListener('orientationchange', setRealVH);

// ==========================================================
// BREADCRUMBS
// ==========================================================

function initBreadcrumbs() {
    const breadcrumbWrapper = document.getElementById("breadcrumbs");
    if (!breadcrumbWrapper) return;

    const pathParts = window.location.pathname.split("/").filter(Boolean);

    const homeLink = document.createElement("a");
    homeLink.href = "/";
    homeLink.textContent = "Home";
    homeLink.classList.add("breadcrumb-link");
    breadcrumbWrapper.appendChild(homeLink);

    pathParts.forEach((part) => {
        const separator = document.createElement("span");
        separator.textContent = "›";
        separator.classList.add("breadcrumb-separator");
        breadcrumbWrapper.appendChild(separator);

        const label = decodeURIComponent(part.replace(/-/g, " "));

        if (part.toLowerCase() === "dienst") {
            const link = document.createElement("a");
            link.href = "/";
            link.textContent = label;
            link.classList.add("breadcrumb-link");
            breadcrumbWrapper.appendChild(link);
        } else {
            const span = document.createElement("span");
            span.textContent = label;
            span.classList.add("breadcrumb-label");
            breadcrumbWrapper.appendChild(span);
        }
    });
}

// ==========================================================
// NEXT PROJECT LINK
// ==========================================================

function updateProjectLink() {
    const link = document.querySelector('[data-project-slug]');
    if (!link) return;
    link.href = '/project/' + link.getAttribute('data-project-slug');
}

// ==========================================================
// DYNAMIC YEAR
// ==========================================================

function initDynamicCurrentYear() {
    const year = new Date().getFullYear();
    document.querySelectorAll('[data-current-year]').forEach(el => {
        el.textContent = year;
    });
}

// ==========================================================
// FORM (FORMSPREE)
// ==========================================================

function setupFormspreeSubmit() {
    document.querySelectorAll('form[data-name="Email Form"]').forEach(form => {
        form.method = 'POST';
        const newForm = form.cloneNode(true);
        form.parentNode.replaceChild(newForm, form);
    });

    document.querySelectorAll('form[data-name="Email Form"]').forEach(form => {
        form.addEventListener('submit', function (e) {
            e.preventDefault();

            const formData = new FormData(form);
            const submitButton = form.querySelector('input[type="submit"]');

            if (submitButton) {
                submitButton.value = 'Een momentje...';
                submitButton.disabled = true;
            }

            fetch('https://formspree.io/f/mzzvaveg', {
                method: 'POST',
                body: formData,
                headers: { 'Accept': 'application/json' }
            })
                .then(res => res.json())
                .then(data => {
                    if (data.ok) {
                        form.style.display = 'none';
                        const successDiv = form.parentNode.querySelector('.w-form-done');
                        if (successDiv) successDiv.style.display = 'block';
                    } else {
                        throw new Error('Submission failed');
                    }
                })
                .catch(() => {
                    const errorDiv = form.parentNode.querySelector('.w-form-fail');
                    if (errorDiv) errorDiv.style.display = 'block';
                    if (submitButton) {
                        submitButton.value = 'Versturen';
                        submitButton.disabled = false;
                    }
                });
        });
    });
}

// ==========================================================
// BARBA JS
// ==========================================================

barba.init({
    transitions: [{
        name: "page-transition",
        sync: false,

        beforeLeave({ next }) {
            const end = next.html.indexOf(' data-wf-site="');
            const start = next.html.indexOf('data-wf-page="');
            const arr = next.html.slice(start, end).split('"');
            pageID = arr[1];
        },

        leave({ current }) {
            return leaveBasicAnimation(current.container);
        },

        afterLeave({ current }) {
            if (window.xdExtractorDestroy) window.xdExtractorDestroy();
            current.container.remove();
        },

        beforeEnter({ next }) {
            $("html").attr("data-wf-page", pageID);
            document.dispatchEvent(new Event('readystatechange'));
            initializeLenis();
        },

        enter({ next }) {
            window.scrollTo(0, 0);
            reinitializeWebflow(next.container);
            enterBasicAnimation(next.container);
            initializeScrollAnimations();
            manualScrollTriggerRefresh();
            initMarqueeWithLenis();
            animateText();
            animateTextWFW();
            initializeImageFollow();
            initFaqToggle();
            initBreadcrumbs();
            updateProjectLink();
            if (window.xdExtractorInit) window.xdExtractorInit();
            window.dataLayer = window.dataLayer || [];
            window.dataLayer.push({
                event: 'virtual_page_view',
                page_title: document.title,
                page_location: window.location.href,
                page_path: window.location.pathname
            });
        },

        afterEnter() {
            initCustomCursor();
            setupFormspreeSubmit();

            document.querySelectorAll('video[autoplay]').forEach(video => {
                const p = video.play();
                if (p !== undefined) p.catch(() => {});
            });
        },
    }],
});

// ==========================================================
// INITIAL LOAD
// ==========================================================

document.addEventListener("DOMContentLoaded", () => {
    initializeLenis();
    reinitializeWebflow(document.body);
    initializeScrollAnimations();
    initializeImageFollow();
    initMarqueeWithLenis();
    animateText();
    animateTextWFW();
    initCustomCursor();
    initFaqToggle();
    initBreadcrumbs();
    updateProjectLink();
    setupFormspreeSubmit();
    setRealVH();
    initDynamicCurrentYear();
    if (window.xdExtractorInit) window.xdExtractorInit();
});
