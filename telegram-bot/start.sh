#!/bin/bash

echo "Starting Delta25 Telegram Bot..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
    echo ""
fi

echo "Starting bot..."
npm start