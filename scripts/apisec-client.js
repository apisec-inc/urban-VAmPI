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
        
        // Debug mode for troubleshooting
        this.debug = process.env.APISEC_DEBUG === 'true';
        
        if (!this.apiKey) {
            throw new Error('APIsec API key is required. Set APISEC_API_KEY environment variable.');
        }
        
        if (this.debug) {
            console.log('🔧 APIsec Client Configuration:');
            console.log(`   Base URL: ${this.baseUrl}`);
            console.log(`   App ID: ${this.defaultApplicationId}`);
            console.log(`   Instance ID: ${this.defaultInstanceId}`);
            console.log(`   Token Preview: ${this.apiKey.substring(0, 20)}...`);
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
                'User-Agent': 'APIsec-VampiScanner/1.0',
                ...options.headers
            },
            timeout: this.timeout
        };

        const requestData = data ? JSON.stringify(data) : null;
        if (requestData) {
            requestOptions.headers['Content-Length'] = Buffer.byteLength(requestData);
        }

        if (this.debug) {
            console.log(`🌐 APIsec API Request: ${method.toUpperCase()} ${url.toString()}`);
            if (data) console.log(`📤 Request Payload:`, JSON.stringify(data, null, 2));
        }

        for (let attempt = 1; attempt <= this.retryAttempts; attempt++) {
            try {
                const response = await this._executeRequest(url, requestOptions, requestData);
                
                if (this.debug) {
                    console.log(`✅ APIsec Response (${response.status}):`, response.data);
                }
                
                return response;
            } catch (error) {
                if (this.debug) {
                    console.error(`❌ APIsec Request Failed (attempt ${attempt}/${this.retryAttempts}):`, error.message);
                }
                
                // Don't retry on certain errors
                if (error.message.includes('401') || error.message.includes('403') || error.message.includes('404')) {
                    throw error;
                }
                
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
                            // Enhanced error details
                            let errorMsg = `HTTP ${res.statusCode}: ${parsedData.message || parsedData.error || responseData || res.statusMessage}`;
                            
                            if (res.statusCode === 405) {
                                errorMsg += `\n🔍 HTTP 405 Method Not Allowed:`;
                                errorMsg += `\n   URL: ${url.toString()}`;
                                errorMsg += `\n   Method: ${options.method}`;
                                errorMsg += `\n   Allowed Methods: ${res.headers['allow'] || 'Not specified'}`;
                                errorMsg += `\n   💡 This endpoint exists but doesn't accept ${options.method} requests`;
                            } else if (res.statusCode === 401) {
                                errorMsg += `\n🔐 Authentication failed - check API key`;
                            } else if (res.statusCode === 403) {
                                errorMsg += `\n🚫 Access forbidden - check API permissions`;
                            } else if (res.statusCode === 404) {
                                errorMsg += `\n🔍 Endpoint not found - check URL structure`;
                            }
                            
                            reject(new Error(errorMsg));
                        }
                    } catch (parseError) {
                        reject(new Error(`Failed to parse response: ${parseError.message}. Raw response: ${responseData}`));
                    }
                });
            });

            req.on('error', (error) => {
                reject(new Error(`Request failed: ${error.message}`));
            });

            req.on('timeout', () => {
                req.destroy();
                reject(new Error(`Request timeout after ${this.timeout}ms`));
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

    async testConnection() {
        try {
            console.log('🔍 Testing APIsec API connection...');
            
            // Test with applications endpoint - should be safe for any valid token
            const response = await this.makeRequest('GET', 'applications');
            
            if (response.status === 200) {
                const apps = response.data;
                console.log(`✅ APIsec connection successful - found ${Array.isArray(apps) ? apps.length : 'unknown'} applications`);
                
                if (this.debug && Array.isArray(apps)) {
                    console.log('📋 Available applications:', apps.map(app => ({
                        id: app.id,
                        name: app.name || app.appName
                    })));
                }
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('❌ APIsec connection test failed:', error.message);
            
            // If we get 405 on /applications, the API is working but wrong method
            if (error.message.includes('405')) {
                console.log('✅ APIsec API is responding (got 405, which means endpoint exists)');
                return true;
            }
            
            return false;
        }
    }

    async triggerScan(applicationId, instanceId, scanConfig = {}) {
        const appId = applicationId || this.defaultApplicationId;
        const instId = instanceId || this.defaultInstanceId;
        
        if (!appId || !instId) {
            throw new Error('Application ID and Instance ID are required for scan trigger');
        }

        // Use the exact payload format that works with curl commands
        const scanData = {
            endpointIds: [],
            scanWithAuthId: "",
            ...scanConfig
        };

        console.log(`🚀 Triggering APIsec scan...`);
        console.log(`   App ID: ${appId}`);
        console.log(`   Instance ID: ${instId}`);

        // FIXED: Use the correct endpoint (singular 'scan', not 'scans')
        const endpoint = `applications/${appId}/instances/${instId}/scan`;
        
        try {
            const response = await this.makeRequest('POST', endpoint, scanData);
            
            const scanResult = {
                scanId: response.data.scanId || response.data.id || response.data.scan_id || `scan-${Date.now()}`,
                status: response.data.status || 'initiated',
                ...response.data
            };
            
            console.log(`✅ APIsec scan triggered successfully!`);
            console.log(`   Scan ID: ${scanResult.scanId}`);
            
            return scanResult;
            
        } catch (error) {
            console.error('❌ Failed to trigger APIsec scan:', error.message);
            throw error;
        }
    }

    async getScanStatus(applicationId, instanceId, scanId) {
        const appId = applicationId || this.defaultApplicationId;
        const instId = instanceId || this.defaultInstanceId;
        
        if (!appId || !instId || !scanId) {
            throw new Error('Application ID, Instance ID, and Scan ID are required for status check');
        }

        // Use the confirmed correct endpoint pattern (no /status suffix)
        const endpoint = `applications/${appId}/instances/${instId}/scans/${scanId}`;
        
        try {
            const response = await this.makeRequest('GET', endpoint);
            
            const statusResult = {
                scanId,
                status: response.data.status || response.data.state || 'unknown',
                vulnerabilities: response.data.vulnerabilities || response.data.findings || [],
                endpoints_scanned: response.data.endpoints_scanned || response.data.endpointsScanned || 0,
                duration: response.data.duration || response.data.scanDuration,
                progress: response.data.progress || response.data.percentComplete,
                ...response.data
            };
            
            if (this.debug) {
                console.log(`📊 Scan Status: ${statusResult.status}`);
                if (statusResult.progress) console.log(`📈 Progress: ${statusResult.progress}%`);
            }
            
            return statusResult;
            
        } catch (error) {
            console.error(`❌ Failed to get scan status for ${scanId}:`, error.message);
            throw error;
        }
    }

    async getScanResults(applicationId, instanceId, scanId) {
        const appId = applicationId || this.defaultApplicationId;
        const instId = instanceId || this.defaultInstanceId;
        
        // Try results endpoint
        const resultsEndpoint = `applications/${appId}/instances/${instId}/scans/${scanId}/results`;
        
        try {
            const response = await this.makeRequest('GET', resultsEndpoint);
            return response.data;
        } catch (error) {
            console.warn('⚠️ Dedicated results endpoint failed, falling back to scan status');
            // Fallback to scan status if results endpoint doesn't exist
            return this.getScanStatus(applicationId, instanceId, scanId);
        }
    }
}

module.exports = { APIsecCloudClient };