# CLAUDE.md — BSides Berlin Website

This file provides guidance for AI assistants working on this repository.

## Project Overview

This is the official website for **BSides Berlin**, a community-run security conference. The site is a **static HTML website** deployed via GitHub Pages to the custom domain `bsides.berlin`. There is no build step — every file pushed to `main` goes live immediately.

The site is based on the **TheEvent v4.10.0** template from BootstrapMade (commercial license). Sass sources are not included (pro-version only), so all CSS changes must be made directly in `assets/css/style.css`.

## Repository Structure

```
/
├── index.html                  # Main landing page (single-page design)
├── speaker-details.html        # Unused speaker page template
├── [FirstName]_[LastName].html # Individual speaker detail pages (one per speaker)
├── CNAME                       # Custom domain: bsides.berlin
├── site.webmanifest            # PWA manifest
├── changelog.txt               # TheEvent template version history
├── archive/                    # Previous years' full websites
│   ├── index.html              # Archive year-selection page
│   ├── 2021/
│   ├── 2022/
│   └── 2023/                   # Each year: index.html + per-speaker HTML files
└── assets/
    ├── css/style.css           # Main stylesheet (edit this directly — no Sass)
    ├── js/main.js              # Custom application JS (vanilla ES6, no jQuery)
    ├── img/
    │   ├── speakers/           # Speaker headshots
    │   ├── sponsors/           # Sponsor logos
    │   ├── committee/          # Review committee member photos
    │   ├── logo.png / logo.svg
    │   └── hero-bg.jpg, about-bg.jpg, venue-info-bg.jpg
    ├── vendor/                 # Bundled third-party libraries (do not modify)
    │   ├── aos/                # Animate On Scroll
    │   ├── bootstrap/          # Bootstrap 5.2.3
    │   ├── glightbox/          # Lightbox/modal gallery
    │   ├── swiper/             # Touch slider/carousel
    │   └── php-email-form/     # Server-side form validation
    └── BSidesBerlin2024_Sponsorship_Packages.pdf
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| HTML | HTML5, semantic sections |
| CSS | CSS3 compiled from Bootstrap 5.2.3 + custom `style.css` |
| JavaScript | Vanilla ES6 (no jQuery since template v4.0.0) |
| UI Framework | Bootstrap 5.2.3 |
| Icons | Bootstrap Icons v1.11.3 (CDN: `cdn.jsdelivr.net`) |
| Fonts | Google Fonts: Open Sans + Raleway |
| Animations | AOS (Animate On Scroll) |
| Gallery | Swiper.js (carousel) + GLightbox (lightbox modal) |
| Deployment | GitHub Pages (automatic on push to `main`) |
| Domain | `bsides.berlin` via CNAME |

## Development Workflow

### No build process

There is **no npm, no bundler, no Jekyll, no static site generator**. Edit HTML/CSS/JS files directly and push.

### Local preview

Open any `.html` file in a browser directly, or serve with a simple HTTP server to avoid CORS issues with assets:

```bash
python3 -m http.server 8000
# or
npx serve .
```

### Making changes

1. Edit files locally
2. Test in browser (check mobile responsiveness via DevTools)
3. Commit with a descriptive message
4. Push to `main` → site goes live

## Naming Conventions

### Speaker HTML files
Named `[FirstName]_[LastName].html` at the repo root. Examples:
- `Anshu_Gupta.html`
- `Katie_Paxton-Fear.html`
- `Julia_Masloh.html`

Hyphens are preserved in names that contain them (e.g. `Paxton-Fear`).

### Speaker images
Stored in `assets/img/speakers/` using initials-based shortcodes:
- `AG.jpeg`, `AG2.jpeg` — Anshu Gupta
- `JM.jpeg`, `JM2.jpeg` — Julia Masloh
- `KPF.png`, `KPF.jpeg` — Katie Paxton-Fear
- `KM.jpeg` — Kikimora Morozova

Use JPEG for photos, PNG for images requiring transparency. Provide at least two sizes where the design uses a small thumbnail + a larger detail image.

### Sponsor logos
Stored in `assets/img/sponsors/`. Named by sponsor name (e.g., `semgrep.svg`, `tenable.png`).

### Committee photos
Stored in `assets/img/committee/`.

## Adding a Speaker

1. **Create the speaker HTML page**: Copy an existing speaker file (e.g., `Anshu_Gupta.html`) as `[FirstName]_[LastName].html`. Update:
   - `<title>BSides Berlin - [Full Name]</title>`
   - Speaker name, bio, talk title, and talk abstract in the page body
   - Social/profile links (LinkedIn preferred)
   - Image references

2. **Add speaker image(s)** to `assets/img/speakers/` using the initials convention.

3. **Update `index.html`**: Add the speaker to the Speakers section and Schedule section.
   - Speakers section: name, photo thumbnail, role/title
   - Schedule section: time slot, talk title, speaker name, link to the speaker detail page

## Updating Annual Content (New Year)

When preparing for a new conference year:
- Update the page `<title>` in `index.html` (e.g., `BSides Berlin 2026`)
- Update hero section text (dates, location, CTA button)
- Update About section
- Update Venue section
- Replace speaker list with new speakers
- Update schedule
- Update sponsors/supporters section
- Archive the previous year's site into `archive/[year]/`

## `index.html` Section Structure

The landing page uses Bootstrap's single-page scroll design with named anchors:

| Section ID | Purpose |
|-----------|---------|
| `#hero` | Hero/banner with CTA (CFP link, ticket button) |
| `#about` | About BSides Berlin |
| `#speakers` | Speaker grid with thumbnails |
| `#schedule` | Conference schedule/agenda |
| `#venue` | Venue information |
| `#supporters` | Sponsors and supporters logos |
| `#committee` | Review committee member list |
| `#contact` | Contact form and details |

Navigation links use class `.scrollto` for smooth-scroll behavior handled in `main.js`.

## CSS Conventions

Edit `assets/css/style.css` directly. Key custom CSS variables / design tokens:

| Token | Value | Usage |
|-------|-------|-------|
| Primary red | `#f82249` | Accent color, buttons, highlights |
| Secondary red | `#f8234a` | Hover states |
| Body text | `#2f3138` | Paragraph text |
| Dark blue | `#0e1b4d` | Section headings |

Use Bootstrap utility classes for spacing and layout. The grid is Bootstrap 5's standard 12-column system.

Do **not** add `<style>` blocks inside HTML pages for new styles — add them to `style.css`.

## JavaScript Conventions (`assets/js/main.js`)

- **Vanilla ES6** — no jQuery, no external frameworks beyond the vendor libs
- Wrapped in an IIFE: `(function() { "use strict"; ... })()`
- Uses three helper wrappers:
  - `select(el, all = false)` — `querySelector` / `querySelectorAll` wrapper
  - `on(type, el, listener, all = false)` — `addEventListener` wrapper
  - `onscroll(el, listener)` — scroll event listener shorthand
- AOS initialized with `duration: 1000, easing: 'ease-in-out', once: true`
- Swiper breakpoints: 1 slide @320px, 2 @575px, 3 @768px, 5 @992px
- GLightbox triggered by `.glightbox` and `.gallery-lightbox` selectors

Do not introduce jQuery or other JavaScript libraries. Keep customizations in `main.js` using the same patterns already established.

## Vendor Libraries

All vendor libraries live in `assets/vendor/`. **Do not modify these files** — they are upstream library distributions. To upgrade a library, replace the entire vendor subdirectory with the new version's distribution files.

Bootstrap Icons are loaded from CDN (`cdn.jsdelivr.net`) rather than vendored locally.

## Archive

Past conference sites are preserved in `archive/[year]/`. Each year is a full self-contained copy of that year's website (HTML + images). When archiving:

1. Copy the current year's root HTML files and speaker files into `archive/[year]/`
2. Update relative paths in archived files if needed (e.g., images may need `../../assets/...`)
3. Add a link to the new archive year in `archive/index.html`

## Deployment

- **Platform**: GitHub Pages
- **Branch**: `main` (pushing to main = immediate live deployment)
- **Domain**: `bsides.berlin` (configured via `CNAME` file — do not delete)
- **No CI/CD pipeline** — there are no automated tests, linters, or build checks

## Common Pitfalls

- **Do not delete `CNAME`** — it configures the custom domain. Removing it breaks the live site.
- **Do not edit Sass files** — `assets/scss/` contains placeholder files; the actual Sass source requires the commercial pro template. Edit `assets/css/style.css` directly.
- **Line endings**: `main.js` uses CRLF. Maintain consistency when editing on Windows; on Linux/Mac the file may show as modified due to line endings — configure `.gitattributes` if this becomes an issue.
- **Image sizes**: Large images (e.g., `KM.jpeg` at 4.5 MB) significantly affect page load. Compress images before adding them — target <500 KB for photos.
- **Speaker image format**: The design expects two image variants per speaker (thumbnail for the grid, full for the detail page). Follow the initials naming convention.
- **Bootstrap Icons CDN**: The site loads Bootstrap Icons from `cdn.jsdelivr.net`. If the CDN is unavailable, icons will not render. Consider vendoring if reliability is a concern.

## Key Files Quick Reference

| File | Purpose |
|------|---------|
| `index.html` | Main website page — primary edit target |
| `assets/css/style.css` | All custom styles |
| `assets/js/main.js` | All custom JavaScript |
| `CNAME` | Custom domain configuration |
| `[Name].html` | Individual speaker detail pages |
| `archive/index.html` | Archive year-selection page |
| `changelog.txt` | TheEvent template version history (not BSides content) |
