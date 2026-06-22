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
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c];
    });
  }
  function planLabel(p) { return p === "promax" ? "Pro Max" : p === "pro" ? "Pro" : "Free"; }

  /* ── Auth / membership modal (real, via Cloudflare Functions) ────────── */
  function ensureLoginModal() {
    var overlay = document.getElementById("login-modal");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "login-modal";
    overlay.innerHTML =
      '<div class="modal" role="dialog" aria-modal="true" aria-label="Üyelik">' +
      '<button class="modal-close" type="button" data-close aria-label="Kapat">×</button>' +
      '<div id="auth-body"></div></div>';
    document.body.appendChild(overlay);
    var bodyEl = overlay.querySelector("#auth-body");
    var mode = "login", role = "student";
    function close() { overlay.classList.remove("is-open"); }
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || e.target.closest("[data-close]")) close();
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") close(); });
    document.addEventListener("gb:auth", function () { if (overlay.classList.contains("is-open")) render(); });

    function render() {
      if (GB.isAuthed()) {
        bodyEl.innerHTML =
          '<div style="text-align:center;">' +
          '<img src="static/icons/logo.webp" alt="" width="40" height="40" style="margin:0 auto 12px;border-radius:10px;" />' +
          '<h3 class="subheading">Hesabım</h3>' +
          '<p class="fine mt-8">' + esc(GB.user.email) + '</p>' +
          '<p class="mt-16"><span class="badge badge--blue">Plan: ' + planLabel(GB.user.plan) + '</span></p>' +
          '<a class="btn btn-white btn-block mt-24" href="dashboard.html">Panele git</a>' +
          '<button class="btn btn-dark btn-block" type="button" id="auth-logout" style="margin-top:10px;">Çıkış yap</button>' +
          '</div>';
        bodyEl.querySelector("#auth-logout").addEventListener("click", async function () { await GB.logout(); render(); });
        return;
      }
      var formHtml = role === "kurumsal"
        ? '<p class="callout callout--info">Okul / dershane misin? <a href="sinif-pilot.html">Sınıf Pilotu</a> ile 50 öğrenci 4 hafta ücretsiz; detay için <a href="okullar.html">okullar</a>.</p>'
        : '<form class="form-card" id="auth-form" style="padding:0;border:none;box-shadow:none;gap:12px;background:transparent;">' +
            (mode === "register" ? '<div class="field"><label class="field-label">Ad</label><input class="input" name="name" autocomplete="name" /></div>' : "") +
            '<div class="field"><label class="field-label">E-posta</label><input class="input" name="email" type="email" autocomplete="email" required /></div>' +
            '<div class="field"><label class="field-label">Şifre</label><input class="input" name="password" type="password" autocomplete="' + (mode === "login" ? "current-password" : "new-password") + '" minlength="8" required /></div>' +
            '<p class="callout callout--amber" id="auth-err" hidden></p>' +
            '<button class="btn btn-white btn-block" type="submit">' + (mode === "login" ? "Giriş Yap" : "Üye Ol") + '</button>' +
            '<p class="form-note">' + (mode === "login" ? 'Hesabın yok mu? <a href="#" data-switch="register">Üye ol</a>' : 'Zaten üye misin? <a href="#" data-switch="login">Giriş yap</a>') + '</p>' +
          '</form>';
      bodyEl.innerHTML =
        '<div style="text-align:center;margin-bottom:18px;">' +
        '<img src="static/icons/logo.webp" alt="" width="40" height="40" style="margin:0 auto 12px;border-radius:10px;" />' +
        '<h3 class="subheading">' + (mode === "login" ? "Giriş yap" : "Üye ol") + '</h3>' +
        '<p class="fine mt-8">Gerçek Atlas AI + plan avantajları üyelere özel.</p>' +
        '</div>' +
        '<div class="tabs" style="display:flex;width:100%;margin-bottom:16px;">' +
        '<button class="tab' + (role === "student" ? " is-active" : "") + '" type="button" data-role="student" style="flex:1;">Öğrenci</button>' +
        '<button class="tab' + (role === "veli" ? " is-active" : "") + '" type="button" data-role="veli" style="flex:1;">Aile</button>' +
        '<button class="tab' + (role === "kurumsal" ? " is-active" : "") + '" type="button" data-role="kurumsal" style="flex:1;">Kurumsal</button>' +
        '</div>' + formHtml;

      bodyEl.querySelectorAll("[data-role]").forEach(function (b) {
        b.addEventListener("click", function () { role = b.getAttribute("data-role"); render(); });
      });
      bodyEl.querySelectorAll("[data-switch]").forEach(function (a) {
        a.addEventListener("click", function (e) { e.preventDefault(); mode = a.getAttribute("data-switch"); render(); });
      });
      var form = bodyEl.querySelector("#auth-form");
      if (form) form.addEventListener("submit", async function (e) {
        e.preventDefault();
        var fd = new FormData(form);
        var email = String(fd.get("email") || "").trim();
        var password = String(fd.get("password") || "");
        var name = String(fd.get("name") || "").trim();
        var errEl = bodyEl.querySelector("#auth-err");
        var btn = form.querySelector('button[type="submit"]');
        errEl.hidden = true;
        btn.disabled = true; btn.textContent = "…";
        var res = mode === "login" ? await GB.login(email, password) : await GB.register(email, password, name, role);
        if (res.ok) { close(); setTimeout(function () { location.reload(); }, 120); return; }
        btn.disabled = false; btn.textContent = mode === "login" ? "Giriş Yap" : "Üye Ol";
        errEl.hidden = false; errEl.textContent = GB.AUTH_ERR[res.error] || GB.AUTH_ERR.error;
      });
    }
    overlay._render = render;
    render();
    return overlay;
  }

  document.addEventListener("click", function (e) {
    var loginTrigger = e.target.closest('[data-action="login"]');
    if (loginTrigger) {
      e.preventDefault();
      var m = ensureLoginModal(); m._render(); m.classList.add("is-open");
      return;
    }
    var payTrigger = e.target.closest('[data-action="pay"]');
    if (payTrigger) {
      e.preventDefault();
      if (GB.isAuthed()) {
        alert("Ödeme entegrasyonu yakında. Planını yükseltmek için iletişime geç (iletisim.html).");
      } else {
        var lm = ensureLoginModal(); lm._render(); lm.classList.add("is-open");
      }
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

  /* ════════════════════════════════════════════════════════════════════
     GB — client-side profile + match + Atlas AI (no backend)
     The test writes a RIASEC profile to localStorage; every "uyum %" reads
     it, so ratios reflect the user's real answers. Atlas calls Gemini
     directly with a key the user pastes (kept only in their browser); with
     no key it returns a deterministic, profile-aware templated answer.
     ════════════════════════════════════════════════════════════════════ */
  var GB = (window.GB = window.GB || {});
  GB.DIMS = ["R", "I", "A", "S", "E", "C"];
  GB.DIM_TR = { R: "Gerçekçi", I: "Araştırmacı", A: "Sanatsal", S: "Sosyal", E: "Girişimci", C: "Kuralcı" };
  // Category → Holland/RIASEC weights (0-100)
  GB.CAT_RIASEC = {
    "mühendislik": { R: 90, I: 85, A: 20, S: 25, E: 45, C: 65 },
    "sağlık":      { R: 45, I: 85, A: 20, S: 90, E: 30, C: 55 },
    "sosyal":      { R: 20, I: 60, A: 55, S: 92, E: 55, C: 30 },
    "eğitim":      { R: 25, I: 55, A: 55, S: 90, E: 45, C: 45 },
    "iktisat":     { R: 20, I: 65, A: 20, S: 35, E: 85, C: 90 },
    "hukuk":       { R: 15, I: 65, A: 35, S: 55, E: 82, C: 85 },
    "sanat":       { R: 30, I: 45, A: 95, S: 45, E: 55, C: 20 },
    "hizmet":      { R: 55, I: 30, A: 45, S: 72, E: 75, C: 55 }
  };
  GB.getProfile = function () {
    try { return JSON.parse(localStorage.getItem("gb_profile") || "null"); } catch (e) { return null; }
  };
  GB.setProfile = function (p) {
    try { localStorage.setItem("gb_profile", JSON.stringify(p)); } catch (e) {}
    return p;
  };
  GB.hasProfile = function () { var p = GB.getProfile(); return !!(p && p.riasec); };
  GB.cosine = function (a, b) {
    var d = 0, na = 0, nb = 0;
    for (var i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
    return (na && nb) ? d / (Math.sqrt(na) * Math.sqrt(nb)) : 0;
  };
  // Match % (45-99) for a category from the stored profile; null if no test yet
  GB.matchCat = function (catKey, seed) {
    var p = GB.getProfile();
    if (!p || !p.riasec) return null;
    var w = GB.CAT_RIASEC[catKey];
    if (!w) return null;
    var u = GB.DIMS.map(function (k) { return p.riasec[k] || 0; });
    var v = GB.DIMS.map(function (k) { return w[k] || 0; });
    var base = 55 + GB.cosine(u, v) * 43, jit = 0;
    if (seed) { var h = 0; for (var i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0; jit = (h % 7) - 3; }
    return Math.max(45, Math.min(99, Math.round(base + jit)));
  };
  GB.topDims = function (p) {
    p = p || GB.getProfile();
    if (!p || !p.riasec) return [];
    return GB.DIMS.slice().sort(function (a, b) { return (p.riasec[b] || 0) - (p.riasec[a] || 0); });
  };
  // Build a 0-100 RIASEC profile from raw accumulated sums {R:..,I:..}
  GB.profileFromSums = function (sums) {
    var max = 1;
    GB.DIMS.forEach(function (k) { var v = Math.max(0, sums[k] || 0); if (v > max) max = v; });
    var riasec = {};
    GB.DIMS.forEach(function (k) { riasec[k] = Math.round((Math.max(0, sums[k] || 0) / max) * 100); });
    var top = GB.DIMS.slice().sort(function (a, b) { return riasec[b] - riasec[a]; });
    return { riasec: riasec, top3: top.slice(0, 3), code: top.slice(0, 3).join(""), ts: Date.now() };
  };
  // Top categories for the stored profile → [{cat, pct}]
  GB.topCategories = function (n) {
    if (!GB.hasProfile()) return [];
    return Object.keys(GB.CAT_RIASEC)
      .map(function (c) { return { cat: c, pct: GB.matchCat(c) }; })
      .sort(function (a, b) { return b.pct - a.pct; })
      .slice(0, n || 3);
  };

  /* ── Atlas AI ────────────────────────────────────────────────────────── */
  GB.atlasKey = function (v) {
    if (v === undefined) { try { return localStorage.getItem("gb_gemini_key") || ""; } catch (e) { return ""; } }
    try { localStorage.setItem("gb_gemini_key", v || ""); } catch (e) {}
    return v;
  };
  GB.profileSummary = function () {
    var p = GB.getProfile();
    if (!p || !p.riasec) return "Kullanıcı henüz testi yapmadı (profil yok).";
    var t = GB.topDims(p).slice(0, 3).map(function (k) { return GB.DIM_TR[k] + " (%" + p.riasec[k] + ")"; });
    var cats = GB.topCategories(3).map(function (c) { return c.cat + " %" + c.pct; });
    return "RIASEC kodu " + p.code + ". Baskın yönler: " + t.join(", ") + ". En uyumlu alanlar: " + cats.join(", ") + ".";
  };
  // Keyless: posts to the server proxy (/api/atlas) which holds the Gemini key
  // and enforces per-plan quota. Returns text, or null (caller shows fallback);
  // sets GB._atlasErr {code:'auth'|'quota'|'error'|'offline'} for the chat UI.
  GB.atlasAsk = async function (system, user) {
    GB._atlasErr = null;
    try {
      var r = await fetch("/api/atlas", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: user, profile: GB.profileSummary() })
      });
      if (r.status === 401) { GB._atlasErr = { code: "auth" }; return null; }
      if (r.status === 429) {
        var q = await r.json().catch(function () { return {}; });
        GB._atlasErr = { code: "quota", cap: q.cap, plan: q.plan };
        return null;
      }
      if (r.ok) { var j = await r.json(); if (j && j.text) return j.text; }
      GB._atlasErr = { code: "error" };
    } catch (e) { GB._atlasErr = { code: "offline" }; }
    // optional dev/preview override: a personal Gemini key in this browser
    var key = GB.atlasKey && GB.atlasKey();
    if (key) {
      try {
        var rr = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(key),
          { method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: "user", parts: [{ text: user }] }], generationConfig: { temperature: 0.85, maxOutputTokens: 600 } }) }
        );
        if (rr.ok) { var jj = await rr.json(); var c = jj && jj.candidates && jj.candidates[0]; var t = c && c.content && c.content.parts && c.content.parts[0] && c.content.parts[0].text; if (t) { GB._atlasErr = null; return t; } }
      } catch (e2) {}
    }
    return null;
  };
  // Profile-aware fallback when Atlas isn't available (logged out / quota / preview)
  GB.atlasFallback = function (userMsg) {
    var p = GB.getProfile();
    var head;
    if (p && p.riasec) {
      var tops = GB.topDims(p).slice(0, 3).map(function (k) { return GB.DIM_TR[k]; });
      var cats = GB.topCategories(2).map(function (c) { return c.cat; });
      head = "Profiline göre baskın yönlerin " + tops.join(", ") + ". Bu da seni en çok " +
        cats.join(" ve ") + " alanlarına yaklaştırıyor. ";
    } else {
      head = "Henüz testini yapmamışsın — birkaç dakikalık testi bitirirsen sana özel konuşabilirim. ";
    }
    return head + (userMsg ? "Sorduğun “" + userMsg + "” için: ilgini en çok çeken 2-3 alanı yaz, birlikte daraltalım. " : "") + "(Gerçek Atlas üyelere özel — giriş yap.)";
  };

  /* ── Membership (real auth via Cloudflare Functions) ─────────────────── */
  GB.AUTH_ERR = {
    invalid_email: "E-posta geçersiz görünüyor.",
    weak_password: "Şifre en az 8 karakter olmalı.",
    email_taken: "Bu e-posta zaten kayıtlı — giriş yapmayı dene.",
    invalid_credentials: "E-posta veya şifre hatalı.",
    missing_fields: "E-posta ve şifre gerekli.",
    db_unconfigured: "Sunucu henüz hazır değil (backend kurulmadan giriş çalışmaz).",
    bad_json: "İstek hatası.",
    error: "Bir aksilik oldu, birazdan tekrar dene."
  };
  GB.user = null;
  GB.isAuthed = function () { return !!GB.user; };
  GB.plan = function () {
    if (GB.user && GB.user.plan) return GB.user.plan;
    try { return localStorage.getItem("gb_plan") || "free"; } catch (e) { return "free"; }
  };
  GB.refreshMe = async function () {
    try {
      var r = await fetch("/api/auth/me", { credentials: "same-origin" });
      if (r.ok) { var j = await r.json(); GB.user = (j && j.user) || null; }
    } catch (e) { /* static preview: no backend */ }
    try { localStorage.setItem("gb_plan", GB.plan()); } catch (e) {}
    document.dispatchEvent(new CustomEvent("gb:auth", { detail: { user: GB.user } }));
    return GB.user;
  };
  GB.login = async function (email, password) {
    try {
      var r = await fetch("/api/auth/login", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, password: password }) });
      var j = await r.json().catch(function () { return {}; });
      if (r.ok && j.ok) { GB.user = j.user; try { localStorage.setItem("gb_plan", GB.plan()); } catch (e) {} document.dispatchEvent(new CustomEvent("gb:auth", { detail: { user: GB.user } })); return { ok: true }; }
      return { ok: false, error: j.error || "error" };
    } catch (e) { return { ok: false, error: "db_unconfigured" }; }
  };
  GB.register = async function (email, password, name, role) {
    try {
      var r = await fetch("/api/auth/register", { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, password: password, name: name, role: role }) });
      var j = await r.json().catch(function () { return {}; });
      if (r.ok && j.ok) { GB.user = j.user; try { localStorage.setItem("gb_plan", GB.plan()); } catch (e) {} document.dispatchEvent(new CustomEvent("gb:auth", { detail: { user: GB.user } })); return { ok: true }; }
      return { ok: false, error: j.error || "error" };
    } catch (e) { return { ok: false, error: "db_unconfigured" }; }
  };
  GB.logout = async function () {
    try { await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }); } catch (e) {}
    GB.user = null; try { localStorage.setItem("gb_plan", "free"); } catch (e) {}
    document.dispatchEvent(new CustomEvent("gb:auth", { detail: { user: null } }));
  };
  GB.refreshMe();

  /* Atlas chat modal — injected once, opened by [data-action="atlas"] */
  function ensureAtlasModal() {
    var overlay = document.getElementById("atlas-modal");
    if (overlay) return overlay;
    overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.id = "atlas-modal";
    overlay.innerHTML = [
      '<div class="modal" role="dialog" aria-modal="true" aria-label="Atlas AI" style="max-width:480px;">',
      '  <button class="modal-close" type="button" data-close aria-label="Kapat">×</button>',
      '  <div style="display:flex;align-items:center;gap:10px;margin-bottom:6px;">',
      '    <span class="icon-chip" style="margin:0;width:38px;height:38px;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/></svg></span>',
      '    <div><h3 class="subheading" style="font-size:var(--text-body-lg);">Atlas AI</h3><p class="fine" id="atlas-status"></p></div>',
      "  </div>",
      '  <div id="atlas-log" style="max-height:46vh;overflow-y:auto;display:flex;flex-direction:column;gap:10px;margin:14px 0;padding-right:4px;"></div>',
      '  <form id="atlas-form" style="display:flex;gap:8px;">',
      '    <input class="input" id="atlas-input" placeholder="Atlas\'a bir şey sor…" autocomplete="off" style="flex:1;" />',
      '    <button class="btn btn-white" type="submit" style="padding:10px 16px;">Gönder</button>',
      "  </form>",
      '  <button class="fine" id="atlas-key-btn" type="button" style="margin-top:10px;background:none;border:none;color:var(--color-sky-wash);text-decoration:underline;cursor:pointer;font-family:inherit;"></button>',
      "</div>"
    ].join("");
    document.body.appendChild(overlay);

    var log = overlay.querySelector("#atlas-log");
    var statusEl = overlay.querySelector("#atlas-status");
    var actBtn = overlay.querySelector("#atlas-key-btn");
    function refreshStatus() {
      if (GB.isAuthed()) {
        statusEl.textContent = "Plan: " + planLabel(GB.user.plan) + " · sana özel";
        actBtn.hidden = true;
      } else {
        statusEl.textContent = "Üyelere özel — giriş yapınca açılır";
        actBtn.hidden = false;
        actBtn.textContent = "Giriş yap / Üye ol →";
      }
    }
    function bubble(text, who) {
      var b = document.createElement("div");
      b.style.cssText =
        "max-width:88%;padding:10px 12px;border-radius:14px;font-size:var(--text-body-sm);line-height:1.5;white-space:pre-wrap;" +
        (who === "me"
          ? "align-self:flex-end;background:var(--color-white);color:#0f1115;"
          : "align-self:flex-start;background:var(--surface-charcoal);color:var(--color-pearl);border:1px solid var(--hairline-soft);");
      b.textContent = text;
      log.appendChild(b);
      log.scrollTop = log.scrollHeight;
      return b;
    }
    actBtn.addEventListener("click", function () {
      var m = ensureLoginModal(); m._render(); m.classList.add("is-open");
    });
    overlay.addEventListener("click", function (e) {
      if (e.target === overlay || e.target.closest("[data-close]")) overlay.classList.remove("is-open");
    });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") overlay.classList.remove("is-open"); });
    document.addEventListener("gb:auth", function () { if (overlay.classList.contains("is-open")) refreshStatus(); });

    var SYSTEM = "Sen 'Atlas'sın: Gelecek Bul kariyer danışmanı AI.";
    overlay.querySelector("#atlas-form").addEventListener("submit", async function (e) {
      e.preventDefault();
      var inp = overlay.querySelector("#atlas-input");
      var msg = inp.value.trim();
      if (!msg) return;
      bubble(msg, "me");
      inp.value = "";
      var thinking = bubble("…", "atlas");
      var ans = await GB.atlasAsk(SYSTEM, msg);
      if (ans) {
        thinking.textContent = ans;
      } else if (GB._atlasErr && GB._atlasErr.code === "auth") {
        thinking.textContent = "Gerçek Atlas üyelere özel. Hemen giriş yap — ücretsiz planda bile günde 5 soru hakkın var.";
        refreshStatus();
      } else if (GB._atlasErr && GB._atlasErr.code === "quota") {
        thinking.textContent = "Bugünlük Atlas hakkın doldu (Plan: " + planLabel(GB._atlasErr.plan) + " · " + GB._atlasErr.cap + "/gün). Yarın yenilenir — ya da planını yükselt.";
      } else {
        thinking.textContent = GB.atlasFallback(msg);
      }
      log.scrollTop = log.scrollHeight;
    });

    overlay._open = function () {
      refreshStatus();
      if (!log.childElementCount) {
        bubble(
          GB.isAuthed()
            ? "Selam, ben Atlas 👋 " + (GB.hasProfile() ? GB.profileSummary() + " Ne sormak istersin?" : "Ne sormak istersin — bölüm, üniversite ya da bir meslek?")
            : "Selam, ben Atlas 👋 Gerçek sohbet üyelere özel — giriş yap, ücretsiz planda bile günde 5 soru. Testini yaptıysan profil özetini yine de görebilirim.",
          "atlas"
        );
      }
    };
    return overlay;
  }
  GB.openAtlas = function () { var m = ensureAtlasModal(); m._open(); m.classList.add("is-open"); };
  document.addEventListener("click", function (e) {
    var t = e.target.closest('[data-action="atlas"]');
    if (t) { e.preventDefault(); GB.openAtlas(); }
  });
})();
