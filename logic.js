// Pure logic for bangla-idioms-bd — no DOM access, unit-testable in Node.
(function (root) {
  var BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  var CATS = {
    luck: { en: "Luck", bn: "ভাগ্য" },
    character: { en: "Character", bn: "চরিত্র" },
    trouble: { en: "Trouble", bn: "বিপদ" },
    effort: { en: "Effort", bn: "পরিশ্রম" },
    wealth: { en: "Wealth", bn: "সম্পদ" },
    wisdom: { en: "Wisdom", bn: "প্রজ্ঞা" }
  };

  function toBnDigits(s) {
    return String(s).replace(/[0-9]/g, function (d) { return BN_DIGITS[+d]; });
  }

  function norm(s) {
    return (s || "").toLowerCase().trim();
  }

  // Search across idiom, transliteration, literal, both meanings.
  function searchIdioms(list, query, cat) {
    var q = norm(query);
    return list.filter(function (it) {
      if (cat && cat !== "all" && it.cat !== cat) return false;
      if (!q) return true;
      var hay = [it.idiom, it.translit, it.literal, it.meaning_en, it.meaning_bn].join(" ").toLowerCase();
      return q.split(/\s+/).every(function (w) { return hay.indexOf(w) !== -1; });
    });
  }

  // Deterministic idiom-of-the-day: day number modulo list length.
  function idiomOfDay(list, dateStr) {
    if (!list.length) return null;
    var d = new Date(dateStr + "T00:00:00Z");
    if (isNaN(d.getTime())) return null;
    var dayNum = Math.floor(d.getTime() / 86400000);
    return list[((dayNum % list.length) + list.length) % list.length];
  }

  // Build one quiz round: pick `answer`, plus 3 distractors with different
  // meanings, shuffled with a caller-supplied random function (injectable).
  function buildQuizRound(list, answer, rand) {
    rand = rand || Math.random;
    var others = list.filter(function (it) { return it.id !== answer.id; });
    var seen = {};
    var opts = [answer];
    while (opts.length < 4 && others.length) {
      var pick = others[Math.floor(rand() * others.length)];
      if (!seen[pick.id] && pick.meaning_en !== answer.meaning_en) {
        seen[pick.id] = true;
        opts.push(pick);
      }
      others = others.filter(function (it) { return it.id !== pick.id; });
    }
    // Fisher–Yates shuffle with injected rand.
    for (var i = opts.length - 1; i > 0; i--) {
      var j = Math.floor(rand() * (i + 1));
      var t = opts[i]; opts[i] = opts[j]; opts[j] = t;
    }
    return { idiom: answer, options: opts };
  }

  function validateData(list) {
    var errors = [];
    var ids = {};
    list.forEach(function (it) {
      if (!it.idiom || !it.translit || !it.literal || !it.meaning_en || !it.meaning_bn ||
          !it.example_bn || !it.example_en || !it.cat) {
        errors.push("entry " + it.id + " has an empty field");
      }
      if (ids[it.idiom]) errors.push("duplicate idiom: " + it.idiom);
      ids[it.idiom] = true;
      if (!CATS[it.cat]) errors.push("entry " + it.id + " unknown category " + it.cat);
    });
    return errors;
  }

  var api = { CATS: CATS, toBnDigits: toBnDigits, searchIdioms: searchIdioms,
              idiomOfDay: idiomOfDay, buildQuizRound: buildQuizRound,
              validateData: validateData };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.IdiomLogic = api;
})(typeof window !== "undefined" ? window : globalThis);
