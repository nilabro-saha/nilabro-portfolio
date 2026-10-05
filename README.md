# Nilabro Saha portfolio

A static, admissions-focused portfolio. The published site is entirely inside `docs/`; no source application PDFs or private records are included.

## Preview and test

From the project root:

```sh
npm run preview
```

Open `http://localhost:4173`. Use an HTTP server rather than opening `index.html` directly, because browser security rules block `config.json` loading from `file://`.

For browser tests:

```sh
npm install
npm test
```

Tests use the locally installed Google Chrome. If Chrome is unavailable, remove `channel: 'chrome'` from `playwright.config.mjs` and install Playwright Chromium with `npx playwright install chromium`.

## Edit content and links

- Edit factual prose and card order in `docs/index.html`. All main content is semantic HTML and remains visible if JavaScript is disabled.
- Edit external evidence and contact URLs in `docs/config.json`. Keys are readable kebab-case identifiers used by `data-link-key` on anchors. A missing, `null`, or non-HTTPS/non-`mailto:` URL hides its anchor. The `full-cv` key is intentionally `null`; no CV button is displayed yet.
- Edit colours, spacing, and motion in `docs/css/tokens.css`. Layout and components are separate from design tokens.
- Project and publication graphics in `docs/assets/illustrations/` are original conceptual SVGs, not laboratory drawings or Springer page reproductions.

## Certificate previews and provenance

Preview WebP images were rendered from the user-supplied prepared-documents folder; original PDFs are not stored in the project. To regenerate locally:

```sh
python3 scripts/render_previews.py --source-dir '/path/to/Prepared Documents'
```

The script requires Pillow and Poppler's `pdftoppm`. It selects pages from `Academic Certificates/Academic-certificates-saha-nilabro.pdf`, `Professional Certificates/Professional-certificates-saha-nilabro.pdf`, `INAE-mentee-saha-nilabro.pdf`, and `OAL-rock-star-saha-nilabro.pdf`. Its crop coordinates and output names are explicit. INAE's approval passage and named appendix row are labelled as **two separate excerpts**; the Oracle award crop stops before the internal nomination and expensing text. Oracle credential IDs are omitted. Do not add the passport, transcript, full application bundles, private email recipient lists, or lab-supplied model imagery to this public site.

## GitHub Pages

The project is ready to publish from the `main` branch's `/docs` directory, with `.nojekyll` included. The repository has not been created or published by this project setup. Before publishing, review all thumbnails and content, decide whether to provide a public full-CV URL, and confirm the desired GitHub account/repository name. The site uses relative asset paths, so it can run under a Pages project path or at a personal root site.
