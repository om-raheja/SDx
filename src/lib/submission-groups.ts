import { v4 as uuidv4 } from 'uuid';
import pool from '@/lib/db';

type SubmissionRow = {
  id: string;
  case_id: string;
  user_id: string | null;
  email: string | null;
  submitted_after_hint: number | null;
  submission_group_id: string | null;
};

function buildActorKey(row: SubmissionRow): string {
  const userId = (row.user_id || '').trim();
  if (userId) return `u:${userId}`;
  return `e:${(row.email || '').trim().toLowerCase()}`;
}

function shouldStartNewGroup(previousHint: number | null, currentHint: number | null): boolean {
  if (!currentHint) return false;
  if (currentHint === 1) return previousHint !== null;
  if (previousHint === null) return false;
  return currentHint < previousHint;
}

export async function backfillSubmissionGroups(): Promise<void> {
  const result = await pool.query<SubmissionRow>(`
    SELECT id, case_id, user_id, email, submitted_after_hint, submission_group_id
    FROM submissions
    ORDER BY case_id, created_at, id
  `);

  const stateByActorCase = new Map<string, { groupId: string; previousHint: number | null }>();
  const updates: Array<{ id: string; submission_group_id: string }> = [];

  for (const row of result.rows) {
    const actorKey = buildActorKey(row);
    const stateKey = `${row.case_id}::${actorKey}`;
    const state = stateByActorCase.get(stateKey);

    let groupId = state?.groupId;
    if (!groupId || shouldStartNewGroup(state?.previousHint ?? null, row.submitted_after_hint)) {
      groupId = uuidv4();
    }

    if (row.submission_group_id !== groupId) {
      updates.push({ id: row.id, submission_group_id: groupId });
    }

    stateByActorCase.set(stateKey, {
      groupId,
      previousHint: row.submitted_after_hint,
    });
  }

  if (updates.length === 0) return;

  await pool.query('BEGIN');
  try {
    for (const update of updates) {
      await pool.query(
        'UPDATE submissions SET submission_group_id = $1 WHERE id = $2',
        [update.submission_group_id, update.id]
      );
    }
    await pool.query('COMMIT');
  } catch (err) {
    await pool.query('ROLLBACK');
    throw err;
  }
}

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
