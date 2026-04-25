import pg from 'pg';

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

export async function initDb() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT,
        name TEXT,
        role TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS cases (
        id TEXT PRIMARY KEY,
        title TEXT,
        created_by TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS hints (
        id TEXT PRIMARY KEY,
        case_id TEXT,
        hint_order INTEGER,
        content TEXT,
        image_url TEXT,
        labs TEXT,
        FOREIGN KEY (case_id) REFERENCES cases(id)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS submissions (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        case_id TEXT,
        diagnosis TEXT,
        submitted_after_hint INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_final BOOLEAN DEFAULT false,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (case_id) REFERENCES cases(id)
      )
    `);

    console.log('Database tables initialized');
  } catch (error) {
    console.error('Failed to initialize database:', error);
    throw error;
  }
}

export default pool;