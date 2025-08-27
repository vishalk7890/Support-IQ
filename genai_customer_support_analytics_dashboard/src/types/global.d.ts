export {};

declare global {
  interface Window {
    pcaSettings?: {
      auth?: {
        uri?: string;
        clientId?: string;
      };
      api?: {
        pageSize?: number;
        uri?: string;
      };
      dashboard?: { uri?: string };
      genai?: { query?: boolean };
    };
  }
}


