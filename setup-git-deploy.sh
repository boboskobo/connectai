#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Setting up Git deployment for Hostinger...${NC}"

# Check if SSH key exists
if [ ! -f ~/.ssh/id_rsa.pub ]; then
    echo "No SSH key found. Please generate one first."
    exit 1
fi

# Display the public key
echo -e "${GREEN}Your public SSH key:${NC}"
cat ~/.ssh/id_rsa.pub
echo

echo -e "${BLUE}Instructions:${NC}"
echo "1. Log into your Hostinger control panel"
echo "2. Go to the Git Version Control section"
echo "3. Create a new repository"
echo "4. Add the SSH key shown above to Hostinger"
echo "5. Copy the Git remote URL provided by Hostinger"
echo
read -p "Enter the Git remote URL from Hostinger: " remote_url

# Add the remote and push
git remote add hostinger "$remote_url"
git push -u hostinger main

echo -e "${GREEN}Git deployment setup complete!${NC}"
echo "You can now deploy using: git push hostinger main" 