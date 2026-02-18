import { useEffect, useState } from 'react';
import Head from 'next/head';
import Image from 'next/image';
import { getProducts, deleteProduct, Product } from '../lib/api';
import AddProductForm from '../components/AddProductForm';
import ProductCard from '../components/ProductCard';
import { Loader2, Plus, Plane } from 'lucide-react';

export default function Home() {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const data = await getProducts();
            setProducts(data);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleDelete = async (id: number) => {
        if (confirm('Are you sure you want to stop tracking this item?')) {
            await deleteProduct(id);
            fetchProducts();
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans">
            <Head>
                <title>Price Tracker Dashboard</title>
                <meta name="description" content="Track prices from Momo, PChome, Shopee, and Flights" />
            </Head>

            <header className="bg-white shadow-sm sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="bg-blue-600 text-white p-1 rounded">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"></path>
                                <line x1="3" y1="6" x2="21" y2="6"></line>
                                <path d="M16 10a4 4 0 0 1-8 0"></path>
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-gray-900">Price Tracker</h1>
                    </div>
                    <button
                        onClick={() => setShowAddForm(!showAddForm)}
                        className="bg-gray-900 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors flex items-center gap-2"
                    >
                        {showAddForm ? 'Close' : <><Plus size={16} /> Track New Item</>}
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">

                {showAddForm && (
                    <div className="mb-8 animate-in fade-in slide-in-from-top-4 duration-300">
                        <AddProductForm onSuccess={() => { setShowAddForm(false); fetchProducts(); }} />
                    </div>
                )}

                <div className="mb-6 flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-800">Your Watchlist</h2>
                    <button onClick={fetchProducts} className="text-blue-600 text-sm hover:underline">
                        Refresh Prices
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin text-blue-600" size={48} />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500 mb-4">You are not tracking any items yet.</p>
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="text-blue-600 font-medium hover:underline"
                        >
                            Start tracking an item
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} onDelete={handleDelete} />
                        ))}
                    </div>
                )}

                {/* Flight Tracker Section Placeholder */}
                <section className="mt-16 border-t pt-8">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2">
                            <div className="bg-sky-500 text-white p-1 rounded-full">
                                <Plane size={20} />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-800">Flight Tracker</h2>
                        </div>
                        <a
                            href="https://www.google.com/travel/flights"
                            target="_blank"
                            rel="noreferrer"
                            className="text-sky-600 text-sm hover:underline flex items-center gap-1"
                        >
                            Go to Google Flights <ExternalLinkIcon size={14} />
                        </a>
                    </div>

                    <div className="bg-sky-50 rounded-lg p-6 border border-sky-100">
                        <p className="text-sky-800 text-sm mb-4">
                            For the most reliable flight tracking, we recommend using Google Flights directly.
                            Search your route below to quick-start a tracked search.
                        </p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                placeholder="From (e.g. TPE)"
                                className="border p-2 rounded flex-1"
                            />
                            <input
                                type="text"
                                placeholder="To (e.g. NRT)"
                                className="border p-2 rounded flex-1"
                            />
                            <button
                                className="bg-sky-600 text-white px-6 py-2 rounded font-medium hover:bg-sky-700"
                                onClick={() => {
                                    const origin = (document.querySelector('input[placeholder*="From"]') as HTMLInputElement).value;
                                    const dest = (document.querySelector('input[placeholder*="To"]') as HTMLInputElement).value;
                                    if (origin && dest) {
                                        window.open(`https://www.google.com/travel/flights?q=Flights%20to%20${dest}%20from%20${origin}`, '_blank');
                                    } else {
                                        alert('Please enter both origin and destination');
                                    }
                                }}
                            >
                                Search Flights
                            </button>
                        </div>
                    </div>
                </section>

            </main>
        </div>
    );
}

function ExternalLinkIcon({ size }: { size: number }) {
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
            <polyline points="15 3 21 3 21 9"></polyline>
            <line x1="10" y1="14" x2="21" y2="3"></line>
        </svg>
    )
}
