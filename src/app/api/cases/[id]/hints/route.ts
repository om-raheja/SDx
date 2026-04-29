import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const result = await pool.query('SELECT * FROM hints WHERE case_id = $1 ORDER BY hint_order', [id]);
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch hints' }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!TEACHER_EMAILS.includes(session.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    const { hints } = await request.json();

    if (!Array.isArray(hints) || hints.length < 2 || hints.length > 20) {
      return NextResponse.json({ error: 'Need between 2-20 hints' }, { status: 400 });
    }

    await pool.query('DELETE FROM hints WHERE case_id = $1', [id]);

    for (const hint of hints) {
      await pool.query(
        'INSERT INTO hints (id, case_id, hint_order, content, image_url, labs) VALUES ($1, $2, $3, $4, $5, $6)',
        [uuidv4(), id, hint.hint_order, hint.content || '', hint.imageUrl || null, hint.labs || null]
      );
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update hints' }, { status: 500 });
  }
}
