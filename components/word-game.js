import readLineSync from "readline-sync";

let wordPool = [
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
let correctWord = randomWord(wordPool);
console.log(`The correct word is: ${correctWord}`);

function playGame(correctWord) {
  let guess = ``;
  let round = 5;
  for (let i = 0; i <= round; i++) {
    guess = readLineSync.question(`Enter a 5 letter word:\n`);
    let partialWord = ``;
    for (let i = 0; i < guess.length; i++) {
      if (guess[i] === correctWord[i]) {
        partialWord += guess[i];
      } else {
        partialWord += ` _ `;
      }
    }
    if (partialWord === correctWord) {
      console.log(`That's right! You win!`);
      break;
    } else {
      console.log(`${partialWord}`);
    }
  }
}

playGame(correctWord);
