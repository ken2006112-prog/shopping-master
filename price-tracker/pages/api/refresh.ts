import type { NextApiRequest, NextApiResponse } from 'next';
import pool from '../../lib/db';
import { scrapeProduct } from '../../lib/scraper';
import nodemailer from 'nodemailer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Configure Nodemailer transporter (Gmail by default)
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS, // App Password, NOT login password
        },
    });

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

                        // Send Email Logic
                        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
                            try {
                                await transporter.sendMail({
                                    from: `"Price Tracker" <${process.env.EMAIL_USER}>`,
                                    to: process.env.EMAIL_USER, // Send to self
                                    subject: `🔥 Price Drop Alert: ${product.title}`,
                                    text: `Good news! The price for "${product.title}" has dropped to NT$ ${data.price} (Target: ${product.target_price}).\n\nLink: ${product.url}`,
                                    html: `
                                        <h2>Price Drop Alert!</h2>
                                        <p><strong>${product.title}</strong> is now available for <strong style="color:red;">NT$ ${data.price}</strong>.</p>
                                        <p>Your target price was: NT$ ${product.target_price}</p>
                                        <p><a href="${product.url}">Buy Now</a></p>
                                    `
                                });
                                console.log('Email sent successfully');
                            } catch (emailError) {
                                console.error('Failed to send email:', emailError);
                            }
                        } else {
                            console.log('Skipping email: EMAIL_USER/PASS not set');
                        }

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
