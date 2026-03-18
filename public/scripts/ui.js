import { Watchlist, Auth } from './api.js';

function animeHref(malId) {
  const inPages = window.location.pathname.includes('/pages/');
  return inPages
    ? `./anime.html?id=${malId}`
    : `./pages/anime.html?id=${malId}`;
}

export function createAnimeCard(anime) {
  const card = document.createElement('div');
  card.className = 'anime-card';

  const score = anime.score
    ? `<span class="anime-card__score">⭐ ${anime.score}</span>`
    : '';

  const airing = anime.airing
    ? `<span class="anime-card__airing">Airing</span>`
    : '';

  const image = anime.images?.webp?.large_image_url
    ?? anime.images?.jpg?.image_url
    ?? '';

  const type = anime.type ?? '';
  const year = anime.year ?? anime.aired?.prop?.from?.year ?? '';

  card.innerHTML = `
    <div class="anime-card__img-wrap">
      <img class="anime-card__img" src="${image}" alt="${anime.title}" loading="lazy" />
      ${score}
      ${airing}
      ${Auth.isLoggedIn() ? `
        <button class="anime-card__add" data-id="${anime.mal_id}" title="Add to watchlist">
          <i data-lucide="plus"></i>
        </button>` : ''}
    </div>
    <div class="anime-card__body">
      <p class="anime-card__title">${anime.title}</p>
      <p class="anime-card__meta">${[type, year].filter(Boolean).join(' · ')}</p>
    </div>
  `;

  let isDragging = false;

  const img = card.querySelector('.anime-card__img');
  img.addEventListener('mousedown', (e) => { e.stopPropagation(); isDragging = false; });
  img.addEventListener('mousemove', () => { isDragging = true; });
  img.addEventListener('mouseup', (e) => {
    e.stopPropagation();
    if (!isDragging) window.location.href = animeHref(anime.mal_id);
  });
  img.addEventListener('touchstart', (e) => { e.stopPropagation(); isDragging = false; }, { passive: true });
  img.addEventListener('touchmove', () => { isDragging = true; }, { passive: true });
  img.addEventListener('touchend', (e) => {
    e.stopPropagation();
    if (!isDragging) window.location.href = animeHref(anime.mal_id);
  });


  const btn = card.querySelector('.anime-card__add');
  if (btn) {
    btn.addEventListener('mousedown', (e) => { e.stopPropagation(); isDragging = true; });
    btn.addEventListener('touchstart', (e) => { e.stopPropagation(); isDragging = true; }, { passive: true });
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      await toggleWatchlist(anime, btn);
    });
  }

  return card;
}

export function renderCards(container, animeList) {
  container.innerHTML = '';

  if (!animeList?.length) {
    container.innerHTML = '<p class="text-muted">Nothing to show here.</p>';
    return;
  }

  animeList.forEach(a => {
    const card = createAnimeCard(a);
    container.appendChild(card);
    if (window.lucide) lucide.createIcons({ nodes: [card] });
  });

  if (Auth.isLoggedIn()) {
    syncWatchlistStates(container, animeList);
  }
}

async function syncWatchlistStates(container, animeList) {
  try {
    const watchlist = await Watchlist.getAll();
    if (!watchlist?.data?.length) return;

    const savedIds = new Set(watchlist.data.map(e => e.malId ?? e.mal_id));

    animeList.forEach(anime => {
      if (!savedIds.has(anime.mal_id)) return;
      const btn = container.querySelector(`.anime-card__add[data-id="${anime.mal_id}"]`);
      if (!btn) return;
      btn.classList.add('saved');
      btn.innerHTML = '<i data-lucide="check"></i>';
      if (window.lucide) lucide.createIcons({ nodes: [btn] });
    });
  } catch { }
}

async function toggleWatchlist(anime, btn) {
  const isSaved = btn.classList.contains('saved');

  if (isSaved) {
    try {
      await Watchlist.remove(anime.mal_id);
      btn.classList.remove('saved');
      btn.innerHTML = '<i data-lucide="plus"></i>';
      if (window.lucide) lucide.createIcons({ nodes: [btn] });
      showToast('Removed from watchlist', 'info');
    } catch {
      showToast('Failed to remove', 'error');
    }
  } else {
    try {
      await Watchlist.upsert({
        malId: anime.mal_id,
        title: anime.title,
        imageUrl: anime.images?.webp?.large_image_url ?? anime.images?.jpg?.image_url ?? '',
        totalEpisodes: anime.episodes ?? 0,
        status: 'planning',
        progress: 0,
      });
      btn.classList.add('saved');
      btn.innerHTML = '<i data-lucide="check"></i>';
      if (window.lucide) lucide.createIcons({ nodes: [btn] });
      showToast('Added to watchlist', 'success');
    } catch {
      showToast('Failed to add — are you logged in?', 'error');
    }
  }
}

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

export function renderPagination(container, currentPage, lastPage, onPage) {
  container.innerHTML = '';
  if (lastPage <= 1) return;

  const pages = getPaginationRange(currentPage, lastPage);

  container.appendChild(makePageBtn('←', currentPage === 1, () => onPage(currentPage - 1)));

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

  container.appendChild(makePageBtn('→', currentPage === lastPage, () => onPage(currentPage + 1)));
}

function makePageBtn(label, disabled, onClick) {
  const btn = document.createElement('button');
  btn.className = 'pagination__btn';
  btn.textContent = label;
  btn.disabled = disabled;
  if (!disabled) btn.addEventListener('click', onClick);
  return btn;
}

function getPaginationRange(current, last) {
  const delta = 2;
  const range = [];

  for (let i = Math.max(2, current - delta); i <= Math.min(last - 1, current + delta); i++) {
    range.push(i);
  }

  if (current - delta > 2) range.unshift('...');
  if (current + delta < last - 1) range.push('...');

  range.unshift(1);
  if (last > 1) range.push(last);

  return range;
}

export function renderEmpty(container, message = 'Nothing here yet.') {
  container.innerHTML = `
    <div style="text-align:center;padding:48px 0;color:var(--text-faint);">
      <p style="font-size:1.5rem;margin-bottom:8px;">¯\\_(ツ)_/¯</p>
      <p>${message}</p>
    </div>
  `;
}

export function renderError(container, message = 'Something went wrong.') {
  container.innerHTML = `
    <div style="text-align:center;padding:48px 0;color:var(--red);">
      <p>${message}</p>
    </div>
  `;
}

export function initSliderArrows(track, prevBtn, nextBtn) {
  if (!track || !prevBtn || !nextBtn) return;

  const SCROLL_AMOUNT = 480;

  function updateArrows() {
    const atStart = track.scrollLeft <= 4;
    const atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    prevBtn.classList.toggle('disabled', atStart);
    nextBtn.classList.toggle('disabled', atEnd);
  }

  prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -SCROLL_AMOUNT, behavior: 'smooth' });
  });

  nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: SCROLL_AMOUNT, behavior: 'smooth' });
  });

  track.addEventListener('scroll', updateArrows, { passive: true });

  updateArrows();
  setTimeout(updateArrows, 400);
}