import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

// This route should be publicly accessible
export const dynamic = 'force-dynamic';

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

    const db = await openDb();

    // Find the token in the database
    const tokenData = await db.get('SELECT * FROM tokens WHERE token = ?', token);

    if (!tokenData) {
      // Token not found
      return NextResponse.json({ success: true, isValid: false });
    }

    // Token found, now get the associated promo code details
    const promoCode = await db.get(
      'SELECT code, discount_percentage FROM promo_codes WHERE id = ?',
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
        discount_percentage: promoCode.discount_percentage,
        // Add any other promo code details the extension might need here
      },
      // Optionally include token details if needed
      // tokenDetails: {
      //   created_at: tokenData.created_at,
      //   // ... other token fields
      // }
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
