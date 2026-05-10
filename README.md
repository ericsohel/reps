# leet/srs

Minimal spaced-recall app for LeetCode pattern mastery. FSRS-5 + four modifications tuned for procedural skill. Deploys to Vercel + Turso (free tiers).

## What it does

- **Today queue** — due reviews, pattern-interleaved (Rohrer 2012). No two consecutive problems share a pattern.
- **Log** — capture a new attempt + a 3-line trigger card (recognition / insight / failure mode).
- **Review** — cold re-solve flow. Trigger card is hidden until you click reveal. 15-min timer.
- **Leaks** — concept gaps (high lapse rate), stale patterns (>14 days), untouched patterns.
- **CSV export** — full attempt history at `/api/export`.

## Algorithm (in `lib/fsrs.ts`)

FSRS-5 with these modifications vs stock:

1. **Procedural-skill init stability** — `[0.4, 1.18, 3.17, 6.0]` days for grades 1–4 (vs Anki's 15.69 for Easy).
2. **Day-1 learning step** — first review capped at 1d (lapse/struggled) or 2d (good/easy).
3. **Time-aware stability adjustment** — `adjustment = clamp(2 - elapsed/expected, 0.6, 1.5)` multiplies stability gain.
4. **Auto-promote to FSRS Easy** — grade 3 + elapsed < 0.7× expected on Medium/Hard → treated as grade 4 internally (unlocks 2.99× growth).

Plus:
- **Target retention 0.85** (not 0.9) — LeetCode reviews are expensive.
- **Pattern-level stability** — bleeds 15% of each problem update into a per-pattern `S`, floors problem `S_new` at 10% of pattern `S`.
- **Harder lapse reset** — `S_new = min(formula, max(S₀, 0.3 × S_old))`.
- **Difficulty mean-reverts toward Easy init** (preserves stock FSRS behavior).

## Setup

1. Create a Turso DB:
   ```bash
   curl -sSfL https://get.tur.so/install.sh | bash
   turso auth signup
   turso db create leetcode-srs
   turso db show leetcode-srs --url
   turso db tokens create leetcode-srs
   ```
2. `cp .env.example .env.local` and fill in the values. Set `APP_PASSPHRASE` to anything.
3. `npm install`
4. `npm run db:push` — creates tables.
5. `npm run dev`

## Deploy

```bash
vercel
# Set env vars in Vercel project settings:
# TURSO_DATABASE_URL, TURSO_AUTH_TOKEN, APP_PASSPHRASE
```

## Daily protocol (the actual point)

1. **Open `/`** — work the queue, top to bottom. ~15 min/review max.
2. **Don't peek** at the trigger card or your old code until after you attempt.
3. **Log a new problem at `/log`** when queue is empty. Use the staircased hint protocol (see "The Optimal LeetCode Protocol"), not 1 hour of flailing.
4. **Sunday: visit `/leaks`.** Concept gaps mean stop grinding and go study the technique.

Targets: 3 new problems + ~5 reviews/day. Weekly contest separately.

## Stack

Next.js 15 (App Router) · Drizzle + Turso libSQL · Tailwind · TypeScript. ~600 LOC.
