import { NextResponse } from 'next/server';
import { openDb, isServerless, inMemoryPromoCodes, PromoCode } from '@/lib/db';

let nextId = 1000; // Start with a high ID for in-memory promo codes

// Find the highest ID to ensure we don't reuse IDs
if (inMemoryPromoCodes.length > 0) {
  const maxId = Math.max(...inMemoryPromoCodes.map(pc => pc.id));
  nextId = Math.max(nextId, maxId + 1);
}

export async function GET() {
  try {
    console.log('GET promo codes, serverless mode:', isServerless);
    
    if (isServerless) {
      // In serverless environment, use in-memory storage
      console.log(`Returning ${inMemoryPromoCodes.length} in-memory promo codes`);
      return NextResponse.json({ success: true, promoCodes: inMemoryPromoCodes });
    }
    
    // In local environment, use SQLite
    const db = await openDb();
    const promoCodes = await db.all('SELECT * FROM promo_codes ORDER BY code');
    
    return NextResponse.json({ success: true, promoCodes });
  } catch (error) {
    console.error('Error fetching promo codes:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch promo codes', error: String(error) },
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
    console.log('Creating promo code:', { code, description, serverless: isServerless });
    
    if (isServerless) {
      // In serverless environment, use in-memory storage
      
      // Check if code already exists
      if (inMemoryPromoCodes.some(pc => pc.code === code)) {
        console.log('Promo code already exists in memory:', code);
        return NextResponse.json(
          { success: false, message: 'Promo code already exists' },
          { status: 409 }
        );
      }
      
      // Add to in-memory storage
      const newPromoCode: PromoCode = { 
        id: nextId++, 
        code, 
        description 
      };
      
      inMemoryPromoCodes.push(newPromoCode);
      console.log('Added in-memory promo code:', newPromoCode);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Promo code created successfully',
        promoCode: newPromoCode
      });
    }
    
    // Local environment - use SQLite
    const db = await openDb();
    
    // Check if code already exists
    const existingCode = await db.get('SELECT * FROM promo_codes WHERE code = ?', [code]);
    if (existingCode) {
      console.log('Promo code already exists in database:', code);
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
    console.log('Deleting promo code with ID:', idNum, 'serverless:', isServerless);
    
    if (isServerless) {
      // In serverless environment, use in-memory storage
      const index = inMemoryPromoCodes.findIndex(pc => pc.id === idNum);
      
      if (index === -1) {
        console.log('Promo code not found in memory:', idNum);
        return NextResponse.json(
          { success: false, message: 'Promo code not found' },
          { status: 404 }
        );
      }
      
      // Remove from in-memory storage
      const deleted = inMemoryPromoCodes.splice(index, 1)[0];
      console.log('Deleted in-memory promo code:', deleted);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Promo code deleted successfully' 
      });
    }
    
    // Local environment - use SQLite
    const db = await openDb();
    
    // Check if promo code exists
    const promoCode = await db.get('SELECT * FROM promo_codes WHERE id = ?', [idNum]) as PromoCode;
    if (!promoCode) {
      console.log('Promo code not found in database:', idNum);
      return NextResponse.json(
        { success: false, message: 'Promo code not found' },
        { status: 404 }
      );
    }
    
    // Delete the promo code
    await db.run('DELETE FROM promo_codes WHERE id = ?', [idNum]);
    console.log('Deleted promo code from database:', idNum);
    
    return NextResponse.json({ 
      success: true, 
      message: 'Promo code deleted successfully' 
    });
  } catch (error) {
    console.error('Error deleting promo code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete promo code', error: String(error) },
      { status: 500 }
    );
  }
}
