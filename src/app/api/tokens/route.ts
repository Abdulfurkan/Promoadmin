import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

// Access the in-memory tokens from the generate route
// This is needed because we can't directly import the variable from the other file
let inMemoryTokens: { 
  id: number; 
  token: string; 
  promo_code_id: number;
  used: number;
  created_at: string;
  used_at: string | null;
  result: string | null;
}[] = [];

try {
  // Try to get the in-memory tokens from global scope
  // @ts-expect-error Accessing global variable
  inMemoryTokens = global.inMemoryTokens || [];
} catch (error) {
  console.error('Error accessing in-memory tokens:', error);
}

// Access the in-memory promo codes from the promo-codes route
const inMemoryPromoCodes: { id: number; code: string; description: string }[] = [];
try {
  // Try to get the in-memory promo codes from global scope
  // @ts-expect-error Accessing global variable
  const codes = global.inMemoryPromoCodes || [];
  inMemoryPromoCodes.push(...codes);
} catch (error) {
  console.error('Error accessing in-memory promo codes:', error);
}

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
      // Enhance in-memory tokens with promo_code field
      const enhancedInMemoryTokens = inMemoryTokens.map(token => {
        // Find the corresponding promo code
        const promoCode = inMemoryPromoCodes.find(pc => pc.id === token.promo_code_id);
        
        // Add the promo_code field to match database structure
        return {
          ...token,
          promo_code: promoCode ? promoCode.code : `Unknown (ID: ${token.promo_code_id})`
        };
      });
      
      return NextResponse.json({ 
        success: true, 
        tokens: [...tokens, ...enhancedInMemoryTokens].sort((a, b) => {
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
