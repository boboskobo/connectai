# CONNECT Rock RMS Integration Module

This module extends your existing CONNECT platform to provide seamless integration with Rock RMS (Church Management System). For CONNECT platform clients, this add-on enables automatic synchronization of contacts, status updates, and other relevant data between Rock RMS and your existing Go High Level implementation.

## About This Module

The Rock RMS Integration Module is an optional add-on for CONNECT platform users that bridges your existing CONNECT implementation with Rock RMS. This module enables churches to maintain their Rock RMS database while leveraging the powerful marketing and communication features of Go High Level through CONNECT.

### Key Integration Features

- Bi-directional contact synchronization between Rock RMS and your CONNECT platform
- Automatic status mapping and updates
- Custom field mapping to match your church's Rock RMS configuration
- Real-time updates via webhook processing
- Flexible church-specific configurations

## Technical Overview

### Core Components

- **Rock RMS Integration**: Handles all interactions with the Rock RMS API
- **Go High Level Integration**: Manages webhook handling and API interactions with GHL
- **Webhook Handler**: Processes incoming webhooks from Go High Level
- **Church Configuration**: Manages church-specific mappings and settings

### Key Features

- Bi-directional contact synchronization
- Status mapping and updates
- Custom field mapping
- Webhook processing for real-time updates
- Flexible church-specific configurations

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```
3. Configure environment variables:
```bash
cp .env.example .env
```
4. Update the `.env` file with your credentials:
   - Rock RMS API credentials
   - Go High Level API credentials
   - Database configuration
   - Church-specific settings

## Configuration Files

- `.env`: Environment configuration
- `church-config.json`: Church-specific mappings
- `church-config.js`: Church configuration loader

## Deployment

The application includes a custom deployment script (`deploy-to-hostinger.js`) for deploying to Hostinger:

```javascript
node deploy-to-hostinger.js
```

### Deployment Configuration

Required FTP credentials in `.env`:
- HOSTINGER_USER
- HOSTINGER_PASS
- HOSTINGER_HOST
- HOSTINGER_PATH

## API Endpoints

### Webhook Endpoints
- `/webhook/ghl`: Receives webhooks from Go High Level
- `/webhook/rock`: Handles Rock RMS webhooks

### Integration Endpoints
- `/api/sync`: Triggers manual synchronization
- `/api/status`: Checks integration status

## Testing

The project includes several test files for different components:

- `test-rock-connection.js`: Tests Rock RMS connectivity
- `test-ghl-webhook.js`: Tests Go High Level webhook processing
- `test-create-person.js`: Tests person creation flow
- `test-update-status.js`: Tests status update functionality

Run tests using:
```bash
npm test
```

## Error Handling

The application uses a centralized logging system (`logger.js`) for error tracking and debugging:

- Logs are stored in `app.log`
- Different log levels for various types of events
- Structured logging for better debugging

## Security

- All sensitive credentials are stored in `.env`
- API keys are never exposed in logs
- HTTPS required for all endpoints
- Input validation on all webhook payloads

## Maintenance

Regular maintenance tasks:
1. Monitor `app.log` for errors
2. Check webhook status in Go High Level dashboard
3. Verify Rock RMS API connectivity
4. Review and update church-specific mappings as needed

## Support

For existing CONNECT platform clients:
1. Access support through your normal CONNECT support channels
2. Contact your CONNECT success manager for Rock RMS integration assistance
3. Visit the CONNECT client portal for Rock RMS integration documentation

## Module Access

This module is available exclusively to existing CONNECT platform clients. Contact your CONNECT success manager to enable the Rock RMS integration for your account.

## License

CONNECT is proprietary software by Connect Software. All rights reserved.

## Contact

CONNECT Support:
- Email: support@connectsoftware.io
- Website: https://connect.church
- Support Hours: Monday-Friday, 9am-5pm EST

## Features
- Automatic contact creation/update in Rock RMS
- Connection status management
- Campus assignment
- Flexible field mapping
- Error logging and monitoring
- Test suite included

## Quick Start
See [SETUP.md](SETUP.md) for detailed setup instructions.

## Architecture
- `setup-church-integration.js`: Initial configuration
- `rock-ghl-integration.js`: Core integration logic
- `webhook-handler.js`: GHL webhook processor
- `logger.js`: Error tracking and monitoring
- Test files: Comprehensive test suite

## Contributing
1. Fork the repository
2. Create feature branch
3. Submit pull request

## License
MIT

## Setup Instructions

1. Prerequisites:
   - Rock RMS instance
   - Rock RMS API Key
   - GoHighLevel account
   - Node.js installed

2. Initial Setup:
   ```bash
   # Clone repository
   git clone [repository-url]

   # Install dependencies
   npm install

   # Create .env file
   cp .env.example .env
   ```

3. Configure Environment:
   ```env
   ROCK_API_KEY=your-api-key
   ROCK_BASE_URL=https://your-rock-instance.com/api
   HOSTINGER_HOST=ftp.connectai.click
   HOSTINGER_USER=u166621223
   HOSTINGER_PASS=your-ftp-password
   HOSTINGER_PATH=/public_html
   ```

4. Run Setup Script:
   ```bash
   node setup-church-integration.js
   ```
   This will:
   - Test connection to Rock RMS
   - Create "Connect App Contact" status
   - Get available campuses
   - Generate configuration file

5. Configure GHL:
   - Add webhook URL to your GHL account
   - Configure required fields:
     - First Name
     - Last Name
     - Phone Number
   - Optional fields:
     - Email
     - Gender
     - Campus (if multiple campuses)

## Files
- `setup-church-integration.js` - Initial setup script
- `rock-ghl-integration.js` - Core integration logic
- `webhook-handler.js` - Handles incoming GHL webhooks
- `church-config.json` - Generated configuration

## Support
For support, contact [your-email]

## Testing
Run these tests in order:
```bash
# 1. Test Rock RMS connection
node test-rock-connection.js

# 2. Run setup script
node setup-church-integration.js

# 3. Test person creation
node test-flexible-person.js
```
