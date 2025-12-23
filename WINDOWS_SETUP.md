# Windows Setup Guide for Checkers Game

## Prerequisites Installed
- ✅ PostgreSQL
- ✅ TimescaleDB (zip file downloaded)

## Quick Setup (Automated)

1. **Run the setup script:**
```bash
setup-windows.bat
```

Enter your PostgreSQL password when prompted. This will:
- Create the database
- Enable TimescaleDB
- Run the schema
- Configure the backend

## Manual Setup (If Automated Fails)

### Step 1: Install TimescaleDB Extension

1. **Extract TimescaleDB zip** to a temporary folder

2. **Copy files to PostgreSQL:**
   - Find PostgreSQL install: `C:\Program Files\PostgreSQL\[your-version]\`
   - Copy `*.dll` files → `lib\` folder
   - Copy `*.sql` and `*.control` files → `share\extension\` folder

3. **Edit PostgreSQL config:**
   - Open: `C:\Program Files\PostgreSQL\[version]\data\postgresql.conf`
   - Find: `shared_preload_libraries`
   - Change to: `shared_preload_libraries = 'timescaledb'`

4. **Restart PostgreSQL:**
```bash
# In Command Prompt (Run as Administrator):
net stop postgresql-x64-[version]
net start postgresql-x64-[version]
```

### Step 2: Create Database

Open Command Prompt and run:

```bash
# Connect to PostgreSQL
psql -U postgres -h localhost

# In psql, run these commands:
CREATE DATABASE checkers_game;
\c checkers_game
CREATE EXTENSION IF NOT EXISTS timescaledb;

# Copy and paste the entire contents of database\schema.sql
# Then:
\q
```

### Step 3: Configure Backend

Create `api\.env` file with:

```env
DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/checkers_game
JWT_SECRET=my-super-secret-jwt-key-xyz789
PORT=3001
```

Replace `YOUR_PASSWORD` with your PostgreSQL password.

### Step 4: Start Services

Open **3 separate Command Prompt windows**:

**Window 1 - Backend:**
```bash
cd api
npm install
npm run dev
```

**Window 2 - PartyKit:**
```bash
npm run partykit:dev
```

**Window 3 - Frontend:**
```bash
npm run dev
```

### Step 5: Test

1. Open http://localhost:5173
2. Register an account
3. Play an online game
4. Check stats!

## Troubleshooting

### PostgreSQL won't start
```bash
# Check if it's running:
sc query postgresql-x64-15

# Check logs at:
C:\Program Files\PostgreSQL\[version]\data\pg_log\
```

### Can't connect to database
```bash
# Test connection:
psql -U postgres -h localhost -d checkers_game

# If connection refused, check:
# - PostgreSQL is running
# - Port 5432 is not blocked
# - Password is correct
```

### TimescaleDB not loading
```bash
# Verify extension installed:
psql -U postgres -h localhost -d checkers_game -c "SELECT * FROM pg_extension WHERE extname='timescaledb';"

# If empty, TimescaleDB files weren't copied correctly
```

### Backend won't start
```bash
# Check .env file exists:
type api\.env

# Check for port conflicts:
netstat -ano | findstr :3001

# Check database connection:
psql -U postgres -h localhost -d checkers_game
```

## What Runs Where

- **Backend API**: http://localhost:3001
- **Frontend**: http://localhost:5173
- **PartyKit**: ws://localhost:1999
- **PostgreSQL**: localhost:5432

## Database Connection String Format

```
postgresql://USERNAME:PASSWORD@HOST:PORT/DATABASE
```

Example:
```
postgresql://postgres:mypassword@localhost:5432/checkers_game
```
