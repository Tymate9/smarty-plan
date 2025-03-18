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

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [
    EntityFormComponent,
    NgIf
  ],
  template: `
    <h2>Vehicle Form</h2>
    <app-entity-form
      *ngIf="formDescription"
      [formDescription]="formDescription"
      [entityService]="vehicleService"
      [entity]="vehicleEntity"
      [mode]="mode"
      (receiveResponse)="handleResponse($event)"
    ></app-entity-form>
  `,
  styles: [``]
})
export class VehicleFormComponent implements OnInit {

  @Input() vehicleId?: string;             // ID du véhicule à éditer, si mode "update"
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
    // Récupère la liste des catégories en parallèle si nécessaire
    forkJoin({
      categories: this.vehicleService.getVehicleCategories()
    }).subscribe(({ categories }) => {
      const categoryOptions = categories.map((cat: VehicleCategoryDTO) => ({
        id: cat.id,
        label: cat.label
      }));

      // Construction de la liste des inputs
      const inputs: IFormInput[] = [
        new FormInput(
          'licenseplate',
          'text',
          'Plaque d’immatriculation',
          [],  // on ajoutera un Validators.required plus tard
          vehicleDto.licenseplate,
          'Entrez la plaque (ex: AB123CD)',
          true
        ),
        new FormInput(
          'externalid',
          'text',
          'Identifiant externe',
          [],
          vehicleDto.externalId,
          'ex: EXT123'
        ),
        new FormInput(
          'engine',
          'text',
          'Moteur',
          [],
          vehicleDto.engine,
          'ex: V8, V8 Turbo'
        ),
        new FormInput(
          'energy',
          'text',
          'Carburant',
          [],
          vehicleDto.energy,
          'ex: Électrique, Hybride'
        ),
        new FormInput(
          'validated',
          'text',
          'Actif (true/false)',
          [],
          vehicleDto.validated
        ),
        new AutocompleteFormInput(
          'category',
          'Catégorie',
          [],
          categoryOptions,
          (opt: any) => opt.label,   // Fonction d’affichage
          vehicleDto.category,
          'Sélectionnez une catégorie'
        )
      ];

      // Fonction de transformation pour extraire l’id de la catégorie, etc.
      const transformFunction = (rawEntity: any) => {
        return {
          id: rawEntity.id,
          licenseplate: rawEntity.licenseplate,
          externalid: rawEntity.externalid,
          engine: rawEntity.engine,
          energy: rawEntity.energy,
          validated: rawEntity.validated,
          category: rawEntity.category?.id ?? null
        } as VehicleForm; // On caste en VehicleForm pour clarifier le type
      };

      // On peut laisser le formValidator et dependencies à undefined
      this.formDescription = new FormDescription(
        'Édition du véhicule',
        inputs,
        undefined,          // formValidator: on le mettra plus tard si besoin
        undefined,          // dependencies: idem
        transformFunction
      );
    });
  }

  /**
   * Gère la réponse de l'EntityFormComponent (création/mise à jour).
   */
  public handleResponse(response: any): void {
    if (response && !response.error) {
      // Cas succès
      if (this.mode === 'create') {
        if (this.manageNotifications) {
          this.notificationService.success(
            'Véhicule créé avec succès',
            `Le véhicule "${response.licenseplate}" a été créé.`
          );
        }
        this.entityCreated.emit(response);
        // Bascule en mode update
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
      // Cas erreur
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
