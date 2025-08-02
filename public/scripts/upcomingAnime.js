function getCurrentSeasonAndYear() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // getMonth() returns 0 for January
    console.log(currentYear)
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


    return { season, year: currentYear };
}






async function getUpcomingAnime() {
  
    const popAnimeResponse = await fetch('https://api.jikan.moe/v4/seasons/upcoming');
    const aniTopData = await popAnimeResponse.json();
    displayUpcomingAnime(aniTopData);
}

function displayUpcomingAnime(dataTA) {
    const topAnimeSlider = document.getElementsByClassName('upcomingAnime')[0];
    const upcomingAnimeHeader = document.getElementById('upcoming-anime-header')

    const { season, year } = getCurrentSeasonAndYear();

    
    upcomingAnimeHeader.innerHTML = `<h1 class="heading">Upcoming anime for ${season} ${year}</h1>`;
    
    let html = '';

    if (dataTA.data) {
        dataTA.data.forEach(anime => {
            html += `
            <div class="swiper-slide ua">
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
    new Swiper('.upcoming-slider', {
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

getUpcomingAnime();
