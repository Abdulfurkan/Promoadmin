import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

// Initialize database connection
export async function openDb() {
  return open({
    filename: path.join(process.cwd(), 'tokens.db'),
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
      { code: 'FREELIST1', description: 'Free listing promo code 1' },
      { code: 'FREELIST2', description: 'Free listing promo code 2' },
      { code: 'FREELIST3', description: 'Free listing promo code 3' },
      { code: 'FREELIST4', description: 'Free listing promo code 4' },
      { code: 'FREELIST5', description: 'Free listing promo code 5' },
      { code: 'FREELIST6', description: 'Free listing promo code 6' },
      { code: 'FREELIST7', description: 'Free listing promo code 7' },
      { code: 'FREELIST8', description: 'Free listing promo code 8' },
      { code: 'FREELIST9', description: 'Free listing promo code 9' },
      { code: 'FREELIST10', description: 'Free listing promo code 10' },
      { code: 'DISCOUNT10', description: '10% discount promo code' },
      { code: 'DISCOUNT15', description: '15% discount promo code' },
      { code: 'DISCOUNT20', description: '20% discount promo code' },
      { code: 'DISCOUNT25', description: '25% discount promo code' },
      { code: 'DISCOUNT30', description: '30% discount promo code' },
      { code: 'FREESHIPUS', description: 'Free shipping in US' },
      { code: 'FREESHIPCA', description: 'Free shipping in Canada' },
      { code: 'FREESHIPEU', description: 'Free shipping in Europe' },
      { code: 'FREESHIPUK', description: 'Free shipping in UK' },
      { code: 'FREESHIPAU', description: 'Free shipping in Australia' },
      { code: 'WELCOME10', description: 'Welcome 10% discount' },
      { code: 'WELCOME15', description: 'Welcome 15% discount' },
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
