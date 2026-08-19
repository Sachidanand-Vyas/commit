# Commit

**Commit to yourself.**

A simple, personal habit accountability application inspired by the GitHub contribution graph.

## Quick Start

### Backend

```bash
cd commit/backend
pip install -r requirements.txt
python app.py
```

The backend runs on http://localhost:5000

### Frontend

```bash
cd commit/frontend
npm install
npm run dev
```

The frontend runs on http://localhost:5173

## Tech Stack

- **Frontend:** React, Vite, Tailwind CSS
- **Backend:** Python, Flask, SQLAlchemy
- **Database:** SQLite (dev) / PostgreSQL (production)

## Features

- **BUILD habits** - things you want to do more of
- **KILL habits** - things you want to stop doing
- **Contribution graph** - GitHub-style visual progress
- **Daily check-in** - quick habit completion tracking
- **Streaks** - current and best streak tracking
- **Monthly review** - consistency stats and comparisons
- **Multi-user** - each user has their own independent data

## Project Structure

```
commit/
├── frontend/          # React + Vite
│   ├── src/
│   │   ├── api/       # API client
│   │   ├── components/
│   │   ├── pages/     # Dashboard, Contributions, Habits, Review
│   │   └── App.jsx
│   └── package.json
├── backend/           # Flask + SQLAlchemy
│   ├── app.py         # Main application
│   ├── models.py      # Database models
│   ├── auth.py        # Authentication routes
│   ├── habits.py      # Habit CRUD routes
│   ├── stats.py       # Statistics routes
│   └── requirements.txt
└── README.md
```

## Environment Variables

Copy `.env.example` to `.env` in the backend directory and configure:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET_KEY` - Secret for JWT tokens
- `FLASK_ENV` - development or production
