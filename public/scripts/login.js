import { Auth } from './api.js';
import { guardAuthPage } from './auth.js';

guardAuthPage();

const emailEl       = document.getElementById('email');
const passwordEl    = document.getElementById('password');
const emailError    = document.getElementById('emailError');
const passwordError = document.getElementById('passwordError');
const globalError   = document.getElementById('globalError');
const loginBtn      = document.getElementById('loginBtn');

function clearErrors() {
  emailError.textContent    = '';
  passwordError.textContent = '';
  globalError.textContent   = '';
}

function validate() {
  let ok = true;
  if (!emailEl.value.trim()) {
    emailError.textContent = 'Email is required.';
    ok = false;
  }
  if (!passwordEl.value) {
    passwordError.textContent = 'Password is required.';
    ok = false;
  }
  return ok;
}

loginBtn?.addEventListener('click', async () => {
  clearErrors();
  if (!validate()) return;

  loginBtn.textContent = 'Logging in…';
  loginBtn.disabled    = true;

  try {
    await Auth.login({ email: emailEl.value.trim(), password: passwordEl.value });
    window.location.href = '../index.html';
  } catch (err) {
    globalError.textContent = err.message ?? 'Login failed. Please try again.';
    loginBtn.textContent    = 'Log in';
    loginBtn.disabled       = false;
  }
});

// Allow enter key to submit
[emailEl, passwordEl].forEach(el => {
  el?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') loginBtn.click();
  });
});
