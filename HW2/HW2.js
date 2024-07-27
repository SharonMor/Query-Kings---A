const puppeteer = require('puppeteer');
const ExcelJS = require('exceljs');

const baseUrl = 'https://www.espn.com/search';
const maxArticlesToScrape = 15;

const queries = [
    { query: 'top tennis men ranking', words: ['top', 'tennis', 'men', 'ranking'] },
    { query: 'tennis competition', words: ['tennis', 'competition'] },
    { query: 'best men tennis players', words: ['best', 'men', 'tennis', 'players'] }
];

let searchQuery, queryWords;

const stopWords = new Set([
    'the', 'and', 'a', 'to', 'of', 'in', 'that', 'is', 'on', 'for', 'with', 'as', 'it', 'are', 'this', 'by', 'be', 'was',
    'not', 'at', 'or', 'an', 'if', 'from', 'but', 'which', 'you', 'your', 'all', 'they', 'their', 'can', 'have', 'has',
    'will', 'about', 'one', 'more', 'when', 'also', 'there', 'out', 'up', 'into', 'no', 'do', 'any', 'who', 'what', 'get',
    'make', 'go', 'could', 'like', 'than', 'other', 'how', 'then', 'its', 'our', 'us', 'most', 'may', 'over', 'some',
    'after', 'them', 'man', 'we', 'these', 'just', 'her', 'him', 'his', 'said'
]);

function delay(time) {
    return new Promise(function(resolve) { 
        setTimeout(resolve, time)
    });
}

async function takeScreenshot(page, name) {
    await page.screenshot({ path: `${name}-screenshot.png`, fullPage: true });
    console.log(`Screenshot saved as ${name}-screenshot.png`);
}

async function searchAndGetArticleUrls(page, query) {
    await page.goto(baseUrl, { waitUntil: 'networkidle0' });

    console.log("Typing search query...");
    await page.type('input[type="search"]', query);

    console.log("Submitting search...");
    await page.keyboard.press('Enter');

    console.log("Waiting for search results...");
    await page.waitForSelector('.article__Results', { timeout: 60000 });

    console.log("Clicking on Articles button...");
    await page.waitForSelector('a.AnchorLink.Pill[aria-label="Articles"]', { visible: true, timeout: 60000 });
    await page.click('a.AnchorLink.Pill[aria-label="Articles"]');

    console.log("Waiting for article results to load...");
    await delay(5000);

    console.log("Collecting article URLs...");
    const articleUrls = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a.AnchorLink.contentItem__content'));
        return links.map(link => link.href).filter(href => href && !href.includes('javascript:'));
    });

    console.log(`Found ${articleUrls.length} article URLs`);
    return articleUrls.slice(0, maxArticlesToScrape);
}

async function scrapeArticle(page, url) {
    console.log(`Navigating to article: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle0' });
    console.log(`Scraping article: ${url}`);

    const articleContent = await page.evaluate(() => {
        function getTextFromNode(node) {
            let text = '';
            if (node.nodeType === Node.TEXT_NODE) {
                text += node.textContent.trim() + ' ';
            } else if (node.nodeType === Node.ELEMENT_NODE) {
                if (node.tagName.toLowerCase() === 'script' || node.tagName.toLowerCase() === 'style') {
                    return '';
                }
                for (let child of node.childNodes) {
                    text += getTextFromNode(child);
                }
            }
            return text;
        }

        const content = getTextFromNode(document.body);
        return content.replace(/\s+/g, ' ').trim();
    });

    console.log(`Article content length: ${articleContent.length} characters`);
    console.log(`Article content (first 200 characters): ${articleContent.substring(0, 200)}`);
    
    queryWords.forEach(word => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        const matches = (articleContent.match(regex) || []).length;
        console.log(`Query word "${word}" found ${matches} times in article: ${url}`);
    });

    return { text: articleContent, url };
}

function createWordCounts(texts) {
    let wordCounts = {};
    let urlWordCounts = {};

    texts.forEach(entry => {
        if (!entry || !entry.text || typeof entry.text !== 'string') return;
        
        const words = entry.text.toLowerCase().match(/\b\w+(?:'\w+)?\b/g) || [];
        urlWordCounts[entry.url] = {};
        
        words.forEach(word => {
            if (!queryWords.includes(word.toLowerCase()) && stopWords.has(word)) return;
            
            wordCounts[word] = (wordCounts[word] || 0) + 1;
            urlWordCounts[entry.url][word] = (urlWordCounts[entry.url][word] || 0) + 1;
        });

        queryWords.forEach(queryWord => {
            const count = urlWordCounts[entry.url][queryWord.toLowerCase()] || 0;
            console.log(`Query word "${queryWord}" count in ${entry.url}: ${count}`);
            if (count === 0) {
                const regex = new RegExp(`\\b${queryWord}\\b`, 'gi');
                const matches = (entry.text.match(regex) || []).length;
                console.log(`Regex found ${matches} matches for "${queryWord}" in ${entry.url}`);
                console.log(`Content snippet for ${entry.url}:`, entry.text.substring(0, 200));
            }
        });
    });

    console.log("Total word counts:", queryWords.map(w => `${w}: ${wordCounts[w.toLowerCase()] || 0}`).join(', '));

    return { wordCounts, urlWordCounts };
}

function calculateTF(word, document) {
    const wordCount = document[word.toLowerCase()] || 0;
    const totalWords = Object.values(document).reduce((sum, count) => sum + count, 0);
    return wordCount / totalWords;
}

function calculateIDF(word, documents) {
    const documentsWithWord = documents.filter(doc => doc[word.toLowerCase()]).length;
    return Math.log((documents.length + 1) / (documentsWithWord + 1)) + 1;
}

function calculateTFIDF(word, document, documents) {
    const tf = calculateTF(word, document);
    const idf = calculateIDF(word, documents);
    const tfidf = tf * idf;
    console.log(`TF-IDF calculation for "${word}": TF = ${tf}, IDF = ${idf}, TF-IDF = ${tfidf}`);
    return tfidf;
}

function createWordCountSheet(workbook, wordCounts, sheetName) {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.addRow(['Word', 'Total Occurrences']);
    Object.entries(wordCounts).sort((a, b) => b[1] - a[1]).forEach(([word, count]) => {
        sheet.addRow([word, count]);
    });
}

function createInvertedIndexSheet(workbook, wordCounts, urlWordCounts, articleUrls, sheetName) {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.addRow(['Word', ...articleUrls, 'Total Occurrences']);

    const topWords = Object.entries(wordCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 15)
        .map(([word]) => word);

    const wordsToShow = [...new Set([...topWords, ...queryWords])];
    wordsToShow.forEach(word => {
        const row = [word];
        articleUrls.forEach(url => {
            const count = urlWordCounts[url][word.toLowerCase()] || 0;
            row.push(count);
        });
        row.push(wordCounts[word.toLowerCase()] || 0);
        sheet.addRow(row);
    });
}

function createTFIDFSheet(workbook, urlWordCounts, articleUrls, sheetName) {
    const sheet = workbook.addWorksheet(sheetName);
    sheet.addRow(['Word', ...articleUrls]);

    queryWords.forEach(word => {
        const row = [word];
        const idf = calculateIDF(word, Object.values(urlWordCounts));
        
        articleUrls.forEach(url => {
            const tfidf = calculateTFIDF(word, urlWordCounts[url], Object.values(urlWordCounts));
            row.push(tfidf);
        });

        // row.push(idf);
        sheet.addRow(row);
    });

    const documentScores = articleUrls.map((url, index) => {
        const score = queryWords.reduce((sum, word) => {
            return sum + (sheet.getCell(sheet.rowCount - queryWords.length + queryWords.indexOf(word) + 1, index + 2).value || 0);
        }, 0);
        return { url, score };
    });

    documentScores.sort((a, b) => b.score - a.score);

    sheet.addRow(['Final Ranking']);
    documentScores.forEach((doc, rank) => {
        const cell = sheet.getCell(sheet.rowCount, articleUrls.indexOf(doc.url) + 2);
        cell.value = `Rank ${rank + 1} (Score: ${doc.score.toFixed(6)})`;
    });
}

async function main() {
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 768 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    const workbook = new ExcelJS.Workbook();

    for (const [index, queryObj] of queries.entries()) {
        const { query, words } = queryObj;
        console.log(`Processing query ${index + 1}: "${query}"`);
        
        searchQuery = query;
        queryWords = words;

        const texts = [];

        try {
            console.log("Navigating to the website and performing search...");
            await takeScreenshot(page, `before-search-${index}`);
            const articleUrls = await searchAndGetArticleUrls(page, searchQuery);
            await takeScreenshot(page, `after-search-${index}`);

            if (articleUrls.length === 0) {
                console.log("No article URLs found. Skipping to next query.");
                continue;
            }

            for (const url of articleUrls) {
                try {
                    const articleContent = await scrapeArticle(page, url);
                    texts.push(articleContent);
                    console.log(`Successfully scraped article: ${url}`);
                } catch (error) {
                    console.error(`Error scraping article ${url}:`, error);
                }
                await delay(2000);
            }

            const { wordCounts, urlWordCounts } = createWordCounts(texts);

            const sheetPrefix = `Q${index + 1}_`;
            createWordCountSheet(workbook, wordCounts, `${sheetPrefix}Word Counts`);
            createInvertedIndexSheet(workbook, wordCounts, urlWordCounts, articleUrls, `${sheetPrefix}Inverted Index`);
            createTFIDFSheet(workbook, urlWordCounts, articleUrls, `${sheetPrefix}TF-IDF`);

        } catch (error) {
            console.error(`An error occurred for query "${query}":`, error);
            await takeScreenshot(page, `error-${index}`);
        }
    }

    await browser.close();

    try {
        await workbook.xlsx.writeFile('ESPNTennisArticlesNew.xlsx');
        console.log('Excel file created: ESPNTennisArticlesNew.xlsx');
    } catch (error) {
        console.error("Error writing Excel file:", error.message);
    }
}

main().catch(console.error);