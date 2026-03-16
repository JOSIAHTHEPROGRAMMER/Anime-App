import { Social, Auth } from './api.js';
import { showToast } from './ui.js';

const feedList      = document.getElementById('feedList');
const loadMoreBtn   = document.getElementById('loadMoreBtn');
const loginPrompt   = document.getElementById('loginPrompt');
const userSearchForm  = document.getElementById('userSearchForm');
const userSearchInput = document.getElementById('userSearchInput');
const userResults     = document.getElementById('userResults');

let feedPage = 1;

// Show login prompt if not logged in
if (!Auth.isLoggedIn()) {
  loginPrompt.style.display = '';
  loadMoreBtn.style.display = 'none';
} else {
  loadFeed();
}

async function loadFeed(page = 1) {
  if (page === 1) feedList.innerHTML = '<p class="text-muted" style="padding:16px 0">Loading feed…</p>';

  try {
    const res   = await Social.feed(page);
    const items = res?.data ?? [];

    if (page === 1) feedList.innerHTML = '';

    if (!items.length && page === 1) {
      feedList.innerHTML = `
        <p class="text-muted" style="padding:24px 0">
          Nothing here yet. Follow some users to see their activity.
        </p>`;
      return;
    }

    items.forEach(item => feedList.appendChild(createFeedItem(item)));
    loadMoreBtn.style.display = items.length >= 20 ? '' : 'none';
    feedPage = page;
  } catch {
    feedList.innerHTML = '<p class="text-muted">Failed to load feed.</p>';
  }
}

function createFeedItem(item) {
  const el     = document.createElement('div');
  el.className = 'feed-item';

  const avatar = item.user?.avatarUrl
    ?? `https://api.dicebear.com/8.x/thumbs/svg?seed=${item.user?.username}`;

  const timeAgo = formatTimeAgo(item.createdAt);

  el.innerHTML = `
    <img class="feed-item__avatar" src="${avatar}" alt="${item.user?.username}" />
    <div class="feed-item__content">
      <span class="feed-item__name">${item.user?.username ?? 'Unknown'}</span>
      <span class="feed-item__action"> ${item.action}
        <a class="feed-item__anime-link" href="./anime.html?id=${item.malId}">${item.animeTitle}</a>
      </span>
      <div class="feed-item__time">${timeAgo}</div>
    </div>
    ${item.imageUrl ? `<img class="feed-item__thumb" src="${item.imageUrl}" alt="${item.animeTitle}" />` : ''}
  `;

  return el;
}

loadMoreBtn?.addEventListener('click', () => loadFeed(feedPage + 1));

// User search
userSearchForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const q = userSearchInput.value.trim();
  if (!q) return;

  userResults.innerHTML = '<p class="text-muted" style="padding:8px 0">Searching…</p>';

  try {
    const res   = await Social.searchUsers(q);
    const users = res?.data ?? [];

    if (!users.length) {
      userResults.innerHTML = '<p class="text-muted" style="padding:8px 0">No users found.</p>';
      return;
    }

    userResults.innerHTML = '';
    users.forEach(u => userResults.appendChild(createUserCard(u)));
  } catch {
    userResults.innerHTML = '<p class="text-muted">Search failed.</p>';
  }
});

function createUserCard(u) {
  const card   = document.createElement('div');
  card.className = 'user-card';
  card.style.marginBottom = '10px';

  const avatar = u.avatarUrl
    ?? `https://api.dicebear.com/8.x/thumbs/svg?seed=${u.username}`;

  const isFollowing = u.isFollowing ?? false;

  card.innerHTML = `
    <img class="user-card__avatar" src="${avatar}" alt="${u.username}" />
    <div>
      <div class="user-card__name">${u.username}</div>
      <div class="user-card__handle">@${u.username}</div>
    </div>
    <button class="btn--follow ${isFollowing ? 'following' : ''}" data-id="${u._id}">
      ${isFollowing ? 'Following' : 'Follow'}
    </button>
  `;

  card.querySelector('.btn--follow')?.addEventListener('click', async (e) => {
    if (!Auth.isLoggedIn()) { showToast('Log in to follow users.', 'info'); return; }
    const btn        = e.currentTarget;
    const following  = btn.classList.contains('following');
    try {
      if (following) {
        await Social.unfollow(u._id);
        btn.textContent = 'Follow';
        btn.classList.remove('following');
      } else {
        await Social.follow(u._id);
        btn.textContent = 'Following';
        btn.classList.add('following');
      }
    } catch {
      showToast('Action failed.', 'error');
    }
  });

  return card;
}

function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  if (mins < 1)   return 'just now';
  if (mins < 60)  return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)   return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}
