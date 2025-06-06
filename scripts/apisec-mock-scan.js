#!/usr/bin/env node

const fs = require('fs');

class VampiMockScanner {
    constructor() {
        this.targetUrl = process.env.VAMPI_URL || 'https://urban-vampi-staging.up.railway.app';
        this.appName = process.env.APISEC_APP_NAME || 'vampi-demo';
    }

    async runMockScan() {
        console.log('🎭 Running Vampi Mock APIsec Scan...');
        console.log(`🎯 Target: ${this.targetUrl}`);
        console.log(`📱 App: ${this.appName}`);

        // Simulate scan delay
        await new Promise(resolve => setTimeout(resolve, 3000));

        const mockVulnerabilities = [
            {
                id: 'VAMPI-001',
                severity: 'high',
                title: 'SQL Injection in User Authentication',
                description: 'User login endpoint vulnerable to SQL injection attacks',
                endpoint: '/users/v1/login',
                method: 'POST',
                recommendation: 'Use parameterized queries and input validation'
            },
            {
                id: 'VAMPI-002',
                severity: 'medium',
                title: 'Missing Rate Limiting',
                description: 'API endpoints lack rate limiting controls',
                endpoint: '/users/v1',
                method: 'GET',
                recommendation: 'Implement rate limiting to prevent abuse'
            },
            {
                id: 'VAMPI-003',
                severity: 'low',
                title: 'Information Disclosure in Error Messages',
                description: 'Error responses contain sensitive system information',
                endpoint: '/books/v1',
                method: 'GET',
                recommendation: 'Return generic error messages'
            }
        ];

        const scanResults = {
            scan_id: `vampi-mock-${Date.now()}`,
            target: this.targetUrl,
            app_name: this.appName,
            timestamp: new Date().toISOString(),
            status: 'completed',
            scan_type: 'mock',
            vulnerabilities: mockVulnerabilities,
            summary: {
                total_endpoints_scanned: 12,
                vulnerabilities_found: mockVulnerabilities.length,
                critical_severity: mockVulnerabilities.filter(v => v.severity === 'critical').length,
                high_severity: mockVulnerabilities.filter(v => v.severity === 'high').length,
                medium_severity: mockVulnerabilities.filter(v => v.severity === 'medium').length,
                low_severity: mockVulnerabilities.filter(v => v.severity === 'low').length,
                scan_duration: '2m 30s'
            }
        };

        fs.writeFileSync('scan-results.json', JSON.stringify(scanResults, null, 2));
        console.log('📁 Mock scan results saved to scan-results.json');
        console.log('✅ Vampi mock scan completed!');

        return scanResults;
    }
}

// Execute if called directly
if (require.main === module) {
    const scanner = new VampiMockScanner();
    
    scanner.runMockScan()
        .then(() => {
            console.log('🎉 Vampi mock scan completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Vampi mock scan failed:', error.message);
            process.exit(1);
        });
}

module.exports = { VampiMockScanner };