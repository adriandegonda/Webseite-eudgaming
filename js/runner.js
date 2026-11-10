/* eduGaming.ch – Mini-Game auf der Startseite
   Eine Pixel-Katze läuft gemächlich an Ort über dem Laufband. Pfeil nach oben (oder Tippen) = Sprung.
   Nach dem ersten Sprung kommen Hindernisse; bei einem Treffer läuft sie einfach wieder langsam weiter. */
(function () {
  "use strict";

  const stage = document.querySelector("[data-runner]");
  if (!stage) return;
  const hero = stage.querySelector("[data-runner-hero]");
  const scoreBox = stage.querySelector("[data-runner-score]");
  const scoreEl = scoreBox.querySelector("b");
  const hiEl = stage.querySelector("[data-runner-hi]");
  const marquee = document.querySelector(".marquee");

  // Physik (Pixel, Sekunden)
  const GRAVITY = 2000;
  const JUMP_V = 650;
  const HERO_W = 36;

  let state = "idle";          // "idle" | "running"
  let y = 0, vy = 0;           // Höhe über Boden
  let heroX = 40;
  let speed = 0, score = 0, spawnIn = 0;
  let obstacles = [];
  let lockUntil = 0;           // kurze Pause nach einem Treffer
  let last = performance.now();
  let hi = 0;
  try { hi = parseInt(localStorage.getItem("eg-runner-hi") || "0", 10) || 0; } catch (e) {}
  hiEl.textContent = pad(hi);

  function pad(n) { return String(Math.floor(n)).padStart(4, "0"); }

  function layout() {
    const ref = document.querySelector(".hero .container");
    if (ref) {
      const r = ref.getBoundingClientRect();
      heroX = r.left + parseFloat(getComputedStyle(ref).paddingLeft);
    }
    hero.style.left = heroX + "px";
  }
  window.addEventListener("resize", layout);
  layout();

  function setPose(p) {
    hero.classList.toggle("is-idle", p === "idle");
    hero.classList.toggle("is-running", p === "running");
    hero.classList.toggle("is-jumping", p === "jumping");
  }
  setPose("idle");

  function jump() {
    if (performance.now() < lockUntil) return;
    if (y > 0.5) return;                 // nur vom Boden aus
    vy = JUMP_V;
    if (state === "idle") start();
  }

  function start() {
    state = "running";
    score = 0;
    speed = Math.min(Math.max(stage.clientWidth * 0.34, 300), 480);
    spawnIn = 0.9;
    scoreBox.hidden = false;
    stage.classList.add("is-playing");
  }

  function crash() {
    state = "idle";
    lockUntil = performance.now() + 700;
    // Hindernisse sanft ausblenden statt «Game over»
    obstacles.forEach((o) => {
      o.el.classList.add("is-gone");
      setTimeout(() => o.el.remove(), 500);
    });
    obstacles = [];
    if (score > hi) {
      hi = score;
      hiEl.textContent = pad(hi);
      try { localStorage.setItem("eg-runner-hi", String(Math.floor(hi))); } catch (e) {}
    }
    stage.classList.remove("is-playing");
    setTimeout(() => { if (state === "idle") scoreBox.hidden = true; }, 1600);
  }

  function spawn() {
    const el = document.createElement("span");
    el.className = "runner__block";
    // 1–2 Pixel breit, 1–3 Pixel hoch (Raster 14px)
    const w = 14 * (1 + Math.floor(Math.random() * 2));
    const h = 14 * (1 + Math.floor(Math.random() * 3));
    el.style.width = w + "px";
    el.style.height = h + "px";
    stage.appendChild(el);
    obstacles.push({ el, x: stage.clientWidth + 10, w, h });
  }

  function hits(o) {
    const pad = 4; // etwas Toleranz
    const hx1 = heroX + 2 + pad, hx2 = heroX + HERO_W - 2 - pad;
    const ox1 = o.x, ox2 = o.x + o.w;
    return hx2 > ox1 && hx1 < ox2 && y < o.h - 3;
  }

  function frame(now) {
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    // Sprungphysik
    if (y > 0 || vy > 0) {
      vy -= GRAVITY * dt;
      y = Math.max(0, y + vy * dt);
      if (y === 0) vy = 0;
    }

    if (state === "running") {
      speed += 9 * dt;
      score += dt * 10;
      scoreEl.textContent = pad(score);
      if (window.egAchievements) window.egAchievements.catScore(score);
      spawnIn -= dt;
      if (spawnIn <= 0) {
        spawn();
        spawnIn = (0.75 + Math.random() * 1.1) * Math.sqrt(380 / speed);
      }
      for (let i = obstacles.length - 1; i >= 0; i--) {
        const o = obstacles[i];
        o.x -= speed * dt;
        o.el.style.transform = "translateX(" + o.x + "px)";
        if (o.x + o.w < -20) { o.el.remove(); obstacles.splice(i, 1); continue; }
        if (hits(o)) { crash(); break; }
      }
    }

    setPose(y > 0 ? "jumping" : state === "running" ? "running" : "idle");
    hero.style.transform = "translateY(" + (-y) + "px)";
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Eingabe
  document.addEventListener("keydown", (e) => {
    if (e.key !== "ArrowUp" || e.repeat) return;
    const t = e.target;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    e.preventDefault();
    jump();
  });
  [stage, marquee].forEach((el) => el && el.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    jump();
  }));
})();
