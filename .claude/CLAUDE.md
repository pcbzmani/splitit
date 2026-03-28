# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What Is This

**SplitIt** is a single-file (`index.html`) Splitwise-style group expense tracker.
- No backend, no framework, no build step — pure HTML + CSS + Vanilla JS
- Data persists in `localStorage` (key: `splitit_v3`)
- Optional Google Sheets sync via Google Apps Script Web App
- Hosted free on GitHub Pages or Netlify (drag & drop)

---

## Development

No build step. Open `index.html` directly in a browser.

To preview with live-reload:
```bash
npx serve .          # http://localhost:3000
# or
python -m http.server 8080
```

There are no tests, no linter, and no package.json.

---

## Architecture

### Screen Flow (3 levels)

```
[Sheets Screen]  →  [Groups Screen]  →  [App Screen]
  (root/home)       (per sheet)         (per group)
```

Screens toggle by adding/removing `.active` on `.screen` divs:

| Screen ID | Description |
|---|---|
| `#sheetsScreen` | Root — lists all sheets (workspaces) |
| `#groupsScreen` | Groups within the active sheet |
| `#appScreen` | Expenses / Balances / Members for a group |

### State Shape (`splitit_v3`)

```js
S = {
  sheets: [{
    id: string,           // 'local' (Personal) or 's<timestamp>'
    name: string,
    emoji: string,
    sheetUrl: string,     // Apps Script Web App URL (empty = local only)
    isLocal: boolean,     // true when no sheetUrl
    groups: [{
      id: string,         // 'g<timestamp>'
      name: string,
      emoji: string,
      currency: string,   // ISO code e.g. 'QAR'
      members: string[],  // ['You', 'Ahmed', ...]
      expenses: Expense[]
    }]
  }],
  activeSheetId: string | null,
  activeGroupId: string | null
}

Expense = {
  id: number,               // Date.now()
  desc: string,
  amount: number,
  currency: string,         // per-expense currency (can differ from group)
  category: string,         // e.g. '🍽️ Food'
  paidBy: string,
  date: string,             // 'YYYY-MM-DD'
  splits: { [member]: number },
  splitMode: 'equal' | 'percent' | 'amount'
}
```

**Migration:** on first load, `splitit_v2` data (flat `groups[]`) is automatically wrapped into a "Personal" local sheet.

### Key Functions

| Function | What it does |
|---|---|
| `GS()` | Returns the currently active sheet object |
| `G()` | Returns the currently active group object |
| `load()` / `persist()` | Read/write state from localStorage (v3), with v2 migration |
| `renderSheets()` | Renders the sheets screen |
| `openSheet(id)` | Navigates to groups screen for a sheet |
| `goBackToSheets()` | Returns to sheets screen |
| `createSheet()` | Creates a new local sheet |
| `connectSheet()` | Async — fetches groups from a shared Apps Script URL, caches locally |
| `shareSheet()` | Copies the active sheet's Web App URL to clipboard |
| `openSheetSettings()` / `saveSheetSettings()` | Edit sheet name, emoji, URL |
| `deleteSheet()` | Removes sheet and all its groups |
| `renderGroups()` | Renders groups within the active sheet |
| `openGroup(id)` | Navigates to app screen for a group |
| `goBack()` | Returns to groups screen |
| `createGroup()` | Adds group to `GS().groups` |
| `deleteGroup()` | Removes group from `GS().groups` |
| `addExpense()` | Validates + saves expense, triggers `syncToSheet()` |
| `deleteExpense(id)` | Removes expense by id, triggers `syncToSheet()` |
| `computeBalances()` | Returns `{member: netBalance}` map |
| `computeSettlements(bal)` | Minimum transactions to settle all debts |
| `syncToSheet()` | Fires GET to `GS().sheetUrl` with `?action=write&data=...` (no-cors) |
| `renderMembersSplit()` | Renders per-member split rows in form |
| `updateSplitAmounts()` | Live-updates split amounts as user types |
| `getSplitData()` | Reads current split inputs → returns splits object |

---

## Sharing Flow

1. **Owner** creates a sheet → adds Web App URL in Sheet Settings → clicks ⎘ Share to copy URL
2. **Friend** opens SplitIt → "Connect Shared Sheet" → pastes URL → app calls `?action=read` → groups load
3. **Both** can add expenses → each `addExpense()` / `deleteExpense()` calls `?action=write` to sync

The `connectSheet()` function uses a regular `fetch()` (not `no-cors`) since CORS headers are provided by Google Apps Script. Write syncs still use `no-cors` since no response is needed.

---

## Google Sheets Sync (Apps Script)

The script (`appsscript.gs`) handles two actions:

| Request | Behaviour |
|---|---|
| `?action=read` | Returns all groups as JSON from the hidden `_meta` sheet |
| `?action=write&data=...` | Writes group data to `_meta` + updates human-readable tabs |

Each group gets three tabs: `<GroupName> — Expenses`, `<GroupName> — Members`, `<GroupName> — Balances`.

The `_meta` sheet is hidden and stores the full groups JSON for the connect/read flow.

Must be re-deployed as **New Deployment** (not Manage) each time the script is edited.

---

## Styling Rules

Always use CSS variables — never hardcode colours:

| Variable | Colour |
|---|---|
| `--bg` | Page background (near-black) |
| `--surface` / `--surface2` | Card surfaces |
| `--border` | Borders |
| `--accent` | Green (primary actions) |
| `--accent2` | Blue (secondary / info) |
| `--danger` | Red |
| `--warn` | Yellow |
| `--text` / `--muted` | Text hierarchy |

Fonts: `Syne` (headings, numbers) + `DM Sans` (body). Dark theme only. Responsive via CSS Grid `auto-fit` + `@media(max-width:560px)`.

---

## Known Quirks

- `splitMode` is a module-level `let` (not in state) — resets when switching groups
- Balances use the group's base currency at face value — no FX conversion across currencies
- `fillSel(id, selected)` populates any `<select>` with the full 35-currency list
- The Personal sheet (`id: 'local'`) cannot be deleted when it is the only sheet
- Emoji pickers use separate scoped variables: `pickedSheetEmoji` (sheets) and `pickedGroupEmoji` (groups)

---

## Planned Features

- [ ] Edit existing expense (currently delete + re-add)
- [ ] Rename / edit group settings
- [ ] Export to CSV
- [ ] FX conversion for multi-currency balances
- [ ] Dark/light theme toggle
- [ ] PWA / installable (manifest + service worker)
- [ ] Import from Google Sheet
- [ ] Pull/refresh from connected sheet (currently write-only after initial connect)
