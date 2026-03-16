import { Watchlist, Auth } from './api.js';

// Build a single anime card element
export function createAnimeCard(anime) {
  const card = document.createElement('a');
  card.className = 'anime-card';
  card.href = `/frontend/pages/anime.html?id=${anime.mal_id}`;

  const score   = anime.score ? `⭐ ${anime.score}` : '';
  const airing  = anime.airing ? '<span class="anime-card__airing">Airing</span>' : '';
  const image   = anime.images?.jpg?.image_url ?? '';
  const type    = anime.type ?? '';
  const year    = anime.year ?? anime.aired?.prop?.from?.year ?? '';

  card.innerHTML = `
    <div class="anime-card__img-wrap">
      <img class="anime-card__img" src="${image}" alt="${anime.title}" loading="lazy" />
      ${score  ? `<span class="anime-card__score">${score}</span>` : ''}
      ${airing}
      ${Auth.isLoggedIn() ? `<button class="anime-card__add" data-id="${anime.mal_id}" title="Add to watchlist">+</button>` : ''}
    </div>
    <div class="anime-card__body">
      <p class="anime-card__title">${anime.title}</p>
      <p class="anime-card__meta">${[type, year].filter(Boolean).join(' · ')}</p>
    </div>
  `;

  // Quick-add watchlist without navigating
  card.querySelector('.anime-card__add')?.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();
    await quickAddToWatchlist(anime, e.currentTarget);
  });

  return card;
}

// Render a list of anime cards into a container
export function renderCards(container, animeList) {
  container.innerHTML = '';
  if (!animeList?.length) {
    container.innerHTML = '<p class="text-muted">Nothing to show here.</p>';
    return;
  }
  animeList.forEach(a => container.appendChild(createAnimeCard(a)));
}

// Add to watchlist from the card's + button
async function quickAddToWatchlist(anime, btn) {
  try {
    await Watchlist.upsert({
      malId:          anime.mal_id,
      title:          anime.title,
      imageUrl:       anime.images?.jpg?.image_url ?? '',
      totalEpisodes:  anime.episodes ?? 0,
      status:         'planning',
      progress:       0,
    });
    btn.classList.add('saved');
    btn.textContent = '✓';
    showToast('Added to watchlist', 'success');
  } catch {
    showToast('Failed to add — are you logged in?', 'error');
  }
}

// Skeleton placeholder cards while content loads
export function renderSkeletons(container, count = 10) {
  container.innerHTML = Array.from({ length: count }, () => `
    <div class="anime-card">
      <div class="anime-card__img-wrap skeleton" style="aspect-ratio:2/3;"></div>
      <div class="anime-card__body">
        <div class="skeleton" style="height:14px;width:80%;margin-bottom:6px;border-radius:4px;"></div>
        <div class="skeleton" style="height:12px;width:50%;border-radius:4px;"></div>
      </div>
    </div>
  `).join('');
}

// Toast notifications
const _toastContainer = (() => {
  const el = document.createElement('div');
  el.className = 'toast-container';
  document.body.appendChild(el);
  return el;
})();

export function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast toast--${type}`;
  toast.textContent = message;
  _toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('removing');
    toast.addEventListener('animationend', () => toast.remove());
  }, duration);
}

// Pagination — calls onPage(pageNumber) when a button is clicked
export function renderPagination(container, currentPage, lastPage, onPage) {
  container.innerHTML = '';
  if (lastPage <= 1) return;

  const pages = getPaginationRange(currentPage, lastPage);

  const prev = makePageBtn('←', currentPage === 1, () => onPage(currentPage - 1));
  container.appendChild(prev);

  pages.forEach(p => {
    if (p === '...') {
      const el = document.createElement('span');
      el.className = 'pagination__ellipsis';
      el.textContent = '…';
      container.appendChild(el);
    } else {
      const btn = makePageBtn(p, false, () => onPage(p));
      if (p === currentPage) btn.classList.add('active');
      container.appendChild(btn);
    }
  });

  const next = makePageBtn('→', currentPage === lastPage, () => onPage(currentPage + 1));
  container.appendChild(next);
}

function makePageBtn(label, disabled, onClick) {
  const btn = document.createElement('button');
  btn.className = 'pagination__btn';
  btn.textContent = label;
  btn.disabled = disabled;
  if (!disabled) btn.addEventListener('click', onClick);
  return btn;
}

// Returns an array like [1, 2, '...', 8, 9, 10]
function getPaginationRange(current, last) {
  const delta = 2;
  const range = [];

  for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) {
    range.push(i);
  }

  if (current - delta > 2)    range.unshift('...');
  if (current + delta < last - 1) range.push('...');

  range.unshift(1);
  if (last > 1) range.push(last);

  return range;
}

// Generic empty state — drop into any container
export function renderEmpty(container, message = 'Nothing here yet.') {
  container.innerHTML = `
    <div style="text-align:center;padding:48px 0;color:var(--text-faint);">
      <p style="font-size:2rem;margin-bottom:8px;">¯\\_(ツ)_/¯</p>
      <p>${message}</p>
    </div>
  `;
}

// Generic error state
export function renderError(container, message = 'Something went wrong.') {
  container.innerHTML = `
    <div style="text-align:center;padding:48px 0;color:var(--red);">
      <p>${message}</p>
    </div>
  `;
}
