# anagh

Personal portfolio: RHEL labs, Ansible automation, Bash scripting, and RHCSA (EX200) preparation.

A static site (`index.html` + `404.html`, no build step, no dependencies), hosted on GitHub Pages.

## Preview locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Check before pushing

```bash
npx html-validate index.html 404.html
```

The same check runs on every push via GitHub Actions (`.github/workflows/ci.yml`).

## Deploy

Repo **Settings → Pages → Deploy from a branch → `main` / root**.

## Keep fresh

Update the "Currently" line in `index.html` (and its month) whenever your focus changes.
