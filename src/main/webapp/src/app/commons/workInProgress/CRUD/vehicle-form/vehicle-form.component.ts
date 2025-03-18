import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormDescription} from "../form-description";
import {dto} from "../../../../../habarta/dto";
import VehicleForm = dto.VehicleForm;
import {AutocompleteFormInput, FormInput, IFormInput} from "../iform-input";
import VehicleCategoryDTO = dto.VehicleCategoryDTO;
import {forkJoin} from "rxjs";
import VehicleDTO = dto.VehicleDTO;
import {NotificationService} from "../../../notification/notification.service";
import {VehicleService} from "../../../../features/vehicle/vehicle.service";
import {IFormDescription} from "../iform-description";
import {EntityFormComponent} from "../entity-form/entity-form.component";
import {NgIf} from "@angular/common";
import {VehicleValidator} from "./vehicle-validator";
import {TabPanel, TabView} from "primeng/tabview";

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [
    EntityFormComponent,
    NgIf,
    TabPanel,
    TabView
  ],
  template: `
    <h2>Vehicle Form</h2>
    <p-tabView>
      <!-- Onglet 1 : Formulaire principal -->
      <p-tabPanel header="Détails véhicule">
        <app-entity-form
            *ngIf="formDescription"
            [formDescription]="formDescription"
            [entityService]="vehicleService"
            [entity]="vehicleEntity"
            [mode]="mode"
            (receiveResponse)="handleResponse($event)"
        ></app-entity-form>
      </p-tabPanel>

      <!-- Onglet 2 : Équipe affectée -->
      <p-tabPanel header="Équipe affectée" [disabled]="mode === 'create'">
        <!-- Contenu à définir ultérieurement -->
        <p>Contenu pour l'équipe affectée.</p>
      </p-tabPanel>

      <!-- Onglet 3 : Conducteur affecté -->
      <p-tabPanel header="Conducteur affecté" [disabled]="mode === 'create'">
        <!-- Contenu à définir ultérieurement -->
        <p>Contenu pour le conducteur affecté.</p>
      </p-tabPanel>

      <!-- Onglet 4 : Période de non géolocalisation -->
      <p-tabPanel header="Période de non géolocalisation" [disabled]="mode === 'create'">
        <!-- Contenu à définir ultérieurement -->
        <p>Contenu pour la période de non géolocalisation.</p>
      </p-tabPanel>
    </p-tabView>
  `,
  styles: [`
    :host ::ng-deep .p-tabview {
      margin-top: 1rem;
    }
  `]
})
export class VehicleFormComponent implements OnInit {

  @Input() vehicleId?: string;
  @Input() manageNotifications: boolean = true;

  @Output() entityCreated = new EventEmitter<VehicleDTO>();
  @Output() entityUpdated = new EventEmitter<VehicleDTO>();
  @Output() errorInRequest = new EventEmitter<any>();

  public vehicleEntity?: VehicleDTO;
  public formDescription!: IFormDescription;
  public mode: 'create' | 'update' = 'create';

  constructor(
      public vehicleService: VehicleService,
      private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    if (this.vehicleId != null) {
      // Mode édition
      this.loadExistingVehicle(this.vehicleId);
    } else {
      // Mode création
      this.initForCreate();
    }
  }

  /**
   * Charge un véhicule existant depuis le back.
   */
  private loadExistingVehicle(id: string): void {
    this.vehicleService.getById(id).subscribe({
      next: (vehicleDto) => {
        this.vehicleEntity = vehicleDto;
        this.mode = 'update';
        this.buildFormDescription(vehicleDto);
      },
      error: (err) => {
        console.error('Erreur chargement véhicule', err);
      }
    });
  }

  /**
   * Initialise une entité vide pour la création.
   */
  private initForCreate(): void {
    this.vehicleEntity = {
      id: '',
      licenseplate: '',
      externalId: '',
      engine: '',
      energy: '',
      validated: false,
      category: { id: 0, label: '' },
      drivers: null,
      devices: null,
      teams: null,
      ranges: null,
      lastPositionDate: null
    };
    this.mode = 'create';
    this.buildFormDescription(this.vehicleEntity);
  }

  /**
   * Construit la description du formulaire (inputs, validateurs, etc.).
   */
  private buildFormDescription(vehicleDto: VehicleDTO): void {
    forkJoin({
      categories: this.vehicleService.getVehicleCategories()
    }).subscribe(({ categories }) => {
      const categoryOptions = categories.map((cat: VehicleCategoryDTO) => ({
        id: cat.id,
        label: cat.label
      }));

      const inputs: IFormInput[] = [
        new FormInput(
            'licenseplate',
            'text',
            'Plaque d’immatriculation',
            [VehicleValidator.requiredLicensePlate()],
            vehicleDto.licenseplate,
            'Entrez la plaque (ex: AB123CD)',
            true
        ),
        new FormInput(
            'externalid',
            'text',
            'Identifiant externe',
            [VehicleValidator.requiredExternalId()],
            vehicleDto.externalId,
            'ex: EXT123'
        ),
        new FormInput(
            'engine',
            'text',
            'Moteur',
            [VehicleValidator.engineLength()],
            vehicleDto.engine,
            'ex: V8, V8 Turbo'
        ),
        new FormInput(
            'energy',
            'text',
            'Carburant',
            [VehicleValidator.energyLength()],
            vehicleDto.energy,
            'ex: Électrique, Hybride'
        ),
        new AutocompleteFormInput(
            'category',
            'Catégorie',
            [VehicleValidator.requiredCategory()],
            categoryOptions,
            (opt: any) => opt.label,
            vehicleDto.category,
            'Sélectionnez une catégorie'
        )
      ];

      const transformFunction = (rawEntity: any) => {
        return {
          id: this.mode === 'update' ? vehicleDto.id : null,
          licenseplate: rawEntity.licenseplate,
          externalid: rawEntity.externalid,
          engine: rawEntity.engine,
          energy: rawEntity.energy,
          validated: rawEntity.validated,
          category: rawEntity.category?.id ?? null
        } as VehicleForm;
      };

      this.formDescription = new FormDescription(
          'Édition du véhicule',
          inputs,
          undefined,
          undefined,
          transformFunction
      );
    });
  }

  /**
   * Gère la réponse de l'EntityFormComponent (création/mise à jour).
   */
  public handleResponse(response: any): void {
    if (response && !response.error) {
      if (this.mode === 'create') {
        if (this.manageNotifications) {
          this.notificationService.success(
              'Véhicule créé avec succès',
              `Le véhicule "${response.licenseplate}" a été créé.`
          );
        }
        this.entityCreated.emit(response);
        this.mode = 'update';
        this.vehicleEntity = response;
        this.buildFormDescription(response);
      } else {
        if (this.manageNotifications) {
          this.notificationService.success(
              'Véhicule mis à jour avec succès',
              `Le véhicule "${response.licenseplate}" a été mis à jour.`
          );
        }
        this.entityUpdated.emit(response);
      }
    } else if (response && response.error) {
      if (this.manageNotifications) {
        this.notificationService.error(
            'Erreur lors de la sauvegarde du véhicule',
            'Veuillez vérifier les informations et réessayer.'
        );
      }
      this.errorInRequest.emit(response.error);
    }
  }
}
