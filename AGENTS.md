<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# CRITICAL DATA PROTECTION RULES

## NEVER DELETE ALL CASES OR SUBMISSIONS

- **NEVER** run a DELETE query on `cases` without a WHERE clause that targets a specific case ID
- **NEVER** run a DELETE query on `submissions` without a WHERE clause that targets a specific case ID, submission ID, or submission group
- **NEVER** run `DELETE FROM cases` or `DELETE FROM submissions` without a specific ID filter
- **NEVER** run any script, migration, or command that could wipe all cases or submissions
- **NEVER** suggest or implement a "clear all data" feature
- If a task seems to require deleting all data, STOP and ask the user for clarification

## GUARDRAILS FOR DELETION OPERATIONS

- All DELETE operations must target a single entity by ID
- Deletion APIs must require an ID parameter — no bulk delete without explicit IDs
- When writing SQL, always verify the WHERE clause targets specific records
- When writing migration scripts, never include DROP TABLE or TRUNCATE on cases/submissions
