import type { ReactNode } from 'react';

type PageToolbarProps = {
  title: string;
  leading?: ReactNode; // directly next to the title (for example a "+" button or the visible date range)
  children?: ReactNode; // the actions on the right side
};

// The dark teal toolbar at the top of a page card: page title on the left, page actions on the right.
const PageToolbar = ({ title, leading, children }: PageToolbarProps) => (
  <header className='navbar bg-neutral/95 backdrop-blur-md text-white rounded-2xl px-5 py-3 shadow-lg flex flex-wrap gap-4 justify-between items-center border border-white/10'>
    <div className='flex items-center gap-3'>
      <span className='text-xs sm:text-sm font-bold tracking-widest uppercase text-secondary'>{title}</span>
      {leading}
    </div>
    {children && (
      <nav className='flex flex-wrap items-center gap-5 text-sm font-semibold tracking-wider uppercase'>
        {children}
      </nav>
    )}
  </header>
);

type ToolbarButtonProps = { active?: boolean; onClick: () => void; children: ReactNode };

// A text button inside the toolbar. `active` highlights the current choice.
export const ToolbarButton = ({ active = false, onClick, children }: ToolbarButtonProps) => (
  <button
    type='button'
    onClick={onClick}
    className={`transition-colors cursor-pointer duration-200 ${
      active ? 'text-secondary font-bold' : 'text-white/60 hover:text-white'
    }`}
  >
    {children}
  </button>
);

export const ToolbarDivider = () => <span className='text-white/20 select-none'>|</span>;

export default PageToolbar;
