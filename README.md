# Guess the Flag

A flag-guessing quiz for all 193 UN member states. Type the country in
English or French — one wrong answer ends the run. Filter by region, and any
flag you miss goes on a persistent practice list you can replay from the
menu until you clear it.

## Commands

| Command             | Action                                              |
| :------------------- | :--------------------------------------------------- |
| `npm install`         | Install dependencies                                  |
| `npm run dev`         | Start the dev server at `localhost:4321`              |
| `npm run build`       | Build the production site to `./dist/`                |
| `npm run preview`     | Preview the production build locally                  |
| `npm test`            | Run the test suite (Vitest)                            |
| `npm run typecheck`   | Typecheck the project (`astro check`)                  |
| `npm run generate`    | Regenerate `src/data/countries.json` and `region-icons.json` |

`npm run generate` is not run automatically — its output is committed. Run it
by hand after changing `src/data/un-members.mjs` (continent assignments) or
the name overrides in `scripts/generate-countries.mjs`.

## Data

- **Countries**: the 193 UN member states, resolved via
  [`i18n-iso-countries`](https://www.npmjs.com/package/i18n-iso-countries) for
  English/French names, tagged with a continent from
  `src/data/un-members.mjs` (hand-kept — that's the one place continent
  assignments live).
- **Continent icons**: silhouettes derived from real coastline data
  (Natural Earth 110m, public domain) by
  `scripts/generate-region-icons.mjs`.
- **Flag images**: served at runtime from
  [flagcdn.com](https://flagcdn.com) — the app's one third-party runtime
  dependency; there's no local copy of the flags.

## Notable decisions

- **`client:only="react"`** on the quiz island (`src/pages/index.astro`) is
  deliberate, not an oversight — the menu's flag deck is shuffled
  client-side, and server-rendering it first would mismatch on hydration.
- **Typo tolerance has a length floor** (`MIN_FUZZY_LENGTH` in
  `src/lib/match.ts`): short country names like Chad, Cuba, Mali and Iran are
  one edit apart from each other, so fuzzy matching under 5 characters would
  accept wrong answers.
