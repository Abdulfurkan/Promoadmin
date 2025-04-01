import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';
import crypto from 'crypto';

// Access the in-memory promo codes from the promo-codes route
// This is needed because we can't directly import the variable from the other file
let inMemoryPromoCodes: { id: number; code: string; description: string }[] = [];
try {
  // Try to get the in-memory promo codes from global scope
  // @ts-expect-error Accessing global variable
  inMemoryPromoCodes = global.inMemoryPromoCodes || [];
} catch (error) {
  console.error('Error accessing in-memory promo codes:', error);
}

// In-memory storage for tokens when in Vercel environment
const inMemoryTokens: { 
  id: number; 
  token: string; 
  promo_code_id: number;
  used: number;
  created_at: string;
  used_at: string | null;
  result: string | null;
}[] = [];
let nextTokenId = 10000; // Start with a high ID to avoid conflicts

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
      const inMemoryPromoCode = inMemoryPromoCodes.find(pc => pc.id === parseInt(promoCodeId));
      
      if (inMemoryPromoCode) {
        // Generate a random token
        const token = crypto.randomBytes(16).toString('hex');
        
        // Create current timestamp in ISO format
        const now = new Date().toISOString();
        
        // Add to in-memory tokens
        const newToken = {
          id: nextTokenId++,
          token,
          promo_code_id: inMemoryPromoCode.id,
          used: 0,
          created_at: now,
          used_at: null,
          result: null
        };
        
        inMemoryTokens.push(newToken);
        
        // Store tokens in global scope for access across serverless function invocations
        try {
          // @ts-expect-error Accessing global variable
          global.inMemoryTokens = inMemoryTokens;
        } catch (error) {
          console.error('Error storing in-memory tokens:', error);
        }
        
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
      const newToken = {
        id: nextTokenId++,
        token,
        promo_code_id: promoCode.id,
        used: 0,
        created_at: now,
        used_at: null,
        result: null
      };
      
      inMemoryTokens.push(newToken);
      
      // Store tokens in global scope for access across serverless function invocations
      try {
        // @ts-expect-error Accessing global variable
        global.inMemoryTokens = inMemoryTokens;
      } catch (error) {
        console.error('Error storing in-memory tokens:', error);
      }
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
