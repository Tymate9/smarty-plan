import {Component, EventEmitter, Input, Output} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmationService } from 'primeng/api';
import {CrudEventType, IEntityService} from "../interface/ientity-service";
import {Button} from "primeng/button";


@Component({
  selector: 'app-entity-delete-button',
  standalone: true,
  imports: [CommonModule, Button],
  template: `
    <p-button [ariaLabel]="label" type="button" (click)="onDelete()" icon="pi pi-trash">
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
   * Callback (facultatif) à appeler en cas de succès.
   */
  @Input() onSuccess?: (response: any) => void = (response: any) => { console.log("Suppression réussie"); };
  /**
   * Callback (facultatif) à appeler en cas d'erreur.
   */
  @Input() onError?: (error: any) => void = (response: any) =>{ console.log("Suppression échouée"); };

  @Output() deleteSuccess = new EventEmitter<void>();
  @Output() deleteError = new EventEmitter<any>();

  constructor(private confirmationService: ConfirmationService) {}

  public onDelete(): void {
    this.confirmationService.confirm({
      message: this.confirmationMessage,
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (this.entityService && this.entityId != null) {
          this.entityService.delete(this.entityId).subscribe({
            next: (deletedEntity) => {
              console.log('[EntityDeleteButton] Réponse HTTP de la suppression:', deletedEntity);
              // Utiliser la réponse du delete comme oldData, newData = null
              if (this.onSuccess)
              {
                this.onSuccess(deletedEntity)
              }
              this.entityService?.notifyCrudEvent({
                type: CrudEventType.DELETE,
                oldData: deletedEntity,
                newData: null
              });
              this.deleteSuccess.emit(deletedEntity);
            },
            error: (err: any) => {
              console.error('Erreur lors de la suppression', err);
              if (this.onError) {
                this.onError(err);
              }
              this.deleteError.emit(err);
            }
          });
        }
      }
    });
  }
}
