import axios from 'axios';

class GHLAuthService {
    constructor() {
        this.apiKey = process.env.GHL_API_KEY;
    }

    /**
     * Create an axios instance with the GHL API key
     */
    createAuthorizedRequest() {
        if (!this.apiKey) {
            throw new Error('No API key provided. Set GHL_API_KEY environment variable.');
        }

        return axios.create({
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Version': '2021-07-28'
            }
        });
    }
}

export default new GHLAuthService();
