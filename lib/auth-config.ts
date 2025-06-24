import { Configuration, PopupRequest } from '@azure/msal-browser';

// TODO: Replace with your actual Azure AD configuration
export const msalConfig: Configuration = {
  auth: {
    clientId: 'your-client-id-here', // TODO: Replace with actual client ID
    authority: 'https://login.microsoftonline.com/common',
    redirectUri: '/',
  },
  cache: {
    cacheLocation: 'localStorage',
    storeAuthStateInCookie: false,
  },
};

export const loginRequest: PopupRequest = {
  scopes: ['User.Read', 'Mail.Read'],
  prompt: 'select_account',
};