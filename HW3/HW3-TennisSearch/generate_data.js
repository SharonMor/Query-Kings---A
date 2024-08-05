const puppeteer = require('puppeteer');
const fs = require('fs').promises;

const baseUrl = 'https://www.espn.com/search';
const maxArticlesToScrape = 15;

const queries = [
    'top 10 tennis men ranking',
    'tennis competition',
    'best men tennis players',
];

async function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function searchAndGetArticleUrls(page, query) {
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });
    await page.type('input[type="search"]', query);
    await page.keyboard.press('Enter');
    await page.waitForSelector('.article__Results', { timeout: 60000 });
    await page.click('a.AnchorLink.Pill[aria-label="Articles"]');
    
    // Use delay function instead of page.waitForTimeout
    await delay(5000);

    const articleData = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a.AnchorLink.contentItem__content'));
        return links.map(link => ({
            url: link.href,
            title: link.querySelector('.contentItem__title')?.textContent.trim() || '',
            date: link.querySelector('.time-elapsed')?.textContent.trim() || '',
            author: link.querySelector('.author')?.textContent.trim() || '',
            imageUrl: link.querySelector('img')?.src || ''
        })).filter(item => item.url && !item.url.includes('javascript:'));
    });

    return articleData.slice(0, maxArticlesToScrape);
}

async function generateDataForQueries() {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    for (const query of queries) {
        console.log(`Processing query: "${query}"`);
        try {
            const articleData = await searchAndGetArticleUrls(page, query);
            await fs.writeFile(`data/${query.replace(/\s+/g, '_')}.json`, JSON.stringify(articleData, null, 2));
            console.log(`Data saved for query: "${query}"`);
        } catch (error) {
            console.error(`Error processing query "${query}":`, error);
        }
    }

    await browser.close();
}

generateDataForQueries().then(() => console.log('All data generated')).catch(console.error);