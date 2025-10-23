// Run this in your browser console after logging in to analyze tokens
console.log('🔍 TOKEN ANALYSIS');
console.log('================');

// Check all possible token sources
const amplifyIdToken = localStorage.getItem('amplify-id-token') || 
                      localStorage.getItem('CognitoIdentityServiceProvider.7qqdba5o1co51g0at68hu16d8p.vishal7890.idToken') ||
                      sessionStorage.getItem('amplify-id-token');

const amplifyAccessToken = localStorage.getItem('amplify-access-token') || 
                          localStorage.getItem('CognitoIdentityServiceProvider.7qqdba5o1co51g0at68hu16d8p.vishal7890.accessToken') ||
                          sessionStorage.getItem('amplify-access-token');

const customIdToken = localStorage.getItem('id_token');
const customAccessToken = localStorage.getItem('access_token');

console.log('📦 Available Tokens:');
console.log('- Amplify ID Token:', amplifyIdToken ? 'EXISTS' : 'NONE');
console.log('- Amplify Access Token:', amplifyAccessToken ? 'EXISTS' : 'NONE'); 
console.log('- Custom ID Token:', customIdToken ? 'EXISTS' : 'NONE');
console.log('- Custom Access Token:', customAccessToken ? 'EXISTS' : 'NONE');

// Decode and analyze each available token
function analyzeToken(tokenName, token) {
  if (!token) return;
  
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const now = Math.floor(Date.now() / 1000);
    
    console.log(`\n🎫 ${tokenName}:`);
    console.log('- Length:', token.length);
    console.log('- token_use:', payload.token_use);
    console.log('- aud:', payload.aud);
    console.log('- iss:', payload.iss);
    console.log('- client_id:', payload.client_id || 'MISSING');
    console.log('- scope:', payload.scope || 'MISSING');
    console.log('- exp:', new Date(payload.exp * 1000).toISOString());
    console.log('- expired:', payload.exp < now ? '❌ YES' : '✅ NO');
    console.log('- username:', payload['cognito:username'] || payload.username || 'MISSING');
    console.log('- email:', payload.email || 'MISSING');
    console.log('- Preview:', token.substring(0, 60) + '...');
    
    // Store for easy copying
    window[`${tokenName.toLowerCase().replace(' ', '_')}_token`] = token;
    console.log(`- Available as: window.${tokenName.toLowerCase().replace(' ', '_')}_token`);
    
  } catch (e) {
    console.error(`❌ Failed to decode ${tokenName}:`, e);
  }
}

// Analyze all available tokens
analyzeToken('Amplify ID', amplifyIdToken);
analyzeToken('Amplify Access', amplifyAccessToken);
analyzeToken('Custom ID', customIdToken);
analyzeToken('Custom Access', customAccessToken);

console.log('\n🎯 WHAT THE APP SHOULD USE:');
console.log('For API Gateway calls, we need:');
console.log('- token_use: "access"');
console.log('- scope: "openid email profile" (or similar OAuth scopes)');
console.log('- client_id: "7qqdba5o1co51g0at68hu16d8p"');
console.log('- NOT scope: "aws.cognito.signin.user.admin"');

console.log('\n📋 COPY COMMANDS:');
console.log('// Copy any token to clipboard:');
console.log('// navigator.clipboard.writeText(window.amplify_access_token);');
console.log('// navigator.clipboard.writeText(window.custom_access_token);');
