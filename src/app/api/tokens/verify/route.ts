import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      );
    }
    
    const db = await openDb();
    
    const result = await db.get(`
      SELECT t.*, p.code as promo_code 
      FROM tokens t
      JOIN promo_codes p ON t.promo_code_id = p.id
      WHERE t.token = ?
    `, token);
    
    if (!result) {
      return NextResponse.json(
        { success: false, message: 'Invalid token' },
        { status: 404 }
      );
    }
    
    if (result.used === 1) {
      return NextResponse.json(
        { success: false, message: 'Token has already been used' },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      promoCode: result.promo_code
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to verify token' },
      { status: 500 }
    );
  }
}
