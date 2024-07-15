$(document).ready(function() {
    // Function to load the JSON data
    async function loadJSON(url) {
        const response = await fetch(url);
        return response.json();
    }

    // Function to display Federer's ranking chart
    async function displayFedererChart() {
        const data = await loadJSON('./data/federerData.json');
        const ctx = document.getElementById('federerChart').getContext('2d');

        const years = data.map(d => d.year);
        const rankings = data.map(d => parseInt(d.ranking));

        const federerChart = new Chart(ctx, {
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
                        beginAtZero: true,
                        reverse: true // To display the ranking correctly
                    }
                }
            }
        });
    }

    // Call the function to display Federer's ranking chart when the page loads
    displayFedererChart();
});
