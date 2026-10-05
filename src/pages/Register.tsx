import { useState } from 'react';
import { Link, Navigate } from 'react-router';
import { toast } from 'react-toastify';
import type { RegisterData } from '@/types';
import { useAuth } from '@/context';
import { PageCard, PageToolbar } from '@/components';

const Register = () => {
  const [{ email, password, confirmPassword }, setForm] = useState<RegisterData>({
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [loading, setLoading] = useState(false);
  const { signedIn, handleRegister } = useAuth();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
      if (!email || !password || !confirmPassword) throw new Error('All fields are required');
      if (password !== confirmPassword) throw new Error('Passwords do not match');
      setLoading(true);
      // TODO: Implement registration logic
      await handleRegister({
        email,
        password,
        confirmPassword,
      });
      toast.success('Registration successful');
    } catch (error: unknown) {
      const message = (error as { message: string }).message;
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  if (signedIn) {
    return <Navigate to='/' />;
  } else {
    return (
      <PageCard size='sm'>
        <PageToolbar title='Register' />
        <form className='flex flex-col gap-4' onSubmit={handleSubmit}>
          <label className='input rounded-xl w-full flex items-center gap-2 border border-base-content/30 bg-base-100 focus-within:border-primary'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 16 16'
              fill='currentColor'
              className='h-4 w-4 opacity-70'
            >
              <path d='M2.5 3A1.5 1.5 0 0 0 1 4.5v.793c.026.009.051.02.076.032L7.674 8.51c.206.1.446.1.652 0l6.598-3.185A.755.755 0 0 1 15 5.293V4.5A1.5 1.5 0 0 0 13.5 3h-11Z' />
              <path d='M15 6.954 8.978 9.86a2.25 2.25 0 0 1-1.956 0L1 6.954V11.5A1.5 1.5 0 0 0 2.5 13h11a1.5 1.5 0 0 0 1.5-1.5V6.954Z' />
            </svg>
            <input
              name='email'
              value={email}
              onChange={handleChange}
              type='email'
              className='grow'
              placeholder='Email'
            />
          </label>
          <label className='input rounded-xl w-full flex items-center gap-2 border border-base-content/30 bg-base-100 focus-within:border-primary'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 16 16'
              fill='currentColor'
              className='h-4 w-4 opacity-70'
            >
              <path
                fillRule='evenodd'
                d='M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z'
                clipRule='evenodd'
              />
            </svg>
            <input
              name='password'
              value={password}
              onChange={handleChange}
              type='password'
              className='grow'
              placeholder='Password'
            />
          </label>
          <label className='input rounded-xl w-full flex items-center gap-2 border border-base-content/30 bg-base-100 focus-within:border-primary'>
            <svg
              xmlns='http://www.w3.org/2000/svg'
              viewBox='0 0 16 16'
              fill='currentColor'
              className='h-4 w-4 opacity-70'
            >
              <path
                fillRule='evenodd'
                d='M14 6a4 4 0 0 1-4.899 3.899l-1.955 1.955a.5.5 0 0 1-.353.146H5v1.5a.5.5 0 0 1-.5.5h-2a.5.5 0 0 1-.5-.5v-2.293a.5.5 0 0 1 .146-.353l3.955-3.955A4 4 0 1 1 14 6Zm-4-2a.75.75 0 0 0 0 1.5.5.5 0 0 1 .5.5.75.75 0 0 0 1.5 0 2 2 0 0 0-2-2Z'
                clipRule='evenodd'
              />
            </svg>
            <input
              name='confirmPassword'
              value={confirmPassword}
              onChange={handleChange}
              type='password'
              className='grow'
              placeholder='Confirm your password...'
            />
          </label>
          <small>
            Already have an account?{' '}
            <Link to='/login' className='text-primary hover:underline'>
              Log in!
            </Link>
          </small>
          <button className='btn btn-primary self-center rounded-xl px-8' disabled={loading}>
            Create Account
          </button>
        </form>
      </PageCard>
    );
  }
};
export default Register;
