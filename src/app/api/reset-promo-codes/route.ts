import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function POST() {
  try {
    const db = await openDb();
    
    // First, delete all existing promo codes
    await db.run('DELETE FROM promo_codes');
    
    // Add the new promo codes
    const promoCodes = [
      { code: '9999', description: 'Etsy seller $100 free credit' },
      { code: '1320', description: 'Etsy seller $50 free credit' },
      { code: '1515', description: 'Etsy seller $75 free credit' },
      { code: '4040', description: 'Etsy seller $25 free credit' },
      { code: '11111', description: 'Etsy seller $150 free credit' },
      { code: '2233', description: 'Etsy seller $200 free credit' },
      { code: '1140', description: 'Etsy seller $40 free credit' },
      { code: '10047', description: 'Etsy seller $60 free credit' },
      { code: '6760', description: 'Etsy seller $80 free credit' },
      { code: '2024', description: 'Etsy seller $120 free credit' },
      { code: '1111', description: 'Etsy seller 10% bonus credit' },
      { code: '370', description: 'Etsy seller 15% bonus credit' },
      { code: '1740', description: 'Etsy seller 20% bonus credit' },
      { code: '960', description: 'Etsy seller 25% bonus credit' },
      { code: '0228', description: 'Etsy seller 30% bonus credit' },
      { code: '0917', description: 'Etsy seller free US shipping credit' },
      { code: '0987', description: 'Etsy seller free Canada shipping credit' },
      { code: '1141', description: 'Etsy seller free Europe shipping credit' },
      { code: '1234', description: 'Etsy seller free UK shipping credit' },
      { code: '20241', description: 'Etsy seller free Australia shipping credit' },
      { code: '67960', description: 'Etsy seller 10% welcome bonus credit' },
      { code: 'WELCOME15', description: 'Etsy seller 15% welcome bonus credit' },
      { code: 'SUMMER2025', description: 'Summer 2025 special promo' },
      { code: 'WINTER2025', description: 'Winter 2025 special promo' },
      { code: 'HOLIDAY2025', description: 'Holiday 2025 special promo' }
    ];
    
    const stmt = await db.prepare('INSERT INTO promo_codes (code, description) VALUES (?, ?)');
    
    for (const code of promoCodes) {
      await stmt.run(code.code, code.description);
    }
    
    await stmt.finalize();
    
    // Get the updated promo codes
    const updatedPromoCodes = await db.all('SELECT * FROM promo_codes ORDER BY code');
    
    return NextResponse.json({ 
      success: true, 
      message: 'Promo codes reset successfully',
      promoCodes: updatedPromoCodes 
    });
  } catch (error) {
    console.error('Error resetting promo codes:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to reset promo codes' },
      { status: 500 }
    );
  }
}
