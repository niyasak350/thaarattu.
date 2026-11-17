import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

// Light / dark theme. The choice is remembered in this browser.
export function useTheme() {
  const [theme, setTheme] = useState(document.documentElement.dataset.theme || 'light');
  useEffect(() => {
    // other toggle buttons on the page stay in step
    const sync = () => setTheme(document.documentElement.dataset.theme);
    window.addEventListener('theme-change', sync);
    return () => window.removeEventListener('theme-change', sync);
  }, []);
  const toggle = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    localStorage.setItem('theme', next);
    window.dispatchEvent(new Event('theme-change'));
  };
  return { theme, toggle };
}

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
  return (
    <button type="button" className="icon-btn" onClick={toggle} aria-label={label} title={label}>
      {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
