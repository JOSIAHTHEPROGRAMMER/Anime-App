import { Auth, Watchlist, Social } from './api.js';
import { requireAuth } from './auth.js';
import { renderCards, renderSkeletons, showToast, initSliderArrows } from './ui.js';

const DEFAULT_PFP = '/public/assets/default-pfp-24.jpg';

const urlParams = new URLSearchParams(window.location.search);
const viewingUser = urlParams.get('u');
const isOwnProfile = !viewingUser || viewingUser === Auth.currentUser()?.username;

if (isOwnProfile) requireAuth();

const user = Auth.currentUser();

const profileAvatar = document.getElementById('profileAvatar');
const profileName = document.getElementById('profileName');
const profileHandle = document.getElementById('profileHandle');
const profileBio = document.getElementById('profileBio');
const profileStats = document.getElementById('profileStats');
const profileTabs = document.getElementById('profileTabs');
const animeList = document.getElementById('profileAnimeList');
const listPrev = document.getElementById('profileListPrev');
const listNext = document.getElementById('profileListNext');
const editProfileBtn = document.getElementById('editProfileBtn');
const editForm = document.getElementById('profileEditForm');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const editUsername = document.getElementById('editUsername');
const editAvatar = document.getElementById('editAvatar');
const editBio = document.getElementById('editBio');
const editError = document.getElementById('editError');
const avatarEditBtn = document.getElementById('avatarEditBtn');
const followBtn = document.getElementById('followBtn');

let allEntries = [];
let activeStatus = 'watching';
let publicUserId = null;

if (!isOwnProfile) {
  if (editProfileBtn) editProfileBtn.style.display = 'none';
  if (avatarEditBtn) avatarEditBtn.style.display = 'none';
  if (followBtn) followBtn.style.display = '';
}

function renderHeader(u) {
  profileAvatar.src = u.avatarUrl || DEFAULT_PFP;
  profileName.textContent = u.username;
  profileHandle.textContent = `@${u.username}`;
  profileBio.textContent = u.bio ?? '';

  const navAvatar = document.getElementById('userAvatar');
  if (navAvatar && isOwnProfile) navAvatar.src = u.avatarUrl || DEFAULT_PFP;
}

function renderStats(entries) {
  const counts = {
    watching: entries.filter(e => e.status === 'watching').length,
    completed: entries.filter(e => e.status === 'completed').length,
    planning: entries.filter(e => e.status === 'planning').length,
    dropped: entries.filter(e => e.status === 'dropped').length,
  };

  profileStats.innerHTML = [
    { label: 'Watching', num: counts.watching },
    { label: 'Completed', num: counts.completed },
    { label: 'Planning', num: counts.planning },
    { label: 'Total', num: entries.length },
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

  const fakeAnime = entries.map(e => ({
    mal_id: e.malId,
    title: e.title,
    images: {
      jpg: { image_url: e.imageUrl },
      webp: { large_image_url: e.imageUrl },
    },
    score: null,
    airing: false,
    type: '',
    year: '',
  }));

  renderCards(animeList, fakeAnime);
  initSliderArrows(animeList, listPrev, listNext);
}

function setFollowState(isFollowing) {
  if (!followBtn) return;
  followBtn.textContent = isFollowing ? 'Following' : 'Follow';
  followBtn.classList.toggle('following', isFollowing);
}

async function loadProfile() {
  if (isOwnProfile) {
    if (user) renderHeader(user);
    renderSkeletons(animeList, 8);
    try {
      const res = await Watchlist.getAll();
      allEntries = res?.data ?? [];
      renderStats(allEntries);
      renderAnimeForStatus(activeStatus);
    } catch {
      showToast('Failed to load watchlist.', 'error');
    }
  } else {
    renderSkeletons(animeList, 8);
    try {
      // getProfile is now authenticated so the server sets isFollowing correctly.
      // Auth.refresh runs in parallel so we also have a fresh following array
      // as a fallback in case the server does not return isFollowing.
      const [profileRes, freshUser] = await Promise.all([
        Social.getProfile(viewingUser),
        Auth.isLoggedIn() ? Auth.refresh() : Promise.resolve(null),
      ]);

      const publicUser = profileRes?.data;
      if (!publicUser) return;

      publicUserId = publicUser._id;
      renderHeader(publicUser);

      if (followBtn && Auth.isLoggedIn()) {
        // The server returns publicUser.followers - the list of user IDs that
        // follow this profile. Check if the current user's ID is in that list.
        const myId = freshUser?._id?.toString() ?? Auth.currentUser()?._id?.toString();
        const followers = publicUser.followers ?? [];
        const isFollowing = followers.map(f => f.toString()).includes(myId);
        setFollowState(isFollowing);
      }

      allEntries = publicUser.watchlist ?? [];
      renderStats(allEntries);
      renderAnimeForStatus(activeStatus);
    } catch {
      showToast('Failed to load profile.', 'error');
    }
  }
}

// Follow / unfollow with 409 guard
followBtn?.addEventListener('click', async () => {
  if (!Auth.isLoggedIn()) { showToast('Log in to follow users.', 'info'); return; }
  if (!publicUserId) return;

  followBtn.disabled = true;

  const isFollowing = followBtn.classList.contains('following');
  try {
    if (isFollowing) {
      await Social.unfollow(publicUserId);
      setFollowState(false);
    } else {
      await Social.follow(publicUserId);
      setFollowState(true);
    }
  } catch (err) {
    // 409 means the follow already exists - sync button to correct state
    if (err.status === 409) {
      setFollowState(true);
    } else {
      showToast('Action failed.', 'error');
    }
  } finally {
    followBtn.disabled = false;
  }
});

// Tab switching
profileTabs?.addEventListener('click', (e) => {
  const tab = e.target.closest('.watchlist-tab');
  if (!tab) return;
  profileTabs.querySelectorAll('.watchlist-tab').forEach(t => t.classList.remove('active'));
  tab.classList.add('active');
  activeStatus = tab.dataset.status;
  renderAnimeForStatus(activeStatus);
});

editProfileBtn?.addEventListener('click', () => {
  editForm.style.display = '';
  editProfileBtn.style.display = 'none';
  editUsername.value = user?.username ?? '';
  editAvatar.value = user?.avatarUrl ?? DEFAULT_PFP;
  editBio.value = user?.bio ?? '';
});

cancelEditBtn?.addEventListener('click', () => {
  editForm.style.display = 'none';
  editProfileBtn.style.display = '';
  editError.textContent = '';
});

avatarEditBtn?.addEventListener('click', () => {
  if (editForm.style.display === 'none' || !editForm.style.display) {
    editProfileBtn.click();
  }
  fileInput.click();
});

async function uploadAvatar(file) {
  const form = new FormData();
  form.append('file', file);
  const token = localStorage.getItem('wgw_token');
  const res = await fetch(
    `${window.__WGW_API__ ?? 'http://localhost:3000/api'}/auth/upload-avatar`,
    { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.error ?? 'Upload failed');
  return data.avatarUrl;
}

const fileInput = document.createElement('input');
fileInput.type = 'file';
fileInput.accept = 'image/*';
fileInput.style = 'display:none';
document.body.appendChild(fileInput);

fileInput.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  if (!file) return;
  avatarEditBtn.textContent = '…';
  try {
    const url = await uploadAvatar(file);
    if (!url) return;
    profileAvatar.src = url;
    editAvatar.value = url;
    showToast('Image uploaded - save your profile to apply.', 'info');
  } catch (err) {
    showToast(err.message ?? 'Upload failed.', 'error');
  } finally {
    avatarEditBtn.textContent = '✎';
  }
});

saveProfileBtn?.addEventListener('click', async () => {
  editError.textContent = '';
  saveProfileBtn.textContent = 'Saving…';
  saveProfileBtn.disabled = true;

  try {
    const updated = await Auth.updateProfile({
      username: editUsername.value.trim(),
      avatarUrl: editAvatar.value.trim() || DEFAULT_PFP,
      bio: editBio.value.trim(),
    });
    const updatedUser = updated.user ?? updated;
    localStorage.setItem('wgw_user', JSON.stringify(updatedUser));
    renderHeader(updatedUser);
    editForm.style.display = 'none';
    editProfileBtn.style.display = '';
    showToast('Profile updated.', 'success');
  } catch (err) {
    editError.textContent = err.message ?? 'Failed to save.';
  } finally {
    saveProfileBtn.textContent = 'Save';
    saveProfileBtn.disabled = false;
  }
});

loadProfile();