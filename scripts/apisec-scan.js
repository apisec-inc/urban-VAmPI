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

                if (status.status === 'completed' || status.status === 'Complete') {
                    console.log('✅ Scan completed - analyzing results...');
                    
                    // Get vulnerability count from metadata or vulnerabilities array
                    const vulnCount = status.metadata?.numVulnerabilities || 0;
                    const vulnArray = status.vulnerabilities || [];
                    const actualVulnCount = Math.max(vulnCount, vulnArray.length);
                    
                    console.log(`🔍 Security Analysis: Found ${actualVulnCount} vulnerabilities`);
                    
                    // Check if we should fail the build
                    const failOnAny = process.env.FAIL_ON_ANY_VULNERABILITIES === 'true';
                    const failOnCritical = process.env.FAIL_ON_CRITICAL !== 'false';
                    
                    if (failOnAny && actualVulnCount > 0) {
                        console.log('🚨 BUILD FAILED: Security vulnerabilities detected!');
                        console.log(`❌ Found ${actualVulnCount} security vulnerabilities that must be fixed`);
                        console.log('');
                        console.log('🔧 ACTION REQUIRED:');
                        console.log('  1. Review the vulnerabilities in the scan results');
                        console.log('  2. Fix the security issues in your code');
                        console.log('  3. Test the fixes locally');
                        console.log('  4. Commit and redeploy');
                        console.log('');
                        console.log('📊 Vulnerability Summary:');
                        
                        // Show some endpoint info if available
                        if (vulnArray.length > 0) {
                            vulnArray.slice(0, 5).forEach((vuln, index) => {
                                console.log(`  ${index + 1}. ${vuln.method?.toUpperCase() || 'GET'} ${vuln.resource || 'Unknown endpoint'}`);
                                if (vuln.scanFindings && vuln.scanFindings.length > 0) {
                                    console.log(`     └─ ${vuln.scanFindings.length} security findings`);
                                }
                            });
                            
                            if (vulnArray.length > 5) {
                                console.log(`  ... and ${vulnArray.length - 5} more vulnerable endpoints`);
                            }
                        }
                        
                        // Mark scan results as failed
                        status.build_failed = true;
                        status.failure_reason = `${actualVulnCount} security vulnerabilities detected`;
                        
                        throw new Error(`Build failed: ${actualVulnCount} security vulnerabilities must be fixed before deployment`);
                    }
                    
                    if (actualVulnCount > 0) {
                        console.log(`⚠️  Security Notice: ${actualVulnCount} vulnerabilities found but build not configured to fail`);
                        console.log('💡 Set FAIL_ON_ANY_VULNERABILITIES=true to fail builds with vulnerabilities');
                    } else {
                        console.log('✅ Security Check: No vulnerabilities detected');
                    }
                    
                    return status;
                } else if (status.status === 'failed') {
                    throw new Error('Scan failed');
                }

                await new Promise(resolve => setTimeout(resolve, pollInterval));
            } catch (error) {
                console.warn('⚠️  Error checking scan status:', error.message);
                
                // If this is our vulnerability failure, re-throw it
                if (error.message.includes('Build failed:')) {
                    throw error;
                }
                
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
            status: results.build_failed ? 'failed' : (results.status || 'completed'),
            scan_type: 'live',
            build_failed: results.build_failed || false,
            failure_reason: results.failure_reason || null,
            vulnerabilities: results.vulnerabilities || [],
            summary: {
                total_endpoints_scanned: results.metadata?.endpointsScanned || 0,
                vulnerabilities_found: results.metadata?.numVulnerabilities || (results.vulnerabilities || []).length,
                critical_severity: (results.vulnerabilities || []).filter(v => v.severity === 'critical').length,
                high_severity: (results.vulnerabilities || []).filter(v => v.severity === 'high').length,
                medium_severity: (results.vulnerabilities || []).filter(v => v.severity === 'medium').length,
                low_severity: (results.vulnerabilities || []).filter(v => v.severity === 'low').length,
                scan_duration: results.duration || 'unknown',
                build_status: results.build_failed ? 'FAILED' : 'PASSED'
            },
            metadata: results.metadata || {},
            apisec_scan_id: results.scanId
        };

        fs.writeFileSync('scan-results.json', JSON.stringify(scanResults, null, 2));
        console.log('📁 Scan results saved to scan-results.json');
        
        if (results.build_failed) {
            console.log('🚨 Build status: FAILED due to security vulnerabilities');
        }
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