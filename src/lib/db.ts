import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure the data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize database connection
export async function openDb() {
  return open({
    filename: path.join(DATA_DIR, 'tokens.db'),
    driver: sqlite3.Database
  });
}

// Initialize database tables
export async function initDb() {
  const db = await openDb();

  // Create promo_codes table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS promo_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      description TEXT
    )
  `);

  // Create tokens table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS tokens (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      promo_code_id INTEGER NOT NULL,
      used INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      used_at DATETIME,
      result TEXT,
      FOREIGN KEY (promo_code_id) REFERENCES promo_codes (id)
    )
  `);

  // Check if we have promo codes, if not add some defaults
  const count = await db.get('SELECT COUNT(*) as count FROM promo_codes');

  if (count.count === 0) {
    // Add your promo codes here
    const promoCodes = [
      { code: '9999', description: 'Etsy seller $100 free credit' },
      { code: '1320', description: 'Etsy seller $50 free credit' },
      { code: '1515', description: 'Etsy seller $75 free credit' },
      { code: '4040', description: 'Etsy seller $25 free credit' },
      { code: '11111', description: 'Etsy seller $150 free credit' },
      { code: '2233', description: 'Etsy seller $200 free credit' },
      { code: '1140', description: 'Etsy seller $40 free credit' },
      { code: '10047', description: 'Etsy seller $60 free credit' },
      { code: '6760', description: 'Etsy seller $80 free credit' },
      { code: '2024', description: 'Etsy seller $120 free credit' },
      { code: '1111', description: 'Etsy seller 10% bonus credit' },
      { code: '370', description: 'Etsy seller 15% bonus credit' },
      { code: '1740', description: 'Etsy seller 20% bonus credit' },
      { code: '960', description: 'Etsy seller 25% bonus credit' },
      { code: '0228', description: 'Etsy seller 30% bonus credit' },
      { code: '0917', description: 'Etsy seller free US shipping credit' },
      { code: '0987', description: 'Etsy seller free Canada shipping credit' },
      { code: '1141', description: 'Etsy seller free Europe shipping credit' },
      { code: '1234', description: 'Etsy seller free UK shipping credit' },
      { code: '20241', description: 'Etsy seller free Australia shipping credit' },
      { code: '67960', description: 'Etsy seller 10% welcome bonus credit' },
      { code: 'WELCOME15', description: 'Etsy seller 15% welcome bonus credit' },
      { code: 'SUMMER2025', description: 'Summer 2025 special promo' },
      { code: 'WINTER2025', description: 'Winter 2025 special promo' },
      { code: 'HOLIDAY2025', description: 'Holiday 2025 special promo' }
    ];

    const stmt = await db.prepare('INSERT INTO promo_codes (code, description) VALUES (?, ?)');

    for (const code of promoCodes) {
      await stmt.run(code.code, code.description);
    }

    await stmt.finalize();
  }

  return db;
}
