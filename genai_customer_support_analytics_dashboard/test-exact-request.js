// Run this in browser console to test the exact request your app makes
async function testExactAppRequest() {
  console.log('🧪 Testing exact app request...');
  
  // Get the ID token (the one with aud claim)
  const idToken = localStorage.getItem('CognitoIdentityServiceProvider.7qqdba5o1co51g0at68hu16d8p.vishal7890.idToken');
  
  if (!idToken) {
    console.error('❌ No ID token found in localStorage');
    return;
  }
  
  // Decode token to check aud claim
  try {
    const payload = JSON.parse(atob(idToken.split('.')[1]));
    console.log('🎫 ID Token claims:');
    console.log('- aud:', payload.aud);
    console.log('- iss:', payload.iss);
    console.log('- token_use:', payload.token_use);
    console.log('- exp:', new Date(payload.exp * 1000));
    console.log('- expired:', payload.exp < (Date.now() / 1000) ? '❌ YES' : '✅ NO');
  } catch (e) {
    console.error('❌ Could not decode token:', e);
  }
  
  // Make the exact same request as your app
  console.log('📡 Making API request...');
  
  try {
    const response = await fetch('https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod/list', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${idToken}`,
        // Add CORS headers that might be required
        'Accept': 'application/json',
        'Origin': 'http://localhost:5173'
      }
    });
    
    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📡 Response body length:', responseText.length);
    
    if (response.ok) {
      console.log('✅ SUCCESS! App-style request worked');
      console.log('📊 Data preview:', responseText.substring(0, 200) + '...');
    } else {
      console.log('❌ FAILED with same error as app');
      console.log('📡 Error response:', responseText);
      
      // Compare with curl request
      console.log('🔍 Let\'s compare with curl-style request...');
      
      const curlResponse = await fetch('https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod/list', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`
          // NO Content-Type or Origin headers (like curl)
        }
      });
      
      console.log('🔍 Curl-style status:', curlResponse.status);
      if (curlResponse.ok) {
        console.log('🎯 CURL-STYLE WORKS! The issue is extra headers');
      } else {
        console.log('🚨 Even curl-style fails - token issue');
      }
    }
    
  } catch (error) {
    console.error('❌ Request failed:', error);
  }
}

// Run the test
testExactAppRequest();
