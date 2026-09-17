// Pure game state machine for FlagQuiz: every phase transition, streak/best
// tracking and mistakes-list update lives here, with no DOM/localStorage/
// animation concerns. The component owns persistence (watch state.mistakes
// / state.newBest in effects) and UI-only state (input text, card-fly-off
// animations, the menu's hero carousel).
import type { Country } from "./match";
import { withMistake, withoutMistake } from "./mistakes";

// "streak": one wrong answer ends the run, best = longest streak.
// "full": every card is played, best = most correct answers in a run.
export type Mode = "streak" | "full";

export type Phase =
  | "start"
  | "playing" // region mode, answering
  | "missed" // region mode (full), showing a missed answer before moving on
  | "gameover" // region mode (streak), run ended on a wrong answer
  | "won" // region mode, reached the end of the deck
  | "review" // review mode, answering
  | "reviewAnswer" // review mode, showing a missed answer before moving on
  | "reviewDone"; // review mode, reached the end of the deck

export interface GameState {
  phase: Phase;
  mode: Mode;
  filter: string;
  deck: Country[];
  index: number;
  streak: number; // in "full" mode this is the score: it never resets on a miss
  best: number;
  newBest: boolean;
  mistakes: string[];
  reviewStats: { correct: number; seen: number };
}

export type Action =
  | { type: "startRegion"; mode: Mode; filter: string; deck: Country[]; best: number }
  | { type: "startReview"; deck: Country[] }
  | { type: "submit"; correct: boolean }
  | { type: "advance" } // past a missed card (review or full run)
  | { type: "clearMistakes" }
  | { type: "goHome" };

export function initialState(mistakes: string[]): GameState {
  return {
    phase: "start",
    mode: "streak",
    filter: "All",
    deck: [],
    index: 0,
    streak: 0,
    best: 0,
    newBest: false,
    mistakes,
    reviewStats: { correct: 0, seen: 0 },
  };
}

// Move to the next card, or end the review run if the deck is spent.
function advanceDeck(state: GameState): Pick<GameState, "index" | "phase"> {
  const isLastCard = state.index + 1 >= state.deck.length;
  return isLastCard
    ? { index: state.index, phase: "reviewDone" }
    : { index: state.index + 1, phase: "review" };
}

function commitBest(state: GameState, score: number): Pick<GameState, "best" | "newBest"> {
  const beatsBest = score > state.best;
  return { best: beatsBest ? score : state.best, newBest: beatsBest };
}

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "startRegion":
      return {
        ...state,
        mode: action.mode,
        filter: action.filter,
        deck: action.deck,
        best: action.best,
        index: 0,
        streak: 0,
        newBest: false,
        phase: "playing",
      };

    case "startReview":
      return {
        ...state,
        deck: action.deck,
        index: 0,
        reviewStats: { correct: 0, seen: 0 },
        phase: "review",
      };

    case "submit": {
      const current = state.deck[state.index];
      if (!current) return state;
      const isLastCard = state.index + 1 >= state.deck.length;

      if (state.phase === "review") {
        const reviewStats = {
          correct: state.reviewStats.correct + (action.correct ? 1 : 0),
          seen: state.reviewStats.seen + 1,
        };
        if (!action.correct) {
          return { ...state, reviewStats, phase: "reviewAnswer" };
        }
        const mistakes = withoutMistake(state.mistakes, current.code);
        return { ...state, ...advanceDeck(state), reviewStats, mistakes };
      }

      if (state.phase !== "playing") return state;

      if (!action.correct) {
        const mistakes = withMistake(state.mistakes, current.code);
        if (state.mode === "full") return { ...state, mistakes, phase: "missed" };
        return { ...state, mistakes, ...commitBest(state, state.streak), phase: "gameover" };
      }

      const streak = state.streak + 1;
      if (isLastCard) {
        return { ...state, streak, ...commitBest(state, streak), phase: "won" };
      }
      return { ...state, streak, index: state.index + 1 };
    }

    case "advance": {
      if (state.phase === "reviewAnswer") return { ...state, ...advanceDeck(state) };
      if (state.phase !== "missed") return state;
      const isLastCard = state.index + 1 >= state.deck.length;
      if (isLastCard) return { ...state, ...commitBest(state, state.streak), phase: "won" };
      return { ...state, index: state.index + 1, phase: "playing" };
    }

    case "clearMistakes":
      return { ...state, mistakes: [] };

    case "goHome":
      return { ...state, phase: "start" };

    default:
      return state;
  }
}
