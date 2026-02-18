import { Product } from '../lib/api';
import { Trash2, ExternalLink, ArrowDown } from 'lucide-react';
import Image from 'next/image';

interface ProductCardProps {
    product: Product;
    onDelete: (id: number) => void;
}

export default function ProductCard({ product, onDelete }: ProductCardProps) {
    const isGoodPrice = product.target_price && product.current_price <= product.target_price;

    return (
        <div className="border rounded-lg shadow-sm bg-white overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow">
            <div className="relative h-48 w-full bg-gray-100 flex items-center justify-center">
                {/* Use simple img tag for external URLs if next/image domain config is hassle for scraping, 
                     but let's try to handle it gracefully or use unoptimized if needed. 
                     For simplicity in prototype, standard img tag often easier with dynamic scrape sources. */}
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.title}
                        className="object-contain h-full w-full p-2"
                    />
                ) : (
                    <div className="text-gray-400">No Image</div>
                )}
                <span className="absolute top-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {product.platform}
                </span>
            </div>

            <div className="p-4 flex flex-col flex-grow">
                <a href={product.url} target="_blank" rel="noreferrer" className="text-sm font-medium text-gray-800 line-clamp-2 hover:text-blue-600 mb-2">
                    {product.title} <ExternalLink size={12} className="inline ml-1" />
                </a>

                <div className="mt-auto">
                    <div className="flex items-end justify-between">
                        <div>
                            <p className="text-xs text-gray-500">Current Price</p>
                            <p className={`text-2xl font-bold ${isGoodPrice ? 'text-green-600' : 'text-gray-900'}`}>
                                NT$ {product.current_price.toLocaleString()}
                            </p>
                        </div>
                        {product.target_price && (
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Target</p>
                                <p className="text-sm font-medium text-gray-700">
                                    NT$ {product.target_price.toLocaleString()}
                                </p>
                            </div>
                        )}
                    </div>

                    {isGoodPrice && (
                        <div className="mt-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded flex items-center gap-1">
                            <ArrowDown size={12} /> Price Drop Alert!
                        </div>
                    )}

                    <div className="mt-4 flex justify-between items-center border-t pt-3">
                        <span className="text-xs text-gray-400">
                            Updated: {new Date(product.updated_at).toLocaleDateString()}
                        </span>
                        <button
                            onClick={() => onDelete(product.id)}
                            className="text-red-500 hover:bg-red-50 p-1 rounded transition-colors"
                            title="Remove tracking"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
