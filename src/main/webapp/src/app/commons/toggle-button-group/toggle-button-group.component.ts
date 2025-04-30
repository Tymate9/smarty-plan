import { Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass, NgForOf, NgIf, NgStyle } from "@angular/common";
import {black} from "ansi-colors";

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
                'min-width': buttonWidth,
                'height': buttonHeight,
                'display': 'flex',
                'flex-direction' : 'row'
              }"
                  [class.active]="selectedItem && identifierFn(selectedItem) === identifierFn(item)"
                  [disabled]="!clickable">
              <!-- Nombre affiché en blanc -->
              <!--        <div class="status-count" [ngStyle]="{-->
              <!--        'background-color' : colorFn ? colorFn(item) : '#007bff' ,'font-size': fontSize-->
              <!--        }">{{ item.count }}</div>-->
              <!--        <div class="status-text-container" [ngStyle]="{-->
              <!--        'color' : colorFn ? colorFn(item) : '#007bff', 'font-size': fontSize-->
              <!--        }">-->
            <div class="status-count" [ngStyle]="{
                      'background-color': colorFn ? colorFn(item) : '#007bff',
                      'font-size': fontSize,
                    }">{{ item.count }}
            </div>

            <!-- Text color (from input if provided) & font-size -->
            <div class="status-text-container" [ngStyle]="{
                      'color': textColor ? textColor : (colorFn ? colorFn(item) : '#007bff'),
                      'font-size': fontSize
                    }">
                  <div class=>{{ displayFn(item) }}</div>
                  <i *ngIf="iconFn" [ngClass]="iconFn(item)"></i>
              </div>
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
      flex-direction: row;
      flex-wrap: wrap;
    }

    .toggle-buttons-group button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0;
      font-size: 1.3rem;
      font-weight: bold;
      border: none;
      width: 100%;
      //min-width: 16vw;
      flex: 1 1 170px;
      box-sizing: border-box;
      position: relative;
      border-radius: 20px;
      color: #333;
      background: white;
      overflow: hidden;
      transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
      white-space: nowrap;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.2);
      flex-direction: row;
    }

    .toggle-buttons-group button:hover:not(:disabled){
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
      cursor: pointer;
    }



    .toggle-buttons-group .status-text-container {
      flex-grow: 1;
      display: flex;
      justify-content: space-evenly;
      align-items: center;
      font-size:1.5rem;
    }

    .toggle-buttons-group .status-text-container i {
      font-size:1.5rem;
    }

    .toggle-buttons-group button .status-count {
      color: white !important;
      padding: 0 5px !important;
      font-weight: bold !important;
      //font-size:1.5rem !important;
      min-width: 30%;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
    }

    /* Style du bouton actif : ajout d'un ring via box-shadow supplémentaire */
    .toggle-buttons-group button.active {
      /* Ring visible autour du bouton, avec la couleur définie par --button-color */
      box-shadow: 0 0 0 4px var(--button-color, #007bff), 0 4px 8px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }
  `]
})
export class ToggleButtonsGroupComponent <T extends { count: number }> {
  /**
   * Liste des objets à afficher en tant que boutons.
   */
  @Input() items: T[] = [];

  /**
   * Élément actuellement sélectionné.
   */
  @Input() selectedItem: T | null = null;

  /**
   * Fonction d'extraction d'un identifiant unique pour comparer les objets.
   */
  @Input() identifierFn: (item: T) => any = (item: T) => item;

  /**
   * Fonction pour obtenir le texte à afficher, via displayFn.
   */
  @Input() displayFn: (item: T) => string = (item: T) => String(item);

  /**
   * Fonction optionnelle pour obtenir la classe d'icône.
   */
  @Input() iconFn?: (item: T) => string;

  /**
   * Fonction optionnelle pour obtenir la couleur (pour le bandeau et le texte).
   */
  @Input() colorFn?: (item: T) => string;

  /**
   * Largeur du bouton (input permettant d'ajuster la taille). Par défaut : 350px.
   */
  @Input() buttonWidth: string = '20vw';

  /**
   * Hauteur du bouton (input permettant d'ajuster la taille). Par défaut : 80px.
   */
  @Input() buttonHeight: string = '90px';

  /**
   * Emet l'élément sélectionné ou null si désélectionné.
   */
  @Output() selectionChange: EventEmitter<any | null> = new EventEmitter();

  @Input() clickable = true ;

  @Input() fontSize: string = '1.5rem';

  @Input() textColor?: string;

  /**
   * Gère la logique de sélection/désélection.
   */
  onItemClick(item: any): void {
    if (!this.clickable) {
      return
    }
    if (this.selectedItem && this.identifierFn(this.selectedItem) === this.identifierFn(item)) {
      this.selectedItem = null;
    } else {
      this.selectedItem = item;
    }
    this.selectionChange.emit(this.selectedItem);
  }

  protected readonly black = black;
}
