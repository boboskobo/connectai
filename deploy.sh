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

# SSH into server and pull changes
echo -e "${GREEN}Deploying to server...${NC}"
ssh u166621223@connectai.click "cd /home/u166621223/domains/connectai.click/public_html && git pull origin main"

# Run any necessary post-deployment commands
echo -e "${GREEN}Running post-deployment tasks...${NC}"
ssh u166621223@connectai.click "cd /home/u166621223/domains/connectai.click/public_html && \
    composer install --no-dev --optimize-autoloader && \
    php artisan config:cache && \
    php artisan route:cache && \
    php artisan view:cache && \
    chmod -R 775 storage bootstrap/cache"

echo -e "${YELLOW}Deployment completed!${NC}" 