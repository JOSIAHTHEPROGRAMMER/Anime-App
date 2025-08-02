function getSeasonAndYear() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0 for January

    let season;

    if (currentMonth >= 1 && currentMonth <= 3) {
        season = 'winter';
    } else if (currentMonth >= 4 && currentMonth <= 6) {
        season = 'spring';
    } else if (currentMonth >= 7 && currentMonth <= 9) {
        season = 'summer';
    } else if (currentMonth >= 10 && currentMonth <= 12) {
        season = 'fall';
    }

    const previousYear = currentYear - 1;

    return { season, year: previousYear };
}


async function getLastYearAnime() {
    try {
        const { season, year } = getSeasonAndYear();
        const lastYearAnimeHeader = document.getElementById('last-year-anime-header');
        console.log(`Fetching anime for season: ${season}, year: ${year}`);

        // Set the header with dynamic content
        lastYearAnimeHeader.innerHTML = `<h1 class="heading">Anime from Last ${season} ${year}</h1>`;
        
        // Fetch the anime data for the last year and season
        const popAnimeResponse = await fetch(`https://api.jikan.moe/v4/seasons/${year}/${season}`);
        const aniTopData = await popAnimeResponse.json();
        
        // Display the anime
        displayLYSAnime(aniTopData);
    
    } catch (error) {
        console.error("Error fetching popular anime data:", error);
    }
}


function displayLYSAnime(dataTA) {
    const homeSlider = document.getElementsByClassName('lastYearAnime')[0];
    

    let html = '';

    if (dataTA.data) {
        dataTA.data.forEach(anime => {
            html += `
            <div class="swiper-slide lys">
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

    homeSlider.innerHTML = html;


    new Swiper('.lastYearAnimeSlider', {
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

getLastYearAnime()

