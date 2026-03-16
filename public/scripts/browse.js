import { Jikan } from './api.js';
import { renderCards, renderSkeletons, renderPagination, renderEmpty, renderError } from './ui.js';

const grid       = document.getElementById('browseGrid');
const pagination = document.getElementById('browsePagination');
const heading    = document.getElementById('browseHeading');

const filterType   = document.getElementById('filterType');
const filterStatus = document.getElementById('filterStatus');
const filterRating = document.getElementById('filterRating');
const filterOrder  = document.getElementById('filterOrder');
const filterSort   = document.getElementById('filterSort');
const resetBtn     = document.getElementById('resetFilters');

let currentPage = 1;

// Read initial state from URL params
function getParams() {
  const p = new URLSearchParams(window.location.search);
  return {
    q:       p.get('q')      ?? '',
    type:    p.get('type')   ?? '',
    status:  p.get('status') ?? '',
    rating:  p.get('rating') ?? '',
    order:   p.get('order')  ?? 'score',
    sort:    p.get('sort')   ?? 'desc',
    page:    parseInt(p.get('page') ?? '1', 10),
    filter:  p.get('filter') ?? '',
  };
}

// Sync filter dropdowns to current URL params
function syncFilters(params) {
  if (filterType)   filterType.value   = params.type;
  if (filterStatus) filterStatus.value = params.status;
  if (filterRating) filterRating.value = params.rating;
  if (filterOrder)  filterOrder.value  = params.order;
  if (filterSort)   filterSort.value   = params.sort;
}

// Push new params into URL without reload
function pushParams(overrides = {}) {
  const params = getParams();
  const merged = { ...params, ...overrides, page: overrides.page ?? 1 };
  const qs = new URLSearchParams(
    Object.fromEntries(Object.entries(merged).filter(([, v]) => v !== ''))
  );
  window.history.replaceState({}, '', `?${qs}`);
}

function updateHeading(params) {
  if (params.q)           heading.textContent = `Results for "${params.q}"`;
  else if (params.filter === 'airing')   heading.textContent = 'Currently Airing';
  else if (params.filter === 'upcoming') heading.textContent = 'Upcoming Anime';
  else if (params.type)   heading.textContent = `${params.type.toUpperCase()} Anime`;
  else                    heading.textContent = 'Browse Anime';
}

async function load(page = 1) {
  const params = getParams();
  currentPage  = page;
  syncFilters(params);
  updateHeading(params);
  renderSkeletons(grid, 20);
  pagination.innerHTML = '';

  try {
    let res;

    // Special filter routes
    if (params.filter === 'airing') {
      res = await Jikan.seasonNow(page);
    } else if (params.filter === 'upcoming') {
      res = await Jikan.seasonUpcoming(page);
    } else {
      // Standard search / browse
      res = await Jikan.search({
        q:        params.q      || undefined,
        type:     params.type   || undefined,
        status:   params.status || undefined,
        rating:   params.rating || undefined,
        order_by: params.order  || 'score',
        sort:     params.sort   || 'desc',
        page,
      });
    }

    const data     = res?.data ?? [];
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

// Filter change handlers
[filterType, filterStatus, filterRating, filterOrder, filterSort].forEach(el => {
  el?.addEventListener('change', () => {
    pushParams({
      type:   filterType.value,
      status: filterStatus.value,
      rating: filterRating.value,
      order:  filterOrder.value,
      sort:   filterSort.value,
    });
    load(1);
  });
});

resetBtn?.addEventListener('click', () => {
  window.location.href = './browse.html';
});

load(getParams().page);
