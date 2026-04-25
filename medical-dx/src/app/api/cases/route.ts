import { NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/stackauth';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const TEACHER_EMAIL = process.env.TEACHER_EMAIL || 'soniasethi66@hotmail.com';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const result = await pool.query('SELECT * FROM cases ORDER BY created_at DESC');
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json({ error: 'Failed to fetch cases' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.primaryEmail !== TEACHER_EMAIL) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { title, hints } = body;

    if (!title || !hints || hints.length !== 7) {
      return NextResponse.json({ error: 'Title and 7 hints required' }, { status: 400 });
    }

    const caseId = uuidv4();
    await pool.query(
      'INSERT INTO cases (id, title, created_by, created_at) VALUES ($1, $2, $3, NOW())',
      [caseId, title, user.id]
    );

    for (let i = 0; i < hints.length; i++) {
      const hint = hints[i];
      await pool.query(
        'INSERT INTO hints (id, case_id, hint_order, content, image_url, labs) VALUES ($1, $2, $3, $4, $5, $6)',
        [uuidv4(), caseId, i + 1, hint.content, hint.image_url || null, hint.labs || null]
      );
    }

    return NextResponse.json({ success: true, caseId });
  } catch (error) {
    console.error('Error creating case:', error);
    return NextResponse.json({ error: 'Failed to create case' }, { status: 500 });
  }
}