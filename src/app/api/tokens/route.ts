import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

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

// Access the in-memory data from the global scope
const inMemoryTokens: Token[] = global.__inMemoryTokens;

export async function GET() {
  try {
    const db = await openDb();
    
    const tokens = await db.all(`
      SELECT t.*, p.code as promo_code 
      FROM tokens t
      JOIN promo_codes p ON t.promo_code_id = p.id
      ORDER BY t.created_at DESC
    `);
    
    // In Vercel environment, merge database tokens with in-memory ones
    if (process.env.VERCEL) {
      console.log('In-memory tokens count:', inMemoryTokens.length);
      
      return NextResponse.json({ 
        success: true, 
        tokens: [...tokens, ...inMemoryTokens].sort((a, b) => {
          // Sort by created_at in descending order (newest first)
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
      });
    }
    
    return NextResponse.json({ success: true, tokens });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}
