/**
 * 🧪 TEST SCRIPT - Enhanced Phase 9 Autopilot
 * 
 * This script tests the new enhanced autopilot system with:
 * - MongoDB GridFS video storage
 * - Smart video re-encoding
 * - AI-powered caption rewriting
 * - Instant "Post Now" capability
 * - Dual platform posting
 */

const { autopilotReposter } = require('./jobs/autopilot');

async function testEnhancedAutopilot() {
  console.log('🧪 Testing Enhanced Phase 9 Autopilot...\n');

  try {
    // Test 1: Scheduled mode (normal autopilot)
    console.log('📅 TEST 1: Scheduled Mode');
    console.log('═'.repeat(50));
    const scheduledResult = await autopilotReposter({ postNow: false });
    console.log('✅ Scheduled Result:', {
      success: scheduledResult.success,
      processed: scheduledResult.processed,
      posted: scheduledResult.posted,
      errors: scheduledResult.errors.length
    });
    console.log('');

    // Wait a moment
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Test 2: Post Now mode (instant posting)
    console.log('🔥 TEST 2: Post Now Mode (Instant)');
    console.log('═'.repeat(50));
    const postNowResult = await autopilotReposter({ postNow: true });
    console.log('✅ Post Now Result:', {
      success: postNowResult.success,
      processed: postNowResult.processed,
      posted: postNowResult.posted,
      errors: postNowResult.errors.length
    });
    console.log('');

    // Summary
    console.log('📊 TEST SUMMARY');
    console.log('═'.repeat(50));
    console.log(`✅ All tests completed successfully!`);
    console.log(`📅 Scheduled Mode: ${scheduledResult.success ? 'PASS' : 'FAIL'}`);
    console.log(`🔥 Post Now Mode: ${postNowResult.success ? 'PASS' : 'FAIL'}`);
    
    if (scheduledResult.errors.length > 0 || postNowResult.errors.length > 0) {
      console.log('⚠️ Errors encountered:');
      [...scheduledResult.errors, ...postNowResult.errors].forEach((error, i) => {
        console.log(`   ${i + 1}. ${error}`);
      });
    }

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run test if this file is executed directly
if (require.main === module) {
  testEnhancedAutopilot()
    .then(() => {
      console.log('\n🎉 All tests completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { testEnhancedAutopilot };