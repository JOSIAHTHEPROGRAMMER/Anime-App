import { Jikan } from './api.js';

const grid = document.getElementById('genresGrid');

function createGenreCard(genre) {
  const card = document.createElement('a');
  card.className = 'genre-card';
  card.href = `./browse.html?genres=${genre.mal_id}`;

  const count = genre.count ? genre.count.toLocaleString() : '';

  card.innerHTML = `
    <div class="genre-card__overlay"></div>
    <span class="genre-card__name">${genre.name}</span>
    ${count ? `<span class="genre-card__count">${count}</span>` : ''}
  `;

  return card;
}

function renderSkeletons(count) {
  grid.innerHTML = Array.from({ length: count }, () =>
    `<div class="genre-card skeleton"></div>`
  ).join('');
}

async function loadGenres() {
  renderSkeletons(24);
  try {
    const res = await Jikan.genres();
    const genres = res?.data ?? [];
    grid.innerHTML = '';
    genres.forEach(g => grid.appendChild(createGenreCard(g)));
  } catch {
    grid.innerHTML = '<p class="text-muted">Failed to load genres.</p>';
  }
}

loadGenres();