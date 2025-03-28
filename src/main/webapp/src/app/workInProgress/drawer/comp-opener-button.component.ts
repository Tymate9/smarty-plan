import { Component, Input } from '@angular/core';
import {CommonModule, NgOptimizedImage} from '@angular/common';
import {Button, ButtonDirective} from 'primeng/button';
import {DrawerOptions} from "./drawer.component";
import {DrawerService} from "../service/component/drawer.service";
import {PrimeTemplate} from "primeng/api";

@Component({
  selector: 'app-comp-opener-button',
  standalone: true,
  imports: [CommonModule, Button],
  template: `
    <p-button
      type="button"
      [ariaLabel]="label"
      [icon]="icon"
      [label]="showLabel ? label : ''"
      iconPos="left"
      (click)="openDrawer()"
    ></p-button>
  `,
  styles: [``]
})
export class CompOpenerButtonComponent {
  /**
   * Libellé affiché sur le bouton (utilisé pour l'ARIA et éventuellement le label visuel).
   * Par défaut: "Open Drawer"
   */
  @Input() label: string = 'Open Drawer';

  /**
   * Icône PrimeNG (ou Font Awesome) sous forme de classe CSS.
   * Par défaut: "pi pi-pencil".
   */
  @Input() icon: string = 'pi pi-pencil';

  /**
   * Détermine si le label doit être affiché visuellement sur le bouton.
   * Par défaut: false (label non affiché, seul l'ARIA est renseigné).
   */
  @Input() showLabel: boolean = false;

  /**
   * Options de configuration pour le Drawer
   */
  @Input() drawerOptions?: DrawerOptions;

  constructor(private drawerService: DrawerService) {}

  /** Ouvre le Drawer avec les options transmises */
  openDrawer(): void {
    this.drawerService.open(this.drawerOptions);
  }
}
