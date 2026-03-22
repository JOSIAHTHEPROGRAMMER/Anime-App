<div align="center">

# WGWAnime

[![Live](https://img.shields.io/badge/Live-anime--app--red.vercel.app-CE1126?style=flat-square&logo=vercel&logoColor=white)](https://anime-app-red.vercel.app)
[![Backend](https://img.shields.io/badge/Backend-Anime--App--Server-000000?style=flat-square&logo=github&logoColor=white)](https://github.com/JOSIAHTHEPROGRAMMER/Anime-App-server)

</div>


---

## Overview

WGWAnime is a full-featured anime tracking and discovery platform built with vanilla HTML, CSS and JavaScript. Clean, fast, modular code backed by the Jikan API and a custom Fastify backend.

---

![Image](https://github.com/user-attachments/assets/53597f24-8044-4b95-81c6-12715cbbfacc)


## Features

```
Discover          Browse currently airing, upcoming, and seasonal anime
Spotlight Hero    Cinematic hero section cycling top airing anime with trailer previews
Watchlist         Track anime with status, episode progress, and live updates
Reviews           Rate and review anime, like other users' reviews
Recommendations   AI-powered suggestions based on your watchlist via Groq
Genres            Visual genre cards with anime backgrounds
Social            Follow users, view activity feeds, discover new people
Auth              JWT-based login and registration - no Firebase
```

---

## Tech Stack

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![Vercel](https://img.shields.io/badge/Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)

---

## Project Structure

```
public/
├── index.html
├── styles/
│   └── main.css
├── scripts/
│   ├── api.js              - all fetch calls (Jikan + backend)
│   ├── auth.js             - JWT state management
│   ├── ui.js               - shared render helpers
│   ├── home.js             - homepage logic + hero spotlight
│   ├── search.js           - navbar search
│   ├── browse.js           - search results + filters
│   ├── anime.js            - detail page
│   ├── genres.js           - genres grid
│   ├── saved.js            - watchlist page
│   ├── profile.js          - user profile
│   ├── social.js           - activity feed + follow
│   ├── login.js
│   └── register.js
└── pages/
    ├── anime.html
    ├── browse.html
    ├── genres.html
    ├── saved.html
    ├── profile.html
    ├── social.html
    ├── login.html
    └── register.html
```

---

## Getting Started

```bash
git clone https://github.com/JOSIAHTHEPROGRAMMER/Anime-App
cd Anime-App
```

Open `public/index.html` in your browser or serve with any static server:

```bash
npx serve public
```

Point the API base URL in `public/scripts/api.js` to your backend:

```js
const API_BASE = window.__WGW_API__ ?? "http://localhost:3000/api";
```

---

## Environment

The frontend is purely static - no build step, no environment variables needed. Set `window.__WGW_API__` in a `<script>` tag before your module scripts to point to your deployed backend.

---

## Deployment

Deploy the `public/` folder to Vercel as a static site.

```bash
vercel --prod
```

---

## Related

- [WGWAnime Backend](https://github.com/JOSIAHTHEPROGRAMMER/Anime-App-server) - Fastify + MongoDB + Groq API
