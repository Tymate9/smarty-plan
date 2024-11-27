import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {dto} from "../../../habarta/dto";
import TripDTO = dto.TripDTO;
import TripMapDTO = dto.TripMapDTO;

@Injectable({
  providedIn: 'root'
})
export class TripsService {
  private apiUrl = '/api/trips';

  constructor(private http: HttpClient) {}

  getTripsByVehicle(vehicleId: string): Observable<TripDTO[]> {
    return this.http.get<TripDTO[]>(`${this.apiUrl}/vehicle/${vehicleId}`);
  }

  getTripByDateAndVehicle(vehicleId: string, date: string): Observable<TripMapDTO> {
    return this.http.get<TripMapDTO>(`${this.apiUrl}/vehicle/${vehicleId}/${date}`);
  }
}

export interface TripEvent {
  eventType: 'trip' | 'stop'
  start: string | null,
  end: string | null,
  distance: string | null,
  duration: string | null,
  address: string | null,
  color: string | null
}
