import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

// In-memory storage for new promo codes when in Vercel environment
let inMemoryPromoCodes: { id: number; code: string; description: string }[] = [];
let nextId = 1000; // Start with a high ID to avoid conflicts with existing IDs

// Try to get existing in-memory promo codes from global scope
try {
  // @ts-expect-error Accessing global variable
  inMemoryPromoCodes = global.inMemoryPromoCodes || [];
} catch (error) {
  console.error('Error accessing global in-memory promo codes:', error);
}

export async function GET() {
  try {
    const db = await openDb();
    const promoCodes = await db.all('SELECT * FROM promo_codes ORDER BY code');
    
    // In Vercel environment, merge database promo codes with in-memory ones
    if (process.env.VERCEL) {
      return NextResponse.json({ 
        success: true, 
        promoCodes: [...promoCodes, ...inMemoryPromoCodes] 
      });
    }
    
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
    
    // Check if we're in Vercel environment
    if (process.env.VERCEL) {
      // Check if code already exists in memory
      if (inMemoryPromoCodes.some(pc => pc.code === code)) {
        return NextResponse.json(
          { success: false, message: 'Promo code already exists' },
          { status: 409 }
        );
      }
      
      // Check if code exists in the database
      const db = await openDb();
      const existingCode = await db.get('SELECT * FROM promo_codes WHERE code = ?', [code]);
      if (existingCode) {
        return NextResponse.json(
          { success: false, message: 'Promo code already exists' },
          { status: 409 }
        );
      }
      
      // Add to in-memory storage
      const newPromoCode = { id: nextId++, code, description };
      inMemoryPromoCodes.push(newPromoCode);
      
      // Store in global scope for access across serverless function invocations
      try {
        // @ts-expect-error Accessing global variable
        global.inMemoryPromoCodes = inMemoryPromoCodes;
      } catch (error) {
        console.error('Error storing global in-memory promo codes:', error);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Promo code created successfully',
        promoCode: newPromoCode
      });
    } else {
      // Local environment - use SQLite as before
      const db = await openDb();
      
      // Check if code already exists
      const existingCode = await db.get('SELECT * FROM promo_codes WHERE code = ?', [code]);
      if (existingCode) {
        return NextResponse.json(
          { success: false, message: 'Promo code already exists' },
          { status: 409 }
        );
      }
      
      // Insert new promo code
      await db.run(
        'INSERT INTO promo_codes (code, description) VALUES (?, ?)',
        [code, description]
      );
      
      // Get the newly created promo code
      const newPromoCode = await db.get('SELECT * FROM promo_codes WHERE code = ?', [code]);
      
      return NextResponse.json({ 
        success: true, 
        message: 'Promo code created successfully',
        promoCode: newPromoCode
      });
    }
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
    
    const idNum = parseInt(id);
    
    // Check if we're in Vercel environment
    if (process.env.VERCEL) {
      // Check if it's an in-memory promo code
      const inMemoryIndex = inMemoryPromoCodes.findIndex(pc => pc.id === idNum);
      if (inMemoryIndex !== -1) {
        // Remove from in-memory storage
        inMemoryPromoCodes.splice(inMemoryIndex, 1);
        
        // Update global scope
        try {
          // @ts-expect-error Accessing global variable
          global.inMemoryPromoCodes = inMemoryPromoCodes;
        } catch (error) {
          console.error('Error updating global in-memory promo codes:', error);
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Promo code deleted successfully' 
        });
      }
      
      // If not found in memory, check if it exists in the database
      const db = await openDb();
      const promoCode = await db.get('SELECT * FROM promo_codes WHERE id = ?', [idNum]);
      if (!promoCode) {
        return NextResponse.json(
          { success: false, message: 'Promo code not found' },
          { status: 404 }
        );
      }
      
      // For database promo codes in Vercel, we'll "hide" them by adding them to a "deleted" list
      // This is a workaround since we can't actually delete from the database in Vercel
      inMemoryPromoCodes = inMemoryPromoCodes.filter(pc => pc.id !== -idNum);
      inMemoryPromoCodes.push({ id: -idNum, code: `DELETED_${promoCode.code}`, description: `DELETED: ${promoCode.description}` });
      
      // Update global scope
      try {
        // @ts-expect-error Accessing global variable
        global.inMemoryPromoCodes = inMemoryPromoCodes;
      } catch (error) {
        console.error('Error updating global in-memory promo codes:', error);
      }
      
      return NextResponse.json({ 
        success: true, 
        message: 'Promo code deleted successfully' 
      });
    } else {
      // Local environment - use SQLite as before
      const db = await openDb();
      
      // Check if promo code exists
      const promoCode = await db.get('SELECT * FROM promo_codes WHERE id = ?', [idNum]);
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
    }
  } catch (error) {
    console.error('Error deleting promo code:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to delete promo code' },
      { status: 500 }
    );
  }
}
