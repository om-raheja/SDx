import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM cases ORDER BY created_at DESC');
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Not implemented' }, { status: 501 });
}