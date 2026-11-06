# anagh

Personal portfolio: RHEL labs, Ansible automation, Bash scripting, and RHCSA (EX200) preparation.

**Live:** <https://anakx1.github.io/anagh/>

![Portfolio preview](assets/og-card.png)

A static site with no build step, no dependencies, hosted on GitHub Pages:

- `index.html` — portfolio (hero, certifications, skills, projects, contact)
- `lab.html` — interactive EX200 command lab and cheat sheet
- `404.html` — themed not-found page
- `assets/styles.css`, `assets/site.js` — shared styles and behavior
- `assets/og-card.png`, `assets/icon-*.png` — social preview and app icons
- `site.webmanifest`, `sitemap.xml`, `robots.txt` — install metadata and search indexing

## Preview locally

```bash
python3 -m http.server 8000
# portfolio: http://localhost:8000
# command lab: http://localhost:8000/lab.html
```

## Check before pushing

```bash
npx --yes html-validate@11.17.0 index.html lab.html 404.html
```

Use Node 22+ (html-validate 11 requires it). The same check runs on every push via GitHub Actions (`.github/workflows/ci.yml`).

## Deploy

Repo **Settings → Pages → Deploy from a branch → `main` / root**.

## Keep fresh

Update the "Currently" line in `index.html` (and its month) whenever your focus changes. Update the cheat sheet cards in `lab.html` when your command references change. Bump the `<lastmod>` dates in `sitemap.xml` when the main pages change.
