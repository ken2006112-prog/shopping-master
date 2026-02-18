import puppeteer from 'puppeteer';

// Define a type for the scraped data
export interface ScrapedData {
    title: string;
    price: number;
    image_url: string | null;
    platform: string;
}

const USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36';

export async function scrapeProduct(url: string): Promise<ScrapedData | null> {
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH, // Use system chromium in Docker
    });

    const page = await browser.newPage();
    await page.setUserAgent(USER_AGENT);
    await page.setViewport({ width: 1280, height: 800 });

    try {
        await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });

        // Determine platform and use specific selectors
        let title = '';
        let price = 0;
        let image_url: string | null = null;
        let platform = 'unknown';

        if (url.includes('biggo.com.tw')) {
            platform = 'BigGo';
            // BigGo selectors (Example - to be verified against real site or user feedback)
            // Wait for a key element
            // await page.waitForSelector('.b-title');

            // This is a placeholder logic for BigGo. Real selectors needed.
            // Assuming we are landing on a search result or product detail.
            // For now, let's implement a generic fallback or specific known selectors if available.

            // Heuristic: Try to find Open Graph tags first as they are standard
            title = await page.$eval('meta[property="og:title"]', (el) => (el as HTMLMetaElement).content).catch(() => document.title);
            const image = await page.$eval('meta[property="og:image"]', (el) => (el as HTMLMetaElement).content).catch(() => null);
            image_url = image;

            // Price is harder via meta tags. We often need to scrape the visible price.
            // BigGo detail page often has a distinct price class.
            // Let's assume a generic scrape for now or ask user to provide example URL to test.
            // For the sake of the exercise, we will try to find a price pattern in the body if specific selector fails.
            const bodyText = await page.$eval('body', el => el.innerText);
            const priceMatch = bodyText.match(/(\$|NT\$)\s?(\d{1,3}(,\d{3})*)/);
            if (priceMatch) {
                price = parseInt(priceMatch[2].replace(/,/g, ''), 10);
            }

        } else if (url.includes('momoshop.com.tw')) {
            platform = 'Momo';
            title = await page.$eval('.pTitleName', el => el.textContent?.trim() || '').catch(() => document.title);
            // Momo price selector
            const priceText = await page.$eval('.price.text', el => el.textContent || '0').catch(() => '0');
            price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
            image_url = await page.$eval('.jqzoom', el => el.getAttribute('src')).catch(() => null);

        } else if (url.includes('pchome.com.tw')) {
            platform = 'PChome';
            title = await page.$eval('.prod_name', el => el.textContent?.trim() || '').catch(() => document.title);
            const priceText = await page.$eval('.price .val', el => el.textContent || '0').catch(() => '0');
            price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
            image_url = await page.$eval('.prod_img img', el => el.getAttribute('src')).catch(() => null);

        } else if (url.includes('shopee.tw')) {
            platform = 'Shopee';
            // Shopee is heavy on JS and often blocks automation.
            // Might need more advanced stealth or cookies.
            // Attempting basic selector
            await page.waitForSelector('.pdp-mod-product-badge-title', { timeout: 5000 }).catch(() => { });
            title = await page.$eval('.pdp-mod-product-badge-title', el => el.textContent?.trim() || '').catch(() => document.title);
            const priceText = await page.$eval('.pdp-mod-product-price', el => el.textContent || '0').catch(() => '0');
            price = parseInt(priceText.replace(/[^0-9]/g, ''), 10);
        } else {
            // Generic Fallback
            title = await page.title();
            const priceMatch = (await page.content()).match(/(\$|NT\$)\s?(\d{1,3}(,\d{3})*)/);
            if (priceMatch) {
                price = parseInt(priceMatch[2].replace(/,/g, ''), 10);
            }
        }

        // Fallback for price if still 0
        if (price === 0) {
            // Try looking for json-ld
            try {
                const jsonLd = await page.$eval('script[type="application/ld+json"]', el => JSON.parse(el.textContent || '{}'));
                if (jsonLd.offers && jsonLd.offers.price) {
                    price = parseInt(jsonLd.offers.price);
                } else if (Array.isArray(jsonLd)) {
                    const product = jsonLd.find((i: any) => i['@type'] === 'Product');
                    if (product && product.offers && product.offers.price) {
                        price = parseInt(product.offers.price);
                    }
                }
            } catch (e) {
                // ignore
            }
        }


        return {
            title,
            price,
            image_url,
            platform,
        };

    } catch (error) {
        console.error(`Failed to scrape ${url}:`, error);
        return null;
    } finally {
        await browser.close();
    }
}
