import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';

import { dto} from "../../../habarta/dto";

export interface VehicleWithDistanceDTO {
  first: number; // Distance en mètres
  second: dto.VehicleSummaryDTO;
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
  //
  // //Méthode pour récupérer la liste de plaque d'immatriculationde
  // getVehiclesList(): Observable<string[]> {
  //   return this.http.get<string[]>(`${this.baseUrl}/list`);
  // }
  //
  // // New method to get vehicles by agency IDs
  // getVehiclesByAgencies(agencyIds: string[]): Observable<string[]> {
  //   const params ={
  //     agencyIds: agencyIds.length ? agencyIds : []
  //   }
  //   return this.http.get<string[]>(`${this.baseUrl}/byAgencies`, { params });
  // }

  getVehiclesList(agencyIds: string[] | null = null ): Observable<string[]> {
    const params = {
      agencyIds: agencyIds && agencyIds.length > 0 ? agencyIds : []
    };
    return this.http.get<string[]>(`${this.baseUrl}/list`, { params });

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
    driverNames: string[]=[]
  ): Observable<dto.VehicleSummaryDTO[]> {
    const params={
      teamLabels: teamLabels.length ? teamLabels : [],
      vehicleIds: vehicleIds.length ? vehicleIds : [],
      driverNames: driverNames.length ? driverNames : []
    }
    return this.http.get<dto.VehicleSummaryDTO[]>(`${this.baseUrl}`,  {params});
  }




}
