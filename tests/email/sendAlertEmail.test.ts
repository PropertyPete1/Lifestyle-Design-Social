import { sendAlertEmail } from '../../utils/email/sendAlertEmail';

// Test that sendAlertEmail works without throwing
export async function testSendAlertEmail() {
  try {
    await sendAlertEmail('Test Subject', 'Test body');
    console.log('✅ sendAlertEmail test passed');
    return true;
  } catch (error) {
    console.error('❌ sendAlertEmail test failed:', error);
    return false;
  }
} 