import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NgIf} from "@angular/common";

@Component({
  selector: 'app-entity-button-tab-content',
  template: `
    <button class="tab-button" (click)="onButtonClick()">
      {{ label }}
      <img *ngIf="icon && iconType === 'url'" [src]="icon" class="icon-img" alt="TabIcon"/>
      <i *ngIf="icon && iconType === 'css'" [class]="icon"></i>
    </button>
  `,
  standalone: true,
  imports: [
    NgIf
  ],
  styles: [`
    .tab-button {
      padding: 6px 12px;
      border: 1px solid #ccc;
      background-color: white;
      cursor: pointer;
      outline: none;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }

    .icon-img {
      width: 18px;
      height: 18px;
    }
  `]
})
export class EntityButtonTabContentComponent {
  /**
   * Le libellé à afficher dans le bouton.
   */
  @Input() label: string = '';

  /**
   * Chemin ou nom d'icône (selon l'usage).
   * - Si c'est un path (ex: 'assets/icons/team.png'), on peut afficher <img>.
   * - Si c'est un nom de classe CSS (ex: 'fa fa-user'), on peut afficher <i class="fa fa-user">.
   */
  @Input() icon?: string;

  /**
   * Indique si `icon` représente une URL ou une classe CSS.
   * - 'url' => on affiche un <img [src]="icon">
   * - 'css' => on affiche <i [class]="icon">
   */
  @Input() iconType: 'url' | 'css' = 'css';

  /**
   * Événement émis quand on clique.
   * Le composant parent pourra s’y abonner via (clicked)="..."
   */
  @Output() clicked = new EventEmitter<void>();

  /**
   * Méthode déclenchée au clic (dans le template)
   */
  onButtonClick(): void {
    this.clicked.emit();
  }
}
