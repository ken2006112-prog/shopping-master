// Test API script

// We need to handle the DB import carefully since it uses ES modules in the app
// For this script, simplicity is key. Let's just use the pool directly if possible, 
// or simpler: just use fetch to hit the running local API if the server is up.
// API testing is better for E2E.

// Native fetch is available in Node 18+

async function testAddProduct() {
    const url = 'http://localhost:3000/api/products';
    const testProductUrl = 'https://shopee.tw/Apple-iPhone-16-128G-6.1%E5%90%8B-%E6%99%BA%E6%85%A7%E5%9E%8B%E6%89%8B%E6%A9%9F-5G%E6%89%8B%E6%A9%9F-%E8%98%8B%E6%9E%9C%E6%89%8B%E6%A9%9F-%E7%A9%BA%E6%A9%9F-%E4%BF%9D%E5%9B%BA%E4%B8%80%E5%B9%B4-%E5%85%A8%E6%96%B0%E5%85%AC%E5%8F%B8%E8%B2%A8-i.25964251.24634289874?sp_atk=816c278c-0230-4be6-8208-86d114389146&xptdk=816c278c-0230-4be6-8208-86d114389146';
    // Using a Shopee or generic URL. Let's start with something simpler if Shopee blocks.
    // Try a PChome one if possible, or just user's input.
    // Let's use the BigGo generic check or just a mock if we want to test DB only.
    // Actually, let's rely on the scraper.

    // Note: Node < 18 might need node-fetch.

    try {
        console.log('Adding product...');
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: 'https://24h.pchome.com.tw/prod/DYAJ93-A900H3B85', // Example PChome URL (might expire, but scraper handles generic too)
                target_price: 25000
            })
        });

        const json = await res.json();
        console.log('Status:', res.status);
        console.log('Response:', json);

        if (res.ok) {
            console.log('Successfully added product!');
        } else {
            console.error('Failed to add product.');
        }
    } catch (e) {
        console.error('Error hitting API:', e);
    }
}

testAddProduct();
