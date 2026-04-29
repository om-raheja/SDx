import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/lib/db';

const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!TEACHER_EMAILS.includes(session.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const result = await pool.query(`
      SELECT s.*, c.title as case_title, COALESCE(u.email, s.email, 'Unknown') as student_email
      FROM submissions s
      LEFT JOIN cases c ON s.case_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `);
    return NextResponse.json(result.rows);
  } catch {
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!TEACHER_EMAILS.includes(session.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const submissionId = searchParams.get('submission_id');
    if (!submissionId) {
      return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
    }

    await pool.query('DELETE FROM teacher_comments WHERE submission_id = $1', [submissionId]);
    const result = await pool.query('DELETE FROM submissions WHERE id = $1', [submissionId]);
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
  }
}
