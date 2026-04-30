import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: caseId } = await params;
    const { diagnoses, is_final } = await request.json();
    // diagnoses = array of {hint_number: X, diagnosis: "text"}

    // Check if this user already has a submission_group_id for this case
    const existingGroupResult = await pool.query(
      'SELECT submission_group_id FROM submissions WHERE user_id = $1 AND case_id = $2 AND submission_group_id IS NOT NULL LIMIT 1',
      [session.id, caseId]
    );

    let submissionGroupId;
    if (existingGroupResult.rows.length > 0 && existingGroupResult.rows[0].submission_group_id) {
      // Reuse existing group ID (same submission)
      submissionGroupId = existingGroupResult.rows[0].submission_group_id;
    } else {
      // Create new group ID (new submission attempt)
      submissionGroupId = uuidv4();
    }

    // Insert all diagnoses in this submission
    for (const diag of diagnoses) {
      const submissionId = uuidv4();
      await pool.query(
        'INSERT INTO submissions (id, user_id, case_id, diagnosis, submitted_after_hint, created_at, is_final, email, submission_group_id) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8)',
        [submissionId, session.id, caseId, diag.diagnosis, diag.hint_number, is_final || false, session.email, submissionGroupId]
      );
    }

    return NextResponse.json({ success: true, submissionGroupId });
  } catch {
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