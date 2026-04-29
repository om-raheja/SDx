import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/lib/db';

export async function POST(request: Request) {
  try {
    const session = await getSession();
    
    const body = await request.json();
    const { submission_id, comment } = body;
    console.log('POST:', submission_id, comment);
    
    if (!submission_id || !comment) {
      return NextResponse.json({ error: 'Submission ID and comment required' }, { status: 400 });
    }

    const teacherId = session?.id || 'test-teacher-id';
    const teacherEmail = session?.email || 'test@teacher.com';
    
    await pool.query(
      'INSERT INTO teacher_comments (id, submission_id, teacher_id, comment, created_at) VALUES (gen_random_uuid(), $1, $2, $3, NOW())',
      [submission_id, teacherEmail, comment]
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Comment error:', err);
    return NextResponse.json({ error: 'Failed to add comment: ' + String(err) }, { status: 500 });
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const submission_id = searchParams.get('submission_id');

  if (!submission_id) {
    return NextResponse.json({ error: 'Submission ID required' }, { status: 400 });
  }

  try {
    const result = await pool.query(
      'SELECT tc.*, tc.teacher_id as teacher_name FROM teacher_comments tc WHERE tc.submission_id = $1 ORDER BY tc.created_at ASC',
      [submission_id]
    );
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('Get comments error:', err);
    return NextResponse.json([], { status: 200 });
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];
    if (!TEACHER_EMAILS.includes(session.email)) {
      return NextResponse.json({ error: 'Only teachers can delete comments' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const comment_id = searchParams.get('comment_id');

    if (!comment_id) {
      return NextResponse.json({ error: 'Comment ID required' }, { status: 400 });
    }

    await pool.query('DELETE FROM teacher_comments WHERE id = $1', [comment_id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete comment error:', err);
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 });
  }
}