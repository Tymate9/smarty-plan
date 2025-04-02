import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgForOf, NgIf, NgStyle } from "@angular/common";

@Component({
  standalone: true,
  selector: 'app-toggle-buttons-group',
  template: `
    <div class="toggle-buttons-group">
      <button *ngFor="let item of items"
              (click)="onItemClick(item)"
              [ngStyle]="{
                'background-color': '#ffffff',
                '--button-color': colorFn ? colorFn(item) : '#007bff',
                'width': buttonWidth,
                'height': buttonHeight
              }"
              [class.active]="selectedItem && identifierFn(selectedItem) === identifierFn(item)">
        <span>
          <!-- Nombre affiché en blanc -->
          <span class="status-count">{{ item.count }}</span>
          <!-- Texte affiché via displayFn -->
          <span class="status-text">{{ displayFn(item) }}</span>
          <!-- Icône affichée si iconFn est défini -->
          <span class="icon" *ngIf="iconFn">
            <i class="pi" [ngClass]="iconFn(item)"></i>
          </span>
        </span>
      </button>
    </div>
  `,
  imports: [
    NgForOf,
    NgStyle,
    NgIf,
    NgClass
  ],
  styles: [`
    .toggle-buttons-group {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      margin-top: 20px;
      justify-content: center;
      align-items: center;
    }

    .toggle-buttons-group button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30px;
      font-size: 22px;
      font-weight: bold;
      border: none;
      width: 100%;
      flex: 1 1 170px;
      box-sizing: border-box;
      position: relative;
      border-radius: 20px;
      color: #333;
      background: white;
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
      white-space: nowrap;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
    }

    .toggle-buttons-group button:hover {
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }

    /* Bandeau coloré à gauche basé sur la variable CSS --button-color */
    .toggle-buttons-group button::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 30%;
      background: var(--button-color, #007bff);
      border-top-left-radius: 20px;
      border-bottom-left-radius: 20px;
    }

    .toggle-buttons-group button span {
      position: relative;
      z-index: 3;
      display: flex;
      flex: 1;
      justify-content: space-between;
      padding-left: 13px;
    }

    .toggle-buttons-group button .status-count {
      color: white !important;
      padding: 0 5px !important;
      font-weight: bold !important;
      margin-right: 10px !important;
    }

    .toggle-buttons-group button .status-text {
      color: var(--button-color, #007bff);
    }

    .toggle-buttons-group button .icon i {
      font-size: 30px;
      color: var(--button-color, #007bff);
    }

    /* Style du bouton actif : ajout d'un ring via box-shadow supplémentaire */
    .toggle-buttons-group button.active {
      /* Ring visible autour du bouton, avec la couleur définie par --button-color */
      box-shadow: 0 0 0 4px var(--button-color, #007bff), 0 4px 8px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }
  `]
})
export class ToggleButtonsGroupComponent {
  /**
   * Liste des objets à afficher en tant que boutons.
   */
  @Input() items: any[] = [];

  /**
   * Élément actuellement sélectionné.
   */
  @Input() selectedItem: any | null = null;

  /**
   * Fonction d'extraction d'un identifiant unique pour comparer les objets.
   */
  @Input() identifierFn: (item: any) => any = (item: any) => item;

  /**
   * Fonction pour obtenir le texte à afficher, via displayFn.
   */
  @Input() displayFn: (item: any) => string = (item: any) => String(item);

  /**
   * Fonction optionnelle pour obtenir la classe d'icône.
   */
  @Input() iconFn?: (item: any) => string;

  /**
   * Fonction optionnelle pour obtenir la couleur (pour le bandeau et le texte).
   */
  @Input() colorFn?: (item: any) => string;

  /**
   * Largeur du bouton (input permettant d'ajuster la taille). Par défaut : 350px.
   */
  @Input() buttonWidth: string = '350px';

  /**
   * Hauteur du bouton (input permettant d'ajuster la taille). Par défaut : 80px.
   */
  @Input() buttonHeight: string = '80px';

  /**
   * Emet l'élément sélectionné ou null si désélectionné.
   */
  @Output() selectionChange: EventEmitter<any | null> = new EventEmitter();

  /**
   * Gère la logique de sélection/désélection.
   */
  onItemClick(item: any): void {
    if (this.selectedItem && this.identifierFn(this.selectedItem) === this.identifierFn(item)) {
      this.selectedItem = null;
    } else {
      this.selectedItem = item;
    }
    this.selectionChange.emit(this.selectedItem);
  }
}
