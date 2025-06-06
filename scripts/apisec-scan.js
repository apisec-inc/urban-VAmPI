#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const { APIsecCloudClient } = require('./apisec-client');

class VampiAPIsecScanner {
    constructor() {
        this.client = new APIsecCloudClient();
        this.targetUrl = process.env.VAMPI_URL || process.env.MEDUSA_URL;
        this.appName = process.env.APISEC_APP_NAME || 'vampi-demo';
    }

    async runScan() {
        console.log('🔒 Starting Vampi APIsec Security Scan...');
        console.log(`🎯 Target: ${this.targetUrl}`);
        console.log(`📱 App: ${this.appName}`);

        try {
            // Test connection first
            console.log('🔍 Testing APIsec connection...');
            const isConnected = await this.client.testConnection();
            
            if (!isConnected) {
                throw new Error('Failed to connect to APIsec API');
            }
            
            console.log('✅ APIsec connection successful');

            // Trigger scan
            console.log('🚀 Triggering security scan...');
            const scanResult = await this.client.triggerScan(
                process.env.APISEC_APPLICATION_ID,
                process.env.APISEC_INSTANCE_ID,
                {
                    target: this.targetUrl,
                    scan_type: 'security',
                    app_name: this.appName
                }
            );

            console.log(`✅ Scan triggered successfully! ID: ${scanResult.scanId}`);

            // Wait for scan completion
            console.log('⏳ Waiting for scan completion...');
            const finalResults = await this.waitForScanCompletion(scanResult.scanId);

            // Save results
            this.saveScanResults(finalResults);
            
            console.log('✅ Vampi APIsec scan completed successfully!');
            return finalResults;

        } catch (error) {
            console.error('❌ APIsec scan failed:', error.message);
            throw error;
        }
    }

    async waitForScanCompletion(scanId, maxWaitTime = 600000) {
        const pollInterval = 10000; // 10 seconds
        const startTime = Date.now();

        while (Date.now() - startTime < maxWaitTime) {
            try {
                const status = await this.client.getScanStatus(
                    process.env.APISEC_APPLICATION_ID,
                    process.env.APISEC_INSTANCE_ID,
                    scanId
                );

                console.log(`📊 Scan status: ${status.status}`);

                if (status.status === 'completed') {
                    return status;
                } else if (status.status === 'failed') {
                    throw new Error('Scan failed');
                }

                await new Promise(resolve => setTimeout(resolve, pollInterval));
            } catch (error) {
                console.warn('⚠️  Error checking scan status:', error.message);
                await new Promise(resolve => setTimeout(resolve, pollInterval));
            }
        }

        throw new Error('Scan timeout - maximum wait time exceeded');
    }

    saveScanResults(results) {
        const scanResults = {
            scan_id: results.scanId || `vampi-${Date.now()}`,
            target: this.targetUrl,
            app_name: this.appName,
            timestamp: new Date().toISOString(),
            status: 'completed',
            scan_type: 'live',
            vulnerabilities: results.vulnerabilities || [],
            summary: {
                total_endpoints_scanned: results.endpoints_scanned || 0,
                vulnerabilities_found: (results.vulnerabilities || []).length,
                critical_severity: (results.vulnerabilities || []).filter(v => v.severity === 'critical').length,
                high_severity: (results.vulnerabilities || []).filter(v => v.severity === 'high').length,
                medium_severity: (results.vulnerabilities || []).filter(v => v.severity === 'medium').length,
                low_severity: (results.vulnerabilities || []).filter(v => v.severity === 'low').length,
                scan_duration: results.duration || 'unknown'
            }
        };

        fs.writeFileSync('scan-results.json', JSON.stringify(scanResults, null, 2));
        console.log('📁 Scan results saved to scan-results.json');
    }
}

// Execute if called directly
if (require.main === module) {
    const scanner = new VampiAPIsecScanner();
    
    scanner.runScan()
        .then(() => {
            console.log('🎉 Vampi APIsec scan completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Vampi APIsec scan failed:', error.message);
            process.exit(1);
        });
}

module.exports = { VampiAPIsecScanner };