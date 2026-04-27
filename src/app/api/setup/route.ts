import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function POST() {
  try {
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
        case_id UUID REFERENCES cases(id),
        diagnosis TEXT,
        submitted_after_hint INT,
        is_final BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    return NextResponse.json({ success: true, message: 'Tables created' });
  } catch (err) {
    console.error('Setup error:', err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}