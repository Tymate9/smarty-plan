import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import {Button, ButtonDirective} from 'primeng/button';
import {DrawerOptions} from "./drawer.component";
import {DrawerService} from "../service/component/drawer.service";

@Component({
  selector: 'app-comp-opener-button',
  standalone: true,
  imports: [CommonModule, Button],
  template: `
    <p-button [ariaLabel]="label" type="button" (click)="openDrawer()" icon="pi pi-pencil" >
    </p-button>
  `
})
export class CompOpenerButtonComponent {
  /** Libellé affiché sur le bouton */
  @Input() label: string = 'Open Drawer';

  /**
   * Options de configuration à transmettre lors de l'ouverture du Drawer.
   * Permet de personnaliser dynamiquement le Drawer (header, position, contenu, etc.)
   */
  @Input() drawerOptions?: DrawerOptions;

  constructor(private drawerService: DrawerService) {}

  /** Appelle le service pour ouvrir le Drawer avec les options fournies */
  openDrawer(): void {
    this.drawerService.open(this.drawerOptions);
  }

  /**
   * Vérifie si la valeur passée est une classe CSS (par exemple "pi pi-info")
   * ou une URL d'image.
   */
  isIconClass(iconValue: string): boolean {
    if (!iconValue) return false;
    return iconValue.startsWith('pi ')
      || iconValue.startsWith('pi-')
      || iconValue.startsWith('fa ')
      || iconValue.startsWith('fa-');
  }
}
