# SplitIt

A Splitwise-style group expense tracker that runs entirely in your browser — no backend, no account, no setup.

## Live Demo

Open `index.html` directly, or host it free on GitHub Pages / Netlify (drag & drop).

## Features

- **Group management** — create multiple groups, each with its own members and currency
- **Expense tracking** — log expenses with category, date, and who paid
- **Bill splitting** — equal, percentage, or exact amount splits
- **Multi-currency** — 35 currencies; per-expense currency with badge display
- **Balance & settlements** — auto-computed minimum transactions to settle debts
- **Google Sheets sync** — optional one-click sync to a Google Sheet via Apps Script
- **Offline-first** — all data lives in `localStorage`; works without internet

## Quick Start

No install needed. Just open `index.html` in a browser.

To host publicly:
- **GitHub Pages** — push to a repo and enable Pages in Settings
- **Netlify** — drag the folder onto [netlify.com/drop](https://app.netlify.com/drop)

## Google Sheets Sync (Optional)

1. Open a Google Sheet and go to **Extensions → Apps Script**
2. Open the **Sheets** modal inside SplitIt and copy the generated script
3. Paste it into Apps Script, deploy as **New Deployment → Web App** (access: Anyone)
4. Paste the Web App URL into the modal and click **Save**

Each group syncs to its own set of tabs in the sheet (e.g. `MyTrip — Expenses`, `MyTrip — Balances`), so multiple groups can share a single spreadsheet.

> Re-deploy as a **New Deployment** (not Manage) each time you edit the script to get a fresh URL.

## Stack

| Layer | Choice |
|-------|--------|
| Frontend | Pure HTML + CSS + Vanilla JS (single file) |
| Storage | `localStorage` (key: `splitit_v2`) |
| Sync | Google Apps Script Web App (optional) |
| Hosting | GitHub Pages / Netlify — free |

## File Structure

```
splitit/
├── index.html       ← entire app (HTML + CSS + JS)
├── appsscript.gs    ← standalone copy of the Apps Script
└── .claude/
    └── CLAUDE.md    ← architecture & developer notes
```

## Planned Features

- [ ] Edit existing expense
- [ ] Export to CSV
- [ ] Rename / edit group settings
- [ ] Dark / light theme toggle
