import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable, of} from "rxjs";
import {dto} from "../../../habarta/dto";
import {IEntityService} from "../../workInProgress/CRUD/ientity-service";
import {MessageService, TreeNode} from "primeng/api";
import {EntityColumn} from "../../workInProgress/entityAdminModule/entity-tree/entity-tree.component";
import {
  EntityDeleteButtonComponent
} from "../../workInProgress/entity-delete-button-component/entity-delete-button.component";
import {TeamFormComponent} from "../../workInProgress/CRUD/team-form/team-form.component";
import {CompOpenerButtonComponent} from "../../workInProgress/drawer/comp-opener-button.component";
import DriverDTO = dto.DriverDTO;
import DriverForm = dto.DriverForm;
import GenericNodeDTO = dto.GenericNodeDTO;
import TeamDTO = dto.TeamDTO;
import {DriverFormComponent} from "../../workInProgress/CRUD/driver-Form/driver-form.component";

@Injectable({
  providedIn: 'root'
})
export class DriverService implements IEntityService<DriverDTO, DriverForm> {

  private baseUrl = '/api/drivers';  // URL to the backend API

  constructor(private http: HttpClient,
              private messageService: MessageService) {}

  getAffectedDrivers(agencyIds: string[] | null = null): Observable<DriverDTO[]> {
    const params = {
      agencyIds: agencyIds && agencyIds.length > 0 ? agencyIds : []
    };
    return this.http.get<DriverDTO[]>(`${this.baseUrl}/affected`, { params });
  }

  getAuthorizedData(): Observable<dto.DriverDTO[]> {
    return this.http.get<dto.DriverDTO[]>(`${this.baseUrl}`)
  }

  getTreeNode(): Observable<GenericNodeDTO<dto.DriverDTO>[]> {
    return this.http.get<GenericNodeDTO<dto.DriverDTO>[]>(`${this.baseUrl}/authorized-data`)
  }

  //Implémentation des méthodes du composant IEntityService

  getById(id: number): Observable<DriverDTO> {
    return this.http.get<DriverDTO>(`${this.baseUrl}/${id}`);
  }

  create(entity: DriverForm): Observable<DriverDTO> {
    return this.http.post<DriverDTO>(this.baseUrl, entity);
  }

  update(entity: DriverForm): Observable<DriverDTO> {
    if (entity.id == null) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erreur Update',
        detail: 'Impossible de mettre à jour un driver sans ID'
      });
      throw new Error('DriverForm must have an ID for update.');
    }
    return this.http.put<DriverDTO>(`${this.baseUrl}/${entity.id}`, entity);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  getCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/count`)
  }

  getStats(): Observable<dto.StatsDTO> {
    return this.http.get<dto.StatsDTO>(`${this.baseUrl}/stats`)
  }

  getTreeColumns(): Observable<EntityColumn[]> {
    return of([
      {
        field: 'firstName',
        header: 'Prénom',
        ascending: true,
        comparator: (valA: string, valB: string, asc: boolean) =>
          asc ? valA.localeCompare(valB) : valB.localeCompare(valA)
      },
      {
        field: 'lastName',
        header: 'Nom',
        ascending: true,
        comparator: (valA: string, valB: string, asc: boolean) =>
          asc ? valA.localeCompare(valB) : valB.localeCompare(valA)
      },
      {
        field: 'phoneNumber',
        header: 'Téléphone'
        // Pas de comparator pour le tri sur le téléphone
      },
      {
        header: 'Actions',
        isDynamic: true
      }
    ]);
  }

  getTreeNodes(): Observable<TreeNode[]> {
    return this.getTreeNode().pipe(
      map((genericNodes: GenericNodeDTO<DriverDTO>[]) =>
        genericNodes.map(node => this.convertDriverGenericNodeToTreeNode(node))
          .filter(node => node !== null) as TreeNode[]
      )
    );
  }

  private convertDriverGenericNodeToTreeNode(node: GenericNodeDTO<DriverDTO>): TreeNode | null {
    // Vérifier que le nœud possède bien une équipe
    if (!node.team) {
      console.error("Le nœud ne contient pas d'objet 'team' :", node);
      return null;
    }

    const teamDTO: TeamDTO = node.team;
    const parentLabel = teamDTO.parentTeam ? teamDTO.parentTeam.label : '';

    // Création du nœud pour l'équipe (groupe)
    const teamNodeData = {
      label: teamDTO.label,
      parentLabel: parentLabel
    };
    const teamTreeNode: TreeNode = {
      label: teamDTO.label,
      data: teamNodeData,
      children: [],
      expanded: false
    };

    // Traitement des feuilles (drivers)
    const driverLeaves: TreeNode[] = (node.subjects || []).map((driver: DriverDTO, index: number) => {
      // On construit le label du driver
      const driverLabel = `${driver.firstName} ${driver.lastName} (${driver.phoneNumber || '-'})`;

      // Boutons d'action spécifiques pour les drivers
      const dynamicComponents = {
        Actions: [
          {
            compClass: CompOpenerButtonComponent,
            inputs: {
              label: 'Modifier ' + driver.firstName + ' ' + driver.lastName,
              drawerOptions: {
                headerTitle: 'Édition du conducteur',
                closeConfirmationMessage: 'Voulez-vous vraiment fermer ce panneau ?',
                child: {
                  compClass: DriverFormComponent,
                  inputs: { driverId: driver.id }
                }
              }
            }
          },
          {
            compClass: EntityDeleteButtonComponent,
            inputs: {
              label: 'Supprimer ' + driver.firstName + ' ' + driver.lastName,
              entityId: driver.id,
              entityService: this, // Adapter pour driverService
              confirmationMessage: 'Voulez-vous vraiment supprimer ce conducteur ?',
              onError: (err: any) => { console.error("Erreur lors de la suppression pour le driver", driver.id, err); }
            }
          }
        ]
      };

      return {
        data: {
          firstName: driver.firstName,
          lastName: driver.lastName,
          phoneNumber: driver.phoneNumber,
          label: driverLabel,
          dynamicComponents: dynamicComponents
        },
        leaf: true,
        expanded: false
      } as TreeNode;
    });

    // Traitement récursif des enfants (sous-groupes)
    const childrenNodes: TreeNode[] = (node.children || [])
      .map((child: GenericNodeDTO<DriverDTO>) => this.convertDriverGenericNodeToTreeNode(child))
      .filter(child => child !== null) as TreeNode[];

    // Combiner les feuilles et les nœuds enfants dans le nœud parent
    teamTreeNode.children = [...driverLeaves, ...childrenNodes];

    // Si le nœud ne contient ni feuilles ni enfants (donc aucun driver), on retourne null pour l'éliminer
    if (teamTreeNode.children.length === 0) {
      console.warn(`Le groupe "${teamDTO.label}" ne contient aucun driver. Il sera éliminé.`);
      return null;
    }

    return teamTreeNode;
  }
}
