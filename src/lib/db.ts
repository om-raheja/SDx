import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

const DANGEROUS_PATTERNS = [
  /^\s*DELETE\s+FROM\s+cases\s*$/i,
  /^\s*DELETE\s+FROM\s+submissions\s*$/i,
  /^\s*TRUNCATE\s+(TABLE\s+)?cases/i,
  /^\s*TRUNCATE\s+(TABLE\s+)?submissions/i,
  /^\s*DROP\s+TABLE\s+(IF\s+EXISTS\s+)?cases/i,
  /^\s*DROP\s+TABLE\s+(IF\s+EXISTS\s+)?submissions/i,
  /^\s*ALTER\s+TABLE\s+cases\s+DROP\s+COLUMN/i,
  /^\s*ALTER\s+TABLE\s+submissions\s+DROP\s+COLUMN/i,
];

function isDangerousQuery(query: string): boolean {
  return DANGEROUS_PATTERNS.some(pattern => pattern.test(query.trim()));
}

const originalQuery = pool.query.bind(pool);

pool.query = async function(query: string, ...args: any[]) {
  if (isDangerousQuery(query)) {
    const error = new Error(
      'BLOCKED: This query would delete or drop all cases/submissions. ' +
      'This operation is permanently blocked by a safety guardrail. ' +
      'If you need to delete specific records, use a WHERE clause with a specific ID.'
    );
    console.error('GUARDRAIL TRIGGERED:', query);
    throw error;
  }
  return originalQuery(query, ...args);
} as typeof pool.query;

export default pool;
