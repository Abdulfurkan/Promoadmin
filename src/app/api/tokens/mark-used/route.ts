import { NextResponse } from 'next/server';
import { openDb } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, result } = body;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token is required' },
        { status: 400 }
      );
    }
    
    const db = await openDb();
    
    // Only mark as used if the application was successful
    if (result && result.success) {
      await db.run(`
        UPDATE tokens 
        SET used = 1, used_at = DATETIME('now'), result = ?
        WHERE token = ?
      `, [JSON.stringify(result), token]);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error marking token as used:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to mark token as used' },
      { status: 500 }
    );
  }
}
