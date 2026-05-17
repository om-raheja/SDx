import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/lib/db';

const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];

function buildSearchConditions(terms: string[], column: string, paramOffset: number) {
  const conditions = terms.map((_, i) => `${column} ILIKE $${paramOffset + i}`);
  const params = terms.map(t => `%${t}%`);
  return { conditions, params };
}

export async function GET(request: Request) {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ cases: [], submissions: [], comments: [] });
    }

    const terms = query.trim().split(/\s+/).filter(Boolean);
    const isTeacher = TEACHER_EMAILS.includes(session.email);

    const results: { cases: any[]; submissions: any[]; comments: any[] } = {
      cases: [],
      submissions: [],
      comments: [],
    };

    // Search cases by title
    const { conditions: caseConditions, params: caseParams } = buildSearchConditions(terms, 'title', 1);
    const caseResult = await pool.query(
      `SELECT id, title, created_at FROM cases WHERE ${caseConditions.join(' OR ')} ORDER BY created_at DESC`,
      caseParams
    );
    results.cases = caseResult.rows;

    if (isTeacher) {
      // Search submissions by email and diagnosis
      let paramIdx = 1;
      const emailCond = buildSearchConditions(terms, 'COALESCE(u.email, s.email)', paramIdx);
      paramIdx += emailCond.params.length;
      const diagCond = buildSearchConditions(terms, 's.diagnosis', paramIdx);
      paramIdx += diagCond.params.length;

      const subResult = await pool.query(
        `SELECT s.id, s.case_id, s.diagnosis, s.submitted_after_hint, s.created_at, s.submission_group_id,
                COALESCE(u.email, s.email) as student_email, c.title as case_title
         FROM submissions s
         LEFT JOIN cases c ON s.case_id = c.id
         LEFT JOIN users u ON s.user_id = u.id
         WHERE ${emailCond.conditions.join(' OR ')} OR ${diagCond.conditions.join(' OR ')}
         ORDER BY s.created_at DESC
         LIMIT 100`,
        [...emailCond.params, ...diagCond.params]
      );
      results.submissions = subResult.rows;

      // Search comments
      let commentParamIdx = 1;
      const commentCond = buildSearchConditions(terms, 'tc.comment', commentParamIdx);
      commentParamIdx += commentCond.params.length;
      const teacherCond = buildSearchConditions(terms, 'tc.teacher_id', commentParamIdx);

      const commentResult = await pool.query(
        `SELECT tc.id, tc.submission_id, tc.comment, tc.teacher_id, tc.created_at,
                s.case_id, s.diagnosis, COALESCE(u.email, s.email) as student_email, c.title as case_title
         FROM teacher_comments tc
         LEFT JOIN submissions s ON tc.submission_id = s.id
         LEFT JOIN cases c ON s.case_id = c.id
         LEFT JOIN users u ON s.user_id = u.id
         WHERE ${commentCond.conditions.join(' OR ')} OR ${teacherCond.conditions.join(' OR ')}
         ORDER BY tc.created_at DESC
         LIMIT 100`,
        [...commentCond.params, ...teacherCond.params]
      );
      results.comments = commentResult.rows;
    }

    return NextResponse.json(results);
  } catch (err) {
    console.error('Search error:', err);
    return NextResponse.json({ error: 'Search failed' }, { status: 500 });
  }
}
