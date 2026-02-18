import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import Head from 'next/head';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface PricePoint {
    price: number;
    scraped_at: string;
}

interface ProductDetails {
    id: number;
    url: string;
    title: string;
    current_price: number;
    target_price: number | null;
    image_url: string | null;
    platform: string;
    history: PricePoint[];
}

export default function ProductPage() {
    const router = useRouter();
    const { id } = router.query;
    const [product, setProduct] = useState<ProductDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!id) return;

        // In a real app, we might have a dedicated API for details + history
        // For this prototype, let's assume valid ID and we might need to add a specific endpoint 
        // or just extend the generic one to support 'get one'.
        // Let's implement a specific fetcher here or update the API.
        // For simplicity, we will fetch all and find (not efficient for prod but fine for MVP)
        // OR better: update API to support /api/products/[id]

        const fetchDetails = async () => {
            try {
                const res = await axios.get(`/api/products/${id}`);
                setProduct(res.data);
            } catch (e) {
                console.error("Failed to fetch product", e);
            } finally {
                setLoading(false);
            }
        };

        fetchDetails();
    }, [id]);

    if (loading) return <div className="flex justify-center items-center min-h-screen"><Loader2 className="animate-spin" /></div>;
    if (!product) return <div className="p-8">Product not found</div>;

    const data = product.history.map(h => ({
        date: new Date(h.scraped_at).toLocaleDateString(),
        price: h.price
    })).reverse(); // Assuming history comes newest first, chart wants oldest first usually or we verify sort

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            <Head>
                <title>{product.title} - Price History</title>
            </Head>

            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-4 h-16 flex items-center gap-4">
                    <Link href="/" className="text-gray-500 hover:text-gray-900">
                        <ArrowLeft />
                    </Link>
                    <h1 className="text-lg font-bold text-gray-900 truncate">{product.title}</h1>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 mt-8">
                <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="w-full md:w-1/3 flex justify-center bg-gray-100 rounded-lg p-4">
                            {product.image_url ? (
                                <img src={product.image_url} alt={product.title} className="max-h-64 object-contain" />
                            ) : (
                                <div className="h-48 w-full bg-gray-200" />
                            )}
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-bold px-2 py-1 bg-gray-900 text-white rounded uppercase">{product.platform}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">{product.title}</h2>
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                                NT$ {product.current_price.toLocaleString()}
                            </div>
                            {product.target_price && (
                                <p className="text-gray-500">Target: NT$ {product.target_price.toLocaleString()}</p>
                            )}

                            <a
                                href={product.url}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-block mt-6 bg-blue-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors"
                            >
                                Buy Now
                            </a>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Price History</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={data}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                                <YAxis />
                                <Tooltip formatter={(value) => `NT$ ${value}`} />
                                <Line type="monotone" dataKey="price" stroke="#2563eb" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                            </LineChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </main>
        </div>
    );
}
