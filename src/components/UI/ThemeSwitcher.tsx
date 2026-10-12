import { useState } from 'react';

// "system" = no data-theme attribute: daisyUI then picks luminamind-light or luminamind-dark
// from the system setting (default / prefersdark in index.css).
const THEMES = [
  { value: 'system', label: 'System' },
  { value: 'luminamind-light', label: 'LuminaMind light' },
  { value: 'luminamind-dark', label: 'LuminaMind dark' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

const STORAGE_KEY = 'theme';

const readStoredTheme = (): string => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return THEMES.some((t) => t.value === stored) ? (stored as string) : 'system';
  } catch {
    return 'system';
  }
};

const applyTheme = (theme: string) => {
  if (theme === 'system') document.documentElement.removeAttribute('data-theme');
  else document.documentElement.setAttribute('data-theme', theme);
};

// Apply the saved choice as soon as this file is loaded, before the first page is drawn
applyTheme(readStoredTheme());

const ThemeSwitcher = () => {
  const [theme, setTheme] = useState(readStoredTheme);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const next = e.target.value;
    setTheme(next);
    applyTheme(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage not available: the choice just lasts until the page is reloaded
    }
  };

  return (
    <select
      aria-label='Theme'
      value={theme}
      onChange={handleChange}
      className='select select-ghost select-sm w-auto rounded-field bg-transparent hover:bg-base-content/10 focus:bg-base-content/10 text-sm mx-1'
    >
      {THEMES.map((t) => (
        <option key={t.value} value={t.value}>
          {t.label}
        </option>
      ))}
    </select>
  );
};

export default ThemeSwitcher;
