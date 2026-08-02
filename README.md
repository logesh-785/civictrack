# Crowdsourced Civic Issue Reporting and Resolution System

A full-stack web app that lets citizens report civic issues (potholes, broken
streetlights, garbage, water leaks, etc.) with photo + location proof, track
their status, and upvote existing reports — while municipal admins manage,
assign, and resolve everything from a dashboard.

**Tech stack:** HTML, CSS, JavaScript (frontend) · Node.js + Express (backend) · MySQL (database)

---

## ✨ Features

- **Citizen Login / Register** — secure signup & login (bcrypt-hashed passwords, JWT sessions)
- **Report an Issue** — title, category, description, location (with "use my location"), photo upload
- **User Dashboard** — track your own reports' status, browse & upvote nearby issues, search/filter
- **Admin Dashboard** — overview stats, category breakdown, full issue table with status updates & delete, registered-citizens list
- **Admin Login** — separate console login, **username: `admin` / password: `admin`** (change this before going live — see below)
- **Civic Assist Chatbot** — floating chat widget (bottom-right corner) on every page, answers common questions about reporting, tracking, and upvoting
- Fully responsive layout (mobile sidebar, adaptive grids)

---

## 📁 Project Structure

```
civic-app/
├── backend/
│   ├── server.js              # Express app entry point
│   ├── config/db.js           # MySQL connection pool
│   ├── middleware/auth.js     # JWT auth guards
│   ├── routes/
│   │   ├── auth.js            # register / login / admin-login
│   │   ├── issues.js          # report / list / upvote / stats
│   │   ├── admin.js           # status updates, users, delete
│   │   └── chatbot.js         # rule-based assistant
│   ├── database/schema.sql    # MySQL schema
│   ├── uploads/                # uploaded issue photos (created at runtime)
│   ├── .env                   # local environment config (already filled in)
│   ├── .env.example           # template for a fresh server
│   └── package.json
└── frontend/
    ├── index.html              # citizen login (default page)
    ├── register.html
    ├── admin-login.html
    ├── report.html              # report an issue (citizen only)
    ├── dashboard.html           # citizen dashboard
    ├── admin-dashboard.html     # admin console
    ├── css/style.css
    └── js/ (api.js, chatbot.js)
```

The backend also serves the frontend as static files, so **one running
server gives you the whole site** — no separate frontend server needed.

---

## 🚀 Run it locally

### 1. Prerequisites
- [Node.js](https://nodejs.org) v18+
- [MySQL](https://dev.mysql.com/downloads/) 8.x running locally (or any reachable MySQL server)

### 2. Create the database
```bash
mysql -u root -p < backend/database/schema.sql
```
This creates the `civic_issues` database and its 4 tables (`users`, `issues`,
`status_updates`, `upvotes`). No dummy/sample data is inserted — you get a
clean slate.

Create a MySQL user for the app (or just use `root` in `.env`):
```sql
CREATE USER 'civic_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON civic_issues.* TO 'civic_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configure environment
```bash
cd backend
cp .env.example .env
# edit .env with your DB credentials
```
`.env` already includes:
```
ADMIN_USERNAME=admin
ADMIN_PASSWORD=admin
```
This is the login for the **Admin Dashboard** (separate from citizen
accounts, not stored in the database). **Change these before deploying
publicly.**

### 4. Install & run
```bash
npm install
npm start
```
The server starts on `http://localhost:5000` (or whatever `PORT` you set)
and serves the entire site — login, register, report, dashboards, and API —
from that one address.

### 5. Try it out
| Page | URL |
|---|---|
| Citizen login | `http://localhost:5000/` |
| Register | `http://localhost:5000/register.html` |
| Report an issue | `http://localhost:5000/report.html` |
| My dashboard | `http://localhost:5000/dashboard.html` |
| Admin login | `http://localhost:5000/admin-login.html` |
| Admin dashboard | `http://localhost:5000/admin-dashboard.html` |

Register a citizen account, report an issue with a photo, then log into the
Admin console (`admin` / `admin`) to see it appear, assign a status, and
watch the citizen dashboard reflect the change.

---

## ☁️ Deploying it for real

This app is a standard Node + MySQL project, so it deploys anywhere that
runs both:

- **All-in-one servers/VPS** (recommended for a college project): a small
  Ubuntu VPS (DigitalOcean, AWS EC2, etc.) — install Node + MySQL, clone the
  project, set `.env`, run with `pm2 start server.js` behind Nginx.
- **Platforms with a managed MySQL add-on**: Railway, Render, or similar —
  push the `backend/` folder as the service, point `DB_HOST`/`DB_USER`/etc.
  at the managed MySQL instance, and it serves the frontend automatically
  since it's static files inside the same app.
- Keep uploaded photos in mind: on most hosting platforms, `backend/uploads`
  is **not persistent** across deploys/restarts. For production use, swap
  local disk storage in `routes/issues.js` for a cloud bucket (S3, Cloudinary,
  etc.) — the rest of the app doesn't need to change.

Before going live:
1. Change `JWT_SECRET`, `ADMIN_USERNAME`, and `ADMIN_PASSWORD` in `.env`.
2. Serve over HTTPS (most platforms handle this for you).
3. Consider adding rate-limiting on `/api/auth/*` for extra security.

---

## 🤖 About the chatbot

The "Civic Assist" widget in the bottom-right corner is a lightweight,
keyword-based assistant (`backend/routes/chatbot.js`) — it needs **no API
key** and works fully offline, which keeps the project simple to run and
demo. It answers common questions (how to report, track status, upvote,
categories, login/register) and even pulls a live count of issues from the
database. If you'd like to upgrade it to a full LLM-powered bot later, you
can swap `findReply()` for a call to any AI provider's API using the same
`/api/chatbot` endpoint — the frontend widget won't need to change.

---

## 🗄️ Database schema (summary)

- **users** — citizen accounts (`user_id`, `name`, `email`, `phone`, `password_hash`, `created_at`)
- **issues** — reported issues (`issue_id`, `user_id`, `title`, `category`, `description`, `photo_url`, `location`, `latitude`, `longitude`, `status`, `upvote_count`, timestamps)
- **status_updates** — full audit trail of every status change per issue
- **upvotes** — one row per citizen-upvote, unique per (issue, user)

See `backend/database/schema.sql` for the full DDL.
