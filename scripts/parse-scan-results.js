#!/usr/bin/env node

const fs = require('fs');

function parseScanResults() {
    if (!fs.existsSync('scan-results.json')) {
        console.error('❌ scan-results.json not found');
        process.exit(1);
    }

    const results = JSON.parse(fs.readFileSync('scan-results.json', 'utf8'));
    
    console.log('\n📊 VAmPI APIsec Scan Results Summary:');
    console.log('=====================================');
    console.log(`🎯 Target: ${results.target}`);
    console.log(`📱 App: ${results.app_name}`);
    console.log(`🔍 Scan Type: ${results.scan_type.toUpperCase()}`);
    console.log(`📅 Timestamp: ${results.timestamp}`);
    console.log(`⏱️  Duration: ${results.summary.scan_duration}`);
    console.log(`🌐 Endpoints Scanned: ${results.summary.total_endpoints_scanned}`);
    
    console.log('\n🚨 Vulnerabilities Found:');
    console.log(`   🔴 Critical: ${results.summary.critical_severity}`);
    console.log(`   🟠 High: ${results.summary.high_severity}`);
    console.log(`   🟡 Medium: ${results.summary.medium_severity}`);
    console.log(`   🟢 Low: ${results.summary.low_severity}`);
    console.log(`   📊 Total: ${results.summary.vulnerabilities_found}`);

    if (results.vulnerabilities && results.vulnerabilities.length > 0) {
        console.log('\n🔍 Vulnerability Details:');
        results.vulnerabilities.forEach((vuln, index) => {
            const severityIcon = {
                'critical': '🔴',
                'high': '🟠',
                'medium': '🟡',
                'low': '🟢'
            }[vuln.severity] || '⚪';
            
            console.log(`\n   ${index + 1}. ${severityIcon} ${vuln.title}`);
            console.log(`      Severity: ${vuln.severity.toUpperCase()}`);
            console.log(`      Endpoint: ${vuln.endpoint} [${vuln.method}]`);
            console.log(`      Description: ${vuln.description}`);
            console.log(`      Recommendation: ${vuln.recommendation}`);
        });
    }

    // Generate markdown report
    const markdownReport = generateMarkdownReport(results);
    fs.writeFileSync('scan-report.md', markdownReport);
    console.log('\n📄 Markdown report saved to scan-report.md');

    console.log('\n=====================================');
    
    if (results.summary.critical_severity > 0) {
        console.log('🚨 CRITICAL VULNERABILITIES FOUND!');
        return false;
    } else if (results.summary.high_severity > 0) {
        console.log('⚠️  High severity vulnerabilities found');
        return true;
    } else {
        console.log('✅ No critical vulnerabilities found');
        return true;
    }
}

function generateMarkdownReport(results) {
    let report = `# Vampi APIsec Security Report\n\n`;
    report += `**Target:** ${results.target}\n`;
    report += `**App:** ${results.app_name}\n`;
    report += `**Scan Type:** ${results.scan_type.toUpperCase()}\n`;
    report += `**Timestamp:** ${results.timestamp}\n`;
    report += `**Duration:** ${results.summary.scan_duration}\n\n`;
    
    report += `## Summary\n\n`;
    report += `- **Endpoints Scanned:** ${results.summary.total_endpoints_scanned}\n`;
    report += `- **Total Vulnerabilities:** ${results.summary.vulnerabilities_found}\n\n`;
    
    report += `| Severity | Count |\n`;
    report += `|----------|-------|\n`;
    report += `| Critical | ${results.summary.critical_severity} |\n`;
    report += `| High | ${results.summary.high_severity} |\n`;
    report += `| Medium | ${results.summary.medium_severity} |\n`;
    report += `| Low | ${results.summary.low_severity} |\n\n`;
    
    if (results.vulnerabilities && results.vulnerabilities.length > 0) {
        report += `## Vulnerabilities\n\n`;
        results.vulnerabilities.forEach((vuln, index) => {
            report += `### ${index + 1}. ${vuln.title}\n\n`;
            report += `- **Severity:** ${vuln.severity.toUpperCase()}\n`;
            report += `- **Endpoint:** \`${vuln.endpoint}\` [\`${vuln.method}\`]\n`;
            report += `- **Description:** ${vuln.description}\n`;
            report += `- **Recommendation:** ${vuln.recommendation}\n\n`;
        });
    }
    
    return report;
}

// Execute if called directly
if (require.main === module) {
    const success = parseScanResults();
    process.exit(success ? 0 : 1);
}

module.exports = { parseScanResults };