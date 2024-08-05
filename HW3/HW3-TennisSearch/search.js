// Global variable to store all the data
let allData = {};

// Load all JSON files when the page loads
window.onload = async function() {
    const queries = ['top_10_tennis_men_ranking', 'tennis_competition', 'best_men_tennis_players'];
    for (const query of queries) {
        const path = `data/${query}.json`;
        console.log(path);
        
        const response = await fetch(path);
        allData[query] = await response.json();
    }
};

document.getElementById('searchForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const query = document.getElementById('query').value;
    const filter = document.getElementById('filter').value.toLowerCase();
    const results = document.getElementById('results');
    results.innerHTML = 'Searching...';
    
    if (!query) {
        results.innerHTML = 'Please select a query.';
        return;
    }

    const data = allData[query];
    if (!data || data.length === 0) {
        results.innerHTML = 'No results found for this query. Please try a different selection.';
        return;
    }

    displayResults(data, filter);
});

function displayResults(data, filter) {
    const results = document.getElementById('results');
    let htmlContent = `
        <h2>Search Results</h2>
        <div class="results-grid">
    `;

    const filteredData = data.filter(article => 
        filter ? article.title.toLowerCase().includes(filter) : true
    );

    if (filteredData.length === 0) {
        results.innerHTML = 'No articles found matching the selected filter.';
        return;
    }

    filteredData.forEach(article => {
        htmlContent += `
            <div class="article-card">
                <img class="article-image" src="${article.imageUrl}" alt="${article.title}">
                <div class="article-content">
                    <h3 class="article-title"><a href="${article.url}" target="_blank">${article.title}</a></h3>
                    <p class="article-meta">${article.date} • ${article.author}</p>
                </div>
            </div>
        `;
    });

    htmlContent += `</div>`;
    results.innerHTML = htmlContent;
}