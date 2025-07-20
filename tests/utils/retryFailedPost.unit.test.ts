import { retryFailedPost } from '../../utils/retry/retryFailedPost';

// Unit test for retry logic
export async function testRetryFailedPost() {
  try {
    const result = await retryFailedPost('test123');
    
    // Check that result is a boolean
    if (typeof result !== 'boolean') {
      throw new Error('retryFailedPost should return a boolean');
    }
    
    console.log('✅ retryFailedPost unit test passed');
    return true;
  } catch (error) {
    console.error('❌ retryFailedPost unit test failed:', error);
    return false;
  }
} 