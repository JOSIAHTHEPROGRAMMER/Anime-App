# WGWAnime

[**WGWAnime**](https://anime-app-d4be4.web.app/) is a web application built using HTML AND javascript with firebase and [Jikan API](https://jikan.moe/) that helps users explore, track, and discover anime across seasons, genres, and formats. 
>NOTE: The app is incomplete and due to updates in Firebase and Jikan api, the site is no longer fully functional, so the code will need to be altered locally.

---

## Features

### Homepage 
- Shows currently airing anime.
- Displays anime from the same season last year.
- Highlights upcoming anime for the current season.

###  Anime Detail Page
- Displays anime synopsis, image, and trailer.
- Users can save anime to their personal list (work in progress but functional).

###  Navigation & Pages
- **Search Bar**: Search anime by title.
- **Saved Anime List Page**: View anime you've saved.
- **Genre Page**: Browse anime by genres.
- **Types Dropdown**: Hover to explore different types (TV, OVA, Movie, etc.).

###  Additional Highlights
-  Save your favorite anime with firbase
-  Hosted on Firebase
-  Beautiful toast notifications with `toastify-js`

---
## Installation

```bash
git clone https://github.com/JOSIAHTHEPROGRAMMER/Anime-App
cd Anime-App
npm install
```

---
## Firebase Integration

The app uses Firebase to store saved anime data and user preferences. Here's how Firebase is integrated:

### Firebase Features Used:
- **Firebase Hosting** – for deploying the app.
- **Firebase Firestore** – to save users' favorite anime.
- **Firebase Authentication** – Google and Username/password authentication.

### Setup Firebase Locally:
1. Create a Firebase project in [Firebase Console](https://console.firebase.google.com/).
2. Enable Firestore in the Firebase project.
3. Set up Firebase Authentication for user logins.
4. Get your Firebase config from Project Settings > Web SDK snippet.
5. Replace the config in `firebase-config.js`:

```js
// src/firebase-config.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```

## Deploy to Firebase

You can deploy the **WGWAnime** frontend using **Firebase Hosting**. Here's how:

---

### Step 1: Install Firebase CLI

```bash
npm install -g firebase-tools
```

## Step 2: Login to Firebase
```bash
firebase login
```

## Step 3: Initialize Firebase in the Project
```bash
firebase init
```

## Step 4: Deploy App
```bash
firebase deploy
```





