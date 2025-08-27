import axios, { AxiosInstance } from 'axios';
import { fetchAuthSession } from '@aws-amplify/auth';

const API_BASE_URL = import.meta.env.VITE_USERS_API_URL as string | undefined;
const API_KEY = import.meta.env.VITE_API_KEY as string | undefined;

function createClient(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 15000,
  });

  instance.interceptors.request.use(async (config) => {
    try {
      const session = await fetchAuthSession();
      const accessToken = session?.tokens?.accessToken?.toString();
      if (accessToken) {
        config.headers = {
          ...config.headers,
          Authorization: `Bearer ${accessToken}`,
        };
      }
    } catch {
      // ignore if not signed in
    }

    if (API_KEY) {
      config.headers = {
        ...config.headers,
        'x-api-key': API_KEY,
      };
    }

    return config;
  });

  return instance;
}

export type CognitoUserSummary = {
  username: string;
  status?: string;
  enabled?: boolean;
  email?: string;
  createdAt?: string;
};

const client = createClient();

export async function fetchUsers(): Promise<CognitoUserSummary[]> {
  if (!API_BASE_URL) throw new Error('VITE_USERS_API_URL is not set');
  const { data } = await client.get<CognitoUserSummary[]>('/');
  return data;
}



