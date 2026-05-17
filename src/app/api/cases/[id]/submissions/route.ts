import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { getSubmissionGroupForNewSubmission } from '@/lib/submission-groups';
import { checkDeleteConfirmation } from '@/lib/delete-guard';

// GUARDRAIL: This endpoint ONLY deletes submissions for a specific case by ID.
// NEVER modify this to delete all submissions across all cases.
// NEVER remove the WHERE clause. NEVER add a bulk delete endpoint.
// REQUIRES: x-delete-confirm header with valid token.

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: caseId } = await params;
    const body = await request.json();

    const email = session.email;
    const userId = session.id || null;

    if (body.diagnoses && Array.isArray(body.diagnoses)) {
      const submissionGroupId = await getSubmissionGroupForNewSubmission(caseId, userId, email);

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        for (const d of body.diagnoses) {
          await client.query(
            'INSERT INTO submissions (id, user_id, case_id, diagnosis, submitted_after_hint, created_at, is_final, email, submission_group_id, submission_type) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9)',
            [uuidv4(), userId, caseId, d.diagnosis, d.hint, false, email, submissionGroupId, 'diagnosis']
          );
        }

        if (body.problemRep) {
          await client.query(
            'INSERT INTO submissions (id, user_id, case_id, diagnosis, submitted_after_hint, created_at, is_final, email, submission_group_id, submission_type) VALUES ($1, $2, $3, $4, $5, NOW(), $6, $7, $8, $9)',
            [uuidv4(), userId, caseId, body.problemRep, body.diagnoses.length, true, email, submissionGroupId, 'problem_representation']
          );
        }

        await client.query('COMMIT');
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }

      return NextResponse.json({ success: true, submissionGroupId });
    }

    return NextResponse.json({ error: 'Invalid submission format' }, { status: 400 });
  } catch (err) {
    console.error('Submission error:', err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: 'Failed to submit diagnosis', details: message }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const confirm = checkDeleteConfirmation(request);
  if (confirm) return confirm;

  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];
    if (!TEACHER_EMAILS.includes(session.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    const { id: caseId } = await params;
    await pool.query('DELETE FROM submissions WHERE case_id = $1', [caseId]);
    
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete submissions error:', err);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}
