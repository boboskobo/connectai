# Connect Rock RMS Integration

A GoHighLevel Marketplace app that integrates with Rock RMS, allowing churches to automatically sync their GHL contacts with their Rock RMS instance.

## Features

- Automatic contact synchronization from GHL to Rock RMS
- Secure webhook handling with signature validation
- Configurable field mapping
- Multi-church support
- Comprehensive logging and error tracking
- Rate limiting and security features

## Prerequisites

- Node.js >= 18.0.0
- A GoHighLevel account with API access
- A Rock RMS instance with API access
- npm or yarn package manager

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/connect-rockrms-integration
cd connect-rockrms-integration
```

2. Install dependencies:
```bash
npm install
```

3. Create environment configuration:
```bash
cp .env.example .env
```

4. Update the `.env` file with your credentials:
```env
# Rock RMS Configuration
ROCK_API_KEY=your_rock_api_key
ROCK_BASE_URL=your_rock_instance_url/api

# GHL Configuration
GHL_APP_CLIENT_ID=your_client_id
GHL_APP_CLIENT_SECRET=your_client_secret
GHL_WEBHOOK_SECRET=your_webhook_secret
```

## Usage

### Development

Start the development server:
```bash
npm run dev
```

### Production

Start the production server:
```bash
npm start
```

### Church Setup

Run the setup wizard for a new church:
```bash
npm run setup
```

## Webhook Configuration

1. In your GHL account, go to Settings > Webhooks
2. Add a new webhook with the following URL:
   ```
   https://your-domain.com/webhook/ghl
   ```
3. Select the following events:
   - Contact Created
   - Contact Updated
   - Contact Deleted

## Rock RMS Configuration

1. Create a REST API Key in Rock RMS:
   - Go to Admin Tools > Security > REST Keys
   - Create a new key with appropriate permissions
2. Configure the connection status:
   - Default status ID is 1949 (Connect App Contact)
   - Can be customized in church configuration

## Security

- All sensitive credentials stored in environment variables
- Webhook signature validation
- Rate limiting on all endpoints
- Helmet security headers
- CORS configuration

## Logging

Logs are stored in the `logs` directory:
- `app.log`: All application logs
- `error.log`: Error-level logs only

## Testing

Run the test suite:
```bash
npm test
```

## Deployment

1. Build the application:
```bash
npm run build
```

2. Deploy using your preferred method:
```bash
npm run deploy
```

## Troubleshooting

Common issues and solutions:

1. Webhook not receiving events:
   - Verify webhook URL is correct
   - Check GHL webhook configuration
   - Verify server is running and accessible

2. Contact not syncing to Rock:
   - Check Rock RMS API credentials
   - Verify required fields are present
   - Check error logs for details

## Support

For support, please contact:
- Email: your-email@example.com
- Website: https://your-website.com

## License

MIT License - see LICENSE file for details
