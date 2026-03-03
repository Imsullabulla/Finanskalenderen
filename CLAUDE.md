# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

No test framework is configured.

## Architecture

**Finanskalenderen** is a Next.js 16 + React 19 + TypeScript compliance tracking SPA for Danish/European companies. It uses the App Router (`src/app/`) with React Context for state management — no external state library.

### Data Flow

```
obligations.ts (static DB, 90+ obligations)
    ↓
AppContext.tsx (central state: active obligations, filters, company setup, compliance score)
    ↓
deadlineEngine.ts (calculates next deadlines, urgency, adjusts for weekends/Danish holidays)
    ↓
Components (Header → FloorGrid → ObligationCard / ListView / CalendarView / HeatmapView)
```

### Key Files

| File | Purpose |
|------|---------|
| `src/data/obligations.ts` | Static database of all compliance obligations |
| `src/utils/deadlineEngine.ts` | Deadline calculation, urgency levels (overdue/critical/warning/upcoming/safe), 14-month horizon |
| `src/context/AppContext.tsx` | App state: obligation active/reported state, filters, company setup, fiscal year overrides, compliance score |
| `src/i18n/I18nContext.tsx` | Language provider; translations in `da.json` / `en.json` |
| `src/app/globals.css` | Full design system via CSS custom properties (colors, spacing, typography, shadows) |

### Obligation Data Model

Each `Obligation` in `obligations.ts` has:
- `name` / `description`: `Record<string, string>` for da/en translations
- `category`: `'skat' | 'miljø' | 'eu' | 'afgifter' | 'hr' | 'regnskab'`
- `frequency`: `'monthly' | 'quarterly' | 'annual' | 'semi-annual' | 'ad-hoc' | 'ongoing'`
- `deadlineDay`, `deadlineMonth`, `monthOffset`: deadline timing fields
- `triggerRules`: optional object filtering by company size, employees, revenue, import/export/production flags
- `fiscalYearDependent`: boolean — deadline shifts based on company's fiscal year end

### Deadline Engine — Period/Offset Rules

`deadlineEngine.ts` calculates deadlines based on `frequency` + `monthOffset` + `deadlineDay`:

| Obligation | frequency | deadlineDay | monthOffset | Logic |
|---|---|---|---|---|
| `moms-maaned` | monthly | 25 | 1 | 25th of following month (forward-adjusted) |
| `moms-kvartal` | quarterly | 1 | 3 | 1st of 3rd month after quarter end |
| `moms-halvaar` | semi-annual | 1 | 3 | Sep 1 (H1) / Mar 1 (H2), forward-adjusted |
| `atp-indberetning` | quarterly | 0 (last day) | 2 | Last day of 2nd month after quarter end |
| `atp-betaling` | quarterly | 1 | 4 | 1st of 4th month after quarter end |

**Quarterly engine**: `quarterEnds = [2, 5, 8, 11]` (Mar/Jun/Sep/Dec, 0-indexed). Deadline = `qEnd + monthOffset`.

**Semi-annual engine**: `periodEnds = [5, 11]` (Jun/Dec, 0-indexed). Deadline = `periodEnd + monthOffset`. This gives Sep 1 and Mar 1 for `monthOffset: 3`.

**Holiday adjustment**: deadlines falling on weekends/Danish holidays move **forward** to next business day (default). Use `adjustBackward: true` on an obligation to move backward instead.

**`deadlineDay: 0`** = last day of the deadline month (JS `new Date(y, m+1, 0)` trick).

### Email Reminders (Scheduled)

Daily cron job sends digest emails for upcoming deadlines via Resend.

**Files:**
| File | Purpose |
|---|---|
| `src/app/api/cron/send-reminders/route.ts` | Cron handler — finds due obligations, sends digest emails |
| `src/app/api/notifications/route.ts` | One-off single-obligation email (pre-existing, separate) |
| `vercel.json` | Cron schedule: `0 7 * * *` (07:00 UTC = 08:00 CET / 09:00 CEST) |

**Required env vars (set in Vercel dashboard):**
```
RESEND_API_KEY=...                  # already used by /api/notifications
REMINDER_EMAIL=you@example.dk       # who receives the reminders
CRON_SECRET=<random string>         # Vercel sends this as Bearer token to authenticate the cron
NEXT_PUBLIC_APP_URL=https://...     # CTA link in the email body
```

**Optional env vars:**
```
REMINDER_DAYS=7,3,1                 # default: 7,3,1 — days before deadline to send reminder
REMINDER_OBLIGATION_IDS=a-skat,moms-maaned,...  # if omitted: all non-ad-hoc obligations
```

**How it works:**
1. Vercel calls `GET /api/cron/send-reminders` every morning with `Authorization: Bearer CRON_SECRET`
2. Route filters obligations (skips `ad-hoc`/`ongoing`; applies `REMINDER_OBLIGATION_IDS` if set)
3. Calls `calculateAllDeadlines` for each obligation with `fiscalYearEnd=12` (calendar year default)
4. Buckets obligations by days-until-deadline; matches against `REMINDER_DAYS`
5. Sends one **digest email per matching day bucket** (e.g. if 3 obligations are due in 7 days → one email listing all three)
6. Returns `{ ok, checkedAt, obligationsChecked, results[] }` — visible in Vercel logs

**Email colour coding:** header turns orange for deadlines ≤3 days, red for overdue.

**To test manually:** `curl -H "Authorization: Bearer <CRON_SECRET>" https://your-app.vercel.app/api/cron/send-reminders`

### ICS Calendar Export

Two export entry points:

| Component | Where rendered | What it exports |
|---|---|---|
| `CalendarSyncButton` | Inside each `ObligationCard` (expanded state) | Single obligation, single deadline — downloads `.ics` or opens Google/Outlook URL |
| `CalendarExportModal` | Triggered from `Sidebar.tsx` | Bulk export — user picks obligations + duration, downloads one `.ics` file |

**Key files:**

| File | Purpose |
|---|---|
| `src/utils/calendarExport.ts` | All ICS generation logic: `generateICS` (single), `generateBulkICS` (bulk), `getGoogleCalendarUrl`, `getOutlookCalendarUrl`, `downloadICS` |
| `src/components/CalendarExportModal.tsx` | Modal UI: obligation checklist grouped by category, duration selector |
| `src/components/CalendarSyncButton.tsx` | Per-card button with `.ics` download + Google/Outlook deep-links |

**Export duration options** (`ExportDuration` type):
- `'1year'` / `'2years'` / `'3years'` — generates one `VEVENT` per deadline occurrence (pre-calculated via `calculateAllDeadlines`)
- `'ongoing'` — generates one `VEVENT` with an `RRULE` (e.g. `RRULE:FREQ=YEARLY`) so the event repeats automatically in the target calendar

**RRULE mapping** (`getFrequencyRRule` in `calendarExport.ts`):
- `monthly` → `RRULE:FREQ=MONTHLY`
- `quarterly` → `RRULE:FREQ=MONTHLY;INTERVAL=3`
- `semi-annual` → `RRULE:FREQ=MONTHLY;INTERVAL=6`
- `annual` → `RRULE:FREQ=YEARLY`
- `ad-hoc` / `ongoing` → no RRULE (skipped)

Obligations with `customDeadlines` (e.g. `b-skat` with 10 specific months) do not map cleanly to a single RRULE — they export correctly in the fixed-year modes but the `ongoing` RRULE will only capture the simple frequency pattern.

### Toggle All Obligations

`Sidebar.tsx` renders a **"Slå alle til/fra"** master toggle button in the sidebar header. It calls `toggleAllObligations()` from `AppContext`.

**How it works (`AppContext.tsx`):**

```
allObligations.forEach(o => {
    map.set(o.id, stored[o.id] ?? { id: o.id, active: true, reported: false });
});
```

`obligationStates` is seeded from the full `allObligations` array at startup. `toggleAllObligations` iterates over every key in this Map:
- If all are active → deactivate all
- Otherwise → activate all

**New obligations are automatically included** — no extra wiring needed. Adding an entry to `obligations.ts` is sufficient for it to appear in `obligationStates` and respond to the toggle.

`allObligationsActive` (a `useMemo`) drives the button label: shows "Slå alle fra" when every obligation is active, "Slå alle til" otherwise.

### CalendarView — Period Labels

`CalendarView.tsx` computes a `periodLabel` (e.g. `K4 2025`, `H1 2026`) for quarterly/semi-annual events via `getPeriodLabel(obligation, deadline, lang)`. This label is shown in:
- Month view chips (second line, smaller text)
- Week view (appended to freq label: `Kvartal · K4 2025`)
- Day view & DateDetailPanel (separate pill badge)

Edge case: if `deadlineDay === 0` and the adjusted date lands in the first 3 days of a month (forward-pushed across month boundary), the function steps back one month before computing the period.

### Styling

All theming uses CSS variables defined in `globals.css`. Status colors follow this mapping:
- `--color-safe` (green) → reported/on-time
- `--color-upcoming` (blue) → upcoming soon
- `--color-warning` (orange) → approaching critical
- `--color-critical` / `--color-overdue` (red) → past deadline or imminent

Layout constants: `--sidebar-width: 320px`, `--header-height: 64px`.

### i18n Pattern

Use the `useI18n()` hook from `I18nContext.tsx`. Translation keys follow `section.key` format (e.g., `sidebar.search`, `status.overdue`). New UI strings need entries in both `da.json` and `en.json`.

### Path Aliases

`@/*` maps to `./src/*` (configured in `tsconfig.json`).
