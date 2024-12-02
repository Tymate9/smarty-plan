import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {dto} from "../../../habarta/dto";
import TripDTO = dto.TripDTO;
import TripEventsDTO = dto.TripEventsDTO;

@Injectable({
  providedIn: 'root'
})
export class TripsService {
  private apiUrl = '/api/trips';

  constructor(private http: HttpClient) {}

  getTripsByVehicle(vehicleId: string): Observable<TripDTO[]> {
    return this.http.get<TripDTO[]>(`${this.apiUrl}/vehicle/${vehicleId}`);
  }

  getTripByDateAndVehicle(vehicleId: string, date: string): Observable<TripEventsDTO> {
    return this.http.get<TripEventsDTO>(`${this.apiUrl}/vehicle/${vehicleId}/${date}`).pipe(map(this.decodeTripEventsDTO));
  }

  private decodeTripEventsDTO(tripEventsDto: TripEventsDTO): TripEventsDTO {
    tripEventsDto.tripEvents = tripEventsDto.tripEvents.map(tripEvent => {
      tripEvent.start = tripEvent.start && new Date(tripEvent.start);
      tripEvent.end = tripEvent.end && new Date(tripEvent.end);
      return tripEvent;
    });
    return tripEventsDto;
  }

  formatDuration(duration: number, withoutSeconds = true): string {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    return `${hours > 0 ? `${hours}h ` : ``}${minutes}min${!withoutSeconds ? ` ${seconds}s` : ''}`;
  }
}
