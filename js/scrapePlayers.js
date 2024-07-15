const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

const players = [
    {
        name: 'Roger Federer',
        url: 'https://www.itftennis.com/en/players/roger-federer/800202678/sui/mt/s/overview/',
        fileName: 'federerData.json'
    },
    {
        name: 'Rafael Nadal',
        url: 'https://www.itftennis.com/en/players/rafael-nadal/800226907/esp/mt/s/overview/',
        fileName: 'nadalData.json'
    },
    {
        name: 'Novak Djokovic',
        url: 'https://www.itftennis.com/en/players/novak-djokovic/800225217/srb/mt/s/overview/',
        fileName: 'djokovicData.json'
    },
    {
        name: 'Carlos Alcaraz',
        url: 'https://www.itftennis.com/en/players/carlos-alcaraz/800446486/esp/mt/s/overview/',
        fileName: 'alcarazData.json'
    }
];

(async () => {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();

    for (const player of players) {
        await page.goto(player.url, { waitUntil: 'networkidle2' });

        const playerData = await page.evaluate(() => {
            const data = [];
            const rows = document.querySelectorAll('.pprofile-rankings table tbody tr');
            rows.forEach(row => {
                const year = row.querySelector('.year span').innerText;
                const ranking = row.querySelector('.ranking span').innerText;
                data.push({ year, ranking });
            });
            return data;
        });

        const filePath = path.join(__dirname, '..', 'data', player.fileName);
        fs.writeFileSync(filePath, JSON.stringify(playerData, null, 2));
    }

    await browser.close();
})();
