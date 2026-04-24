'use client';

import { useTheme } from '../hooks/useTheme';
import { IconButton } from './IconButton';

export function ThemeToggle() {
  const { theme, toggle } = useTheme();
  const label = theme === 'dark' ? '라이트 모드로 전환' : '다크 모드로 전환';
  return (
    <IconButton label={label} onClick={toggle} variant="ghost" size="md">
      <span aria-hidden>{theme === 'dark' ? '☀︎' : '☾'}</span>
    </IconButton>
  );
}
