# বাংলা বাগধারা — Bangla Idioms BD

An offline, bilingual (বাংলা / English) explorer for 48 well-known Bangla idioms
(বাগধারা) — with literal glosses, plain-meaning explanations, example sentences,
and a meaning quiz. No server, no tracking, no network requests: open `index.html`
and it works.

## Features

1. **Browse 48 idioms** — each card shows the idiom, an approximate Latin
   transliteration, and its actual meaning.
2. **Search + category filter** — search across idiom, transliteration, literal
   gloss, and both meanings; filter by Luck, Character, Trouble, Effort, Wealth,
   or Wisdom.
3. **Detail view** — click any card for the literal meaning vs. the actual
   meaning, plus a Bangla example sentence with an English translation.
4. **Idiom of the day** — a deterministic daily pick (same idiom all day, changes
   at midnight) from the 48.
5. **Meaning quiz** — 10 rounds, no repeated idiom per session, 4 options per
   round, live score and streak.
6. **Favorites** — star idioms; favorites and the language choice persist in
   `localStorage`.
7. **Bilingual UI** — full EN/বাংলা toggle, persisted; counts render in Bengali
   digits in বাংলা mode. Responsive down to 390px.

## Stack

Plain HTML, CSS, and vanilla JavaScript. No build step, no dependencies, no
framework. `data.js` holds the idiom content; `logic.js` holds the pure,
testable functions (search, idiom-of-the-day, quiz-round builder, Bengali
digits); `app.js` holds DOM code only.

## Prerequisites

Any modern browser. For tests: Node.js 18+.

## Install / run

```bash
# No install step — just open the file:
open index.html
# …or serve it locally:
npx serve .
```

## Dev commands

```bash
node tests/test.js   # 19 unit tests (data validation, search, quiz, digits)
node tests/smoke.js <path-to-headless-chrome> "file://$PWD/index.html" 390
```

## Testing

- `tests/test.js`: 19/19 pass — 48 entries, unique idioms, all fields present,
  valid categories, search behaviour (including the 3-idiom "কুমির" case),
  deterministic idiom-of-the-day, quiz-round shape (4 distinct-meaning options
  containing the answer), Bengali-digit conversion.
- `tests/smoke.js`: 11/11 headless-Chrome checks pass — 48 cards render, search
  filters to 3, detail panel opens, quiz shows 4 options with feedback and a
  next button, EN toggle swaps the tagline, no horizontal overflow at 390px,
  0 console/page errors.

## Deployment

Static hosting of the repository root (GitHub Pages, `main` branch, root).
No environment variables, no secrets, no backend.

## Limitations

- The 48 idioms are presented in their standard, commonly understood dictionary
  sense. Idiom meanings can vary by region and context; this app is a personal
  learning tool, not an academic reference.
- Transliterations are approximate pronunciation guides, not a formal
  romanization system.
- The quiz draws from the same 48 idioms; it does not teach new idioms beyond
  the set.
- Favorites and language preference live only in the browser's `localStorage`
  and are lost if site data is cleared.

## Status

Complete MVP, published and verified (see `TEST_RESULTS.md`).
