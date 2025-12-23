-- Setup script for TimescaleDB
-- Run this after connecting to PostgreSQL

-- Create the database
CREATE DATABASE checkers_game;

-- Connect to the new database
\c checkers_game

-- Enable TimescaleDB extension
CREATE EXTENSION IF NOT EXISTS timescaledb;

-- Now run the main schema file (copy contents from database/schema.sql)
