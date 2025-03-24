import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable, of, Subject} from 'rxjs';
import {dto} from "../../../habarta/dto";
import TeamDTO = dto.TeamDTO;
import {CrudEvent, IEntityService} from "../../workInProgress/CRUD/ientity-service";
import TeamCategoryDTO = dto.TeamCategoryDTO;
import TeamForm = dto.TeamForm;
import {EntityColumn} from "../../workInProgress/entityAdminModule/entity-tree/entity-tree.component";
import {MessageService, TreeNode} from "primeng/api";
import {TeamFormComponent} from "../../workInProgress/CRUD/team-form/team-form.component";
import {CompOpenerButtonComponent} from "../../workInProgress/drawer/comp-opener-button.component";
import {
  EntityDeleteButtonComponent
} from "../../workInProgress/entity-delete-button-component/entity-delete-button.component";
import {DrawerOptions} from "../../workInProgress/drawer/drawer.component";

@Injectable({
  providedIn: 'root'
})
export class TeamService implements IEntityService<TeamDTO, TeamForm>{

  private baseUrl = '/api/teams';  // URL to the backend API

  constructor(
    private http: HttpClient,
    private messageService: MessageService
  ) {}

  private _crudEvents: Subject<CrudEvent<TeamDTO>> = new Subject<CrudEvent<TeamDTO>>();
  public crudEvents$: Observable<CrudEvent<TeamDTO>> = this._crudEvents.asObservable();
  notifyCrudEvent(event: CrudEvent<TeamDTO>): void {
    this._crudEvents.next(event);
  }

  getDrawerOptions(id: any | null): DrawerOptions {
    if (!id) {
      // Mode création
      return {
        headerTitle: 'Créer un groupe',
        closeConfirmationMessage: 'Voulez-vous fermer ce panneau ?',
        child: {
          compClass: TeamFormComponent,
          inputs: {
            vehicleId: '',
          }
        }
      };
    } else {
      return {
        headerTitle: `Édition du groupe`,
        closeConfirmationMessage: 'Voulez-vous fermer ce panneau ?',
        child: {
          compClass: TeamFormComponent,
          inputs: {
            vehicleId: id
          }
        }
      };
    }
  }

  // Fetch agencies from the backend
  getAgencies(): Observable<TeamDTO[]> {
    return this.http.get<TeamDTO[]>(this.baseUrl);
  }

  // Fetch all teamCategory from the backend
  getTeamCategories(): Observable<TeamCategoryDTO[]> {
    return this.http.get<TeamCategoryDTO[]>(`${this.baseUrl}/category`)
  }

  getTeamsInPause(time: string): Observable<string> {
    return this.http.get(`${this.baseUrl}/pause`, {
      params: { time },
      responseType: 'text'
    });
  }

  getById(id: number): Observable<TeamDTO> {
    return this.http.get<TeamDTO>(`${this.baseUrl}/${id}`);
  }

  create(teamForm: TeamForm): Observable<TeamDTO> {
    return this.http.post<TeamDTO>(this.baseUrl, teamForm);
  }

  update(teamForm: TeamForm): Observable<TeamDTO> {
    // On s’attend à ce que teamForm.id soit déjà valorisé
    return this.http.put<TeamDTO>(`${this.baseUrl}/${teamForm.id}`, teamForm);
  }

  delete(id: number): Observable<TeamDTO> {
    return this.http.delete<TeamDTO>(`${this.baseUrl}/${id}`);
  }

  getCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/count`);
  }

  getStats(): Observable<dto.StatsDTO> {
    return this.http.get<dto.StatsDTO>(`${this.baseUrl}/stats`);
  }

  getAuthorizedData(): Observable<TeamDTO[]> {
    return this.http.get<TeamDTO[]>(`${this.baseUrl}/authorized-data`);
  }

  getTreeColumns(): Observable<EntityColumn[]> {
    // On renvoie un Observable simple, en dur.
    return of([
      {
        field: 'label',
        header: 'Nom Équipe',
        ascending: true,
        comparator: (valA: string, valB: string, asc: boolean) =>
          asc ? valA.localeCompare(valB) : valB.localeCompare(valA),
      },
      {
        field: 'parentLabel',
        header: 'Équipe Parent',
        ascending: true,
        comparator: (valA: string, valB: string, asc: boolean) =>
          asc ? valA.localeCompare(valB) : valB.localeCompare(valA),
      },
      {
        field: 'categoryLabel',
        header: 'Catégorie',
        ascending: true,
        comparator: (valA: string, valB: string, asc: boolean) =>
          asc ? valA.localeCompare(valB) : valB.localeCompare(valA),
      },
      {
        header: 'Actions',
        isDynamic: true
      }
    ]);
  }

  getTreeNodes(): Observable<TreeNode[]> {
    return this.getAuthorizedData().pipe(
      map((teams: TeamDTO[]) => {
        // Grouper par category.id
        const catMap = new Map<number, { label: string; teams: TeamDTO[] }>();
        teams.forEach(team => {
          const catId = team.category.id;
          const catLabel = team.category.label;
          if (!catMap.has(catId)) {
            catMap.set(catId, { label: catLabel, teams: [] });
          }
          catMap.get(catId)!.teams.push(team);
        });

        // Créer un TreeNode groupe pour chaque catégorie
        const treeNodes: TreeNode[] = [];
        for (const [catId, group] of catMap.entries()) {
          const childrenLeafs: TreeNode[] = group.teams.map(team => this.buildTreeLeaf(team));
          treeNodes.push({
            data: {
              groupId : catId.toString()
            },
            label: group.label,
            expanded: false,
            children: childrenLeafs
          });
        }
        return treeNodes;
      })
    );
  }

  buildTreeLeaf(team: TeamDTO): TreeNode {
    const parentLabel = team.parentTeam ? team.parentTeam.label : '';

    // Premier bouton : "Modifier [team.label]"
    const editButton = {
      compClass: CompOpenerButtonComponent,
      inputs: {
        label: 'Modifier ' + team.label,
        drawerOptions: {
          headerTitle: 'Édition de ' + team.label,
          closeConfirmationMessage: 'Voulez-vous vraiment fermer ce panneau ?',
          child: {
            compClass: TeamFormComponent,
            inputs: {
              teamId: team.id
            }
          }
        }
      }
    };
    // Second bouton : "Supprimer l'entité"
    const deleteButton = {
      compClass: EntityDeleteButtonComponent,
      inputs: {
        label: 'Supprimer ' + team.label,
        entityId: team.id,
        entityService: this,
        confirmationMessage: 'Voulez-vous vraiment supprimer l\'équipe ' + team.label + ' ?',
        onError: (err: any) => {
          this.messageService.add({severity:'error', summary:'Erreur', detail: err?.message ?? 'Une erreur est survenue.'});
        }
      }
    };
    // On place ces deux boutons dans le conteneur dynamique sous la clé "Actions"
    const dynamicComps = [editButton, deleteButton];

    return {
      data: {
        id:team.id,
        parentId: team.category.id,
        label: team.label,
        parentLabel: parentLabel,
        categoryLabel: team.category.label,
        dynamicComponents: {
          Actions: dynamicComps
        }
      },
      children: [],
      expanded: false
    };
  }
}
