import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/lib/db';

const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    
    const caseResult = await pool.query('SELECT * FROM cases WHERE id = $1', [id]);
    if (caseResult.rows.length === 0) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }
    
    const hintsResult = await pool.query(
      'SELECT * FROM hints WHERE case_id = $1 ORDER BY hint_order',
      [id]
    );
    
    // Get submissions for this case
    const submissionsResult = await pool.query(`
      SELECT s.*, COALESCE(u.name, 'Unknown') as student_name, COALESCE(u.email, s.email, 'Unknown') as student_email
      FROM submissions s
      LEFT JOIN users u ON s.user_id = u.id
      WHERE s.case_id = $1
      ORDER BY s.created_at DESC
    `, [id]);

    return NextResponse.json({
      case: caseResult.rows[0],
      hints: hintsResult.rows,
      submissions: submissionsResult.rows,
    });
  } catch (err) {
    console.error('Case detail error:', err);
    return NextResponse.json({ error: 'Failed to fetch case' }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    if (!TEACHER_EMAILS.includes(session.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { id } = await params;
    
    // Delete hints first
    await pool.query('DELETE FROM hints WHERE case_id = $1', [id]);
    // Delete submissions
    await pool.query('DELETE FROM submissions WHERE case_id = $1', [id]);
    // Delete case
    await pool.query('DELETE FROM cases WHERE id = $1', [id]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Delete case error:', err);
    return NextResponse.json({ error: 'Failed to delete case' }, { status: 500 });
  }
}