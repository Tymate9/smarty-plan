import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable, of, Subject} from 'rxjs';
import {dto} from "../../../habarta/dto";
import TeamDTO = dto.TeamDTO;
import {CrudEvent, IEntityService} from "../../commons/crud/interface/ientity-service";
import TeamCategoryDTO = dto.TeamCategoryDTO;
import TeamForm = dto.TeamForm;
import {EntityColumn} from "../../commons/admin/entity-tree/entity-tree.component";
import {MessageService, TreeNode} from "primeng/api";
import {TeamFormComponent} from "./form/team-form.component";
import {CompOpenerButtonComponent} from "../../commons/drawer/comp-opener-button.component";
import { EntityDeleteButtonComponent } from "../../commons/crud/inputs/entity-delete-button.component";
import {DrawerOptions} from "../../commons/drawer/drawer.component";

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
        field: 'phoneNumber',
        header: 'Téléphone',
        ascending: true,
        comparator: (valA: string, valB: string, asc: boolean) =>
          asc ? valA.localeCompare(valB) : valB.localeCompare(valA),
      },
      {
        field: 'phoneComment',
        header: 'Commentaire',
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
        onSuccess: (response: any) => {
          console.log(response)
          this.messageService.add({
            severity: 'success',
            summary: "Suppression réussie",
            detail: `Le conducteur ${response.firstName} ${response.lastName} a été supprimé avec succès.`
          });
        },
        onError: (err: any) => {
          const status: number = err?.status ?? 500;
          let summary: string;
          let detail: string;

          switch (status) {
            case 404:
              summary = 'Erreur 404 - Non trouvé';
              detail = "Le groupe demandée n'existe pas.";
              break;
            case 409:
              summary = 'Erreur 409 - Conflit';
              detail = "Conflit de données : le groupe est liée à d'autres entités et ne peut être supprimée.";
              break;
            default:
              summary = 'Erreur 500 - Erreur interne';
              detail = "Une erreur interne est survenue, veuillez réessayer plus tard.";
              break;
          }

          this.messageService.add({ severity: 'error', summary: summary, detail: detail });
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
        phoneNumber: team.phoneNumber || '',
        phoneComment: team.phoneComment || '',
        dynamicComponents: {
          Actions: dynamicComps
        }
      },
      children: [],
      expanded: false
    };
  }

  getCsvHeaders(): string[] {
    return [
      'ID',
      'Nom de l\'équipe',
      'Équipe parente',
      'Catégorie',
      'Téléphone',
      'Commentaire'
    ];
  }

  convertToCsv(item: TeamDTO): string[] {
    const values = [
      item.id,
      item.label,
      item.parentTeam ? item.parentTeam.label : '',
      item.category ? item.category.label : '',
      item.phoneNumber || '',
      item.phoneComment || ''
    ];
    return values.map(value => `"${value !== null && value !== undefined ? value : ''}"`);
  }
}
