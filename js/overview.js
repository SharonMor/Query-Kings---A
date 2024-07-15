$(document).ready(function() {
    // Function to load the JSON data
    async function loadJSON(url) {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    }

    // Function to display the player's ranking chart
    async function displayPlayerChart(playerFile) {
        try {
            const data = await loadJSON(`../data/${playerFile}`);
            const ctx = document.getElementById('playerChart').getContext('2d');

            const years = data.map(d => d.year).sort((a, b) => a - b);
            const rankings = data.map(d => parseInt(d.ranking));

            if (window.playerChart && typeof window.playerChart.destroy === 'function') {
                window.playerChart.destroy();
            }

            window.playerChart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: years,
                    datasets: [{
                        label: 'Year-End Ranking',
                        data: rankings,
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1,
                        fill: false
                    }]
                },
                options: {
                    scales: {
                        y: {
                            beginAt: 1, // Start y-axis from 1
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Failed to load player data:', error);
        }
    }

    // Event listener for player selection
    $('#playerSelect').on('change', function() {
        const playerFile = $(this).val();
        if (playerFile) {
            displayPlayerChart(playerFile);
        }
    });
});
