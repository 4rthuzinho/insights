const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./insights.db");

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS insights (
      id TEXT PRIMARY KEY,
      regraId TEXT,
      titulo TEXT,
      descricao TEXT,
      contatoId TEXT,
      status TEXT,
      criadoEm TEXT
    )
  `);
});

module.exports = db;