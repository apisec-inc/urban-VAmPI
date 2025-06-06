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
        this.failOnAnyVulns = process.env.FAIL_ON_ANY_VULNERABILITIES === 'true'; // Default: false
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
        console.log(`🔴 Fail on Any Vulns: ${this.failOnAnyVulns ? 'Yes' : 'No'}`);
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
                if (this.earlyFailCheck && (this.failOnCritical || this.failOnAnyVulns)) {
                    const criticalCount = this.countCriticalVulnerabilities(status.vulnerabilities);
                    const totalVulns = (status.metadata?.numVulnerabilities || 0);
                    
                    // Check for any vulnerabilities if configured
                    if (this.failOnAnyVulns && totalVulns > 0) {
                        console.log(`🚨 VULNERABILITIES DETECTED: ${totalVulns} total vulnerabilities found!`);
                        console.log('❌ Failing build due to security vulnerabilities (fail-on-any mode)');
                        this.logAllVulnerabilities(status.vulnerabilities);
                        this.generateSecurityReport(status, true);
                        throw new Error(`Build failed: ${totalVulns} security vulnerabilities detected`);
                    }
                    
                    // Check for critical vulnerabilities
                    if (this.failOnCritical && criticalCount > 0) {
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
                    const criticalCount = this.countCriticalVulnerabilities(status.vulnerabilities);
                    const totalVulns = (status.metadata?.numVulnerabilities || 0);
                    
                    if (this.failOnAnyVulns && totalVulns > 0) {
                        console.log(`🚨 FINAL CHECK: ${totalVulns} total vulnerabilities found`);
                        console.log('❌ Build failed due to security vulnerabilities');
                        this.logAllVulnerabilities(status.vulnerabilities);
                        this.generateSecurityReport(status, true);
                        throw new Error(`Build failed: ${totalVulns} security vulnerabilities detected`);
                    }
                    
                    if (this.failOnCritical && criticalCount > 0) {
                        console.log(`🚨 FINAL CHECK: ${criticalCount} critical vulnerabilities found`);
                        console.log('❌ Build failed due to critical security vulnerabilities');
                        this.logCriticalVulnerabilities(status.vulnerabilities);
                        this.generateSecurityReport(status, true);
                        throw new Error(`Build failed: ${criticalCount} critical security vulnerabilities detected`);
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
        
        let criticalCount = 0;
        
        vulnerabilities.forEach(vuln => {
            if (vuln.scanFindings && Array.isArray(vuln.scanFindings)) {
                vuln.scanFindings.forEach(finding => {
                    // Check for various critical severity formats
                    const severity = (finding.severity || finding.riskLevel || finding.impact || '').toLowerCase();
                    const category = (finding.category || finding.type || '').toLowerCase();
                    const name = (finding.name || finding.title || '').toLowerCase();
                    
                    // Multiple ways APIsec might indicate critical vulnerabilities
                    const isCritical = 
                        severity === 'critical' ||
                        severity === 'high' ||  // Treat high as critical for build failure
                        severity === 'severe' ||
                        category.includes('critical') ||
                        category.includes('severe') ||
                        name.includes('critical') ||
                        name.includes('injection') ||  // SQL injection, etc.
                        name.includes('authentication') ||
                        name.includes('authorization') ||
                        name.includes('xss') ||
                        name.includes('csrf');
                    
                    if (isCritical) {
                        criticalCount++;
                        
                        // Debug logging to see what we're finding
                        console.log(`🔍 Found critical vulnerability: ${finding.name || 'Unknown'}`);
                        console.log(`   Severity: ${finding.severity || 'Not specified'}`);
                        console.log(`   Category: ${finding.category || 'Not specified'}`);
                        console.log(`   Endpoint: ${vuln.method?.toUpperCase()} ${vuln.resource}`);
                    }
                });
            }
        });
        
        return criticalCount;
    }

    logAllVulnerabilities(vulnerabilities) {
        if (!vulnerabilities || !Array.isArray(vulnerabilities)) return;
        
        console.log('\n🔍 ALL VULNERABILITIES FOUND:');
        console.log('=' .repeat(60));
        
        vulnerabilities.forEach((vuln, index) => {
            console.log(`\n${index + 1}. ${vuln.method?.toUpperCase() || 'UNKNOWN'} ${vuln.resource || 'Unknown endpoint'}`);
            
            if (vuln.scanFindings && Array.isArray(vuln.scanFindings)) {
                vuln.scanFindings.forEach((finding, fin