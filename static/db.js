let db = { cueWords:null, closeWords:null, looseWords:null };

export async function loadDB() {
  if (db.cueWords) return db;

  const [cw, close, loose] = await Promise.all([
    fetch("data/CueWords.json").then(r=>r.json()),
    fetch("data/CueCloseWords.json").then(r=>r.json()),
    fetch("data/CueLooseWords.json").then(r=>r.json())
  ]);

  db.cueWords = cw;
  db.closeWords = close;
  db.looseWords = loose;
  return db;
}

export async function randomWord() {
  const { cueWords } = await loadDB();
  return cueWords[Math.floor(Math.random()*cueWords.length)];
}

export async function randomConnections(id, relationship, num) {
  const { closeWords, looseWords } = await loadDB();

  const table = relationship === "close" ? closeWords : looseWords;
  const field = relationship === "close"
      ? "CloseRelatedWord"
      : "LooseRelatedWord";

  const filtered = table.filter(row => row.CueID === id);
  const shuffled = filtered.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, num).map(row => row[field]);
}
