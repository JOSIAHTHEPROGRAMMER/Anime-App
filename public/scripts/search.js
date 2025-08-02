document.addEventListener("DOMContentLoaded", function() {
    // Add event listener to the search button
    document.getElementById("search-button").addEventListener("click", function() {
        searchAnime();
    });

    // Add event listener to the input field for the "Enter" key
    document.getElementById("search-input").addEventListener("keypress", function(event) {
        // Check if the pressed key is "Enter"
        if (event.key === "Enter") {
            searchAnime();
        }
    });

    function searchAnime() {
        // Get the value from the search input field
        const userAnime = document.getElementById("search-input").value.trim();
        if (userAnime !== "") {
            // Redirect to displayAnimes.html with the search query as a parameter
            window.location.href = `displayAnimes.html?query=${encodeURIComponent(userAnime)}`;
        }
    }
});
