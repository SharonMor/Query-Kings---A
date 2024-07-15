$(document).ready(function() {
    // Function to load the JSON data
    async function loadJSON(url) {
        const response = await fetch(url);
        return response.json();
    }

    // Function to display player rankings
    async function displayPlayerRankings() {
        const data = await loadJSON('../data/playersData.json'); // Adjust the path if necessary
        const rankingsContainer = document.getElementById('rankings-container');

        data.forEach(player => {
            const playerDiv = document.createElement('div');
            playerDiv.classList.add('player');

            const playerInfo = `
                <h3>${player.name}</h3>
                <p>Rank: ${player.rank}</p>
                <p>Year of Birth: ${player.yearOfBirth}</p>
                <p>Nationality: ${player.nationality}</p>
                <p>Tournaments Played: ${player.tournamentsPlayed}</p>
                <p>Points: ${player.points}</p>
            `;

            playerDiv.innerHTML = playerInfo;
            rankingsContainer.appendChild(playerDiv);
        });
    }

    // Call the function to display player rankings when the page loads
    displayPlayerRankings();
});
