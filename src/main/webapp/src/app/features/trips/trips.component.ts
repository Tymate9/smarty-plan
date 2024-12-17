import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {TripsService} from "./trips.service";
import {dto} from "../../../habarta/dto";
import TripEventsDTO = dto.TripEventsDTO;
import {Calendar} from "primeng/calendar";
import {downloadAsCsv} from "../../core/csv/csv.downloader";


@Component({
  selector: 'app-trips',
  template: `
    <div id="trip-container">
      <p-tabView>
        <p-tabPanel>
          <ng-template pTemplate="header">
            <i class="pi pi-map"></i>
          </ng-template>
          <app-trip-map [tripData]="tripData"></app-trip-map>
        </p-tabPanel>
        <p-tabPanel>
          <ng-template pTemplate="header">
            <i class="pi pi-list"></i>
          </ng-template>
          <app-trip-list [tripData]="tripData"></app-trip-list>
        </p-tabPanel>
        <p-button id="download-csv-button" (click)="downloadCsv()"
                  title="Télécharger un CSV des trajets de la journée de ce véhicule"
                  icon="pi pi-download"
                  >
        </p-button>
        <p-calendar #calendar
                    id="date-selector"
                    [(ngModel)]="calendarDate"
                    [showIcon]="true"
                    [readonlyInput]="true"
                    [showButtonBar]="true"
                    [maxDate]="now"
                    dateFormat="yymmdd"></p-calendar>
      </p-tabView>
      <div *ngIf="!tripData" class="no-data">
        Pas de données de trajet pour ce jour
      </div>
    </div>
  `,
  styles: [`
    #trip-container {
      position: relative;
      z-index: 10000;

      .no-data {
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        top: 0;
        height: 80vh;
        background-color: rgba(0, 0, 0, 60%);
        width: 100%;
        font-size: 1.5rem;
        color: white;
        z-index: 10000;
      }

      #download-csv-button {
        position: absolute;
        top: 0;
        left: 30%;
        z-index: 10000;
      }

      #date-selector {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10001;

        ::ng-deep {
          .p-datepicker-trigger[aria-expanded=true] {
            &:before {
              content: "\\e90b";
              font-family: primeicons;
              speak: none;
              font-style: normal;
              font-weight: 400;
              font-variant: normal;
              text-transform: none;
            }

            calendaricon {
              display: none;
            }
          }

          .p-datepicker {
            top: 110%;
            left: 50%;
            transform: translateX(-50%);
          }
        }
      }

      ::ng-deep {
        .p-tabview-nav-container {
          z-index: 10000;
        }

        .p-tabview-nav {
          background: transparent;
          border: none;

          .p-tabview-nav-link {
            margin-left: 5px;
            border-radius: 10px;
          }
        }

        .p-tabview-panels {
          padding: 0;
        }
      }
    }
  `]
})
export class TripsComponent implements OnInit {
  @Input()
  vehicleId: string = '';
  @Input()
  date: string = '';
  protected now = new Date();
  @ViewChild('calendar')
  calendar!: Calendar;

  get calendarDate(): string {
    return this.date;
  }

  set calendarDate(date: Date) {
    date.setHours(3);
    this.router.navigate(['/trip', this.vehicleId, date.toISOString().slice(0, 10).replaceAll('-', '')])
  }

  protected tripData: TripEventsDTO | null = null;

  constructor(
    private route: ActivatedRoute,
    protected router: Router,
    private tripsService: TripsService
  ) {
  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.date = params.get('date') || '';
      this.vehicleId = params.get('vehicleId') || '';
      this.loadTrips();
    });
  }

  loadTrips(): void {
    this.tripsService.getTripByDateAndVehicle(this.vehicleId, this.date).subscribe({
      next: (data) => {
        this.tripData = data;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération du trajet:', error);
      }
    });
  }

  protected downloadCsv(): void {
    const headers = [
      'Type / Adresse',
      'De',
      'À',
      'Durée arrêt',
      'Durée trajet',
      'Distance',
      'Allure moyenne'
    ]
    const dataRows = this.tripData?.tripEvents.map(tripEvent => [
      tripEvent.eventType === dto.TripEventType.STOP ? tripEvent.poiLabel ? `${tripEvent.poiLabel} ${tripEvent.address}` : tripEvent.address : 'Trajet',
      tripEvent.start?.toLocaleTimeString() || '',
      tripEvent.end?.toLocaleTimeString() || '',
      tripEvent.eventType === dto.TripEventType.STOP ? this.tripsService.formatDuration(tripEvent.duration!) : '-',
      tripEvent.eventType === dto.TripEventType.TRIP ? this.tripsService.formatDuration(tripEvent.duration!) : '-',
      tripEvent.eventType === dto.TripEventType.TRIP ? tripEvent.distance?.toFixed(1) + ' Km' : '-',
      tripEvent.eventType === dto.TripEventType.TRIP ? `${((tripEvent.distance || 0) / (tripEvent.duration! / 3600))?.toFixed(1)} Km/h` : '-'
    ].join(',')) || [];
    downloadAsCsv([headers.join(','), ...dataRows], `trips_${this.vehicleId}_${this.date}.csv`);
  }

  protected hideCalendar(event: Event) {
    console.log(event);
    this.calendar.hideOverlay()
  }
}
