const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testConnection() {
    try {
        const client = await pool.connect();
        console.log('Successfully connected to Neon DB!');
        const res = await client.query('SELECT NOW()');
        console.log('Database Time:', res.rows[0]);

        // Check tables
        const tables = await client.query(`
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public'
    `);
        console.log('Tables:', tables.rows.map(r => r.table_name));

        client.release();
    } catch (err) {
        console.error('Connection failed', err);
    } finally {
        pool.end();
    }
}

testConnection();
