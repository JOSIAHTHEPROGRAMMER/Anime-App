async function getTopAnime() {
    const popAnimeResponse = await fetch('https://api.jikan.moe/v4/top/anime?limit=10');
    const aniTopData = await popAnimeResponse.json();
    displayTopAnime(aniTopData);
}

function displayTopAnime(dataTA) {
    const topAnimeSlider = document.getElementsByClassName('topAnime')[0];

    let html = '';

    if (dataTA.data) {
        dataTA.data.forEach(anime => {
            html += `
            <div class="swiper-slide ta">
                <div class="anime-card box">
                    <img class="anime-image" src="${anime.images.webp.image_url}" alt="${anime.title}" class="anime-img"/>
                    <div class="anime-info content">
                        <h3 class="anime-title">${anime.title}</h3>
                        <div class="trailer-links">
                            <a href="${anime.trailer.url}" class="btn">Watch Trailer</a>
                            <p class="or-text">OR</p>
                            <a href="displayAnime.html?id=${anime.mal_id}" class="btn">Learn more</a>
                        </div>
                    </div>
                </div>
            </div>`;
        });
    } else {
        html = "Sorry, we didn't find any anime!";
    }

    topAnimeSlider.innerHTML = html;

    // Initialize Swiper after the content is loaded
    new Swiper('.top-slider', {
        slidesPerView: 4, // Number of slides to show at a time
        spaceBetween: 20, // Space between each slide
        navigation: {
            nextEl: '.swiper-button-next',
            prevEl: '.swiper-button-prev',
        },
        pagination: {
            el: '.swiper-pagination',
            clickable: true,
        },
        loop: true, // Allows infinite looping of slides
    });
}

getTopAnime();

