import { AUTH_URL } from '@/config';
import { setAccessToken } from '@/storage';

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

window.fetch = async (url, options) => {
  const res = await originalFetch(url, options);

  // Normal case: token is fine, return the response untouched
  if (!res.headers.get('www-authenticate')?.includes('token_expired')) return res;

  try {
    refreshing ??= refreshAccessToken().finally(() => {
      refreshing = null;
    });
    const accessToken = await refreshing;

    // Repeat the original request with the new token
    return await originalFetch(url, {
      ...options,
      headers: { ...options?.headers, Authorization: `Bearer ${accessToken}` },
    });
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
