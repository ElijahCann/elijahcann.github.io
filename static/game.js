import { randomWord, randomConnections } from "./db.js";

export async function getQuestionDataFromDB(difficulty) {
  const effectiveDifficulty = difficulty === "easy" ? "easy" : "hard";
  const numOptions = effectiveDifficulty === "easy" ? 1 : 2;

  const target = await randomWord();
  const id = target.CueID;

  const correctWords = await randomConnections(id, "close", numOptions);
  let wrongWords = await randomConnections(id, "loose", numOptions);

  let correctIndexes = [];

  if (difficulty === "hard") {
    correctIndexes = [
      Math.floor(Math.random() * 3),
      Math.floor(Math.random() * 4)
    ];

    for (let i = 0; i < 2; i++) {
      wrongWords.splice(correctIndexes[i], 0, correctWords[i]);
    }

    if (correctIndexes[1] <= correctIndexes[0]) {
      correctIndexes[0] += 1;
    }

  } else {
    correctIndexes = [Math.floor(Math.random() * 2)];
    wrongWords.splice(correctIndexes[0], 0, correctWords[0]);
  }

  return {
    target: target.CueWord,
    options: wrongWords,
    correct_indexes: correctIndexes
  };
}