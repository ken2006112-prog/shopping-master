import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    if (req.method === 'GET') {
        try {
            const productRes = await pool.query('SELECT * FROM products WHERE id = $1', [id]);
            constproduct = productRes.rows[0];

            if (!product) { // Fix typo: constproduct -> const product
                return res.status(404).json({ error: 'Product not found' });
            }

            const historyRes = await pool.query('SELECT price, scraped_at FROM price_history WHERE product_id = $1 ORDER BY scraped_at DESC', [id]);

            res.status(200).json({ ...productRes.rows[0], history: historyRes.rows });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch product details' });
        }
    } else if (req.method === 'DELETE') {
        try {
            await pool.query('DELETE FROM products WHERE id = $1', [id]);
            res.status(200).json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to delete' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
