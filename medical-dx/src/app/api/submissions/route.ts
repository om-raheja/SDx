import { NextResponse } from 'next/server';
import { stackServerApp } from '@/lib/stackauth';
import pool from '@/lib/db';

const TEACHER_EMAIL = 'soniasethi66@hotmail.com';

export async function GET() {
  try {
    const user = await stackServerApp.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (user.primaryEmail !== TEACHER_EMAIL) {
      return NextResponse.json({ error: 'Forbidden - teacher only' }, { status: 403 });
    }

    const result = await pool.query(`
      SELECT s.*, u.name as student_name, c.title as case_title
      FROM submissions s
      LEFT JOIN users u ON s.user_id = u.id
      LEFT JOIN cases c ON s.case_id = c.id
      ORDER BY s.created_at DESC
    `);
    return NextResponse.json(result.rows);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}