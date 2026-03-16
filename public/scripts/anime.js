import { Jikan, Watchlist, Reviews, Auth } from './api.js';
import { renderCards, renderSkeletons, showToast } from './ui.js';

const malId = parseInt(new URLSearchParams(window.location.search).get('id'), 10);
if (!malId) window.location.href = './browse.html';

// DOM refs
const bannerImg = document.getElementById('detailBannerImg');
const poster = document.getElementById('detailPoster');
const title = document.getElementById('detailTitle');
const titleEn = document.getElementById('detailTitleEn');
const metaEl = document.getElementById('detailMeta');
const statsEl = document.getElementById('detailStats');
const synopsisEl = document.getElementById('detailSynopsis');
const synopsisToggle = document.getElementById('synopsisToggle');
const genresEl = document.getElementById('detailGenres');
const studiosEl = document.getElementById('detailStudios');
const trailerSection = document.getElementById('trailerSection');
const trailerEmbed = document.getElementById('detailTrailer');
const trailerBtn = document.getElementById('trailerBtn');
const trailerModal = document.getElementById('trailerModal');
const trailerModalFrame = document.getElementById('trailerModalFrame');
const trailerModalClose = document.getElementById('trailerModalClose');
const watchlistBtn = document.getElementById('watchlistBtn');
const watchlistStatusWrap = document.getElementById('watchlistStatusWrap');
const watchlistStatus = document.getElementById('watchlistStatus');
const watchlistProgressEl = document.getElementById('watchlistProgress');
const watchlistTotal = document.getElementById('watchlistTotal');
const progressFill = document.getElementById('progressFill');
const removeFromListBtn = document.getElementById('removeFromList');
const starPicker = document.getElementById('starPicker');
const reviewText = document.getElementById('reviewText');
const submitReview = document.getElementById('submitReview');
const reviewsList = document.getElementById('reviewsList');
const recsList = document.getElementById('recsList');

let selectedRating = 0;
let totalEpisodes = 0;

//  Anime data 
async function loadAnime() {
  try {
    const res = await Jikan.animeById(malId);
    const anime = res?.data;
    if (!anime) return;

    document.title = `${anime.title} - WGWAnime`;

    const img = anime.images?.webp?.large_image_url ?? anime.images?.jpg?.large_image_url ?? '';
    bannerImg.src = img;
    poster.src = img;
    poster.alt = anime.title;

    title.textContent = anime.title;
    titleEn.textContent = anime.title_english && anime.title_english !== anime.title
      ? anime.title_english : '';

    totalEpisodes = anime.episodes ?? 0;
    if (watchlistTotal) watchlistTotal.textContent = `/ ${totalEpisodes || '?'}`;

    // Meta row
    const score = anime.score ? `<span class="score" style="color:#f5c518;font-weight:700">⭐ ${anime.score}</span>` : '';
    const type = anime.type ? `<span class="tag">${anime.type}</span>` : '';
    const status = anime.status ? `<span class="tag">${anime.status}</span>` : '';
    const year = anime.year ?? anime.aired?.prop?.from?.year ?? '';
    metaEl.innerHTML = [score, type, status, year ? `<span>${year}</span>` : ''].filter(Boolean).join('');

    // Stats
    const stats = [
      { label: 'Score', value: anime.score ?? 'N/A' },
      { label: 'Ranked', value: anime.rank ? `#${anime.rank}` : 'N/A' },
      { label: 'Popularity', value: anime.popularity ? `#${anime.popularity}` : 'N/A' },
      { label: 'Episodes', value: anime.episodes ?? 'N/A' },
      { label: 'Duration', value: anime.duration ?? 'N/A' },
      { label: 'Members', value: anime.members ? anime.members.toLocaleString() : 'N/A' },
    ];
    statsEl.innerHTML = stats.map(s => `
      <div class="detail-stat">
        <div class="detail-stat__label">${s.label}</div>
        <div class="detail-stat__value">${s.value}</div>
      </div>
    `).join('');

    // Synopsis
    synopsisEl.textContent = anime.synopsis ?? 'No synopsis available.';

    // Genres
    if (anime.genres?.length) {
      genresEl.innerHTML = anime.genres.map(g =>
        `<a href="./browse.html?genres=${g.mal_id}" class="tag tag--red">${g.name}</a>`
      ).join('');
    }

    // Studios
    if (anime.studios?.length) {
      studiosEl.innerHTML = anime.studios.map(s =>
        `<span class="tag">${s.name}</span>`
      ).join('');
    } else {
      document.getElementById('studiosSection').style.display = 'none';
    }

    // Trailer
    const ytId = anime.trailer?.youtube_id;
    if (ytId) {
      trailerSection.style.display = '';
      trailerEmbed.src = `https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1`;
      trailerBtn.style.display = '';
      trailerBtn.dataset.ytid = ytId;
    }

  } catch {
    showToast('Failed to load anime details.', 'error');
  }
}

//  Synopsis toggle 
synopsisToggle?.addEventListener('click', () => {
  const collapsed = synopsisEl.classList.toggle('collapsed');
  synopsisToggle.textContent = collapsed ? 'Show more ▾' : 'Show less ▴';
});

//  Trailer modal 
trailerBtn?.addEventListener('click', () => {
  const id = trailerBtn.dataset.ytid;
  if (!id) return;
  trailerModalFrame.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`;
  trailerModal.classList.add('open');
});

trailerModalClose?.addEventListener('click', closeTrailerModal);
trailerModal?.addEventListener('click', (e) => {
  if (e.target === trailerModal) closeTrailerModal();
});

function closeTrailerModal() {
  trailerModal.classList.remove('open');
  trailerModalFrame.src = '';
}

//  Watchlist 
async function loadWatchlistState() {
  if (!Auth.isLoggedIn()) return;
  try {
    const entry = await Watchlist.getEntry(malId);
    if (entry) setWatchlistAdded(entry);
  } catch { /* not in list */ }
}

function setWatchlistAdded(entry) {
  watchlistBtn.textContent = '✓ In your list';
  watchlistBtn.classList.replace('btn--primary', 'btn--surface');
  watchlistStatusWrap.style.display = '';

  if (entry?.status) watchlistStatus.value = entry.status;
  if (entry?.progress !== undefined) {
    watchlistProgressEl.value = entry.progress;
    updateProgressBar(entry.progress);
  }
}

function updateProgressBar(val) {
  const pct = totalEpisodes ? (val / totalEpisodes) * 100 : 0;
  if (progressFill) progressFill.style.width = `${Math.min(pct, 100)}%`;
}

watchlistBtn?.addEventListener('click', async () => {
  if (!Auth.isLoggedIn()) {
    showToast('Log in to save anime.', 'info');
    return;
  }
  try {
    const anime = await Jikan.animeById(malId);
    await Watchlist.upsert({
      malId,
      title: anime.data?.title ?? '',
      imageUrl: anime.data?.images?.webp?.large_image_url ?? '',
      totalEpisodes: anime.data?.episodes ?? 0,
      status: 'planning',
      progress: 0,
    });
    setWatchlistAdded({ status: 'planning', progress: 0 });
    showToast('Added to your list!', 'success');
  } catch {
    showToast('Failed to add to list.', 'error');
  }
});

watchlistStatus?.addEventListener('change', async () => {
  if (!Auth.isLoggedIn()) return;
  try {
    await Watchlist.update(malId, { status: watchlistStatus.value });
    showToast('Status updated.', 'success');
  } catch {
    showToast('Failed to update status.', 'error');
  }
});

watchlistProgressEl?.addEventListener('change', async () => {
  const val = parseInt(watchlistProgressEl.value, 10);
  updateProgressBar(val);
  if (!Auth.isLoggedIn()) return;
  try {
    await Watchlist.update(malId, { progress: val });
  } catch { /* silent */ }
});

removeFromListBtn?.addEventListener('click', async () => {
  try {
    await Watchlist.remove(malId);
    watchlistBtn.textContent = '+ Add to List';
    watchlistBtn.classList.replace('btn--surface', 'btn--primary');
    watchlistStatusWrap.style.display = 'none';
    showToast('Removed from list.', 'info');
  } catch {
    showToast('Failed to remove.', 'error');
  }
});

//  Reviews 
async function loadReviews() {
  try {
    const res = await Reviews.getForAnime(malId);
    renderReviews(res?.data ?? []);
  } catch {
    reviewsList.innerHTML = '<p class="text-muted">Could not load reviews.</p>';
  }
}

function renderReviews(reviews) {
  if (!reviews.length) {
    reviewsList.innerHTML = '<p class="text-muted" style="margin-top:12px">No reviews yet. Be the first!</p>';
    return;
  }
  reviewsList.innerHTML = reviews.map(r => {
    const stars = '★'.repeat(r.rating) + '☆'.repeat(10 - r.rating);
    const avatar = r.user?.avatarUrl
      ?? `https://api.dicebear.com/8.x/thumbs/svg?seed=${r.user?.username}`;
    return `
      <div class="review-card">
        <div class="review-card__header">
          <img class="review-card__avatar" src="${avatar}" alt="${r.user?.username}" />
          <div>
            <strong>${r.user?.username ?? 'Anonymous'}</strong>
            <div class="review-card__stars">${stars}</div>
          </div>
        </div>
        <p class="review-card__body">${r.body}</p>
      </div>
    `;
  }).join('');
}

// Star picker
starPicker?.querySelectorAll('span').forEach(star => {
  star.addEventListener('click', () => {
    selectedRating = parseInt(star.dataset.val, 10);
    starPicker.querySelectorAll('span').forEach((s, i) => {
      s.classList.toggle('active', i < selectedRating);
    });
  });
});

submitReview?.addEventListener('click', async () => {
  if (!Auth.isLoggedIn()) { showToast('Log in to post a review.', 'info'); return; }
  if (!selectedRating) { showToast('Pick a star rating first.', 'info'); return; }
  const body = reviewText.value.trim();
  if (!body) { showToast('Write something first.', 'info'); return; }

  try {
    await Reviews.upsert({ malId, rating: selectedRating, body });
    showToast('Review posted!', 'success');
    reviewText.value = '';
    selectedRating = 0;
    starPicker.querySelectorAll('span').forEach(s => s.classList.remove('active'));
    loadReviews();
  } catch {
    showToast('Failed to post review.', 'error');
  }
});

//  Recommendations 
async function loadRecs() {
  renderSkeletons(recsList, 8);
  try {
    const res = await Jikan.recommendations(malId);
    const data = (res?.data ?? []).slice(0, 5).map(r => r.entry);
    renderCards(recsList, data);
  } catch {
    recsList.innerHTML = '';
  }
}

//  Extra CSS needed for this page 
const style = document.createElement('style');
style.textContent = `
  .watchlist-status-wrap  { margin-top: 12px; display: flex; flex-direction: column; gap: 10px; }
  .watchlist-status-select { width: 100%; padding: 8px 10px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius); color: var(--text); }
  .watchlist-progress label { font-size: 0.75rem; color: var(--text-faint); text-transform: uppercase; letter-spacing: 0.05em; }
  .progress-input-row { display: flex; align-items: center; gap: 6px; margin: 6px 0; }
  .progress-input-row input { width: 64px; padding: 6px 8px; background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius-sm); color: var(--text); }
  .progress-input-row span { font-size: 0.85rem; color: var(--text-muted); }
  .detail-info__meta { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; margin: 12px 0; }
  #recsSection .row__cards { display: flex; gap: 12px; overflow-x: auto; scrollbar-width: none; }
  #recsSection .row__cards::-webkit-scrollbar { display: none; }
  #recsSection .row__cards .anime-card { flex: 0 0 150px; }
`;
document.head.appendChild(style);

//  Init 
loadAnime();
loadWatchlistState();
loadReviews();
loadRecs();
