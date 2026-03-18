import { Jikan } from './api.js';
import { renderCards, renderSkeletons, renderPagination, renderEmpty, renderError } from './ui.js';

const grid = document.getElementById('browseGrid');
const pagination = document.getElementById('browsePagination');
const heading = document.getElementById('browseHeading');

const filterType = document.getElementById('filterType');
const filterStatus = document.getElementById('filterStatus');
const filterRating = document.getElementById('filterRating');
const filterOrder = document.getElementById('filterOrder');
const filterSort = document.getElementById('filterSort');
const filterGenre = document.getElementById('filterGenre');
const resetBtn = document.getElementById('resetFilters');

let currentPage = 1;

// Exact MAL genre IDs from https://api.jikan.moe/v4/genres/anime
const GENRES = [
  // Main genres
  { id: 1, name: 'Action' },
  { id: 2, name: 'Adventure' },
  { id: 5, name: 'Avant Garde' },
  { id: 46, name: 'Award Winning' },
  { id: 28, name: 'Boys Love' },
  { id: 4, name: 'Comedy' },
  { id: 8, name: 'Drama' },
  { id: 10, name: 'Fantasy' },
  { id: 26, name: 'Girls Love' },
  { id: 47, name: 'Gourmet' },
  { id: 14, name: 'Horror' },
  { id: 7, name: 'Mystery' },
  { id: 22, name: 'Romance' },
  { id: 24, name: 'Sci-Fi' },
  { id: 36, name: 'Slice of Life' },
  { id: 30, name: 'Sports' },
  { id: 37, name: 'Supernatural' },
  { id: 41, name: 'Suspense' },
  { id: 9, name: 'Ecchi' },
  { id: 49, name: 'Erotica' },
  { id: 12, name: 'Hentai' },
  // Themes
  { id: 50, name: 'Adult Cast' },
  { id: 51, name: 'Anthropomorphic' },
  { id: 52, name: 'CGDCT' },
  { id: 53, name: 'Childcare' },
  { id: 54, name: 'Combat Sports' },
  { id: 81, name: 'Crossdressing' },
  { id: 55, name: 'Delinquents' },
  { id: 39, name: 'Detective' },
  { id: 56, name: 'Educational' },
  { id: 57, name: 'Gag Humor' },
  { id: 58, name: 'Gore' },
  { id: 35, name: 'Harem' },
  { id: 59, name: 'High Stakes Game' },
  { id: 13, name: 'Historical' },
  { id: 60, name: 'Idols (Female)' },
  { id: 61, name: 'Idols (Male)' },
  { id: 62, name: 'Isekai' },
  { id: 63, name: 'Iyashikei' },
  { id: 64, name: 'Love Polygon' },
  { id: 65, name: 'Magical Sex Shift' },
  { id: 66, name: 'Mahou Shoujo' },
  { id: 17, name: 'Martial Arts' },
  { id: 18, name: 'Mecha' },
  { id: 67, name: 'Medical' },
  { id: 38, name: 'Military' },
  { id: 19, name: 'Music' },
  { id: 6, name: 'Mythology' },
  { id: 68, name: 'Organized Crime' },
  { id: 69, name: 'Otaku Culture' },
  { id: 20, name: 'Parody' },
  { id: 70, name: 'Performing Arts' },
  { id: 71, name: 'Pets' },
  { id: 40, name: 'Psychological' },
  { id: 3, name: 'Racing' },
  { id: 72, name: 'Reincarnation' },
  { id: 73, name: 'Reverse Harem' },
  { id: 74, name: 'Love Status Quo' },
  { id: 21, name: 'Samurai' },
  { id: 23, name: 'School' },
  { id: 75, name: 'Showbiz' },
  { id: 29, name: 'Space' },
  { id: 11, name: 'Strategy Game' },
  { id: 31, name: 'Super Power' },
  { id: 76, name: 'Survival' },
  { id: 77, name: 'Team Sports' },
  { id: 78, name: 'Time Travel' },
  { id: 32, name: 'Vampire' },
  { id: 79, name: 'Video Game' },
  { id: 80, name: 'Visual Arts' },
  { id: 48, name: 'Workplace' },
  { id: 82, name: 'Urban Fantasy' },
  { id: 83, name: 'Villainess' },
  // Demographics
  { id: 43, name: 'Josei' },
  { id: 15, name: 'Kids' },
  { id: 42, name: 'Seinen' },
  { id: 25, name: 'Shoujo' },
  { id: 27, name: 'Shounen' },
];

function buildGenreOptions() {
  if (!filterGenre) return;
  const current = getParams().genres;
  GENRES.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g.id;
    opt.textContent = g.name;
    if (String(g.id) === String(current)) opt.selected = true;
    filterGenre.appendChild(opt);
  });
}

function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    q: p.get('q') ?? '',
    type: p.get('type') ?? '',
    status: p.get('status') ?? '',
    rating: p.get('rating') ?? '',
    genres: p.get('genres') ?? '',
    order: p.get('order') ?? 'score',
    sort: p.get('sort') ?? 'desc',
    page: parseInt(p.get('page') ?? '1', 10),
    filter: p.get('filter') ?? '',
  };
}

function syncFilters(params) {
  if (filterType) filterType.value = params.type;
  if (filterStatus) filterStatus.value = params.status;
  if (filterRating) filterRating.value = params.rating;
  if (filterOrder) filterOrder.value = params.order;
  if (filterSort) filterSort.value = params.sort;
  if (filterGenre) filterGenre.value = params.genres;
}

function pushParams(overrides = {}) {
  const params = getParams();
  const merged = { ...params, ...overrides, page: overrides.page ?? 1 };
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== ''))
  );
  window.history.replaceState({}, '', `?${qs}`);
}

function updateHeading(params) {
  if (params.q) heading.textContent = `Results for "${params.q}"`;
  else if (params.filter === 'airing') heading.textContent = 'Currently Airing';
  else if (params.filter === 'upcoming') heading.textContent = 'Upcoming Anime';
  else if (params.genres) {
    const genre = GENRES.find(g => String(g.id) === String(params.genres));
    heading.textContent = genre ? `${genre.name} Anime` : 'Browse by Genre';
  }
  else if (params.type) heading.textContent = `${params.type.toUpperCase()} Anime`;
  else heading.textContent = 'Browse Anime';
}

async function load(page = 1) {
  const params = getParams();
  currentPage = page;
  syncFilters(params);
  updateHeading(params);
  renderSkeletons(grid, 16);
  pagination.innerHTML = '';

  try {
    let res;

    if (params.filter === 'airing') {
      res = await Jikan.seasonNow(page);
    } else if (params.filter === 'upcoming') {
      res = await Jikan.seasonUpcoming(page);
    } else {
      res = await Jikan.search({
        q: params.q || undefined,
        type: params.type || undefined,
        status: params.status || undefined,
        rating: params.rating || undefined,
        genres: params.genres || undefined,
        order_by: params.order || 'score',
        sort: params.sort || 'desc',
        limit: 16,
        page,
      });
    }

    const data = (res?.data ?? []).slice(0, 16);
    const lastPage = res?.pagination?.last_visible_page ?? 1;

    if (!data.length) {
      renderEmpty(grid, 'No anime found. Try different filters.');
      return;
    }

    renderCards(grid, data);
    renderPagination(pagination, page, lastPage, (p) => {
      pushParams({ page: p });
      load(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

  } catch {
    renderError(grid, 'Failed to load anime. Please try again.');
  }
}

[filterType, filterStatus, filterRating, filterOrder, filterSort, filterGenre].forEach(el => {
  el?.addEventListener('change', () => {
    pushParams({
      type: filterType.value,
      status: filterStatus.value,
      rating: filterRating.value,
      genres: filterGenre?.value ?? '',
      order: filterOrder.value,
      sort: filterSort.value,
    });
    load(1);
  });
});

resetBtn?.addEventListener('click', () => {
  window.location.href = './browse.html';
});

buildGenreOptions();
load(getParams().page);