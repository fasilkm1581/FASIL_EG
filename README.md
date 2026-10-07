# Emirates Gold – animated website recreation

A static recreation of emiratesgold.ae (content from the live site) with a WebGL hero and scroll-driven motion.

**Run:** `python3 -m http.server 8000` then open http://localhost:8000 (ES modules need http, not file://).

**Stack (vendored in `vendor/`, no build step):** GSAP + ScrollTrigger, Lenis smooth scroll, Three.js.

**Animation features:** preloader with shutter reveal, procedural 3D gold bar + coins + dust (mouse/scroll reactive), 4-slide hero with line-mask text, fullscreen circle-wipe menu, pinned horizontal services scroll with animated icons, scroll-filled paragraph, counters, velocity-reactive marquee, 3D tilt cards, parallax collections, magnetic buttons, custom cursor, floating-label forms, modals. Respects `prefers-reduced-motion`.

Notes: no images from the original site are used (SVG/WebGL art instead); forms and the price ticker are demo-only.
