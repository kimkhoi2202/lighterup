/**
 * Test script for messaging API endpoints
 * Run with: node test-messaging-api.js
 * 
 * Note: This requires authentication cookies. You'll need to:
 * 1. Sign in through the browser
 * 2. Copy the sb-access-token cookie
 * 3. Set it as COOKIE_VALUE below
 */

const BASE_URL = 'http://localhost:3003';
const COOKIE_VALUE = 'YOUR_COOKIE_HERE'; // Replace with actual cookie from browser

async function testConversations() {
  console.log('\n=== Testing GET /api/conversations ===');
  
  try {
    const response = await fetch(`${BASE_URL}/api/conversations`, {
      method: 'GET',
      headers: {
        'Cookie': `sb-access-token=${COOKIE_VALUE}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok && data.conversations) {
      console.log(`✓ Found ${data.conversations.length} conversations`);
      return data.conversations[0]?.id;
    } else {
      console.log('✗ Error:', data.error);
    }
  } catch (error) {
    console.error('✗ Request failed:', error.message);
  }
  
  return null;
}

async function testGetMessages(conversationId) {
  if (!conversationId) {
    console.log('\n=== Skipping GET messages (no conversation ID) ===');
    return;
  }

  console.log(`\n=== Testing GET /api/conversations/${conversationId}/messages ===`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
      method: 'GET',
      headers: {
        'Cookie': `sb-access-token=${COOKIE_VALUE}`,
        'Content-Type': 'application/json',
      },
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log(`✓ Found ${data.messages?.length || 0} messages`);
    } else {
      console.log('✗ Error:', data.error);
    }
  } catch (error) {
    console.error('✗ Request failed:', error.message);
  }
}

async function testSendMessage(conversationId) {
  if (!conversationId) {
    console.log('\n=== Skipping POST message (no conversation ID) ===');
    return;
  }

  console.log(`\n=== Testing POST /api/conversations/${conversationId}/messages ===`);
  
  try {
    const response = await fetch(`${BASE_URL}/api/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Cookie': `sb-access-token=${COOKIE_VALUE}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: 'Test message from API test script',
      }),
    });

    console.log('Status:', response.status);
    const data = await response.json();
    console.log('Response:', JSON.stringify(data, null, 2));
    
    if (response.ok) {
      console.log('✓ Message sent successfully');
    } else {
      console.log('✗ Error:', data.error);
    }
  } catch (error) {
    console.error('✗ Request failed:', error.message);
  }
}

// Run tests
async function runTests() {
  console.log('Testing Messaging API Endpoints');
  console.log('================================');
  
  if (COOKIE_VALUE === 'YOUR_COOKIE_HERE') {
    console.log('\n⚠️  Please set COOKIE_VALUE with your authentication cookie');
    console.log('   You can get it from browser DevTools > Application > Cookies');
    return;
  }

  const conversationId = await testConversations();
  await testGetMessages(conversationId);
  await testSendMessage(conversationId);
  
  console.log('\n=== Tests Complete ===');
}

runTests();


