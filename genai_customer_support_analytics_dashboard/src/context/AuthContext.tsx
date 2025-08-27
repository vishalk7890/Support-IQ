import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { signIn, signUp, signOut, getCurrentUser, fetchAuthSession } from '@aws-amplify/auth';
import { CognitoIdentityClient, GetIdCommand, GetCredentialsForIdentityCommand } from '@aws-sdk/client-cognito-identity';

type AWSCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
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
  getCredentials: () => Promise<AWSCredentials | null>;
};

// AWS Configuration - Update these with your actual values
const AWS_CONFIG = {
  region: (import.meta.env as any).VITE_AWS_REGION || 'us-east-1',
  identityPoolId: (import.meta.env as any).VITE_COGNITO_IDENTITY_POOL_ID || '',
  userPoolId: (import.meta.env as any).VITE_COGNITO_USER_POOL_ID || '',
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthenticatedUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const getAWSCredentials = useCallback(async (): Promise<AWSCredentials | null> => {
    try {
      const session = await fetchAuthSession();
      const idToken = session?.tokens?.idToken?.toString();
      
      if (!idToken || !AWS_CONFIG.identityPoolId) {
        return null;
      }

      const cognitoIdentityClient = new CognitoIdentityClient({
        region: AWS_CONFIG.region,
      });

      // Get Identity ID from Identity Pool
      const getIdCommand = new GetIdCommand({
        IdentityPoolId: AWS_CONFIG.identityPoolId,
        Logins: {
          [`cognito-idp.${AWS_CONFIG.region}.amazonaws.com/${AWS_CONFIG.userPoolId}`]: idToken,
        },
      });

      const identityResponse = await cognitoIdentityClient.send(getIdCommand);
      
      if (!identityResponse.IdentityId) {
        return null;
      }

      // Get temporary credentials
      const getCredentialsCommand = new GetCredentialsForIdentityCommand({
        IdentityId: identityResponse.IdentityId,
        Logins: {
          [`cognito-idp.${AWS_CONFIG.region}.amazonaws.com/${AWS_CONFIG.userPoolId}`]: idToken,
        },
      });

      const credentialsResponse = await cognitoIdentityClient.send(getCredentialsCommand);
      
      if (!credentialsResponse.Credentials) {
        return null;
      }

      return {
        accessKeyId: credentialsResponse.Credentials.AccessKeyId!,
        secretAccessKey: credentialsResponse.Credentials.SecretKey!,
        sessionToken: credentialsResponse.Credentials.SessionToken!,
        expiration: credentialsResponse.Credentials.Expiration,
      };
    } catch (error) {
      console.error('Failed to get AWS credentials:', error);
      return null;
    }
  }, []);

  const mapUser = useCallback(async (): Promise<AuthenticatedUser | null> => {
    try {
      const cognitoUser = await getCurrentUser();
      const session = await fetchAuthSession();
      const email = (session?.tokens?.idToken?.payload as Record<string, unknown>)?.email as string | undefined;
      
      // Fetch AWS credentials
      const credentials = await getAWSCredentials();
      
      return {
        userId: cognitoUser.userId,
        username: cognitoUser.username,
        email,
        credentials: credentials || undefined,
      };
    } catch {
      return null;
    }
  }, [getAWSCredentials]);

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
    const output = await signIn({ username: email, password });
    // If Amplify reports signed in, map and set user
    // @ts-expect-error: isSignedIn is available on v6 SignInOutput
    if ((output as any).isSignedIn) {
      const mapped = await mapUser();
      setUser(mapped);
      return { status: 'SIGNED_IN' };
    }
    // Handle next steps
    const step = (output as any)?.nextStep?.signInStep as string | undefined;
    if (step === 'DONE') {
      const mapped = await mapUser();
      setUser(mapped);
      return { status: 'SIGNED_IN' };
    }
    switch (step) {
      case 'CONFIRM_SIGN_UP':
        return { status: 'NEEDS_CONFIRMATION', nextStep: step };
      case 'RESET_PASSWORD':
        return { status: 'RESET_REQUIRED', nextStep: step };
      case 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED':
      case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
      case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
        return { status: 'MFA_REQUIRED', nextStep: step };
      case 'CONFIRM_SIGN_IN_WITH_SMS_CODE':
      case 'CONFIRM_SIGN_IN_WITH_TOTP_CODE':
        return { status: 'MFA_REQUIRED', nextStep: step };
      default:
        // As a fallback, if a session exists treat as signed in
        try {
          const mapped = await mapUser();
          if (mapped) {
            setUser(mapped);
            return { status: 'SIGNED_IN' };
          }
        } catch {}
        return { status: 'UNKNOWN_STEP', nextStep: step };
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

  const getCredentials = useCallback(async (): Promise<AWSCredentials | null> => {
    return user?.credentials ? user.credentials : await getAWSCredentials();
  }, [user?.credentials, getAWSCredentials]);

  const value = useMemo<AuthContextValue>(() => ({ user, loading, login, register, logout, refresh, getCredentials }), [user, loading, login, register, logout, refresh, getCredentials]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};


