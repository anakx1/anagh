# anagh

Personal portfolio: RHEL labs, Ansible automation, Bash scripting, and RHCSA (EX200) preparation.

**Live:** <https://anakx1.github.io/anagh/>
**Contact:** <dev.an9gh@gmail.com>

![Portfolio preview](assets/og-card.png)

A static site with no build step, no dependencies, hosted on GitHub Pages:

- `index.html` — portfolio (hero, about, certifications, skills, projects, contact)
- `lab.html` — interactive EX200 command lab and cheat sheet with category filters and search
- `homelab.html` — KVM lab topology, VM inventory, practice areas, and case studies
- `resume.html` — print-friendly résumé (use “Print / Save as PDF”)
- `404.html` — themed not-found page
- `assets/styles.css`, `assets/site.js` — shared styles and behavior
- `assets/resume.css`, `assets/resume.js` — résumé layout and print action
- `assets/og-card.png`, `assets/icon-*.png` — social preview and app icons
- `site.webmanifest`, `sitemap.xml`, `robots.txt` — install metadata and search indexing
- `scripts/check_links.py` — local link, asset, and anchor checker
- `docs/github-profile-README.md` — ready-to-copy GitHub profile README for `an9gh`
- `docs/github-profile-settings.md` — matching GitHub bio, website, email, and pinned-repo settings
- `docs/github-repo-metadata.md` — repository descriptions, homepages, and topics

## Preview locally

```bash
python3 -m http.server 8000
# portfolio: http://localhost:8000
# command lab: http://localhost:8000/lab.html
# homelab: http://localhost:8000/homelab.html
# résumé: http://localhost:8000/resume.html
```

## Check before pushing

```bash
npx --yes html-validate@11.17.0 index.html lab.html 404.html resume.html homelab.html
node --check assets/site.js && node --check assets/resume.js
python3 scripts/check_links.py index.html lab.html 404.html resume.html homelab.html
python3 -m json.tool site.webmanifest >/dev/null
python3 -c "import xml.etree.ElementTree as ET; ET.parse('sitemap.xml')"
```

Use Node 22+ (html-validate 11 requires it). The same checks run on every push via GitHub Actions (`.github/workflows/ci.yml`).

## GitHub profile

`docs/github-profile-README.md` contains the corrected profile README: RHCSA Rapid Track (RH199) completion, EX200 preparation, RHCE coursework, the portfolio link, and `dev.an9gh@gmail.com`.

To publish it from a machine authenticated as `an9gh`:

```bash
gh auth login
./scripts/publish-github-profile.sh
```

The current SSH key on this machine is authenticated as `anakx1`, so the profile repo must be updated from an `an9gh` session.

## Deploy

Repo **Settings → Pages → Deploy from a branch → `main` / root**.

## Keep fresh

Update the “Currently” line in `index.html` whenever your focus changes. Update the cheat sheet cards in `lab.html` when your command references change. Bump the `<lastmod>` dates in `sitemap.xml` when the main pages change. Keep `docs/github-profile-README.md` in sync with the site.
