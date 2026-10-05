import { z } from 'zod';

const envSchema = z.object({
	VITE_API_URL: z.url().default('http://localhost:3000'),
	// VITE_APP_AUTH_SERVER_URL: z.url().default('http://localhost:3001/auth')
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
	console.error(
		'❌ Invalid environment variables:\n',
		z.prettifyError(parsedEnv.error)
	);
	throw new Error('Invalid environment variables. Check the console for details.');
}

// export const { VITE_APP_API_URL, VITE_APP_AUTH_SERVER_URL } = parsedEnv.data;
export const { VITE_API_URL } = parsedEnv.data;
export const AUTH_URL = `${VITE_API_URL}/auth`;