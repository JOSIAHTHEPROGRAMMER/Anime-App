import { Jikan, Recommendations, Auth } from './api.js';
import { renderCards, renderSkeletons, renderError } from './ui.js';

let spotlight = [];
let current = 0;
let autoTimer = null;
let hoverTimer = null;

const heroBg = document.getElementById('heroBg');
const heroPoster = document.getElementById('heroPoster');
const heroSpotlight = document.getElementById('heroSpotlight');
const heroTitle = document.getElementById('heroTitle');
const heroMeta = document.getElementById('heroMeta');
const heroSynopsis = document.getElementById('heroSynopsis');
const heroDetailBtn = document.getElementById('heroDetailBtn');
const heroTrailerBtn = document.getElementById('heroTrailerBtn');
const heroHoverFrame = document.getElementById('heroHoverFrame');
const heroPrev = document.getElementById('heroPrev');
const heroNext = document.getElementById('heroNext');
const heroDotsEl = document.getElementById('heroDots');
const heroSection = document.getElementById('heroSection');

function getYouTubeId(anime) {
  const t = anime?.trailer;
  if (!t) return null;
  if (t.youtube_id) return t.youtube_id;
  if (t.embed_url) {
    const m = t.embed_url.match(/(?:embed\/|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
  }
  if (t.url) {
    const m = t.url.match(/(?:v=|youtu\.be\/)([A-Za-z0-9_-]{11})/);
    if (m) return m[1];
  }
  return null;
}

function getWideBg(anime) {
  const ytId = getYouTubeId(anime);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/maxresdefault.jpg`;
  return (
    anime.images?.webp?.large_image_url ??
    anime.images?.jpg?.large_image_url ??
    ''
  );
}

function getPoster(anime) {
  return (
    anime.images?.webp?.large_image_url ??
    anime.images?.jpg?.large_image_url ??
    ''
  );
}

function renderSpotlight(index) {
  const anime = spotlight[index];
  if (!anime) return;

  heroSection.classList.add('hero--transitioning');
  stopHoverPreview();
  isHovering = false;
  clearTimeout(hoverTimer);

  setTimeout(() => {
    const ytId = getYouTubeId(anime);
    const bgUrl = getWideBg(anime);
    const poster = getPoster(anime);

    heroBg.style.backgroundImage = `url('${bgUrl}')`;
    heroBg.dataset.bgType = ytId ? 'landscape' : 'portrait';

    if (heroPoster) {
      heroPoster.src = poster;
      heroPoster.alt = anime.title ?? '';
    }

    heroSpotlight.textContent = `#${index + 1} Spotlight`;
    heroTitle.textContent = anime.title ?? '';
    heroSynopsis.textContent = anime.synopsis ?? 'No synopsis available.';
    heroDetailBtn.href = `./pages/anime.html?id=${anime.mal_id}`;

    const score = anime.score ? `<span class="score">⭐ ${anime.score}</span>` : '';
    const type = anime.type ? `<span>${anime.type}</span>` : '';
    const year = anime.year ?? anime.aired?.prop?.from?.year ?? '';
    const eps = anime.episodes ? `<span>${anime.episodes} eps</span>` : '';
    const sep = `<span style="color:var(--text-faint)">·</span>`;
    heroMeta.innerHTML = [score, type, year ? `<span>${year}</span>` : '', eps]
      .filter(Boolean).join(sep);

    if (ytId) {
      heroTrailerBtn.style.display = '';
      heroTrailerBtn.dataset.ytid = ytId;
    } else {
      heroTrailerBtn.style.display = 'none';
      heroTrailerBtn.dataset.ytid = '';
    }

    heroDotsEl.querySelectorAll('.hero__dot').forEach((dot, i) => {
      dot.classList.toggle('active', i === index);
    });

    heroSection.classList.remove('hero--transitioning');
  }, 300);
}

function buildDots() {
  heroDotsEl.innerHTML = '';
  spotlight.forEach((_, i) => {
    const dot = document.createElement('button');
    dot.className = 'hero__dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goTo(i));
    heroDotsEl.appendChild(dot);
  });
}

function goTo(index) {
  current = (index + spotlight.length) % spotlight.length;
  renderSpotlight(current);
  resetTimer();
}

function resetTimer() {
  clearInterval(autoTimer);
  autoTimer = setInterval(() => goTo(current + 1), 7000);
}

let isHovering = false;

function startHoverPreview() {
  const anime = spotlight[current];
  if (!anime || !heroHoverFrame) return;
  const ytId = getYouTubeId(anime);
  if (!ytId) return;
  clearInterval(autoTimer);
  heroHoverFrame.setAttribute('allow',
    'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
  );
  heroHoverFrame.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
  heroHoverFrame.setAttribute('allowfullscreen', '');
  heroHoverFrame.src = `https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&controls=0&rel=0&modestbranding=1&playsinline=1&enablejsapi=1`;
  heroHoverFrame.style.opacity = '1';
}

function stopHoverPreview() {
  if (!heroHoverFrame) return;
  heroHoverFrame.src = '';
  heroHoverFrame.style.opacity = '0';
}

heroSection?.addEventListener('mouseenter', () => {
  if (isHovering) return;
  isHovering = true;
  clearTimeout(hoverTimer);
  hoverTimer = setTimeout(startHoverPreview, 900);
});

heroSection?.addEventListener('mouseleave', (e) => {
  if (heroSection.contains(e.relatedTarget)) return;
  isHovering = false;
  clearTimeout(hoverTimer);
  stopHoverPreview();
  resetTimer();
});

heroTrailerBtn?.addEventListener('click', () => {
  const id = heroTrailerBtn.dataset.ytid;
  if (!id) return;
  window.open(`https://www.youtube.com/watch?v=${id}`, '_blank', 'noopener,noreferrer');
});

heroPrev?.addEventListener('click', () => goTo(current - 1));
heroNext?.addEventListener('click', () => goTo(current + 1));

async function initHero() {
  try {
    const res = await Jikan.seasonNow(1);
    const all = res?.data ?? [];

    spotlight = all
      .filter(a => getYouTubeId(a))
      .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
      .slice(0, 8);

    if (spotlight.length < 3) {
      const extra = all
        .filter(a => !spotlight.includes(a))
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 8 - spotlight.length);
      spotlight = [...spotlight, ...extra];
    }

    if (!spotlight.length) return;
    buildDots();
    renderSpotlight(0);
    resetTimer();
  } catch (err) {
    console.warn('[Hero] Failed to load spotlight:', err);
  }
}

function wireSlider(containerId, prevId, nextId) {
  const container = document.getElementById(containerId);
  const prev = document.getElementById(prevId);
  const next = document.getElementById(nextId);
  if (!container || !prev || !next) return;

  const CARD_W = 160;
  const GAP = 12;
  const SCROLL = (CARD_W + GAP) * 4;

  prev.addEventListener('click', () => {
    container.style.scrollBehavior = 'smooth';
    container.scrollLeft -= SCROLL;
  });
  next.addEventListener('click', () => {
    container.style.scrollBehavior = 'smooth';
    container.scrollLeft += SCROLL;
  });

  function updateArrows() {
    const atStart = container.scrollLeft <= 10;
    const atEnd = container.scrollLeft + container.clientWidth >= container.scrollWidth - 10;
    prev.classList.toggle('disabled', atStart);
    next.classList.toggle('disabled', atEnd);
  }

  container.addEventListener('scroll', updateArrows, { passive: true });
  setTimeout(updateArrows, 100);

  let isDragging = false;
  let startX = 0;
  let startScroll = 0;

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.pageX;
    startScroll = container.scrollLeft;
    container.classList.add('dragging');
    container.style.scrollBehavior = 'auto';
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    container.scrollLeft = startScroll - (e.pageX - startX);
  });

  window.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    container.classList.remove('dragging');
  });
}

function getPrevYearSeason() {
  const now = new Date();
  const year = now.getFullYear() - 1;
  const month = now.getMonth();
  const seasons = [
    'winter', 'winter', 'spring', 'spring', 'spring',
    'summer', 'summer', 'summer', 'fall', 'fall', 'fall', 'winter'
  ];
  return [year, seasons[month]];
}

const rows = [
  { containerId: 'seasonNowList', prevId: 'seasonNowPrev', nextId: 'seasonNowNext', fetch: () => Jikan.seasonNow() },
  { containerId: 'upcomingList', prevId: 'upcomingPrev', nextId: 'upcomingNext', fetch: () => Jikan.seasonUpcoming() },
  { containerId: 'prevYearList', prevId: 'prevYearPrev', nextId: 'prevYearNext', fetch: () => Jikan.seasonPast(...getPrevYearSeason()) },
];

async function loadRow({ containerId, prevId, nextId, fetch }) {
  const container = document.getElementById(containerId);
  if (!container) return;
  wireSlider(containerId, prevId, nextId);
  renderSkeletons(container);
  try {
    const res = await fetch();
    const data = res?.data?.slice(0, 24) ?? [];
    renderCards(container, data);
  } catch (err) {
    console.warn(`[Row:${containerId}] Failed:`, err);
    renderError(container, 'Failed to load anime.');
  }
}

// AI Recommendations row - logged in users only
async function loadRecommendations() {
  const section = document.getElementById('recsSection');
  const container = document.getElementById('recsList');
  const sliderWrap = document.getElementById('recsSliderWrap');
  const prompt = document.getElementById('recsLoginPrompt');

  if (!section) return;

  if (!Auth.isLoggedIn()) {
    if (sliderWrap) sliderWrap.style.display = 'none';
    if (prompt) prompt.style.display = '';
    return;
  }

  if (prompt) prompt.style.display = 'none';
  if (sliderWrap) sliderWrap.style.display = '';

  wireSlider('recsList', 'recsPrev', 'recsNext');
  renderSkeletons(container, 12);

  try {
    const res = await Recommendations.forMe();
    const titles = res?.data ?? [];

    if (!titles.length) {
      container.innerHTML = '<p class="text-muted" style="padding:16px 0">Add anime to your watchlist to get recommendations.</p>';
      return;
    }

    const animeResults = await Promise.all(
      titles.slice(0, 10).map(async ({ title }) => {
        try {
          const r = await Jikan.search({ q: title, limit: 1 });
          return r?.data?.[0] ?? null;
        } catch { return null; }
      })
    );

    const valid = animeResults.filter(Boolean);
    if (!valid.length) {
      container.innerHTML = '<p class="text-muted" style="padding:16px 0">Could not load recommendations right now.</p>';
      return;
    }

    renderCards(container, valid);
  } catch {
    container.innerHTML = '<p class="text-muted" style="padding:16px 0">Could not load recommendations right now.</p>';
  }
}

initHero();
rows.forEach(loadRow);
loadRecommendations();