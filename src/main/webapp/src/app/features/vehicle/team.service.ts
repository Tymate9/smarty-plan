import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable, of} from 'rxjs';
import {dto} from "../../../habarta/dto";
import TeamDTO = dto.TeamDTO;
import {IEntityService} from "../../commons/workInProgress/CRUD/ientity-service";
import TeamCategoryDTO = dto.TeamCategoryDTO;
import TeamForm = dto.TeamForm;
import {EntityColumn} from "../../commons/workInProgress/entityAdminModule/entity-tree/entity-tree.component";
import {TreeNode} from "primeng/api";
import {DrawerComponent} from "../../commons/workInProgress/drawer/drawer.component";
import {TeamFormComponent} from "../../commons/workInProgress/CRUD/team-form/team-form.component";
import {CompOpenerButtonComponent} from "../../commons/workInProgress/drawer/comp-opener-button.component";


@Injectable({
  providedIn: 'root'
})
export class TeamService implements IEntityService<TeamDTO, TeamForm>{

  private apiUrl = '/api/teams';  // URL to the backend API

  constructor(private http: HttpClient) {}

  // Fetch agencies from the backend
  getAgencies(): Observable<TeamDTO[]> {
    return this.http.get<TeamDTO[]>(this.apiUrl);
  }

  // Fetch all teamCategory from the backend
  getTeamCategories(): Observable<TeamCategoryDTO[]> {
    return this.http.get<TeamCategoryDTO[]>(`${this.apiUrl}/category`)
  }

  getTeamTree(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl).pipe(
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
    return this.http.get(`${this.apiUrl}/pause`, {
      params: { time },
      responseType: 'text'
    });
  }

  /**
   * Récupère un Team particulier, si tu souhaites faire un "edit" côté front.
   * Pour cela, il faut avoir un @GET("/api/teams/{id}") côté Quarkus.
   * Si ce n'est pas encore créé, tu peux l'ajouter.
   */
  getById(id: number): Observable<TeamDTO> {
    return this.http.get<TeamDTO>(`${this.apiUrl}/${id}`);
  }

  /**
   * Crée un nouveau Team en envoyant un TeamForm (appelle @POST /api/teams)
   */
  create(teamForm: TeamForm): Observable<TeamDTO> {
    console.log("Juste avant la requête API")
    console.log(teamForm)
    return this.http.post<TeamDTO>(this.apiUrl, teamForm);
  }

  /**
   * Met à jour un Team existant en envoyant un TeamForm (appelle @PUT /api/teams/{id})
   */
  update(teamForm: TeamForm): Observable<TeamDTO> {
    // On s’attend à ce que teamForm.id soit déjà valorisé
    return this.http.put<TeamDTO>(`${this.apiUrl}/${teamForm.id}`, teamForm);
  }

  /**
   * Supprime un Team (appelle @DELETE /api/teams/{id})
   */
  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getCount(): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/count`);
  }

  getStats(): Observable<dto.TeamEntityStatsDTO> {
    return this.http.get<dto.TeamEntityStatsDTO>(`${this.apiUrl}/stats`);
  }

  getAuthorizedData(): Observable<TeamDTO[]> {
    return this.http.get<TeamDTO[]>(`${this.apiUrl}/authorized-data`);
  }

  getTreeColumns(): Observable<EntityColumn[]> {
    // On renvoie un Observable simple, en dur.
    // On peut utiliser of(...) pour créer un Observable immédiat.
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
            label: catLabel,  // Le label du nœud parent
            expanded: true,   // ou false
            children: childrenLeafs
          });
        }

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
      compClass: CompOpenerButtonComponent,  // Nouveau composant déclencheur
      inputs: {
        label: 'Modifier ' + team.label, // Libellé du bouton
        drawerOptions: {                // Options à transmettre au Drawer via DrawerService
          headerTitle: 'Édition de ' + team.label,
          closeConfirmationMessage: 'Voulez-vous vraiment fermer ce panneau ?',
          child: {
            compClass: TeamFormComponent, // Composant de formulaire d'édition
            inputs: {
              teamId: team.id
            }
          }
        }
      }
    };

    // Second bouton : "Créer un sous-groupe"
    const createChildButton = {
      compClass: CompOpenerButtonComponent,
      inputs: {
        label: 'Créer un sous-groupe',
        drawerOptions: {
          headerTitle: 'Nouveau sous-groupe pour ' + team.label,
          closeConfirmationMessage: 'Voulez-vous fermer le formulaire de création ?',
          child: {
            compClass: TeamFormComponent, // Composant de formulaire de création
            inputs: {
              teamId: null
            }
          }
        }
      }
    };

    // On place ces deux boutons dans le conteneur dynamique sous la clé "Actions"
    const dynamicComps = [editButton, createChildButton];

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
