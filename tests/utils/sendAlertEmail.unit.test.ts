import { sendAlertEmail } from '../../utils/email/sendAlertEmail';

// Unit test for email alerts
export async function testSendAlertEmail() {
  try {
    await sendAlertEmail('Test subject', 'This is only a test');
    console.log('✅ sendAlertEmail unit test passed');
    return true;
  } catch (error) {
    console.error('❌ sendAlertEmail unit test failed:', error);
    return false;
  }
} 