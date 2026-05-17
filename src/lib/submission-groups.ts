import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';

export async function getSubmissionGroupForNewSubmission(
  caseId: string,
  userId: string | null,
  email: string
): Promise<string> {
  const latestGroup = await pool.query<{ submission_group_id: string; has_final: boolean }>(
    `
    SELECT
      submission_group_id,
      BOOL_OR(is_final) AS has_final
    FROM submissions
    WHERE case_id = $1
      AND (user_id = $2 OR LOWER(email) = LOWER($3))
      AND submission_group_id IS NOT NULL
    GROUP BY submission_group_id
    ORDER BY MAX(created_at) DESC
    LIMIT 1
    `,
    [caseId, userId, email]
  );

  if (latestGroup.rows.length === 0) return uuidv4();
  if (latestGroup.rows[0].has_final) return uuidv4();
  return latestGroup.rows[0].submission_group_id;
}
