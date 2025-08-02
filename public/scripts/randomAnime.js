import { db } from './firebase.mjs'; 
import { doc, setDoc, getDoc, arrayUnion, arrayRemove } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { auth } from './firebase.mjs'; 
const animeSection = document.getElementById("anime-section");
const synopsisContainer = document.getElementById("synopsis-ani");
const backgroundInfo = document.getElementById("background-info");

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

// Function to save user's anime to Firestore
async function saveUserAnime(userId, anime) {
    if (!userId) {
        showToast("Not logged in. Please sign up/login.", 'error');
        console.error("Save failed: User not logged in.");
        return;
    }

    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            savedAnime: arrayUnion(anime)
        }, { merge: true });

        console.log("Anime saved successfully!");
        showToast("Anime saved successfully!", 'success');
    } catch (error) {
        console.error("Error saving anime:", error);
        showToast("Error saving anime. Please try again.", 'error');
    }
}

// Function to remove user's anime from Firestore
async function removeUserAnime(userId, anime) {
    if (!userId) {
        showToast("Not logged in. Please sign up/login.", 'error');
        console.error("Remove failed: User not logged in.");
        return;
    }

    try {
        const userRef = doc(db, 'users', userId);
        await setDoc(userRef, {
            savedAnime: arrayRemove(anime)
        }, { merge: true });

        console.log("Anime removed successfully!");
        showToast("Anime removed successfully!", 'success');
    } catch (error) {
        console.error("Error removing anime:", error);
        showToast("Error removing anime. Please try again.", 'error');
    }
}

async function getAni() {
    try {
        const aniRes = await fetch(`https://api.jikan.moe/v4/random/anime`);
        const aniData4ID = await aniRes.json();

        const aniResFull = await fetch(`https://api.jikan.moe/v4/anime/${aniData4ID.data.mal_id}/full`);
        const aniData = await aniResFull.json();

        displayAni(aniData);
    } catch (error) {
        console.error("Error fetching anime data:", error);
    }
}

function displayAni(anime) {
    let html = ``;

    if (anime.data) {
        const animeData = anime.data;

        html += `
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

        animeSection.innerHTML = html;

        // Add event listener to save/remove anime button
        const saveAnimeButton = document.getElementById('save-anime');
        if (saveAnimeButton) {
            saveAnimeButton.addEventListener('click', async (event) => {
                event.preventDefault();

                const user = auth.currentUser;
                if (!user) {
                    showToast('Please log in to save/remove anime.', 'error');
                    console.error('Save/Remove anime failed: User not logged in.');
                    return;
                }

                const animeToSaveRemove = {
                    id: animeData.mal_id,
                    image: animeData.images.jpg.large_image_url,
                    name: animeData.title,
                    trailerUrl: animeData.trailer.url,
                };

                if (saveAnimeButton.classList.contains('fa-heart')) {
                    await saveUserAnime(user.uid, animeToSaveRemove);
                    saveAnimeButton.classList.remove('fa-heart');
                    saveAnimeButton.classList.add('fa-check');
                } else if (saveAnimeButton.classList.contains('fa-check')) {
                    await removeUserAnime(user.uid, animeToSaveRemove);
                    saveAnimeButton.classList.remove('fa-check');
                    saveAnimeButton.classList.add('fa-heart');
                }
            });
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
            licensorsHtml += '<p class="error">Licensor information not available.</p>';
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
                <p>Time: <span>${animeData.season ? animeData.season.charAt(0).toUpperCase() + animeData.season.slice(1) : 'Unknown Season'} ${animeData.year || 'Unknown Year'}</span></p>
            </div>
        `;

        // Append producers, licensors, and studios information
        backgroundInfo.innerHTML += producersHtml + licensorsHtml + studiosHtml;
    }
}

// Initialize
getAni();
