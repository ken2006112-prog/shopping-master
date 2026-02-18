import { Pool } from 'pg';

// For local dev, we might not have DATABASE_URL set yet, but in prod we will.
// This allows local dev to use a local Postgres if desired, or fallback/error.
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
});

// Helper for running queries
export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;

// Initialize tables (async function to be called or run on import if we accept top-level await shortcomings, 
// but better to run this via a script or API check. For simplicity in Next.js serverless, we can validly run it casually on connection)
const initDb = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS products (
                id SERIAL PRIMARY KEY,
                url TEXT NOT NULL UNIQUE,
                title TEXT NOT NULL,
                current_price INTEGER NOT NULL,
                target_price INTEGER,
                image_url TEXT,
                platform TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

    await pool.query(`
            CREATE TABLE IF NOT EXISTS price_history (
                id SERIAL PRIMARY KEY,
                product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                price INTEGER NOT NULL,
                scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
    console.log("Database initialized");
  } catch (err) {
    // If DATABASE_URL is missing, this will fail. That's expected until configured.
    console.error("Failed to initialize DB:", err);
  }
};

// Auto-init on load (Note: in serverless this might run multiple times, but CREATE IF NOT EXISTS is safe)
if (process.env.DATABASE_URL) {
  initDb();
}
