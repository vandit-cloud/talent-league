import { Laptop, Moon, SunMedium } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

export function ThemeToggle() {
  const { theme, resolvedTheme, setTheme, toggleTheme } = useTheme();

  return (
    <div className="app-panel flex items-center gap-1 rounded-2xl p-1.5 shadow-sm">
      <button
        type="button"
        onClick={toggleTheme}
        className="theme-toggle-btn inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
        title={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {resolvedTheme === 'dark' ? <SunMedium className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        <span>{resolvedTheme === 'dark' ? 'Light' : 'Dark'}</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`theme-toggle-btn inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium ${
          theme === 'system' ? 'theme-toggle-btn-active' : ''
        }`}
        title="Follow system theme"
        aria-label="Follow system theme"
      >
        <Laptop className="h-4 w-4" />
        <span>Auto</span>
      </button>
    </div>
  );
}
