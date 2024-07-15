const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    const url = 'https://www.itftennis.com/en/rankings/mens-world-tennis-tour-rankings/';
    await page.goto(url, { waitUntil: 'networkidle2' });

    const playersData = await page.evaluate(() => {
        let players = [];
        const rows = document.querySelectorAll('.ranking-table tbody tr');
        rows.forEach(row => {
            const rank = row.querySelector('.rank span').innerText;
            const name = row.querySelector('.name .long a').innerText;
            const yearOfBirth = row.querySelector('.birth-year span').innerText;
            const nationality = row.querySelector('.player-nationality span').innerText;
            const tournamentsPlayed = row.querySelector('.tournaments-played span').innerText;
            const points = row.querySelector('.points span').innerText;

            players.push({
                rank,
                name,
                yearOfBirth,
                nationality,
                tournamentsPlayed,
                points
            });
        });
        return players;
    });

    const filePath = path.join(__dirname, '..', 'data', 'playersData.json');
    fs.writeFileSync(filePath, JSON.stringify(playersData, null, 2));

    await browser.close();
})();
