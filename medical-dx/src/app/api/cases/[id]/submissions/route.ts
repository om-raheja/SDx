import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId } = auth();
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id: caseId } = await params;
    const { diagnosis, submitted_after_hint, is_final } = await request.json();

    const submissionId = uuidv4();
    await pool.query(
      'INSERT INTO submissions (id, user_id, case_id, diagnosis, submitted_after_hint, created_at, is_final) VALUES ($1, $2, $3, $4, $5, NOW(), $6)',
      [submissionId, userId, caseId, diagnosis, submitted_after_hint, is_final || false]
    );

    return NextResponse.json({ success: true, submissionId });
  } catch {
    return NextResponse.json({ error: 'Failed to submit diagnosis' }, { status: 500 });
  }
}