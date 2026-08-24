#!/usr/bin/env bash
# Start the app: Spring Boot backend + Angular frontend.
set -e

cd "$(dirname "$0")"

# Backend (http://localhost:8080)
# fork=false: run the app in this process so Ctrl+C actually stops it (no orphan on 8080)
( cd backend && ./mvnw spring-boot:run -Dspring-boot.run.fork=false ) &
backend_pid=$!

# Frontend (http://localhost:4200)
( cd frontend && npm start ) &
frontend_pid=$!

# Stop both on Ctrl+C
trap 'kill "$backend_pid" "$frontend_pid" 2>/dev/null' INT TERM

wait
