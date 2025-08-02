async function getPopAnime() {
    const popAnimeResponse = await fetch('https://api.jikan.moe/v4/seasons/now');
    const aniTopData = await popAnimeResponse.json();
    displayAnime(aniTopData);
}

function displayAnime(dataTA) {
    const homeSlider = document.getElementsByClassName('seasonNow')[0];

    let html = '';

    if (dataTA.data) {
        dataTA.data.forEach(anime => {
          

            html += `
           <div class="swiper-slide">
    <div class="box anime-image" style="background: url(${anime.images.jpg.large_image_url}) no-repeat;">
        <div class="anime-info content">
            <div class="anime-title">
                 <h3>${anime.title}</h3>
            </div>
            <div class="syno-container">
                <p class="anime-synopsis">${anime.synopsis}</p>
            </div>
            <div class="trailer-links">
                <a href="${anime.trailer.url}" class="btn">Watch Trailer</a>
                <p class="or-text">OR</p>
                <a href="displayAnime.html?id=${anime.mal_id}" class="btn">Learn more</a>
            </div>
        </div>
    </div>
</div>
`;
        });
    } else {
        html = "Sorry, we didn't find any anime!";
    }

    homeSlider.innerHTML = html;
}

getPopAnime();
