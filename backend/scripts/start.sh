#!/bin/bash
set -e

echo "🔄 Running database migration..."
npx prisma db push --accept-data-loss

echo "🚀 Starting server..."
node dist/index.js 