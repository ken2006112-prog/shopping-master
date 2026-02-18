import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../lib/db';
import { scrapeProduct } from '../../lib/scraper';
// import { sendNotification } from '../../lib/mailer'; // To be implemented

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        const products = db.prepare('SELECT * FROM products').all();
        const updates = [];

        for (const product of products) {
            try {
                // Add a small delay to avoid rate limiting if many products
                await new Promise(resolve => setTimeout(resolve, 2000));

                const data = await scrapeProduct(product.url);
                if (data && data.price > 0) {
                    // Update current price in product table
                    db.prepare('UPDATE products SET current_price = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
                        .run(data.price, product.id);

                    // Add to history
                    db.prepare('INSERT INTO price_history (product_id, price) VALUES (?, ?)')
                        .run(product.id, data.price);

                    // Check for target price alert
                    if (product.target_price && data.price <= product.target_price) {
                        // sendNotification(product, data.price);
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
