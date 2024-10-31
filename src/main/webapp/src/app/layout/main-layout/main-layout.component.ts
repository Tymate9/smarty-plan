import { Component } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  template: `
    <app-navbar ></app-navbar>
    <router-outlet></router-outlet> <!-- Affiche les composants enfants (Dashboard ou Cartography) -->
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MainLayoutComponent {
}
