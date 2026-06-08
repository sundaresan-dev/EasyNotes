# EasyNotes

A modern, responsive notes application with dark/light theme support and two deployment modes.

![Node.js](https://img.shields.io/badge/Node.js-20-green)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

## Features

- ✏️ **Create, Edit, Delete** notes
- 🔍 **Search** notes instantly
- 🌗 **Dark / Light theme** with persistence
- 🎨 **Color-coded** notes
- 📱 **Responsive** design (mobile, tablet, desktop)
- 🗄️ **Dual storage**: SQLite (standalone) or MySQL (compose)
- 🐳 **Docker-ready** with two deployment modes

## Project Structure

```
EasyNotes/
├── backend/
│   ├── server.js            # Express REST API server
│   ├── package.json         # Backend dependencies
│   ├── init.sql             # MySQL initialization script
│   └── storage/
│       ├── sqlite.js        # SQLite storage adapter
│       └── mysql.js         # MySQL storage adapter
├── frontend/
│   ├── index.html           # Main UI
│   ├── style.css            # Dual-theme styles
│   └── app.js               # Client-side logic
├── Dockerfile               # Mode 1: Standalone (SQLite)
├── Dockerfile.compose       # Mode 2: Docker Compose (MySQL)
├── docker-compose.yml       # Multi-container setup
├── .dockerignore
├── .gitignore
└── README.md
```

## Quick Start

### Mode 1: Dockerfile Only (SQLite)

Single container with local SQLite storage. Notes persist via mounted volume.

```bash
# Build
docker build -t easynotes .

# Run
docker run -d -p 4567:4567 -v notes_data:/app/data --name easynotes easynotes
```

Open: **http://localhost:4567**

### Mode 2: Docker Compose (MySQL)

Multi-container setup with MySQL for production-grade storage.

```bash
# Start all services
docker compose up -d

# View logs
docker compose logs -f

# Stop
docker compose down
```

Open: **http://localhost:4567**

## API Endpoints

| Method | Endpoint           | Description       |
|--------|--------------------|--------------------|
| GET    | `/api/notes`       | List all notes     |
| GET    | `/api/notes?search=query` | Search notes |
| GET    | `/api/notes/:id`   | Get single note    |
| POST   | `/api/notes`       | Create a note      |
| PUT    | `/api/notes/:id`   | Update a note      |
| DELETE | `/api/notes/:id`   | Delete a note      |
| GET    | `/api/health`      | Health check       |

## Environment Variables

| Variable         | Default         | Description              |
|------------------|-----------------|--------------------------|
| `PORT`           | `4567`          | Server port              |
| `DB_TYPE`        | `sqlite`        | Storage: `sqlite`/`mysql`|
| `DB_DIR`         | `./data`        | SQLite database directory|
| `MYSQL_HOST`     | `mysql`         | MySQL hostname           |
| `MYSQL_PORT`     | `3306`          | MySQL port               |
| `MYSQL_USER`     | `easynotes`     | MySQL username           |
| `MYSQL_PASSWORD` | `easynotes_secret` | MySQL password        |
| `MYSQL_DATABASE` | `easynotes_db`  | MySQL database name      |

## Local Development

```bash
cd backend
npm install
node server.js
```

Open: **http://localhost:8080**

## Tech Stack

- **Backend**: Node.js, Express
- **Frontend**: Vanilla HTML, CSS, JavaScript
- **Database**: SQLite (better-sqlite3) / MySQL (mysql2)
- **Containerization**: Docker, Docker Compose
