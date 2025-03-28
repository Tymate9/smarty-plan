import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { forkJoin } from 'rxjs';
import { EntityFormComponent } from '../entity-form/entity-form.component';
import { NgIf } from '@angular/common';
import { DriverService } from '../../../features/vehicle/driver.service';
import { dto } from '../../../../habarta/dto';
import DriverDTO = dto.DriverDTO;
import { IFormDescription } from '../iform-description';
import { FormDescription } from '../form-description';
import { FormInput } from '../iform-input';
import { NotificationService } from '../../../commons/notification/notification.service';
import {DriverValidator} from "./driver-validator";
import {TabPanel, TabView} from "primeng/tabview";
import {AffectationFormComponent} from "../../affectation-form/affectation-form.component";
import {DriverTeamAffectationService, DriverVehicleAffectationService} from "../../service/affectation.service";
import {TeamService} from "../../../features/vehicle/team.service";
import {
  driverOptionExtractor,
  teamOptionExtractor, vehicleOptionExtractor
} from "../../../../../../kotlin/net/enovea/workInProgress/vehicleCRUD/OptionDTOExtractor";
import DriverForm = dto.DriverForm;
import {PeriodFormComponent} from "../../period-form/period-form/period-form.component";
import {DriverUpPeriodService} from "../../service/period.service";
import {VehicleService} from "../../../features/vehicle/vehicle.service";

@Component({
  selector: 'app-driver-form',
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
    <h2>Driver Form</h2>
    <p-tabView>
      <!-- Onglet 1 : Détails du driver -->
      <p-tabPanel header="Détails du driver">
        <app-entity-form
          *ngIf="formDescription"
          [formDescription]="formDescription"
          [entityService]="driverService"
          [entity]="driverEntity"
          [mode]="mode"
          (receiveResponse)="handleResponse($event)"
        ></app-entity-form>
      </p-tabPanel>

      <!-- Onglet 2 : Période de non géolocalisation (uniquement en mode update) -->
      <p-tabPanel header="Véhicule affecté" [disabled]="mode === 'create'">
        <app-affectation-form
          *ngIf="driverEntity?.id"
          [title]="'Affectation - Véhicule affecté'"
          [subjectId]="driverEntity?.id"
          [affectationService]="driverVehicleAffectationService"
          [optionService]="vehicleService"
          [optionExtractor]="vehicleOptionExtractor"
          [mainEntityRole]="'subject'"
          [serviceToNotify]="driverService"
        ></app-affectation-form>
      </p-tabPanel>

      <!-- Onglet 3 : Affectation - Équipe affectée (uniquement en mode update) -->
      <p-tabPanel header="Affectation - Équipe affectée" [disabled]="mode === 'create'">
        <app-affectation-form
          [title]="'Affectation - Équipe affectée'"
          [subjectId]="driverId"
          [affectationService]="driverTeamAffectationService"
          [optionService]="teamService"
          [mainEntityRole]="'subject'"
          [optionExtractor]="teamOptionExtractor"
          [serviceToNotify]="driverService"
        ></app-affectation-form>
      </p-tabPanel>

      <!-- Onglet 4 : Période de non géolocalisation (uniquement en mode update) -->
      <p-tabPanel header="Période de non géolocalisation" [disabled]="mode === 'create'">
        <app-period-form
          *ngIf="driverEntity?.id"
          [title]="'Période de non géolocalisation'"
          [resourceId]="driverEntity?.id"
          [periodService]="driverUpPeriodService"
          [serviceToNotify]="driverService">
        </app-period-form>
      </p-tabPanel>
    </p-tabView>
  `
})
export class DriverFormComponent implements OnInit {
  @Input() manageNotifications: boolean = true;
  @Input() driverId?: number;

  @Output() entityCreated = new EventEmitter<DriverDTO>();
  @Output() entityUpdated = new EventEmitter<DriverDTO>();
  @Output() errorInRequest = new EventEmitter<any>();

  public driverEntity?: DriverDTO;
  public formDescription!: IFormDescription;
  public mode: 'create' | 'update' = 'create';

  constructor(
    public driverService: DriverService,
    private notificationService: NotificationService,
    public driverTeamAffectationService: DriverTeamAffectationService,
    public teamService: TeamService,
    public driverUpPeriodService: DriverUpPeriodService,
    public driverVehicleAffectationService: DriverVehicleAffectationService,
    public vehicleService: VehicleService
  ) {}

  ngOnInit(): void {
    if (this.driverId != null) {
      this.loadExistingDriver(this.driverId);
    } else {
      this.initForCreate();
    }
  }

  private loadExistingDriver(id: number): void {
    this.driverService.getById(id).subscribe({
      next: (driverDto) => {
        this.driverEntity = driverDto;
        this.mode = 'update';
        this.buildFormDescription(driverDto);
      },
      error: (err) => {
        console.error('Erreur chargement driver', err);
        if (this.manageNotifications) {
          this.notificationService.error('Erreur de chargement', 'Impossible de charger le driver.');
        }
      }
    });
  }

  private initForCreate(): void {
    // Initialisation d'un driver vide pour la création
    this.driverEntity = {
      id: 0,
      firstName: '',
      lastName: '',
      phoneNumber: '',
      team: null
    };
    this.mode = 'create';
    this.buildFormDescription(this.driverEntity);
  }

  private buildFormDescription(driverDto: DriverDTO): void {
    const inputs = [
      new FormInput(
        'first_name',
        'text',
        'Prénom',
        [DriverValidator.requiredFirstName()],
        driverDto.firstName,
        'Veuillez entrer le prénom',
        true
      ),
      new FormInput(
        'last_name',
        'text',
        'Nom',
        [DriverValidator.requiredLastName()],
        driverDto.lastName,
        'Veuillez entrer le nom',
        true
      ),
      new FormInput(
        'phone_number',
        'text',
        'Téléphone',
        [DriverValidator.validPhoneNumber()],
        driverDto.phoneNumber,
        'Veuillez entrer le numéro de téléphone (optionnel)',
        true
      )
    ];

    const transformFunction = (rawEntity: any) => {
      return {
        id: rawEntity.id,
        firstName: rawEntity.first_name,
        lastName: rawEntity.last_name,
        phoneNumber: rawEntity.phone_number
      } as DriverForm;
    };

    this.formDescription = new FormDescription(
      'Création / Mise à jour du Driver',
      inputs,
      undefined, // Aucun validateur global nécessaire ici
      [],        // Pas de dépendances particulières
      transformFunction
    );
  }

  public handleResponse(response: any): void {
    if (response && !response.error) {
      if (this.mode === 'create') {
        if (this.manageNotifications) {
          console.log(response)
          this.notificationService.success(
            'Conducteur créé avec succès',
            `Conducteur "${response.firstName} ${response.lastName}" a été créé.`
          );
        }
        this.entityCreated.emit(response);
        // Passage en mode update après création
        this.mode = 'update';
        this.driverEntity = response;
        this.driverId = response.id;
        this.buildFormDescription(response);
      } else {
        if (this.manageNotifications) {
          this.notificationService.success(
            'Driver mis à jour avec succès',
            `Driver "${response.first_name} ${response.last_name}" a été mis à jour.`
          );
        }
        this.entityUpdated.emit(response);
      }
    } else if (response && response.error) {
      if (this.manageNotifications) {
        this.notificationService.error(
          'Erreur lors de la sauvegarde du driver',
          'Veuillez vérifier les informations et réessayer.'
        );
      }
      this.errorInRequest.emit(response.error);
    }
  }

  protected readonly teamOptionExtractor = teamOptionExtractor;
  protected readonly driverOptionExtractor = driverOptionExtractor;
  protected readonly vehicleOptionExtractor = vehicleOptionExtractor;
}
