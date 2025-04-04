import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

// Define interfaces for our types
export interface PromoCode {
  id: number;
  code: string;
  description: string;
}

// In-memory storage for serverless environments
declare global {
  // eslint-disable-next-line no-var
  var __inMemoryPromoCodes: PromoCode[];
}

// Initialize global variables if they don't exist
if (!global.__inMemoryPromoCodes) {
  global.__inMemoryPromoCodes = [];
}

// In-memory storage for new promo codes when in serverless environment
export const inMemoryPromoCodes: PromoCode[] = global.__inMemoryPromoCodes;

// Ensure the data directory exists
const DATA_DIR = path.join(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  console.log(`Creating data directory: ${DATA_DIR}`);
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (error) {
    console.error('Error creating data directory:', error);
    // Continue execution - we'll use in-memory as fallback
  }
}

const DB_PATH = path.join(DATA_DIR, 'tokens.db');
console.log(`Database path: ${DB_PATH}`);

// Check if we're in a serverless environment (Vercel)
export const isServerless = process.env.VERCEL !== undefined;
console.log(`Running in serverless environment: ${isServerless}, VERCEL env: ${process.env.VERCEL}`);

// Initialize database connection
export async function openDb() {
  try {
    console.log(`Opening database connection to: ${DB_PATH}`);
    const db = await open({
      filename: DB_PATH,
      driver: sqlite3.Database
    });
    console.log('Database connection opened successfully');
    return db;
  } catch (error) {
    console.error('Error opening database connection:', error);
    throw error;
  }
}

// Initialize database tables
export async function initDb() {
  try {
    console.log('Initializing database...');
    
    // If we're in a serverless environment and in-memory is empty, populate it with default data
    if (isServerless && inMemoryPromoCodes.length === 0) {
      console.log('Initializing in-memory promo codes for serverless environment');
      const defaultPromoCodes = getDefaultPromoCodes();
      let nextId = 1;
      
      for (const code of defaultPromoCodes) {
        inMemoryPromoCodes.push({
          id: nextId++,
          code: code.code,
          description: code.description
        });
      }
      
      console.log(`Initialized ${inMemoryPromoCodes.length} in-memory promo codes`);
      return null;
    }
    
    // For non-serverless environments, use SQLite
    const db = await openDb();

    // Create promo_codes table
    console.log('Creating promo_codes table if not exists');
    await db.exec(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT NOT NULL UNIQUE,
        description TEXT
      )
    `);

    // Create tokens table
    console.log('Creating tokens table if not exists');
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
    console.log(`Current promo code count: ${count.count}`);

    if (count.count === 0) {
      console.log('Adding default promo codes');
      const promoCodes = getDefaultPromoCodes();

      const stmt = await db.prepare('INSERT INTO promo_codes (code, description) VALUES (?, ?)');

      for (const code of promoCodes) {
        try {
          await stmt.run(code.code, code.description);
        } catch (error) {
          console.error(`Error inserting promo code ${code.code}:`, error);
        }
      }

      await stmt.finalize();
      console.log('Default promo codes added successfully');
    }

    console.log('Database initialization completed successfully');
    return db;
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Get default promo codes
function getDefaultPromoCodes() {
  return [
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
}
