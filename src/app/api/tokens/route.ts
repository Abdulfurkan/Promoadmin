import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function GET() {
  try {
    const db = await openDb();
    
    const tokens = await db.all(`
      SELECT t.*, p.code as promo_code 
      FROM tokens t
      JOIN promo_codes p ON t.promo_code_id = p.id
      ORDER BY t.created_at DESC
    `);
    
    return NextResponse.json({ success: true, tokens });
  } catch (error) {
    console.error('Error fetching tokens:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch tokens' },
      { status: 500 }
    );
  }
}
