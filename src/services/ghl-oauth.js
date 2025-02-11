import axios from 'axios';
import { logError, logInfo } from '../utils/logger.js';

class GHLOAuthService {
    constructor() {
        this.tokenUrl = 'https://services.leadconnectorhq.com/oauth/token';
    }

    async exchangeCodeForTokens(code) {
        try {
            // Create form data
            const params = new URLSearchParams();
            params.append('client_id', process.env.GHL_APP_CLIENT_ID);
            params.append('client_secret', process.env.GHL_APP_CLIENT_SECRET);
            params.append('code', code);
            params.append('grant_type', 'authorization_code');

            const response = await axios.post(this.tokenUrl, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            await logInfo('Token exchange successful', { 
                locationId: response.data.locationId,
                companyId: response.data.companyId 
            });

            return response.data;
        } catch (error) {
            await logError('Token exchange failed', error);
            throw error;
        }
    }

    async refreshToken(refreshToken) {
        try {
            // Create form data
            const params = new URLSearchParams();
            params.append('client_id', process.env.GHL_APP_CLIENT_ID);
            params.append('client_secret', process.env.GHL_APP_CLIENT_SECRET);
            params.append('refresh_token', refreshToken);
            params.append('grant_type', 'refresh_token');

            const response = await axios.post(this.tokenUrl, params, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });

            await logInfo('Token refresh successful');
            return response.data;
        } catch (error) {
            await logError('Token refresh failed', error);
            throw error;
        }
    }
}

export default new GHLOAuthService(); 