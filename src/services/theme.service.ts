import { Injectable, signal, effect } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly THEME_KEY = 'zimmery_theme';
  
  theme = signal<Theme>(this.loadFromStorage());

  constructor() {
    effect(() => {
      const currentTheme = this.theme();
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.THEME_KEY, currentTheme);
      }
      
      if (typeof document !== 'undefined') {
        if (currentTheme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
      }
    });
  }

  private loadFromStorage(): Theme {
    if (typeof localStorage === 'undefined') return 'light';
    const storedTheme = localStorage.getItem(this.THEME_KEY);
    return (storedTheme as Theme) || 'light';
  }

  toggleTheme() {
    this.theme.update(current => (current === 'light' ? 'dark' : 'light'));
  }
}
