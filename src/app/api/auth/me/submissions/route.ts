import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/lib/db';

export async function GET() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const userId = session.id;
    const email = session.email;
    
    const result = await pool.query(
      `SELECT s.*, c.title as case_title, 
       COALESCE(
          json_agg(
            json_build_object('id', tc.id, 'comment', tc.comment, 'created_at', tc.created_at)
         ) FILTER (WHERE tc.id IS NOT NULL), 
         '[]'::json
        ) as teacher_comments
        FROM submissions s 
        LEFT JOIN cases c ON s.case_id = c.id
        LEFT JOIN teacher_comments tc ON tc.submission_id::text = s.id::text
        WHERE s.user_id = $1 OR LOWER(s.email) = LOWER($2)
        GROUP BY s.id, c.title
        ORDER BY s.created_at DESC`,
      [userId || null, email]
    );
    
    return NextResponse.json(result.rows);
  } catch (err) {
    console.error('User submissions error:', err);
    return NextResponse.json({ error: 'Failed to fetch submissions' }, { status: 500 });
  }
}
