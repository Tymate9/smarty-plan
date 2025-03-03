import {Component, Input} from '@angular/core';
import {dto} from "../../../habarta/dto";
import TripEventsDTO = dto.TripEventsDTO;
import TripEventType = dto.TripEventType;
import {TripsService} from "./trips.service";
import {DatePipe, NgIf} from "@angular/common";
import {TableModule} from "primeng/table";

@Component({
  selector: 'app-trip-list',
  template: `
    <div>
      <p-table [value]="tripData?.tripEvents ?? []" [tableStyle]="{ 'min-width': '50rem' }" showGridlines stripedRows  >
        <ng-template pTemplate="header">
          <tr>
            <th>Type / Adresse</th>
            <th>De</th>
            <th>À</th>
            <th>Durée arrêt</th>
            <th>Durée trajet</th>
            <th>Distance</th>
          </tr>
        </ng-template>
        <ng-template pTemplate="body" let-tripEvent>
          <tr>
            <td>
              <span *ngIf="tripEvent.eventType === TripEventType.STOP">
                <span *ngIf="tripEvent.poiLabel"><b>{{ tripEvent.poiLabel }}</b><br/> {{ tripEvent.address }}</span>
                <span *ngIf="!tripEvent.poiLabel">{{ tripEvent.address }}</span>
              </span>
              <span *ngIf="tripEvent.eventType === TripEventType.TRIP">Trajet</span>
            </td>
            <td>{{ tripEvent.start | date: 'HH:mm' }}</td>
            <td>{{ tripEvent.end | date: 'HH:mm' }}</td>
            <td>{{ tripEvent.eventType === TripEventType.STOP ? (tripsService.formatDuration(tripEvent.duration)) : '-' }}</td>
            <td>{{ tripEvent.eventType === TripEventType.TRIP ? (tripsService.formatDuration(tripEvent.duration)) : '-' }}</td>
            <td>{{ tripEvent.eventType === TripEventType.TRIP ? tripEvent.distance?.toFixed(1) + ' Km' : '-' }}</td>
          </tr>
        </ng-template>
      </p-table>
    </div>
  `,
  standalone: true,
  imports: [
    DatePipe,
    TableModule,
    NgIf
  ],
  styles: [`
    table {
      width: 100%;
      border-collapse: collapse;
    }

    th, td {
      border: 1px solid #ddd;
      padding: 8px;
    }

    th {
      background-color: #f2f2f2;
    }
  `]
})
export class TripListComponent {
  private _tripData: TripEventsDTO | null = null;

  constructor(
    protected tripsService: TripsService
  ) {
  }

  @Input() set tripData(tripEvents: TripEventsDTO | null) {
    if (!tripEvents) {
      return;
    }

    this._tripData = tripEvents;
  }
  get tripData(): TripEventsDTO | null {
    return this._tripData;
  }

  protected readonly TripEventType = TripEventType;
}
