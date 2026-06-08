#!/bin/bash
# EasyNotes — Git Push Script

REPO="https://github.com/sundaresan-dev/EasyNotes.git"

# Load token from .env
if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$GITHUB_TOKEN" ]; then
  echo "❌ GITHUB_TOKEN not found in .env"
  exit 1
fi

git remote set-url origin "https://${GITHUB_TOKEN}@github.com/sundaresan-dev/EasyNotes.git" 2>/dev/null \
  || git remote add origin "https://${GITHUB_TOKEN}@github.com/sundaresan-dev/EasyNotes.git"

git branch -M main
git push -u origin main

# Remove token from remote URL after push
git remote set-url origin "$REPO"

echo "✅ Pushed to $REPO"
