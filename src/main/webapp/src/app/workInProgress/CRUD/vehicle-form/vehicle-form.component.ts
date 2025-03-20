import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormDescription} from "../form-description";
import {dto} from "../../../../habarta/dto";
import VehicleForm = dto.VehicleForm;
import {AutocompleteFormInput, FormInput, IFormInput} from "../iform-input";
import VehicleCategoryDTO = dto.VehicleCategoryDTO;
import {forkJoin} from "rxjs";
import VehicleDTO = dto.VehicleDTO;
import {NotificationService} from "../../../commons/notification/notification.service";
import {VehicleService} from "../../../features/vehicle/vehicle.service";
import {IFormDescription} from "../iform-description";
import {EntityFormComponent} from "../entity-form/entity-form.component";
import {NgIf} from "@angular/common";
import {VehicleValidator} from "./vehicle-validator";
import {TabPanel, TabView} from "primeng/tabview";
import {DriverVehicleAffectationService, VehicleTeamAffectationService} from "../../service/affectation.service";
import {TeamService} from "../../../features/vehicle/team.service";
import {DriverService} from "../../../features/vehicle/driver.service";
import AffectationForm = dto.AffectationForm;

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
        <app-entity-form
          *ngIf="teamAffectationFormDescription"
          [formDescription]="teamAffectationFormDescription"
          [entityService]="vehicleTeamAffectationService"
          [entity]="teamAffectationEntity"
          [mode]="teamAffectationMode"
          (receiveResponse)="handleTeamAffectationResponse($event)"
        ></app-entity-form>
      </p-tabPanel>

      <!-- Onglet 3 : Conducteur affecté -->
      <p-tabPanel header="Conducteur affecté" [disabled]="mode === 'create'">
        <app-entity-form
          *ngIf="driverAffectationFormDescription"
          [formDescription]="driverAffectationFormDescription"
          [entityService]="driverVehicleAffectationService"
          [entity]="driverAffectationEntity"
          mode="create"
          (receiveResponse)="handleDriverAffectationResponse($event)"
        ></app-entity-form>
      </p-tabPanel>

      <!-- Onglet 4 : Période de non géolocalisation -->
      <p-tabPanel header="Période de non géolocalisation" [disabled]="mode === 'create'">
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

  // Pour le formulaire d'affectation d'équipe
  public teamAffectationFormDescription!: IFormDescription;
  public teamAffectationEntity?: any; // AffectationForm
  public teamAffectationMode: 'create' | 'update' = 'create';

  // Pour le formulaire d'affectation de conducteur (reste inchangé ici)
  public driverAffectationFormDescription!: IFormDescription;
  public driverAffectationEntity?: any;

  constructor(
    public vehicleService: VehicleService,
    private notificationService: NotificationService,
    private teamService: TeamService,
    private driverService: DriverService,
    public vehicleTeamAffectationService: VehicleTeamAffectationService,
    public driverVehicleAffectationService: DriverVehicleAffectationService,
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

  private loadExistingVehicle(id: string): void {
    this.vehicleService.getById(id).subscribe({
      next: (vehicleDto) => {
        this.vehicleEntity = vehicleDto;
        this.mode = 'update';
        this.buildFormDescription(vehicleDto);
        // En mode update, on construit également les formulaires d'affectation
        this.buildTeamAffectationFormDescription();
        this.buildDriverAffectationFormDescription();
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

  private buildTeamAffectationFormDescription(): void {
    forkJoin({
      teams: this.teamService.getAuthorizedData() // Liste de TeamDTO
    }).subscribe(({ teams }) => {
      const teamOptions = teams.map(team => ({ id: team.id, label: team.label }));

      // Si une affectation existe déjà (mode update), pré-remplir les valeurs, sinon utiliser null.
      const currentTargetId = this.teamAffectationEntity ? this.teamAffectationEntity.targetId : null;
      const currentStartDate = this.teamAffectationEntity ? this.teamAffectationEntity.startDate : null;
      const currentEndDate = this.teamAffectationEntity ? this.teamAffectationEntity.endDate : null;

      const inputs: IFormInput[] = [
        new AutocompleteFormInput(
          'targetId',
          'Équipe',
          [],
          teamOptions,
          (opt: any) => opt.label,
          currentTargetId,
          'Sélectionnez une équipe'
        ),
        new FormInput(
          'startDate',
          'date',
          'Date de début',
          [],
          currentStartDate,
          'Sélectionnez la date de début'
        ),
        new FormInput(
          'endDate',
          'date',
          'Date de fin',
          [],
          currentEndDate,
          'Sélectionnez la date de fin (facultatif)'
        )
      ];

      // Fonction utilitaire pour formater une date courte en timestamp ISO avec heure fixée à 00:00:00.000Z
      const formatDate = (date: any): any => {
        if (!date) return null;
        if (typeof date === 'string' && date.length === 10) {
          return date + 'T00:00:00.000Z';
        }
        return date;
      };

      const transformFunction = (rawEntity: any) => {
        const payload: any = {
          subjectId: this.vehicleEntity?.id, // Le véhicule est le sujet
          targetId: rawEntity.targetId && rawEntity.targetId.id ? rawEntity.targetId.id : rawEntity.targetId,
          startDate: formatDate(rawEntity.startDate),
          endDate: formatDate(rawEntity.endDate)
        };
        // Si nous sommes en mode update pour l'affectation, inclure l'id existant
        if (this.teamAffectationMode === 'update' && this.teamAffectationEntity && this.teamAffectationEntity.id) {
          payload.id = this.teamAffectationEntity.id;
        }
        console.log('Team Affectation Request Payload:', payload);
        return payload;
      };

      this.teamAffectationFormDescription = new FormDescription(
        'Affectation - Équipe affectée',
        inputs,
        undefined,
        undefined,
        transformFunction
      );
    });
  }

  private buildDriverAffectationFormDescription(): void {
    forkJoin({
      drivers: this.driverService.getAuthorizedData() // Liste de DriverDTO
    }).subscribe(({ drivers }) => {
      const driverOptions = drivers.map(driver => ({ id: driver.id, label: driver.firstName + ' ' + driver.lastName }));
      const inputs: IFormInput[] = [
        new AutocompleteFormInput(
          'subjectId',
          'Conducteur',
          [],
          driverOptions,
          (opt: any) => opt.label,
          null,
          'Sélectionnez un conducteur'
        ),
        new FormInput(
          'startDate',
          'date',
          'Date de début',
          [],
          null,
          'Sélectionnez la date de début'
        ),
        new FormInput(
          'endDate',
          'date',
          'Date de fin',
          [],
          null,
          'Sélectionnez la date de fin (facultatif)'
        )
      ];
      const transformFunction = (rawEntity: any) => {
        const payload = {
          subjectId: rawEntity.subjectId && rawEntity.subjectId.id ? rawEntity.subjectId.id : rawEntity.subjectId,
          targetId: this.vehicleEntity?.id, // Le véhicule est le target
          startDate: rawEntity.startDate,
          endDate: rawEntity.endDate
        } as AffectationForm;
        console.log('Driver Affectation Request Payload:', payload);
        return payload;
      };
      this.driverAffectationFormDescription = new FormDescription(
        'Affectation - Conducteur affecté',
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
        // Maintenant que le véhicule est créé, on peut construire les formulaires d'affectation
        this.teamAffectationMode = 'create'; // On démarre en mode création pour l'affectation
        this.buildTeamAffectationFormDescription();
        this.buildDriverAffectationFormDescription();
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

  public handleTeamAffectationResponse(response: any): void {
    if (response && !response.error) {
      this.notificationService.success(
        'Affectation équipe réussie',
        'L\'affectation de l\'équipe a été effectuée avec succès.'
      );
      // Si le formulaire était en mode création, on passe en mode update en stockant l'affectation créée
      if (this.teamAffectationMode === 'create') {
        this.teamAffectationMode = 'update';
        this.teamAffectationEntity = response;
        // On peut reconstruire le formulaire pour inclure l'id dans la transformation
        this.buildTeamAffectationFormDescription();
      }
    } else if (response && response.error) {
      this.notificationService.error(
        'Erreur affectation équipe',
        'Une erreur est survenue lors de l\'affectation de l\'équipe.'
      );
    }
  }

  public handleDriverAffectationResponse(response: any): void {
    if (response && !response.error) {
      this.notificationService.success(
        'Affectation conducteur réussie',
        'L\'affectation du conducteur a été effectuée avec succès.'
      );
      // Pour le formulaire conducteur, nous pouvons faire de même si nécessaire
      // (Par exemple, passer en mode update et stocker la réponse dans driverAffectationEntity)
    } else if (response && response.error) {
      console.log(response.error);
      this.notificationService.error(
        'Erreur affectation conducteur',
        'Une erreur est survenue lors de l\'affectation du conducteur.'
      );
    }
  }
}
