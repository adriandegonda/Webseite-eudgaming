/* eduGaming.ch – Interaktionen für alle Seiten
   Jede Funktion prüft selbst, ob ihre Elemente auf der Seite vorhanden sind. */
(function () {
  "use strict";

  const root = document.documentElement;
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Mobile Navigation ------------------------------------------------------ */
  function initNav() {
    const toggle = document.querySelector(".nav-toggle");
    const list = document.querySelector(".nav__list");
    if (!toggle || !list) return;
    toggle.addEventListener("click", () => {
      const open = list.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  /* Hell-/Dunkelmodus (Standard hell). Die gespeicherte Wahl setzt bereits
     das kleine Script im <head>, damit die Seite nicht kurz hell aufblitzt. */
  function initTheme() {
    const toggle = document.querySelector(".theme-toggle");
    if (!toggle) return;
    toggle.addEventListener("click", () => {
      root.dataset.theme = root.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem("eg-theme", root.dataset.theme); } catch (e) {}
    });
  }

  /* Startseite: Pixel-Board mit zufällig aufleuchtenden Kacheln ------------ */
  function initPixelBoard() {
    const board = document.querySelector(".pixel-board");
    if (!board) return;
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
    if (reduceMotion) return;
    const cells = board.children;
    setInterval(() => {
      const c = cells[Math.floor(Math.random() * cells.length)];
      c.classList.add("blink");
      setTimeout(() => c.classList.remove("blink"), 400);
    }, 350);
  }

  /* Unterrichtsmaterialien: Filter, Suche, «Mehr anzeigen» ----------------- */
  function initMaterials() {
    const filterBar = document.querySelector("[data-filters]");
    if (!filterBar) return;
    const chips = filterBar.querySelectorAll(".chip");
    const items = document.querySelectorAll("[data-category]");
    const groups = document.querySelectorAll("[data-group]");
    const areas = document.querySelectorAll(".area[id]");
    const search = document.querySelector("[data-search]");
    const clear = document.querySelector("[data-search-clear]");
    const empty = document.querySelector(".empty-state");
    const expanded = {};
    let active = "alle";

    const query = () => (search ? search.value.trim().toLowerCase() : "");

    // Kacheln nach Lernbereich und Suchbegriff ein-/ausblenden
    function apply() {
      const q = query();
      let visible = 0;
      items.forEach((el) => {
        const show = (active === "alle" || el.dataset.category === active) &&
          (!q || el.textContent.toLowerCase().includes(q));
        el.classList.toggle("is-hidden", !show);
        if (show) visible++;
      });
      groups.forEach((g) => g.classList.toggle("is-hidden", !g.querySelector("[data-category]:not(.is-hidden)")));
      if (empty) empty.classList.toggle("is-hidden", visible > 0);
      collapse();
    }

    // Bei «Alle» ohne Suche: pro Lernbereich nur 2 Reihen, Rest per Knopf
    function collapse() {
      const limitOn = active === "alle" && !query();
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

    chips.forEach((chip) =>
      chip.addEventListener("click", () => {
        chips.forEach((c) => c.setAttribute("aria-pressed", "false"));
        chip.setAttribute("aria-pressed", "true");
        active = chip.dataset.filter;
        apply();
      })
    );

    if (search) {
      const syncClear = () => { if (clear) clear.hidden = !search.value; };

      // Achievement «Wer sucht, der findet»: mind. 2 Zeichen, kurz stehen gelassen
      let achTimer;
      const trackSearch = () => {
        clearTimeout(achTimer);
        if (search.value.trim().length < 2) return;
        achTimer = setTimeout(() => {
          if (window.egAchievements && window.egAchievements.searched) window.egAchievements.searched();
        }, 800);
      };

      search.addEventListener("input", () => { syncClear(); apply(); trackSearch(); });
      if (clear) {
        clear.addEventListener("click", (e) => {
          e.preventDefault();
          search.value = "";
          syncClear(); apply();
          search.focus();
        });
      }
      initSearchHints(search);
    }

    let resizeTimer;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(collapse, 150); });
    collapse();

    // Direktlink via #gamen, #design, #ueber
    const preset = filterBar.querySelector('[data-filter="' + location.hash.replace("#", "") + '"]');
    if (preset) preset.click();
  }

  /* Suchfeld: Beispielbegriff wechselt alle 5 s, als würde jemand tippen ---- */
  function initSearchHints(search) {
    const TERMS = ["Orbit Cleaner", "Scratch", "Fake News", "Altersfreigaben", "Weltkrieg",
      "Programmieren", "Gamesucht", "Tastaturschreiben", "Prompt", "Fortnite"];
    const PREFIX = "Suchen, z. B. ";
    let term = TERMS[0];
    let timer = null;
    let paused = false;

    const show = (t) => { if (!paused) search.placeholder = PREFIX + t; };
    const step = (fn, ms) => { timer = setTimeout(fn, ms); };
    const pick = () => {
      const options = TERMS.filter((t) => t !== term);
      return options[Math.floor(Math.random() * options.length)];
    };

    function cycle() {
      step(() => {
        if (paused) return;
        const next = pick();
        if (reduceMotion) { term = next; show(term); cycle(); return; }
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
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) stop();
      else if (document.activeElement !== search && !search.value) start();
    });
    start();
  }

  /* Einblenden beim Scrollen ----------------------------------------------- */
  function initReveal() {
    const reveals = document.querySelectorAll(".reveal");
    if (!("IntersectionObserver" in window)) {
      reveals.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    reveals.forEach((el) => io.observe(el));
  }

  /* Events: Countdown bis zum Hauptevent ----------------------------------- */
  function initCountdown() {
    document.querySelectorAll("[data-countdown]").forEach((el) => {
      const days = Math.ceil((new Date(el.dataset.countdown) - new Date()) / 86400000);
      if (days > 1) el.textContent = "Noch " + days + " Tage";
      else if (days === 1) el.textContent = "Morgen geht's los";
    });
  }

  /* Events: Popup «Weitere Informationen» ---------------------------------- */
  function initEventModal() {
    const modal = document.querySelector("[data-event-modal]");
    if (!modal || typeof modal.showModal !== "function") return;
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

  /* Startseite: Event-Feed – liest die Kacheln aus events.html ------------- */
  function initEventFeed() {
    const feed = document.querySelector("[data-event-feed]");
    if (!feed || !window.fetch || !window.DOMParser) return;
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

    fetch("events.html")
      .then((r) => (r.ok ? r.text() : Promise.reject()))
      .then((html) => {
        const events = readEvents(new DOMParser().parseFromString(html, "text/html"));
        if (!events.length) return;
        show(events[0]);
        if (events.length < 2) return;

        let i = 0, elapsed = 0, paused = false;
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

  /* Jahr im Footer --------------------------------------------------------- */
  function initYear() {
    document.querySelectorAll("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  initNav();
  initTheme();
  initPixelBoard();
  initMaterials();
  initReveal();
  initCountdown();
  initEventModal();
  initEventFeed();
  initYear();
})();
