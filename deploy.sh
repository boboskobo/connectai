#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment...${NC}"

# Add all changes
echo -e "${GREEN}Adding changes...${NC}"
git add .

# Commit changes
echo -e "${GREEN}Committing changes...${NC}"
git commit -m "Deployment: $(date)"

# Push to main branch
echo -e "${GREEN}Pushing to repository...${NC}"
git push origin main

# SSH into server and deploy
echo -e "${GREEN}Deploying to server...${NC}"
ssh u166621223@connectai.click "cd /home/u166621223/domains/connectai.click/public_html && \
    git pull origin main && \
    npm ci --production && \
    mkdir -p logs/pm2 config/churches && \
    pm2 reload ecosystem.config.cjs --env production || pm2 start ecosystem.config.cjs --env production && \
    pm2 save"

echo -e "${YELLOW}Deployment completed!${NC}" 