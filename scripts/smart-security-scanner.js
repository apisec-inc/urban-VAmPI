#!/usr/bin/env node

require('dotenv').config();
const fs = require('fs');
const { APIsecCloudClient } = require('./apisec-client');

class SmartSecurityScanner {
    constructor() {
        this.client = new APIsecCloudClient();
        this.targetUrl = process.env.VAMPI_URL || process.env.MEDUSA_URL;
        this.appName = process.env.APISEC_APP_NAME || 'vampi-demo';
        
        // Configurable thresholds
        this.failOnCritical = process.env.FAIL_ON_CRITICAL !== 'false'; // Default: true
        this.maxWaitTime = parseInt(process.env.MAX_SCAN_WAIT_TIME) || 300000; // 5 minutes default
        this.pollInterval = parseInt(process.env.SCAN_POLL_INTERVAL) || 15000; // 15 seconds
        this.earlyFailCheck = process.env.EARLY_FAIL_CHECK !== 'false'; // Default: true
    }

    async runScan() {
        console.log('🔒 Starting Smart APIsec Security Scan...');
        console.log(`🎯 Target: ${this.targetUrl}`);
        console.log(`📱 App: ${this.appName}`);
        console.log(`⚡ Early Fail: ${this.earlyFailCheck ? 'Enabled' : 'Disabled'}`);
        console.log(`🚨 Fail on Critical: ${this.failOnCritical ? 'Yes' : 'No'}`);
        console.log(`⏱️  Max Wait Time: ${Math.floor(this.maxWaitTime / 1000)}s`);

        try {
            // Test connection
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
                    target: this.targetUrl
                }
            );

            console.log(`✅ Scan triggered successfully! ID: ${scanResult.scanId}`);

            // Smart waiting with early failure detection
            console.log('⏳ Monitoring scan progress...');
            const finalResults = await this.smartWaitForCompletion(scanResult.scanId);

            // Generate final report
            this.generateSecurityReport(finalResults);
            
            console.log('✅ Security scan completed successfully!');
            return finalResults;

        } catch (error) {
            console.error('❌ Security scan failed:', error.message);
            throw error;
        }
    }

    async smartWaitForCompletion(scanId) {
        const startTime = Date.now();
        let consecutiveErrors = 0;
        const maxConsecutiveErrors = 3;

        while (Date.now() - startTime < this.maxWaitTime) {
            try {
                const status = await this.client.getScanStatus(
                    process.env.APISEC_APPLICATION_ID,
                    process.env.APISEC_INSTANCE_ID,
                    scanId
                );

                consecutiveErrors = 0; // Reset error counter on success

                console.log(`📊 Scan Progress: ${status.progress || 'Unknown'}% - Status: ${status.status}`);
                
                // Log metadata if available
                if (status.metadata) {
                    const meta = status.metadata;
                    console.log(`   📈 Progress: ${meta.endpointsScanned || 0}/${meta.endpointsUnderTest || 0} endpoints`);
                    console.log(`   🔍 Tests: ${meta.testsPassed || 0} passed, ${meta.testsFailed || 0} failed`);
                    console.log(`   🚨 Vulnerabilities: ${meta.numVulnerabilities || 0}`);
                }

                // Early failure check for critical vulnerabilities
                if (this.earlyFailCheck && this.failOnCritical) {
                    const criticalCount = this.countCriticalVulnerabilities(status.vulnerabilities);
                    if (criticalCount > 0) {
                        console.log(`🚨 CRITICAL VULNERABILITIES DETECTED: ${criticalCount} critical issues found!`);
                        console.log('❌ Failing build immediately due to critical security vulnerabilities');
                        console.log('🔧 Fix these critical issues and redeploy:');
                        
                        this.logCriticalVulnerabilities(status.vulnerabilities);
                        this.generateSecurityReport(status, true); // Generate report with failure flag
                        
                        throw new Error(`Build failed: ${criticalCount} critical security vulnerabilities detected`);
                    }
                }

                // Check if scan is complete
                if (status.status === 'Complete' || status.status === 'complete' || status.status === 'finished') {
                    console.log('✅ Scan completed successfully!');
                    
                    // Final vulnerability check
                    if (this.failOnCritical) {
                        const criticalCount = this.countCriticalVulnerabilities(status.vulnerabilities);
                        if (criticalCount > 0) {
                            console.log(`🚨 FINAL CHECK: ${criticalCount} critical vulnerabilities found`);
                            console.log('❌ Build failed due to critical security vulnerabilities');
                            this.logCriticalVulnerabilities(status.vulnerabilities);
                            this.generateSecurityReport(status, true);
                            throw new Error(`Build failed: ${criticalCount} critical security vulnerabilities detected`);
                        }
                    }
                    
                    return status;
                } else if (status.status === 'failed' || status.status === 'error') {
                    throw new Error(`Scan failed with status: ${status.status}`);
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, this.pollInterval));

            } catch (error) {
                consecutiveErrors++;
                console.warn(`⚠️  Error checking scan status (${consecutiveErrors}/${maxConsecutiveErrors}):`, error.message);
                
                if (consecutiveErrors >= maxConsecutiveErrors) {
                    console.error('❌ Too many consecutive errors - stopping scan monitoring');
                    throw new Error(`Scan monitoring failed after ${maxConsecutiveErrors} consecutive errors`);
                }
                
                // Wait before retry
                await new Promise(resolve => setTimeout(resolve, this.pollInterval));
            }
        }

        throw new Error(`Scan timeout - maximum wait time of ${Math.floor(this.maxWaitTime / 1000)}s exceeded`);
    }

    countCriticalVulnerabilities(vulnerabilities) {
        if (!vulnerabilities || !Array.isArray(vulnerabilities)) return 0;
        
        return vulnerabilities.reduce((count, vuln) => {
            if (vuln.scanFindings && Array.isArray(vuln.scanFindings)) {
                return count + vuln.scanFindings.filter(finding => 
                    finding.severity === 'CRITICAL' || finding.severity === 'critical'
                ).length;
            }
            return count;
        }, 0);
    }

    logCriticalVulnerabilities(vulnerabilities) {
        if (!vulnerabilities || !Array.isArray(vulnerabilities)) return;
        
        console.log('\n🚨 CRITICAL VULNERABILITIES FOUND:');
        console.log('=' .repeat(50));
        
        vulnerabilities.forEach(vuln => {
            if (vuln.scanFindings && Array.isArray(vuln.scanFindings)) {
                const criticalFindings = vuln.scanFindings.filter(finding => 
                    finding.severity === 'CRITICAL' || finding.severity === 'critical'
                );
                
                criticalFindings.forEach(finding => {
                    console.log(`🔴 ${vuln.method?.toUpperCase()} ${vuln.resource}`);
                    console.log(`   Issue: ${finding.name || finding.title || 'Critical Vulnerability'}`);
                    console.log(`   Description: ${finding.description || 'No description available'}`);
                    console.log('');
                });
            }
        });
        
        console.log('🔧 ACTION REQUIRED:');
        console.log('   1. Fix these critical vulnerabilities in your code');
        console.log('   2. Test the fixes locally');
        console.log('   3. Commit and redeploy');
        console.log('   4. The security scan will run again automatically');
        console.log('=' .repeat(50));
    }

    generateSecurityReport(results, failed = false) {
        const scanResults = {
            scan_id: results.scanId || `scan-${Date.now()}`,
            target: this.targetUrl,
            app_name: this.appName,
            timestamp: new Date().toISOString(),
            status: failed ? 'failed' : (results.status || 'completed'),
            scan_type: 'live',
            build_failed: failed,
            vulnerabilities: this.parseVulnerabilities(results.vulnerabilities || []),
            summary: this.generateSummary(results, failed),
            metadata: results.metadata || {},
            apisec_scan_id: results.scanId
        };

        fs.writeFileSync('scan-results.json', JSON.stringify(scanResults, null, 2));
        console.log('📁 Security report saved to scan-results.json');
        
        if (failed) {
            console.log('🚨 Build status: FAILED due to critical vulnerabilities');
        }
    }

    parseVulnerabilities(vulnerabilities) {
        const parsed = [];
        
        vulnerabilities.forEach(vuln => {
            if (vuln.scanFindings && Array.isArray(vuln.scanFindings)) {
                vuln.scanFindings.forEach(finding => {
                    parsed.push({
                        id: finding.id || `${vuln.endpointId}-${finding.name}`,
                        severity: (finding.severity || 'unknown').toLowerCase(),
                        title: finding.name || finding.title || 'Security Issue',
                        description: finding.description || 'No description available',
                        endpoint: vuln.resource || 'Unknown',
                        method: (vuln.method || 'unknown').toUpperCase(),
                        recommendation: finding.remediation || 'Review and fix this security issue'
                    });
                });
            }
        });
        
        return parsed;
    }

    generateSummary(results, failed) {
        const vulnerabilities = this.parseVulnerabilities(results.vulnerabilities || []);
        
        return {
            total_endpoints_scanned: results.metadata?.endpointsScanned || 0,
            vulnerabilities_found: vulnerabilities.length,
            critical_severity: vulnerabilities.filter(v => v.severity === 'critical').length,
            high_severity: vulnerabilities.filter(v => v.severity === 'high').length,
            medium_severity: vulnerabilities.filter(v => v.severity === 'medium').length,
            low_severity: vulnerabilities.filter(v => v.severity === 'low').length,
            scan_duration: results.duration || 'unknown',
            build_status: failed ? 'FAILED' : 'PASSED',
            completion_percentage: results.metadata?.completionPercentage || 100
        };
    }
}

// Execute if called directly
if (require.main === module) {
    const scanner = new SmartSecurityScanner();
    
    scanner.runScan()
        .then(() => {
            console.log('🎉 Security scan completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Security scan failed:', error.message);
            process.exit(1);
        });
}

module.exports = { SmartSecurityScanner };