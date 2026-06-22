/* ════════════════════════════════════════════════════════════════════
   Gelecek Bul — shared interactions
   Aurora template + Gelecek Bul behaviour. Everything is defensive: each
   block no-ops when its target element is absent, so the same script ships
   on every page.
   ════════════════════════════════════════════════════════════════════ */

(function () {
  "use strict";

  /* ── Scroll reveal ───────────────────────────────────────────────── */
  const revealTargets = document.querySelectorAll(
    ".section-head, .subhead, .feature-card, .step, .price-card, .plan-card, " +
      ".card, .strip, .stat, .cta-card, .faq-item, .topic-card, .form-card"
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
      { threshold: 0.1, rootMargin: "0px 0px -6% 0px" }
    );
    revealTargets.forEach((el) => observer.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  /* ── Active nav link on scroll (home) ────────────────────────────── */
  const navSections = [
    { id: "nasil", sel: 'a[href="#nasil"]' },
    { id: "planlar", sel: 'a[href="#planlar"]' },
  ];
  const navLinks = document.querySelectorAll(".nav-link");
  if (navLinks.length && "IntersectionObserver" in window) {
    const setActive = (id) => {
      navLinks.forEach((l) => l.classList.remove("is-active"));
      const match = navSections.find((s) => s.id === id);
      if (match) {
        const el = document.querySelector(match.sel);
        if (el) el.classList.add("is-active");
      }
    };
    const sectionObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActive(e.target.id);
        });
      },
      { threshold: 0.4 }
    );
    navSections.forEach((s) => {
      const node = document.getElementById(s.id);
      if (node) sectionObserver.observe(node);
    });
  }

  /* ── Mobile menu ─────────────────────────────────────────────────── */
  const menuBtn = document.querySelector('[data-action="menu"]');
  const mobileMenu = document.getElementById("mobile-menu");
  if (menuBtn && mobileMenu) {
    const toggle = (open) => {
      const isOpen =
        open !== undefined ? open : !mobileMenu.classList.contains("is-open");
      mobileMenu.classList.toggle("is-open", isOpen);
      menuBtn.setAttribute("aria-expanded", String(isOpen));
    };
    menuBtn.addEventListener("click", (e) => {
      e.preventDefault();
      toggle();
    });
    mobileMenu.querySelectorAll("a").forEach((a) =>
      a.addEventListener("click", () => toggle(false))
    );
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") toggle(false);
    });
  }

  /* ── Hero morph words ────────────────────────────────────────────── */
  const morph = document.getElementById("hero-morph");
  if (morph && morph.dataset.words) {
    const words = morph.dataset.words.split(",").map((w) => w.trim()).filter(Boolean);
    if (words.length > 1 && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
      let i = 0;
      morph.style.transition = "opacity 0.4s ease, transform 0.4s ease";
      setInterval(() => {
        morph.style.opacity = "0";
        morph.style.transform = "translateY(10px)";
        setTimeout(() => {
          i = (i + 1) % words.length;
          morph.textContent = words[i];
          morph.style.opacity = "1";
          morph.style.transform = "none";
        }, 400);
      }, 2800);
    }
  }

  /* ── Generic tabs ────────────────────────────────────────────────── */
  // Markup: <div data-tabs> with buttons [data-tab="key"] and panels
  // [data-tab-panel="key"].
  document.querySelectorAll("[data-tabs]").forEach((group) => {
    const tabs = group.querySelectorAll("[data-tab]");
    const panels = group.querySelectorAll("[data-tab-panel]");
    tabs.forEach((tab) =>
      tab.addEventListener("click", () => {
        const key = tab.getAttribute("data-tab");
        tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
        panels.forEach((p) =>
          p.toggleAttribute("hidden", p.getAttribute("data-tab-panel") !== key)
        );
      })
    );
  });

  /* ── Generic topic / option selector ─────────────────────────────── */
  document.querySelectorAll(".topic-grid").forEach((grid) => {
    const cards = grid.querySelectorAll(".topic-card");
    const input = document.querySelector(
      grid.getAttribute("data-topic-input") || "[data-topic-value]"
    );
    cards.forEach((card) =>
      card.addEventListener("click", () => {
        cards.forEach((c) => {
          c.classList.toggle("is-active", c === card);
          c.setAttribute("aria-pressed", String(c === card));
        });
        if (input) input.value = card.getAttribute("data-topic") || "";
      })
    );
  });

  /* ── Live counters (data-count) ──────────────────────────────────── */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window) {
    const animate = (el) => {
      const target = parseFloat(el.getAttribute("data-count")) || 0;
      const suffix = el.getAttribute("data-count-suffix") || "";
      const dur = 1100;
      const start = performance.now();
      const tick = (now) => {
        const p = Math.min((now - start) / dur, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * eased).toLocaleString("tr-TR") + suffix;
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const cObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            animate(e.target);
            cObs.unobserve(e.target);
          }
        });
      },
      { threshold: 0.5 }
    );
    counters.forEach((c) => cObs.observe(c));
  }

  /* ── Login modal (injected once, shared across pages) ────────────── */
  function ensureLoginModal() {
    let overlay = document.getElementById("login-modal");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "login-modal";
    overlay.innerHTML = [
      '<div class="modal" role="dialog" aria-modal="true" aria-label="Giriş">',
      '  <button class="modal-close" type="button" data-close aria-label="Kapat">×</button>',
      '  <div style="text-align:center;margin-bottom:20px;">',
      '    <img src="static/icons/logo.webp" alt="" width="40" height="40" style="margin:0 auto 12px;border-radius:10px;" />',
      '    <h3 class="subheading">Gelecek Bul\'a giriş</h3>',
      '    <p class="fine mt-8">Sonuçlarını kaydet, geçmişini gör, aileyle paylaş.</p>',
      "  </div>",
      '  <div class="tabs" data-tabs style="display:flex;width:100%;margin-bottom:20px;" id="login-tabs">',
      '    <button class="tab is-active" data-tab="ogrenci" style="flex:1;">Öğrenci</button>',
      '    <button class="tab" data-tab="aile" style="flex:1;">Aile</button>',
      '    <button class="tab" data-tab="kurumsal" style="flex:1;">Kurumsal</button>',
      "  </div>",
      '  <div data-tab-panel="ogrenci">',
      '    <form class="form-card" style="padding:0;border:none;box-shadow:none;gap:14px;background:transparent;" data-login-form>',
      '      <div class="field"><label class="field-label">E-posta</label><input class="input" type="email" name="email" placeholder="ornek@eposta.com" required /></div>',
      '      <div class="field"><label class="field-label">Şifre</label><input class="input" type="password" name="password" placeholder="••••••••" required /></div>',
      '      <button class="btn btn-white btn-block" type="submit">Giriş Yap</button>',
      '      <button class="btn btn-dark btn-block" type="button" data-google style="margin-top:0;">Google ile devam et</button>',
      '      <p class="form-note">Hesabın yok mu? <a href="#" data-register>Kayıt ol</a> · <a href="#">Şifreni mi unuttun?</a></p>',
      "    </form>",
      "  </div>",
      '  <div data-tab-panel="aile" hidden>',
      '    <p class="callout">Aile hesabıyla çocuğunun sürecini takip et, veli raporunu sade bir dille oku.</p>',
      '    <form class="form-card" style="padding:0;border:none;box-shadow:none;gap:14px;margin-top:14px;background:transparent;" data-login-form>',
      '      <div class="field"><label class="field-label">E-posta</label><input class="input" type="email" placeholder="veli@eposta.com" required /></div>',
      '      <div class="field"><label class="field-label">Şifre</label><input class="input" type="password" placeholder="••••••••" required /></div>',
      '      <button class="btn btn-white btn-block" type="submit">Veli Girişi</button>',
      "    </form>",
      "  </div>",
      '  <div data-tab-panel="kurumsal" hidden>',
      '    <p class="callout callout--info">Okul / dershane misin? Sınıf Pilotu ile 50 öğrenci 4 hafta ücretsiz.</p>',
      '    <a class="btn btn-white btn-block" href="sinif-pilot.html">Okul Başvurusu</a>',
      '    <a class="btn btn-dark btn-block" href="okullar.html">Okullar için detay</a>',
      "  </div>",
      "</div>",
    ].join("");
    document.body.appendChild(overlay);

    const close = () => overlay.classList.remove("is-open");
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay || e.target.closest("[data-close]")) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
    // wire the injected tabs
    const tabs = overlay.querySelectorAll("[data-tab]");
    const panels = overlay.querySelectorAll("[data-tab-panel]");
    tabs.forEach((tab) =>
      tab.addEventListener("click", () => {
        const key = tab.getAttribute("data-tab");
        tabs.forEach((t) => t.classList.toggle("is-active", t === tab));
        panels.forEach((p) =>
          p.toggleAttribute("hidden", p.getAttribute("data-tab-panel") !== key)
        );
      })
    );
    overlay.querySelectorAll("[data-login-form]").forEach((f) =>
      f.addEventListener("submit", (e) => {
        e.preventDefault();
        alert("Demo arayüz — canlı giriş için backend gerekir.");
      })
    );
    return overlay;
  }

  document.addEventListener("click", (e) => {
    const loginTrigger = e.target.closest('[data-action="login"]');
    if (loginTrigger) {
      e.preventDefault();
      ensureLoginModal().classList.add("is-open");
      return;
    }
    const payTrigger = e.target.closest('[data-action="pay"]');
    if (payTrigger) {
      e.preventDefault();
      ensureLoginModal().classList.add("is-open");
    }
  });

  /* ── Dock magnify (footer quick-access) ──────────────────────────────
     macOS-style fisheye: each card scales with cursor proximity. Static
     row on touch (no fine pointer). */
  document.querySelectorAll(".dock").forEach((dock) => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    var cards = Array.prototype.slice.call(dock.querySelectorAll(".dock-card"));
    var RANGE = 130, MAX = 0.55, LIFT = 16;
    dock.addEventListener("mousemove", function (e) {
      cards.forEach(function (card) {
        var r = card.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var t = Math.max(0, 1 - Math.abs(e.clientX - cx) / RANGE);
        card.style.transform =
          "translateY(" + (-LIFT * t) + "px) scale(" + (1 + MAX * t) + ")";
        card.style.zIndex = t > 0.5 ? "3" : "1";
      });
    });
    dock.addEventListener("mouseleave", function () {
      cards.forEach(function (card) {
        card.style.transform = "";
        card.style.zIndex = "";
      });
    });
  });
})();
