import { type FormEvent, useEffect, useRef, useState } from "react";
import countriesData from "../data/countries.json";
import { isCorrectAnswer, type Country } from "../lib/match";
import { shuffle } from "../lib/shuffle";
import {
  readMistakes,
  withMistake,
  withoutMistake,
  writeMistakes,
} from "../lib/mistakes";

const COUNTRIES = countriesData as unknown as Country[];

const CONTINENTS = [...new Set(COUNTRIES.map((c) => c.continent))].sort();
const FILTERS = ["All", ...CONTINENTS] as const;
type Filter = (typeof FILTERS)[number];

const bestStreakKey = (filter: Filter) => `guess-the-flag:best:${filter}`;

type Phase =
  | "start"
  | "playing" // region mode, answering
  | "gameover" // region mode, run ended on a wrong answer
  | "won" // region mode, whole pool cleared
  | "review" // review mode, answering
  | "reviewAnswer" // review mode, showing a missed answer before moving on
  | "reviewDone"; // review mode, reached the end of the deck

const flagCode = (country: Country) => country.code.toLowerCase();
const flagSrc = (country: Country) =>
  `https://flagcdn.com/w640/${flagCode(country)}.png`;
const flagSrcSet = (country: Country) => {
  const code = flagCode(country);
  return `https://flagcdn.com/w320/${code}.png 320w, https://flagcdn.com/w640/${code}.png 640w`;
};

const poolFor = (filter: Filter) =>
  filter === "All"
    ? COUNTRIES
    : COUNTRIES.filter((country) => country.continent === filter);

function readBestStreak(filter: Filter): number {
  try {
    const raw = localStorage.getItem(bestStreakKey(filter));
    const value = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeBestStreak(filter: Filter, value: number): void {
  try {
    localStorage.setItem(bestStreakKey(filter), String(value));
  } catch {
    // storage unavailable (private mode, disabled cookies) - ignore
  }
}

export default function FlagQuiz() {
  const [filter, setFilter] = useState<Filter>("All");
  const [deck, setDeck] = useState<Country[]>([]);
  const [index, setIndex] = useState(0);
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [phase, setPhase] = useState<Phase>("start");
  const [input, setInput] = useState("");
  const [flash, setFlash] = useState(false);
  const [mistakes, setMistakes] = useState<string[]>(() => readMistakes());
  const [reviewStats, setReviewStats] = useState({ correct: 0, seen: 0 });
  const inputRef = useRef<HTMLInputElement>(null);

  const current = deck[index];
  const nextCountry = deck[index + 1];
  const isLastCard = index + 1 >= deck.length;

  // Warm the next flag so it appears instantly on a correct answer.
  useEffect(() => {
    if (!nextCountry) return;
    const img = new Image();
    img.src = flagSrc(nextCountry);
  }, [nextCountry]);

  useEffect(() => {
    if (phase === "playing" || phase === "review") inputRef.current?.focus();
  }, [phase, index]);

  // The page title (rendered by index.astro, outside this island) dispatches
  // "gtf:home" on click to send the player back to the menu.
  useEffect(() => {
    const goToMenu = () => setPhase("start");
    window.addEventListener("gtf:home", goToMenu);
    return () => window.removeEventListener("gtf:home", goToMenu);
  }, []);

  function persistMistakes(next: string[]): void {
    setMistakes(next);
    writeMistakes(next);
  }

  function recordMistake(code: string): void {
    persistMistakes(withMistake(mistakes, code));
  }

  function forgetMistake(code: string): void {
    persistMistakes(withoutMistake(mistakes, code));
  }

  function greenFlash(): void {
    setFlash(true);
    window.setTimeout(() => setFlash(false), 350);
  }

  function startRegion(nextFilter: Filter): void {
    setFilter(nextFilter);
    setBest(readBestStreak(nextFilter));
    setDeck(shuffle(poolFor(nextFilter)));
    setIndex(0);
    setStreak(0);
    setInput("");
    setFlash(false);
    setPhase("playing");
  }

  function startReview(): void {
    const pool = COUNTRIES.filter((country) => mistakes.includes(country.code));
    if (pool.length === 0) return;
    setDeck(shuffle(pool));
    setIndex(0);
    setInput("");
    setFlash(false);
    setReviewStats({ correct: 0, seen: 0 });
    setPhase("review");
  }

  function commitBest(value: number): void {
    if (value > best) {
      setBest(value);
      writeBestStreak(filter, value);
    }
  }

  function advanceReview(): void {
    setInput("");
    if (isLastCard) {
      setPhase("reviewDone");
    } else {
      setIndex(index + 1);
      setPhase("review");
    }
  }

  function handleSubmit(event: FormEvent): void {
    event.preventDefault();
    if (!current) return;
    const guess = input.trim();
    if (guess === "") return;

    // Disambiguate against every country, not just the current pool, so the
    // "names another country" guard keeps working inside a small deck.
    const correct = isCorrectAnswer(guess, current, COUNTRIES);

    if (phase === "review") {
      setReviewStats((stats) => ({
        correct: stats.correct + (correct ? 1 : 0),
        seen: stats.seen + 1,
      }));
      if (correct) {
        forgetMistake(current.code);
        greenFlash();
        advanceReview();
      } else {
        setPhase("reviewAnswer");
      }
      return;
    }

    if (phase !== "playing") return;

    if (!correct) {
      recordMistake(current.code);
      commitBest(streak);
      setPhase("gameover");
      return;
    }

    const nextStreak = streak + 1;
    setStreak(nextStreak);
    setInput("");
    greenFlash();
    if (isLastCard) {
      commitBest(nextStreak);
      setPhase("won");
    } else {
      setIndex(index + 1);
    }
  }

  const bestLabel = filter === "All" ? "Best" : `Best · ${filter}`;

  if (phase === "start") {
    return (
      <section className="quiz">
        <p className="picker-prompt">Pick a region:</p>
        <div className="continent-picker">
          {FILTERS.map((option) => (
            <button
              key={option}
              className="continent-picker__option"
              type="button"
              onClick={() => startRegion(option)}
            >
              {option}{" "}
              <span className="continent-picker__count">
                ({poolFor(option).length})
              </span>
            </button>
          ))}
        </div>

        {mistakes.length > 0 && (
          <div className="review-cta">
            <button className="button" type="button" onClick={startReview}>
              Review mistakes ({mistakes.length})
            </button>
            <button
              className="link-button"
              type="button"
              onClick={() => persistMistakes([])}
            >
              clear
            </button>
          </div>
        )}
      </section>
    );
  }

  const inReview =
    phase === "review" || phase === "reviewAnswer" || phase === "reviewDone";

  return (
    <section className="quiz">
      <header className="hud">
        {inReview ? (
          <>
            <span className="hud__item">
              Cleared <strong>{reviewStats.correct}</strong>
            </span>
            <span className="hud__item">
              Card{" "}
              <strong>
                {Math.min(index + 1, deck.length)} / {deck.length}
              </strong>
            </span>
          </>
        ) : (
          <>
            <span className="hud__item">
              Streak <strong>{streak}</strong>
            </span>
            <span className="hud__item">
              {bestLabel} <strong>{best}</strong>
            </span>
          </>
        )}
      </header>

      {phase !== "reviewDone" && (
        <div className={`flag-card${flash ? " flag-card--correct" : ""}`}>
          {current && (
            <img
              key={current.code}
              className="flag"
              src={flagSrc(current)}
              srcSet={flagSrcSet(current)}
              sizes="(max-width: 640px) 90vw, 640px"
              width={640}
              height={480}
              alt="Flag to guess"
            />
          )}
        </div>
      )}

      {(phase === "playing" || phase === "review") && (
        <form className="answer" onSubmit={handleSubmit}>
          <input
            ref={inputRef}
            className="answer__input"
            type="text"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            placeholder="Which country? (English or French)"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            // eslint-disable-next-line jsx-a11y/no-autofocus
            autoFocus
          />
          <button className="button" type="submit">
            Guess
          </button>
        </form>
      )}

      {phase === "reviewAnswer" && current && (
        <div className="result">
          <p className="result__headline">
            It was <strong>{current.en}</strong>{" "}
            <span className="result__fr">/ {current.fr}</span>
          </p>
          <p className="result__streak">Still on your list — keep practising.</p>
          <button className="button" type="button" onClick={advanceReview}>
            {isLastCard ? "Finish" : "Next"}
          </button>
        </div>
      )}

      {phase === "reviewDone" && (
        <div className="result">
          <p className="result__headline">
            Review done — cleared <strong>{reviewStats.correct}</strong> of{" "}
            {deck.length}.
          </p>
          <p className="result__streak">
            {mistakes.length === 0
              ? "Your mistakes list is empty. 🎉"
              : `${mistakes.length} still on your list.`}
          </p>
          <div className="result__actions">
            {mistakes.length > 0 && (
              <button className="button" type="button" onClick={startReview}>
                Review again
              </button>
            )}
            <button
              className="button button--ghost"
              type="button"
              onClick={() => setPhase("start")}
            >
              Pick region
            </button>
          </div>
        </div>
      )}

      {phase === "gameover" && current && (
        <div className="result">
          <p className="result__headline">
            It was <strong>{current.en}</strong>{" "}
            <span className="result__fr">/ {current.fr}</span>
          </p>
          <p className="result__streak">
            Final streak: <strong>{streak}</strong>
          </p>
          <div className="result__actions">
            <button
              className="button"
              type="button"
              onClick={() => startRegion(filter)}
            >
              Play again
            </button>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => setPhase("start")}
            >
              Pick region
            </button>
          </div>
        </div>
      )}

      {phase === "won" && (
        <div className="result">
          <p className="result__headline">
            You named all {deck.length} flags
            {filter === "All" ? "" : ` in ${filter}`}. 🏆
          </p>
          <p className="result__streak">
            Perfect streak: <strong>{streak}</strong>
          </p>
          <div className="result__actions">
            <button
              className="button"
              type="button"
              onClick={() => startRegion(filter)}
            >
              Play again
            </button>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => setPhase("start")}
            >
              Pick region
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
