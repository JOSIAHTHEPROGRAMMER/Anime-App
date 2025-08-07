import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js';


let app, auth, db, storage;

async function initFirebase() {
  const response = await fetch('./firebase-config.json');
  
  
  const firebaseConfig = await response.json();
 // console.log(firebaseConfig)
  // Initialize Firebase
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);

  // Optional: export or use here
  console.log('Firebase initialized');
}

initFirebase();

export { auth, db, storage };
