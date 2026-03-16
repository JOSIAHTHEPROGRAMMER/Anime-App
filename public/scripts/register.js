import { Auth } from './api.js';
import { guardAuthPage } from './auth.js';

guardAuthPage();

const usernameEl    = document.getElementById('username');
const emailEl       = document.getElementById('email');
const passwordEl    = document.getElementById('password');
const confirmEl     = document.getElementById('confirmPassword');
const usernameError = document.getElementById('usernameError');
const emailError    = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const confirmError  = document.getElementById('confirmError');
const globalError   = document.getElementById('globalError');
const registerBtn   = document.getElementById('registerBtn');

function clearErrors() {
  [usernameError, emailError, passwordError, confirmError, globalError]
    .forEach(el => { el.textContent = ''; });
}

function validate() {
  let ok = true;
  if (!usernameEl.value.trim()) {
    usernameError.textContent = 'Username is required.';
    ok = false;
  }
  if (!emailEl.value.trim()) {
    emailError.textContent = 'Email is required.';
    ok = false;
  }
  if (passwordEl.value.length < 6) {
    passwordError.textContent = 'Password must be at least 6 characters.';
    ok = false;
  }
  if (passwordEl.value !== confirmEl.value) {
    confirmError.textContent = 'Passwords do not match.';
    ok = false;
  }
  return ok;
}

registerBtn?.addEventListener('click', async () => {
  clearErrors();
  if (!validate()) return;

  registerBtn.textContent = 'Creating account…';
  registerBtn.disabled    = true;

  try {
    const res = await Auth.register({
      username: usernameEl.value.trim(),
      email:    emailEl.value.trim(),
      password: passwordEl.value,
    });
    // Auto-login after register
    if (res?.token) {
      localStorage.setItem('wgw_token', res.token);
      localStorage.setItem('wgw_user',  JSON.stringify(res.user));
    }
    window.location.href = '../index.html';
  } catch (err) {
    globalError.textContent  = err.message ?? 'Registration failed. Please try again.';
    registerBtn.textContent  = 'Create account';
    registerBtn.disabled     = false;
  }
});

[usernameEl, emailEl, passwordEl, confirmEl].forEach(el => {
  el?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') registerBtn.click();
  });
});
