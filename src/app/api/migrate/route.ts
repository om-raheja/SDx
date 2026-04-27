import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
    await pool.query(`
      ALTER TABLE submissions ADD COLUMN IF NOT EXISTS email VARCHAR(255);
    `);
    return NextResponse.json({ success: true, message: 'Email column added' });
  } catch (err) {
    console.error('Migration error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}