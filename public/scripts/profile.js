import { Auth, Watchlist } from './api.js';
import { requireAuth } from './auth.js';
import { renderCards, renderSkeletons, showToast } from './ui.js';

requireAuth();

const user = Auth.currentUser();

const profileAvatar  = document.getElementById('profileAvatar');
const profileName    = document.getElementById('profileName');
const profileHandle  = document.getElementById('profileHandle');
const profileBio     = document.getElementById('profileBio');
const profileStats   = document.getElementById('profileStats');
const profileTabs    = document.getElementById('profileTabs');
const animeList      = document.getElementById('profileAnimeList');
const editProfileBtn = document.getElementById('editProfileBtn');
const editForm       = document.getElementById('profileEditForm');
const cancelEditBtn  = document.getElementById('cancelEditBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const editUsername   = document.getElementById('editUsername');
const editAvatar     = document.getElementById('editAvatar');
const editBio        = document.getElementById('editBio');
const editError      = document.getElementById('editError');
const avatarEditBtn  = document.getElementById('avatarEditBtn');

let allEntries   = [];
let activeStatus = 'watching';

function renderHeader(u) {
  const avatar = u.avatarUrl ?? `https://api.dicebear.com/8.x/thumbs/svg?seed=${u.username}`;
  profileAvatar.src        = avatar;
  profileName.textContent  = u.username;
  profileHandle.textContent = `@${u.username}`;
  profileBio.textContent   = u.bio ?? '';
}

function renderStats(entries) {
  const counts = {
    watching:  entries.filter(e => e.status === 'watching').length,
    completed: entries.filter(e => e.status === 'completed').length,
    planning:  entries.filter(e => e.status === 'planning').length,
    dropped:   entries.filter(e => e.status === 'dropped').length,
  };

  profileStats.innerHTML = [
    { label: 'Watching',   num: counts.watching },
    { label: 'Completed',  num: counts.completed },
    { label: 'Planning',   num: counts.planning },
    { label: 'Total',      num: entries.length },
  ].map(s => `
    <div class="profile-stat">
      <div class="profile-stat__num">${s.num}</div>
      <div class="profile-stat__label">${s.label}</div>
    </div>
  `).join('');
}

function renderAnimeForStatus(status) {
  const entries = allEntries.filter(e => e.status === status);

  if (!entries.length) {
    animeList.innerHTML = `<p class="text-muted" style="padding:24px 0">Nothing here yet.</p>`;
    return;
  }

  // Convert watchlist entries to the shape renderCards expects
  const fakeAnime = entries.map(e => ({
    mal_id: e.malId,
    title:  e.title,
    images: { jpg: { image_url: e.imageUrl }, webp: { large_image_url: e.imageUrl } },
    score:  null,
    airing: false,
    type:   '',
    year:   '',
  }));

  renderCards(animeList, fakeAnime);
}

async function loadProfile() {
  if (user) renderHeader(user);

  renderSkeletons(animeList, 8);

  try {
    const res  = await Watchlist.getAll();
    allEntries = res?.data ?? [];
    renderStats(allEntries);
    renderAnimeForStatus(activeStatus);
  } catch {
    showToast('Failed to load watchlist.', 'error');
  }
}

// Tab switching
profileTabs?.addEventListener('click', (e) => {
  const tab = e.target.closest('.watchlist-tab');
  if (!tab) return;
  profileTabs.querySelectorAll('.watchlist-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  activeStatus = tab.dataset.status;
  renderAnimeForStatus(activeStatus);
});

// Edit profile toggle
editProfileBtn?.addEventListener('click', () => {
  editForm.style.display = '';
  editProfileBtn.style.display = 'none';
  editUsername.value = user?.username ?? '';
  editAvatar.value   = user?.avatarUrl ?? '';
  editBio.value      = user?.bio ?? '';
});

cancelEditBtn?.addEventListener('click', () => {
  editForm.style.display       = 'none';
  editProfileBtn.style.display = '';
  editError.textContent        = '';
});

avatarEditBtn?.addEventListener('click', () => editProfileBtn.click());

saveProfileBtn?.addEventListener('click', async () => {
  editError.textContent        = '';
  saveProfileBtn.textContent   = 'Saving…';
  saveProfileBtn.disabled      = true;

  try {
    const updated = await Auth.updateProfile({
      username:  editUsername.value.trim(),
      avatarUrl: editAvatar.value.trim(),
      bio:       editBio.value.trim(),
    });
    localStorage.setItem('wgw_user', JSON.stringify(updated.user ?? updated));
    renderHeader(updated.user ?? updated);
    editForm.style.display       = 'none';
    editProfileBtn.style.display = '';
    showToast('Profile updated.', 'success');
  } catch (err) {
    editError.textContent = err.message ?? 'Failed to save.';
  } finally {
    saveProfileBtn.textContent = 'Save';
    saveProfileBtn.disabled    = false;
  }
});

loadProfile();
