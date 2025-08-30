#!/bin/bash
set -e

# Change to the root directory
cd /app

# Wait for database to be ready
echo "Waiting for database to be ready..."
for i in {1..30}; do
  if PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USERNAME -d $DB_NAME -c "SELECT 1;" > /dev/null 2>&1; then
    echo "Database is ready!"
    break
  fi
  echo "Waiting for database... attempt $i/30"
  sleep 3
done

if [ $i -eq 30 ]; then
  echo "Database connection failed after 30 attempts"
  exit 1
fi

# Run database migrations
echo "Running database migrations..."
pnpm run --filter api db:push || echo "Migration failed, continuing..."

# Run database seeds (schema already applied above)
echo "Running database seeds..."
pnpm run --filter api db:seed || echo "Seed failed (likely data already exists), continuing..."

# Start the application
echo "Starting API server..."
exec pnpm run dev:api