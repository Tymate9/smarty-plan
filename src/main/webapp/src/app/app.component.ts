import { Component } from '@angular/core';
import { Toast } from 'primeng/toast';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmDialog } from 'primeng/confirmdialog';
import {ConfirmationService, SharedModule} from 'primeng/api';
import {DrawerComponent} from "./commons/drawer/drawer.component";

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    Toast,
    ConfirmDialog,
    SharedModule,
    DrawerComponent
  ],
  providers: [
    ConfirmationService
  ],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
    <app-drawer></app-drawer>
    <router-outlet></router-outlet>
  `,
  styles: [`
    /* Aucune règle de style ici */
  `]
})
export class AppComponent {
  title = 'webapp';

  constructor() {}
}
