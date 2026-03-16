import { Jikan } from './api.js';

const form = document.getElementById('searchForm');
const input = document.getElementById('searchInput');

// On submit from the navbar search - redirect to browse page with query
form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const q = input.value.trim();
  if (!q) return;
  window.location.href = `/public/pages/browse.html?q=${encodeURIComponent(q)}`;
});

// If we're already on the browse page, pick up the query from the URL
// and pre-fill the search input
const params = new URLSearchParams(window.location.search);
const q = params.get('q');
if (q && input) input.value = q;

export { Jikan };
