#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Running post-deployment tasks...${NC}"

# Install/update Composer dependencies
echo -e "${GREEN}Installing Composer dependencies...${NC}"
composer install --no-interaction --prefer-dist --optimize-autoloader

# Clear caches
echo -e "${GREEN}Clearing caches...${NC}"
php artisan cache:clear
php artisan config:clear
php artisan view:clear
php artisan route:clear

# Run database migrations
echo -e "${GREEN}Running database migrations...${NC}"
php artisan migrate --force

# Set proper permissions
echo -e "${GREEN}Setting proper permissions...${NC}"
chmod -R 755 storage bootstrap/cache
chown -R www-data:www-data storage bootstrap/cache

# Create storage link if it doesn't exist
echo -e "${GREEN}Creating storage link...${NC}"
php artisan storage:link

echo -e "${GREEN}Post-deployment tasks completed!${NC}" 