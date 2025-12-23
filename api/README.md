# King Me Checkers API

Backend API for King Me Checkers game with user authentication, statistics tracking, and leaderboards.

## Features

- **User Authentication**: JWT-based auth with bcrypt password hashing
- **Player Statistics**: Comprehensive tracking of wins, losses, ELO ratings, streaks
- **Leaderboards**: All-time and weekly rankings
- **Game History**: Complete move-by-move recording
- **TimescaleDB Integration**: Optimized time-series data for analytics

## Setup

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Set Up Database

You need a PostgreSQL database with TimescaleDB extension. You can use:
- [Timescale Cloud](https://www.timescale.com/) (recommended)
- Local PostgreSQL + TimescaleDB
- Docker: `docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password timescale/timescaledb:latest-pg15`

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL`: Your TimescaleDB connection string
- `JWT_SECRET`: A strong random secret (use `openssl rand -base64 32`)
- `CORS_ORIGIN`: Your frontend URLs (comma-separated)

### 4. Run Database Migrations

```bash
# From the root of the project
psql $DATABASE_URL < database/schema.sql
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:3001`

## API Endpoints

### Authentication

#### Register
```http
POST /api/auth/register
Content-Type: application/json

{
  "username": "player1",
  "email": "player1@example.com",
  "password": "securepass123",
  "display_name": "Player One"
}
```

#### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "player1",
  "password": "securepass123"
}
```

#### Get Profile
```http
GET /api/auth/me
Authorization: Bearer {token}
```

### Statistics

#### Get My Stats
```http
GET /api/stats/me
Authorization: Bearer {token}
```

#### Get User Stats
```http
GET /api/stats/{userId}
```

#### Get Rating History
```http
GET /api/stats/history/me?days=30
Authorization: Bearer {token}
```

### Leaderboards

#### All-Time Leaderboard
```http
GET /api/leaderboard/alltime?limit=100&offset=0
```

#### Weekly Leaderboard
```http
GET /api/leaderboard/weekly?limit=100&offset=0
```

### Games

#### Create Game
```http
POST /api/games
Authorization: Bearer {token}
Content-Type: application/json

{
  "room_code": "ABC-123",
  "game_mode": "online",
  "red_player_id": "uuid",
  "black_player_id": "uuid"
}
```

#### Complete Game
```http
PATCH /api/games/{gameId}/complete
Authorization: Bearer {token}
Content-Type: application/json

{
  "winner_id": "uuid",
  "total_moves": 45,
  "duration_seconds": 1200
}
```

#### Get Game History
```http
GET /api/games/my-history?limit=20&offset=0
Authorization: Bearer {token}
```

#### Record Move
```http
POST /api/games/{gameId}/moves
Authorization: Bearer {token}
Content-Type: application/json

{
  "move_number": 1,
  "player_color": "red",
  "from_row": 2,
  "from_col": 1,
  "to_row": 3,
  "to_col": 0,
  "captured_pieces": [],
  "is_promotion": false
}
```

## Deployment

### Production Build

```bash
npm run build
npm start
```

### Deploy to Vercel/Railway/Render

1. Set environment variables in your hosting platform
2. Ensure your database is accessible from the hosting platform
3. Deploy!

## Database Schema

See `/database/schema.sql` for the complete schema including:
- `users`: User accounts
- `games`: Game records (hypertable)
- `game_moves`: Move-by-move history (hypertable)
- `player_stats`: Aggregated player statistics
- `player_stats_history`: Historical rating data (hypertable)
- `friendships`: Social connections
- Leaderboard views and automatic stat update triggers
