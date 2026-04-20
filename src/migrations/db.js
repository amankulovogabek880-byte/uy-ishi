import pool from "../configs/db.config.js";

const migrate = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(128),
        last_name VARCHAR(128),
        email VARCHAR(256) UNIQUE NOT NULL,
        password VARCHAR(256) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(128);`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(128);`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS email VARCHAR(256);`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS password VARCHAR(256);`);
    await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;`);

    await pool.query(`UPDATE users SET first_name = COALESCE(NULLIF(first_name, ''), 'User') WHERE first_name IS NULL OR first_name = '';`);
    await pool.query(`UPDATE users SET last_name = COALESCE(NULLIF(last_name, ''), 'Name') WHERE last_name IS NULL OR last_name = '';`);

    await pool.query(`ALTER TABLE users ALTER COLUMN first_name SET NOT NULL;`);
    await pool.query(`ALTER TABLE users ALTER COLUMN last_name SET NOT NULL;`);
    await pool.query(`ALTER TABLE users ALTER COLUMN email SET NOT NULL;`);

    await pool.query(`DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'users_email_key') THEN ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email); END IF; END $$;`);

    console.log("ALL TABLES MIGRATED ✅");
  } catch (error) {
    console.error("MIGRATION FAILED ❌", error.message);
  } finally {
    await pool.end();
  }
};

migrate();
