import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {map, Observable} from 'rxjs';
import {dto} from "../../../habarta/dto";
import {TimelineEventDTO, TimelineEventsDTO, TimelineEventType} from "./timeline-events.dto";
import TripDTO = dto.TripDTO;
import TripEventsDTO = dto.TripEventsDTO;
import TripEventDTO = dto.TripEventDTO;
import TripEventType = dto.TripEventType;
import TripEventDetailsType = dto.TripEventDetailsType;

// NE PAS AUTOFORMATTER

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

  getTripByDateAndVehicle(vehicleId: string, date: string):
    Observable<{ geolocDay: boolean; tripEvents: TripEventsDTO | null }>{
    const nonGeolocalized = location.pathname.indexOf('-non-geoloc')>0
    return this.http.get<{ geolocDay: boolean; tripEvents: TripEventsDTO | null }>
    (`${this.apiUrl}/vehicle`+(nonGeolocalized?'-non-geoloc':'')+
      `/${vehicleId}/${date}`).pipe(  map(response => ({
      ...response, // Keep other fields unchanged
      tripEvents: response.tripEvents ? this.decodeTripEventsDTO(response.tripEvents) : null
    }))
    );
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
      tripEvent.tripEventDetails = tripEvent.tripEventDetails?.map(sub => {
        sub.timestamp = sub.timestamp ? new Date((new Date()).toISOString().split("T")[0] + "T" + sub.timestamp) : null;
        return sub;
      }) ?? null;

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
      processTripEvent(tripEvent, tripEventsDto.tripEvents)
    );

    return tripEventsDto;
  }

  formatDuration(duration: number, withoutSeconds = true): string {
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;
    return `${hours > 0 ? `${hours}h ` : ``}${minutes}min${!withoutSeconds ? ` ${seconds}s` : ''}`;
  }

  formatDateToMinutes(date: Date | null): string {
    return date?.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'}) ?? '...';
  }

  tripEventToTimelineEvents(event: TripEventDTO): Array<TimelineEventDTO> {
    const timelineEvents = [];

    // -----------------------
    //   manage lunch breaks
    // -----------------------
    const lunchTypes = event.tripEventDetails?.map(sub => sub.type);
    const lunchEventTimes = event.tripEventDetails?.map(sub => this.formatDateToMinutes(sub.timestamp));
    const startMinutes = this.formatDateToMinutes(event.start);
    const endMinutes = this.formatDateToMinutes(event.end);

    const lunchBreakStart = lunchEventTimes?.[lunchTypes?.indexOf(TripEventDetailsType.START_LUNCH_BREAK) ?? -1]
    const lunchBreakEnd = lunchEventTimes?.[lunchTypes?.indexOf(TripEventDetailsType.END_LUNCH_BREAK) ?? -1]

    // conditions
    const isLunchBreakStart = lunchTypes?.includes(TripEventDetailsType.START_LUNCH_BREAK) ?? false;
    const isLunchBreakEnd = lunchTypes?.includes(TripEventDetailsType.END_LUNCH_BREAK) ?? false;
    const isInLunchBreak = ((lunchTypes?.length ?? 0) > 0 && lunchTypes?.every(it => it === TripEventDetailsType.LUNCH_BREAKING)) ?? false;

    const isFullLunchBreak = isLunchBreakStart && isLunchBreakEnd;
    const startsAtExactStart = isLunchBreakStart && startMinutes === lunchBreakStart
    const endsAtExactStart = isLunchBreakStart && endMinutes === lunchBreakStart
    const startsAtExactEnd = isLunchBreakEnd && startMinutes === lunchBreakEnd
    const endsAtExactEnd = isLunchBreakEnd && endMinutes === lunchBreakEnd

    const isStop = event.eventType === TripEventType.STOP || event.eventType === TripEventType.VEHICLE_IDLE || event.eventType === TripEventType.VEHICLE_RUNNING || event.eventType === TripEventType.VEHICLE_PARKED;

    if (isFullLunchBreak) {
      if (!startsAtExactStart) {
        timelineEvents.push(TimelineEventDTO.fromTripEvent(
          event,
          isStop ?
            TimelineEventType.LUNCH_STOP_BEFORE_START :
            TimelineEventType.LUNCH_TRIP_BEFORE_START
        ))
      }
      timelineEvents.push(TimelineEventDTO.fromTripEvent(
        event,
        TimelineEventType.LUNCH_START_SEPARATOR,
        lunchBreakStart
      ));
      if (startsAtExactStart && endsAtExactEnd) {
        timelineEvents.push(TimelineEventDTO.fromTripEvent(
          event,
          isStop ?
            TimelineEventType.STOP_LUNCH_BREAKING :
            TimelineEventType.TRIP_LUNCH_BREAKING
        ));
      }
      else if (startsAtExactStart) {
        timelineEvents.push(TimelineEventDTO.fromTripEvent(
          event,
          isStop ?
            TimelineEventType.LUNCH_STOP_BEFORE_STOP :
            TimelineEventType.LUNCH_TRIP_BEFORE_STOP
        ));
      }
      else if (endsAtExactEnd) {
        timelineEvents.push(TimelineEventDTO.fromTripEvent(
          event,
          isStop ?
            TimelineEventType.LUNCH_STOP_AFTER_START :
            TimelineEventType.LUNCH_TRIP_AFTER_START
        ));
      }
      else {
        timelineEvents.push(TimelineEventDTO.fromTripEvent(
          event,
          isStop ?
            TimelineEventType.LUNCH_STOP :
            TimelineEventType.LUNCH_TRIP
        ));
      }
      timelineEvents.push(TimelineEventDTO.fromTripEvent(
        event,
        TimelineEventType.LUNCH_STOP_SEPARATOR,
        lunchBreakEnd
      ));
      if (!endsAtExactEnd) {
        timelineEvents.push(TimelineEventDTO.fromTripEvent(
          event,
          isStop ?
            TimelineEventType.LUNCH_STOP_AFTER_STOP :
            TimelineEventType.LUNCH_TRIP_AFTER_STOP
        ))
      }
    }
    else if (isLunchBreakStart) {
      if (startsAtExactStart) {
        timelineEvents.push(TimelineEventDTO.fromTripEvent(
          event,
          TimelineEventType.LUNCH_START_SEPARATOR,
          lunchBreakStart
        ), TimelineEventDTO.fromTripEvent(
          event,
          isStop ?
            TimelineEventType.STOP_LUNCH_BREAKING :
            TimelineEventType.TRIP_LUNCH_BREAKING
        ));
      }
      else if (endsAtExactStart) {
        timelineEvents.push(TimelineEventDTO.fromTripEvent(
          event,
          isStop ?
            TimelineEventType.fromTripEventType(event.eventType) :
            TimelineEventType.TRIP
        ), TimelineEventDTO.fromTripEvent(
          event,
          TimelineEventType.LUNCH_START_SEPARATOR,
          lunchBreakStart
        ));
      }
      else {
          timelineEvents.push(TimelineEventDTO.fromTripEvent(
            event,
             isStop ?
              TimelineEventType.LUNCH_STOP_BEFORE_START :
              TimelineEventType.LUNCH_TRIP_BEFORE_START
          ), TimelineEventDTO.fromTripEvent(
            event,
            TimelineEventType.LUNCH_START_SEPARATOR,
            lunchBreakStart
          ), TimelineEventDTO.fromTripEvent(
            event,
            isStop ?
              TimelineEventType.LUNCH_STOP_AFTER_START :
              TimelineEventType.LUNCH_TRIP_AFTER_START
          ));
        }
    }
    else if (isLunchBreakEnd) {
      if (startsAtExactEnd) {
        timelineEvents.push(TimelineEventDTO.fromTripEvent(
          event,
          TimelineEventType.LUNCH_STOP_SEPARATOR,
          lunchBreakEnd
        ), TimelineEventDTO.fromTripEvent(
          event,
          isStop ?
            TimelineEventType.fromTripEventType(event.eventType):
            TimelineEventType.TRIP
        ));
      }
      else if (endsAtExactEnd) {
        timelineEvents.push(TimelineEventDTO.fromTripEvent(
          event,
          isStop ?
            TimelineEventType.STOP_LUNCH_BREAKING :
            TimelineEventType.TRIP_LUNCH_BREAKING
        ), TimelineEventDTO.fromTripEvent(
          event,
          TimelineEventType.LUNCH_STOP_SEPARATOR,
          lunchBreakEnd
        ));
      }
      else {
        timelineEvents.push(TimelineEventDTO.fromTripEvent(
          event,
          isStop ?
            TimelineEventType.LUNCH_STOP_BEFORE_STOP :
            TimelineEventType.LUNCH_TRIP_BEFORE_STOP
        ), TimelineEventDTO.fromTripEvent(
          event,
          TimelineEventType.LUNCH_STOP_SEPARATOR,
          lunchBreakEnd
        ), TimelineEventDTO.fromTripEvent(
          event,
          isStop ?
            TimelineEventType.LUNCH_STOP_AFTER_STOP :
            TimelineEventType.LUNCH_TRIP_AFTER_STOP
        ));
      }
    }
    else if (isInLunchBreak) {
      timelineEvents.push(TimelineEventDTO.fromTripEvent(
        event,
        isStop ?
          TimelineEventType.STOP_LUNCH_BREAKING :
          TimelineEventType.TRIP_LUNCH_BREAKING
      ));
    }
    else {
      timelineEvents.push(TimelineEventDTO.fromTripEvent(
        event,
        TimelineEventType.fromTripEventType(event.eventType)
      ));
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
