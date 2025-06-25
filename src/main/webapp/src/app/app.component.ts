import { Component, OnInit } from '@angular/core';
import { CommonModule }      from '@angular/common';
import { FormsModule }       from '@angular/forms';
import { RouterModule }      from '@angular/router';

import { ThemeService } from './theme.service';
import { AppConfig }    from './app.config';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  host: { '[class]': 'rootClass' },
  template: `
    <div class="theme-toggle">
      <label>Thème :</label>
      <select [(ngModel)]="selectedTheme" (ngModelChange)="switchTheme($event)">
        <option *ngFor="let t of themes" [value]="t">{{ t }}</option>
      </select>
    </div>
    <router-outlet></router-outlet>
  `,
  styles: [`
    .theme-toggle {
      position: fixed;
      top: 1rem;
      right: 1rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      padding: .5rem;
      background: rgba(255,255,255,0.8);
      border-radius: 4px;
      z-index: 9999;
    }
  `]
})
export class AppComponent implements OnInit {
  themes: string[] = [];
  selectedTheme!: string;

  constructor(private themeService: ThemeService) {}

  get rootClass() {
    return `${this.selectedTheme}-theme`;
  }

  ngOnInit() {
    const cfg = AppConfig.config;
    // remplir la liste
    this.themes = cfg.availableThemes;
    // thème initial (localStorage ou défaut)
    this.selectedTheme = localStorage.getItem('app-theme') || cfg.defaultTheme;
    // appliquer
    this.themeService.setTheme(this.selectedTheme);
  }

  switchTheme(themeKey: string) {
    this.themeService.setTheme(themeKey);
    this.selectedTheme = themeKey;
  }
}
