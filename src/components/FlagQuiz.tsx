import {
  type CSSProperties,
  type FormEvent,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import countriesData from "../data/countries.json";
import { isCorrectAnswer, type Country } from "../lib/match";
import { shuffle } from "../lib/shuffle";
import { RegionIcon } from "./RegionIcon";
import { gameReducer, initialState } from "../lib/game";
import { readMistakes, writeMistakes } from "../lib/mistakes";

const COUNTRIES = countriesData as unknown as Country[];

const CONTINENTS = [...new Set(COUNTRIES.map((c) => c.continent))].sort();
const FILTERS = ["All", ...CONTINENTS] as const;
type Filter = (typeof FILTERS)[number];

// One hue per region, used for the dot, hover tint and focus ring.
const REGION_STYLE: Record<string, { dot: string; tint: string }> = {
  All: { dot: "#4f46e5", tint: "#eef2ff" },
  Africa: { dot: "#f59e0b", tint: "#fef3c7" },
  Americas: { dot: "#10b981", tint: "#d1fae5" },
  Asia: { dot: "#ef4444", tint: "#fee2e2" },
  Europe: { dot: "#0ea5e9", tint: "#e0f2fe" },
  Oceania: { dot: "#8b5cf6", tint: "#ede9fe" },
};
const FALLBACK_REGION_STYLE = { dot: "#4f46e5", tint: "#eef2ff" };

const HERO_SIZE = 14;
const HERO_INTERVAL_MS = 3000;
const FLASH_MS = 550;
const DISCARD_MS = 420;
const HERO_DISCARD_MS = 620;

const bestStreakKey = (filter: string) => `guess-the-flag:best:${filter}`;

/** A card currently flying off the top of the deck. */
interface Discarded {
  country: Country;
  seq: number;
}

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

function readBestStreak(filter: string): number {
  try {
    const raw = localStorage.getItem(bestStreakKey(filter));
    const value = raw ? Number.parseInt(raw, 10) : 0;
    return Number.isFinite(value) && value > 0 ? value : 0;
  } catch {
    return 0;
  }
}

function writeBestStreak(filter: string, value: number): void {
  try {
    localStorage.setItem(bestStreakKey(filter), String(value));
  } catch {
    // storage unavailable (private mode, disabled cookies) - ignore
  }
}

export default function FlagQuiz() {
  const [state, dispatch] = useReducer(gameReducer, [], () =>
    initialState(readMistakes()),
  );
  const { phase, filter, deck, index, streak, best, newBest, mistakes, reviewStats } =
    state;

  const [input, setInput] = useState("");
  const [flash, setFlash] = useState(false);
  const [failedCode, setFailedCode] = useState<string | null>(null);
  const [heroDeck] = useState<Country[]>(() =>
    shuffle(COUNTRIES).slice(0, HERO_SIZE),
  );
  const [heroIndex, setHeroIndex] = useState(0);
  const [outgoing, setOutgoing] = useState<Discarded | null>(null);
  const [heroOutgoing, setHeroOutgoing] = useState<Discarded | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const discardSeq = useRef(0);
  const discardTimer = useRef<number | undefined>(undefined);
  const heroSeq = useRef(0);
  const heroIndexRef = useRef(0);

  const current = deck[index];
  const nextCountry = deck[index + 1];
  const isLastCard = index + 1 >= deck.length;
  const heroCountry = heroDeck[heroIndex];

  // Persist the mistakes list whenever the reducer changes it.
  useEffect(() => {
    writeMistakes(mistakes);
  }, [mistakes]);

  // Persist a new best streak whenever the reducer sets one.
  useEffect(() => {
    if (newBest) writeBestStreak(filter, best);
  }, [newBest, best, filter]);

  // Warm the next flag so it appears instantly on a correct answer.
  useEffect(() => {
    if (!nextCountry) return;
    const img = new Image();
    img.src = flagSrc(nextCountry);
  }, [nextCountry]);

  useEffect(() => {
    for (const country of heroDeck) {
      const img = new Image();
      img.src = flagSrc(country);
    }
  }, [heroDeck]);

  useEffect(() => {
    heroIndexRef.current = heroIndex;
  }, [heroIndex]);

  // Deal the menu's flag stack, unless the player prefers reduced motion.
  useEffect(() => {
    if (phase !== "start") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => {
      const leaving = heroDeck[heroIndexRef.current];
      if (leaving) {
        heroSeq.current += 1;
        setHeroOutgoing({ country: leaving, seq: heroSeq.current });
      }
      setHeroIndex((i) => (i + 1) % heroDeck.length);
    }, HERO_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [phase, heroDeck]);

  useEffect(() => () => window.clearTimeout(discardTimer.current), []);

  useEffect(() => {
    if (phase === "playing" || phase === "review") inputRef.current?.focus();
  }, [phase, index]);

  // A card that failed to load stays failed only for itself - the next
  // flag gets a fresh chance.
  useEffect(() => {
    setFailedCode(null);
  }, [current?.code]);

  // The brand (rendered by index.astro, outside this island) dispatches
  // "gtf:home" on click to send the player back to the menu.
  useEffect(() => {
    const goToMenu = () => dispatch({ type: "goHome" });
    window.addEventListener("gtf:home", goToMenu);
    return () => window.removeEventListener("gtf:home", goToMenu);
  }, []);

  // Send a card flying off the top of the deck. A fresh discard replaces any
  // card still in flight, so answering faster than the animation just looks
  // snappy rather than piling elements up.
  function discard(country: Country): void {
    discardSeq.current += 1;
    setOutgoing({ country, seq: discardSeq.current });
    window.clearTimeout(discardTimer.current);
    discardTimer.current = window.setTimeout(() => setOutgoing(null), DISCARD_MS);
  }

  function greenFlash(): void {
    setFlash(true);
    window.setTimeout(() => setFlash(false), FLASH_MS);
  }

  function startRegion(nextFilter: Filter): void {
    setInput("");
    setFlash(false);
    setOutgoing(null);
    setHeroOutgoing(null);
    dispatch({
      type: "startRegion",
      filter: nextFilter,
      deck: shuffle(poolFor(nextFilter)),
      best: readBestStreak(nextFilter),
    });
  }

  function startReview(): void {
    const pool = COUNTRIES.filter((country) => mistakes.includes(country.code));
    if (pool.length === 0) return;
    setInput("");
    setFlash(false);
    setOutgoing(null);
    setHeroOutgoing(null);
    dispatch({ type: "startReview", deck: shuffle(pool) });
  }

  // The "Next flag" button after a missed review card: discard, then advance.
  function nextReviewCard(): void {
    if (current) discard(current);
    setInput("");
    dispatch({ type: "advanceReview" });
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
      if (correct) {
        greenFlash();
        discard(current);
        setInput("");
      }
      dispatch({ type: "submit", correct });
      return;
    }

    if (phase !== "playing") return;

    if (correct) {
      setInput("");
      greenFlash();
      discard(current);
    }
    dispatch({ type: "submit", correct });
  }

  /* ----------------------------------------------------------- start menu */

  if (phase === "start") {
    return (
      <section className="quiz">
        <div className="hero" aria-hidden="true">
          <div className="hero__card hero__card--back2" />
          <div className="hero__card hero__card--back1" />
          <div className="hero__card hero__card--front" key={heroCountry?.code}>
            {heroCountry && (
              <img className="hero__flag" src={flagSrc(heroCountry)} alt="" />
            )}
          </div>
          {heroOutgoing && (
            <div
              className="hero__card hero__card--outgoing"
              key={heroOutgoing.seq}
            >
              <img
                className="hero__flag"
                src={flagSrc(heroOutgoing.country)}
                alt=""
              />
            </div>
          )}
        </div>

        <div className="intro">
          <h2 className="intro__title">Name every flag</h2>
          <p className="intro__lede">
            Type the country in English or French. One wrong answer ends the run.
          </p>
        </div>

        <p className="section-label">Choose a region</p>
        <div className="regions">
          {FILTERS.map((option) => {
            const style = REGION_STYLE[option] ?? FALLBACK_REGION_STYLE;
            return (
              <button
                key={option}
                className="region"
                type="button"
                style={
                  { "--dot": style.dot, "--tint": style.tint } as CSSProperties
                }
                onClick={() => startRegion(option)}
              >
                <RegionIcon region={option} />
                <span className="region__name">{option}</span>
                <span className="region__count">{poolFor(option).length}</span>
              </button>
            );
          })}
        </div>

        {mistakes.length > 0 && (
          <div className="review-cta">
            <div className="review-cta__text">
              <p className="review-cta__title">
                {mistakes.length} flag{mistakes.length === 1 ? "" : "s"} to
                practise
              </p>
              <p className="review-cta__note">
                Replay the ones you missed — get them right to clear them.
              </p>
            </div>
            <div className="review-cta__actions">
              <button
                className="button button--gold"
                type="button"
                onClick={startReview}
              >
                Review
              </button>
              <button
                className="link-button"
                type="button"
                onClick={() => dispatch({ type: "clearMistakes" })}
              >
                clear
              </button>
            </div>
          </div>
        )}
      </section>
    );
  }

  /* ---------------------------------------------------------- game screen */

  const inReview =
    phase === "review" || phase === "reviewAnswer" || phase === "reviewDone";
  const showsWrong = phase === "gameover" || phase === "reviewAnswer";
  const progressPct = deck.length
    ? (Math.min(index + 1, deck.length) / deck.length) * 100
    : 0;

  const flagCardClass = [
    "flag-card",
    flash ? "flag-card--correct" : "",
    showsWrong ? "flag-card--wrong" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // The stack scatters only when the run is actually over. A missed card in
  // review mode keeps the deck intact, because there are still cards to come.
  const deckClass = `deck${phase === "gameover" ? " deck--spent" : ""}`;

  return (
    <section className="quiz">
      <header className="hud">
        <div className="stat">
          <span className="stat__label">{inReview ? "Cleared" : "Streak"}</span>
          <span
            className="stat__value"
            key={inReview ? reviewStats.correct : streak}
          >
            {inReview ? reviewStats.correct : streak}
          </span>
        </div>

        <div className="hud__progress">
          <div className="progress">
            <div className="progress__fill" style={{ width: `${progressPct}%` }} />
          </div>
          <span className="progress__text">
            {Math.min(index + 1, deck.length)} / {deck.length}
          </span>
        </div>

        <div className="stat stat--right">
          <span className="stat__label">
            {inReview ? "To go" : filter === "All" ? "Best" : `Best · ${filter}`}
          </span>
          <span
            className="stat__value stat__value--gold"
            key={inReview ? `m${mistakes.length}` : `b${best}`}
          >
            {inReview ? mistakes.length : best}
          </span>
        </div>
      </header>

      {phase !== "reviewDone" && phase !== "won" && (
        <div className={deckClass}>
          <div className="deck__blank deck__blank--far" />
          <div className="deck__blank deck__blank--near" />
          <div className={flagCardClass} key={current?.code ?? "empty"}>
            {current && failedCode === current.code && (
              <div className="flag-fallback">
                <span className="flag-fallback__code">{current.code}</span>
                <span className="flag-fallback__note">
                  Couldn't load this flag — go ahead and guess anyway.
                </span>
              </div>
            )}
            {current && failedCode !== current.code && (
              <img
                className="flag"
                src={flagSrc(current)}
                srcSet={flagSrcSet(current)}
                sizes="(max-width: 660px) 92vw, 660px"
                alt="Flag to guess"
                onError={() => setFailedCode(current.code)}
              />
            )}
            {flash && (
              <span className="pop-chip" aria-hidden="true">
                +1
              </span>
            )}
          </div>
          {outgoing && (
            <div
              className="flag-card flag-card--outgoing"
              key={outgoing.seq}
              aria-hidden="true"
            >
              <img className="flag" src={flagSrc(outgoing.country)} alt="" />
            </div>
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
            placeholder="Country name — English or French"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            autoFocus
          />
          <button className="button" type="submit">
            Guess
          </button>
        </form>
      )}

      {phase === "reviewAnswer" && current && (
        <div className="result result--wrong">
          <p className="result__eyebrow">Not quite — still on your list</p>
          <p className="result__name">{current.en}</p>
          <p className="result__fr">{current.fr}</p>
          <div className="result__actions">
            <button className="button" type="button" onClick={nextReviewCard}>
              {isLastCard ? "Finish" : "Next flag"}
            </button>
          </div>
        </div>
      )}

      {phase === "gameover" && current && (
        <div className="result result--wrong">
          <p className="result__eyebrow">That was</p>
          <p className="result__name">{current.en}</p>
          <p className="result__fr">{current.fr}</p>
          <p className="result__note">
            Final streak: <strong>{streak}</strong>
            {newBest ? " — new best!" : ""}
          </p>
          <div className="result__actions">
            <button
              className="button"
              type="button"
              onClick={() => startRegion(filter as Filter)}
            >
              Play again
            </button>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => dispatch({ type: "goHome" })}
            >
              Change region
            </button>
          </div>
        </div>
      )}

      {phase === "won" && (
        <div className="result result--win">
          <p className="result__eyebrow">Perfect run</p>
          <p className="result__name">
            You named all {deck.length} flags
            {filter === "All" ? "" : ` in ${filter}`} 🏆
          </p>
          <p className="result__note">
            Streak: <strong>{streak}</strong>
          </p>
          <div className="result__actions">
            <button
              className="button"
              type="button"
              onClick={() => startRegion(filter as Filter)}
            >
              Play again
            </button>
            <button
              className="button button--ghost"
              type="button"
              onClick={() => dispatch({ type: "goHome" })}
            >
              Change region
            </button>
          </div>
        </div>
      )}

      {phase === "reviewDone" && (
        <div className="result result--win">
          <p className="result__eyebrow">Review complete</p>
          <p className="result__name">
            Cleared {reviewStats.correct} of {deck.length}
          </p>
          <p className="result__note">
            {mistakes.length === 0
              ? "Your practice list is empty. 🎉"
              : `${mistakes.length} still to practise.`}
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
              onClick={() => dispatch({ type: "goHome" })}
            >
              Back to menu
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
