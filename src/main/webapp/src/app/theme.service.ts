import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private renderer: Renderer2;
  private themeKey = 'app-theme';
  private modeKey  = 'app-theme-mode';

  private currentTheme!: string;
  private currentMode!: 'light' | 'dark';

  // Passe à une valeur par défaut 'light' au lieu de null
  private mode$ = new BehaviorSubject<'light' | 'dark'>('light');

  constructor(factory: RendererFactory2) {
    this.renderer = factory.createRenderer(null, null);

    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', e => {
        // Si l'utilisateur n'a pas overridé, on suit le système
        if (!localStorage.getItem(this.modeKey)) {
          this.setMode(e.matches ? 'dark' : 'light');
        }
      });
  }

  /** Appelé via APP_INITIALIZER */
  init(defaultTheme: string, themes: string[]) {
    this.currentTheme = defaultTheme;

    // Mode enregistré ou préférence système
    const saved = localStorage.getItem(this.modeKey) as 'light' | 'dark' | null;
    const sys   = window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';

    this.currentMode = (saved === 'light' || saved === 'dark') ? saved : sys;

    // On émet la vraie valeur dès l'init
    this.mode$.next(this.currentMode);
    this.apply();
  }

  setTheme(theme: string) {
    this.currentTheme = theme;
    localStorage.setItem(this.themeKey, theme);
    this.apply();
  }

  setMode(mode: 'light' | 'dark') {
    this.currentMode = mode;
    localStorage.setItem(this.modeKey, mode);
    this.mode$.next(mode);
    this.apply();
  }

  toggleMode() {
    this.setMode(this.currentMode === 'light' ? 'dark' : 'light');
  }

  onModeChange(): Observable<'light' | 'dark'> {
    return this.mode$.asObservable();
  }

  getTheme(): string {
    return this.currentTheme;
  }

  getMode(): 'light' | 'dark' {
    return this.currentMode;
  }

  private apply() {
    const attr = `${this.currentTheme}-${this.currentMode}`;
    this.renderer.setAttribute(document.documentElement, 'data-theme', attr);
  }
}
