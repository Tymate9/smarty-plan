import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';

import { dto} from "../../../habarta/dto";
import VehicleSummaryDTO = dto.VehicleSummaryDTO;

export interface VehicleWithDistanceDTO {
  first: number; // Distance en mètres
  second: dto.VehicleSummaryDTO;
}
export interface TeamHierarchyNode {
  label: string;
  children?: TeamHierarchyNode[]; // Subteams
  vehicles: dto.VehicleTableDTO[];     // List of vehicles at this team level
}

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
  ): Observable<TeamHierarchyNode[]> {
    const params={
      teamLabels: teamLabels.length ? teamLabels : [],
      vehicleIds: vehicleIds.length ? vehicleIds : [],
      driverNames: driverNames.length ? driverNames : []
    }
    return this.http.get<TeamHierarchyNode[]>(`${this.baseUrl}/tableData`,  {params});
  }

}
