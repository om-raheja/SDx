import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import pool from '@/lib/db';

// GUARDRAIL: This endpoint only creates tables if they don't exist.
// It NEVER drops, truncates, or deletes any data from cases or submissions.
// NEVER add DROP TABLE, TRUNCATE, or DELETE statements to this file.

const TEACHER_EMAILS = ['soniasethi66@hotmail.com', 'buttabomma67@outlook.com'];

export async function POST() {
  try {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!TEACHER_EMAILS.includes(session.email)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'student',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id UUID PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS hints (
        id UUID PRIMARY KEY,
        case_id UUID REFERENCES cases(id),
        hint_order INT NOT NULL,
        content TEXT,
        image_url TEXT,
        labs TEXT
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id UUID PRIMARY KEY,
        user_id VARCHAR(255),
        email VARCHAR(255),
        case_id UUID REFERENCES cases(id),
        diagnosis TEXT,
        submitted_after_hint INT,
        is_final BOOLEAN DEFAULT FALSE,
        submission_group_id VARCHAR(255),
        submission_type VARCHAR(50) DEFAULT 'diagnosis',
        diagnosis_rank INT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Add submission_group_id column if it doesn't exist (for existing tables)
    await pool.query(`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                    WHERE table_name='submissions' AND column_name='submission_group_id') THEN
          ALTER TABLE submissions ADD COLUMN submission_group_id VARCHAR(255);
        END IF;
      END $$;
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS teacher_comments (
        id UUID PRIMARY KEY,
        submission_id VARCHAR(255),
        teacher_id VARCHAR(255),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    return NextResponse.json({ success: true, message: 'Tables created' });
  } catch (err) {
    console.error('Setup error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}