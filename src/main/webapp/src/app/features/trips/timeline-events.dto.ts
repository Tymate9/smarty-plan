import {dto} from "../../../habarta/dto";
import TripEventDTO = dto.TripEventDTO;
import TripEventType = dto.TripEventType;


export class TimelineEventsDTO {
  vehicleId: string;
  licensePlate: string;
  driverName: string;
  vehicleCategory: string;
  range: number;
  stopDuration: number;
  drivingDuration: number;
  tripAmount: number;
  idleDuration: number;
  drivingDistance: number;
  poiAmount: number;
  tripEvents: TimelineEventDTO[];
  compactedTripEvents: TimelineEventDTO[];
}

export class TimelineEventDTO {
  originalEvent: TripEventDTO;
  type: TimelineEventType
}


export enum TimelineEventType {
  TRIP = "TRIP",
  TRIP_EXPECTATION = "TRIP_EXPECTATION",
  STOP = "STOP",
  VEHICLE_RUNNING = "VEHICLE_RUNNING",
  VEHICLE_IDLE = "VEHICLE_IDLE",

  LUNCH_START_SEPARATOR = "LUNCH_START_SEPARATOR", // separator at the start of the lunch break
  LUNCH_STOP_SEPARATOR = "LUNCH_STOP_SEPARATOR", // separator at the end of the lunch break

  LUNCH_TRIP_BEFORE_START = "LUNCH_TRIP_BEFORE_START", // split trip event before the start of the lunch break
  LUNCH_TRIP_AFTER_START = "LUNCH_TRIP_AFTER_START",  // split trip event after the start of the lunch break
  LUNCH_TRIP_BEFORE_STOP = "LUNCH_TRIP_BEFORE_STOP", // split trip event before the end of the lunch break
  LUNCH_TRIP_AFTER_STOP = "LUNCH_TRIP_AFTER_STOP", // split trip event after the end of the lunch break

  LUNCH_STOP_BEFORE_START = "LUNCH_STOP_BEFORE_START", // split stop event before the start of the lunch break
  LUNCH_STOP_AFTER_START = "LUNCH_STOP_AFTER_START", // split stop event after the start of the lunch break
  LUNCH_STOP_BEFORE_STOP = "LUNCH_STOP_BEFORE_STOP", // split stop event before the end of the lunch break
  LUNCH_STOP_AFTER_STOP = "LUNCH_STOP_AFTER_STOP", // split stop event after the end of the lunch break

  LUNCH_TRIP = "LUNCH_TRIP", // split trip event inside lunch break that splits both before and after
  LUNCH_STOP = "LUNCH_STOP", // split stop event inside lunch break that splits both before and after

  TRIP_LUNCH_BREAKING = "TRIP_LUNCH_BREAKING", // trip event that is inside the lunch and not split
  STOP_LUNCH_BREAKING = "STOP_LUNCH_BREAKING", // stop event that is inside the lunch and not split
}

export namespace TimelineEventType {
  export function fromTripEventType(tripEventType: TripEventType): TimelineEventType {
    switch (tripEventType) {
      case TripEventType.TRIP:
        return TimelineEventType.TRIP;
      case TripEventType.TRIP_EXPECTATION:
        return TimelineEventType.TRIP_EXPECTATION;
      case TripEventType.STOP:
        return TimelineEventType.STOP;
      case TripEventType.VEHICLE_RUNNING:
        return TimelineEventType.VEHICLE_RUNNING;
      case TripEventType.VEHICLE_IDLE:
        return TimelineEventType.VEHICLE_IDLE;
      default:
        return TimelineEventType.TRIP; // should never happen
    }
  }
}
