import { inject, Injectable, signal } from '@angular/core';
import { TranslocoService } from '@jsverse/transloco';

@Injectable({ providedIn: 'root' })
export class LanguageStore {
  private readonly transloco = inject(TranslocoService);

  readonly availableLangs: readonly string[] = ['fr', 'en'];
  readonly active = signal<string>(this.getInitialLang());

  private getInitialLang(): string {
    const stored = localStorage.getItem('lang');
    const available = ['fr', 'en'];
    return stored && available.includes(stored) ? stored : 'fr';
  }

  use(lang: string): void {
    this.transloco.setActiveLang(lang);
    this.active.set(lang);
    document.documentElement.lang = lang;
    localStorage.setItem('lang', lang);
  }

  init(): void {
    const lang = this.active();
    this.transloco.setActiveLang(lang);
    document.documentElement.lang = lang;
  }
}
