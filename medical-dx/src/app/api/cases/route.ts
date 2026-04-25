import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const result = await pool.query('SELECT * FROM cases ORDER BY created_at DESC');
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, hints } = await request.json();
    if (!title || !hints || hints.length !== 7) {
      return NextResponse.json({ error: 'Title and 7 hints required' }, { status: 400 });
    }

    const caseId = uuidv4();
    await pool.query('INSERT INTO cases (id, title, created_by, created_at) VALUES ($1, $2, $3, NOW())', 
      [caseId, title, userId]);

    for (const hint of hints) {
      await pool.query('INSERT INTO hints (id, case_id, hint_order, content, image_url, labs) VALUES ($1, $2, $3, $4, $5, $6)', 
        [uuidv4(), caseId, hint.hint_order, hint.content, hint.image_url || null, hint.labs || null]);
    }

    return NextResponse.json({ success: true, caseId });
  } catch {
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}