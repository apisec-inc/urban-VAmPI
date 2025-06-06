// Add this to your existing waitForScanCompletion method, right after the scan completes

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
}