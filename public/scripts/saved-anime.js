import { db } from './firebase.mjs'; 
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { auth } from './firebase.mjs'; 
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js'; 

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

async function displaySavedAnimes(user) {
    const savedAnimeContainer = document.querySelector('.saved-anime-table tbody');
    savedAnimeContainer.innerHTML = ''; // Clear the table body before populating

    const savedAnimeList = await getUserSavedAnime(user.uid);

    for (const anime of savedAnimeList) {
        if (anime) {
            const rowHTML = `
                <tr>
                    <td><img class="anime-image" src="${anime.image}" alt="${anime.name}" /></td>
                    <td>${anime.name}</td>
                    <td>
                        ${anime.trailerUrl ? `<a href="${anime.trailerUrl}">Watch Trailer</a>` : 'No Trailer'}
                    </td>
                    <td>
                        <a href="displayAnime.html?id=${anime.id}">${anime.id}</a>
                    </td>
                </tr>
            `;
            savedAnimeContainer.insertAdjacentHTML('beforeend', rowHTML);
        }
    }
}

// Listen for auth state changes
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is logged in, so display the saved animes
        displaySavedAnimes(user);
    } else {
        // User is logged out or not logged in yet
        console.log("No user is logged in.");
    }
});
