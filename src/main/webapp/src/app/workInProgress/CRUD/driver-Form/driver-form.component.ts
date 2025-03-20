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

@Component({
  selector: 'app-driver-form',
  standalone: true,
  imports: [
    EntityFormComponent,
    NgIf
  ],
  template: `
    <h2>Driver Form</h2>
    <app-entity-form
      *ngIf="formDescription"
      [formDescription]="formDescription"
      [entityService]="driverService"
      [entity]="driverEntity"
      [mode]="mode"
      (receiveResponse)="handleResponse($event)"
    ></app-entity-form>
  `
})
export class DriverFormComponent implements OnInit {
  @Input() manageNotifications: boolean = true;

  @Output() entityCreated = new EventEmitter<DriverDTO>();
  @Output() entityUpdated = new EventEmitter<DriverDTO>();
  @Output() errorInRequest = new EventEmitter<any>();

  driverId?: number;
  public driverEntity?: DriverDTO;
  public formDescription!: IFormDescription;
  public mode: 'create' | 'update' = 'create';

  constructor(
    public driverService: DriverService,
    private notificationService: NotificationService
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
          this.notificationService.error(
            'Erreur de chargement',
            'Impossible de charger le driver.'
          );
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
    // Construction des inputs pour le formulaire Driver
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

    // Fonction de transformation pour préparer l'objet Driver avant envoi
    const transformFunction = (rawEntity: any) => {
      return {
        id: rawEntity.id,
        first_name: rawEntity.first_name,
        last_name: rawEntity.last_name,
        phone_number: rawEntity.phone_number
      };
    };

    this.formDescription = new FormDescription(
      'Création / Mise à jour du Driver',
      inputs,
      undefined,  // Aucun validateur global pour le formulaire n'est nécessaire ici
      [],         // Pas de dépendances particulières pour ces champs
      transformFunction
    );
  }

  public handleResponse(response: any): void {
    if (response && !response.error) {
      if (this.mode === 'create') {
        if (this.manageNotifications) {
          this.notificationService.success(
            'Driver créé avec succès',
            `Driver "${response.first_name} ${response.last_name}" a été créé.`
          );
        }
        this.entityCreated.emit(response);
        this.mode = 'update';
        this.driverEntity = response;
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
}
