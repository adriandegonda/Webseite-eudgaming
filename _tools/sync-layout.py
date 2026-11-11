#!/usr/bin/env python3
"""
eduGaming.ch – gemeinsame Seitenteile synchronisieren

Kopfbereich (<head>), Header mit Navigation, Footer und Script-Tags sind auf
allen Seiten gleich. Sie werden hier EINMAL gepflegt und mit diesem Skript in
alle HTML-Dateien geschrieben:

    python3 _tools/sync-layout.py

Pro Seite bleiben erhalten: <title>, <meta name="description"> und alles
innerhalb von <main>. Die Startseite (index.html) behält ihre schlanke
Fusszeile und lädt zusätzlich js/runner.js.

Neue Seite anlegen: eine bestehende Seite kopieren, Titel/Beschreibung und
<main> anpassen, bei Bedarf unten in NAV_CURRENT eintragen, Skript ausführen.

Ordner mit «_» am Anfang werden von GitHub Pages nicht veröffentlicht.
"""
import glob
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# Seiten, die nicht angepasst werden (z. B. reine Weiterleitungen)
SKIP = {"materialien/wissenschaft.html"}

# Hauptnavigation: (Datei, Beschriftung, Zusatzattribute)
NAV = [
    ("news.html", "News", " data-news-link"),
    ("events.html", "Events", ""),
    ("unterrichtsmaterialien.html", "Unterrichtsmaterialien", ""),
    ("forschung.html", "Forschung", ""),
]

# Welcher Navigationspunkt ist auf welcher Seite aktiv?
NAV_CURRENT = {
    "news.html": "news.html",
    "events.html": "events.html",
    "materialien/kurse.html": "events.html",
    "unterrichtsmaterialien.html": "unterrichtsmaterialien.html",
    "materialien/*": "unterrichtsmaterialien.html",
    "forschung.html": "forschung.html",
}

HEAD = """  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
{title}
{description}
  <script>try{{var t=localStorage.getItem("eg-theme");if(t)document.documentElement.dataset.theme=t}}catch(e){{}}</script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,600;12..96,700;12..96,800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <link rel="icon" href="{p}favicon.ico" sizes="any">
  <link rel="icon" href="{p}favicon.svg" type="image/svg+xml">
  <link rel="apple-touch-icon" href="{p}apple-touch-icon.png">
  <link rel="stylesheet" href="{p}css/style.css">
"""

LOGO_MARK = '<span class="logo__mark" aria-hidden="true">' + "<span></span>" * 9 + "</span>"

HEADER = """  <!-- HEADER: wird mit _tools/sync-layout.py gepflegt -->
  <header class="site-header">
    <div class="container">
      <a href="{p}index.html" class="logo" aria-label="eduGaming.ch – Startseite">
        {logo}
        <span>eduGaming<span class="logo__dot">.</span>ch</span>
      </a>
      <nav class="nav" aria-label="Hauptnavigation">
        <ul class="nav__list" id="nav-list">
{nav}
        </ul>
        <button class="theme-toggle" type="button" aria-label="Hell-/Dunkelmodus umschalten">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>
        </button>
        <button class="nav-toggle" type="button" aria-label="Menü öffnen" aria-expanded="false" aria-controls="nav-list">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
      </nav>
    </div>
  </header>"""

FOOTER = """  <!-- FOOTER: wird mit _tools/sync-layout.py gepflegt -->
  <footer class="site-footer">
    <div class="container">
      <div class="footer__grid">
        <div class="footer__brand">
          <a href="{p}index.html" class="logo">
            {logo}
            <span>eduGaming<span class="logo__dot">.</span>ch</span>
          </a>
          <p class="footer__claim">Games und Game Design im Bildungskontext – ein Angebot der Pädagogischen Hochschule Zürich.</p>
        </div>
        <div>
          <h4>Navigation</h4>
          <ul>
            <li><a href="{p}news.html">News</a></li>
            <li><a href="{p}events.html">Events</a></li>
            <li><a href="{p}unterrichtsmaterialien.html">Unterrichtsmaterialien</a></li>
            <li><a href="{p}forschung.html">Forschung</a></li>
          </ul>
        </div>
        <div>
          <h4>Lernbereiche</h4>
          <ul>
            <li><a href="{p}unterrichtsmaterialien.html#gamen">Beim GAMEN lernen</a></li>
            <li><a href="{p}unterrichtsmaterialien.html#design">Mit GAME DESIGN lernen</a></li>
            <li><a href="{p}unterrichtsmaterialien.html#ueber">ÜBER Games lernen</a></li>
          </ul>
        </div>
        <div>
          <h4>Kontakt</h4>
          <address>
            PH Zürich<br>Zentrum Medienbildung und Informatik<br>Lagerstrasse 2, 8090 Zürich<br>
            <a href="tel:+41433056434">+41 43 305 64 34</a><br>
            <a href="mailto:adrian.degonda@phzh.ch">adrian.degonda@phzh.ch</a>
          </address>
        </div>
      </div>
      <div class="footer__bottom">
        <span>© <span data-year>2026</span> PH Zürich</span>
        {legal}
        <a href="#main">Press <span class="kbd">▲</span> to top</a>
      </div>
    </div>
  </footer>"""

MINI_FOOTER = """  <!-- Schlanke Fusszeile nur auf der Startseite (wird mit _tools/sync-layout.py gepflegt) -->
  <footer class="mini-footer">
    <div class="container">
      <span>© <span data-year>2026</span> PH Zürich · Zentrum Medienbildung und Informatik</span>
      {legal}
    </div>
  </footer>"""

LEGAL = ('<span><a href="{p}achievements.html">Achievements</a> · '
         '<a href="mailto:adrian.degonda@phzh.ch">Kontakt</a> · '
         '<a href="{p}impressum.html">Impressum</a></span>')

SCRIPTS = ["js/achievements.js", "js/news.js", "js/main.js"]
SCRIPTS_HOME = SCRIPTS + ["js/runner.js"]


def current_nav(page):
    if page in NAV_CURRENT:
        return NAV_CURRENT[page]
    folder = page.split("/")[0] + "/*" if "/" in page else None
    return NAV_CURRENT.get(folder)


def render(page, html):
    p = "../" * page.count("/")
    is_home = page == "index.html"

    title = re.search(r"^\s*<title>.*?</title>", html, re.M)
    desc = re.search(r'^\s*<meta name="description"[^>]*>', html, re.M)
    if not title:
        raise ValueError("kein <title> gefunden")
    head = HEAD.format(p=p, title=title.group(0), description=desc.group(0) if desc else "").replace("\n\n", "\n")

    cur = current_nav(page)
    nav = "\n".join(
        '          <li><a class="nav__link" href="{p}{f}"{extra}{cur}>{label}</a></li>'.format(
            p=p, f=f, extra=extra, label=label, cur=' aria-current="page"' if f == cur else "")
        for f, label, extra in NAV)
    header = HEADER.format(p=p, logo=LOGO_MARK, nav=nav)
    legal = LEGAL.format(p=p)
    footer = (MINI_FOOTER if is_home else FOOTER).format(p=p, logo=LOGO_MARK, legal=legal)
    scripts = "\n".join('  <script src="{}{}"></script>'.format(p, s) for s in (SCRIPTS_HOME if is_home else SCRIPTS))

    out = re.sub(r"(<head>\n).*?(</head>)", lambda m: m.group(1) + head + m.group(2), html, count=1, flags=re.S)
    out = re.sub(r"[ \t]*(<!--[^\n]*-->\n\s*)?<header class=\"site-header\">.*?</header>", lambda m: header, out, count=1, flags=re.S)
    out = re.sub(r"[ \t]*(<!--[^\n]*-->\n\s*)?<footer class=\"(site|mini)-footer\">.*?</footer>\s*(<script src=\"[^\"]+\"></script>\s*)*(?=</body>)",
                 lambda m: footer + "\n\n" + scripts + "\n", out, count=1, flags=re.S)
    return out


def main():
    check = "--check" in sys.argv
    pages = sorted(glob.glob(os.path.join(ROOT, "*.html")) + glob.glob(os.path.join(ROOT, "materialien", "*.html")))
    changed = []
    for path in pages:
        page = os.path.relpath(path, ROOT).replace(os.sep, "/")
        if page in SKIP:
            continue
        with open(path, encoding="utf-8") as fh:
            html = fh.read()
        new = render(page, html)
        if new != html:
            changed.append(page)
            if not check:
                with open(path, "w", encoding="utf-8") as fh:
                    fh.write(new)
    if check:
        print("Nicht synchron:" if changed else "Alle Seiten synchron.", *changed, sep="\n  ")
        sys.exit(1 if changed else 0)
    print("{} Seite(n) aktualisiert.".format(len(changed)))


if __name__ == "__main__":
    main()
