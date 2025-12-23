@echo off
echo ============================================
echo Checkers Game - Windows Setup Script
echo ============================================
echo.

REM Get PostgreSQL password
set /p PGPASSWORD="Enter your PostgreSQL password: "
echo.

echo Step 1: Creating database and enabling TimescaleDB...
psql -U postgres -h localhost -c "CREATE DATABASE checkers_game;"
psql -U postgres -h localhost -d checkers_game -c "CREATE EXTENSION IF NOT EXISTS timescaledb;"
echo Database created!
echo.

echo Step 2: Running schema setup...
psql -U postgres -h localhost -d checkers_game -f database\schema.sql
echo Schema created!
echo.

echo Step 3: Creating backend .env file...
cd api
(
echo DATABASE_URL=postgresql://postgres:%PGPASSWORD%@localhost:5432/checkers_game
echo JWT_SECRET=my-super-secret-jwt-key-xyz789
echo PORT=3001
) > .env
echo Backend configured!
cd ..
echo.

echo ============================================
echo Setup Complete!
echo ============================================
echo.
echo Now you can run:
echo   1. cd api ^&^& npm install ^&^& npm run dev
echo   2. npm run partykit:dev
echo   3. npm run dev
echo.
pause
