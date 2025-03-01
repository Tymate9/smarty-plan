import {Component, EventEmitter, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from 'primeng/api';
import {IEntityService} from "../CRUD/ientity-service";
import {Button} from "primeng/button";

/**
 * Bouton dédié à la suppression d'une entité via l'IEntityService<T, R>.
 */
@Component({
  selector: 'app-entity-delete-button',
  standalone: true,
  imports: [CommonModule, Button],
  template: `
    <p-button type="button" (click)="onDelete()">
      {{ label }}
    </p-button>
  `
})
export class EntityDeleteButtonComponent {

  /**
   * Libellé du bouton (ex. "Supprimer" ou "Retirer entité" etc.).
   */
  @Input() label: string = 'Supprimer';

  /**
   * Identifiant de l'entité à supprimer.
   */
  @Input() entityId?: any;

  /**
   * Le service qui implémente la méthode "delete(id: number | string)".
   */
  @Input() entityService?: IEntityService<any, any>;

  /**
   * Message de confirmation personnalisé.
   * (ex. "Voulez-vous vraiment supprimer cette entité ?" par défaut).
   */
  @Input() confirmationMessage: string = 'Voulez-vous vraiment supprimer cette entité ?';

  /**
   * Callback (facultatif) à appeler en cas d'erreur.
   * On peut aussi imaginer un Output "deleteError" si on veut émettre un événement.
   */
  @Input() onError?: (error: any) => void;

  /**
   * On peut aussi imaginer un EventEmitter en cas de succès ou d'erreur si tu préfères
   * un système d'événements Angular plutôt qu'une callback en Input.
   */
  @Output() deleteSuccess = new EventEmitter<void>();
  @Output() deleteError = new EventEmitter<any>();

  constructor(private confirmationService: ConfirmationService) {}

  public onDelete(): void {
    // Affichage d'une boîte de confirmation
    this.confirmationService.confirm({
      message: this.confirmationMessage,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        // L'utilisateur confirme => on supprime
        if (this.entityService && this.entityId != null) {
          this.entityService.delete(this.entityId).subscribe({
            next: () => {
              //console.log('Entité supprimée avec succès.');
              // Emettre un événement Angular si besoin
              this.deleteSuccess.emit();
            },
            error: (err: any) => {
              console.error('Erreur lors de la suppression', err);

              // Si un callback est fourni => on l'appelle
              if (this.onError) {
                this.onError(err);
              }

              // Si on veut aussi émettre un événement Angular
              this.deleteError.emit(err);
            }
          });
        }
      }
    });
  }
}
