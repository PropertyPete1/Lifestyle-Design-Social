import request from 'supertest';
import app from '../../app';

// Integration test for manual retry endpoint
export async function testManualRetryEndpoint() {
  try {
    // Test 1: Returns 400 if no postId
    const res1 = await request(app).post('/api/retry/manual').send({});
    if (res1.status !== 400) {
      throw new Error('Expected 400 status for missing postId');
    }
    
    // Test 2: Returns success boolean
    const res2 = await request(app)
      .post('/api/retry/manual')
      .send({ postId: 'abc123' });
    
    if (!res2.body.hasOwnProperty('success')) {
      throw new Error('Response should have success property');
    }
    
    console.log('✅ Manual retry integration test passed');
    return true;
  } catch (error) {
    console.error('❌ Manual retry integration test failed:', error);
    return false;
  }
} 