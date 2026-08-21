# spa-template

A no-build static SPA template: plain ES-module HTML/CSS/JS served from
`web/`, verified end-to-end with Python Playwright, and deployed to GitHub
Pages by CI. No bundler, no Node toolchain — a small Python `http.server`
serves the files locally and pytest runs the browser tests.

## Run locally

```bash
./run.sh          # serves web/ at http://127.0.0.1:8000/
```

Requires [uv](https://docs.astral.sh/uv/) (or set `PYTHON=python3` to use a
plain interpreter — the server has no dependencies).

## Run the e2e tests

```bash
uv sync
uv run playwright install chromium
uv run pytest
```

The tests start the server themselves on a free port; each test gets a
fresh Playwright page.

Every run also produces curated screenshots in `test-results/shots/`
(gitignored, cleared at the start of each run). Tests take the `shot`
fixture and call `shot("name")` at visually meaningful moments; files are
numbered in the order they were taken (`01-home.png`, `02-app-ready.png`,
…), so the directory reads as a visual walkthrough of the suite. Add a
`shot(...)` call whenever a test reaches a state worth seeing.

## Deploy

`.github/workflows/pages.yml` runs the tests, stages `web/` as the site,
and deploys on every push to `main`. Pull requests run the tests and a
build as a check without deploying.

One-time repo setup: in **Settings → Pages**, set the source to
**GitHub Actions**.

## Structure

```
web/            the app (index.html, main.js, styles.css, favicon.svg)
serve.py        minimal static server with ES-module MIME types
run.sh          local entry point
tests/          Playwright e2e tests
conftest.py     pytest fixtures (server on a free port, Chromium fallback)
```

The app exposes `window.__APP.ready` when initialized; the tests wait on
that flag instead of sleeping. Keep the pattern as the app grows — it keeps
the e2e suite fast and deterministic.
