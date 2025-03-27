import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {dto} from "../../../habarta/dto";
import TripDTO = dto.TripDTO;
import TripEventsDTO = dto.TripEventsDTO;
import TripEventDTO = dto.TripEventDTO;
import TripEventType = dto.TripEventType;
import {TimelineEventDTO, TimelineEventsDTO, TimelineEventType} from "./timeline-events.dto";
import TripEventDetailsType = dto.TripEventDetailsType;

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

  formatDateToMinutes(date: Date | null): string | undefined {
    return date?.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'});
  }

  tripEventToTimelineEvents(event: TripEventDTO): Array<TimelineEventDTO> {
    const timelineEvents = [];
    const lunchTypes = event.tripEventDetails?.map(sub => sub.type);
    switch (true) {
      case lunchTypes?.includes(TripEventDetailsType.START_LUNCH_BREAK) && lunchTypes?.includes(TripEventDetailsType.END_LUNCH_BREAK):
        if (this.formatDateToMinutes(event.start) !== '12:00'){
          timelineEvents.push({
            originalEvent: event,
            type: event.eventType === TripEventType.STOP ?
              TimelineEventType.LUNCH_STOP_BEFORE_START :
              TimelineEventType.LUNCH_TRIP_BEFORE_START
          })
        }
        timelineEvents.push({
          originalEvent: event,
          type: TimelineEventType.LUNCH_START_SEPARATOR
        }, {
          originalEvent: event,
          type: event.eventType === TripEventType.STOP ?
            TimelineEventType.STOP_LUNCH_BREAKING :
            TimelineEventType.TRIP_LUNCH_BREAKING
        }, {
          originalEvent: event,
          type: TimelineEventType.LUNCH_STOP_SEPARATOR
        });
        if (this.formatDateToMinutes(event.end) !== '13:30'){
          timelineEvents.push({
            originalEvent: event,
            type: event.eventType === TripEventType.STOP ?
              TimelineEventType.LUNCH_STOP_AFTER_STOP :
              TimelineEventType.LUNCH_TRIP_AFTER_STOP
          })
        }

        break;
      case lunchTypes?.includes(TripEventDetailsType.START_LUNCH_BREAK):
        if (this.formatDateToMinutes(event.start) === '12:00') { // todo : replace with comparison to detail timestamp
          timelineEvents.push({
            originalEvent: event,
            type: TimelineEventType.LUNCH_START_SEPARATOR
          }, {
            originalEvent: event,
            type: event.eventType === TripEventType.STOP ?
              TimelineEventType.STOP_LUNCH_BREAKING :
              TimelineEventType.TRIP_LUNCH_BREAKING
          });
        }
        else if (this.formatDateToMinutes(event.end) === '12:00') {
          timelineEvents.push({
            originalEvent: event,
            type: event.eventType === TripEventType.STOP ?
              TimelineEventType.STOP :
              TimelineEventType.TRIP
          }, {
            originalEvent: event,
            type: TimelineEventType.LUNCH_START_SEPARATOR
          });
        }
        else {
          timelineEvents.push({
            originalEvent: event,
            type: event.eventType === TripEventType.STOP ?
              TimelineEventType.LUNCH_STOP_BEFORE_START :
              TimelineEventType.LUNCH_TRIP_BEFORE_START
          }, {
            originalEvent: event,
            type: TimelineEventType.LUNCH_START_SEPARATOR
          }, {
            originalEvent: event,
            type: event.eventType === TripEventType.STOP ?
              TimelineEventType.LUNCH_STOP_AFTER_START :
              TimelineEventType.LUNCH_TRIP_AFTER_START
          });
        }
        break;
      case lunchTypes?.includes(TripEventDetailsType.END_LUNCH_BREAK) :
        if (this.formatDateToMinutes(event.start) === '13:30') { // todo : replace with comparison to detail timestamp
          timelineEvents.push({
            originalEvent: event,
            type: TimelineEventType.LUNCH_STOP_SEPARATOR
          }, {
            originalEvent: event,
            type: event.eventType === TripEventType.STOP ?
              TimelineEventType.STOP :
              TimelineEventType.TRIP
          });
        }
        else if (this.formatDateToMinutes(event.end) === '13:30') {
          timelineEvents.push({
            originalEvent: event,
            type: event.eventType === TripEventType.STOP ?
              TimelineEventType.STOP_LUNCH_BREAKING :
              TimelineEventType.TRIP_LUNCH_BREAKING
          }, {
            originalEvent: event,
            type: TimelineEventType.LUNCH_STOP_SEPARATOR
          });
        }
        else {
          timelineEvents.push({
            originalEvent: event,
            type: event.eventType === TripEventType.STOP ?
              TimelineEventType.LUNCH_STOP_BEFORE_STOP :
              TimelineEventType.LUNCH_TRIP_BEFORE_STOP
          }, {
            originalEvent: event,
            type: TimelineEventType.LUNCH_STOP_SEPARATOR
          }, {
            originalEvent: event,
            type: event.eventType === TripEventType.STOP ?
              TimelineEventType.LUNCH_STOP_AFTER_STOP :
              TimelineEventType.LUNCH_TRIP_AFTER_STOP
          });
        }
        break;
      case lunchTypes?.some(it => it !== TripEventDetailsType.LUNCH_BREAKING) :
        timelineEvents.push({
          originalEvent: event,
          type: event.eventType === TripEventType.STOP ?
            TimelineEventType.STOP_LUNCH_BREAKING :
            TimelineEventType.TRIP_LUNCH_BREAKING
        });
        break;
      default:
        timelineEvents.push({
          originalEvent: event,
          type: TimelineEventType.fromTripEventType(event.eventType)
        });
        break;
    }
    return timelineEvents;
  }

  tripEventsToTimelineEventsDTO(tripEvents: TripEventsDTO): TimelineEventsDTO {
    const timelineEvents = new TimelineEventsDTO();
    timelineEvents.vehicleId = tripEvents.vehicleId;
    timelineEvents.licensePlate = tripEvents.licensePlate;
    timelineEvents.driverName = tripEvents.driverName;
    timelineEvents.vehicleCategory = tripEvents.vehicleCategory;
    timelineEvents.range = tripEvents.range;
    timelineEvents.stopDuration = tripEvents.stopDuration;
    timelineEvents.drivingDuration = tripEvents.drivingDuration;
    timelineEvents.tripAmount = tripEvents.tripAmount;
    timelineEvents.idleDuration = tripEvents.idleDuration;
    timelineEvents.drivingDistance = tripEvents.drivingDistance;
    timelineEvents.poiAmount = tripEvents.poiAmount;
    timelineEvents.compactedTripEvents = tripEvents.compactedTripEvents.flatMap(event => this.tripEventToTimelineEvents(event));
    timelineEvents.tripEvents = tripEvents.tripEvents.flatMap(event => this.tripEventToTimelineEvents(event));
    return timelineEvents
  }
}
