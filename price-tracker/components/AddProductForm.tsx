import { useState } from 'react';
import { addProduct } from '../lib/api';
import { Loader2 } from 'lucide-react';

interface AddProductFormProps {
    onSuccess: () => void;
}

export default function AddProductForm({ onSuccess }: AddProductFormProps) {
    const [url, setURL] = useState('');
    const [targetPrice, setTargetPrice] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            await addProduct(url, targetPrice ? parseInt(targetPrice) : undefined);
            setURL('');
            setTargetPrice('');
            onSuccess();
        } catch (err: any) {
            setError(err.response?.data?.error || 'Failed to add product');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 p-4 border rounded-lg shadow-sm bg-white">
            <h2 className="text-xl font-semibold text-gray-800">Track New Item</h2>
            <div className="flex flex-col gap-2">
                <label htmlFor="url" className="text-sm font-medium text-gray-700">Product URL (BigGo, Momo, PChome, etc.)</label>
                <input
                    type="url"
                    id="url"
                    value={url}
                    onChange={(e) => setURL(e.target.value)}
                    placeholder="https://biggo.com.tw/..."
                    required
                    className="p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
            </div>
            <div className="flex flex-col gap-2">
                <label htmlFor="targetPrice" className="text-sm font-medium text-gray-700">Target Price (Optional)</label>
                <input
                    type="number"
                    id="targetPrice"
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="Alert me when below..."
                    className="p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none text-black"
                />
            </div>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
                {isLoading ? <Loader2 className="animate-spin" size={20} /> : 'Track Product'}
            </button>
        </form>
    );
}
