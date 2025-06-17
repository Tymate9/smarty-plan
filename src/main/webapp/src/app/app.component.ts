import {Component, LOCALE_ID} from '@angular/core';
import { Toast } from 'primeng/toast';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ConfirmDialog } from 'primeng/confirmdialog';
import {ConfirmationService, SharedModule} from 'primeng/api';
import {DrawerComponent} from "./commons/drawer/drawer.component";
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';

registerLocaleData(localeFr);

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
    ConfirmationService,
    { provide: LOCALE_ID, useValue: 'fr-FR' }
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
