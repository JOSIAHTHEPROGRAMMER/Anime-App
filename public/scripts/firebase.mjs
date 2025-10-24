import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js';
import { getAuth } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js';
import { getStorage } from 'https://www.gstatic.com/firebasejs/10.13.0/firebase-storage.js';


let app, auth, db, storage;

async function initFirebase() {
  const response = await fetch('./firebase-config.json');
  
  
  const firebaseConfig = await response.json();
 
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);


}

initFirebase();

export { auth, db, storage };
