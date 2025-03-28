import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable, of, Subject} from 'rxjs';

import {dto} from "../../../habarta/dto";
import {MessageService, TreeNode} from "primeng/api";
import {CrudEvent, IEntityService} from "../../workInProgress/CRUD/ientity-service";
import { EntityDeleteButtonComponent } from "../../workInProgress/entity-delete-button-component/entity-delete-button.component";
import {CompOpenerButtonComponent} from "../../workInProgress/drawer/comp-opener-button.component";
import GenericNodeDTO = dto.GenericNodeDTO;
import {EntityColumn} from "../../workInProgress/entityAdminModule/entity-tree/entity-tree.component";
import VehicleStatsDTO = dto.VehicleStatsDTO;
import VehicleSummaryDTO = dto.VehicleSummaryDTO;
import {VehicleFormComponent} from "../../workInProgress/CRUD/vehicle-form/vehicle-form.component";
import {DrawerOptions} from "../../workInProgress/drawer/drawer.component";

export interface VehicleWithDistanceDTO {
  first: number; // Distance en mètres
  second: dto.VehicleSummaryDTO;
}

export interface TeamHierarchyNode<T> {
  label: string;
  children?: TeamHierarchyNode<T>[];
  vehicles: T[];
}

// Specific type aliases for each case
export type TeamHierarchyNodeBase = TeamHierarchyNode<dto.VehicleTableDTO>;
export type TeamHierarchyNodeStats = TeamHierarchyNode<dto.VehiclesStatsDTO>;
export type TeamHierarchyNodeStatsQSE = TeamHierarchyNode<dto.VehiclesStatsQseDTO>;


@Injectable({
  providedIn: 'root',
})
export class VehicleService implements IEntityService<dto.VehicleDTO, dto.VehicleForm>{

  getDrawerOptions(id: any | null): DrawerOptions {
    if (!id) {
      return {
        headerTitle: 'Créer un véhicule',
        closeConfirmationMessage: 'Voulez-vous fermer ce panneau ?',
        child: {
          compClass: VehicleFormComponent,
          inputs: {
            vehicleId: '',
          }
        }
      };
    } else {
      // Mode édition
      return {
        headerTitle: `Édition du véhicule`,
        closeConfirmationMessage: 'Voulez-vous fermer ce panneau ?',
        child: {
          compClass: VehicleFormComponent,
          inputs: {
            vehicleId: id
          }
        }
      };
    }
  }

  private _crudEvents: Subject<CrudEvent<dto.VehicleDTO>> = new Subject<CrudEvent<dto.VehicleDTO>>();
  public crudEvents$: Observable<CrudEvent<dto.VehicleDTO>> = this._crudEvents.asObservable();
  notifyCrudEvent(event: CrudEvent<dto.VehicleDTO>): void {
    this._crudEvents.next(event);
  }

  private readonly baseUrl = '/api/vehicles';

  constructor(private readonly http: HttpClient,private messageService: MessageService) {}

  // Méthode pour récupérer tous les véhicules
  getAllVehicles(): Observable<dto.VehicleSummaryDTO[]> {
    return this.http.get<dto.VehicleSummaryDTO[]>(`${this.baseUrl}`);
  }

  //Méthode pour récupérer la liste de vehiclesDTO
  getVehiclesList(agencyIds: string[] | null = null): Observable<VehicleSummaryDTO[]> {
    const params = {
      agencyIds: agencyIds && agencyIds.length > 0 ? agencyIds : []
    };
      const nonGeolocalized = location.pathname.indexOf('-non-geoloc')>0
      return this.http.get<VehicleSummaryDTO[]>(`${this.baseUrl}/list`+(nonGeolocalized?'-non-geoloc':''),
        { params });
  }

  // Méthode pour récupérer les véhicules les plus proches avec leur distance
  getNearestVehiclesWithDistance(latitude: number, longitude: number, limit: number = 10): Observable<VehicleWithDistanceDTO[]> {
    const params = {latitude: latitude.toString(), longitude: longitude.toString(), limit: limit.toString()}
    return this.http.get<VehicleWithDistanceDTO[]>(`${this.baseUrl}/withDistance`, {params});
  }

  // Méthode pour récupérer les véhicules les plus proches sans distance (déjà existante)
  getNearestVehiclesDetails(latitude: number, longitude: number, limit: number = 10): Observable<dto.VehicleSummaryDTO[]> {
    const params = {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      limit: limit.toString(),
    };
    return this.http.get<dto.VehicleSummaryDTO[]>(`${this.baseUrl}/nearest`, {params});
  }

  // Méthode pour récupérer les véhicules dans un polygone (déjà existante)
  getVehicleInPolygon(polygonWKT: string): Observable<dto.VehicleSummaryDTO[]> {
    const params = {polygonWKT};
    return this.http.get<dto.VehicleSummaryDTO[]>(`${this.baseUrl}/inPolygon`, {params});
  }

  getFilteredVehicles( teamLabels: string[] = [],  vehicleIds: string[] = [], driverNames: string[] = [], format: string = "RESUME"): Observable<any> {
    const params = {
      format: format,
      teamLabels: teamLabels.length ? teamLabels : [],
      vehicleIds: vehicleIds.length ? vehicleIds : [],
      driverNames: driverNames.length ? driverNames : []
    }
    return this.http.get<dto.VehicleSummaryDTO[]>(`${this.baseUrl}`, {params});
  }

  // Méthode pour récupérer les véhicules dans la page Dashboard
  getFilteredVehiclesDashboard( teamLabels: string[] = [], vehicleIds: string[] = [], driverNames: string[] = []): Observable<TeamHierarchyNodeBase[]> {
    const params = {
      teamLabels: teamLabels.length ? teamLabels : [],
      vehicleIds: vehicleIds.length ? vehicleIds : [],
      driverNames: driverNames.length ? driverNames : []
    }
    return this.http.get<TeamHierarchyNodeBase[]>(`${this.baseUrl}/tableData`, {params});
  }

  // Méthode pour récupérer les véhicules et les indicateurs dans la page 'suivi d'activité'
  getVehiclesStats(
    startDate: string,
    endDate: string,
    teamLabels: string[]=[],
    vehicleIds: string[]=[],
    driversIds: string[]=[],
    vehiclesType:string
  ): Observable<{ teamHierarchyNodes: TeamHierarchyNodeStats[]; stats: Record<string, any> }> {
    const params = {
      startDate: startDate,
      endDate: endDate,
      teamLabels: teamLabels.length ? teamLabels : [],
      vehicleIds: vehicleIds.length ? vehicleIds : [],
      driversIds: driversIds.length ? driversIds :[],
      vehiclesType:vehiclesType
    };
    return this.http.get<{
      teamHierarchyNodes: TeamHierarchyNodeStats[];
      stats: Record<string, any>
    }>(`${this.baseUrl}/vehicleStats`, {params});
  }

  // Méthode pour récupérer les statistics détailées d'un véhicle
  getVehicleDailyStats(
    startDate: string,
    endDate: string,
    vehicleId: string,
    vehiclesType:string
  ): Observable<VehicleStatsDTO[]> {
    const params = {
      startDate: startDate,
      endDate: endDate,
      vehicleId:vehicleId,
      vehiclesType:vehiclesType
    };
    return this.http.get<VehicleStatsDTO[]>(`${this.baseUrl}/vehicleStats/daily`, {params});
  }

  // Méthode pour récupérer les véhicules et les indicateurs dans la page 'Rapport QSE'
  getVehiclesStatsQse(
    startDate: string,
    endDate: string,
    teamLabels: string[]=[],
    vehicleIds: string[]=[],
    driversIds: string[]=[],
    vehiclesType:string
  ) :Observable<{ teamHierarchyNodes: TeamHierarchyNodeStatsQSE[]; stats: Record<string, any> }>  {
    const params = {
      startDate: startDate,
      endDate: endDate,
      teamLabels: teamLabels.length ? teamLabels : [],
      vehicleIds: vehicleIds.length ? vehicleIds : [],
      driversIds: driversIds.length ? driversIds :[],
      vehiclesType: vehiclesType
    };
    return this.http.get<{
      teamHierarchyNodes: TeamHierarchyNodeStatsQSE[];
      stats: Record<string, any>
    }>(`${this.baseUrl}/vehicleStats/report-qse`, {params});
  }

//TODO make it more general (>3 levels)
  //Cette méthode permet de transformer les résultats obtenus par la requête en TreeNode
  static transformToTreeNodes<T extends { label: string; children?: T[]; vehicles?: V[] }, V>( teamNodes: T[], getVehicleData: (vehicle: V) => { driverName: string; licensePlate: string | null } ): TreeNode[] {
    // Helper function to sort by label alphabetically
    const sortByTeamLabel = (
      a: { expanded: boolean, data: { label: string, vehicle: null }, children: { expanded: boolean, data: { label: string, vehicle: V }, children: any[] }[] },
      b: { expanded: boolean, data: { label: string, vehicle: null }, children: { expanded: boolean, data: { label: string, vehicle: V }, children: any[] }[] }
    )=>
      a.data.label.localeCompare(b.data.label);

    const sortByAgencyLabel = (
      a: {  expanded: boolean; data: { label: string; vehicle: V| null  };children:{expanded: boolean; data: { label: string; vehicle: null }; children: { expanded: boolean; data: { label: string; vehicle: V }; children: any[] }[] } []},
      b: {  expanded: boolean; data: { label: string; vehicle: V| null  };children:{expanded: boolean; data: { label: string; vehicle: null }; children: { expanded: boolean; data: { label: string; vehicle: V }; children: any[] }[] }[]},
    ) => a.data.label.localeCompare(b.data.label);

    const sortByDriverName = (
      a: { expanded: boolean, data: { label: string, vehicle: V | null }, children: any[] },
      b: { expanded: boolean, data: { label: string, vehicle: V | null }, children: any[] }
    ) =>
    {
      const driverA = a.data.vehicle ? getVehicleData(a.data.vehicle).driverName : '';
      const driverB = b.data.vehicle ? getVehicleData(b.data.vehicle).driverName : '';

      return driverA.localeCompare(driverB);
    };

    return teamNodes.map((team) => ({
      data: {
        label: team.label,
        vehicle: null,
      },
      expanded: true,
      children: [
        ...(team.children || []).map((child) => ({
          data: {
            label: child.label,
            vehicle: null,
          },
          expanded: true,
          children: [
            ...(child.vehicles || [])
              .filter((vehicle) => vehicle !== undefined && getVehicleData(vehicle).licensePlate !== null)
              .map((vehicle) => ({
                data: {
                  label: getVehicleData(vehicle).licensePlate || 'Unknown License Plate',
                  vehicle: vehicle,
                },
                expanded: true,
                children: [],
              }))
              .sort(sortByDriverName),
          ],
        }))
          .sort(sortByTeamLabel),
      ],
    })).sort(sortByAgencyLabel);
  }

  /**
   * Visualization of non geolocalized vehicules,
   * functionaliy reserved to administrator users.
   * @param teamLabels : optional labels of teams to be filtered
   * @param vehicleIds : optional labels of vehicles to be filtered
   * @param driverNames : optional labels of drivers to be filtered
   */
  getFilteredNonGeolocVehiclesDashboard(
    teamLabels: string[]=[],
    vehicleIds: string[]=[],
    driverNames: string[]=[]
  ): Observable<TeamHierarchyNodeBase[]> {
    const params={
      teamLabels: teamLabels.length ? teamLabels : [],
      vehicleIds: vehicleIds.length ? vehicleIds : [],
      driverNames: driverNames.length ? driverNames : []
    }
    return this.http.get<TeamHierarchyNodeBase[]>(`${this.baseUrl}/tableData-non-geoloc`,  {params});
  }


  //Implémentation de l'interface IEntityService.

  getAuthorizedData(): Observable<dto.VehicleDTO[]> {
    return this.http.get<dto.VehicleDTO[]>(`${this.baseUrl}/list`);
  }

  getCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/count`);
  }

  getStats(): Observable<dto.StatsDTO> {
    return this.http.get<dto.StatsDTO>(`${this.baseUrl}/stats`);
  }

  getTreeColumns(): Observable<EntityColumn[]> {
    return of([
      {
        field: 'licensePlate',
        header: 'Plaque d\'immatriculation',
        ascending: true,
        comparator: (valA: string, valB: string, asc: boolean) =>
          asc ? valA.localeCompare(valB) : valB.localeCompare(valA)
      },
      {
        field: 'externalID',
        header: 'Identifiant externe',
        ascending: true,
        comparator: (valA: string, valB: string, asc: boolean) =>
          asc ? valA.localeCompare(valB) : valB.localeCompare(valA)
      },
      {
        field: 'engine',
        header: 'Moteur',
        ascending: true,
        comparator: (valA: string, valB: string, asc: boolean) =>
          asc ? valA.localeCompare(valB) : valB.localeCompare(valA)
      },
      {
        field: 'energy',
        header: 'Carburant',
        ascending: true,
        comparator: (valA: string, valB: string, asc: boolean) =>
          asc ? valA.localeCompare(valB) : valB.localeCompare(valA)
      },
      {
        field: 'category',
        header: 'Catégory de véhicule',
        ascending: true,
        comparator: (valA: string, valB: string, asc: boolean) =>
          asc ? valA.localeCompare(valB) : valB.localeCompare(valA)
      },
      {
        field: 'validated',
        header: 'Actif',
        ascending: true,
        comparator: (valA: string, valB: string, asc: boolean) =>
          asc ? valA.localeCompare(valB) : valB.localeCompare(valA)
      },
      {
        header: 'Actions',
        isDynamic: true
      }
    ]);
  }

  getTreeNode(): Observable<GenericNodeDTO<dto.VehicleDTO>[]> {
    return this.http.get<GenericNodeDTO<dto.VehicleDTO>[]>(`${this.baseUrl}/authorized-data`)
  }

  getTreeNodes(): Observable<TreeNode[]> {
    return this.getTreeNode().pipe(
      map((genericNodes: GenericNodeDTO<dto.VehicleDTO>[]) =>
        genericNodes
          .map(node => this.convertVehicleGenericNodeToTreeNode(node))
          .filter(node => node !== null) as TreeNode[]
      )
    );
  }

  private convertVehicleGenericNodeToTreeNode(node: GenericNodeDTO<dto.VehicleDTO>): TreeNode | null {
    // Vérifier que le nœud possède un objet 'team'
    if (!node.team) {
      console.error("Le nœud ne contient pas d'objet 'team' :", node);
      return null;
    }

    const teamDTO = node.team;
    const parentLabel = teamDTO.parentTeam ? teamDTO.parentTeam.label : '';

    // Création du nœud pour le groupe (l'équipe ou l'agence)
    const teamNodeData = {
      label: teamDTO.label,
      parentLabel: parentLabel,
      groupId: teamDTO.id
    };

    const teamTreeNode: TreeNode = {
      label: teamDTO.label,
      data: teamNodeData,
      children: [],
      expanded: false
    };

    // Traitement des véhicules (feuilles) contenus dans node.subjects
    const vehicleLeaves: TreeNode[] = (node.subjects || []).map((vehicle: dto.VehicleDTO) => {
      return this.buildTreeLeaf(vehicle);
    });

    // Traitement récursif des sous-groupes (children)
    const childrenNodes: TreeNode[] = (node.children || [])
      .map((child: GenericNodeDTO<dto.VehicleDTO>) => this.convertVehicleGenericNodeToTreeNode(child))
      .filter(child => child !== null) as TreeNode[];

    // Combinaison des feuilles et des sous-groupes dans le nœud parent
    teamTreeNode.children = [...vehicleLeaves, ...childrenNodes];

    // Si le nœud ne contient aucune feuille ou enfant, on le retourne null pour l'éliminer de l'arbre
    if (teamTreeNode.children.length === 0) {
      console.warn(`Le groupe "${teamDTO.label}" ne contient aucun véhicule. Il sera éliminé.`);
      return null;
    }

    return teamTreeNode;
  }

  buildTreeLeaf(vehicle: dto.VehicleDTO): TreeNode {
    // Construction du label pour le véhicule
    const vehicleLabel = vehicle.licenseplate;

    // Récupération de l'équipe actuelle (la première équipe dans vehicle.teams)
    let currentTeamId: string | null = null;
    if (vehicle.teams) {
      const teamsEntries = Object.entries(vehicle.teams);
      const today = new Date();
      for (const [rangeKey, team] of teamsEntries) {
        const match = rangeKey.match(/start=([^,]+),\s*end=([^)]+)/);
        if (match) {
          const startDate = new Date(match[1].trim());
          const endDate = (match[2].trim() === 'null')
            ? new Date(9999, 0, 1)
            : new Date(match[2].trim());
          if (today >= startDate && today <= endDate) {
            currentTeamId = team.id ? team.id.toString() : null;
            break;
          }
        } else {
          console.warn("Impossible de parser la plage de temps à partir de :", rangeKey);
        }
      }
    }

    // Configuration dynamique des actions pour le véhicule
    const dynamicComponents = {
      Actions: [
        {
          compClass: CompOpenerButtonComponent,
          inputs: {
            label: 'Modifier ' + vehicle.licenseplate,
            drawerOptions: {
              headerTitle: 'Édition du véhicule',
              closeConfirmationMessage: 'Voulez-vous vraiment fermer ce panneau ?',
              child: {
                compClass: VehicleFormComponent,
                inputs: { vehicleId: vehicle.id }
              }
            }
          }
        },
        {
          compClass: EntityDeleteButtonComponent,
          inputs: {
            label: 'Supprimer ' + vehicle.licenseplate,
            entityId: vehicle.id,
            entityService: this, // référence à VehicleService
            confirmationMessage: 'Voulez-vous vraiment supprimer ce véhicule ?',
            onSuccess: (response: any) => {
              console.log(response)
              this.messageService.add({
                severity: 'success',
                summary: "Suppression réussie",
                detail: `Le véhicule ${response.externalId} a été supprimé avec succès.`
              });
            },
            onError: (err: any) => {
              const status: number = err?.status ?? 500;
              let summary: string;
              let detail: string;
              console.log(err)

              switch (status) {
                case 404:
                  summary = 'Erreur 404 - Non trouvé';
                  detail = "La véhicule demandés n'existe pas.";
                  break;
                case 409:
                  summary = 'Erreur 409 - Conflit';
                  detail = "Conflit de données : la véhicule est liée à d'autres entités et ne peut être supprimée.";
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
        id: vehicle.id,
        licensePlate: vehicle.licenseplate,
        externalID: vehicle.externalId,
        engine: vehicle.engine,
        energy: vehicle.energy,
        category: vehicle.category ? vehicle.category.label : '',
        validated: vehicle.validated ? "Actif" : "Inactif",
        parentId: currentTeamId,
        dynamicComponents: dynamicComponents
      },
      leaf: true,
      expanded: false
    } as TreeNode;
  }

  create(entity: dto.VehicleForm): Observable<dto.VehicleDTO> {
    return this.http.post<dto.VehicleDTO>(this.baseUrl, entity);
  }

  delete(id: string): Observable<dto.VehicleDTO> {
    return this.http.delete<dto.VehicleDTO>(`${this.baseUrl}/${id}`);
  }

  getById(id: string): Observable<dto.VehicleDTO> {
    return this.http.get<dto.VehicleDTO>(`${this.baseUrl}/${id}`);
  }

  update(entity: dto.VehicleForm): Observable<dto.VehicleDTO> {
    const vehicleId = entity.id;
    if (!vehicleId || vehicleId.trim() === '') {
      throw new Error("VehicleService.update() : l'id du véhicule est manquant ou vide.");
    }
    return this.http.put<dto.VehicleDTO>(`${this.baseUrl}/${vehicleId}`, entity);  }

  getVehicleCategories(): Observable<dto.VehicleCategoryDTO[]> {
    return this.http.get<dto.VehicleCategoryDTO[]>(`${this.baseUrl}/category`);
  }

}
