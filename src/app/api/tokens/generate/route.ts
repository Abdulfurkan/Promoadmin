import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';
import crypto from 'crypto';

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
    
    // Check if promo code exists
    const promoCode = await db.get('SELECT * FROM promo_codes WHERE id = ?', promoCodeId);
    
    if (!promoCode) {
      return NextResponse.json(
        { success: false, message: 'Promo code not found' },
        { status: 404 }
      );
    }
    
    // Generate a random token
    const token = crypto.randomBytes(16).toString('hex');
    
    // Insert token into database
    await db.run(
      'INSERT INTO tokens (token, promo_code_id) VALUES (?, ?)',
      [token, promoCodeId]
    );
    
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
