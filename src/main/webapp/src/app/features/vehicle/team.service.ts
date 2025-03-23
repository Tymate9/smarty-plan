import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable, of} from 'rxjs';
import {dto} from "../../../habarta/dto";
import TeamDTO = dto.TeamDTO;
import {IEntityService} from "../../workInProgress/CRUD/ientity-service";
import TeamCategoryDTO = dto.TeamCategoryDTO;
import TeamForm = dto.TeamForm;
import {EntityColumn} from "../../workInProgress/entityAdminModule/entity-tree/entity-tree.component";
import {MessageService, TreeNode} from "primeng/api";
import {TeamFormComponent} from "../../workInProgress/CRUD/team-form/team-form.component";
import {CompOpenerButtonComponent} from "../../workInProgress/drawer/comp-opener-button.component";
import {
  EntityDeleteButtonComponent
} from "../../workInProgress/entity-delete-button-component/entity-delete-button.component";

@Injectable({
  providedIn: 'root'
})
export class TeamService implements IEntityService<TeamDTO, TeamForm>{

  private baseUrl = '/api/teams';  // URL to the backend API

  constructor(
    private http: HttpClient,
    private messageService: MessageService
  ) {}

  // Fetch agencies from the backend
  getAgencies(): Observable<TeamDTO[]> {
    return this.http.get<TeamDTO[]>(this.baseUrl);
  }

  // Fetch all teamCategory from the backend
  getTeamCategories(): Observable<TeamCategoryDTO[]> {
    return this.http.get<TeamCategoryDTO[]>(`${this.baseUrl}/category`)
  }

  getTeamTree(): Observable<any[]> {
    return this.http.get<any[]>(this.baseUrl).pipe(
      map(teams => this.buildTeamTree(teams))
    );
  }

  private buildTeamTree(teams: any[]): any[] {
    const teamMap = new Map<number, any>();
    teams.forEach(team => teamMap.set(team.id, { ...team, children: [] }));

    const teamTree: any[] = [];
    teams.forEach(team => {
      if (team.parent_id) {
        const parent = teamMap.get(team.parent_id);
        parent.children.push(teamMap.get(team.id));
      } else {
        teamTree.push(teamMap.get(team.id));
      }
    });
    return teamTree;
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

  /**
   * Crée un nouveau Team en envoyant un TeamForm (appelle @POST /api/teams)
   */
  create(teamForm: TeamForm): Observable<TeamDTO> {
    return this.http.post<TeamDTO>(this.baseUrl, teamForm);
  }

  /**
   * Met à jour un Team existant en envoyant un TeamForm (appelle @PUT /api/teams/{id})
   */
  update(teamForm: TeamForm): Observable<TeamDTO> {
    // On s’attend à ce que teamForm.id soit déjà valorisé
    return this.http.put<TeamDTO>(`${this.baseUrl}/${teamForm.id}`, teamForm);
  }

  /**
   * Supprime un Team (appelle @DELETE /api/teams/{id})
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
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

  /** Récupère les TreeNodes */
  getTreeNodes(): Observable<TreeNode[]> {
    return this.getAuthorizedData().pipe(
      map((teams: TeamDTO[]) => {
        // 1) Grouper par catégorie (ex. "Agence", "Service", etc.)
        const catMap = new Map<string, TeamDTO[]>();

        teams.forEach(team => {
          const catLabel = team.category.label;
          if (!catMap.has(catLabel)) {
            catMap.set(catLabel, []);
          }
          catMap.get(catLabel)!.push(team);
        });

        // 2) Pour chaque catégorie, on crée un "root" TreeNode
        const treeNodes: TreeNode[] = [];

        for (const [catLabel, catTeams] of catMap.entries()) {
          // chaque team = leaf
          const childrenLeafs: TreeNode[] = catTeams.map(team => this.buildTeamLeaf(team));

          treeNodes.push({
            label: catLabel,
            expanded: false,
            children: childrenLeafs
          });
        }
        console.log(treeNodes)
        return treeNodes;
      })
    );
  }

  /**
   * Construit un leaf TreeNode pour une équipe.
   */
  private buildTeamLeaf(team: TeamDTO): TreeNode {
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
