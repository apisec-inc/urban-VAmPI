const https = require('https');
const { URL } = require('url');

class APIsecCloudClient {
    constructor(options = {}) {
        this.apiKey = options.apiKey || process.env.APISEC_API_KEY;
        this.baseUrl = options.baseUrl || process.env.APISEC_URL || 'https://api.apisecapps.com/v1';
        this.timeout = options.timeout || 30000;
        this.retryAttempts = options.retryAttempts || 3;
        this.retryDelay = options.retryDelay || 1000;
        
        this.defaultApplicationId = options.applicationId || process.env.APISEC_APPLICATION_ID;
        this.defaultInstanceId = options.instanceId || process.env.APISEC_INSTANCE_ID;
        
        if (!this.apiKey) {
            throw new Error('APIsec API key is required. Set APISEC_API_KEY environment variable.');
        }
    }

    async makeRequest(method, endpoint, data = null, options = {}) {
        const baseUrl = this.baseUrl.endsWith('/') ? this.baseUrl : this.baseUrl + '/';
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
        const url = new URL(cleanEndpoint, baseUrl);
        
        const requestOptions = {
            method: method.toUpperCase(),
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                ...options.headers
            },
            timeout: this.timeout
        };

        const requestData = data ? JSON.stringify(data) : null;
        if (requestData) {
            requestOptions.headers['Content-Length'] = Buffer.byteLength(requestData);
        }

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await this._executeRequest(url, requestOptions, requestData);
                return response;
            } catch (error) {
                if (attempt === this.retryAttempts) {
                    throw new Error(`APIsec API request failed after ${this.retryAttempts} attempts: ${error.message}`);
                }
                
                console.warn(`⚠️  APIsec API request attempt ${attempt} failed, retrying in ${this.retryDelay}ms...`);
                await this._delay(this.retryDelay * attempt);
            }
        }
    }

    _executeRequest(url, options, data) {
        return new Promise((resolve, reject) => {
            const req = https.request(url, options, (res) => {
                let responseData = '';
                
                res.on('data', (chunk) => {
                    responseData += chunk;
                });
                
                res.on('end', () => {
                    try {
                        let parsedData;
                        
                        if (responseData.trim() === '') {
                            parsedData = {};
                        } else if (responseData.trim().startsWith('{') || responseData.trim().startsWith('[')) {
                            parsedData = JSON.parse(responseData);
                        } else {
                            parsedData = { message: responseData.trim() };
                        }
                        
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve({
                                status: res.statusCode,
                                data: parsedData,
                                headers: res.headers,
                                rawResponse: responseData
                            });
                        } else {
                            reject(new Error(`HTTP ${res.statusCode}: ${parsedData.message || parsedData.error || responseData}`));
                        }
                    } catch (parseError) {
                        reject(new Error(`Failed to parse response: ${parseError.message}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error('Request timeout'));
            });

            if (data) {
                req.write(data);
            }
            
            req.end();
        });
    }

    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async triggerScan(applicationId, instanceId, scanConfig = {}) {
        const appId = applicationId || this.defaultApplicationId;
        const instId = instanceId || this.defaultInstanceId;
        
        if (!appId || !instId) {
            throw new Error('Application ID and Instance ID are required for scan trigger');
        }

        const scanData = {
            target: process.env.VAMPI_URL || process.env.MEDUSA_URL,
            scan_type: 'security',
            ...scanConfig
        };

        const response = await this.makeRequest('POST', `/applications/${appId}/instances/${instId}/scans`, scanData);
        return response.data;
    }

    async getScanStatus(applicationId, instanceId, scanId) {
        const appId = applicationId || this.defaultApplicationId;
        const instId = instanceId || this.defaultInstanceId;
        
        const response = await this.makeRequest('GET', `/applications/${appId}/instances/${instId}/scans/${scanId}`);
        return response.data;
    }

    async testConnection() {
        try {
            const response = await this.makeRequest('GET', '/health');
            return response.status === 200;
        } catch (error) {
            console.warn('APIsec connection test failed:', error.message);
            return false;
        }
    }
}

module.exports = { APIsecCloudClient };