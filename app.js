// Import dependencies
import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
dotenv.config();

import { q } from "./db.js";

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
    secret: process.env.SESSION_SECRET || "dev_secret",
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

async function ensureActiveGame(req) {
  // If session doesn’t have a game id or game finished, create a new game row
  const { rows } = await q(
    `SELECT id, finished_at FROM games WHERE session_id = $1 ORDER BY id DESC LIMIT 1`,
    [req.sessionID]
  );

  const lastGame = rows[0];
  if (!lastGame || lastGame.finished_at) {
    const correct = randomWord(wordPool);
    const inserted = await q(
      `INSERT INTO games(session_id, correct_word) VALUES ($1, $2) RETURNING id, correct_word`,
      [req.sessionID, correct]
    );
    req.session.gameId = inserted.rows[0].id;
    req.session.correctWord = inserted.rows[0].correct_word;
    req.session.attempts = [];
  } else {
    // Rehydrate session if it was new or lost
    if (!req.session.gameId) req.session.gameId = lastGame.id;
    if (!req.session.correctWord) {
      const cw = await q(`SELECT correct_word FROM games WHERE id = $1`, [
        lastGame.id,
      ]);
      req.session.correctWord = cw.rows[0].correct_word;
    }
    if (!req.session.attempts) {
      const { rows: guesses } = await q(
        `SELECT guess_text, feedback FROM guesses WHERE game_id = $1 ORDER BY id ASC`,
        [req.session.gameId]
      );
      req.session.attempts = guesses.map((g) => ({
        guess: g.guess_text,
        feedback: g.feedback,
      }));
    }
  }
}

app.get("/", async (req, res, next) => {
  try {
    if (req.query.reset) {
      // finish any active game and start fresh
      if (req.session.gameId) {
        await q(
          `UPDATE games SET finished_at = NOW(), won = FALSE WHERE id = $1 AND finished_at IS NULL`,
          [req.session.gameId]
        );
      }
      req.session.gameId = null;
      req.session.correctWord = null;
      req.session.attempts = [];
    }

    await ensureActiveGame(req);

    const mixedSymbols = generateSymbolMix(
      wordPool.slice(0, 10),
      req.session.correctWord
    );

    res.render("index", {
      attempts: req.session.attempts,
      correctWord: req.session.correctWord,
      mixedSymbols,
    });
  } catch (e) {
    next(e);
  }
});

app.post("/guess", async (req, res, next) => {
  try {
    const guess = (req.body.guess || "").trim();
    if (guess.length === 5) {
      let feedback = "";
      for (let i = 0; i < guess.length; i++) {
        feedback += guess[i] === req.session.correctWord[i] ? guess[i] : "_ ";
      }

      // Save to DB
      await q(
        `INSERT INTO guesses(game_id, guess_text, feedback) VALUES ($1, $2, $3)`,
        [req.session.gameId, guess, feedback]
      );

      // Mirror to session (still useful for rendering)
      req.session.attempts.push({ guess, feedback });

      if (feedback === req.session.correctWord) {
        await q(
          `UPDATE games SET finished_at = NOW(), won = TRUE WHERE id = $1 AND finished_at IS NULL`,
          [req.session.gameId]
        );

        const mixedSymbols = generateSymbolMix(
          wordPool.slice(0, 10),
          req.session.correctWord
        );
        return res.render("win", {
          correctWord: req.session.correctWord,
          mixedSymbols,
        });
      } else if (req.session.attempts.length >= 5) {
        await q(
          `UPDATE games SET finished_at = NOW(), won = FALSE WHERE id = $1 AND finished_at IS NULL`,
          [req.session.gameId]
        );

        const mixedSymbols = generateSymbolMix(
          wordPool.slice(0, 10),
          req.session.correctWord
        );
        return res.render("lose", {
          correctWord: req.session.correctWord,
          mixedSymbols,
        });
      }
    }
    res.redirect("/");
  } catch (e) {
    next(e);
  }
});

// app.js
app.get("/api/scoreboard", async (_req, res, next) => {
  try {
    const { rows } = await q(`
      SELECT finished_at
      FROM games
      WHERE finished_at IS NOT NULL
      ORDER BY finished_at DESC
      LIMIT 10;
    `);
    res.json(rows); // [{ finished_at: "2025-10-31T18:20:12.345Z" }, ...]
  } catch (err) {
    next(err);
  }
});

app.get("/health", (_req, res) => {
  res.status(200).send("ok");
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Server running on http://0.0.0.0:${port}`);
});
