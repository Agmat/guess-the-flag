// Pure game state machine for FlagQuiz: every phase transition, streak/best
// tracking and mistakes-list update lives here, with no DOM/localStorage/
// animation concerns. The component owns persistence (watch state.mistakes
// / state.newBest in effects) and UI-only state (input text, card-fly-off
// animations, the menu's hero carousel).
import type { Country } from "./match";
import { withMistake, withoutMistake } from "./mistakes";

export type Phase =
  | "start"
  | "playing" // region mode, answering
  | "gameover" // region mode, run ended on a wrong answer
  | "won" // region mode, whole pool cleared
  | "review" // review mode, answering
  | "reviewAnswer" // review mode, showing a missed answer before moving on
  | "reviewDone"; // review mode, reached the end of the deck

export interface GameState {
  phase: Phase;
  filter: string;
  deck: Country[];
  index: number;
  streak: number;
  best: number;
  newBest: boolean;
  mistakes: string[];
  reviewStats: { correct: number; seen: number };
}

export type Action =
  | { type: "startRegion"; filter: string; deck: Country[]; best: number }
  | { type: "startReview"; deck: Country[] }
  | { type: "submit"; correct: boolean }
  | { type: "advanceReview" }
  | { type: "clearMistakes" }
  | { type: "goHome" };

export function initialState(mistakes: string[]): GameState {
  return {
    phase: "start",
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

export function gameReducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "startRegion":
      return {
        ...state,
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
        const beatsBest = state.streak > state.best;
        return {
          ...state,
          mistakes,
          best: beatsBest ? state.streak : state.best,
          newBest: beatsBest,
          phase: "gameover",
        };
      }

      const streak = state.streak + 1;
      if (isLastCard) {
        const beatsBest = streak > state.best;
        return {
          ...state,
          streak,
          best: beatsBest ? streak : state.best,
          newBest: beatsBest,
          phase: "won",
        };
      }
      return { ...state, streak, index: state.index + 1 };
    }

    case "advanceReview":
      return { ...state, ...advanceDeck(state) };

    case "clearMistakes":
      return { ...state, mistakes: [] };

    case "goHome":
      return { ...state, phase: "start" };

    default:
      return state;
  }
}
