import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormDescription} from "../../../commons/crud/interface/form-description";
import {dto} from "../../../../habarta/dto";
import VehicleForm = dto.VehicleForm;
import {AutocompleteFormInput, FormInput, IFormInput} from "../../../commons/crud/interface/iform-input";
import VehicleCategoryDTO = dto.VehicleCategoryDTO;
import {forkJoin} from "rxjs";
import VehicleDTO = dto.VehicleDTO;
import {NotificationService} from "../../../commons/notification/notification.service";
import {VehicleService} from "../vehicle.service";
import {IFormDescription} from "../../../commons/crud/interface/iform-description";
import {EntityFormComponent} from "../../../commons/crud/forms/entity-form.component";
import {NgIf} from "@angular/common";
import {VehicleValidator} from "../validator/vehicle-validator";
import {TabPanel, TabView} from "primeng/tabview";
import {DriverVehicleAffectationService, VehicleTeamAffectationService} from "../../../services/affectation.service";
import {TeamService} from "../../teams/team.service";
import {DriverService} from "../../driver/driver.service";
import {AffectationFormComponent} from "../../../commons/crud/forms/affectation-form.component";
import {
  driverOptionExtractor,
  teamOptionExtractor
} from "../../../commons/crud/interface/OptionDTOExtractor";
import {PeriodFormComponent} from "../../../commons/crud/forms/period-form.component";
import {VehicleUpPeriodService} from "../../../services/period.service";

@Component({
  selector: 'app-vehicle-form',
  standalone: true,
  imports: [
    EntityFormComponent,
    NgIf,
    TabPanel,
    TabView,
    AffectationFormComponent,
    PeriodFormComponent
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
        <app-affectation-form
          *ngIf="vehicleEntity?.id"
          [title]="'Affectation - Équipe affectée'"
          [subjectId]="vehicleEntity?.id"
          [affectationService]="vehicleTeamAffectationService"
          [optionService]="teamService"
          [optionExtractor]="teamOptionExtractor"
          [mainEntityRole]="'subject'"
          [serviceToNotify]="vehicleService"
        ></app-affectation-form>
      </p-tabPanel>

      <!-- Onglet 3 : Conducteur affecté -->
      <p-tabPanel header="Conducteur affecté" [disabled]="mode === 'create'">
        <app-affectation-form
          *ngIf="vehicleEntity?.id"
          [title]="'Affectation - Conducteur affecté'"
          [subjectId]="vehicleEntity?.id"
          [affectationService]="driverVehicleAffectationService"
          [optionService]="driverService"
          [optionExtractor]="driverOptionExtractor"
          [mainEntityRole]="'target'"
          [serviceToNotify]="vehicleService"
        ></app-affectation-form>
      </p-tabPanel>

      <!-- Onglet 4 : Période de non géolocalisation -->
      <p-tabPanel header="Période de non géolocalisation" [disabled]="mode === 'create'">
        <app-period-form
          *ngIf="vehicleEntity?.id"
          [title]="'Période de non géolocalisation'"
          [resourceId]="vehicleEntity?.id"
          [periodService]="vehicleUpPeriodService"
          [serviceToNotify]="vehicleService">
        </app-period-form>
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
    private notificationService: NotificationService,
    public teamService: TeamService,
    public driverService: DriverService,
    public vehicleTeamAffectationService: VehicleTeamAffectationService,
    public driverVehicleAffectationService: DriverVehicleAffectationService,
    public vehicleUpPeriodService:VehicleUpPeriodService
  ) {}

  ngOnInit(): void {
    if (this.vehicleId) {
      this.loadExistingVehicle(this.vehicleId);
    } else {
      this.initForCreate();
    }
  }

  private loadExistingVehicle(id: string): void {
    this.vehicleService.getById(id).subscribe({
      next: (vehicleDto) => {
        this.vehicleEntity = vehicleDto;
        this.mode = 'update';
        this.buildFormDescription(vehicleDto);
      },
      error: (err) => console.error('Erreur chargement véhicule', err)
    });
  }

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
    // En mode création, les formulaires d'affectation restent inactifs
  }

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
        // Passage en mode update pour le véhicule
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

  protected readonly teamOptionExtractor = teamOptionExtractor;
  protected readonly driverOptionExtractor = driverOptionExtractor;
}
