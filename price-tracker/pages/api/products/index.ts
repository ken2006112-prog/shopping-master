import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../../lib/db';
import { scrapeProduct } from '../../../lib/scraper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const { rows } = await pool.query('SELECT * FROM products ORDER BY created_at DESC');
            res.status(200).json(rows);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch products' });
        }
    } else if (req.method === 'POST') {
        const { url, target_price } = req.body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        try {
            // 1. Scrape the product to get initial details
            const data = await scrapeProduct(url);

            if (!data) {
                return res.status(400).json({ error: 'Failed to scrape product. Please verify the URL.' });
            }

            // 2. Insert into DB (Postgres syntax with RETURNING id)
            try {
                const insertResult = await pool.query(`
            INSERT INTO products (url, title, current_price, target_price, image_url, platform)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
          `, [url, data.title, data.price, target_price || null, data.image_url, data.platform]);

                const newId = insertResult.rows[0].id;

                // 3. Insert initial price history
                await pool.query(`
            INSERT INTO price_history (product_id, price)
            VALUES ($1, $2)
          `, [newId, data.price]);

                res.status(201).json({ id: newId, ...data });
            } catch (dbError: any) {
                if (dbError.code === '23505') { // Postgres unique constraint violation
                    return res.status(409).json({ error: 'Product already tracked' });
                }
                throw dbError;
            }

        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to add product' });
        }
    } else if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'ID required' });

        try {
            await pool.query('DELETE FROM products WHERE id = $1', [id]);
            res.status(200).json({ success: true });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to delete' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
