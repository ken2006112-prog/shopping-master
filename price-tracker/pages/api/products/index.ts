import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { scrapeProduct } from '../../lib/scraper';

// Helper to run query (since better-sqlite3 is synchronous, we don't strictly need async/await but it's good practice for API consistency)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method === 'GET') {
        try {
            const products = db.prepare('SELECT * FROM products ORDER BY created_at DESC').all();
            res.status(200).json(products);
        } catch (error) {
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

            // 2. Insert into DB
            const insert = db.prepare(`
        INSERT INTO products (url, title, current_price, target_price, image_url, platform)
        VALUES (@url, @title, @current_price, @target_price, @image_url, @platform)
      `);

            const info = insert.run({
                url,
                title: data.title,
                current_price: data.price,
                target_price: target_price || null,
                image_url: data.image_url,
                platform: data.platform
            });

            // 3. Insert initial price history
            const insertHistory = db.prepare(`
        INSERT INTO price_history (product_id, price)
        VALUES (@product_id, @price)
      `);

            insertHistory.run({
                product_id: info.lastInsertRowid,
                price: data.price
            });

            res.status(201).json({ id: info.lastInsertRowid, ...data });
        } catch (error: any) {
            if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
                return res.status(409).json({ error: 'Product already tracked' });
            }
            console.error(error);
            res.status(500).json({ error: 'Failed to add product' });
        }
    } else if (req.method === 'DELETE') {
        const { id } = req.query;
        if (!id) return res.status(400).json({ error: 'ID required' });

        try {
            db.prepare('DELETE FROM products WHERE id = ?').run(id);
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'POST', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
