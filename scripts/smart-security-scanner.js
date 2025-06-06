name: APIsec Security Scan

on:
  push:
    branches: [ develop ]
  pull_request:
    branches: [ develop ]
  workflow_dispatch:
    inputs:
      force_scan:
        description: 'Force APIsec scan'
        required: false
        default: true
        type: boolean

env:
  VAMPI_URL: https://urban-vampi-staging.up.railway.app
  APISEC_APP_NAME: vampi-demo
  FALLBACK_TO_MOCK: true

jobs:
  apisec-security-scan:
    runs-on: ubuntu-latest
    name: APIsec Security Scan
    
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          
      - name: Install Dependencies
        run: |
          echo "::group::📦 Installing APIsec scanning dependencies"
          echo "📦 Installing APIsec scanning dependencies..."
          npm install axios dotenv
          echo "::endgroup::"
          
      - name: Load Environment Variables
        run: |
          echo "::group::🔧 Loading Environment Configuration"
          if [ -f .env ]; then
            echo "📄 Loading environment variables from .env file..."
            set -a
            source .env
            set +a
            cat .env | grep -v '^#' | grep '=' >> $GITHUB_ENV
            echo "✅ Environment variables loaded"
          else
            echo "⚠️  No .env file found - using workflow defaults"
          fi
          echo "::endgroup::"
          
      - name: Validate Environment
        run: |
          echo "::group::🔍 Validating APIsec Configuration"
          echo "🔍 Validating APIsec configuration..."
          echo "Target URL: ${VAMPI_URL}"
          echo "App Name: ${APISEC_APP_NAME}"
          
          # Force mock mode until APIsec client is implemented
          echo "::warning title=Mock Mode::Using mock scanner until APIsec client is implemented"
          echo "::endgroup::"
          
      - name: Test API Availability
        run: |
          echo "::group::🌐 Testing Vampi API Availability"
          echo "🔍 Testing Vampi API availability..."
          curl -f ${VAMPI_URL}/health || curl -f ${VAMPI_URL}/ || {
            echo "::error title=API Unavailable::Vampi API is not accessible at ${VAMPI_URL}"
            exit 1
          }
          echo "::notice title=API Status::Vampi API is accessible and ready for scanning"
          echo "::endgroup::"
          
      - name: Run APIsec Security Scan
        env:
          APISEC_API_KEY: ${{ secrets.APISEC_API_KEY }}
          APISEC_APPLICATION_ID: ${{ secrets.APISEC_APPLICATION_ID }}
          APISEC_INSTANCE_ID: ${{ secrets.APISEC_INSTANCE_ID }}
          MEDUSA_URL: ${{ env.VAMPI_URL }}
          # Smart scanner configuration
          FAIL_ON_CRITICAL: true
          FAIL_ON_ANY_VULNERABILITIES: true
          MAX_SCAN_WAIT_TIME: 300000
          SCAN_POLL_INTERVAL: 15000
          EARLY_FAIL_CHECK: true
        run: |
          echo "::group::🔒 APIsec Security Scan Execution"
          echo "🔒 Starting smart APIsec security scan..."
          
          if [ -n "${{ secrets.APISEC_API_KEY }}" ]; then
            echo "::notice title=Smart Scan::Running smart APIsec scan with early failure detection"
            node scripts/smart-security-scanner.js
          else
            echo "::notice title=Mock Scan::Running mock APIsec scan (credentials not available)"
            node scripts/apisec-mock-scan.js
          fi
          echo "::endgroup::"
          
      - name: Parse Scan Results
        run: |
          echo "::group::📊 Processing Security Scan Results"
          echo "📊 Processing scan results..."
          if [ -f scan-results.json ]; then
            echo "::notice title=Results Found::Processing APIsec scan results"
            # Create basic parser if parse-scan-results.js doesn't exist
            if [ ! -f scripts/parse-scan-results.js ]; then
              echo "const results = require('../scan-results.json'); console.log('Parsed', results.summary.vulnerabilities_found, 'vulnerabilities');" > scripts/parse-scan-results.js
            fi
            node scripts/parse-scan-results.js
          else
            echo "::error title=No Results::No scan results file found"
            exit 1
          fi
          echo "::endgroup::"
          
      - name: Generate Security Report
        run: |
          echo "::group::📋 Generating Security Report"
          echo "# 🔒 Vampi APIsec Security Report" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          echo "**Target:** ${VAMPI_URL}" >> $GITHUB_STEP_SUMMARY
          echo "**Branch:** develop" >> $GITHUB_STEP_SUMMARY
          echo "**Timestamp:** $(date -u)" >> $GITHUB_STEP_SUMMARY
          echo "**Mode:** Mock Scan (APIsec client needs implementation)" >> $GITHUB_STEP_SUMMARY
          echo "" >> $GITHUB_STEP_SUMMARY
          
          if [ -f scan-results.json ]; then
            echo "## 📊 Scan Results" >> $GITHUB_STEP_SUMMARY
            
            CRITICAL=$(node -e "console.log(require('./scan-results.json').summary.critical_severity || 0)")
            HIGH=$(node -e "console.log(require('./scan-results.json').summary.high_severity || 0)")
            MEDIUM=$(node -e "console.log(require('./scan-results.json').summary.medium_severity || 0)")
            LOW=$(node -e "console.log(require('./scan-results.json').summary.low_severity || 0)")
            
            echo "| Severity | Count | Status |" >> $GITHUB_STEP_SUMMARY
            echo "|----------|-------|--------|" >> $GITHUB_STEP_SUMMARY
            echo "| 🔴 Critical | $CRITICAL | $([ $CRITICAL -eq 0 ] && echo "✅ Clean" || echo "🚨 Action Required") |" >> $GITHUB_STEP_SUMMARY
            echo "| 🟠 High | $HIGH | $([ $HIGH -eq 0 ] && echo "✅ Clean" || echo "⚠️ Review Needed") |" >> $GITHUB_STEP_SUMMARY
            echo "| 🟡 Medium | $MEDIUM | $([ $MEDIUM -eq 0 ] && echo "✅ Clean" || echo "📋 Monitor") |" >> $GITHUB_STEP_SUMMARY
            echo "| 🔵 Low | $LOW | $([ $LOW -eq 0 ] && echo "✅ Clean" || echo "ℹ️ Informational") |" >> $GITHUB_STEP_SUMMARY
            
            if [ "$CRITICAL" -gt 0 ]; then
              echo "" >> $GITHUB_STEP_SUMMARY
              echo "🚨 **Critical vulnerabilities found!**" >> $GITHUB_STEP_SUMMARY
              echo "::error title=Critical Vulnerabilities::$CRITICAL critical vulnerabilities require immediate attention"
            fi
          fi
          echo "::endgroup::"
          
      - name: Check Critical Vulnerabilities
        run: |
          echo "::group::🔍 Critical Vulnerability Assessment"
          if [ -f scan-results.json ]; then
            CRITICAL_COUNT=$(node -e "console.log(require('./scan-results.json').summary.critical_severity || 0)")
            
            if [ "$CRITICAL_COUNT" -gt 0 ]; then
              echo "::error title=Build Failed::$CRITICAL_COUNT critical vulnerabilities found - failing build"
              exit 1
            fi
            
            echo "::notice title=Security Check::✅ No critical vulnerabilities found"
          fi
          echo "::endgroup::"
          
      - name: Upload Scan Results
        uses: actions/upload-artifact@v4
        with:
          name: vampi-apisec-scan-results-${{ github.run_number }}
          path: |
            scan-results.json
            scan-report.md
          retention-days: 30