import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {AutocompleteFormInput, FormInput, IFormInput} from "../iform-input";
import {TeamValidator} from "../team-validator";
import {TeamService} from "../../../../features/vehicle/team.service";
import {dto} from "../../../../../habarta/dto";
import TeamDTO = dto.TeamDTO;
import {IFormDescription} from "../iform-description";
import {FormGroup} from "@angular/forms";
import {FormDescription} from "../form-description";
import {forkJoin} from "rxjs";

@Component({
  selector: 'app-team-form',
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
  @Output() entityCreated = new EventEmitter<TeamDTO>();
  @Output() entityUpdated = new EventEmitter<TeamDTO>();
  @Output() errorInRequest = new EventEmitter<any>();

  teamId?: number;
  public teamEntity?: TeamDTO;
  public formDescription!: IFormDescription;
  public mode: 'create' | 'update' = 'create';

  constructor(public teamService: TeamService) {}

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
      category: { id: 0, label: '' }
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
          'parent',
          'Groupe parent',
          [],
          parentOptions,
          (opt: any) => opt.label,
          teamDto.parentTeam,
          'Veuillez sélectionner un groupe parent'
        )
      ];

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
            controlsToDisable: ['parent']
          }
        ]
      );
    });
  }

  public handleResponse(response: any): void {
    if (response && !response.error) {
      if (this.mode === 'create') {
        this.entityCreated.emit(response);
        // Passer en mode update après création
        this.mode = 'update';
        this.teamEntity = response;
        this.buildFormDescription(response);
      } else {
        this.entityUpdated.emit(response);
      }
    } else if (response && response.error) {
      this.errorInRequest.emit(response.error);
    }
  }
}
