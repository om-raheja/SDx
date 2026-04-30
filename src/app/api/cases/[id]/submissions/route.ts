import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { backfillSubmissionGroups, getSubmissionGroupForNewSubmission } from '@/lib/submission-groups';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: caseId } = await params;
    const { diagnosis, submitted_after_hint, is_final } = await request.json();

    const email = session.email;
    const userId = session.id || null;

    await backfillSubmissionGroups();
    const submissionGroupId = await getSubmissionGroupForNewSubmission(caseId, userId, email);

    const submissionId = uuidv4();
    await pool.query(
      'INSERT INTO submissions (id, user_id, case_id, diagnosis, submitted_after_hint, created_at, is_final, email, submission_group_id) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8)',
      [submissionId, userId, caseId, diagnosis, submitted_after_hint, is_final || false, email, submissionGroupId]
    );

    return NextResponse.json({ success: true, submissionId, submissionGroupId });
  } catch (err) {
    console.error('Submission error:', err);
    return NextResponse.json({ error: 'Failed to submit diagnosis' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];
    if (!TEACHER_EMAILS.includes(session.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id: caseId } = await params;
    
    // Delete all submissions for this case
    await pool.query('DELETE FROM submissions WHERE case_id = $1', [caseId]);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete submissions error:', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
