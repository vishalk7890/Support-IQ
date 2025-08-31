import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from '@aws-amplify/auth';
import { CognitoIdentityClient, GetCredentialsForIdentityCommand, GetIdCommand } from '@aws-sdk/client-cognito-identity';

type AWSCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken?: string;
  expiration?: Date;
};

type AuthenticatedUser = {
  userId: string;
  username: string;
  email?: string;
  credentials?: AWSCredentials;
};

type LoginResult = {
  status: 'SIGNED_IN' | 'NEEDS_CONFIRMATION' | 'RESET_REQUIRED' | 'MFA_REQUIRED' | 'UNKNOWN_STEP';
  nextStep?: string;
};

type AuthContextValue = {
  user: AuthenticatedUser | null;
  loading: boolean;
  login: (params: { email: string; password: string }) => Promise<LoginResult>;
  register: (params: { name: string; email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  getJwtToken: () => Promise<string | null>;
  getOAuthToken: () => Promise<string | null>;
  getAWSCredentials: () => Promise<AWSCredentials | null>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const getJwtToken = useCallback(async (): Promise<string | null> => {
    try {
      const session = await fetchAuthSession();
      // Return ID token for API Gateway Cognito User Pool authorizer
      return session?.tokens?.idToken?.toString() || null;
    } catch (error) {
      console.error('Failed to get JWT token:', error);
      return null;
    }
  }, []);

  const getOAuthToken = useCallback(async (): Promise<string | null> => {
    try {
      console.log('🔍 AuthContext: Attempting to get auth session...');
      const session = await fetchAuthSession();
      console.log('🔍 AuthContext: Session received:', !!session);
      console.log('🔍 AuthContext: Has tokens:', !!session?.tokens);
      console.log('🔍 AuthContext: Has ID token:', !!session?.tokens?.idToken);
      console.log('🔍 AuthContext: Has access token:', !!session?.tokens?.accessToken);
      
      // THIS API Gateway expects ACCESS tokens, not ID tokens!
      const accessToken = session?.tokens?.accessToken?.toString();
      const idToken = session?.tokens?.idToken?.toString();
      
      // Use ACCESS token first (this is what works with your API Gateway)
      const token = accessToken || idToken || null;
      console.log('🔍 AuthContext: Using token type:', accessToken ? 'ACCESS' : idToken ? 'ID' : 'NONE');
      console.log('🔍 AuthContext: Final token:', token ? 'Token available' : 'No token');
      return token;
    } catch (error) {
      console.error('Failed to get token for API Gateway:', error);
      return null;
    }
  }, []);

  const mapUser = useCallback(async (): Promise<AuthenticatedUser | null> => {
    try {
      console.log('🔍 AuthContext: Mapping user...');
      const cognitoUser = await getCurrentUser();
      console.log('🔍 AuthContext: Cognito user:', cognitoUser);
      
      const session = await fetchAuthSession();
      console.log('🔍 AuthContext: Session for mapUser:', !!session);
      console.log('🔍 AuthContext: Session tokens:', !!session?.tokens);
      
      const email = (session?.tokens?.idToken?.payload as Record<string, unknown>)?.email as string | undefined;
      
      const user = {
        userId: cognitoUser.userId,
        username: cognitoUser.username,
        email,
      };
      
      console.log('🔍 AuthContext: Mapped user:', user);
      return user;
    } catch (error) {
      console.error('❌ AuthContext: Error mapping user:', error);
      return null;
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const mapped = await mapUser();
    setUser(mapped);
    setLoading(false);
  }, [mapUser]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async ({ email, password }: { email: string; password: string }): Promise<LoginResult> => {
    try {
      const output = await signIn({ username: email, password });
      
      if (output.isSignedIn) {
        const mapped = await mapUser();
        setUser(mapped);
        return { status: 'SIGNED_IN' };
      }
      
      // Handle next steps
      if (output.nextStep) {
        const step = output.nextStep.signInStep;
        
        switch (step) {
          case 'CONFIRM_SIGN_UP':
            return { status: 'NEEDS_CONFIRMATION', nextStep: step };
          case 'RESET_PASSWORD':
          case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
            return { status: 'RESET_REQUIRED', nextStep: step };
          case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
          case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
            return { status: 'MFA_REQUIRED', nextStep: step };
          default:
            return { status: 'UNKNOWN_STEP', nextStep: step };
        }
      }
      
      return { status: 'UNKNOWN_STEP' };
    } catch (error: any) {
      console.error('Login failed:', error);
      throw error;
    }
  }, [mapUser]);

  const register = useCallback(async ({ name, email, password }: { name: string; email: string; password: string }) => {
    await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
          name,
        },
      },
    });
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setUser(null);
  }, []);

  const getAWSCredentials = useCallback(async (): Promise<AWSCredentials | null> => {
    try {
      console.log('🔍 AuthContext: Getting AWS credentials...');
      
      // Get the current auth session to get ID token
      const session = await fetchAuthSession();
      const idToken = session?.tokens?.idToken?.toString();
      
      if (!idToken) {
        throw new Error('No ID token available for credential exchange');
      }

      console.log('🔍 AuthContext: ID token available, exchanging for AWS credentials');

      // Get environment variables
      const region = (import.meta.env as any).VITE_AWS_REGION || 'us-east-1';
      const identityPoolId = (import.meta.env as any).VITE_COGNITO_IDENTITY_POOL_ID;
      const userPoolId = (import.meta.env as any).VITE_COGNITO_USER_POOL_ID;

      if (!identityPoolId || !userPoolId) {
        throw new Error('Missing required environment variables for AWS credentials');
      }

      // Create Cognito Identity client
      const cognitoIdentityClient = new CognitoIdentityClient({
        region: region,
      });

      // Get identity ID
      const getIdCommand = new GetIdCommand({
        IdentityPoolId: identityPoolId,
        Logins: {
          [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken,
        },
      });

      const identityResponse = await cognitoIdentityClient.send(getIdCommand);
      const identityId = identityResponse.IdentityId;

      if (!identityId) {
        throw new Error('Failed to get identity ID from Cognito Identity Pool');
      }

      console.log('🔍 AuthContext: Got identity ID, getting credentials');

      // Get credentials for identity
      const getCredentialsCommand = new GetCredentialsForIdentityCommand({
        IdentityId: identityId,
        Logins: {
          [`cognito-idp.${region}.amazonaws.com/${userPoolId}`]: idToken,
        },
      });

      const credentialsResponse = await cognitoIdentityClient.send(getCredentialsCommand);
      const credentials = credentialsResponse.Credentials;

      if (!credentials || !credentials.AccessKeyId || !credentials.SecretKey) {
        throw new Error('Failed to get valid AWS credentials from Cognito Identity Pool');
      }

      console.log('✅ AuthContext: Successfully obtained AWS credentials');

      const awsCredentials: AWSCredentials = {
        accessKeyId: credentials.AccessKeyId,
        secretAccessKey: credentials.SecretKey,
        sessionToken: credentials.SessionToken,
        expiration: credentials.Expiration,
      };

      // Update user with credentials
      setUser(prev => prev ? { ...prev, credentials: awsCredentials } : null);

      return awsCredentials;
    } catch (error) {
      console.error('❌ AuthContext: Error getting AWS credentials:', error);
      return null;
    }
  }, []);

  const value = useMemo<AuthContextValue>(() => ({ 
    user, 
    loading, 
    login, 
    register, 
    logout, 
    refresh, 
    getJwtToken,
    getOAuthToken,
    getAWSCredentials
  }), [user, loading, login, register, logout, refresh, getJwtToken, getOAuthToken, getAWSCredentials]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};