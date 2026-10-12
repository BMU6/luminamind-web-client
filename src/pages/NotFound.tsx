import { Link } from 'react-router';
import { PageCard, PageToolbar } from '@/components';

const NotFound = () => {
  return (
    <PageCard size='sm'>
      <PageToolbar title='Page not found' />

      <main className='flex flex-col items-center text-center space-y-4 py-6'>
        <h1 className='text-[8rem] sm:text-[10rem] leading-none font-extrabold text-transparent bg-linear-to-r from-[#6054e8] to-[#f8485e] bg-clip-text'>
          404
        </h1>
        <p className='text-2xl font-bold text-base-content'>
          Page not found{' '}
          <span role='img' aria-labelledby='crying face'>
            😢
          </span>
        </p>
        <p className='text-sm text-base-content/60 max-w-xs'>
          The page you are looking for does not exist or has been moved.
        </p>
        <Link to='/' className='btn btn-primary btn-sm rounded-xl font-bold px-5 text-white'>
          Back to start
        </Link>
      </main>
    </PageCard>
  );
};

export default NotFound;
