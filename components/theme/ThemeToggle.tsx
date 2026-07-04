'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';

export function ThemeToggle() {
  const { setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <Button variant="icon" aria-label="Toggle theme" disabled className="w-9 h-9">
        <div className="w-4 h-4" />
      </Button>
    );
  }

  const isDark = resolvedTheme === 'dark';

  function toggle() {
    setTheme(isDark ? 'light' : 'dark');
  }

  return (
    <Button
      variant="icon"
      onClick={toggle}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
      className="w-9 h-9"
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </Button>
  );
}
