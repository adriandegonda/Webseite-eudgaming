/* eduGaming.ch – News
   Neue News oben in NEWS einfügen (neueste zuerst). Jede News braucht eine eindeutige id.
   Im Text sind Links in der Form [Linktext](URL) möglich.
   Gelesen-Status wird nur im Browser gespeichert (localStorage, Schlüssel «eg-news-read»).
   Auf allen Seiten einbinden (zeigt die Anzahl ungelesener News in der Navigation). */
(function () {
  "use strict";

  const NEWS = [
    {
      id: "2026-11-dizh-ludic-culture-hub",
      date: "2026-11-11",
      title: "DIZH-Strukturcall: Ludic Culture Hub",
      images: [
        { src: "img/news/ludic-culture-hub.png", alt: "Ludic Culture Hub (DIZH)", href: "https://www.dizh.uzh.ch/2026/08/13/ludic-culture-hub/" },
        { src: "img/news/phzh.png", alt: "PH Zürich: Projekt Ludic Culture Hub", href: "https://phzh.ch/ueber-die-phzh/themen-und-taetigkeiten/projekte/ludic-culture-hub/" }
      ],
      text: "Im Rahmen des [DIZH-Strukturcalls «Ludic Culture Hub»](https://www.dizh.uzh.ch/2026/08/13/ludic-culture-hub/) übernimmt die [PH Zürich](https://phzh.ch/ueber-die-phzh/themen-und-taetigkeiten/projekte/ludic-culture-hub/) die Perspektive der Ludic Education. Dabei wird ein «Game Design Festival der Schule» lanciert, an dem Schüler:innen und Lehrpersonen ihre Spiele vorstellen können. Weitere Informationen folgen im Januar 2027.",
      links: [
        { label: "Zum Event", href: "events.html#event-game-festival" },
        { label: "Mehr zum Projekt", href: "forschung.html#ludic-culture-hub" }
      ]
    },
    {
      id: "2026-11-newsletter",
      date: "2026-11-10",
      title: "Newsletter abonnieren",
      text: "Melde dich jetzt für den Newsletter an: Zweimal pro Jahr informiert er über die neusten Entwicklungen im Bereich Games und Schule.",
      links: [
        { label: "Jetzt anmelden", href: "mailto:adrian.degonda@phzh.ch?subject=Newsletter%20edugaming.ch&body=Gerne%20melde%20ich%20mich%20f%C3%BCr%20den%20Newsletter%20von%20edugaming.ch%20an." }
      ]
    },
    {
      id: "2026-11-neue-website",
      date: "2026-11-09",
      title: "Neue Website lanciert",
      text: "eduGaming.ch hat ein neues Kleid: Unterrichtsmaterialien, Events und News rund um Games im Unterricht – übersichtlich an einem Ort und auch auf dem Handy gut lesbar.",
      links: [
        { label: "Zu den Unterrichtsmaterialien", href: "unterrichtsmaterialien.html" }
      ]
    }
  ];

  const KEY = "eg-news-read";
  const BASE = document.currentScript ? new URL("../", document.currentScript.src).href : "";
  let read = [];
  try { read = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) {}
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(read)); } catch (e) {} };
  const isRead = (id) => read.includes(id);
  const unreadCount = () => NEWS.filter((n) => !isRead(n.id)).length;

  /* Achievement «Clean Desk», sobald alle News gelesen sind */
  function checkAchievement() {
    if (unreadCount() === 0 && window.egAchievements && window.egAchievements.newsCleared) {
      window.egAchievements.newsCleared();
    }
  }

  /* Zähler in der Navigation */
  function updateBadges() {
    checkAchievement();
    const count = unreadCount();
    document.querySelectorAll("[data-news-link]").forEach((link) => {
      let badge = link.querySelector(".nav__badge");
      if (!count) { if (badge) badge.remove(); link.removeAttribute("aria-label"); return; }
      if (!badge) {
        badge = document.createElement("span");
        badge.className = "nav__badge";
        badge.setAttribute("aria-hidden", "true");
        link.appendChild(badge);
      }
      badge.textContent = count;
      link.setAttribute("aria-label", "News (" + count + " ungelesen)");
    });
  }

  /* News-Seite */
  const fmtDate = (iso) => {
    const [y, m, d] = iso.split("-");
    return d + "." + m + "." + y;
  };
  const absolute = (href) => (/^(https?:|mailto:|#)/.test(href) ? href : BASE + href);

  function renderList() {
    const list = document.querySelector("[data-news-list]");
    if (!list) return;
    list.innerHTML = "";
    NEWS.forEach((n) => {
      const item = document.createElement("article");
      item.className = "news-item" + (isRead(n.id) ? " is-read" : "");
      item.id = n.id;

      const meta = document.createElement("p");
      meta.className = "news-item__meta";
      const time = document.createElement("time");
      time.dateTime = n.date;
      time.textContent = fmtDate(n.date);
      meta.appendChild(time);
      if (!isRead(n.id)) {
        const neu = document.createElement("span");
        neu.className = "news-item__new";
        neu.textContent = "Neu";
        meta.appendChild(neu);
      }

      const h = document.createElement("h2");
      h.className = "news-item__title";
      h.textContent = n.title;

      const p = document.createElement("p");
      p.className = "news-item__text";
      appendRich(p, n.text);

      const foot = document.createElement("div");
      foot.className = "news-item__foot";
      (n.links || []).forEach((l) => {
        const a = document.createElement("a");
        a.className = "news-item__link";
        a.href = absolute(l.href);
        a.textContent = l.label;
        if (/^https?:/.test(l.href)) { a.target = "_blank"; a.rel = "noopener"; }
        foot.appendChild(a);
      });
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "news-item__toggle";
      btn.textContent = isRead(n.id) ? "Als ungelesen markieren" : "Als gelesen markieren";
      btn.addEventListener("click", () => {
        read = isRead(n.id) ? read.filter((x) => x !== n.id) : read.concat(n.id);
        save(); renderList(); updateBadges();
        const again = document.getElementById(n.id);
        if (again) again.querySelector(".news-item__toggle").focus();
      });
      foot.appendChild(btn);

      item.append(meta, h);
      if (n.images && n.images.length) {
        const row = document.createElement("div");
        row.className = "news-item__imgs";
        n.images.forEach((im) => {
          const img = document.createElement("img");
          img.className = "news-item__img";
          img.src = absolute(im.src);
          img.alt = im.alt || "";
          img.loading = "lazy";
          if (im.href) {
            const a = document.createElement("a");
            a.className = "news-item__imglink";
            a.href = absolute(im.href);
            if (/^https?:/.test(im.href)) { a.target = "_blank"; a.rel = "noopener"; }
            a.appendChild(img);
            row.appendChild(a);
          } else {
            row.appendChild(img);
          }
        });
        item.appendChild(row);
      }
      item.append(p, foot);
      list.appendChild(item);
    });

    const all = document.querySelector("[data-news-readall]");
    if (all) all.hidden = unreadCount() === 0;
  }

  const readAll = document.querySelector("[data-news-readall]");
  if (readAll) {
    readAll.addEventListener("click", () => {
      read = Array.from(new Set(read.concat(NEWS.map((n) => n.id))));
      save(); renderList(); updateBadges();
    });
  }

  /* Links im Text: [Linktext](URL) */
  const LINK_RE = /\[([^\]]+)\]\(([^)\s]+)\)/g;
  const plain = (t) => t.replace(LINK_RE, "$1");
  function appendRich(el, t) {
    let last = 0;
    t.replace(LINK_RE, (m, label, href, i) => {
      el.appendChild(document.createTextNode(t.slice(last, i)));
      const a = document.createElement("a");
      a.href = absolute(href);
      a.textContent = label;
      if (/^https?:/.test(href)) { a.target = "_blank"; a.rel = "noopener"; }
      el.appendChild(a);
      last = i + m.length;
      return m;
    });
    el.appendChild(document.createTextNode(t.slice(last)));
  }

  /* Startseite: neuste News im Kasten unter den Events */
  function renderLatest() {
    const item = document.querySelector("[data-news-latest-item]");
    if (!item || !NEWS.length) return;
    const n = NEWS[0];
    item.href = BASE + "news.html#" + n.id;
    item.innerHTML = "";
    const text = document.createElement("span");
    text.className = "ev-feed__text";
    const meta = document.createElement("span");
    meta.className = "ev-feed__meta";
    meta.textContent = fmtDate(n.date) + (isRead(n.id) ? "" : " · Neu");
    const title = document.createElement("span");
    title.className = "ev-feed__title";
    title.textContent = n.title;
    const desc = document.createElement("span");
    desc.className = "ev-feed__desc";
    desc.textContent = plain(n.text);
    text.append(meta, title, desc);
    item.appendChild(text);
  }

  updateBadges();
  renderList();
  renderLatest();
})();
