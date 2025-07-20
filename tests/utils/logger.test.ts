import { logStatus } from '../../utils/logger';

// Test that logStatus logs correctly
export function testLogStatus() {
  const originalConsoleLog = console.log;
  let loggedMessage = '';
  let wasCalled = false;
  
  // Mock console.log to capture output
  console.log = function(message: string) {
    loggedMessage = message;
    wasCalled = true;
  };
  
  try {
    logStatus('abc123', 'failed');
    
    // Check that console.log was called
    if (!wasCalled) {
      throw new Error('console.log was not called');
    }
    
    // Check that the logged message contains expected content
    if (!loggedMessage.includes('abc123')) {
      throw new Error('Logged message does not contain postId');
    }
    
    if (!loggedMessage.includes('failed')) {
      throw new Error('Logged message does not contain status');
    }
    
    console.log('✅ logStatus test passed');
    return true;
  } catch (error) {
    console.error('❌ logStatus test failed:', error);
    return false;
  } finally {
    // Restore original console.log
    console.log = originalConsoleLog;
  }
} 