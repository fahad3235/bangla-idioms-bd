# TEST_RESULTS.md — bangla-idioms-bd (run: 2026-11-01 15:00 slot)

## Unit tests — 19/19 PASS (`node tests/test.js`)
- 48 idioms, ids 1–48 unique, data validation clean (all fields non-empty,
  categories all in the allowed set).
- Bengali digits: "2026" → "২০২৬".
- Search "কুমির" → exactly 3 (টাকার কুমির, জলে কুমির ডাঙায় বাঘ,
  খাল কেটে কুমির আনা); Latin "crocodile" matches literal glosses.
- Category filter "wealth" → 3, all wealth.
- Idiom-of-day: deterministic per date, varies across dates, invalid date → null.
- Quiz round (seeded rand): 4 options, contains the answer, 4 distinct meanings.
- `app.js` parses (vm.Script).

## Headless-Chrome smoke — 11/11 PASS (`node tests/smoke.js`, raw CDP,
Playwright headless_shell-1187, file://, 390px viewport)
- Title renders; 48 cards render; count text shows "৪৮".
- Search "কুমির" filters to 3 cards.
- Detail panel opens and closes.
- Quiz: 4 options, feedback appears after answering, next button appears.
- EN toggle swaps tagline to "48 well-known…".
- No horizontal overflow at 390px (scrollWidth ≤ 390).
- 0 console/page errors.

## Repairs during testing
- None needed for app logic. Two pre-test fixes while writing the code:
  idiom-of-day date key zero-padded (non-padded ISO dates parse
  inconsistently), and a language switch mid-quiz resets the quiz instead of
  reshuffling options under an answered round.

## Hand-verified facts
- "কুমির" search count (3) matches the data by inspection: the three idioms
  above are the only ones containing কুমির.
- Wealth category has exactly 3 members: আঙুল ফুলে কলাগাছ, টাকার কুমির,
  হাতের পাঁচ.
