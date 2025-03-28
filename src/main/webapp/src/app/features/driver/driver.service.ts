import {Injectable} from "@angular/core";
import {HttpClient} from "@angular/common/http";
import {map, Observable, of, Subject} from "rxjs";
import {dto} from "../../../habarta/dto";
import {CrudEvent, IEntityService} from "../../commons/crud/interface/ientity-service";
import {MessageService, TreeNode} from "primeng/api";
import {EntityColumn} from "../../commons/admin/entity-tree/entity-tree.component";
import {EntityDeleteButtonComponent} from "../../commons/crud/inputs/entity-delete-button.component";
import {CompOpenerButtonComponent} from "../../commons/drawer/comp-opener-button.component";
import DriverDTO = dto.DriverDTO;
import DriverForm = dto.DriverForm;
import GenericNodeDTO = dto.GenericNodeDTO;
import TeamDTO = dto.TeamDTO;
import {DriverFormComponent} from "./form/driver-form.component";
import {DrawerOptions} from "../../commons/drawer/drawer.component";

@Injectable({
  providedIn: 'root'
})
export class DriverService implements IEntityService<DriverDTO, DriverForm> {

  private baseUrl = '/api/drivers';  // URL to the backend API

  constructor(private http: HttpClient,
              private messageService: MessageService) {}

  private _crudEvents: Subject<CrudEvent<DriverDTO>> = new Subject<CrudEvent<DriverDTO>>();
  public crudEvents$: Observable<CrudEvent<DriverDTO>> = this._crudEvents.asObservable();
  notifyCrudEvent(event: CrudEvent<DriverDTO>): void {
    this._crudEvents.next(event);
  }

  getDrawerOptions(id: any | null): DrawerOptions {
    if (!id) {
      return {
        headerTitle: 'Créer un conducteur',
        closeConfirmationMessage: 'Voulez-vous fermer ce panneau ?',
        child: {
          compClass: DriverFormComponent,
          inputs: {
            vehicleId: '',
          }
        }
      };
    } else {
      return {
        headerTitle: `Édition du conducteur`,
        closeConfirmationMessage: 'Voulez-vous fermer ce panneau ?',
        child: {
          compClass: DriverFormComponent,
          inputs: {
            vehicleId: id
          }
        }
      };
    }
  }

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

  delete(id: number): Observable<DriverDTO> {
    return this.http.delete<DriverDTO>(`${this.baseUrl}/${id}`);
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
    // Vérifier que le nœud possède bien un objet 'team'
    if (!node.team) {
      console.error("Le nœud ne contient pas d'objet 'team' :", node);
      return null;
    }

    const teamDTO: TeamDTO = node.team;
    const parentLabel = teamDTO.parentTeam ? teamDTO.parentTeam.label : '';

    // Création du nœud pour l'équipe (groupe)
    const teamNodeData = {
      label: teamDTO.label,
      parentLabel: parentLabel,
      groupId:teamDTO.id
    };
    const teamTreeNode: TreeNode = {
      label: teamDTO.label,
      data: teamNodeData,
      children: [],
      expanded: false
    };

    // Traitement des feuilles : transformer chaque driver en feuille à l'aide de buildTreeLeaf
    const driverLeaves: TreeNode[] = (node.subjects || []).map((driver: DriverDTO) => {
      return this.buildTreeLeaf(driver);
    });

    // Traitement récursif des enfants (sous-groupes)
    const childrenNodes: TreeNode[] = (node.children || [])
      .map((child: GenericNodeDTO<DriverDTO>) => this.convertDriverGenericNodeToTreeNode(child))
      .filter(child => child !== null) as TreeNode[];

    // Combiner les feuilles et les sous-groupes dans le nœud parent
    teamTreeNode.children = [...driverLeaves, ...childrenNodes];

    // Si aucun driver n'est présent dans ce groupe, on émet un avertissement et on retourne null
    if (teamTreeNode.children.length === 0) {
      console.warn(`Le groupe "${teamDTO.label}" ne contient aucun driver. Il sera éliminé.`);
      return null;
    }

    return teamTreeNode;
  }

  buildTreeLeaf(driver: DriverDTO): TreeNode {
    // Construction du label du driver
    const driverLabel = `${driver.firstName} ${driver.lastName} (${driver.phoneNumber || '-'})`;

    // Configuration dynamique des boutons d'action pour le driver
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
            entityService: this, // Ici, le service est le DriverService
            confirmationMessage: 'Voulez-vous vraiment supprimer ce conducteur ?',
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
                  detail = "Le conducteur demandée n'existe pas.";
                  break;
                case 409:
                  summary = 'Erreur 409 - Conflit';
                  detail = "Conflit de données : le conducteur est liée à d'autres entités et ne peut être supprimée.";
                  break;
                default:
                  summary = 'Erreur 500 - Erreur interne';
                  detail = "Une erreur interne est survenue, veuillez réessayer plus tard.";
                  break;
              }

              this.messageService.add({ severity: 'error', summary: summary, detail: detail });
            }
          }
        }
      ]
    };

    return {
      data: {
        id: driver.id,
        parentId: driver.team ? driver.team.id : null,
        firstName: driver.firstName,
        lastName: driver.lastName,
        phoneNumber: driver.phoneNumber,
        label: driverLabel,
        dynamicComponents: dynamicComponents
      },
      leaf: true,
      expanded: false
    } as TreeNode;
  }
}
