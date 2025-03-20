import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {map, Observable, of} from 'rxjs';

import {dto} from "../../../habarta/dto";
import {TreeNode} from "primeng/api";
import {IEntityService} from "../../workInProgress/CRUD/ientity-service";
import {
  EntityDeleteButtonComponent
} from "../../workInProgress/entity-delete-button-component/entity-delete-button.component";
import {CompOpenerButtonComponent} from "../../workInProgress/drawer/comp-opener-button.component";
import {TeamFormComponent} from "../../workInProgress/CRUD/team-form/team-form.component";
import GenericNodeDTO = dto.GenericNodeDTO;
import {EntityColumn} from "../../workInProgress/entityAdminModule/entity-tree/entity-tree.component";
import VehicleStatsDTO = dto.VehicleStatsDTO;
import VehicleSummaryDTO = dto.VehicleSummaryDTO;

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
  private readonly baseUrl = '/api/vehicles';

  constructor(private readonly http: HttpClient) {}

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

  /**
   * Récupère la liste des véhicules autorisés.
   * Endpoint utilisé : GET /api/vehicles/list
   */
  getAuthorizedData(): Observable<dto.VehicleDTO[]> {
    return this.http.get<dto.VehicleDTO[]>(`${this.baseUrl}/list`);
  }

  /**
   * Récupère le nombre total de véhicules.
   * Endpoint utilisé : GET /api/vehicles/count
   */
  getCount(): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/count`);
  }

  /**
   * Récupère les statistiques des véhicules.
   * Endpoint utilisé : GET /api/vehicles/stats
   */
  getStats(): Observable<dto.StatsDTO> {
    return this.http.get<dto.StatsDTO>(`${this.baseUrl}/stats`);
  }

  /**
   * Retourne la configuration des colonnes pour l'affichage des véhicules dans un TreeTable.
   * Les colonnes configurées sont dans l'ordre :
   *  - Plaque d'immatriculation
   *  - Identifiant externe
   *  - Moteur
   *  - Carburant
   *  - Catégory de véhicule (via vehicle.category.label)
   *  - Actif (champ booléen)
   *  - Colonne dynamique pour les actions
   */
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

  /**
   * Retourne l'arborescence des véhicules sous forme de TreeNode[]
   * en convertissant les GenericNodeDTO<VehicleDTO> reçus du back.
   */
  getTreeNodes(): Observable<TreeNode[]> {
    return this.getTreeNode().pipe(
      map((genericNodes: GenericNodeDTO<dto.VehicleDTO>[]) =>
        genericNodes
          .map(node => this.convertVehicleGenericNodeToTreeNode(node))
          .filter(node => node !== null) as TreeNode[]
      )
    );
  }

  /**
   * Convertit récursivement un GenericNodeDTO<VehicleDTO> en un TreeNode.
   * La conversion inclut la création d'un nœud parent pour le groupe (via team)
   * et la transformation des véhicules (subjects) en feuilles, avec l'ajout d'actions.
   */
  private convertVehicleGenericNodeToTreeNode(node: GenericNodeDTO<dto.VehicleDTO>): TreeNode | null {
    // Vérifier que le nœud contient bien un objet 'team'
    if (!node.team) {
      console.error("Le nœud ne contient pas d'objet 'team' :", node);
      return null;
    }

    const teamDTO = node.team;
    const parentLabel = teamDTO.parentTeam ? teamDTO.parentTeam.label : '';

    // Création du nœud pour le groupe (équipe ou agence)
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

    // Transformation des véhicules (feuilles)
    const vehicleLeaves: TreeNode[] = (node.subjects || []).map((vehicle: dto.VehicleDTO) => {
      // Configuration des actions pour chaque véhicule
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
                  compClass: TeamFormComponent,
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
              entityService: this, // Adaptation pour vehicleService
              confirmationMessage: 'Voulez-vous vraiment supprimer ce véhicule ?',
              onError: (err: any) => {
                console.error("Erreur lors de la suppression pour le véhicule", vehicle.id, err);
              }
            }
          }
        ]
      };
      return {
        data: {
          licensePlate: vehicle.licenseplate,
          externalID: vehicle.externalId,
          engine: vehicle.engine,
          energy: vehicle.energy,
          category: vehicle.category.label,
          validated: vehicle.validated? "Actif":"Inactif",
          dynamicComponents: dynamicComponents
        },
        leaf: true,
        expanded: false
      } as TreeNode;
    });

    // Traitement récursif des sous-groupes (enfants)
    const childrenNodes: TreeNode[] = (node.children || [])
      .map((child: GenericNodeDTO<dto.VehicleDTO>) => this.convertVehicleGenericNodeToTreeNode(child))
      .filter(child => child !== null) as TreeNode[];

    // Combiner les feuilles et les nœuds enfants dans le nœud parent
    teamTreeNode.children = [...vehicleLeaves, ...childrenNodes];

    // Si le nœud ne contient ni feuilles ni enfants, on le filtre (retourne null)
    if (teamTreeNode.children.length === 0) {
      console.warn(`Le groupe "${teamDTO.label}" ne contient aucun véhicule. Il sera éliminé.`);
      return null;
    }

    return teamTreeNode;
  }

  create(entity: dto.VehicleForm): Observable<dto.VehicleDTO> {
    return this.http.post<dto.VehicleDTO>(this.baseUrl, entity);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
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
