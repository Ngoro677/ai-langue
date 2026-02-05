import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'ialangue.db');

function getDb() {
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const db = new Database(dbPath);
  db.pragma('journal_mode = WAL');
  initSchema(db);
  return db;
}

function initSchema(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT,
      name TEXT,
      image TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );
    CREATE TABLE IF NOT EXISTS conversations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT DEFAULT 'Nouvelle conversation',
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      conversation_id TEXT NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    );
    CREATE INDEX IF NOT EXISTS idx_conv_user ON conversations(user_id);
    CREATE INDEX IF NOT EXISTS idx_msg_conv ON messages(conversation_id);
  `);
}

let db: Database.Database | null = null;

export function getDatabase(): Database.Database {
  if (!db) {
    db = getDb();
  }
  return db;
}

export type MessageRow = { id: number; role: string; content: string; created_at: number };
export type ConversationRow = { id: string; user_id: string; title: string; created_at: number };
