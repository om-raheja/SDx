import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const result = await pool.query(`
      SELECT s.*, c.title as case_title
      FROM submissions s
      LEFT JOIN cases c ON s.case_id = c.id
      WHERE s.user_id = $1 OR s.email = $1
      ORDER BY s.created_at DESC
    `, [session.id, session.email]);
    
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('User submissions error:', err);
    return NextResponse.json({ error: 'Failed to fetch submissions', details: String(err) }, { status: 500 });
  }
}