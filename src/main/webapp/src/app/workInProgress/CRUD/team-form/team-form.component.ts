import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AutocompleteFormInput, FormInput} from "../iform-input";
import {TeamValidator} from "./team-validator";
import {TeamService} from "../../../features/vehicle/team.service";
import {dto} from "../../../../habarta/dto";
import TeamDTO = dto.TeamDTO;
import {IFormDescription} from "../iform-description";
import {FormGroup} from "@angular/forms";
import {FormDescription} from "../form-description";
import {forkJoin} from "rxjs";
import {EntityFormComponent} from "../entity-form/entity-form.component";
import {NgIf} from "@angular/common";
import {NotificationService} from "../../../commons/notification/notification.service";

@Component({
  selector: 'app-team-form',
  standalone: true,
  imports: [
    EntityFormComponent,
    NgIf
  ],
  template: `
    <h2>Team Form</h2>
    <app-entity-form
      *ngIf="formDescription"
      [formDescription]="formDescription"
      [entityService]="teamService"
      [entity]="teamEntity"
      [mode]="mode"
      (receiveResponse)="handleResponse($event)"
    ></app-entity-form>
  `
})
export class TeamFormComponent implements OnInit {
  @Input() manageNotifications: boolean = true;

  @Output() entityCreated = new EventEmitter<TeamDTO>();
  @Output() entityUpdated = new EventEmitter<TeamDTO>();
  @Output() errorInRequest = new EventEmitter<any>();

  teamId?: number;
  public teamEntity?: TeamDTO;
  public formDescription!: IFormDescription;
  public mode: 'create' | 'update' = 'create';

  constructor(
    public teamService: TeamService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    console.log('[TeamFormComponent] ngOnInit - teamId:', this.teamId);
    if (this.teamId != null) {
      console.log('[TeamFormComponent] Initialisation en mode update');
      this.loadExistingTeam(this.teamId);
    } else {
      console.log('[TeamFormComponent] Initialisation en mode create');
      this.initForCreate();
    }
  }

  private loadExistingTeam(id: number): void {
    console.log('[TeamFormComponent] loadExistingTeam - id:', id);
    this.teamService.getById(id).subscribe({
      next: (teamDto) => {
        console.log('[TeamFormComponent] loadExistingTeam - teamDto reçu:', teamDto);
        this.teamEntity = teamDto;
        this.mode = 'update';
        console.log('[TeamFormComponent] loadExistingTeam - mode passé à update, teamEntity mis à jour');
        this.buildFormDescription(teamDto);
      },
      error: (err) => console.error('[TeamFormComponent] Erreur lors du chargement de l\'équipe:', err)
    });
  }

  private initForCreate(): void {
    console.log('[TeamFormComponent] initForCreate appelé');
    this.teamEntity = {
      id: 0,
      label: '',
      path: null,
      parentTeam: null,
      category: { id: 0, label: '' },
      lunchBreakEnd: null,
      lunchBreakStart: null
    };
    this.mode = 'create';
    this.buildFormDescription(this.teamEntity);
  }

  private buildFormDescription(teamDto: TeamDTO): void {
    forkJoin({
      categories: this.teamService.getTeamCategories(),
      agencies: this.teamService.getAgencies()
    }).subscribe(({ categories, agencies }) => {
      console.log('[TeamFormComponent] buildFormDescription - catégories récupérées:', categories);
      console.log('[TeamFormComponent] buildFormDescription - agences récupérées:', agencies);

      const categoryOptions = categories.map(cat => ({ id: cat.id, label: cat.label }));
      const parentOptions = agencies.map(agency => ({ id: agency.id, label: agency.label }));

      const inputs: IFormDescription['formInputs'] = [
        new FormInput(
          'label',
          'text',
          'Libéllé',
          [TeamValidator.requiredLabel()],
          teamDto.label,
          'Veuillez entrer le libéllé',
          true
        ),
        new AutocompleteFormInput(
          'category',
          'Catégorie',
          [TeamValidator.requiredAutocomplete(categoryOptions)],
          categoryOptions,
          (opt: any) => opt.label,
          teamDto.category,
          'Veuillez sélectionner une catégorie'
        ),
        new AutocompleteFormInput(
          'parentTeam',
          'Groupe parent',
          [],
          parentOptions,
          (opt: any) => opt.label,
          teamDto.parentTeam,
          'Veuillez sélectionner un groupe parent'
        )
      ];

      // Définir la fonction de transformation pour extraire les IDs
      const transformFunction = (rawEntity: any) => {
        return {
          id: rawEntity.id,
          label: rawEntity.label,
          path: rawEntity.path,
          parentTeam: rawEntity.parentTeam ? rawEntity.parentTeam.id : null,
          category: rawEntity.category?.id ?? null,
          lunchBreakStartStr: "12:00:00",
          lunchBreakEndStr: "13:30:00"
        };
      };

      this.formDescription = new FormDescription(
        'Édition des groupe',
        inputs,
        TeamValidator.checkCategoryParentConstraint(),
        [
          {
            condition: (group: FormGroup) => {
              const category = group.get('category')?.value;
              return !category || (category && category.label === 'Agence');
            },
            controlsToDisable: ['parentTeam']
          }
        ],
        transformFunction
      );
      console.log('[TeamFormComponent] buildFormDescription - formDescription construit:', this.formDescription);
    });
  }

  public handleResponse(response: any): void {
    console.log('[TeamFormComponent] handleResponse appelé avec response:', response);
    if (response && !response.error) {
      if (this.mode === 'create') {
        if (this.manageNotifications) {
          this.notificationService.success(
            'Team créée avec succès',
            `Team "${response.label}" a été créée.`
          );
        }
        this.entityCreated.emit(response);
        // Passage du mode create à update avec mise à jour de l'entité
        this.mode = 'update';
        this.teamEntity = response;
        console.log('[TeamFormComponent] handleResponse - passage en mode update, teamEntity mis à jour:', this.teamEntity);
        this.buildFormDescription(response);
      } else {
        if (this.manageNotifications) {
          this.notificationService.success(
            'Team mise à jour avec succès',
            `Team "${response.label}" a été mise à jour.`
          );
        }
        this.entityUpdated.emit(response);
      }
    } else if (response && response.error) {
      if(this.manageNotifications) {
        this.notificationService.error(
          'Erreur lors de la sauvegarde du team',
          'Veuillez vérifier les informations et réessayer.'
        );
      }
      this.errorInRequest.emit(response.error);
    }
  }
}

