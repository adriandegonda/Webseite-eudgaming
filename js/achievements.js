/* eduGaming.ch – versteckte Achievements
   Fortschritt wird nur im Browser gespeichert (localStorage, Schlüssel «eg-achievements»).
   Auf allen Seiten einbinden, VOR main.js und runner.js. */
(function () {
  "use strict";

  // Basis-URL der Website (funktioniert auch aus Unterordnern wie materialien/)
  const BASE = document.currentScript ? new URL("../", document.currentScript.src).href : "";

  const KEY = "eg-achievements";
  let state = { catBest: 0, clicks: 0, newsClear: false, searched: false };
  try { state = Object.assign(state, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} };

  const CAT_ICON = '<svg viewBox="0 0 48 36" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" d="M32 0h4v4h-4zM44 0h4v4h-4zM0 4h4v4h-4zM32 4h4v4h-4zM36 4h4v4h-4zM40 4h4v4h-4zM44 4h4v4h-4zM0 8h4v4h-4zM32 8h4v4h-4zM36 8h4v4h-4zM44 8h4v4h-4zM0 12h4v4h-4zM32 12h4v4h-4zM36 12h4v4h-4zM40 12h4v4h-4zM44 12h4v4h-4zM4 16h4v4h-4zM8 16h4v4h-4zM12 16h4v4h-4zM16 16h4v4h-4zM20 16h4v4h-4zM24 16h4v4h-4zM28 16h4v4h-4zM32 16h4v4h-4zM36 16h4v4h-4zM8 20h4v4h-4zM12 20h4v4h-4zM16 20h4v4h-4zM20 20h4v4h-4zM24 20h4v4h-4zM28 20h4v4h-4zM32 20h4v4h-4zM36 20h4v4h-4zM8 24h4v4h-4zM12 24h4v4h-4zM16 24h4v4h-4zM20 24h4v4h-4zM24 24h4v4h-4zM28 24h4v4h-4zM32 24h4v4h-4zM36 24h4v4h-4zM8 28h4v4h-4zM16 28h4v4h-4zM28 28h4v4h-4zM36 28h4v4h-4zM8 32h4v4h-4zM16 32h4v4h-4zM28 32h4v4h-4zM36 32h4v4h-4z"/></svg>';
  const PIXEL_ICON = '<svg viewBox="0 0 30 30" shape-rendering="crispEdges" aria-hidden="true"><path fill="currentColor" opacity=".35" d="M0 0h8v8H0zM11 0h8v8h-8zM22 0h8v8h-8zM0 11h8v8H0zM22 11h8v8h-8zM0 22h8v8H0zM11 22h8v8h-8zM22 22h8v8h-8z"/><path fill="var(--c-design)" d="M11 11h8v8h-8z"/></svg>';
  const NEWS_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5h12v14H6a2 2 0 0 1-2-2V5zM16 9h4v8a2 2 0 0 1-2 2h-2"/><path d="m7.5 12 2 2 3.5-4"/></svg>';
  const SEARCH_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/><path d="m8 10.5 1.8 1.8 3.2-3.6"/></svg>';
  const TROPHY = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4zM7 6H4v1a3 3 0 0 0 3 3M17 6h3v1a3 3 0 0 1-3 3"/></svg>';

  const fmt = (n) => Math.floor(n).toLocaleString("de-CH");

  /* Definitionen: level(state) → erreichte Stufe (0 = noch versteckt) */
  const ACHIEVEMENTS = [
    {
      id: "cat",
      name: "Spring, Katze!",
      icon: CAT_ICON,
      rule: "Pro 100 Punkte im Katzen-Spiel auf der Startseite gibt es eine neue Stufe.",
      level: (s) => Math.floor(s.catBest / 100),
      threshold: (l) => l * 100,
      value: (s) => s.catBest,
      unit: "Punkte (Rekord)"
    },
    {
      id: "pixel",
      name: "Klickrausch",
      icon: PIXEL_ICON,
      rule: "Klicks auf die orangen Pixel: Stufe 1 bei 10, Stufe 2 bei 100, Stufe 3 bei 1000 Klicks usw.",
      level: (s) => (s.clicks >= 10 ? String(Math.floor(s.clicks)).length - 1 : 0),
      threshold: (l) => Math.pow(10, l),
      value: (s) => s.clicks,
      unit: "Klicks"
    },
    /* Noch nicht freischaltbar: Platzhalter für künftige Achievements.
       Zum Aktivieren name, icon, rule, level, threshold, value und unit wie oben ergänzen. */
    {
      id: "news",
      name: "Clean Desk",
      icon: NEWS_ICON,
      rule: "Du hast keine ungelesenen News.",
      level: (s) => (s.newsClear ? 1 : 0),
      maxLevel: 1
    },
    {
      id: "search",
      name: "Wer sucht, der/die findet",
      icon: SEARCH_ICON,
      rule: "Du hast bei den Unterrichtsmaterialien eine Suche durchgeführt.",
      level: (s) => (s.searched ? 1 : 0),
      maxLevel: 1
    },
    { id: "secret-3", level: () => 0 },
    { id: "secret-4", level: () => 0 },
    { id: "secret-5", level: () => 0 }
  ];
  const levels = () => Object.fromEntries(ACHIEVEMENTS.map((a) => [a.id, a.level(state)]));
  let known = levels();

  /* Banner oben in der Mitte */
  let toastWrap = null, toastTimer = null;
  const queue = [];
  function showNext() {
    if (toastTimer || !queue.length) return;
    const { a, level } = queue.shift();
    if (!toastWrap) {
      toastWrap = document.createElement("div");
      toastWrap.className = "ach-toast-wrap";
      toastWrap.setAttribute("role", "status");
      document.body.appendChild(toastWrap);
    }
    toastWrap.innerHTML = "";
    const t = document.createElement("a");
    t.className = "ach-toast";
    t.href = BASE + "achievements.html#ach-" + a.id;
    t.innerHTML = '<span class="ach-toast__icon">' + TROPHY + '</span><span class="ach-toast__text"><small>' +
      (level === 1 ? "Achievement freigeschaltet" : "Neue Stufe erreicht") + "</small><b></b></span>";
    t.querySelector("b").textContent = a.maxLevel === 1 ? a.name : a.name + " · Stufe " + level;
    toastWrap.appendChild(t);
    toastTimer = setTimeout(() => {
      t.classList.add("is-out");
      setTimeout(() => { t.remove(); toastTimer = null; showNext(); }, 350);
    }, 5000);
  }
  function check() {
    const now = levels();
    ACHIEVEMENTS.forEach((a) => {
      for (let l = known[a.id] + 1; l <= now[a.id]; l++) queue.push({ a, level: l });
    });
    known = now;
    save();
    showNext();
  }

  /* Schnittstelle für runner.js */
  let lastSaved = state.catBest;
  window.egAchievements = {
    searched() {
      if (state.searched) return;
      state.searched = true;
      check();
    },
    newsCleared() {
      if (state.newsClear) return;
      state.newsClear = true;
      check();
    },
    catScore(score) {
      if (score <= state.catBest) return;
      state.catBest = Math.floor(score);
      if (Math.floor(state.catBest / 100) > known.cat) check();
      else if (state.catBest - lastSaved >= 10) { lastSaved = state.catBest; save(); }
    }
  };

  /* Klicks auf orange Pixel (Pixel-Board der Startseite) */
  document.addEventListener("click", (e) => {
    const cell = e.target.closest && e.target.closest(".pixel-board .on-2");
    if (!cell) return;
    state.clicks++;
    cell.classList.remove("poke");
    void cell.offsetWidth; // Animation neu starten
    cell.classList.add("poke");
    check();
  });

  /* Achievements-Seite */
  function renderPage() {
    const list = document.querySelector("[data-ach-list]");
    if (!list) return;
    list.innerHTML = "";
    ACHIEVEMENTS.forEach((a) => {
      const level = a.level(state);
      const card = document.createElement("article");
      card.id = "ach-" + a.id;
      if (!level) {
        card.className = "ach-card ach-card--locked";
        card.title = "Dieses Achievement ist noch nicht entdeckt.";
        card.innerHTML = '<div class="ach-card__head"><div class="ach-card__icon">?</div><div class="ach-card__body">' +
          '<span class="ach-card__level">Versteckt</span><h2 class="ach-card__name">???</h2></div></div>';
      } else if (a.maxLevel && level >= a.maxLevel) {
        card.className = "ach-card";
        card.title = a.rule;
        card.innerHTML = '<div class="ach-card__head"><div class="ach-card__icon">' + a.icon + '</div><div class="ach-card__body">' +
          '<span class="ach-card__level">Erreicht</span><h2 class="ach-card__name"></h2></div></div>' +
          '<p class="ach-card__stat"></p>';
        card.querySelector(".ach-card__name").textContent = a.name;
        card.querySelector(".ach-card__stat").textContent = a.rule;
      } else {
        const value = a.value(state), from = a.threshold(level), to = a.threshold(level + 1);
        const pct = Math.max(0, Math.min(100, ((value - from) / (to - from)) * 100));
        card.className = "ach-card";
        card.title = a.rule; // Regel als Tooltip, damit die Kachel kompakt bleibt
        card.innerHTML = '<div class="ach-card__head"><div class="ach-card__icon">' + a.icon + '</div><div class="ach-card__body">' +
          '<span class="ach-card__level">Stufe ' + level + '</span><h2 class="ach-card__name"></h2></div></div>' +
          '<div class="ach-card__bar" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + Math.round(pct) + '" aria-label="Fortschritt bis Stufe ' + (level + 1) + '"><span style="width:' + pct + '%"></span></div>' +
          '<p class="ach-card__stat">' + fmt(value) + " / " + fmt(to) + " " + a.unit + "</p>";
        card.querySelector(".ach-card__name").textContent = a.name;
      }
      list.appendChild(card);
    });
    const count = document.querySelector("[data-ach-count]");
    if (count) {
      const found = ACHIEVEMENTS.filter((a) => a.level(state) > 0).length;
      count.textContent = found + " von " + ACHIEVEMENTS.length + " entdeckt";
    }
  }

  const reset = document.querySelector("[data-ach-reset]");
  if (reset) {
    reset.addEventListener("click", () => {
      if (!confirm("Alle Achievements in diesem Browser zurücksetzen?")) return;
      state = { catBest: 0, clicks: 0, newsClear: false, searched: false };
      known = levels();
      save();
      renderPage();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", renderPage);
  else renderPage();
})();
