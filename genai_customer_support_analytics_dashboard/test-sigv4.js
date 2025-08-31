// Quick test script to verify SigV4 authentication setup
const { execSync } = require('child_process');

console.log('🔍 Testing SigV4 Authentication Setup...\n');

// Check if required dependencies are installed
const requiredDeps = [
  '@aws-sdk/client-cognito-identity',
  '@aws-sdk/signature-v4',
  '@aws-sdk/util-format-url',
  '@aws-crypto/sha256-js'
];

console.log('1. Checking dependencies...');
try {
  const packageJson = require('./package.json');
  const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  requiredDeps.forEach(dep => {
    if (allDeps[dep]) {
      console.log(`   ✅ ${dep}: ${allDeps[dep]}`);
    } else {
      console.log(`   ❌ ${dep}: NOT INSTALLED`);
    }
  });
} catch (error) {
  console.log('   ❌ Error reading package.json:', error.message);
}

// Check environment variables
console.log('\n2. Checking environment variables...');
const fs = require('fs');
try {
  const envContent = fs.readFileSync('.env.local', 'utf8');
  const requiredEnvVars = [
    'VITE_AWS_REGION',
    'VITE_COGNITO_USER_POOL_ID',
    'VITE_COGNITO_USER_POOL_CLIENT_ID',
    'VITE_COGNITO_IDENTITY_POOL_ID'
  ];
  
  requiredEnvVars.forEach(envVar => {
    if (envContent.includes(envVar)) {
      const match = envContent.match(new RegExp(`${envVar}=(.+)`));
      const value = match ? match[1].trim() : 'EMPTY';
      console.log(`   ✅ ${envVar}: ${value}`);
    } else {
      console.log(`   ❌ ${envVar}: NOT FOUND`);
    }
  });
} catch (error) {
  console.log('   ❌ Error reading .env.local:', error.message);
}

// Check TypeScript compilation
console.log('\n3. Checking TypeScript compilation...');
try {
  execSync('npx tsc --noEmit', { stdio: 'pipe' });
  console.log('   ✅ TypeScript compilation successful');
} catch (error) {
  console.log('   ❌ TypeScript compilation failed:');
  console.log('   ', error.stdout?.toString() || error.message);
}

console.log('\n🎯 SigV4 Setup Test Complete!');
console.log('\nNext steps:');
console.log('1. Start the dev server: npm run dev');
console.log('2. Login with your Cognito credentials');
console.log('3. Check browser console for SigV4 authentication logs');
console.log('4. Test API calls in the dashboard');
