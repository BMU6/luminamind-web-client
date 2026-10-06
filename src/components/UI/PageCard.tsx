import type { ReactNode } from 'react';

const WIDTH = {
  sm: 'max-w-2xl', // forms, details
  md: 'max-w-3xl', // lists
  lg: 'max-w-6xl', // wide pages like the Home chart
} as const;

type PageCardProps = { size?: keyof typeof WIDTH; children: ReactNode };

// The frame every page lives in: light grey page background and one white rounded card.
// Change the look here and every page follows.
const PageCard = ({ size = 'md', children }: PageCardProps) => (
  <div className='min-h-screen bg-base-200 flex justify-center items-start p-4 sm:p-10 font-sans antialiased text-base-content'>
    <div
      className={`w-full ${WIDTH[size]} bg-base-100 border border-base-200 rounded-3xl p-6 sm:p-8 space-y-8 shadow-xl`}
    >
      {children}
    </div>
  </div>
);

export default PageCard;
