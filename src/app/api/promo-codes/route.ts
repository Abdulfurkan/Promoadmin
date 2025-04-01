import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await openDb();
    const promoCodes = await db.all('SELECT * FROM promo_codes ORDER BY code');
    return NextResponse.json({ success: true, promoCodes });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch promo codes' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { code, description } = await request.json();
    
    // Validate input
    if (!code || !description) {
      return NextResponse.json(
        { success: false, message: 'Code and description are required' },
        { status: 400 }
      );
    }
    
    const db = await openDb();
    
    // Check if code already exists
    const existingCode = await db.get('SELECT * FROM promo_codes WHERE code = ?', code);
    if (existingCode) {
      return NextResponse.json(
        { success: false, message: 'Promo code already exists' },
        { status: 400 }
      );
    }
    
    // Insert new promo code
    await db.run(
      'INSERT INTO promo_codes (code, description) VALUES (?, ?)',
      code,
      description
    );
    
    // Return the newly created promo code
    const newPromoCode = await db.get('SELECT * FROM promo_codes WHERE code = ?', code);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Promo code created successfully',
      promoCode: newPromoCode
    });
  } catch (error) {
    console.error('Error creating promo code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create promo code' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json(
        { success: false, message: 'Promo code ID is required' },
        { status: 400 }
      );
    }
    
    const db = await openDb();
    
    // Check if promo code exists
    const promoCode = await db.get('SELECT * FROM promo_codes WHERE id = ?', id);
    if (!promoCode) {
      return NextResponse.json(
        { success: false, message: 'Promo code not found' },
        { status: 404 }
      );
    }
    
    // Delete the promo code
    await db.run('DELETE FROM promo_codes WHERE id = ?', id);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Promo code deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete promo code' },
      { status: 500 }
    );
  }
}
