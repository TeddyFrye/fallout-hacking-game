// Import dependencies
import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(
  session({
    secret: "secret_key",
    resave: false,
    saveUninitialized: false,
  })
);
// Word pool and random word function
const wordPool = [
  "apple",
  "melon",
  "peach",
  "bloat",
  "toast",
  "float",
  "crack",
  "track",
  "broke",
  "joker",
  "poker",
  "flame",
  "frame",
  "crane",
  "train",
  "brain",
  "drain",
  "plain",
  "grain",
  "grape",
  "grate",
  "crate",
];

function randomWord(arr) {
  let randomIndex = Math.floor(Math.random() * arr.length);
  return arr[randomIndex];
}

function generateSymbolMix(words, correct) {
  let symbols = [
    "@",
    "#",
    "$",
    "%",
    "^",
    "&",
    "*",
    "(",
    ")",
    "-",
    "+",
    "=",
    "|",
    "{",
    "}",
    "[",
    "]",
    ":",
    ";",
    "?",
  ];
  let mixedArray = [
    ...words,
    ...Array(200)
      .fill()
      .map(() => symbols[Math.floor(Math.random() * symbols.length)]),
  ];
  mixedArray.push(correct); // Ensure correct word is in the mix
  mixedArray.sort(() => 0.5 - Math.random());
  return mixedArray.join(" ");
}

app.get("/", (req, res) => {
  if (!req.session.correctWord || req.query.reset) {
    req.session.correctWord = randomWord(wordPool);
    req.session.attempts = [];
  }

  const mixedSymbols = generateSymbolMix(
    wordPool.slice(0, 10),
    req.session.correctWord
  );

  res.render("index", {
    attempts: req.session.attempts,
    correctWord: req.session.correctWord, // Visible for debugging, remove for production
    mixedSymbols: mixedSymbols,
  });
});

app.post("/guess", (req, res) => {
  const guess = req.body.guess;
  if (guess.length === 5) {
    let feedback = "";
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === req.session.correctWord[i]) {
        feedback += guess[i];
      } else {
        feedback += "_ ";
      }
    }
    req.session.attempts.push({ guess: guess, feedback: feedback });

    if (feedback === req.session.correctWord) {
      const mixedSymbols = generateSymbolMix(
        wordPool.slice(0, 10),
        req.session.correctWord
      );

      // Send the correct word and mixed symbols to the win page
      return res.render("win", {
        correctWord: req.session.correctWord,
        mixedSymbols: mixedSymbols,
      });
    } else if (req.session.attempts.length >= 5) {
      // handle maximum attempts
      const mixedSymbols = generateSymbolMix(req.session.correctWord);

      // Consider also rendering the lose page with some info
      return res.render("lose", {
        correctWord: req.session.correctWord,
        mixedSymbols: mixedSymbols,
      });
    }
  }
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
