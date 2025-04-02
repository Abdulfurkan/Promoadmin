import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

// Define interfaces for our types
interface PromoCode {
  id: number;
  code: string;
  description: string;
}

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
    
    // Log the input for debugging
    console.log('Creating promo code:', { code, description });
    
    const db = await openDb();
    
    // Check if code already exists
    const existingCode = await db.get('SELECT * FROM promo_codes WHERE code = ?', [code]);
    if (existingCode) {
      console.log('Promo code already exists:', code);
      return NextResponse.json(
        { success: false, message: 'Promo code already exists' },
        { status: 409 }
      );
    }
    
    // Insert new promo code
    try {
      await db.run(
        'INSERT INTO promo_codes (code, description) VALUES (?, ?)',
        [code, description]
      );
      console.log('Successfully inserted promo code into database');
    } catch (dbError) {
      console.error('Database error during insertion:', dbError);
      return NextResponse.json(
        { success: false, message: 'Database error during promo code creation', error: String(dbError) },
        { status: 500 }
      );
    }
    
    // Get the newly created promo code
    let newPromoCode;
    try {
      newPromoCode = await db.get('SELECT * FROM promo_codes WHERE code = ?', [code]) as PromoCode;
      console.log('Retrieved new promo code:', newPromoCode);
      
      if (!newPromoCode) {
        console.error('Promo code was not found after insertion');
        return NextResponse.json(
          { success: false, message: 'Promo code was created but could not be retrieved' },
          { status: 500 }
        );
      }
    } catch (retrieveError) {
      console.error('Error retrieving newly created promo code:', retrieveError);
      return NextResponse.json(
        { success: false, message: 'Error retrieving newly created promo code', error: String(retrieveError) },
        { status: 500 }
      );
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Promo code created successfully',
      promoCode: newPromoCode
    });
  } catch (error) {
    console.error('Error creating promo code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create promo code', error: String(error) },
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
    
    const idNum = parseInt(id);
    const db = await openDb();
    
    // Check if promo code exists
    const promoCode = await db.get('SELECT * FROM promo_codes WHERE id = ?', [idNum]) as PromoCode;
    if (!promoCode) {
      return NextResponse.json(
        { success: false, message: 'Promo code not found' },
        { status: 404 }
      );
    }
    
    // Delete the promo code
    await db.run('DELETE FROM promo_codes WHERE id = ?', [idNum]);
    
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
