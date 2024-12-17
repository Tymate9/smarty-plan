import { Component } from '@angular/core';

@Component({
  selector: 'app-main-layout',
  template: `
    <app-navbar ></app-navbar>
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
