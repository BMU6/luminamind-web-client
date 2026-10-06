import { AUTH_URL, VITE_API_URL } from '@/config';
import { getAccessToken, setAccessToken } from '@/storage';

const originalFetch = window.fetch;

// If several requests fail at once, only one refresh call is made
let refreshing: Promise<string> | null = null;

const refreshAccessToken = async (): Promise<string> => {
  const res = await originalFetch(`${AUTH_URL}/refresh`, {
    method: 'POST',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Login required');

  const { accessToken } = await res.json();
  setAccessToken(accessToken);
  return accessToken;
};

// Calls to our API (but not the /auth routes) need the access token. It is added here once,
// so every page can simply call fetch(url) and does not have to care about the Authorization header.
const needsToken = (url: unknown): url is string =>
  typeof url === 'string' && url.startsWith(VITE_API_URL) && !url.startsWith(AUTH_URL);

const withToken = (options: RequestInit | undefined, token: string | null): RequestInit | undefined => {
  if (!token) return options;
  const headers = new Headers(options?.headers);
  if (!headers.has('Authorization')) headers.set('Authorization', `Bearer ${token}`);
  return { ...options, headers };
};

window.fetch = async (url, options) => {
  const apiCall = needsToken(url);
  const res = await originalFetch(url, apiCall ? withToken(options, getAccessToken()) : options);

  // Normal case: token is fine, return the response untouched
  if (!res.headers.get('www-authenticate')?.includes('token_expired')) return res;

  try {
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null;
    });
    const accessToken = await refreshing;

    // Repeat the original request with the new token
    const headers = new Headers(options?.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    return await originalFetch(url, { ...options, headers });
  } catch {
    // Refresh failed: return the original error response
    return res;
  }
};


// import { AUTH_URL } from '@/config';
// import { setAccessToken } from '@/storage';

// const originalFetch = window.fetch;

// window.fetch = async (url, options) => {
//   const originalRes = await originalFetch(url, options);
//   const authHeader = originalRes.headers.get('www-authenticate');
//   console.log(
//     'WWW-Authenticate:',
//     authHeader,
//     'IS THE TOKEN NOT EXPIRED:',
//     !authHeader?.includes('token_expired'),
//   );
//   if (!authHeader?.includes('token_expired')) return originalRes;

//   console.log('ATTEMPT REFRESH');
//   const refreshRes = await originalFetch(`${AUTH_URL}/refresh`, {
//     method: 'POST',
//     credentials: 'include',
//   });
//   if (!refreshRes.ok) throw new Error('Login required');

//   const { accessToken } = await refreshRes.json();
//   setAccessToken(accessToken);

//   const retryRes = await originalFetch(url, {
//     ...options,
//     headers: {
//       ...options?.headers,
//       Authorization: `Bearer ${accessToken}`,
//     },
//   });

//   return retryRes;
// };
