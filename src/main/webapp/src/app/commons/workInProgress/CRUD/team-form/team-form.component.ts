import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {AutocompleteFormInput, FormInput, IFormInput} from "../iform-input";
import {TeamValidator} from "./team-validator";
import {TeamService} from "../../../../features/vehicle/team.service";
import {dto} from "../../../../../habarta/dto";
import TeamDTO = dto.TeamDTO;
import {IFormDescription} from "../iform-description";
import {FormGroup} from "@angular/forms";
import {FormDescription} from "../form-description";
import {forkJoin} from "rxjs";
import {EntityFormComponent} from "../entity-form/entity-form.component";
import {NgIf} from "@angular/common";
import {NotificationService} from "../../../notification/notification.service";

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
    if (this.teamId != null) {
      this.loadExistingTeam(this.teamId);
    } else {
      this.initForCreate();
    }
  }

  private loadExistingTeam(id: number): void {
    this.teamService.getById(id).subscribe({
      next: (teamDto) => {
        this.teamEntity = teamDto;
        this.mode = 'update';
        this.buildFormDescription(teamDto);
      },
      error: (err) => console.error('Erreur chargement team', err)
    });
  }

  private initForCreate(): void {
    this.teamEntity = {
      id: 0,
      label: '',
      path: null,
      parentTeam: null,
      category: { id: 0, label: '' },
      //TODO(Fix pour éviter de modifier ces heures !)
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
          category: rawEntity.category?.id ?? null
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
    });
  }

  public handleResponse(response: any): void {
    if (response && !response.error) {
      if (this.mode === 'create') {
        if (this.manageNotifications) {
          // Ajout d'un détail fournissant le résumé de l'action et l'état actuel (ici, le label par exemple)
          this.notificationService.success(
            'Team créée avec succès',
            `Team "${response.label}" a été créée.`
          );
        }
        this.entityCreated.emit(response);
        this.mode = 'update';
        this.teamEntity = response;
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
  }}
