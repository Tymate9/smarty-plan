import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';

import {dto} from "../../../habarta/dto";
import VehicleSummaryDTO = dto.VehicleSummaryDTO;
import VehicleStatsDTO = dto.VehicleStatsDTO;
import {TreeNode} from "primeng/api";

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
//export type TeamHierarchyNodeBase = TeamHierarchyNode<dto.VehicleTableDTO>;
export type TeamHierarchyNodeStats = TeamHierarchyNode<dto.VehiclesStatsDTO>;
export type TeamHierarchyNodeStatsQSE = TeamHierarchyNode<dto.VehiclesStatsQseDTO>;

// export interface TeamHierarchyNode {
//   label: string;
//   children?: TeamHierarchyNode[];
//   vehicles: (dto.VehicleTableDTO)[];
// }
// export interface TeamHierarchyNodeStats {
//   label: string;
//   children?: TeamHierarchyNodeStats[];
//   vehicles: (dto.VehiclesStatsDTO)[];
// }
//
// export interface TeamHierarchyNodeStatsQSE {
//   label: string;
//   children?: TeamHierarchyNodeStatsQSE[];
//   vehicles: (dto.VehiclesStatsQseDTO)[];
// }

@Injectable({
  providedIn: 'root',
})
export class VehicleService {
  private readonly baseUrl = '/api/vehicles';

  constructor(private readonly http: HttpClient) {}

  // Méthode pour récupérer tous les véhicules
  getAllVehicles(): Observable<dto.VehicleSummaryDTO[]> {
    return this.http.get<dto.VehicleSummaryDTO[]>(`${this.baseUrl}`);
  }

  //Méthode pour récupérer la liste de vehiclesDTO
  getVehiclesList(agencyIds: string[] | null = null ): Observable<VehicleSummaryDTO[]> {
    const params = {
      agencyIds: agencyIds && agencyIds.length > 0 ? agencyIds : []
    };
    return this.http.get<VehicleSummaryDTO[]>(`${this.baseUrl}/list`, { params });

  }

  // Méthode pour récupérer les véhicules les plus proches avec leur distance
  getNearestVehiclesWithDistance(latitude: number, longitude: number, limit: number = 10): Observable<VehicleWithDistanceDTO[]> {
    const params = { latitude: latitude.toString(), longitude: longitude.toString(), limit: limit.toString() }
    return this.http.get<VehicleWithDistanceDTO[]>(`${this.baseUrl}/withDistance`, { params });
  }

  // Méthode pour récupérer les véhicules les plus proches sans distance (déjà existante)
  getNearestVehiclesDetails( latitude: number, longitude: number, limit: number = 10 ): Observable<dto.VehicleSummaryDTO[]> {
    const params = {
      latitude: latitude.toString(),
      longitude: longitude.toString(),
      limit: limit.toString(),
    };
    return this.http.get<dto.VehicleSummaryDTO[]>(`${this.baseUrl}/nearest`, { params });
  }

  // Méthode pour récupérer les véhicules dans un polygone (déjà existante)
  getVehicleInPolygon(polygonWKT: string): Observable<dto.VehicleSummaryDTO[]> {
    const params = { polygonWKT };
    return this.http.get<dto.VehicleSummaryDTO[]>(`${this.baseUrl}/inPolygon`, { params });
  }

  getFilteredVehicles(
    teamLabels: string[]=[],
    vehicleIds: string[]=[],
    driverNames: string[]=[],
    format : string = "RESUME"
  ): Observable<any> {
    const params={
      format : format,
      teamLabels: teamLabels.length ? teamLabels : [],
      vehicleIds: vehicleIds.length ? vehicleIds : [],
      driverNames: driverNames.length ? driverNames : []
    }
    return this.http.get<dto.VehicleSummaryDTO[]>(`${this.baseUrl}`,  {params});
  }
  getFilteredVehiclesDashboard(
    teamLabels: string[]=[],
    vehicleIds: string[]=[],
    driverNames: string[]=[]
  ): Observable<TeamHierarchyNode<dto.VehicleTableDTO>[]> {
    const params={
      teamLabels: teamLabels.length ? teamLabels : [],
      vehicleIds: vehicleIds.length ? vehicleIds : [],
      driverNames: driverNames.length ? driverNames : []
    }
    return this.http.get<TeamHierarchyNode<dto.VehicleTableDTO>[]>(`${this.baseUrl}/tableData`,  {params});
  }

  getVehiclesStats(
    startDate: string,
    endDate: string,
    teamLabels: string[]=[],
    vehicleIds: string[]=[],
    driversIds: string[]=[]
  ): Observable<{ teamHierarchyNodes: TeamHierarchyNodeStats[]; stats: Record<string, any> }> {
    const params = {
      startDate: startDate,
      endDate: endDate,
      teamLabels: teamLabels.length ? teamLabels : [],
      vehicleIds: vehicleIds.length ? vehicleIds : [],
      driversIds: driversIds.length ? driversIds :[]
    };
    return this.http.get<{ teamHierarchyNodes: TeamHierarchyNodeStats[]; stats: Record<string, any> }>(`${this.baseUrl}/vehicleStats`, { params });
  }

  getVehicleDailyStats(
    startDate: string,
    endDate: string,
   vehicleId: string,
  ): Observable<VehicleStatsDTO[]> {
    const params = {
      startDate: startDate,
      endDate: endDate,
      vehicleId:vehicleId
    };
    return this.http.get<VehicleStatsDTO[]>(`${this.baseUrl}/vehicleStats/daily`, { params });
  }

  getVehiclesStatsQse(
    startDate: string,
    endDate: string,
    teamLabels: string[]=[],
    vehicleIds: string[]=[],
    driversIds: string[]=[]
  ) :Observable<TeamHierarchyNode<dto.VehiclesStatsQseDTO>[]>  {
    const params = {
      startDate: startDate,
      endDate: endDate,
      teamLabels: teamLabels.length ? teamLabels : [],
      vehicleIds: vehicleIds.length ? vehicleIds : [],
      driversIds: driversIds.length ? driversIds :[]
    };
    return this.http.get<TeamHierarchyNode<dto.VehiclesStatsQseDTO>[]>(`${this.baseUrl}/vehicleStats/report-qse`, { params });
  }

//TODO make it more general (>3 levels)
  ///////////////////////////for testing
  //Cette méthode permet de transformer les résultats obtenus par la requête en TreeNode
  static transformToTreeNodes<T extends { label: string; children?: T[]; vehicles?: V[] }, V>(
    teamNodes: T[],
    getVehicleData: (vehicle: V) => { driverName: string; licensePlate: string | null }
  ): TreeNode[] {
    // Helper function to sort by label alphabetically
    const sortByLabel = (a: { data: { label: string } }, b: { data: { label: string } }) =>
      a.data.label.localeCompare(b.data.label);

    // Helper function to sort vehicles by driverName
    const sortByDriverName = (
      a: { data: { vehicle: V | null } },
      b: { data: { vehicle: V | null } }
    ) => {
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
          .sort(sortByLabel),
      ],
    })).sort(sortByLabel);
  }

}
