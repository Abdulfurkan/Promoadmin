import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

// Define interfaces for our types
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
  var __inMemoryTokens: Token[];
}

// Initialize global variables if they don't exist
if (!global.__inMemoryTokens) {
  global.__inMemoryTokens = [];
}

// Access the in-memory tokens from the global scope
const inMemoryTokens: Token[] = global.__inMemoryTokens;

// This is a public endpoint that doesn't require authentication
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Token is required and must be a string' },
        { status: 400 }
      );
    }

    // Check if token exists in memory (for Vercel environment)
    if (process.env.VERCEL) {
      const inMemoryToken = inMemoryTokens.find(t => t.token === token);
      
      if (inMemoryToken) {
        // If token is found in memory and not used
        if (inMemoryToken.used === 0) {
          // Get promo code details (we have it in the token object)
          return NextResponse.json({
            success: true,
            isValid: true,
            promoCode: {
              code: inMemoryToken.promo_code,
              description: `Promo code ${inMemoryToken.promo_code}`
            }
          });
        } else {
          // Token has been used
          return NextResponse.json(
            { success: false, message: 'Token has already been used' },
            { status: 400 }
          );
        }
      }
    }

    const db = await openDb();

    // Find the token in the database
    const tokenData = await db.get('SELECT * FROM tokens WHERE token = ?', token);

    if (!tokenData) {
      // Token not found in database or memory
      return NextResponse.json({ success: true, isValid: false });
    }

    // Token found, now get the associated promo code details
    const promoCode = await db.get(
      'SELECT code, description FROM promo_codes WHERE id = ?',
      tokenData.promo_code_id
    );

    if (!promoCode) {
      // This shouldn't happen if database integrity is maintained, but handle it
      console.error(`Promo code not found for token ID: ${tokenData.id}, Promo Code ID: ${tokenData.promo_code_id}`);
      return NextResponse.json(
        { success: false, message: 'Associated promo code not found' },
        { status: 500 }
      );
    }

    // Token is valid, return details
    return NextResponse.json({
      success: true,
      isValid: true,
      promoCode: {
        code: promoCode.code,
        description: promoCode.description,
      }
    });

  } catch (error) {
    console.error('Error validating token:', error);
    // Handle JSON parsing errors specifically
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, message: 'Invalid JSON format in request body' },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { success: false, message: 'Failed to validate token' },
      { status: 500 }
    );
  }
}
