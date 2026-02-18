import Database from 'better-sqlite3';
import path from 'path';

// declare global type for db to prevent hot-reload re-initialization
declare global {
    var db: Database.Database | undefined;
}

const dbPath = path.join(process.cwd(), 'price_tracker.db');

const db = global.db || new Database(dbPath);

if (process.env.NODE_ENV !== 'production') {
    global.db = db;
}

// Initialize database schema
db.exec(`
  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    url TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    current_price INTEGER NOT NULL,
    target_price INTEGER,
    image_url TEXT,
    platform TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS price_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    price INTEGER NOT NULL,
    scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (product_id) REFERENCES products (id) ON DELETE CASCADE
  );
`);

export default db;
