import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js';

//Web app's Firebase configuration
const firebaseConfig = {
  apiKey: 'AIzaSyBGuwlT4aMySgkOFj29HdoYcSW5lzPJf0g',
  authDomain: 'anime-app-d4be4.firebaseapp.com',
  databaseURL: 'https://anime-app-d4be4-default-rtdb.firebaseio.com',
  projectId: 'anime-app-d4be4',
  storageBucket: 'anime-app-d4be4.appspot.com',
  messagingSenderId: '778434549510',
  appId: '1:778434549510:web:7c624ebf51b8eadfd03087',
};


// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Expose Firebase services to other scripts
export { auth, db, storage };
