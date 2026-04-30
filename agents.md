# Agent Notes: Common Misconceptions (SDx)

This document captures recurring agent mistakes and the correct behavior for this codebase.

## 1) "UI success means data saved"
- **Misconception:** If the student UI shows "submitted", persistence succeeded.
- **Reality:** Persist to DB first, then update local UI state.
- **Rule:** In `/dashboard/[id]`, only mark a hint submitted after `/api/cases/[id]/submissions` returns OK.

## 2) "Student submissions are local-only"
- **Misconception:** Student submission rendering can rely on local state.
- **Reality:** Teacher comments require durable DB records.
- **Rule:** Submission flow must always write to `submissions` table; UI state is a reflection of backend success.

## 3) "Submission grouping is permanent per student+case"
- **Misconception:** Reusing one `submission_group_id` forever is fine.
- **Reality:** Attempts must be grouped separately.
- **Rule:** Keep same group while an attempt is in progress; start a new group only after a final hint submission exists.
- **Backfill Rule:** For legacy data, split groups when `submitted_after_hint` resets/decreases (especially back to `1`).

## 4) "Teacher comments table always exists"
- **Misconception:** `/api/auth/me/submissions` can always join `teacher_comments`.
- **Reality:** Missing table can break student submission retrieval.
- **Rule:** Ensure `teacher_comments` exists before querying/joining it.

## 5) "Vercel Blob upload failures are obvious"
- **Misconception:** Generic 500 is enough.
- **Reality:** Token/config and payload constraints fail silently without clear errors.
- **Rule:** `/api/upload` must validate token, file type, file size, and return explicit `error + details`.

## 6) "Delete by email/case is reliable"
- **Misconception:** Deleting submissions by user email + case is precise enough.
- **Reality:** Group/email matching can miss or over-delete.
- **Rule:** Prefer ID-based deletion paths (`submission_id` or `submission_ids`) and sync UI state immediately.

## 7) "Default ordering is acceptable"
- **Misconception:** Any DB order is fine for submissions.
- **Reality:** Users expect newest-first.
- **Rule:** Order submissions by `created_at DESC` (tie-break by `id DESC`) and keep grouped UI sorted newest-first.
