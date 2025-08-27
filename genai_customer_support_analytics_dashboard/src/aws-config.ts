import { Amplify } from 'aws-amplify';

const config = {
  Auth: {
    Cognito: {
      userPoolId: (import.meta.env as any).VITE_COGNITO_USER_POOL_ID || 'us-east-1_kmixUr4yq',
      userPoolClientId: (import.meta.env as any).VITE_COGNITO_USER_POOL_CLIENT_ID || '7qqdba5o1co51g0at68hu16d8p',
      region: (import.meta.env as any).VITE_AWS_REGION || 'us-east-1',
    }
  }
};

Amplify.configure(config);

export default config;
