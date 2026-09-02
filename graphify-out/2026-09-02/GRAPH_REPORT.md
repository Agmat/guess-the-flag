# Graph Report - guess-the-flag  (2026-09-02)

## Corpus Check
- 29 files · ~9,378 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 88 nodes · 107 edges · 9 communities
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 1 edges (avg confidence: 0.85)
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
- FlagQuiz
- scripts
- aliases.test.ts
- game.ts
- Guess the Flag

## God Nodes (most connected - your core abstractions)
1. `FlagQuiz()` - 13 edges
2. `scripts` - 8 edges
3. `initialState()` - 6 edges
4. `gameReducer()` - 5 edges
5. `Guess the Flag` - 4 edges
6. `bestStreakKey()` - 3 edges
7. `flagCode()` - 3 edges
8. `flagSrc()` - 3 edges
9. `flagSrcSet()` - 3 edges
10. `readBestStreak()` - 3 edges

## Surprising Connections (you probably didn't know these)
- `playing()` --calls--> `initialState()`  [EXTRACTED]
  tests/game.test.ts → src/lib/game.ts
- `reviewing()` --calls--> `initialState()`  [EXTRACTED]
  tests/game.test.ts → src/lib/game.ts
- `FlagQuiz()` --indirect_call--> `gameReducer()`  [INFERRED]
  src/components/FlagQuiz.tsx → src/lib/game.ts
- `FlagQuiz()` --calls--> `initialState()`  [EXTRACTED]
  src/components/FlagQuiz.tsx → src/lib/game.ts

## Import Cycles
- None detected.

## Communities (9 total, 0 thin omitted)

### Community 0 - "devDependencies"
Cohesion: 0.12
Nodes (17): @astrojs/check, d3-geo, i18n-iso-countries, devDependencies, @astrojs/check, d3-geo, i18n-iso-countries, topojson-client (+9 more)

### Community 1 - "FlagQuiz.tsx"
Cohesion: 0.19
Nodes (13): bestStreakKey(), CONTINENTS, COUNTRIES, Discarded, FALLBACK_REGION_STYLE, Filter, FILTERS, flagCode() (+5 more)

### Community 2 - "package.json"
Cohesion: 0.25
Nodes (7): allowScripts, esbuild, engines, node, name, type, version

### Community 3 - "dependencies"
Cohesion: 0.15
Nodes (13): astro, @astrojs/react, dependencies, astro, @astrojs/react, react, react-dom, @types/react (+5 more)

### Community 4 - "FlagQuiz"
Cohesion: 0.39
Nodes (7): FlagQuiz(), discard(), greenFlash(), handleSubmit(), nextReviewCard(), startRegion(), poolFor()

### Community 5 - "scripts"
Cohesion: 0.25
Nodes (8): scripts, astro, build, dev, generate, preview, test, typecheck

### Community 6 - "aliases.test.ts"
Cohesion: 0.50
Nodes (3): codes, COUNTRIES, ownerOfName

### Community 7 - "game.ts"
Cohesion: 0.29
Nodes (9): Action, advanceDeck(), gameReducer(), GameState, initialState(), Phase, DECK, playing() (+1 more)

### Community 8 - "Guess the Flag"
Cohesion: 0.40
Nodes (4): Commands, Data, Guess the Flag, Notable decisions

## Knowledge Gaps
- **42 isolated node(s):** `Commands`, `Data`, `Notable decisions`, `Discarded`, `Filter` (+37 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 44 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `devDependencies` connect `devDependencies` to `package.json`?**
  _High betweenness centrality (0.154) - this node is a cross-community bridge._
- **Why does `dependencies` connect `dependencies` to `package.json`?**
  _High betweenness centrality (0.122) - this node is a cross-community bridge._
- **Why does `scripts` connect `scripts` to `package.json`?**
  _High betweenness centrality (0.077) - this node is a cross-community bridge._
- **What connects `Commands`, `Data`, `Notable decisions` to the rest of the system?**
  _42 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.11764705882352941 - nodes in this community are weakly interconnected._