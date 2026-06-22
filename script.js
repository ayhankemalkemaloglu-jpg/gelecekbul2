/* ════════════════════════════════════════════════════════════════════
   superwhisper — light interactions
   Kept intentionally minimal: the gradient and type do the heavy lifting.
   ════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── Scroll reveal ─────────────────────────────────────────────
     Tag the elements that should fade up as they enter the viewport. */
  const revealTargets = document.querySelectorAll(
    ".section-head, .feature-card, .step, .price-card, .strip, .cta-card"
  );
  revealTargets.forEach((el) => el.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ── Active nav link on scroll ─────────────────────────────────
     The active marker is colour alone — no underline, no pill, no dot. */
  const sections = [
    { id: "features", link: 'a[href="#features"]' },
    { id: "how", link: 'a[href="#how"]' },
    { id: "pricing", link: 'a[href="#pricing"]' },
  ];

  const navLinks = document.querySelectorAll(".nav-link");

  function setActive(activeId) {
    navLinks.forEach((l) => l.classList.remove("is-active"));
    const match = sections.find((s) => s.id === activeId);
    const selector = match ? match.link : 'a[href="#features"]';
    const el = document.querySelector(selector);
    if (el) el.classList.add("is-active");
  }

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { threshold: 0.4 }
    );
    sections.forEach((s) => {
      const node = document.getElementById(s.id);
      if (node) sectionObserver.observe(node);
    });
  }
})();
