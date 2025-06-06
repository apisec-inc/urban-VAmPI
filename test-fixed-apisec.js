require('dotenv').config();
const { APIsecCloudClient } = require('./scripts/apisec-client');

async function testFixedTriggerScan() {
    try {
        const client = new APIsecCloudClient({ debug: true });
        
        console.log('🧪 Testing FIXED triggerScan method...');
        
        // Test the fixed method
        const scanResult = await client.triggerScan();
        
        console.log('✅ SUCCESS! Scan triggered:', scanResult);
        
        // Test scan status check
        if (scanResult.scanId) {
            console.log('\n🔍 Testing scan status...');
            const status = await client.getScanStatus(null, null, scanResult.scanId);
            console.log('📊 Scan Status:', status);
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testFixedTriggerScan(); 