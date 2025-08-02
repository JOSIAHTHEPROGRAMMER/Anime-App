// Import necessary modules from Firebase
import { db } from './firebase.mjs'; 
import { doc, setDoc, getDoc, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { auth } from './firebase.mjs'; 

// Toastify function to show messages
function showToast(message, type = 'info') {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background: type === 'success' ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #ff5f6d, #ffc371)",
        },
    }).showToast();
}

// Function to save or remove user's anime from Firestore
export async function toggleUserAnime(userId, anime, action) {
    if (!userId) {
        showToast("Not logged in. Please sign up/login.", 'error');
        console.error("Action failed: User not logged in.");
        return;
    }

    try {
        const userRef = doc(db, 'users', userId);
        if (action === 'save') {
            await setDoc(userRef, {
                savedAnime: arrayUnion(anime)
            }, { merge: true });
            console.log("Anime saved successfully!");
            showToast("Anime saved successfully!", 'success');
        } else if (action === 'remove') {
            await setDoc(userRef, {
                savedAnime: arrayRemove(anime)
            }, { merge: true });
            console.log("Anime removed successfully!");
            showToast("Anime removed successfully!", 'success');
        }
    } catch (error) {
        console.error(`Error ${action === 'save' ? 'saving' : 'removing'} anime:`, error);
        showToast(`Error ${action === 'save' ? 'saving' : 'removing'} anime. Please try again.`, 'error');
    }
}

// Function to get the saved anime list for a user
export async function getUserSavedAnime(userId) {
    if (!userId) {
        console.error("No user ID provided.");
        showToast("Error: No user ID provided.", 'error');
        return [];
    }

    try {
        const userRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
            console.log("Saved anime retrieved successfully.");
            return docSnap.data().savedAnime || [];
        } else {
            console.log("No such user found.");
            showToast("No saved anime found for this user.", 'info');
            return [];
        }
    } catch (error) {
        console.error("Error fetching saved anime:", error);
        showToast("Error fetching saved anime. Please try again.", 'error');
        return [];
    }
}

// Function to get query parameters from the URL
function getQueryParameter(name) {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get(name);
}

// Get the 'id' parameter from the URL
const animeId = getQueryParameter('id');
const animeSection = document.getElementById("anime-section");
const synopsisContainer = document.getElementById("synopsis-ani");
const backgroundInfo = document.getElementById("background-info");

if (animeId) {
    console.log("Anime ID:", animeId);

    async function getAni(animeId) {
        try {
            const aniRes = await fetch(`https://api.jikan.moe/v4/anime/${animeId}/full`);
            if (!aniRes.ok) {
                throw new Error("Network response was not ok");
            }
            const aniData = await aniRes.json();
            displayAni(aniData);
        } catch (error) {
            console.error("Error fetching anime data:", error);
            showToast("Failed to load anime data. Please try again later.", 'error');
            animeSection.innerHTML = `<p class="error">Failed to load anime data. Please try again later.</p>`;
        }
    }

    function generateHtml(animeData) {
        // Function to generate HTML snippets
        let html = `
            <div class="anime-img">
                <img src='${animeData.images.jpg.large_image_url}' alt="Anime Image" class="anime-image" />
                <div class="trailer-links">
                    <a href="${animeData.trailer.url}" class="btn">Watch Trailer</a>
                    <p class="or-text">OR</p>
                    <a href="#" id="save-anime" class="btn fas fa-heart"></a>
                </div>
            </div>
            <div class="anime-details">
                <div class="titles">
                    <h3>${animeData.title}</h3>
                    <h4>${animeData.title_japanese}</h4>
                    <h4>${animeData.title_synonyms.join(', ')}</h4>
                </div>
                <div class="details-container">
                    <div class="left-side">
                        <p><strong>ID:</strong> ${animeData.mal_id}</p>
                        <p><strong>Type:</strong> ${animeData.type}</p>
                        <p><strong>Episodes:</strong> ${animeData.episodes}</p>
                        <p><strong>Status:</strong> ${animeData.status}</p>
                        <p><strong>Aired:</strong> ${animeData.aired.string}</p>
                        <p><strong>Duration:</strong> ${animeData.duration}</p>
                    </div>
                    <div class="mid"></div>
                    <div class="right-side">
                        <p><strong>Rating:</strong> ${animeData.rating}</p>
                        <p><strong>Score:</strong> ${animeData.score}, scored by ${animeData.scored_by}</p>
                        <p><strong>Rank:</strong> ${animeData.rank}</p>
                        <p><strong>Popularity:</strong> ${animeData.popularity}</p>
                        <p><strong>Members:</strong> ${animeData.members}</p>
                        <p><strong>Favorites:</strong> ${animeData.favorites}</p>
                    </div>
                </div>
            </div>
        `;

        // Additional HTML generation for producers, licensors, etc.
        return html;
    }

    async function displayAni(anime) {
        if (anime.data) {
            const animeData = anime.data;
            animeSection.innerHTML = generateHtml(animeData);

            // Add event listener to save/remove anime button
            const saveAnimeButton = document.getElementById('save-anime');
            if (saveAnimeButton) {
                // Check if the current anime is already saved
                const user = auth.currentUser;
                if (user) {
                    const savedAnimeList = await getUserSavedAnime(user.uid);
                    const isSaved = savedAnimeList.some(savedAnime => savedAnime.id === animeData.mal_id);

                    if (isSaved) {
                        saveAnimeButton.classList.remove('fa-heart');
                        saveAnimeButton.classList.add('fa-check');
                    } else {
                        saveAnimeButton.classList.remove('fa-check');
                        saveAnimeButton.classList.add('fa-heart');
                    }

                    saveAnimeButton.addEventListener('click', async (event) => {
                        event.preventDefault();

                        const action = saveAnimeButton.classList.contains('fa-heart') ? 'save' : 'remove';

                        const animeToSave = {
                            id: animeData.mal_id,
                            image: animeData.images.jpg.large_image_url,
                            name: animeData.title,
                            trailerUrl: animeData.trailer.url,
                        };

                        await toggleUserAnime(user.uid, animeToSave, action);

                        // Toggle the button class
                        saveAnimeButton.classList.toggle('fa-heart');
                        saveAnimeButton.classList.toggle('fa-check');
                    });
                }
            }

 
            synopsisContainer.innerHTML = `<p>${animeData.synopsis}</p>`;

            let producersHtml = '<div class="producers"><h2>Producers:</h2>';

            if (animeData.producers && animeData.producers.length > 0) {
                animeData.producers.forEach(producer => {
                    producersHtml += `
                        <div class="producer">
                            <h3>${producer.name}</h3>
                            <p>Mal ID: <span>${producer.mal_id}</span></p>
                            <a href="${producer.url}">Producer MAL Page</a>
                        </div>
                    `;
                });
            } else {
                producersHtml += '<p class="error">Producer information not available.</p>';
            }
            producersHtml += '</div>';

            let licensorsHtml = '<div class="licensors"><h2>Licensors:</h2>';

            if (animeData.licensors && animeData.licensors.length > 0) {
                animeData.licensors.forEach(licensor => {
                    licensorsHtml += `
                        <div class="licensor">
                            <h3>${licensor.name}</h3>
                            <p>Mal ID: <span>${licensor.mal_id}</span></p>
                            <a href="${licensor.url}">Licensor MAL Page</a>
                        </div>
                    `;
                });
            } else {
                licensorsHtml += '<p class="error" >Licensor information not available.</p>';
            }
            licensorsHtml += '</div>';

            let studiosHtml = '<div class="studios"><h2>Studios:</h2>';

            if (animeData.studios && animeData.studios.length > 0) {
                animeData.studios.forEach(studio => {
                    studiosHtml += `
                        <div class="studio">
                            <h3>${studio.name}</h3>
                            <p>Mal ID: <span>${studio.mal_id}</span></p>
                            <a href="${studio.url}">Studio MAL Page</a>
                        </div>
                    `;
                });
            } else {
                studiosHtml += '<p class="error">Studio information not available.</p>';
            }
            studiosHtml += '</div>';

            backgroundInfo.innerHTML = `
    <div class="background">
        <p>${animeData.background || 'Background information not available.'}</p>
    </div>
    <div class="time">
        <p>Time: <span>${animeData.season ? animeData.season.charAt(0).toUpperCase() + animeData.season.slice(1) : 'Unknown Season'} ${animeData.year}</span>.</p>
        <div class="broadcast">
            <p>Broadcast at <span>${animeData.broadcast ? animeData.broadcast.string : 'Unknown Broadcast Time'}</span></p>
        </div>
    </div>
    <div class="genres">
        <p class="header">Genres:</p>
        ${animeData.genres && animeData.genres.length > 0 
            ? animeData.genres.map(genre => `<p>${genre.name}</p>`).join('') 
            : '<p class="error">No genres available.</p>'
        }
    </div>
    <div class="themes">
        <p class="header">Themes:</p>
        ${animeData.themes && animeData.themes.length > 0 
            ? animeData.themes.map(theme => `<p><a href="${theme.url}" target="_blank">${theme.name}</a></p>`).join('') 
            : '<p class="error">No themes available.</p>'
        }
    </div>
    <div class="demographics">
        <p class="header">Demographics:</p>
        ${animeData.demographics && animeData.demographics.length > 0 
            ? animeData.demographics.map(demo => `<p><a href="${demo.url}" target="_blank">${demo.name}</a></p>`).join('') 
            : '<p class="error">No demographics available.</p>'
        }
    </div>
    <div class="relations">
        <p class="header">Relations:</p>
        ${animeData.relations && animeData.relations.length > 0 
            ? animeData.relations.map(relation => `
                <div class="relation">
                    <p class="relationship"><strong>${relation.relation}:</strong></p>
                    ${relation.entry.map(entry => `<p class="relationship"><a href="${entry.url}" target="_blank">${entry.name}</a></p>`).join('')}
                </div>
            `).join('')
            : '<p class="error">No relations available.</p>'
        }
    </div>
    <div class="music">
        <p class="header">Music:</p>
        <div class="openings">
            <p><strong>Openings:</strong></p>
            ${animeData.theme && animeData.theme.openings && animeData.theme.openings.length > 0 
                ? animeData.theme.openings.map(opening => `<p>${opening}</p>`).join('')
                : '<p class="error">No openings available.</p>'
            }
        </div>
        <div class="endings">
            <p><strong>Endings:</strong></p>
            ${animeData.theme && animeData.theme.openings && animeData.theme.endings.length > 0 
                ? animeData.theme.endings.map(ending => `<p>${ending}</p>`).join('')
                : '<p class="error">No endings available.</p>'
            }
        </div>
    </div>
    ${producersHtml}
    ${licensorsHtml}
    ${studiosHtml}
`;
        }
    }

    getAni(animeId);
}
