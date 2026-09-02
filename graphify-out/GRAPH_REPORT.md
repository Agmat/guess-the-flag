# Graph Report - guess-the-flag  (2026-09-02)

## Corpus Check
- 29 files · ~9,378 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 160 nodes · 227 edges · 11 communities
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `c9910c4c`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- devDependencies
- FlagQuiz.tsx
- package.json
- dependencies
- generate-region-icons.mjs
- tsconfig.json
- match.ts
- game.ts
- Guess the Flag
- CLAUDE.md

## God Nodes (most connected - your core abstractions)
1. `FlagQuiz()` - 16 edges
2. `Country` - 9 edges
3. `scripts` - 8 edges
4. `isCorrectAnswer()` - 8 edges
5. `gameReducer()` - 7 edges
6. `initialState()` - 6 edges
7. `normalize()` - 5 edges
8. `shuffle()` - 5 edges
9. `startRegion()` - 4 edges
10. `handleSubmit()` - 4 edges

## Surprising Connections (you probably didn't know these)
- `playing()` --calls--> `initialState()`  [EXTRACTED]
  tests/game.test.ts → src/lib/game.ts
- `reviewing()` --calls--> `initialState()`  [EXTRACTED]
  tests/game.test.ts → src/lib/game.ts
- `FlagQuiz()` --indirect_call--> `gameReducer()`  [INFERRED]
  src/components/FlagQuiz.tsx → src/lib/game.ts
- `check()` --calls--> `isCorrectAnswer()`  [EXTRACTED]
  tests/match.test.ts → src/lib/match.ts
- `Discarded` --references--> `Country`  [EXTRACTED]
  src/components/FlagQuiz.tsx → src/lib/match.ts

## Import Cycles
- None detected.

## Communities (11 total, 0 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.12
Nodes (17): @astrojs/check, d3-geo, i18n-iso-countries, devDependencies, @astrojs/check, d3-geo, i18n-iso-countries, topojson-client (+9 more)

### Community 1 - "FlagQuiz.tsx"
Cohesion: 0.12
Nodes (25): bestStreakKey(), CONTINENTS, COUNTRIES, FALLBACK_REGION_STYLE, Filter, FILTERS, flagCode(), FlagQuiz() (+17 more)

### Community 2 - "package.json"
Cohesion: 0.12
Nodes (15): allowScripts, esbuild, engines, node, name, scripts, astro, build (+7 more)

### Community 3 - "dependencies"
Cohesion: 0.15
Nodes (13): astro, @astrojs/react, dependencies, astro, @astrojs/react, react, react-dom, @types/react (+5 more)

### Community 4 - "generate-region-icons.mjs"
Cohesion: 0.09
Nodes (20): byContinent, continentOf, duplicates, NAME_OVERRIDES, outPath, rows, seen, unresolved (+12 more)

### Community 5 - "tsconfig.json"
Cohesion: 0.18
Nodes (10): **/*, astro/tsconfigs/strict, .astro/types.d.ts, dist, compilerOptions, jsx, jsxImportSource, exclude (+2 more)

### Community 6 - "match.ts"
Cohesion: 0.22
Nodes (11): ALIASES, levenshtein(), candidatesFor(), isCorrectAnswer(), normalize(), codes, COUNTRIES, ownerOfName (+3 more)

### Community 7 - "game.ts"
Cohesion: 0.20
Nodes (15): Discarded, Action, advanceDeck(), gameReducer(), GameState, initialState(), Phase, Country (+7 more)

### Community 8 - "Guess the Flag"
Cohesion: 0.40
Nodes (4): Commands, Data, Guess the Flag, Notable decisions

### Community 9 - "CLAUDE.md"
Cohesion: 0.50
Nodes (3): Development, Documentation, graphify

## Knowledge Gaps
- **71 isolated node(s):** `name`, `type`, `version`, `node`, `dev` (+66 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 78 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `Country` connect `game.ts` to `FlagQuiz.tsx`, `generate-region-icons.mjs`, `match.ts`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.046) - this node is a cross-community bridge._
- **What connects `name`, `type`, `version` to the rest of the system?**
  _71 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._
- **Should `FlagQuiz.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.11576354679802955 - nodes in this community are weakly interconnected._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._
- **Should `generate-region-icons.mjs` be split into smaller, more focused modules?**
  _Cohesion score 0.0873015873015873 - nodes in this community are weakly interconnected._