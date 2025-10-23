// import { Amplify } from 'aws-amplify';

// // Configuration with OAuth for proper token generation (using custom UI)
// const config = {
//   Auth: {
//     Cognito: {
//       userPoolId: (import.meta.env as any).VITE_COGNITO_USER_POOL_ID || 'us-east-1_kmixUr4yq',
//       userPoolClientId: (import.meta.env as any).VITE_COGNITO_USER_POOL_CLIENT_ID || '7qqdba5o1co51g0at68hu16d8p',
//       region: (import.meta.env as any).VITE_AWS_REGION || 'us-east-1',
//       loginWith: {
//         oauth: {
//           domain: 'pca-1755221929659628847.auth.us-east-1.amazoncognito.com',
//           scopes: ['openid', 'email', 'profile', 'phone'],
//           redirectSignIn: ['http://localhost:5173/oauth/callback'],
//           redirectSignOut: ['http://localhost:5173/'],
//           responseType: 'code' as const
//         }
//       }
//     }
//   }
// };

// // App settings for API endpoints (OAuth settings removed since using custom login)
// if (typeof window !== 'undefined') {
//   (window as any).pcaSettings = {
//     api: {
//       pageSize: 25,
//       uri: 'https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod',
//     },
//     dashboard: {
//       uri: 'https://us-east-1.quicksight.aws.amazon.com/sn/start',
//     },
//     genai: {
//       query: true
//     }
//   };
// }

// Amplify.configure(config);
// export default config;


import { Amplify } from 'aws-amplify';


const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';


const fallbackOrigin = import.meta.env.VITE_APP_URL || 'http://localhost:5173';

const appOrigin = currentOrigin || fallbackOrigin;

// Configuration with OAuth
const config = {
  Auth: {
    Cognito: {
      userPoolId: (import.meta.env as any).VITE_COGNITO_USER_POOL_ID || 'us-east-1_kmixUr4yq',
      userPoolClientId: (import.meta.env as any).VITE_COGNITO_USER_POOL_CLIENT_ID || '7qqdba5o1co51g0at68hu16d8p',
      region: (import.meta.env as any).VITE_AWS_REGION || 'us-east-1',
      loginWith: {
        oauth: {
          domain: 'pca-1755221929659628847.auth.us-east-1.amazoncognito.com',
          scopes: ['openid'],
          redirectSignIn: [`${appOrigin}/oauth/callback`],
          redirectSignOut: [appOrigin],
          responseType: 'code' as const
        }
      }
    }
  }
};

// App settings (unchanged)
if (typeof window !== 'undefined') {
  (window as any).pcaSettings = {
    api: {
      pageSize: 25,
      uri: 'https://6wg7m9tsxg.execute-api.us-east-1.amazonaws.com/Prod',
    },
    dashboard: {
      uri: 'https://us-east-1.quicksight.aws.amazon.com/sn/start',
    },
    genai: {
      query: true
    }
  };
}

Amplify.configure(config);
export default config;