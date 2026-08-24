import { effect, inject, Injectable, signal, DOCUMENT } from '@angular/core';

type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly document = inject(DOCUMENT);

  readonly current = signal<Theme>(this.getInitialTheme());

  constructor() {
    // Apply theme reactively whenever the signal changes
    effect(() => {
      const theme = this.current();
      this.document.documentElement.dataset['theme'] = theme === 'dark' ? 'dark' : '';
      localStorage.setItem('theme', theme);
    });
  }

  toggle(): void {
    this.current.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  private getInitialTheme(): Theme {
    const stored = localStorage.getItem('theme');
    if (stored === 'dark' || stored === 'light') return stored;
    // Respect OS preference as default
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
    ) {
      return 'dark';
    }
    return 'light';
  }
}
