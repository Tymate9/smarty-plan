import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {dto} from "../../../habarta/dto";
import TripDTO = dto.TripDTO;
import TripEventsDTO = dto.TripEventsDTO;
import TripEventDTO = dto.TripEventDTO;
import TripEventType = dto.TripEventType;

@Injectable({
  providedIn: 'root'
})
export class TripsService {
  private apiUrl = '/api/trips';

  constructor(private http: HttpClient) {
  }

  getTripsByVehicle(vehicleId: string): Observable<TripDTO[]> {
    return this.http.get<TripDTO[]>(`${this.apiUrl}/vehicle/${vehicleId}`);
  }

  getTripByDateAndVehicle(vehicleId: string, date: string): Observable<TripEventsDTO | null> {
    return this.http.get<TripEventsDTO | null>(`${this.apiUrl}/vehicle/${vehicleId}/${date}`).pipe(map(this.decodeTripEventsDTO));
  }

  private decodeTripEventsDTO(tripEventsDto: TripEventsDTO | null): TripEventsDTO | null {
    if (!tripEventsDto) {
      return null;
    }

    // Fonction auxiliaire pour traiter chaque TripEventDTO
    const processTripEvent = (tripEvent: TripEventDTO, tripEvents: TripEventDTO[]): TripEventDTO => {
      // Conversion des chaînes de caractères en objets Date, si elles existent
      tripEvent.start = tripEvent.start ? new Date(tripEvent.start) : null;
      tripEvent.end = tripEvent.end ? new Date(tripEvent.end) : null;

      // Définition de la couleur pour les événements de type TRIP ou TRIP_EXPECTATION
      if (
        tripEvent.eventType === TripEventType.TRIP ||
        tripEvent.eventType === TripEventType.TRIP_EXPECTATION
      ) {
        const hue = (240 / tripEvents.length) * tripEvent.index;
        const adjustedHue = hue < 60 ? hue : hue + 120;
        tripEvent.color = `hsl(${adjustedHue} 75% 40%)`;
      }

      return tripEvent;
    };

    // Appliquer la transformation aux tripEvents
    tripEventsDto.tripEvents = tripEventsDto.tripEvents.map(tripEvent =>
      processTripEvent(tripEvent, tripEventsDto.tripEvents)
    );

    // Appliquer la transformation aux compactedTripEvents
    tripEventsDto.compactedTripEvents = tripEventsDto.compactedTripEvents.map(tripEvent =>
      processTripEvent(tripEvent, tripEventsDto.compactedTripEvents)
    );

    return tripEventsDto;
  }

  formatDuration(duration: number, withoutSeconds = true): string {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    return `${hours > 0 ? `${hours}h ` : ``}${minutes}min${!withoutSeconds ? ` ${seconds}s` : ''}`;
  }
}
