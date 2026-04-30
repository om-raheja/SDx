import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/lib/db';
import { backfillSubmissionGroups } from '@/lib/submission-groups';

const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!TEACHER_EMAILS.includes(session.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await backfillSubmissionGroups();
    
    const result = await pool.query(`
      SELECT s.*, c.title as case_title, COALESCE(u.email, s.email, 'Unknown') as student_email
      FROM submissions s
      LEFT JOIN cases c ON s.case_id = c.id
      LEFT JOIN users u ON s.user_id = u.id
      ORDER BY s.id
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
    const submissionIdsParam = searchParams.get('submission_ids');
    const submissionIds = submissionIdsParam
      ? submissionIdsParam.split(',').map((id) => id.trim()).filter(Boolean)
      : [];
    const caseId = searchParams.get('case_id');
    const studentEmail = searchParams.get('student_email');

    // For individual submission deletion by ID
    if (submissionId) {
      await pool.query('DELETE FROM teacher_comments WHERE submission_id = $1', [submissionId]);
      const result = await pool.query('DELETE FROM submissions WHERE id = $1', [submissionId]);
      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Submission not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true });
    }

    // For batch deletion by explicit submission IDs
    if (submissionIds.length > 0) {
      await pool.query(
        'DELETE FROM teacher_comments WHERE submission_id::text = ANY($1::text[])',
        [submissionIds]
      );
      const result = await pool.query(
        'DELETE FROM submissions WHERE id::text = ANY($1::text[])',
        [submissionIds]
      );
      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Submissions not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, deleted: result.rowCount });
    }

    // For group deletion by case and student email
    if (caseId && studentEmail) {
      const idsResult = await pool.query(
        'SELECT s.id FROM submissions s LEFT JOIN users u ON s.user_id = u.id WHERE s.case_id = $1 AND COALESCE(u.email, s.email, \'Unknown\') = $2',
        [caseId, studentEmail]
      );

      if (idsResult.rows.length === 0) {
        return NextResponse.json({ error: 'Submission group not found' }, { status: 404 });
      }

      await pool.query(
        'DELETE FROM teacher_comments WHERE submission_id IN (SELECT s.id FROM submissions s LEFT JOIN users u ON s.user_id = u.id WHERE s.case_id = $1 AND COALESCE(u.email, s.email, \'Unknown\') = $2)',
        [caseId, studentEmail]
      );

      await pool.query(
        'DELETE FROM submissions WHERE case_id = $1 AND (email = $2 OR user_id IN (SELECT id FROM users WHERE email = $2))',
        [caseId, studentEmail]
      );

      return NextResponse.json({ success: true, deleted: idsResult.rows.length });
    }

    return NextResponse.json({ error: 'Invalid parameters' }, { status: 400 });
  } catch (err) {
    console.error('Delete error:', err);
    return NextResponse.json({ error: 'Failed to delete submission' }, { status: 500 });
  }
}
