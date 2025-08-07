import { GoogleAuthProvider, signInWithPopup } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { signOut } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { ref, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { auth, db, storage } from './firebase.mjs';
import { loginWithEmail, createAccountWithEmail } from './auth.mjs';

// Function to show toast notifications
function showToast(message, type = 'info') {
    Toastify({
        text: message,
        duration: 3000,
        close: true,
        gravity: "top",
        position: "right",
        stopOnFocus: true,
        style: {
            background: type === 'success' ? "linear-gradient(to right, #00b09b, #96c93d)" : "linear-gradient(to right, #ff5f6d, #ffc371)",
        },
    }).showToast();
}

// Auth state change listener
auth.onAuthStateChanged(async user => {
  if (user) {
    console.log('User logged in:', user);
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    updateUIWithUser(user, userDoc.exists() ? userDoc.data() : {});

 
   
  } else {
    console.log('No user logged in');
    userProfileContainer.style.display = 'none';
    loginToggleBtn.style.display = 'block';
  }
});

// Select elements
const loginToggleBtn = document.getElementById('login-toggle-btn');
const loginFormContainer = document.getElementById('login-form-container');
const closeBtn = document.querySelector('.login-form-container .close-btn');
const authForm = document.getElementById('auth-form');
const toggleFormLink = document.getElementById('toggle-form');
const googleLoginButton = document.getElementById('google-login-btn');
const userProfileContainer = document.getElementById('user-profile-container');
const userProfilePic = document.getElementById('user-photo');
const userProfileName = document.getElementById('user-name');
const dropdownMenu = document.getElementById('dropdown-menu');
const logoutBtn = document.getElementById('logout-btn');
const signUpImageInput = document.getElementById('user-photo-sign-up');
const loginButton = authForm.querySelector('button[type="submit"]');

// Toggle between login and signup forms
toggleFormLink.addEventListener('click', (e) => {
  e.preventDefault();
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');

  if (loginForm.style.display === 'none') {
    loginForm.style.display = 'block';
    signupForm.style.display = 'none';
    document.getElementById('form-title').textContent = 'Login Form';
    loginButton.textContent = 'Login';
    googleLoginButton.textContent = 'Login with Google';
    toggleFormLink.textContent = 'Sign Up Now';
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'block';
    document.getElementById('form-title').textContent = 'Sign Up Form';
    loginButton.textContent = 'Sign Up';
    googleLoginButton.textContent = 'Sign Up with Google';
    toggleFormLink.textContent = 'Login Now';
  }
});

// Open login form
loginToggleBtn.addEventListener('click', () => {
  loginFormContainer.classList.toggle('show');
});

// Close login form
closeBtn.addEventListener('click', () => {
  loginFormContainer.classList.remove('show');
});

// Handle form submission
authForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const signupUsername = document.getElementById('signup-username').value;
  const signupEmail = document.getElementById('signup-email').value;
  const signupPassword = document.getElementById('signup-password').value;

  try {
    if (signupUsername) {
      // Signup
      const userCredential = await createAccountWithEmail(signupEmail, signupPassword);
     // console.log('User signed up:', userCredential.user);

      let photoURL = null;
      const file = signUpImageInput.files[0];
      if (file) {
        const storageRef = ref(storage, 'profile_pictures/' + file.name);
        await uploadBytes(storageRef, file);
        photoURL = await getDownloadURL(storageRef);
      }

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username: signupUsername,
        email: signupEmail,
        uid: userCredential.user.uid,
        photoURL: photoURL,
      
      });
      
      showToast("User signed up successfully", 'success');
      updateUIWithUser(userCredential.user, { username: signupUsername, photoURL });

      authForm.reset();
    } else {
      // Login
      const userCredential = await loginWithEmail(email, password);
    //  console.log('User logged in:', userCredential.user);

      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      updateUIWithUser(userCredential.user, userDoc.exists() ? userDoc.data() : {});
      showToast("User logged in successfully", 'success');
      authForm.reset();
    }
  } catch (error) {
    console.error('Error during authentication:', error.message);
    showToast(`Error: ${error.message}`, 'error');
  }
});

googleLoginButton.addEventListener('click', async () => {
  const provider = new GoogleAuthProvider();

  try {
    const result = await signInWithPopup(auth, provider);
    const user = result.user;
    console.log('Google user signed in:', user);

    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);

    if (!userDoc.exists()) {
      const photoURL = user.photoURL || "./rylanor3.jpg"; // Default photo URL if none provided by Google

      // Save user data to Firestore
      await setDoc(userDocRef, {
        username: user.displayName || 'User',
        email: user.email,
        uid: user.uid,
        photoURL: photoURL,
     
      });

      console.log('User data saved to Firestore:', {
        username: user.displayName || 'User',
        email: user.email,
        uid: user.uid,
        photoURL: photoURL,
    
      });
    }

    showToast("Google user signed in successfully", 'success');
    updateUIWithUser(user);

  } catch (error) {
    console.error('Error during Google sign-in:', error.message);
    showToast(`Error: ${error.message}`, 'error');
  }
});

// Function to update UI with user information
function updateUIWithUser(user, userData = {}) {
  const userName = userData.username || user.displayName || 'User';
  const userPhoto = userData.photoURL || user.photoURL || "rylanor3.jpg";

  if (userProfilePic) {
    userProfilePic.src = userPhoto;
  }
  if (userProfileName) {
    userProfileName.textContent = userName;
  }

  if (userProfileContainer) {
    userProfileContainer.style.display = 'flex';
  }
  if (loginToggleBtn) {
    loginToggleBtn.style.display = 'none';
  }

  if (loginFormContainer) {
    loginFormContainer.classList.remove('show');
  }
}

// Handle user profile dropdown menu
if (userProfileContainer) {
  userProfileContainer.addEventListener('click', () => {
    dropdownMenu.classList.toggle('show');
  });

  document.addEventListener('click', (event) => {
    if (!userProfileContainer.contains(event.target) && !dropdownMenu.contains(event.target)) {
      dropdownMenu.classList.remove('show');
    }
  });
}

// Handle logout
if (logoutBtn) {
  logoutBtn.addEventListener('click', async () => {
    try {
      await signOut(auth);
      console.log('User logged out');
      userProfileContainer.style.display = 'none';
      loginToggleBtn.style.display = 'block';
      showToast("User logged out successfully", 'success');
    } catch (error) {
      console.error('Error during logout:', error.message);
      showToast(`Error: ${error.message}`, 'error');
    }
  });
}
