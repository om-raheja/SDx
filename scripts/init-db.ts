import pool from '@/lib/db';

async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher_comments (
        id UUID PRIMARY KEY,
        submission_id VARCHAR(255),
        teacher_id VARCHAR(255),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('teacher_comments table ready');
  } catch (err) {
    console.error('Init error:', err);
  }
}

initDb();