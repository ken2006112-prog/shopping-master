import type { NextApiRequest, NextApiResponse } from 'next';
import db from '../../../lib/db';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
    const { id } = req.query;

    if (!id || Array.isArray(id)) {
        return res.status(400).json({ error: 'Invalid ID' });
    }

    if (req.method === 'GET') {
        try {
            const product = db.prepare('SELECT * FROM products WHERE id = ?').get(id);

            if (!product) {
                return res.status(404).json({ error: 'Product not found' });
            }

            const history = db.prepare('SELECT price, scraped_at FROM price_history WHERE product_id = ? ORDER BY scraped_at DESC').all(id);

            res.status(200).json({ ...product, history });
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Failed to fetch product details' });
        }
    } else if (req.method === 'DELETE') {
        // Duplicate logic if we want strictly RESTful under ID, but index handles query param too.
        // Good to have strict path support.
        try {
            db.prepare('DELETE FROM products WHERE id = ?').run(id);
            res.status(200).json({ success: true });
        } catch (error) {
            res.status(500).json({ error: 'Failed to delete' });
        }
    } else {
        res.setHeader('Allow', ['GET', 'DELETE']);
        res.status(405).end(`Method ${req.method} Not Allowed`);
    }
}
