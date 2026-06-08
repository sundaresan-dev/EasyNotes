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

# Ask user which branch to push
CURRENT_BRANCH=$(git branch --show-current)
read -p "Branch to push (default: $CURRENT_BRANCH): " BRANCH
BRANCH=${BRANCH:-$CURRENT_BRANCH}

# Set remote with token
git remote set-url origin "https://${GITHUB_TOKEN}@github.com/sundaresan-dev/EasyNotes.git" 2>/dev/null \
  || git remote add origin "https://${GITHUB_TOKEN}@github.com/sundaresan-dev/EasyNotes.git"

# Stage and commit
git add .
git commit -m "$BRANCH" 2>/dev/null

# Switch/create branch
git branch -M "$BRANCH"

# Try normal push first
if ! git push -u origin "$BRANCH" 2>&1; then
  echo ""
  read -p "⚠️  Push rejected. Force push? (y/n): " FORCE
  if [ "$FORCE" = "y" ] || [ "$FORCE" = "Y" ]; then
    git push -u origin "$BRANCH" --force
  else
    echo "Pulling with rebase..."
    git pull --rebase origin "$BRANCH"
    git push -u origin "$BRANCH"
  fi
fi

# Remove token from remote URL
git remote set-url origin "$REPO"

echo "✅ Pushed branch '$BRANCH' to $REPO"
