import { auth } from './firebase.mjs';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';

// Google Auth provider
const provider = new GoogleAuthProvider();

// Login with email and password
export function loginWithEmail(email, password) {
    return signInWithEmailAndPassword(auth, email, password);
}

// Create an account with email and password
export function createAccountWithEmail(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
}

// Login with Google
export function loginWithGoogle() {
    return signInWithPopup(auth, provider);
}

// Get the provider instance
export { provider };
