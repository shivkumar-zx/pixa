# 🚀 React Production Build & SQLite Database Package

This folder contains the production build for the **React (Vite)** frontend along with the **SQLite Database** files.

---

## 📁 Package Contents

### 1. `1_FRONTEND_REACT_BUILD/`
Contains the static production bundle built with Vite (`index.html`, `assets/` CSS and JS).
- Ready to be served by any static Web Server (e.g. NGINX, Apache, Vercel, Netlify, or Hostinger `public_html`).

### 2. `2_DATABASE_SQLITE/`
Contains the database files:
- `dev.db`: Pre-populated SQLite database.
- `schema.prisma`: Prisma ORM schema defining models (`User`, `File`, `Category`, `Favorite`, etc.).

---

## ⚙️ How to Deploy / Run

### Serving Frontend
1. Upload the contents of `1_FRONTEND_REACT_BUILD/` to your web server host or static file hosting.
2. Ensure routing redirects single-page application requests (`/*`) to `index.html`.

### Using the Database
1. Place `dev.db` in your backend server or Prisma path.
2. Point your server's `DATABASE_URL` environment variable to the database location (e.g., `DATABASE_URL="file:./dev.db"`).
