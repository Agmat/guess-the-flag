import { describe, expect, it } from "vitest";
import { gameReducer, initialState, type GameState } from "../src/lib/game";
import type { Country } from "../src/lib/match";

const DECK: Country[] = [
  { code: "FR", en: "France", fr: "France", continent: "Europe" },
  { code: "DE", en: "Germany", fr: "Allemagne", continent: "Europe" },
  { code: "US", en: "United States", fr: "États-Unis", continent: "Americas" },
];

function playing(overrides: Partial<GameState> = {}): GameState {
  return {
    ...initialState([]),
    phase: "playing",
    filter: "Europe",
    deck: DECK,
    index: 0,
    streak: 0,
    best: 0,
    ...overrides,
  };
}

function fullRun(overrides: Partial<GameState> = {}): GameState {
  return playing({ mode: "full", ...overrides });
}

function reviewing(overrides: Partial<GameState> = {}): GameState {
  return {
    ...initialState(["FR", "DE", "US"]),
    phase: "review",
    deck: DECK,
    index: 0,
    reviewStats: { correct: 0, seen: 0 },
    ...overrides,
  };
}

describe("gameReducer", () => {
  it("submit correct mid-deck advances the card and streak, phase unchanged", () => {
    const state = playing({ streak: 2, index: 0 });
    const next = gameReducer(state, { type: "submit", correct: true });
    expect(next.streak).toBe(3);
    expect(next.index).toBe(1);
    expect(next.phase).toBe("playing");
  });

  it("submit correct on the last card wins and commits a new best", () => {
    const state = playing({ streak: 1, index: DECK.length - 1, best: 1 });
    const next = gameReducer(state, { type: "submit", correct: true });
    expect(next.phase).toBe("won");
    expect(next.streak).toBe(2);
    expect(next.best).toBe(2);
    expect(next.newBest).toBe(true);
  });

  it("winning without beating the stored best leaves best and newBest alone", () => {
    const state = playing({ streak: 4, index: DECK.length - 1, best: 10 });
    const next = gameReducer(state, { type: "submit", correct: true });
    expect(next.phase).toBe("won");
    expect(next.best).toBe(10);
    expect(next.newBest).toBe(false);
  });

  it("submit wrong ends the run, records the mistake once, commits best from the streak before the miss", () => {
    const state = playing({ streak: 3, index: 1, best: 1 });
    const next = gameReducer(state, { type: "submit", correct: false });
    expect(next.phase).toBe("gameover");
    expect(next.mistakes).toEqual(["DE"]);
    expect(next.best).toBe(3);
    expect(next.newBest).toBe(true);
    // a second miss on the same country does not duplicate it
    const again = gameReducer({ ...next, phase: "playing" }, { type: "submit", correct: false });
    expect(again.mistakes).toEqual(["DE"]);
  });

  it("review + correct clears the mistake, advances the deck, updates reviewStats", () => {
    const state = reviewing({ index: 0 });
    const next = gameReducer(state, { type: "submit", correct: true });
    expect(next.mistakes).toEqual(["DE", "US"]);
    expect(next.reviewStats).toEqual({ correct: 1, seen: 1 });
    expect(next.index).toBe(1);
    expect(next.phase).toBe("review");
  });

  it("review + wrong keeps the mistake, shows the answer, only seen increments", () => {
    const state = reviewing({ index: 0 });
    const next = gameReducer(state, { type: "submit", correct: false });
    expect(next.mistakes).toEqual(["FR", "DE", "US"]);
    expect(next.reviewStats).toEqual({ correct: 0, seen: 1 });
    expect(next.phase).toBe("reviewAnswer");
    expect(next.index).toBe(0);
  });

  it("review finishes the deck on the last card, whether the last answer was right or wrong", () => {
    const lastCorrect = reviewing({ index: DECK.length - 1 });
    expect(gameReducer(lastCorrect, { type: "submit", correct: true }).phase).toBe(
      "reviewDone",
    );

    const lastWrongThenAdvance = reviewing({ index: DECK.length - 1, phase: "reviewAnswer" });
    expect(gameReducer(lastWrongThenAdvance, { type: "advance" }).phase).toBe(
      "reviewDone",
    );
  });

  it("advance moves past a missed review card mid-deck without touching mistakes", () => {
    const state = reviewing({ index: 0, phase: "reviewAnswer" });
    const next = gameReducer(state, { type: "advance" });
    expect(next.index).toBe(1);
    expect(next.phase).toBe("review");
    expect(next.mistakes).toEqual(["FR", "DE", "US"]);
  });

  it("full run + wrong shows the answer, records the mistake, keeps score and index", () => {
    const state = fullRun({ streak: 2, index: 1 });
    const next = gameReducer(state, { type: "submit", correct: false });
    expect(next.phase).toBe("missed");
    expect(next.mistakes).toEqual(["DE"]);
    expect(next.streak).toBe(2);
    expect(next.index).toBe(1);
    expect(next.newBest).toBe(false);
  });

  it("full run + advance after a miss moves to the next card", () => {
    const state = fullRun({ phase: "missed", index: 0 });
    const next = gameReducer(state, { type: "advance" });
    expect(next.phase).toBe("playing");
    expect(next.index).toBe(1);
  });

  it("full run + advance after a miss on the last card finishes and commits the score as best", () => {
    const state = fullRun({ phase: "missed", index: DECK.length - 1, streak: 2, best: 1 });
    const next = gameReducer(state, { type: "advance" });
    expect(next.phase).toBe("won");
    expect(next.best).toBe(2);
    expect(next.newBest).toBe(true);
  });

  it("full run + correct on the last card finishes and commits the score as best", () => {
    const state = fullRun({ index: DECK.length - 1, streak: 1, best: 5 });
    const next = gameReducer(state, { type: "submit", correct: true });
    expect(next.phase).toBe("won");
    expect(next.streak).toBe(2);
    expect(next.best).toBe(5);
    expect(next.newBest).toBe(false);
  });

  it("advance while playing is a no-op", () => {
    const state = fullRun({ index: 0 });
    expect(gameReducer(state, { type: "advance" })).toBe(state);
  });

  it("startRegion resets streak, index and newBest but not mistakes", () => {
    const state = { ...playing({ streak: 5, index: 2, newBest: true }), mistakes: ["FR"] };
    const next = gameReducer(state, {
      type: "startRegion",
      mode: "streak",
      filter: "Americas",
      deck: DECK,
      best: 7,
    });
    expect(next.streak).toBe(0);
    expect(next.index).toBe(0);
    expect(next.newBest).toBe(false);
    expect(next.best).toBe(7);
    expect(next.filter).toBe("Americas");
    expect(next.mistakes).toEqual(["FR"]);
    expect(next.phase).toBe("playing");
  });

  it("goHome preserves mistakes and best", () => {
    const state = playing({ mistakes: ["FR", "DE"], best: 9 });
    const next = gameReducer(state, { type: "goHome" });
    expect(next.phase).toBe("start");
    expect(next.mistakes).toEqual(["FR", "DE"]);
    expect(next.best).toBe(9);
  });

  it("clearMistakes empties the list", () => {
    const state = playing({ mistakes: ["FR", "DE"] });
    expect(gameReducer(state, { type: "clearMistakes" }).mistakes).toEqual([]);
  });
});
