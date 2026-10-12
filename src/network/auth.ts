import { AUTH_URL } from '@/config';
import type { User, RegisterData, LoginData } from '@/types';
import { getAccessToken } from '@/storage';

type SuccessRes = { message: string };

type TokenRes = SuccessRes & { accessToken: string };

const login = async (formData: LoginData): Promise<TokenRes> => {
  const res = await fetch(`${AUTH_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(formData),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error ?? 'An error occurred logging in.');
  }

  const data = (await res.json()) as TokenRes;

  return data;
};

const me = async (): Promise<User> => {
  const accessToken = getAccessToken();
  const res = await fetch(`${AUTH_URL}/me`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error ?? 'An error occurred fetching your profile.');
  }

  const { user } = (await res.json()) as SuccessRes & { user: User };

  return user;
};

const logout = async (): Promise<TokenRes> => {
  const res = await fetch(`${AUTH_URL}/logout`, {
    method: 'DELETE',
    credentials: 'include',
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error ?? 'An error occurred logging out');
  }

  const data = (await res.json()) as TokenRes;

  return data;
};

const register = async (formData: RegisterData): Promise<TokenRes> => {
  const res = await fetch(`${AUTH_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(formData),
  });
  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error ?? 'An error occurred with registration.');
  }

  const data = (await res.json()) as TokenRes;

  return data;
};

const refresh = async (): Promise<TokenRes> => {
  const res = await fetch(`${AUTH_URL}/refresh`, {
    method: 'POST',
    credentials: 'include',
  });

  if (!res.ok) {
    const errorData = await res.json();
    throw new Error(errorData?.error ?? 'Unable to refresh the session.');
  }

  const data = (await res.json()) as TokenRes;

  return data;
};

export { login, me, logout, register, refresh };
