/* eduGaming.ch – Basis-Interaktionen */
(function () {
  "use strict";

  /* Mobile Navigation */
  const navToggle = document.querySelector(".nav-toggle");
  const navList = document.querySelector(".nav__list");
  if (navToggle && navList) {
    navToggle.addEventListener("click", () => {
      const open = navList.classList.toggle("is-open");
      navToggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* Hell-/Dunkelmodus: Standard hell, Wahl pro Browser gemerkt */
  const root = document.documentElement;
  try {
    const saved = localStorage.getItem("eg-theme");
    if (saved) root.dataset.theme = saved;
  } catch (e) { /* Speicher nicht verfügbar */ }
  const themeToggle = document.querySelector(".theme-toggle");
  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const isDark = root.dataset.theme === "dark"; // Standard: hell
      root.dataset.theme = isDark ? "light" : "dark";
      try { localStorage.setItem("eg-theme", root.dataset.theme); } catch (e) {}
    });
  }

  /* Pixel-Board im Hero: zufällig aufleuchtende Kacheln */
  const board = document.querySelector(".pixel-board");
  if (board) {
    // 8x8-Motiv: ein kleiner Pixel-Controller (0 = aus, 1–4 = Farbe)
    const pattern = [
      0,0,0,0,0,0,0,0,
      0,1,1,1,1,1,1,0,
      1,1,4,1,1,2,1,1,
      1,4,4,4,1,1,1,1,
      1,1,4,1,3,1,2,1,
      1,1,1,1,1,1,1,1,
      1,1,0,0,0,0,1,1,
      0,0,0,0,0,0,0,0,
    ];
    pattern.forEach((v) => {
      const cell = document.createElement("span");
      if (v) cell.className = "on-" + v;
      board.appendChild(cell);
    });
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduce) {
      const cells = board.children;
      setInterval(() => {
        const c = cells[Math.floor(Math.random() * cells.length)];
        c.classList.add("blink");
        setTimeout(() => c.classList.remove("blink"), 400);
      }, 350);
    }
  }

  /* Filter + Suche (Unterrichtsmaterialien, Aktuell) */
  const filterBar = document.querySelector("[data-filters]");
  if (filterBar) {
    const chips = filterBar.querySelectorAll(".chip");
    const items = document.querySelectorAll("[data-category]");
    const groups = document.querySelectorAll("[data-group]");
    const search = document.querySelector("[data-search]");
    const empty = document.querySelector(".empty-state");
    let active = "alle";

    const apply = () => {
      const q = (search ? search.value : "").trim().toLowerCase();
      let visible = 0;
      items.forEach((el) => {
        const matchCat = active === "alle" || el.dataset.category === active;
        const matchText = !q || el.textContent.toLowerCase().includes(q);
        const show = matchCat && matchText;
        el.classList.toggle("is-hidden", !show);
        if (show) visible++;
      });
      groups.forEach((g) => {
        const any = g.querySelector("[data-category]:not(.is-hidden)");
        g.classList.toggle("is-hidden", !any);
      });
      if (empty) empty.classList.toggle("is-hidden", visible > 0);
      collapse();
    };

    /* Bei «Alle» ohne Suche: pro Lernbereich nur 2 Reihen, Rest per «Mehr anzeigen» */
    const areas = document.querySelectorAll(".area[id]");
    const expanded = {};
    function collapse() {
      const q = (search ? search.value : "").trim();
      const limitOn = active === "alle" && !q;
      areas.forEach((area) => {
        const cards = Array.from(area.querySelectorAll("[data-category]"));
        const subgroups = area.querySelectorAll("div[data-group]");
        cards.forEach((c) => c.classList.remove("is-collapsed"));
        subgroups.forEach((g) => g.classList.remove("is-collapsed"));
        const grid = area.querySelector(".grid");
        const cols = grid ? getComputedStyle(grid).gridTemplateColumns.split(" ").filter(Boolean).length : 3;
        const extra = cards.slice(cols * 2);

        let btn = area.querySelector(".more-btn");
        if (!btn && extra.length) {
          btn = document.createElement("button");
          btn.type = "button";
          btn.className = "more-btn";
          btn.addEventListener("click", () => {
            expanded[area.id] = !expanded[area.id];
            collapse();
            if (!expanded[area.id]) area.scrollIntoView({ behavior: "smooth", block: "start" });
          });
          area.appendChild(btn);
        }
        if (!btn) return;
        btn.hidden = !limitOn || !extra.length;
        if (btn.hidden) return;

        if (expanded[area.id]) {
          btn.innerHTML = 'Weniger anzeigen <span aria-hidden="true">↑</span>';
          btn.setAttribute("aria-expanded", "true");
          return;
        }
        extra.forEach((c) => c.classList.add("is-collapsed"));
        subgroups.forEach((g) => {
          if (!g.querySelector("[data-category]:not(.is-collapsed)")) g.classList.add("is-collapsed");
        });
        btn.innerHTML = "Mehr anzeigen (" + extra.length + ') <span aria-hidden="true">↓</span>';
        btn.setAttribute("aria-expanded", "false");
      });
    }
    let resizeTimer;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(collapse, 150); });
    collapse();

    /* Suchfeld: Beispielbegriffe wechseln alle 5 s (Tipp-Animation) */
    if (search) {
      const TERMS = ["Orbit Cleaner", "Scratch", "Fake News", "Altersfreigaben", "Weltkrieg",
        "Programmieren", "Gamesucht", "Tastaturschreiben", "Prompt", "Fortnite"];
      const PREFIX = "Suchen, z.\u00a0B. ";
      const reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      let term = "Orbit Cleaner";
      let timer = null;
      let paused = false;
      const show = (t) => { if (!paused) search.placeholder = PREFIX + t; };
      const pick = () => {
        const options = TERMS.filter((t) => t !== term);
        return options[Math.floor(Math.random() * options.length)];
      };
      const step = (fn, ms) => { timer = setTimeout(fn, ms); };
      function cycle() {
        step(() => {
          if (paused) return;
          const next = pick();
          if (reduce) { term = next; show(term); cycle(); return; }
          let cur = term;
          (function erase() {
            if (paused) return;
            if (cur.length) { cur = cur.slice(0, -1); show(cur); step(erase, 55); return; }
            let i = 0;
            step(function type() {
              if (paused) return;
              i++; show(next.slice(0, i));
              if (i < next.length) { step(type, 85 + Math.random() * 60); return; }
              term = next; cycle();
            }, 250);
          })();
        }, 5000);
      }
      const stop = () => { paused = true; clearTimeout(timer); };
      const start = () => { paused = false; clearTimeout(timer); show(term); cycle(); };
      search.addEventListener("focus", () => { stop(); search.placeholder = ""; });
      search.addEventListener("blur", () => { if (!search.value) start(); });
      document.addEventListener("visibilitychange", () => { if (document.hidden) stop(); else if (document.activeElement !== search && !search.value) start(); });
      start();
    }

    chips.forEach((chip) =>
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", "true");
        active = chip.dataset.filter;
        apply();
      })
    );
    const clear = document.querySelector("[data-search-clear]");
    const syncClear = () => { if (clear) clear.hidden = !(search && search.value); };
    /* Achievement «Wer sucht, der/die findet»: Suchbegriff mit mind. 2 Zeichen, kurz stehen gelassen */
    let achTimer;
    const trackSearch = () => {
      clearTimeout(achTimer);
      if (search.value.trim().length < 2) return;
      achTimer = setTimeout(() => { if (window.egAchievements && window.egAchievements.searched) window.egAchievements.searched(); }, 800);
    };
    if (search) search.addEventListener("input", () => { syncClear(); apply(); trackSearch(); });
    if (clear) {
      clear.addEventListener("click", (e) => {
        e.preventDefault();
        search.value = "";
        syncClear(); apply();
        search.focus();
      });
    }

    // Direktlink via #ueber, #design, #gamen
    const hash = location.hash.replace("#", "");
    const preset = filterBar.querySelector('[data-filter="' + hash + '"]');
    if (preset) preset.click();
  }

  /* Einblenden beim Scrollen */
  const reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  } else {
    reveals.forEach((el) => el.classList.add("is-visible"));
  }

  /* Countdown bis zum Hauptevent */
  document.querySelectorAll("[data-countdown]").forEach((el) => {
    const days = Math.ceil((new Date(el.dataset.countdown) - new Date()) / 86400000);
    if (days > 1) el.textContent = "Noch " + days + " Tage";
    else if (days === 1) el.textContent = "Morgen geht's los";
  });

  /* Event-Popup: «Weitere Informationen» */
  const modal = document.querySelector("[data-event-modal]");
  if (modal && typeof modal.showModal === "function") {
    const mTitle = modal.querySelector("[data-modal-title]");
    const mMeta = modal.querySelector("[data-modal-meta]");
    const mBody = modal.querySelector("[data-modal-body]");
    const mBg = modal.querySelector("[data-modal-bg]");

    const openEvent = (tile) => {
      const title = tile.querySelector(".ev-tile__title");
      const bg = tile.querySelector(".ev-tile__bg");
      const tpl = tile.querySelector("template.ev-more");
      mTitle.textContent = title ? title.textContent : "";
      mMeta.innerHTML = "";
      tile.querySelectorAll(".ev-tile__top .tag, .ev-badge").forEach((t) => {
        const c = document.createElement("span");
        c.className = "tag";
        c.textContent = t.textContent;
        mMeta.appendChild(c);
      });
      mBg.style.backgroundImage = bg ? bg.style.backgroundImage : "";
      mBody.innerHTML = "";
      if (tpl) mBody.appendChild(tpl.content.cloneNode(true));
      modal.showModal();
      root.classList.add("modal-open");
      if (tile.id) history.replaceState(null, "", "#" + tile.id);
    };

    document.querySelectorAll("[data-event-open]").forEach((btn) =>
      btn.addEventListener("click", () => openEvent(btn.closest(".ev-tile")))
    );
    modal.querySelector("[data-modal-close]").addEventListener("click", () => modal.close());
    // Klick auf den abgedunkelten Hintergrund schliesst
    modal.addEventListener("click", (e) => { if (e.target === modal) modal.close(); });
    modal.addEventListener("close", () => {
      root.classList.remove("modal-open");
      history.replaceState(null, "", location.pathname + location.search);
    });

    // Direktlink, z. B. events.html#event-game-festival
    let target = null;
    try { target = location.hash && document.querySelector(location.hash + ".ev-tile"); } catch (e) {}
    if (target) openEvent(target);
  }

  /* Startseite: Event-Feed – liest die Kacheln aus events.html und lässt sie nacheinander hereinfliegen */
  const feed = document.querySelector("[data-event-feed]");
  if (feed && window.fetch && window.DOMParser) {
    const stage = feed.querySelector("[data-event-stage]");
    const bar = feed.querySelector("[data-event-progress]");
    const DURATION = 9000; // Anzeigedauer pro Event in ms
    const TICK = 100;

    const readEvents = (doc) =>
      Array.from(doc.querySelectorAll(".ev-tile")).map((tile) => {
        const q = (sel) => tile.querySelector(sel);
        const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
        let date = "";
        if (q(".ev-bigdate")) {
          date = txt(q(".ev-bigdate b")) + " " + txt(q(".ev-bigdate span"));
        } else if (q(".event__date")) {
          const day = txt(q(".event__date b"));
          date = /\d/.test(day) ? day + ". " + txt(q(".event__date small")) : "Datum folgt";
        }
        const tag = txt(q(".ev-tile__top .tag")) || txt(q(".event__info .tag"));
        const bgEl = q(".ev-tile__bg");
        const m = bgEl && (bgEl.getAttribute("style") || "").match(/url\(['"]?([^'")]+)['"]?\)/);
        return {
          id: tile.id,
          title: txt(q(".ev-tile__title")),
          meta: [date, tag].filter(Boolean).join(" · "),
          main: !!q(".ev-badge"),
          bg: m ? m[1] : ""
        };
      }).filter((e) => e.title);

    const build = (ev) => {
      const a = document.createElement("a");
      a.className = "ev-feed__item";
      a.href = "events.html" + (ev.id ? "#" + ev.id : "");
      const thumb = document.createElement("span");
      thumb.className = "ev-feed__thumb";
      thumb.setAttribute("aria-hidden", "true");
      if (ev.bg) thumb.style.backgroundImage = "url('" + ev.bg + "')";
      const text = document.createElement("span");
      text.className = "ev-feed__text";
      const meta = document.createElement("span");
      meta.className = "ev-feed__meta";
      meta.textContent = (ev.main ? "★ " : "") + ev.meta;
      const title = document.createElement("span");
      title.className = "ev-feed__title";
      title.textContent = ev.title;
      text.append(meta, title);
      a.append(thumb, text);
      return a;
    };

    fetch("events.html")
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((html) => {
        const events = readEvents(new DOMParser().parseFromString(html, "text/html"));
        if (!events.length) return;
        let i = 0, elapsed = 0, paused = false;

        const show = (ev) => {
          stage.querySelectorAll(".ev-feed__item").forEach((old) => {
            old.classList.remove("is-in");
            old.classList.add("is-out");
            old.setAttribute("aria-hidden", "true");
            old.tabIndex = -1;
            setTimeout(() => old.remove(), 500);
          });
          const item = build(ev);
          item.classList.add("is-in");
          stage.appendChild(item);
        };

        show(events[0]);
        if (events.length < 2) return;

        // Pause, solange Maus oder Tastaturfokus im Kasten ist
        feed.addEventListener("mouseenter", () => (paused = true));
        feed.addEventListener("mouseleave", () => (paused = false));
        feed.addEventListener("focusin", () => (paused = true));
        feed.addEventListener("focusout", () => (paused = false));

        setInterval(() => {
          if (paused || document.hidden) return;
          elapsed += TICK;
          if (elapsed >= DURATION) {
            elapsed = 0;
            i = (i + 1) % events.length;
            show(events[i]);
          }
          if (bar) bar.style.transform = "scaleX(" + elapsed / DURATION + ")";
        }, TICK);
      })
      .catch(() => { /* z. B. lokal per Doppelklick geöffnet: Platzhaltertext bleibt stehen */ });
  }

  /* Jahr im Footer */
  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();
})();
