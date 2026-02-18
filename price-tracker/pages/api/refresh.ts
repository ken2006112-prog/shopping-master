import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';
import { scrapeProduct } from '../../lib/scraper';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const { rows: products } = await pool.query('SELECT * FROM products');
        const updates = [];

        for (const product of products) {
            try {
                // Add a small delay to avoid rate limiting
                await new Promise(resolve => setTimeout(resolve, 2000));

                const data = await scrapeProduct(product.url);
                if (data && data.price > 0) {
                    // Update current price
                    await pool.query(
                        'UPDATE products SET current_price = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                        [data.price, product.id]
                    );

                    // Add to history
                    await pool.query(
                        'INSERT INTO price_history (product_id, price) VALUES ($1, $2)',
                        [product.id, data.price]
                    );

                    // Check for target price alert
                    if (product.target_price && data.price <= product.target_price) {
                        console.log(`Price drop alert for ${product.title}: NT$ ${data.price}`);
                        updates.push({ id: product.id, status: 'alert', title: product.title });
                    } else {
                        updates.push({ id: product.id, status: 'updated' });
                    }
                }
            } catch (err) {
                console.error(`Failed to refresh product ${product.id}`, err);
                updates.push({ id: product.id, status: 'failed' });
            }
        }

        res.status(200).json({ success: true, updates });
    } catch (error) {
        console.error('Refresh failed', error);
        res.status(500).json({ error: 'Failed to refresh prices' });
    }
}
