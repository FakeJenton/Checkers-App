# King Me Checkers - Complete Setup Guide

## 🎯 What We've Built

Your checkers game now has a **complete backend system** with:

✅ **User Accounts** - Register, login, JWT authentication
✅ **Player Statistics** - Wins, losses, ELO ratings, streaks
✅ **Leaderboards** - All-time and weekly rankings
✅ **Game History** - Every move recorded for replay
✅ **TimescaleDB Integration** - Optimized for analytics

## 📋 Prerequisites

Before you start, you need:
- **TimescaleDB database** (see options below)
- **Node.js 18+** installed
- **Git** repository access

## 🗄️ Step 1: Set Up TimescaleDB

### Option A: Timescale Cloud (Recommended - Free Tier Available)

1. Go to https://www.timescale.com/
2. Sign up for free account
3. Create a new database
4. Copy your connection string (looks like: `postgresql://user:pass@host:port/dbname`)

### Option B: Local Docker

```bash
docker run -d \
  --name timescaledb \
  -p 5432:5432 \
  -e POSTGRES_PASSWORD=yourpassword \
  timescale/timescaledb:latest-pg15
```

Connection string: `postgresql://postgres:yourpassword@localhost:5432/postgres`

### Option C: Existing PostgreSQL + TimescaleDB Extension

If you have PostgreSQL, add TimescaleDB:
```sql
CREATE EXTENSION IF NOT EXISTS timescaledb;
```

## 🛠️ Step 2: Initialize Database

Run the schema migration:

```bash
# Replace $DATABASE_URL with your actual connection string
psql postgresql://user:pass@host:port/dbname < database/schema.sql
```

This creates all tables, indexes, views, and triggers automatically!

## 🚀 Step 3: Set Up Backend API

### Install Dependencies

```bash
cd api
npm install
```

### Configure Environment

```bash
cp .env.example .env
```

Edit `api/.env`:

```env
# Your TimescaleDB connection string from Step 1
DATABASE_URL=postgresql://user:pass@host:port/dbname

# Generate this: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this

# How long tokens last
JWT_EXPIRES_IN=7d

# API server port
PORT=3001

# Your frontend URLs (comma-separated)
CORS_ORIGIN=http://localhost:5173,https://your-app.vercel.app
```

### Start API Server

```bash
npm run dev
```

You should see:
```
🚀 King Me API server running on port 3001
📊 Environment: development
🔗 Health check: http://localhost:3001/health
```

Test it: `curl http://localhost:3001/health`

## 📱 Step 4: Integrate Frontend (Next Steps)

We need to:

1. **Add auth UI** (login/register screens)
2. **Connect PartyKit** to record games
3. **Show stats & leaderboards** in the app

Would you like me to implement these now?

## 🧪 Testing the API

### Register a User

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testplayer",
    "email": "test@example.com",
    "password": "password123",
    "display_name": "Test Player"
  }'
```

### Login

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testplayer",
    "password": "password123"
  }'
```

Save the `token` from the response!

### Get Your Stats

```bash
curl http://localhost:3001/api/stats/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### View Leaderboard

```bash
curl http://localhost:3001/api/leaderboard/alltime
```

## 📊 Database Tables Created

- **users** - User accounts with credentials
- **player_stats** - Aggregated player statistics
- **player_stats_history** - Historical ELO ratings (hypertable)
- **games** - Game records (hypertable)
- **game_moves** - Move-by-move history (hypertable)
- **friendships** - Social connections
- **leaderboard_alltime** - All-time rankings (view)
- **leaderboard_weekly** - Weekly rankings (view)

## 🔐 Security Features

- ✅ Passwords hashed with bcrypt (10 rounds)
- ✅ JWT tokens with expiration
- ✅ SQL injection prevention (parameterized queries)
- ✅ Input validation with Zod
- ✅ CORS protection

## 📈 What's Next?

Ready to connect this to your game? I can help you:

1. **Add Login/Register screens** to the frontend
2. **Update PartyKit** to save games to the database
3. **Create Stats Dashboard** showing player performance
4. **Build Leaderboard Page** with rankings
5. **Add Profile Pages** with game history

Let me know what you want to tackle first!
