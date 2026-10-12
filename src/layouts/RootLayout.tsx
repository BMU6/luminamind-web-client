import { Outlet } from 'react-router';
import { ToastContainer } from 'react-toastify';
import { Navbar } from '@/components';
import 'react-toastify/dist/ReactToastify.css';

const RootLayout = () => {
  return (
    <div>
      <ToastContainer position='bottom-left' autoClose={1500} theme='colored' />
      <Navbar />
      <Outlet />
    </div>
  );
};

export default RootLayout;
