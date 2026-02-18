import axios from 'axios';

export interface Product {
    id: number;
    url: string;
    title: string;
    current_price: number;
    target_price: number | null;
    image_url: string | null;
    platform: string;
    created_at: string;
    updated_at: string;
}

export const getProducts = async (): Promise<Product[]> => {
    const response = await axios.get('/api/products');
    return response.data;
};

export const addProduct = async (url: string, target_price?: number): Promise<Product> => {
    const response = await axios.post('/api/products', { url, target_price });
    return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
    await axios.delete(`/api/products?id=${id}`);
};
