import { Jikan } from './api.js';

// Target URL for search results is always the browse page.
// The path differs depending on whether the caller is at the root or in /pages/.
function browseHref(q) {
  const inPages = window.location.pathname.includes('/pages/');
  const base = inPages ? './browse.html' : './pages/browse.html';
  return `${base}?q=${encodeURIComponent(q)}`;
}

// Wire a search form to navigate to the browse page on submit
function wireSearchForm(formId, inputId) {
  const form = document.getElementById(formId);
  const input = document.getElementById(inputId);
  if (!form || !input) return;

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (!q) return;
    window.location.href = browseHref(q);
  });

  // Pre-fill the input if the page already has a search query in the URL
  const q = new URLSearchParams(window.location.search).get('q');
  if (q) input.value = q;
}

// Desktop navbar search
wireSearchForm('searchForm', 'searchInput');

// Mobile drawer search
wireSearchForm('searchFormMobile', 'searchInputMobile');

export { Jikan };