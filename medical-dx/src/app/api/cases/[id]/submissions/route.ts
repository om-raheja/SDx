import { NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/stackauth';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: caseId } = await params;
    const body = await request.json();
    const { diagnosis, submitted_after_hint, is_final } = body;

    if (!diagnosis || submitted_after_hint === undefined) {
      return NextResponse.json({ error: 'Diagnosis and hint number required' }, { status: 400 });
    }

    const existingResult = await pool.query(
      'SELECT * FROM submissions WHERE user_id = $1 AND case_id = $2',
      [user.id, caseId]
    );

    if (existingResult.rows && existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      if (existing.submitted_after_hint < submitted_after_hint) {
        return NextResponse.json({ error: 'Cannot change diagnosis after next hint is revealed' }, { status: 400 });
      }
    }

    const submissionId = uuidv4();
    await pool.query(
      'INSERT INTO submissions (id, user_id, case_id, diagnosis, submitted_after_hint, created_at, is_final) VALUES ($1, $2, $3, $4, $5, NOW(), $6)',
      [submissionId, user.id, caseId, diagnosis, submitted_after_hint, is_final || false]
    );

    return NextResponse.json({ success: true, submissionId });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit diagnosis' }, { status: 500 });
  }
}