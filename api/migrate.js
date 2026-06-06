const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
});

// Set this to your Google sub ID after first login.
// Run: node api/migrate.js
// It will add user_id column and assign all existing data to this user.
const DEFAULT_USER_ID = process.env.MIGRATE_USER_ID || "DEFAULT";

const migrate = async () => {
  const client = await pool.connect();
  try {
    // Add user_id to transactions if not exists
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE transactions ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // Add user_id to debts if not exists
    await client.query(`
      DO $$ BEGIN
        ALTER TABLE debts ADD COLUMN IF NOT EXISTS user_id VARCHAR(255);
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    // Backfill existing rows with the default user ID
    if (DEFAULT_USER_ID !== "DEFAULT") {
      await client.query(`UPDATE transactions SET user_id = $1 WHERE user_id IS NULL`, [DEFAULT_USER_ID]);
      await client.query(`UPDATE debts SET user_id = $1 WHERE user_id IS NULL`, [DEFAULT_USER_ID]);
      console.log(`Backfilled existing data with user_id: ${DEFAULT_USER_ID}`);
    }

    // Set NOT NULL after backfill (only if no nulls remain)
    const nullTx = await client.query(`SELECT COUNT(*) FROM transactions WHERE user_id IS NULL`);
    if (parseInt(nullTx.rows[0].count) === 0) {
      await client.query(`ALTER TABLE transactions ALTER COLUMN user_id SET NOT NULL`).catch(() => {});
    }
    const nullDebts = await client.query(`SELECT COUNT(*) FROM debts WHERE user_id IS NULL`);
    if (parseInt(nullDebts.rows[0].count) === 0) {
      await client.query(`ALTER TABLE debts ALTER COLUMN user_id SET NOT NULL`).catch(() => {});
    }

    // Create indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_tx_user ON transactions(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_debts_user ON debts(user_id)`);

    // Ensure debt_payments table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS debt_payments (
        id SERIAL PRIMARY KEY,
        debt_id INTEGER NOT NULL REFERENCES debts(id) ON DELETE CASCADE,
        amount NUMERIC(12, 2) NOT NULL,
        note TEXT,
        date DATE NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_dp_debt ON debt_payments(debt_id);
    `);

    // Ensure budgets table exists — one monthly limit per category per user
    await client.query(`
      CREATE TABLE IF NOT EXISTS budgets (
        id SERIAL PRIMARY KEY,
        user_id VARCHAR(255) NOT NULL,
        category VARCHAR(100) NOT NULL,
        amount NUMERIC(12, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE (user_id, category)
      );
      CREATE INDEX IF NOT EXISTS idx_budgets_user ON budgets(user_id);
    `);

    console.log("Migration completed successfully.");
  } catch (err) {
    console.error("Migration failed:", err);
  } finally {
    client.release();
    await pool.end();
  }
};

migrate();
