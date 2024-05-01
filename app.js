// Import dependencies
import express from "express";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

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
    ...Array(30)
      .fill()
      .map(() => symbols[Math.floor(Math.random() * symbols.length)]),
  ];
  mixedArray.push(correct); // Ensure correct word is in the mix
  mixedArray.sort(() => 0.5 - Math.random());
  return mixedArray.join(" ");
}

let correctWord = randomWord(wordPool);
let attempts = [];

app.get("/", (req, res) => {
  const mixedSymbols = generateSymbolMix(wordPool.slice(0, 5), correctWord);
  res.render("index", {
    attempts: attempts,
    correctWord: correctWord,
    mixedSymbols: mixedSymbols,
  });
});

app.post("/guess", (req, res) => {
  const guess = req.body.guess;
  if (guess.length === 5) {
    let feedback = "";
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === correctWord[i]) {
        feedback += guess[i];
      } else {
        feedback += "_ ";
      }
    }
    attempts.push({ guess: guess, feedback: feedback });
    if (feedback === correctWord) {
      return res.render("win");
    }
  }
  res.redirect("/");
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
