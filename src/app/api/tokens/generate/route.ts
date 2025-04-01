import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';
import crypto from 'crypto';

// Define interfaces for our types
interface PromoCode {
  id: number;
  code: string;
  description: string;
}

interface Token {
  id: number;
  token: string;
  promo_code_id: number;
  used: number;
  created_at: string;
  used_at: string | null;
  result: string | null;
  promo_code?: string;
}

// Extend the NodeJS global type
declare global {
  // eslint-disable-next-line no-var
  var __inMemoryPromoCodes: PromoCode[];
  // eslint-disable-next-line no-var
  var __inMemoryTokens: Token[];
}

// Initialize global variables if they don't exist
if (!global.__inMemoryPromoCodes) {
  global.__inMemoryPromoCodes = [];
}

if (!global.__inMemoryTokens) {
  global.__inMemoryTokens = [];
}

// Access the in-memory promo codes from the global scope
const inMemoryPromoCodes: PromoCode[] = global.__inMemoryPromoCodes;

// In-memory storage for tokens when in Vercel environment
const inMemoryTokens: Token[] = global.__inMemoryTokens;
let nextTokenId = 10000; // Start with a high ID to avoid conflicts

// Find the highest ID to ensure we don't reuse IDs
if (inMemoryTokens.length > 0) {
  const maxId = Math.max(...inMemoryTokens.map((t: Token) => t.id));
  nextTokenId = Math.max(nextTokenId, maxId + 1);
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { promoCodeId } = body;
    
    if (!promoCodeId) {
      return NextResponse.json(
        { success: false, message: 'Promo code ID is required' },
        { status: 400 }
      );
    }
    
    const db = await openDb();
    
    // Check if we're in Vercel environment
    if (process.env.VERCEL) {
      // Check if it's an in-memory promo code
      const inMemoryPromoCode = inMemoryPromoCodes.find((pc: PromoCode) => pc.id === parseInt(promoCodeId));
      
      if (inMemoryPromoCode) {
        // Generate a random token
        const token = crypto.randomBytes(16).toString('hex');
        
        // Create current timestamp in ISO format
        const now = new Date().toISOString();
        
        // Add to in-memory tokens
        const newToken: Token = {
          id: nextTokenId++,
          token,
          promo_code_id: inMemoryPromoCode.id,
          used: 0,
          created_at: now,
          used_at: null,
          result: null,
          promo_code: inMemoryPromoCode.code
        };
        
        inMemoryTokens.push(newToken);
        console.log('Added in-memory token for in-memory promo code:', newToken);
        
        return NextResponse.json({
          success: true,
          token,
          promoCode: inMemoryPromoCode.code
        });
      }
    }
    
    // If not an in-memory promo code or not in Vercel, check the database
    const promoCode = await db.get('SELECT * FROM promo_codes WHERE id = ?', promoCodeId);
    
    if (!promoCode) {
      return NextResponse.json(
        { success: false, message: 'Promo code not found' },
        { status: 404 }
      );
    }
    
    // Generate a random token
    const token = crypto.randomBytes(16).toString('hex');
    
    // If in Vercel, we can't write to the database, so store in memory
    if (process.env.VERCEL) {
      // Create current timestamp in ISO format
      const now = new Date().toISOString();
      
      // Add to in-memory tokens
      const newToken: Token = {
        id: nextTokenId++,
        token,
        promo_code_id: promoCode.id,
        used: 0,
        created_at: now,
        used_at: null,
        result: null,
        promo_code: promoCode.code
      };
      
      inMemoryTokens.push(newToken);
      console.log('Added in-memory token for database promo code:', newToken);
    } else {
      // In local environment, insert into database
      await db.run(
        'INSERT INTO tokens (token, promo_code_id) VALUES (?, ?)',
        [token, promoCodeId]
      );
    }
    
    return NextResponse.json({
      success: true,
      token,
      promoCode: promoCode.code
    });
  } catch (error) {
    console.error('Error generating token:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to generate token' },
      { status: 500 }
    );
  }
}
