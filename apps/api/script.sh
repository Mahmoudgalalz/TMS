#!/bin/bash

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 5

# Run seeds
echo "Running database seeds..."
pnpm run --filter api seed

# Start the application
echo "Starting API server..."
pnpm run start:api