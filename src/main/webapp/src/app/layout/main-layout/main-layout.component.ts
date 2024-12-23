import { Component } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  template: `
    <app-navbar ></app-navbar>
    <app-logo></app-logo>
    <router-outlet></router-outlet>

  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class MainLayoutComponent {
}
