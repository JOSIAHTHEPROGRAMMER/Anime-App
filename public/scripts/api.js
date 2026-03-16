/* ============================================================
   WGWAnime — api.js
   Central fetch layer. All network calls go through here.

   Sections:
   1. Config
   2. Core fetch helpers
   3. Jikan (anime data)
   4. Backend — Auth
   5. Backend — Watchlist
   6. Backend — Reviews
   7. Backend — Social
   8. Backend — Recommendations
   ============================================================ */


/* ============================================================
   1. CONFIG
   ============================================================ */

const JIKAN_BASE = 'https://api.jikan.moe/v4';

// Locally: http://localhost:3000/api
// Production: swap for your Railway / Render URL via env
const API_BASE = window.__WGW_API__ ?? 'http://localhost:3000/api';

// Jikan rate-limits to ~3 req/s. This queue prevents 429s.
const _queue   = [];
let   _running = false;

async function _drainQueue() {
  if (_running) return;
  _running = true;
  while (_queue.length) {
    const { fn, resolve, reject } = _queue.shift();
    try   { resolve(await fn()); }
    catch (err) { reject(err); }
    await _sleep(350); // ~350 ms gap stays inside Jikan's limit
  }
  _running = false;
}

function _sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function _jikanQueued(fn) {
  return new Promise((resolve, reject) => {
    _queue.push({ fn, resolve, reject });
    _drainQueue();
  });
}


/* ============================================================
   2. CORE FETCH HELPERS
   ============================================================ */

/**
 * Raw fetch with structured error handling.
 */
async function _fetch(url, options = {}) {
  const res = await fetch(url, options);

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body.message ?? body.error ?? message;
    } catch { /* ignore */ }
    const err  = new Error(message);
    err.status = res.status;
    throw err;
  }

  if (res.status === 204) return null;
  return res.json();
}

/**
 * Authenticated call to the Fastify backend.
 * Auto-attaches the JWT from localStorage.
 */
function _authFetch(path, options = {}) {
  const token = localStorage.getItem('wgw_token');
  const hasBody = options.body != null;

  return _fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
      ...(token   ? { 'Authorization': `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: hasBody ? JSON.stringify(options.body) : undefined,
  });
}

const _get    = path       => _authFetch(path, { method: 'GET' });
const _post   = (path, b)  => _authFetch(path, { method: 'POST',   body: b });
const _patch  = (path, b)  => _authFetch(path, { method: 'PATCH',  body: b });
const _delete = path       => _authFetch(path, { method: 'DELETE' });


/* ============================================================
   3. JIKAN — ANIME DATA (public, no auth)
   Docs: https://docs.api.jikan.moe/
   ============================================================ */

export const Jikan = {

  /** Currently airing anime this season */
  seasonNow(page = 1) {
    return _jikanQueued(() => _fetch(`${JIKAN_BASE}/seasons/now?page=${page}`));
  },

  /** Upcoming next-season anime */
  seasonUpcoming(page = 1) {
    return _jikanQueued(() => _fetch(`${JIKAN_BASE}/seasons/upcoming?page=${page}`));
  },

  /**
   * Same season, one year ago.
   * @param {number} year
   * @param {'winter'|'spring'|'summer'|'fall'} season
   */
  seasonPast(year, season, page = 1) {
    return _jikanQueued(() =>
      _fetch(`${JIKAN_BASE}/seasons/${year}/${season}?page=${page}`)
    );
  },

  /** Full anime detail by MAL ID */
  animeById(id) {
    return _jikanQueued(() => _fetch(`${JIKAN_BASE}/anime/${id}/full`));
  },

  /**
   * Search anime by query + optional filters.
   * @param {{ q, type, status, rating, genres, order_by, sort, page }} params
   */
  search(params = {}) {
    const clean = Object.fromEntries(
      Object.entries(params).filter(([, v]) => v != null && v !== '')
    );
    const qs = new URLSearchParams(clean).toString();
    return _jikanQueued(() => _fetch(`${JIKAN_BASE}/anime?${qs}`));
  },

  /** Anime filtered by genre ID, sorted by score */
  byGenre(genreId, page = 1) {
    return _jikanQueued(() =>
      _fetch(`${JIKAN_BASE}/anime?genres=${genreId}&page=${page}&order_by=score&sort=desc`)
    );
  },

  /** All genre definitions */
  genres() {
    return _jikanQueued(() => _fetch(`${JIKAN_BASE}/genres/anime`));
  },

  /**
   * Top anime.
   * @param {'airing'|'upcoming'|'bypopularity'|'favorite'|''} filter
   */
  top(filter = '', page = 1) {
    const f = filter ? `&filter=${filter}` : '';
    return _jikanQueued(() => _fetch(`${JIKAN_BASE}/top/anime?page=${page}${f}`));
  },

  /** Jikan's own recommendations for an anime */
  recommendations(id) {
    return _jikanQueued(() => _fetch(`${JIKAN_BASE}/anime/${id}/recommendations`));
  },

  /** Completely random anime */
  random() {
    return _jikanQueued(() => _fetch(`${JIKAN_BASE}/random/anime`));
  },

  /** Character list for an anime */
  characters(id) {
    return _jikanQueued(() => _fetch(`${JIKAN_BASE}/anime/${id}/characters`));
  },
};


/* ============================================================
   4. BACKEND — AUTH
   Replaces Firebase Auth. JWT stored in localStorage.
   ============================================================ */

export const Auth = {

  /**
   * Register a new account.
   * @param {{ username: string, email: string, password: string }} data
   */
  register(data) {
    return _post('/auth/register', data);
  },

  /**
   * Login and persist token + user to localStorage.
   * @param {{ email: string, password: string }} data
   * @returns {{ token: string, user: object }}
   */
  async login(data) {
    const res = await _post('/auth/login', data);
    if (res?.token) {
      localStorage.setItem('wgw_token', res.token);
      localStorage.setItem('wgw_user',  JSON.stringify(res.user));
    }
    return res;
  },

  /** Clear session from localStorage */
  logout() {
    localStorage.removeItem('wgw_token');
    localStorage.removeItem('wgw_user');
  },

  /**
   * Verify JWT on app load.
   * Silently logs out if the token is expired / invalid.
   * @returns {object|null} user or null
   */
  async refresh() {
    try {
      const res = await _get('/auth/me');
      if (res?.user) localStorage.setItem('wgw_user', JSON.stringify(res.user));
      return res?.user ?? null;
    } catch {
      Auth.logout();
      return null;
    }
  },

  /** Update username, bio, or avatar URL */
  updateProfile(data) {
    return _patch('/auth/me', data);
  },

  /** Returns the cached user object, or null */
  currentUser() {
    try   { return JSON.parse(localStorage.getItem('wgw_user')) ?? null; }
    catch { return null; }
  },

  /** True if a JWT token exists locally */
  isLoggedIn() {
    return !!localStorage.getItem('wgw_token');
  },
};


/* ============================================================
   5. BACKEND — WATCHLIST
   Replaces Firestore saves.
   Status values: 'watching' | 'completed' | 'dropped' | 'planning' | 'paused'
   ============================================================ */

export const Watchlist = {

  /**
   * Fetch the current user's watchlist, optionally filtered by status.
   * @param {string} [status]
   */
  getAll(status) {
    const qs = status ? `?status=${status}` : '';
    return _get(`/watchlist${qs}`);
  },

  /**
   * Add or update an anime entry (upsert by malId).
   * @param {{
   *   malId: number,
   *   title: string,
   *   imageUrl: string,
   *   totalEpisodes: number,
   *   status: string,
   *   progress: number
   * }} data
   */
  upsert(data) {
    return _post('/watchlist', data);
  },

  /**
   * Patch status or progress for one entry.
   * @param {number} malId
   * @param {{ status?: string, progress?: number }} data
   */
  update(malId, data) {
    return _patch(`/watchlist/${malId}`, data);
  },

  /** Remove an anime from the watchlist */
  remove(malId) {
    return _delete(`/watchlist/${malId}`);
  },

  /**
   * Get a single watchlist entry, or null if not found.
   * @param {number} malId
   */
  async getEntry(malId) {
    try   { return await _get(`/watchlist/${malId}`); }
    catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  },
};


/* ============================================================
   6. BACKEND — REVIEWS & RATINGS
   ============================================================ */

export const Reviews = {

  /** All reviews for an anime (public) */
  getForAnime(malId) {
    return _fetch(`${API_BASE}/reviews/anime/${malId}`);
  },

  /** Current user's own review for an anime, or null */
  async getMyReview(malId) {
    try   { return await _get(`/reviews/anime/${malId}/mine`); }
    catch (err) {
      if (err.status === 404) return null;
      throw err;
    }
  },

  /**
   * Create or replace the current user's review.
   * @param {{ malId: number, rating: number, body: string }} data
   * rating: 1–10
   */
  upsert(data) {
    return _post('/reviews', data);
  },

  /** Delete the current user's review for an anime */
  remove(malId) {
    return _delete(`/reviews/anime/${malId}`);
  },

  /**
   * Toggle like on a review.
   * @param {string} reviewId  MongoDB ObjectId string
   */
  toggleLike(reviewId) {
    return _post(`/reviews/${reviewId}/like`);
  },
};


/* ============================================================
   7. BACKEND — SOCIAL
   ============================================================ */

export const Social = {

  follow(userId)   { return _post(`/social/follow/${userId}`);   },
  unfollow(userId) { return _delete(`/social/follow/${userId}`); },

  /** Activity feed — actions from followed users */
  feed(page = 1) {
    return _get(`/social/feed?page=${page}`);
  },

  /** Public profile + watchlist summary by username */
  getProfile(username) {
    return _fetch(`${API_BASE}/social/users/${username}`);
  },

  /** Search users by username */
  searchUsers(query) {
    return _fetch(`${API_BASE}/social/users?q=${encodeURIComponent(query)}`);
  },

  getFollowers(userId) {
    return _fetch(`${API_BASE}/social/users/${userId}/followers`);
  },

  getFollowing(userId) {
    return _fetch(`${API_BASE}/social/users/${userId}/following`);
  },
};


/* ============================================================
   8. BACKEND — AI RECOMMENDATIONS
   Backend queries our AI service using the user's watchlist
   + ratings to surface personalised suggestions.
   ============================================================ */

export const Recommendations = {

  /** Personalised recommendations for the logged-in user */
  forMe() {
    return _get('/recommendations');
  },

  /**
   * Recommendations similar to a given anime
   * (AI layer on top of Jikan's own recs).
   * @param {number} malId
   */
  similarTo(malId) {
    return _get(`/recommendations/similar/${malId}`);
  },

  /** Dismiss a recommendation so it won't appear again */
  dismiss(malId) {
    return _delete(`/recommendations/${malId}`);
  },
};
