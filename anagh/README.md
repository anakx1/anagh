# anagh

Personal portfolio: RHEL labs, Ansible automation, Bash scripting, and RHCSA (EX200) preparation.

A static site with no build step, no dependencies, hosted on GitHub Pages:

- `index.html` — portfolio (hero, certifications, skills, projects, contact)
- `lab.html` — interactive EX200 command lab and cheat sheet
- `404.html` — themed not-found page
- `assets/styles.css`, `assets/site.js` — shared styles and behavior

## Preview locally

```bash
python3 -m http.server 8000
# portfolio: http://localhost:8000
# command lab: http://localhost:8000/lab.html
```

## Check before pushing

```bash
npx html-validate index.html lab.html 404.html
```

Use Node 22+ (html-validate 11 requires it). The same check runs on every push via GitHub Actions (`.github/workflows/ci.yml`).

## Deploy

Repo **Settings → Pages → Deploy from a branch → `main` / root**.

## Keep fresh

Update the "Currently" line in `index.html` (and its month) whenever your focus changes. Update the cheat sheet cards in `lab.html` when your command references change.
