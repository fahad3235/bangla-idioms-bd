// Node unit tests for bangla-idioms-bd logic + data. Run: node tests/test.js
const fs = require("fs");
const path = require("path");
global.window = {};
require("../data.js");
const DATA = global.window.IDIOMS;
const L = require("../logic.js");

let pass = 0, fail = 0;
function check(name, cond, extra) {
  if (cond) { pass++; console.log("PASS " + name); }
  else { fail++; console.log("FAIL " + name + (extra !== undefined ? " :: " + extra : "")); }
}

check("48 idioms", DATA.length === 48, DATA.length);
check("data validates clean", L.validateData(DATA).length === 0, L.validateData(DATA).join("; "));
check("ids 1..48 unique", new Set(DATA.map(d => d.id)).size === 48);
check("Bengali digits", L.toBnDigits("2026") === "২০২৬", L.toBnDigits("2026"));
check("search 'কুমির' finds 3", L.searchIdioms(DATA, "কুমির", "all").length === 3,
  L.searchIdioms(DATA, "কুমির", "all").map(d => d.idiom).join(", "));
check("search latin 'crocodile' finds literal matches",
  L.searchIdioms(DATA, "crocodile", "all").length >= 2);
check("category filter wealth", L.searchIdioms(DATA, "", "wealth").every(d => d.cat === "wealth") &&
  L.searchIdioms(DATA, "", "wealth").length === 3, L.searchIdioms(DATA, "", "wealth").length);
check("empty query returns all", L.searchIdioms(DATA, "", "all").length === 48);
check("no-match returns empty", L.searchIdioms(DATA, "zzzqqq", "all").length === 0);
check("idiom-of-day deterministic",
  L.idiomOfDay(DATA, "2026-11-01").id === L.idiomOfDay(DATA, "2026-11-01").id);
check("idiom-of-day varies across dates",
  L.idiomOfDay(DATA, "2026-11-01").id !== L.idiomOfDay(DATA, "2026-11-02").id);
check("idiom-of-day invalid date null", L.idiomOfDay(DATA, "not-a-date") === null);
check("idiom-of-day in range", DATA.includes(L.idiomOfDay(DATA, "2026-11-01")));

// Deterministic rand for quiz test: cycles 0.1, 0.5, 0.9, ...
let seq = [0.1, 0.5, 0.9, 0.2, 0.7, 0.3, 0.8, 0.4, 0.6, 0.05];
let si = 0;
const rand = () => seq[(si++) % seq.length];
const round = L.buildQuizRound(DATA, DATA[0], rand);
check("quiz round has 4 options", round.options.length === 4, round.options.length);
check("quiz round contains answer", round.options.some(o => o.id === DATA[0].id));
check("quiz options distinct meanings",
  new Set(round.options.map(o => o.meaning_en)).size === 4);
check("all category labels exist",
  DATA.every(d => L.CATS[d.cat] && L.CATS[d.cat].en && L.CATS[d.cat].bn));
check("every idiom has BN + EN meaning and example",
  DATA.every(d => d.meaning_bn.length > 5 && d.meaning_en.length > 5 &&
    d.example_bn.length > 5 && d.example_en.length > 5));

// Syntax-check app.js (parse only, no DOM execution).
try {
  new (require("vm").Script)(fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8"));
  check("app.js parses", true);
} catch (e) { check("app.js parses", false, e.message); }

console.log("\n" + pass + " passed, " + fail + " failed");
process.exit(fail ? 1 : 0);
