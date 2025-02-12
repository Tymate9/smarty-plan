import { Component } from '@angular/core';
import { Toast } from 'primeng/toast';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmDialog } from 'primeng/confirmdialog';
import {ConfirmationService, SharedModule} from 'primeng/api';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    Toast,
    ConfirmDialog,
    SharedModule
  ],
  providers: [
    ConfirmationService  // <-- Fournit le service indispensable
  ],
  template: `
    <p-toast></p-toast>
    <p-confirmDialog></p-confirmDialog>
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
