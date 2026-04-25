import { NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/stackauth';
import pool from '@/lib/db';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const result = await pool.query(
      'SELECT * FROM hints WHERE case_id = $1 ORDER BY hint_order',
      [id]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching hints:', error);
    return NextResponse.json({ error: 'Failed to fetch hints' }, { status: 500 });
  }
}