document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');

    const selectedGenreIds = [];
    const genreSelect = document.getElementById('genre-select');
    const filterButton = document.getElementById('filter-button');
    const resetButton = document.getElementById('reset-button');

    if (resetButton) {
        resetButton.addEventListener('click', () => {
            // Reset the dropdowns
            document.getElementById('genre-select').value = '';
            document.getElementById('rating-select').value = '';
            document.getElementById('type-select').value = '';
            document.getElementById('status-select').value = '';
            document.getElementById('order-select').value = '';
            document.getElementById('sort-select').value = '';

    
            // Clear URL search parameters related to filters
            const url = new URL(window.location);
            url.searchParams.delete('type');
            url.searchParams.delete('id');
            url.searchParams.delete('query');
       
            url.searchParams.delete('order'); 
            url.searchParams.delete('sort'); 
            url.searchParams.delete('rating');
            url.searchParams.delete('status');

            // Update the URL without the search parameters
            window.history.replaceState(null, '', url);

            // Reload the page to reset everything
            window.location.reload();
        });
    }

    const output = document.getElementById('output');
    const genreDropdownBtn = document.getElementById('genre-dropdown-btn');
    const genreDropdown = document.getElementById('genre-dropdown');

    if (!genreSelect || !filterButton || !output) {
        console.error('One or more DOM elements not found.');
        return;
    }

    const nameFromUrl = getQueryParameter('query');
    const typeFromUrl = getQueryParameter('type');
   
    // Populate genre dropdown and set up event listeners
    populateGenres().then(() => {
        const genreIdsFromUrl = getQueryParameter('id');
        if (genreIdsFromUrl) {
            selectedGenreIds.push(...genreIdsFromUrl.split(','));
            fetchAndDisplayAnime(1, selectedGenreIds, nameFromUrl, typeFromUrl);
        } else {
            fetchAndDisplayAnime(1, [], nameFromUrl, typeFromUrl);
        }
    });

    genreSelect.addEventListener('change', (event) => {
        const genreId = event.target.value;
        if (genreId === '') {
            selectedGenreIds.length = 0; // Clear selected genres if "All" is selected
        } else {
            toggleGenreSelection(genreId, selectedGenreIds);
        }
        updateOutput(selectedGenreIds);
    });

    filterButton.addEventListener('click', () => {
        fetchAndDisplayAnime(1, selectedGenreIds, nameFromUrl, typeFromUrl);
    });

    
    // Dropdown toggle functionality
    if (genreDropdownBtn && genreDropdown) {
        genreDropdownBtn.addEventListener('click', () => {
            genreDropdown.style.display = genreDropdown.style.display === 'none' ? 'block' : 'none';
        });

        document.addEventListener('click', (e) => {
            if (!e.target.closest('.dropdown')) {
                genreDropdown.style.display = 'none';
            }
        });
    }
});

// Function to get query parameters from the URL
function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name) || ''; // Return an empty string if the parameter is not found
}

// Function to populate genre dropdown
async function populateGenres(selectedGenreIds = []) {
    try {
        const response = await fetch('https://api.jikan.moe/v4/genres/anime');
        const data = await response.json();
        console.log('Genres data:', data);

        const genreSelect = document.getElementById('genre-select');
        genreSelect.innerHTML = ''; // Clear previous options

        const allOption = document.createElement('option');
        allOption.value = '';
        allOption.textContent = 'All';
        genreSelect.appendChild(allOption);

        data.data.forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.mal_id;
            option.textContent = genre.name;
            genreSelect.appendChild(option);
        });

        if (selectedGenreIds.length > 0) {
            genreSelect.value = selectedGenreIds.includes(genreSelect.value) ? genreSelect.value : '';
        }
    } catch (error) {
        console.error('Error fetching genres:', error);
    }
}

// Function to toggle genre selection
function toggleGenreSelection(genreId, selectedGenreIds) {
    const index = selectedGenreIds.indexOf(genreId);
    if (index === -1) {
        selectedGenreIds.push(genreId);
    } else {
        selectedGenreIds.splice(index, 1);
    }
    console.log('Selected Genres:', selectedGenreIds);
}

// Function to update the output of selected genres
async function updateOutput(selectedGenreIds) {
    try {
        const response = await fetch('https://api.jikan.moe/v4/genres/anime');
        const data = await response.json();

        const genreMap = new Map(data.data.map(genre => [genre.mal_id.toString(), genre.name]));
        const selectedGenreNames = selectedGenreIds.map(id => genreMap.get(id)).filter(name => name !== undefined);

        const outputDiv = document.getElementById('output');
        outputDiv.innerHTML = 'Selected Genres: ' + selectedGenreNames.map(name => 
            `<span class="genre-item" data-id="${getKeyByValue(genreMap, name)}">${name} <span class="remove">&times;</span></span>`
        ).join(', ');

        outputDiv.addEventListener('click', (event) => {
            const target = event.target.closest('.genre-item');
            if (target) {
                const genreId = target.getAttribute('data-id');
                if (genreId) {
                    toggleGenreSelection(genreId, selectedGenreIds);
                    updateOutput(selectedGenreIds); // Update the output to reflect changes
                }
            }
        });
    } catch (error) {
        console.error('Error fetching genres:', error);
        document.getElementById('output').textContent = 'Error fetching genre names';
    }
}

// Helper function to get key by value from a map
function getKeyByValue(map, value) {
    for (let [key, val] of map) {
        if (val === value) return key;
    }
    return null;
}

async function fetchAndDisplayAnime(page = 1, selectedGenreIds = [], nameFromUrl = '', typeFromUrl = '', reset = '') {
    const rating = document.getElementById('rating-select')?.value || '';
    const type = document.getElementById('type-select')?.value || '';
    const status = document.getElementById('status-select')?.value || '';
    const orderBy = document.getElementById('order-select')?.value || '';
    const sort = document.getElementById('sort-select')?.value || '';
    // const season = document.getElementById('season-select')?.value || '';

    const url = new URL(window.location);
    let query = `https://api.jikan.moe/v4/anime?page=${page}`;
    
    let typeChanged = false;

    // Detect type change
    document.getElementById('type-select').addEventListener('change', () => {
        typeChanged = true;
    });

    if (reset !== 'yes') {
        if (selectedGenreIds.length > 0) {
            query += `&genres=${selectedGenreIds.join(',')}`;
        }
        if (rating) {
            query += `&rating=${rating}`;
            url.searchParams.set('rating', rating);
        }
        if (type) {
            if (type === 'all' || type === '') {
                url.searchParams.delete('type');
                query = `https://api.jikan.moe/v4/anime?page=${page}`;
                typeFromUrl = '';
            } else {
                query += `&type=${encodeURIComponent(type)}`;
                typeFromUrl = '';
            }
        } else if (typeFromUrl && !typeChanged) {
            query += `&type=${encodeURIComponent(typeFromUrl)}`;
            url.searchParams.set('type', typeFromUrl);
        }
        
        if (status) {
            query += `&status=${status}`;
            url.searchParams.set('status', status);
        }
        if (orderBy) {
            query += `&order_by=${orderBy}`;
            url.searchParams.set('order_by', orderBy);
        }
        if (sort) {
            query += `&sort=${sort}`;
            url.searchParams.set('sort', sort);
        }
        if (nameFromUrl && nameFromUrl !== '') {
            query += `&q=${encodeURIComponent(nameFromUrl)}`;
            url.searchParams.set('q', nameFromUrl);
        }
    }

    window.history.replaceState(null, '', url);

    console.log('Query URL:', query);

    const animeListContainer = document.getElementById('anime-list-container');
    animeListContainer.innerHTML = '<p class="loading">Loading...</p>';

    try {
        const response = await fetch(query);
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        const data = await response.json();

        if (data.data && data.data.length > 0) {
          
            displayAnime(data.data);
            createPagination(data.pagination, page, selectedGenreIds, rating, type, status, orderBy, sort, nameFromUrl, typeFromUrl);
        } else {
            animeListContainer.innerHTML = '<p>No results found.</p>';
        }
    } catch (error) {
        console.error('Error fetching and displaying anime:', error);
        animeListContainer.innerHTML = '<p>Error fetching anime.</p>';
    }
}

function displayAnime(animeList) {
    const animeListContainer = document.getElementById('anime-list-container');
    animeListContainer.innerHTML = '';



    if (animeList && animeList.length > 0) {
        let html = '';

        animeList.forEach(anime => {
            // Display anime only if it matches the selected season or if 'default' is selected
     
                html += `
                <div class="anime-card">
                    <img src="${anime.images.jpg.image_url}" alt="${anime.title}" class="anime-image"/>
                    <div class="anime-info">
                        <h3 class="anime-title">${anime.title}</h3>
                        <p class="anime-synopsis">${anime.synopsis ? anime.synopsis.substring(0, 100) + '...' : 'No synopsis available.'}</p>
                        <div class="trailer-links">
                            <a href="${anime.trailer.url}" class="btn">Watch Trailer</a>
                            <p class="or-text">OR</p>
                            <a href="displayAnime.html?id=${anime.mal_id}" class="btn">Learn more</a>
                        </div>
                    </div>
                </div>`;
            }
        );

        animeListContainer.innerHTML = html;
    } else {
        animeListContainer.innerHTML = '<p class="error">No anime found for the selected filters.</p>';
    }
}

function createPagination(pagination, page, selectedGenreIds, rating, type, status, orderBy, sort, nameFromUrl, typeFromUrl) {
    const paginationContainer = document.getElementById('pagination');
    paginationContainer.innerHTML = '';

    const { current_page, last_visible_page, has_next_page, has_previous_page } = pagination;

    if (last_visible_page <= 1) {
        return; // No need to display pagination if there's only one page
    }

    let html = '';

    // Previous button
    if (has_previous_page) {
        html += `<button class="page-btn" data-page="${current_page - 1}">Previous</button>`;
    }

    const pageNumbersToShow = 10;
    const halfPageNumbers = Math.floor(pageNumbersToShow / 2);
    const startPage = Math.max(1, current_page - halfPageNumbers);
    const endPage = Math.min(last_visible_page, current_page + halfPageNumbers);

    // First page and ellipsis
    if (startPage > 1) {
        html += `<button class="page-btn" data-page="1">1</button>`;
        if (startPage > 2) {
            html += `<span class="ellipsis">...</span>`;
        }
    }

    // Middle pages
    for (let i = startPage; i <= endPage; i++) {
        html += `<button class="page-btn ${i === current_page ? 'active' : ''}" data-page="${i}">${i}</button>`;
    }

    // Last page and ellipsis
    if (endPage < last_visible_page) {
        if (endPage < last_visible_page - 1) {
            html += `<span class="ellipsis">...</span>`;
        }
        html += `<button class="page-btn" data-page="${last_visible_page}">${last_visible_page}</button>`;
    }

    // Next button
    if (has_next_page) {
        html += `<button class="page-btn" data-page="${current_page + 1}">Next</button>`;
    }

    paginationContainer.innerHTML = html;

    paginationContainer.addEventListener('click', (event) => {
        const button = event.target.closest('.page-btn');
        if (button) {
             page = parseInt(button.getAttribute('data-page'));
            if (!isNaN(page)) {
                // Fetch and display anime for the selected page, preserving other filter parameters
                fetchAndDisplayAnime(page, selectedGenreIds, nameFromUrl, typeFromUrl, rating, type, status, orderBy, sort);
            }
        }
    });
}
