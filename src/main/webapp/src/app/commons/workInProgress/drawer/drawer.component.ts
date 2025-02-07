import { Component, Input } from '@angular/core';
import {Sidebar} from "primeng/sidebar";
import {ButtonDirective} from "primeng/button";
import {PrimeTemplate} from "primeng/api";

@Component({
  selector: 'app-drawer',
  template: `
    <!-- Bouton déclencheur du drawer -->
    <button pButton type="button" (click)="openSidebar()" [label]="buttonText">
      <ng-container *ngIf="iconClass">
        <img [src]="iconClass" alt="Icon" style="height: 1em; margin-right: 0.5em;">
      </ng-container>
    </button>

    <!-- Sidebar PrimeNG configurée en mode modal et dismissible -->
    <p-sidebar [(visible)]="visible" [autoZIndex]="true" [baseZIndex]="2000" position="right" [showCloseIcon]="false"
               [modal]="true" (onHide)="onSidebarHide()">
      <ng-template pTemplate="headless">
        <!-- Bouton de fermeture en haut à gauche -->
        <div class="drawer-header">
          <button pButton type="button" icon="pi pi-times" (click)="closeSidebar()" class="close-button"></button>
        </div>
        <!-- Contenu dynamique projeté depuis le parent -->
        <ng-content></ng-content>
      </ng-template>
    </p-sidebar>
  `,
  standalone: true,
  imports: [
    Sidebar,
    ButtonDirective,
    PrimeTemplate
  ],
  styles: [`
    .drawer-header {
      display: flex;
      justify-content: flex-start;
      margin-bottom: 1rem;
    }

    .close-button {
      margin: 0.5rem;
    }
  `]
})
export class DrawerComponent {
  /** Texte affiché sur le bouton déclencheur */
  @Input() buttonText: string = 'Open Drawer';

  /** URL de l'icône à afficher sur le bouton déclencheur */
  @Input() iconClass: string = '';

  /**
   * Message de confirmation lors de la fermeture du drawer.
   * Si renseigné, une confirmation est demandée avant de fermer.
   */
  @Input() closeConfirmationMessage?: string;

  /** Contrôle la visibilité du drawer */
  visible: boolean = false;

  /** Ouvre le drawer */
  openSidebar() {
    this.visible = true;
  }

  /**
   * Tente de fermer le drawer.
   * Si closeConfirmationMessage est défini, affiche une confirmation.
   */
  closeSidebar() {
    if (this.closeConfirmationMessage) {
      const confirmed = window.confirm(this.closeConfirmationMessage);
      if (!confirmed) {
        return;
      }
    }
    this.visible = false;
  }

  /**
   * Méthode appelée lorsque le drawer est masqué (par exemple, en cliquant en dehors).
   * Si un message de confirmation est défini, on le demande et on réouvre le drawer en cas d'annulation.
   */
  onSidebarHide() {
    if (this.closeConfirmationMessage) {
      const confirmed = window.confirm(this.closeConfirmationMessage);
      if (!confirmed) {
        // Rétablit la visibilité si l'utilisateur annule la fermeture
        this.visible = true;
      }
    }
  }
}
