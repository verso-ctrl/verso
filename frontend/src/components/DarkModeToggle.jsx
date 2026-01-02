import React, { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

function DarkModeToggle() {
  const [dark, setDark] = useState(() => {
    // Check localStorage or system preference
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) {
      return saved === 'true';
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (dark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      localStorage.setItem('darkMode', 'true');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      localStorage.setItem('darkMode', 'false');
    }
  }, [dark]);

  return (
    <button
      onClick={() => setDark(!dark)}
      className="btn-icon relative overflow-hidden"
      aria-label="Toggle dark mode"
      title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <div className={`transform transition-all duration-300 ${dark ? 'rotate-0 scale-100' : 'rotate-90 scale-0 absolute'}`}>
        <Sun className="h-5 w-5 text-primary-400" />
      </div>
      <div className={`transform transition-all duration-300 ${!dark ? 'rotate-0 scale-100' : '-rotate-90 scale-0 absolute'}`}>
        <Moon className="h-5 w-5 text-ink-600" />
      </div>
    </button>
  );
}

export default DarkModeToggle;
