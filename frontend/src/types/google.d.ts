declare namespace google {
  namespace accounts {
    namespace oauth2 {
      interface TokenResponse {
        access_token: string;
      }

      interface TokenClientConfig {
        client_id: string;
        scope: string;
        callback: (response: TokenResponse) => void;
        prompt?: 'consent' | 'select_account';
        access_type?: 'offline' | 'online';
        redirect_uri?: string;
      }

      interface TokenClient {
        requestAccessToken(config?: { prompt?: string }): void;
      }

      function initTokenClient(config: TokenClientConfig): TokenClient;
    }
  }
}