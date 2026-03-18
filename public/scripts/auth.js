import { Auth } from './api.js';

export const DEFAULT_PFP = '/assets/default-pfp-24.jpg';

// Determine whether the current page is at the site root or inside /pages/
function isRoot() {
  const p = window.location.pathname;
  return p.endsWith('index.html') || p.endsWith('/');
}

// Apply auth state to every element that reflects the logged-in user.
// This covers both the desktop navbar and the mobile drawer.
function applyAuthState(user) {
  document.body.dataset.auth = user ? 'true' : 'false';

  if (user) {
    const profileHref = isRoot() ? './pages/profile.html' : './profile.html';

    // Desktop navbar
    const avatar = document.getElementById('userAvatar');
    const name = document.getElementById('userDisplayName');
    const profileLink = document.getElementById('profileLink');

    if (avatar) avatar.src = user.avatarUrl || DEFAULT_PFP;
    if (name) name.textContent = user.username;
    if (profileLink) profileLink.href = profileHref;

    // Mobile drawer - same elements with "Mobile" suffix
    const avatarM = document.getElementById('userAvatarMobile');
    const nameM = document.getElementById('userDisplayNameMobile');
    const profileLinkM = document.getElementById('profileLinkMobile');

    if (avatarM) avatarM.src = user.avatarUrl || DEFAULT_PFP;
    if (nameM) nameM.textContent = user.username;
    if (profileLinkM) profileLinkM.href = profileHref;
  }
}

// Verify the stored JWT on every page load and sync the UI
async function init() {
  if (!Auth.isLoggedIn()) {
    applyAuthState(null);
    return;
  }
  const user = await Auth.refresh();
  applyAuthState(user);
}

// Shared logout handler used by both the desktop and mobile buttons
function handleLogout() {
  Auth.logout();
  applyAuthState(null);
  window.location.href = '/public/index.html';
}

document.getElementById('logoutBtn')?.addEventListener('click', handleLogout);

// Mobile drawer logout button
document.getElementById('logoutBtnMobile')?.addEventListener('click', handleLogout);

// Redirect already-logged-in users away from auth pages
function guardAuthPage() {
  if (Auth.isLoggedIn()) {
    window.location.href = '/public/index.html';
  }
}

// Redirect guests away from pages that require a login
function requireAuth() {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/public/pages/login.html';
  }
}

export { init, applyAuthState, guardAuthPage, requireAuth };

init();