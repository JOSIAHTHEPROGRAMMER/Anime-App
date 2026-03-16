import { Auth } from './api.js';

// Update navbar DOM to reflect logged-in/out state
function applyAuthState(user) {
  document.body.dataset.auth = user ? 'true' : 'false';

  if (user) {
    const avatar = document.getElementById('userAvatar');
    const name = document.getElementById('userDisplayName');
    if (avatar) avatar.src = user.avatarUrl ?? `https://api.dicebear.com/8.x/thumbs/svg?seed=${user.username}`;
    if (name) name.textContent = user.username;
  }
}

// Verify token on every page load
async function init() {
  if (!Auth.isLoggedIn()) {
    applyAuthState(null);
    return;
  }
  const user = await Auth.refresh();
  applyAuthState(user);
}

// Logout button lives in the shared navbar
document.getElementById('logoutBtn')?.addEventListener('click', () => {
  Auth.logout();
  applyAuthState(null);
  window.location.href = '/public/index.html';
});

// Use on login/register pages - bounce logged-in users away
function guardAuthPage() {
  if (Auth.isLoggedIn()) {
    window.location.href = '/public/index.html';
  }
}

// Use on protected pages - bounce logged-out users to login
function requireAuth() {
  if (!Auth.isLoggedIn()) {
    window.location.href = '/public/pages/login.html';
  }
}

export { init, applyAuthState, guardAuthPage, requireAuth };

init();
