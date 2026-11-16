# PlanReview AI — starter

A small, working front end for **plan review for architects**: you share a drawing with a
client, the client pins comments on the plan, and every sign-off is recorded against a
specific revision. This repository is a starter: everything runs in the browser with demo
data, so you can click through the whole flow before any back end exists.

Plain HTML, CSS and JavaScript. No build step, no framework, no package install.

---

## Run it locally

**Option 1 — just open the file**

Double-click `index.html`, or drag it into a browser window.

**Option 2 — a tiny local server (recommended)**

From the repository folder:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000>.

Any static server works, for example `npx serve .`. There is nothing to compile and nothing
to install. To stop the server, press `Ctrl+C` in that terminal.

---

## What you can click through

| Page | Address | What it shows |
| --- | --- | --- |
| Dashboard | `#/dashboard` | Projects, what needs your attention, recent client activity |
| Project | `#/projects/p_skyline` | Drawings, revisions, share settings |
| Drawing viewer | `#/projects/p_skyline/drawings/d_gf` | The plan with pinned comments, the comment list, revision history |
| Customer review | `#/review/skyline-gf-7f3a` | What the client sees when they open a share link: comment, approve, or request changes |
| Approvals | `#/approvals` | Every sign-off, and which revision it applies to |
| Insights | `#/insights` | Open client comments grouped by theme, with a suggested priority |

Things worth trying:

1. Open the drawing viewer and add a comment — click anywhere on the plan to drop a pin.
2. Zoom and pan the plan; the pins stay attached to the drawing.
3. Open the customer review link for the same drawing and record a decision.
4. Look at **Insights**: open client comments are grouped into themes with a suggested
   priority.
5. Reload the page — your changes are still there.

---

## File tree

```
planreview-ai-starter/
├── index.html          One page: mounts #app, #modal-root and the toast container
├── css/
│   └── styles.css      All styling: layout, cards, viewer, pins, modals, responsive rules
├── js/
│   └── app.js          The whole app, in numbered sections (see below)
└── README.md
```

`js/app.js` is one file on purpose, cut into numbered sections so it is easy to find things:

| Section | What lives there |
| --- | --- |
| 1. Small helpers | Escaping, date formatting, clamping |
| 2. Icons | Inline SVG icons, no icon font |
| 3. Demo data | Three projects, drawings, revisions, comments, decisions |
| 4. State and persistence | Route and UI state; saving and loading in the browser |
| 5. Derived helpers | Lookups, open and resolved counts, what needs attention |
| 6. Shared markup | Buttons, badges, avatars, empty states |
| 7. Shell | Sidebar, top bar, search |
| 8. Dashboard | Project cards, attention list, recent activity |
| 9. Project page | Drawings, revisions, share settings |
| 10. Viewer | Studio view and customer review view |
| 11. Approvals | Sign-off history per revision |
| 12. AI review summary | Local keyword grouping of open comments — no network call |
| 13. Modals | Share, add comment, new project, confirmations |
| 14. Actions | Share, revoke, approve, request changes, resolve, reply |
| 15. Viewer interactions | Zoom, pan, pin placement, comment selection |
| 16. Event wiring | One delegated click and input handler |
| 17. Router and boot | Hash routes, render, reset |

### How the data works

- Demo data is seeded on first run and then kept in the browser under the key
  `planreview.ai.starter.v1`.
- In the browser console, `PlanReview.state` shows the current data,
  `PlanReview.reset()` clears it and `PlanReview.seed()` puts the demo data back.
- Routes are plain hashes (`#/projects/p_skyline`), so every screen has a shareable address
  and the back button works.

---

## Not built yet

This is a front-end starter. The following are deliberately missing, so nobody mistakes the
demo for a product:

- **No server and no accounts.** No sign-in, no team management, no permission checks; the
  customer review link is a URL only, not a secure share.
- **No real file upload or drawing rendering.** The plan is a drawn placeholder. PDF, DWG
  and image upload, page extraction and real drawing tools do not exist.
- **No real AI.** The "AI review summary" is a local keyword grouping in section 12.
  Nothing is sent anywhere and there is no model behind it.
- **No e-mail or notifications.** Share links, reminders and decision notices are shown on
  screen only.
- **No revision comparison.** Revisions are listed and one is marked current, but there is
  no side-by-side or overlay comparison.
- **No export.** No PDF report, schedule or spreadsheet of comments and decisions.
- **No multi-user collaboration.** Two people in two browsers do not see each other's
  changes; there is no real-time sync.
- **No automated tests or continuous integration.** Nothing in this repository runs checks.
- **No accessibility audit or formal mobile review.** Keyboard focus and small screens have
  had a pass, but neither has been tested properly.

If you carry the build on, the honest order is: accounts and permissions, upload and real
drawing rendering, a real database and API, then e-mail, then the AI layer on top of real
comment history.

---

## Licence

No licence has been chosen for this repository yet. Until one is added, the code stays the
author's copyright and is not licensed for reuse.
