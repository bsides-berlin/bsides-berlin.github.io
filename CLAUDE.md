# CLAUDE.md — BSides Berlin Website

This file provides guidance for AI assistants working on this repository.

## Project Overview

This is the official website for **BSides Berlin**, a community-run information security conference held annually in Berlin. The site is a **static HTML website** deployed via GitHub Pages to `bsides.berlin`. There is no build step — every file pushed to `main` goes live immediately.

**Legal entity:** Tick Tech Talks UG (haftungsbeschränkt), Berlin  
**Organizers:** Natalie Pistunovich (@NataliePis) and Sina Yazdanmehr (@SinaYazdanmehr)  
**Contact:** contact@bsides.berlin  
**Social:** X [@SidesBer](https://x.com/SidesBer) · LinkedIn [/company/bsidesberlin](https://www.linkedin.com/company/bsidesberlin)

**Current year:** 2026 — 13 November 2026, CIC Berlin (Lohmühlenstraße 65, 12435 Berlin)

The site is based on the **TheEvent v4.10.0** template from BootstrapMade (commercial license). Sass sources are not included (pro version only), so all CSS changes must be made directly in `assets/css/style.css`.

---

## Repository Structure

```
/
├── index.html                  # Main landing page (single-page design, ~870 lines)
├── speaker-details.html        # Unused speaker page template (ignore)
├── [FirstName]_[LastName].html # Individual speaker detail pages (one per speaker)
├── CNAME                       # Custom domain: bsides.berlin — DO NOT DELETE
├── site.webmanifest            # PWA manifest
├── changelog.txt               # TheEvent template version history (not BSides content)
├── archive/                    # Previous years' full websites
│   ├── index.html              # Archive year-selection page
│   ├── 2021/
│   ├── 2022/
│   └── 2023/                   # Each year: index.html + per-speaker HTML files
└── assets/
    ├── css/style.css           # Main stylesheet — edit directly, no Sass
    ├── js/main.js              # Custom JS (vanilla ES6, no jQuery, CRLF line endings)
    ├── img/
    │   ├── speakers/           # Speaker headshots (initials-based names, see below)
    │   ├── sponsors/           # Sponsor logos
    │   ├── committee/          # Review committee member photos
    │   ├── logo.png / logo.svg
    │   └── hero-bg.jpg, about-bg.jpg, venue-info-bg.jpg
    ├── vendor/                 # Third-party libs — do not modify
    │   ├── aos/                # Animate On Scroll
    │   ├── bootstrap/          # Bootstrap 5.2.3
    │   ├── glightbox/          # Lightbox/modal gallery
    │   ├── swiper/             # Touch slider/carousel
    │   └── php-email-form/     # Server-side form validation (unused)
    └── BSidesBerlin2024_Sponsorship_Packages.pdf
```

> **Note:** `assets/Stephan_Berger.html` is a stray misplaced file. The correct speaker page is `Stephan_Berger.html` at the repo root.

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| HTML | HTML5, semantic sections |
| CSS | Bootstrap 5.2.3 + custom `style.css` (no Sass in this repo) |
| JavaScript | Vanilla ES6, no jQuery (removed in template v4.0.0) |
| UI Framework | Bootstrap 5.2.3 |
| Icons | Bootstrap Icons v1.11.3 via CDN (`cdn.jsdelivr.net`) |
| Fonts | Google Fonts: Open Sans + Raleway |
| Animations | AOS (Animate On Scroll) |
| Gallery | Swiper.js (carousel) + GLightbox (lightbox modal) |
| Deployment | GitHub Pages — push to `main` = live |
| Domain | `bsides.berlin` via CNAME |

---

## Development Workflow

### No build process

There is **no npm, no bundler, no Jekyll, no static site generator**. Edit HTML/CSS/JS files directly and push.

### Local preview

```bash
python3 -m http.server 8000
# or
npx serve .
```

Serving via HTTP avoids CORS issues with local asset paths.

### Making changes

1. Edit files locally
2. Test in browser — check mobile responsiveness via DevTools
3. Commit with a descriptive message
4. Push to `main` → site goes live immediately

---

## `index.html` Structure and Navigation

The landing page uses a single-page scroll design with named section anchors.

### What is currently live vs commented out

The page follows a **progressive reveal pattern**: sections are commented out in HTML until their content is ready, then uncommented when finalized. This is intentional — do not uncomment a section unless instructed.

| Section ID | Status | Notes |
|-----------|--------|-------|
| `#hero` | **Live** | Conference date, CFP link, social links |
| `#about` | **Live** | Event description, date, venue |
| `#speakers` | **Commented out** | Awaiting sponsor/speaker finalization |
| `#schedule` | **Live** | Full 2026 schedule with all 10 talks |
| `#venue` | **Live** | CIC Berlin map and address |
| `#supporters` | **Partially live** | Sponsor logos commented out; only sponsorship contact CTA shown |
| `#committee` | **Live** | 3 review committee members |
| `#buy-tickets` | **Commented out** | Awaiting ticket sales launch |
| `#contact` | **Live** | Organizer names, email, X, LinkedIn |

### Navigation difference: `index.html` vs speaker pages

The main `index.html` nav shows only: **Home · About · Venue · Review committee · Contact**

Individual speaker pages (`[Name].html`) show the full nav: Home · About · Speakers · Schedule · Venue · Sponsors · Review committee · Contact · Archive

This discrepancy is intentional — the index nav is kept minimal while sections are being built up. When speakers and sponsors sections are uncommented, add their nav links back to the `index.html` `<nav>`.

---

## Current Speakers (2026)

Ten speaker pages exist at the repo root:

| File | Speaker | Image codes |
|------|---------|-------------|
| `Anshu_Gupta.html` | Anshu Gupta | `AG.jpeg`, `AG2.jpeg` |
| `Evgenij_Smirnov.html` | Evgenij Smirnov | `ES.png` |
| `Julia_Masloh.html` | Julia Masloh | `JM.jpeg`, `JM2.jpeg` |
| `Katie_Paxton-Fear.html` | Katie Paxton-Fear | `KPF.png`, `KPF.jpeg` |
| `Kikimora_Morozova.html` | Kikimora Morozova | `KM.jpeg` |
| `Massimo_Bertocchi.html` | Massimo Bertocchi | `MB.jpeg` |
| `Patrick_Ventuzelo.html` | Patrick Ventuzelo | `PV.jpeg` |
| `Stephan_Berger.html` | Stephan Berger | `SB.jpeg`, `SB2.jpeg` |
| `Stuart_McMurray.html` | Stuart McMurray | `SM.jpeg` |
| `Valeriy_Shevchenko.html` | Valeriy Shevchenko | `VS.jpeg`, `VS.png` |

---

## Naming Conventions

### Speaker HTML files
`[FirstName]_[LastName].html` at the repo root. Hyphens in names are preserved:
- `Katie_Paxton-Fear.html` ✓

### Speaker images
Stored in `assets/img/speakers/` using initials-based shortcodes (`AG`, `KPF`, `KM`, etc.). When a speaker has two image variants (thumbnail + full-size detail), append `2` to the second: `AG.jpeg` + `AG2.jpeg`.

Use JPEG for photos, PNG for images requiring transparency. Target **< 500 KB** per image — the existing `KM.jpeg` (4.5 MB) is a known performance issue.

### Sponsor logos
`assets/img/sponsors/` — named by sponsor (e.g., `semgrep.svg`, `tenable.png`).

### Committee photos
`assets/img/committee/` — named by initials (e.g., `LM.jpg`, `VU.jpg`, `DJ.jpg`).

---

## Adding a Speaker

1. **Create the speaker HTML page**: Copy an existing speaker file (e.g., `Anshu_Gupta.html`) as `[FirstName]_[LastName].html`. Update:
   - `<title>BSides Berlin - [Full Name]</title>`
   - Speaker name, bio, talk title, and abstract in the page body
   - Social/profile links (LinkedIn preferred)
   - Image `src` attributes to the new initials codes

2. **Add speaker images** to `assets/img/speakers/` using the initials convention. Compress before committing.

3. **Update `index.html`**:
   - **Speakers section** (currently commented out): add the speaker card to the grid
   - **Schedule section**: add the time slot, talk title, and speaker name entry

4. **When speakers section is ready to go live**: uncomment the `<section id="speakers">` block in `index.html` and add `#speakers` and `#schedule` back to the main nav.

---

## Adding a Sponsor

1. Add the sponsor logo to `assets/img/sponsors/`.
2. In `index.html`, find the `#supporters` section and add a logo block. Existing logos are commented out as templates — use the same pattern.
3. When at least one sponsor is confirmed, uncomment the relevant logo blocks. Remove the "contact us" CTA only if it's no longer needed.

---

## Updating Annual Content (New Conference Year)

1. Archive the current year: copy root HTML files + speaker pages into `archive/[year]/`, update relative asset paths (images likely need `../../assets/...`), and add a link in `archive/index.html`.
2. In `index.html`:
   - Update `<title>BSides Berlin [Year]`
   - Update hero section date and CTA
   - Update About section (date, venue)
   - Clear and rebuild: speakers section, schedule section, sponsors section
   - Re-comment sections that aren't ready yet
3. Delete old speaker HTML files from the root; create new ones.
4. Update `assets/img/speakers/` with new speaker images.

---

## CSS Conventions

Edit `assets/css/style.css` directly. Design tokens in use:

| Token | Value | Usage |
|-------|-------|-------|
| Primary red | `#f82249` | Accent color, buttons, highlights |
| Secondary red | `#f8234a` | Hover states |
| Body text | `#2f3138` | Paragraph text |
| Dark blue | `#0e1b4d` | Section headings |

- Use Bootstrap 5 utility classes for spacing and layout (12-column grid).
- Do **not** add `<style>` blocks inside HTML pages — add to `style.css` instead.

---

## JavaScript Conventions (`assets/js/main.js`)

- **Vanilla ES6** — no jQuery, no additional libraries
- Wrapped in an IIFE: `(function() { "use strict"; ... })()`
- Three helper wrappers:
  - `select(el, all = false)` — `querySelector` / `querySelectorAll`
  - `on(type, el, listener, all = false)` — `addEventListener`
  - `onscroll(el, listener)` — scroll listener shorthand
- AOS: `duration: 1000, easing: 'ease-in-out', once: true, mirror: false`
- Swiper breakpoints: 1 slide @320px · 2 @575px · 3 @768px · 5 @992px
- GLightbox selectors: `.glightbox` and `.gallery-lightbox`

Do not introduce jQuery or other JS libraries.

---

## Vendor Libraries

All in `assets/vendor/`. **Do not modify these files.** To upgrade, replace the entire subdirectory with the new version's distribution.

Bootstrap Icons are loaded from CDN rather than vendored — if the CDN is unavailable, icons won't render.

---

## Archive

`archive/[year]/` contains a full self-contained copy of each past year's site. When archiving:

1. Copy root HTML files (index + speaker pages) into `archive/[year]/`
2. Update relative paths — images typically need `../../assets/...`
3. Add the new year link to `archive/index.html`

---

## Deployment

- **Platform:** GitHub Pages
- **Branch:** `main` — push = immediate live deployment
- **Domain:** `bsides.berlin` via `CNAME` — **do not delete this file**
- **No CI/CD** — no automated tests, linters, or build checks

---

## Known HTML Issues (Technical Debt)

The following bugs exist in `index.html` and have not yet been fixed:

| Location | Issue |
|----------|-------|
| Hero section | Deprecated `<font color="white">` tag used |
| Hero section | Double closing `</a></a>` tag on CFP/social line |
| Stuart McMurray speaker card | `alt=">Stuart McMurray"` — stray `>` inside the attribute value |
| Stuart McMurray speaker card | Malformed href: `"https://x.com/MagisterQuis"_blank"` — missing space before `target` |
| Committee section | `alt="LM"` used on Vincent Ulitzsch and Diana Janetzky images (copy-paste error) |
| LinkedIn link in footer | `<a href="...">` is not closed before `</p>` |
| Sponsors section | Nested HTML comments (`<!--` inside `<!--`) — browsers handle this gracefully but it's invalid |

When editing these areas, fix the surrounding markup as part of the change.

---

## Common Pitfalls

- **Do not delete `CNAME`** — removes the custom domain and breaks the live site.
- **Do not edit Sass files** — `assets/scss/` is a stub; the actual source requires the commercial pro template.
- **Line endings:** `main.js` uses CRLF. On Linux/Mac this may show as modified — configure `.gitattributes` if it becomes an issue.
- **Image sizes:** Target < 500 KB per photo. `KM.jpeg` (4.5 MB) is a known issue.
- **Commented-out sections:** Do not uncomment speakers, sponsors, or tickets sections unless instructed — they follow the progressive reveal pattern.
- **Nav sync:** When uncommenting a section, also add its nav link back to the `index.html` navbar.
- **Stray file:** `assets/Stephan_Berger.html` is a misplaced copy — the real page is at the root.

---

## Key Files Quick Reference

| File | Purpose |
|------|---------|
| `index.html` | Main website — primary edit target |
| `assets/css/style.css` | All custom styles |
| `assets/js/main.js` | All custom JavaScript |
| `CNAME` | Custom domain configuration |
| `[Name].html` | Individual speaker detail pages |
| `archive/index.html` | Archive year-selection page |
| `speaker-details.html` | Unused template — ignore |
| `changelog.txt` | TheEvent template version history (not BSides content) |
