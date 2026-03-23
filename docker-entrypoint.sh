#!/bin/sh

# Seed the database if it doesn't exist yet
if [ ! -f /app/server/data/risk_register.db ]; then
  echo "No database found. Seeding..."
  cd /app/server && node db/seed.js
fi

# Start the application
exec npm start
