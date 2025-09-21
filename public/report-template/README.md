# Client Report Template

A standalone, shareable HTML report that mirrors the look-and-feel in the screenshots: left navigation with counts and active highlighting, right content with a cover, view toggles (Full Report / Summary), per-section defect cards, and image zoom.

## Where

- Path: `public/report-template`
- Entry: `index.html`

## How to open

- When running the Next app locally, open: http://localhost:3000/report-template
- Or open `public/report-template/index.html` directly in a browser (served as static file by Next).

## Customize data

- Edit `script.js` and replace the `reportData` object with your real payload.
- Fields:
  - `cover`: { address, cityState, time, image, inspector: { name, meta, avatar } }
  - `sections[]`: { id, title, defects[] }
  - `defects[]`: { title, description, location, image }

## Features

- Left nav with per-section defect counts; click-to-scroll; active section highlight.
- Cover header with property and inspector info; Full/Summary toggles.
- Defect cards with image, title/numbering, location, and description.
- Click-to-zoom image modal with ESC/overlay close.

## Notes

- Style tokens are themable via `styles.css` root variables.
- You can embed this page in other contexts or export as PDF via the browser’s Print dialog.
