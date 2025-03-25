import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DatePipe } from '@angular/common';
import {EntityFormComponent} from "../CRUD/entity-form/entity-form.component";
import {FormsModule} from "@angular/forms";
import {AffectationService} from "../service/affectation.service";
import {CrudEventType, IEntityService} from "../CRUD/ientity-service";
import {dto} from "../../../habarta/dto";
import AffectationDTO = dto.AffectationDTO;
import AffectationForm = dto.AffectationForm;
import {IFormDescription} from "../CRUD/iform-description";
import {NotificationService} from "../../commons/notification/notification.service";
import {AutocompleteFormInput, FormInput, IFormInput} from "../CRUD/iform-input";
import {FormDescription} from "../CRUD/form-description";
import {OptionExtractor} from "../../../../../kotlin/net/enovea/workInProgress/vehicleCRUD/OptionDTOExtractor";
import {EntityDeleteButtonComponent} from "../entity-delete-button-component/entity-delete-button.component";
import {AffectationValidator} from "./affectation-validator";

@Component({
  selector: 'app-affectation-form',
  standalone: true,
  imports: [
    EntityFormComponent,
    NgIf,
    TableModule,
    ButtonModule,
    FormsModule,
    DatePipe,
    EntityDeleteButtonComponent
  ],
  template: `
    <!-- Partie 1 : Le formulaire d'affectation -->
    <app-entity-form
      *ngIf="affectationFormDescription"
      [formDescription]="affectationFormDescription"
      [entityService]="affectationService"
      [entity]="currentAffectation"
      [mode]="formMode"
      (receiveResponse)="handleFormResponse($event)"
    ></app-entity-form>

    <button pButton type="button" label="Créer nouvelle affectation" (click)="onCreateNew()"></button>

    <!-- Partie 2 : Le tableau des affectations -->
    <p-table [value]="affectations" sortField="startDate" [sortOrder]="1" selectionMode="single"
             [(selection)]="selectedAffectation" (onRowSelect)="onRowSelect($event)">
      <ng-template pTemplate="header">
        <tr>
          <th>{{ mainEntityRole === 'subject' ? 'Cible' : 'Sujet' }}</th>
          <th>Date de début</th>
          <th>Date de fin</th>
          <th>Actions</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-affectation>
        <tr [pSelectableRow]="affectation">
          <td>
            {{ mainEntityRole === 'subject'
            ? optionExtractor.getLabel(affectation.target)
            : optionExtractor.getLabel(affectation.subject) }}
          </td>
          <td>{{ affectation.startDate | date:'dd/MM/yyyy' }}</td>
          <td>{{ affectation.endDate | date:'dd/MM/yyyy' }}</td>
          <td>
            <app-entity-delete-button
              [entityId]="affectation.id"
              [entityService]="affectationService"
              label="Supprimer"
              confirmationMessage="Voulez-vous vraiment supprimer cette affectation ?"
              (deleteSuccess)="onDeleteSuccess($event)"
              (deleteError)="onDeleteError($event)"
            ></app-entity-delete-button>
          </td>
        </tr>
      </ng-template>
    </p-table>
  `,
  styles: [`
    h2 { margin-bottom: 1rem; }
    button { margin: 1rem 0; }
    :host ::ng-deep .p-table { margin-top: 1rem; }
  `]
})
export class AffectationFormComponent implements OnInit {
  @Input() title!: string;
  @Input() subjectId!: any;
  @Input() affectationService!: AffectationService<any, any>;
  @Input() optionService!: IEntityService<any, any>;
  @Input() mainEntityRole: 'subject' | 'target' = 'subject';
  @Input() optionExtractor!: OptionExtractor<any>;
  @Input() serviceToNotify: IEntityService<any,any>
  @Output() refreshAffectations = new EventEmitter<void>();

  // Liste des affectations affichées dans le tableau.
  affectations: AffectationDTO<any, any>[] = [];
  // Affectation actuellement sélectionnée (pour modification).
  selectedAffectation: AffectationDTO<any, any> | null = null;
  // Affectation utilisée par le formulaire.
  currentAffectation: AffectationForm = { subjectId: null, targetId: null, startDate: null, endDate: null };
  // Mode du formulaire : 'create' ou 'update'
  formMode: 'create' | 'update' = 'create';
  // Description du formulaire d'affectation.
  affectationFormDescription!: IFormDescription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadAffectations();
  }

  initializeForm(): void {
    this.optionService.getAuthorizedData().subscribe(options => {
      const targetOptions = options.map(opt => ({
        id: this.optionExtractor.getId(opt),
        label: this.optionExtractor.getLabel(opt)
      }));
      const inputs: IFormInput[] = [
        new AutocompleteFormInput(
          'targetId',
          'Cible',
          [AffectationValidator.requiredValue('targetId')],
          targetOptions,
          (opt: any) => opt.label,
          null,
          'Sélectionnez la cible'
        ),
        new FormInput('startDate', 'date', 'Date de début', [AffectationValidator.requiredValue("startDate")], null, 'Sélectionnez la date de début'),
        new FormInput('endDate', 'date', 'Date de fin', [], null, 'Sélectionnez la date de fin (facultatif)')
      ];

      const transformFunction = (rawEntity: any) => {
        const payload: AffectationForm & { id?: any } = {
          subjectId: this.mainEntityRole === 'subject' ? this.subjectId
            : this.optionExtractor.getId(rawEntity.targetId),
          targetId: this.mainEntityRole === 'target' ? this.subjectId
            : this.optionExtractor.getId(rawEntity.targetId),
          startDate: new Date(rawEntity.startDate),
          endDate: rawEntity.endDate ? new Date(rawEntity.endDate) : null
        };
        // En création, pas d'ID préexistant
        return payload;
      };

      this.affectationFormDescription = new FormDescription(
        this.title,
        inputs,
        AffectationValidator.checkDatesConstraint(),
        undefined,
        transformFunction
      );
      // Initialisation du formulaire en création
      this.currentAffectation = { subjectId: this.subjectId, targetId: null, startDate: null, endDate: null };
      this.formMode = 'create';
    });
  }

  loadAffectations(): void {
    const entityIdStr = this.subjectId ? this.subjectId.toString().trim() : '';
    if (entityIdStr === '') {
      return;
    }
    if (this.mainEntityRole === 'subject') {
      this.affectationService.listBySubject(entityIdStr).subscribe(
        data => {
          this.affectations = data.sort((a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        },
        err => console.error('Error loading affectations:', err)
      );
    } else {
      this.affectationService.listByTarget(entityIdStr).subscribe(
        data => {
          this.affectations = data.sort((a, b) =>
            new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
          );
        },
        err => console.error('Error loading affectations: during a listByTarget', err)
      );
    }
  }

  handleFormResponse(response: any): void {
    if (response && !response.error) {
      if (this.formMode === 'create') {
        this.notificationService.success('Affectation créée', 'La nouvelle affectation a été créée.');
      } else {
        console.log("Voici la response reçu de la part de entityForm au sein d'affectationForm dans la partie update", response)
        console.log("Voici donc newData", response.subject)
        this.notificationService.success('Affectation mise à jour', 'L\'affectation a été mise à jour.');
      }
      this.sendNotification(response)
      this.onCreateNew();
      this.loadAffectations();
    } else if (response && response.error) {
      this.notificationService.error('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
    }
  }

  onCreateNew(): void {
    this.formMode = 'create';
    this.currentAffectation = { subjectId: this.subjectId, targetId: null, startDate: null, endDate: null };
    this.initializeForm();
    this.selectedAffectation = null;
  }

  onRowSelect(event: any): void {
    const affectation: AffectationDTO<any, any> = event.data;
    this.formMode = 'update';
    this.selectedAffectation = affectation;

    // Construire le currentAffectation en se basant sur l'objet DTO
    const extractedSubjectId = affectation.subject
      ? this.optionExtractor.getId(affectation.subject)
      : affectation.subject.id;
    const extractedTargetId = affectation.target
      ? this.optionExtractor.getId(affectation.target)
      : affectation.target.id;

    this.currentAffectation = {
      subjectId: this.mainEntityRole === 'subject' ? this.subjectId : extractedSubjectId,
      targetId: this.mainEntityRole === 'target' ? this.subjectId : extractedTargetId,
      startDate: new Date(affectation.startDate),
      endDate: affectation.endDate ? new Date(affectation.endDate) : null
    };

    this.initializeFormWithData(this.selectedAffectation);
  }

  initializeFormWithData(data: AffectationDTO<any, any>): void {
    this.optionService.getAuthorizedData().subscribe(options => {
      const targetOptions = options.map(opt => ({
        id: this.optionExtractor.getId(opt),
        label: this.optionExtractor.getLabel(opt)
      }));

      // Recherche de l'option correspondant à data.target (si défini)
      const initialTargetOption = (
        (this.mainEntityRole === 'target'
          ? data.subject && this.optionExtractor.getId(data.subject)
          : data.target && this.optionExtractor.getId(data.target))
      ) ? targetOptions.find(opt => opt.id === (
        this.mainEntityRole === 'target'
          ? this.optionExtractor.getId(data.subject)
          : this.optionExtractor.getId(data.target)
      )) : null;

      // Convertir les dates pour affichage (format "yyyy-MM-dd")
      const initialStart = data.startDate ? this.formatDateForInput(data.startDate) : null;
      const initialEnd = data.endDate ? this.formatDateForInput(data.endDate) : null;

      const inputs: IFormInput[] = [
        new AutocompleteFormInput(
          'targetId',
          'Cible',
          [AffectationValidator.requiredValue('targetId')],
          targetOptions,
          (opt: any) => opt.label,
          initialTargetOption,
          'Sélectionnez la cible'
        ),
        new FormInput('startDate', 'date', 'Date de début', [AffectationValidator.requiredValue("startDate")], initialStart, 'Sélectionnez la date de début'),
        new FormInput('endDate', 'date', 'Date de fin', [], initialEnd, 'Sélectionnez la date de fin (facultatif)')
      ];

      const transformFunction = (rawEntity: any) => {
        const payload: AffectationForm & { id?: any } = {
            subjectId: this.mainEntityRole === 'subject' ? this.subjectId
              : this.optionExtractor.getId(rawEntity.targetId),
            targetId: this.mainEntityRole === 'target' ? this.subjectId
              : this.optionExtractor.getId(rawEntity.targetId),
          startDate: new Date(rawEntity.startDate),
          endDate: rawEntity.endDate ? new Date(rawEntity.endDate) : null
        };

        // Utiliser l'ID de l'affectation sélectionnée
        if (this.formMode === 'update' && this.selectedAffectation && this.selectedAffectation.id) {
          payload.id = this.selectedAffectation.id;
        }
        return payload;
      };

      this.affectationFormDescription = new FormDescription(
        this.title,
        inputs,
        AffectationValidator.checkDatesConstraint(),
        undefined,
        transformFunction
      );
    });
  }

  private formatDateForInput(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = ('0' + (d.getUTCMonth() + 1)).slice(-2);
    const day = ('0' + d.getUTCDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  onDeleteSuccess(response : any): void {
    this.notificationService.success('Suppression réussie', 'L\'affectation a été supprimée.');
    this.sendNotification(response)
    if (this.formMode === 'update' && this.selectedAffectation && this.selectedAffectation.id) {
      this.onCreateNew();
    }
    this.loadAffectations();
  }

  sendNotification(response:any){
    this.serviceToNotify?.getById(
      this.mainEntityRole === 'subject' ? response.subject.id : response.target.id
    ).subscribe({
      next: (result) => {
        // La réponse du getById est utilisée comme newData dans le crudEvent
        this.serviceToNotify?.notifyCrudEvent({
          type: CrudEventType.UPDATE,
          oldData: { id: this.subjectId },
          newData: result
        });
      },
      error: (err) => {
        console.error('Erreur lors du getById:', err);
        this.notificationService.error("Erreur serveur", "Impossible de mettre à jour l'arbre de données, veuillez mettre à jour la page manuellement.");
      }
    });
  }

  onDeleteError(error: any): void {
    console.error('Erreur lors de la suppression de l\'affectation:', error);
    this.notificationService.error('Erreur de suppression', 'Une erreur est survenue lors de la suppression de l\'affectation.');
  }
}
