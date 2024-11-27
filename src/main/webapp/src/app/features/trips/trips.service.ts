import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {map, Observable} from 'rxjs';
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
    return this.http.get<TripMapDTO>(`${this.apiUrl}/vehicle/${vehicleId}/${date}`).pipe(map(this.decodeTripMapDTO));
  }

  private decodeTripMapDTO(tripMapDTO: TripMapDTO): TripMapDTO {
    tripMapDTO.trips = tripMapDTO.trips.map(trip => {
      trip.computeDate = new Date(trip.computeDate);
      trip.startDate = new Date(trip.startDate);
      trip.endDate = new Date(trip.endDate);
      trip.lastTripEnd = trip.lastTripEnd && new Date(trip.lastTripEnd);
      return trip;
    });
    return tripMapDTO;
  }

  formatDuration(duration: number, withoutSeconds = true): string {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    return `${hours > 0 ? `${hours}h ` : ``}${minutes}min${!withoutSeconds ? ` ${seconds}s` : ''}`;
  }
}


export interface TripEvent {
  index: number,
  eventType: 'trip' | 'stop'
  start: string | null,
  end: string | null,
  distance: string | null,
  duration: string | null,
  address: string | null,
  color: string | null
}
