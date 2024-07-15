const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const url = 'https://www.itftennis.com/en/players/roger-federer/800202678/sui/mt/s/overview/';
    await page.goto(url, { waitUntil: 'networkidle2' });

    const federerData = await page.evaluate(() => {
        const data = [];
        const rows = document.querySelectorAll('.pprofile-rankings table tbody tr');
        rows.forEach(row => {
            const year = row.querySelector('.year span').innerText;
            const ranking = row.querySelector('.ranking span').innerText;
            data.push({ year, ranking });
        });
        return data;
    });

    const filePath = path.join(__dirname, '..', 'data', 'federerData.json');
    fs.writeFileSync(filePath, JSON.stringify(federerData, null, 2));

    await browser.close();
})();
