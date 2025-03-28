import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import {EntityFormComponent} from "../../CRUD/entity-form/entity-form.component";
import {EntityDeleteButtonComponent} from "../../entity-delete-button-component/entity-delete-button.component";
import {PeriodService} from "../../service/period.service";
import {CrudEventType, IEntityService} from "../../CRUD/ientity-service";
import {OptionExtractor} from "../../../../../../kotlin/net/enovea/workInProgress/vehicleCRUD/OptionDTOExtractor";
import {dto} from "../../../../habarta/dto";
import PeriodDTO = dto.PeriodDTO;
import PeriodForm = dto.PeriodForm;
import { IFormDescription } from '../../CRUD/iform-description';
import {NotificationService} from "../../../commons/notification/notification.service";
import {AutocompleteFormInput, FormInput} from "../../CRUD/iform-input";
import {FormDescription} from "../../CRUD/form-description";
import {PeriodValidator} from "../../affectation-form/period-validator";

@Component({
  selector: 'app-period-form',
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
    <!-- Partie 1 : Le formulaire de période -->
    <app-entity-form
      *ngIf="periodFormDescription"
      [formDescription]="periodFormDescription"
      [entityService]="periodService"
      [entity]="currentPeriod"
      [mode]="formMode"
      (receiveResponse)="handleFormResponse($event)"
    ></app-entity-form>

    <button pButton type="button" label="Créer nouvelle période" (click)="onCreateNew()"></button>

    <!-- Partie 2 : Le tableau des périodes -->
    <p-table [value]="periods" sortField="startDate" [sortOrder]="1" selectionMode="single"
             [(selection)]="selectedPeriod" (onRowSelect)="onRowSelect($event)">
      <ng-template pTemplate="header">
        <tr>
          <th>Date de début</th>
          <th>Date de fin</th>
          <th>Actions</th>
        </tr>
      </ng-template>
      <ng-template pTemplate="body" let-period>
        <tr [pSelectableRow]="period">
          <td>{{ period.startDate | date:'dd/MM/yyyy' }}</td>
          <td>{{ period.endDate | date:'dd/MM/yyyy' }}</td>
          <td>
            <app-entity-delete-button
              [entityId]="period.id"
              [entityService]="periodService"
              label="Supprimer"
              confirmationMessage="Voulez-vous vraiment supprimer cette période ?"
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
export class PeriodFormComponent implements OnInit {
  @Input() title!: string;
  @Input() resourceId!: any;
  @Input() periodService!: PeriodService<any>;
  @Input() serviceToNotify!: IEntityService<any, any>;
  @Output() refreshPeriods = new EventEmitter<void>();

  // Liste des périodes affichées dans le tableau.
  periods: PeriodDTO<any>[] = [];
  // Période actuellement sélectionnée (pour modification).
  selectedPeriod: PeriodDTO<any> | null = null;
  // Période utilisée par le formulaire.
  currentPeriod: PeriodForm = { resourceId: null, startDate: null, endDate: null };
  // Mode du formulaire : 'create' ou 'update'
  formMode: 'create' | 'update' = 'create';
  // Description du formulaire de période.
  periodFormDescription!: IFormDescription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadPeriods();
  }

  initializeForm(): void {
    // Ici, on n'a plus besoin de récupérer les options pour la resource,
    // car l'ID de la resource est fixé par le parent.
    const inputs: FormInput[] = [
      // Suppression de l'input pour resourceId.
      new FormInput('startDate', 'date', 'Date de début', [/* Validators.required */], null, 'Sélectionnez la date de début'),
      new FormInput('endDate', 'date', 'Date de fin', [], null, 'Sélectionnez la date de fin (facultatif)')
    ];

    const transformFunction = (rawEntity: any) => {
      const payload: PeriodForm & { id?: any } = {
        // La resourceId est toujours celle transmise par le parent.
        resourceId: this.resourceId,
        startDate: new Date(rawEntity.startDate),
        endDate: rawEntity.endDate ? new Date(rawEntity.endDate) : null
      };
      if (this.formMode === 'update' && this.selectedPeriod && this.selectedPeriod.id) {
        payload.id = this.selectedPeriod.id;
      }
      return payload;
    };

    this.periodFormDescription = new FormDescription(
      this.title,
      inputs,
      undefined, // Vous pouvez ajouter des contraintes spécifiques ici si nécessaire
      undefined,
      transformFunction
    );
    // Réinitialiser le formulaire en création.
    this.currentPeriod = { resourceId: this.resourceId, startDate: null, endDate: null };
    this.formMode = 'create';
  }

  loadPeriods(): void {
    const idStr = this.resourceId ? this.resourceId.toString().trim() : '';
    if (!idStr) return;
    this.periodService.listByResource(idStr).subscribe(
      data => {
        console.log("periods = ", data)
        this.periods = data.sort((a, b) =>
          new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
        );
      },
      err => console.error('Error loading periods:', err)
    );
  }

  handleFormResponse(response: any): void {
    if (response && !response.error) {
      if (this.formMode === 'create') {
        this.notificationService.success('Période créée', 'La nouvelle période a été créée.');
      } else {
        this.notificationService.success('Période mise à jour', 'La période a été mise à jour.');
      }
      this.sendNotification(response);
      this.onCreateNew();
      this.loadPeriods();
    } else if (response && response.error) {
      this.notificationService.error('Erreur', 'Une erreur est survenue lors de la sauvegarde.');
    }
  }

  onCreateNew(): void {
    this.formMode = 'create';
    this.currentPeriod = { resourceId: this.resourceId, startDate: null, endDate: null };
    this.initializeForm();
    this.selectedPeriod = null;
  }

  onRowSelect(event: any): void {
    const period: PeriodDTO<any> = event.data;
    this.formMode = 'update';
    this.selectedPeriod = period;

    this.currentPeriod = {
      resourceId: this.resourceId, // On garde la resourceId transmise par le parent
      startDate: new Date(period.startDate),
      endDate: period.endDate ? new Date(period.endDate) : null
    };

    this.initializeFormWithData(this.selectedPeriod);
  }

  initializeFormWithData(data: PeriodDTO<any>): void {
    // Ici, on ne recrée pas l'input pour resourceId, car celui-ci est fixe.
    const initialStart = data.startDate ? this.formatDateForInput(data.startDate) : null;
    const initialEnd = data.endDate ? this.formatDateForInput(data.endDate) : null;

    const inputs: FormInput[] = [
      new FormInput('startDate', 'date', 'Date de début', [/* Validators.required */], initialStart, 'Sélectionnez la date de début'),
      new FormInput('endDate', 'date', 'Date de fin', [], initialEnd, 'Sélectionnez la date de fin (facultatif)')
    ];

    const transformFunction = (rawEntity: any) => {
      const payload: PeriodForm & { id?: any } = {
        resourceId: this.resourceId,
        startDate: new Date(rawEntity.startDate),
        endDate: rawEntity.endDate ? new Date(rawEntity.endDate) : null
      };
      if (this.formMode === 'update' && this.selectedPeriod && this.selectedPeriod.id) {
        payload.id = this.selectedPeriod.id;
      }
      return payload;
    };

    this.periodFormDescription = new FormDescription(
      this.title,
      inputs,
      // Par exemple, vous pouvez réutiliser le TimeValidator ici
      // TimeValidator.checkDatesConstraint,
      undefined,
      undefined,
      transformFunction
    );
  }

  private formatDateForInput(date: any): string | null {
    if (!date) return null;
    const d = new Date(date);
    const year = d.getUTCFullYear();
    const month = ('0' + (d.getUTCMonth() + 1)).slice(-2);
    const day = ('0' + d.getUTCDate()).slice(-2);
    return `${year}-${month}-${day}`;
  }

  sendNotification(response: any): void {
    console.log("je cherche le parfaiteId : ", response)
    this.serviceToNotify.getById(response.resource.id).subscribe({
      next: (result) => {
        this.serviceToNotify.notifyCrudEvent({
          type: CrudEventType.UPDATE,
          oldData: { id: this.resourceId },
          newData: result
        });
      },
      error: (err) => {
        console.error('Erreur lors du getById:', err);
        this.notificationService.error("Erreur serveur", "Impossible de mettre à jour l'arbre de données, veuillez mettre à jour la page manuellement.");
      }
    });
  }

  onDeleteSuccess(response: any): void {
    this.notificationService.success('Suppression réussie', 'La période a été supprimée.');
    this.sendNotification(response);
    if (this.formMode === 'update' && this.selectedPeriod && this.selectedPeriod.id) {
      this.onCreateNew();
    }
    this.loadPeriods();
  }

  onDeleteError(error: any): void {
    console.error('Erreur lors de la suppression de la période:', error);
    this.notificationService.error('Erreur de suppression', 'Une erreur est survenue lors de la suppression de la période.');
  }
}
