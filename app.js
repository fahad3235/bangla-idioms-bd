// UI for bangla-idioms-bd. Depends on window.IDIOMS and window.IdiomLogic.
(function () {
  var L = window.IdiomLogic;
  var DATA = window.IDIOMS;
  var $ = function (id) { return document.getElementById(id); };
  var state = {
    lang: localStorage.getItem("bi-lang") || "bn",
    cat: "all",
    query: "",
    favOnly: false,
    favs: JSON.parse(localStorage.getItem("bi-favs") || "[]"),
    quiz: null,
    detailId: null
  };

  var STR = {
    en: { tagline: "48 well-known Bangla idioms, explained simply", searchPh: "Search idiom, meaning, or word…",
      all: "All", favOnly: "★ Favorites only", ofDay: "Idiom of the day", quiz: "Quiz",
      quizTitle: "Meaning quiz — pick the right meaning", startQuiz: "Start quiz", next: "Next",
      finish: "See result", score: "Score", streak: "Streak", result: "Quiz complete!",
      playAgain: "Play again", correct: "Correct!", wrong: "Not quite — the meaning is:",
      literal: "Literally", means: "It means", example: "Example", fav: "Favorite",
      count: "idioms", footer: "A personal learning tool. Idioms are presented in their standard dictionary sense; this is not an academic reference.",
      empty: "No idioms match. Try another word.", quizQ: "What does this idiom mean?", quizDone: "rounds done" },
    bn: { tagline: "৪৮টি পরিচিত বাংলা বাগধারা, সহজ ব্যাখ্যাসহ", searchPh: "বাগধারা, অর্থ বা শব্দ খুঁজুন…",
      all: "সব", favOnly: "★ শুধু পছন্দের", ofDay: "আজকের বাগধারা", quiz: "কুইজ",
      quizTitle: "অর্থ কুইজ — সঠিক অর্থটি বেছে নিন", startQuiz: "কুইজ শুরু করুন", next: "পরেরটি",
      finish: "ফলাফল দেখুন", score: "স্কোর", streak: "টানা সঠিক", result: "কুইজ শেষ!",
      playAgain: "আবার খেলুন", correct: "সঠিক!", wrong: "হয়নি — সঠিক অর্থটি হলো:",
      literal: "আক্ষরিক অর্থ", means: "প্রকৃত অর্থ", example: "উদাহরণ", fav: "পছন্দের",
      count: "টি বাগধারা", footer: "একটি ব্যক্তিগত শেখার টুল। বাগধারাগুলো প্রচলিত অভিধানগত অর্থে দেওয়া হয়েছে; এটি কোনো একাডেমিক রেফারেন্স নয়।",
      empty: "কিছু মিলল না। অন্য শব্দ চেষ্টা করুন।", quizQ: "এই বাগধারাটির অর্থ কী?", quizDone: "রাউন্ড শেষ" }
  };

  function t(key) { return STR[state.lang][key]; }
  function num(n) { return state.lang === "bn" ? L.toBnDigits(n) : String(n); }
  function catLabel(c) { return L.CATS[c][state.lang]; }
  function meaningOf(it) { return state.lang === "bn" ? it.meaning_bn : it.meaning_en; }
  function save() {
    localStorage.setItem("bi-lang", state.lang);
    localStorage.setItem("bi-favs", JSON.stringify(state.favs));
  }

  function renderLang() {
    $("tagline").textContent = t("tagline");
    $("search").placeholder = t("searchPh");
    $("favToggle").textContent = t("favOnly");
    $("ofDayTitle").textContent = t("ofDay");
    $("quizTitle").textContent = t("quizTitle");
    $("startQuiz").textContent = t("startQuiz");
    $("langBtn").textContent = state.lang === "bn" ? "English" : "বাংলা";
    $("footerText").textContent = t("footer");
    document.documentElement.lang = state.lang === "bn" ? "bn" : "en";
    renderCats(); renderList(); renderOfDay(); renderQuizChrome();
  }

  function renderCats() {
    var wrap = $("cats"); wrap.innerHTML = "";
    var all = [["all", t("all")]].concat(Object.keys(L.CATS).map(function (c) { return [c, catLabel(c)]; }));
    all.forEach(function (pair) {
      var b = document.createElement("button");
      b.className = "chip" + (state.cat === pair[0] ? " active" : "");
      b.textContent = pair[1];
      b.onclick = function () { state.cat = pair[0]; renderCats(); renderList(); };
      wrap.appendChild(b);
    });
  }

  function filtered() {
    var list = L.searchIdioms(DATA, state.query, state.cat);
    if (state.favOnly) list = list.filter(function (it) { return state.favs.indexOf(it.id) !== -1; });
    return list;
  }

  function cardHTML(it) {
    var fav = state.favs.indexOf(it.id) !== -1;
    return "<article class='card' data-id='" + it.id + "'>" +
      "<div class='card-top'><h3>" + it.idiom + "</h3>" +
      "<button class='fav' aria-label='" + t("fav") + "' data-fav='" + it.id + "'>" + (fav ? "★" : "☆") + "</button></div>" +
      "<p class='translit'>" + it.translit + "</p>" +
      "<p class='meaning'>" + meaningOf(it) + "</p>" +
      "<span class='cat'>" + catLabel(it.cat) + "</span></article>";
  }

  function renderList() {
    var list = filtered();
    $("count").textContent = num(list.length) + " " + t("count");
    var wrap = $("list");
    if (!list.length) { wrap.innerHTML = "<p class='empty'>" + t("empty") + "</p>"; return; }
    wrap.innerHTML = list.map(cardHTML).join("");
    wrap.querySelectorAll(".card").forEach(function (el) {
      el.addEventListener("click", function (e) {
        if (e.target.hasAttribute("data-fav")) return;
        showDetail(+el.getAttribute("data-id"));
      });
    });
    wrap.querySelectorAll("[data-fav]").forEach(function (btn) {
      btn.addEventListener("click", function (e) {
        e.stopPropagation();
        var id = +btn.getAttribute("data-fav");
        var i = state.favs.indexOf(id);
        if (i === -1) state.favs.push(id); else state.favs.splice(i, 1);
        save(); renderList();
      });
    });
  }

  function renderOfDay() {
    var today = new Date();
    var mm = String(today.getMonth() + 1).padStart(2, "0");
    var dd = String(today.getDate()).padStart(2, "0");
    var key = today.getFullYear() + "-" + mm + "-" + dd;
    var it = L.idiomOfDay(DATA, key);
    $("ofDay").innerHTML = cardHTML(it);
    $("ofDay").querySelector(".card").addEventListener("click", function () { showDetail(it.id); });
  }

  function showDetail(id) {
    var it = DATA.find(function (x) { return x.id === id; });
    if (!it) return;
    state.detailId = id;
    $("detail").innerHTML =
      "<button class='close' id='closeDetail' aria-label='Close'>×</button>" +
      "<h3>" + it.idiom + "</h3><p class='translit'>" + it.translit + "</p>" +
      "<p><strong>" + t("literal") + ":</strong> " + it.literal + "</p>" +
      "<p><strong>" + t("means") + ":</strong> " + meaningOf(it) + "</p>" +
      "<p><strong>" + t("example") + ":</strong> " + it.example_bn + "</p>" +
      "<p class='ex-en'>" + it.example_en + "</p>" +
      "<span class='cat'>" + catLabel(it.cat) + "</span>";
    $("detail").classList.add("open");
    $("closeDetail").onclick = function () { $("detail").classList.remove("open"); };
  }

  // ---- Quiz: 10 rounds, no repeated idiom in a session ----
  function startQuiz() {
    var pool = DATA.slice();
    for (var i = pool.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = pool[i]; pool[i] = pool[j]; pool[j] = tmp;
    }
    state.quiz = { rounds: pool.slice(0, 10), idx: 0, score: 0, streak: 0, answered: false };
    renderRound();
  }

  function renderQuizChrome() {
    // A language switch mid-quiz would reshuffle options, so reset the quiz.
    if (state.quiz) { state.quiz = null; $("quizBox").innerHTML = ""; }
  }

  function renderRound() {
    var q = state.quiz;
    var box = $("quizBox");
    if (q.idx >= q.rounds.length) {
      box.innerHTML = "<p class='quiz-result'>" + t("result") + " " + t("score") + ": " +
        num(q.score) + "/" + num(q.rounds.length) + "</p>" +
        "<button class='primary' id='againBtn'>" + t("playAgain") + "</button>";
      $("againBtn").onclick = startQuiz;
      return;
    }
    var round = L.buildQuizRound(DATA, q.rounds[q.idx]);
    var html = "<p class='quiz-meta'>" + t("score") + ": " + num(q.score) + " · " + t("streak") + ": " +
      num(q.streak) + " · " + num(q.idx + 1) + "/" + num(q.rounds.length) + "</p>" +
      "<p class='quiz-q'>" + t("quizQ") + "</p><h3 class='quiz-idiom'>" + round.idiom.idiom + "</h3><div class='opts'>";
    round.options.forEach(function (opt) {
      html += "<button class='opt' data-opt='" + opt.id + "'>" + meaningOf(opt) + "</button>";
    });
    html += "</div><p class='feedback' id='feedback'></p>";
    box.innerHTML = html;
    box.querySelectorAll(".opt").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (q.answered) return;
        q.answered = true;
        var ok = +btn.getAttribute("data-opt") === round.idiom.id;
        if (ok) { q.score++; q.streak++; $("feedback").textContent = t("correct"); $("feedback").className = "feedback ok"; }
        else { q.streak = 0; $("feedback").textContent = t("wrong") + " " + meaningOf(round.idiom); $("feedback").className = "feedback bad"; }
        box.querySelectorAll(".opt").forEach(function (b) {
          b.disabled = true;
          if (+b.getAttribute("data-opt") === round.idiom.id) b.classList.add("right");
          else if (b === btn) b.classList.add("picked-wrong");
        });
        var nb = document.createElement("button");
        nb.className = "primary"; nb.id = "nextBtn";
        nb.textContent = q.idx + 1 >= q.rounds.length ? t("finish") : t("next");
        nb.onclick = function () { q.idx++; q.answered = false; renderRound(); };
        box.appendChild(nb);
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    $("langBtn").onclick = function () { state.lang = state.lang === "bn" ? "en" : "bn"; save(); renderLang(); };
    $("search").addEventListener("input", function (e) { state.query = e.target.value; renderList(); });
    $("favToggle").onclick = function () {
      state.favOnly = !state.favOnly;
      $("favToggle").classList.toggle("active", state.favOnly);
      renderList();
    };
    $("startQuiz").onclick = startQuiz;
    renderLang();
  });
})();
