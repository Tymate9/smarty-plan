import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {TripsService} from "./trips.service";
import {dto} from "../../../habarta/dto";
import TripEventsDTO = dto.TripEventsDTO;
import {Calendar} from "primeng/calendar";
import {downloadAsCsv} from "../../core/csv/csv.downloader";
import {ProgressSpinner} from "primeng/progressspinner";
import {TripListComponent} from "./trip-list.component";
import {Button} from "primeng/button";
import {TabPanel, TabView} from "primeng/tabview";
import {TripMapComponent} from "./trip-map.component";
import {PrimeTemplate} from "primeng/api";
import {FormsModule} from "@angular/forms";
import {NgIf} from "@angular/common";
 import {DatePicker} from "primeng/datepicker";


@Component({
  selector: 'app-trips',
  template: `
    <div id="trip-container">
      <p-tabView>
        <p-tabPanel>
          <ng-template pTemplate="header">
            <i class="pi pi-map"></i>
          </ng-template>
          <app-trip-map
            [tripGeoloc]="tripGeoloc"
            [tripData]="tripData"
          >
          </app-trip-map>
        </p-tabPanel>
        <p-tabPanel>
          <ng-template pTemplate="header">
            <i class="pi pi-list"></i>
          </ng-template>
          <app-trip-list [tripData]="tripData"></app-trip-list>
        </p-tabPanel>
        <p-button id="download-csv-button" (click)="downloadCsv()"
                  title="Télécharger un CSV des trajets de la journée de ce véhicule"
                  icon="pi pi-download">
        </p-button>
        <p-datepicker
          #calendar
          id="date-selector"
          [(ngModel)]="calendarDate"
          [showIcon]="true"
          [showButtonBar]="true"
          [maxDate]="now"
          [readonlyInput]="true"
          [showOtherMonths]="true"
          [selectOtherMonths]="true"
          dateFormat="yymmdd"
          />

      </p-tabView>
      <div *ngIf="loading" class="full-screen-info">
        Données en cours de chargement...
        <p-progressSpinner strokeWidth="6"/>
      </div>
      <div *ngIf="!loading && !tripData" class="full-screen-info">
        Pas de données de trajet pour ce jour
      </div>
    </div>
  `,
  standalone: true,
  imports: [
    ProgressSpinner,
    TripListComponent,
    Button,
    TabPanel,
    TabView,
    TripMapComponent,
    PrimeTemplate,
    FormsModule,
    NgIf,
    DatePicker
  ],
  styles: [`
    #trip-container {
      position: relative;
      z-index: 0;

      .full-screen-info {
        position: absolute;
        display: flex;
        justify-content: center;
        align-items: center;
        top: 0;
        height: calc(100vh - 75px);
        background-color: rgba(0, 0, 0, 60%);
        width: 100%;
        font-size: 1.5rem;
        color: white;
        z-index: 10000;
      }

      ::ng-deep {
        .p-progress-spinner {
          width: 40px;
          height: 40px;

          .p-progress-spinner-circle {
            animation: p-progress-spinner-dash 1.5s ease-in-out infinite;
            stroke: #aa001f;
          }
        }

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
          .p-datepicker {
            top: 110%;
            left: 50%;
            transform: translateX(-50%);
          }
        }
      }
    }
    ::ng-deep .p-tablist-content {
      z-index: 10000;
      padding: 5px;
      height: 60px;
      align-items: center;
      display: flex;
    }

    :host ::ng-deep .p-tablist-tab-list
    {
      z-index: 999 !important;
      background-color: transparent !important;
      border:none !important;
    }
    :host ::ng-deep .p-tabpanels
    {
      padding: 0 !important;
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
    const nonGeolocalized = location.pathname.indexOf('-non-geoloc')>0
    date.setHours(3);
    this.loading = true;
    this.router.navigate(['/trip'+(nonGeolocalized?'-non-geoloc':''), this.vehicleId, date.toISOString().slice(0, 10).replaceAll('-', '')])
  }

  protected tripData: TripEventsDTO | null = null;
  protected loading: boolean = true;
  public tripGeoloc:boolean = true;

  constructor(
    private route: ActivatedRoute,
    protected router: Router,
    private tripsService: TripsService
  ) {
  }

  ngOnInit(): void {
    this.loading = true;
    this.route.paramMap.subscribe(params => {
      this.date = params.get('date') || '';
      this.vehicleId = params.get('vehicleId') || '';
      this.loadTrips();
    });
  }

  loadTrips(): void {
    this.tripsService.getTripByDateAndVehicle(this.vehicleId, this.date).subscribe({
      next: (data) => {
        this.loading = false;
        this.tripData = data.tripEvents;
        this.tripGeoloc = data.geolocDay;
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
    const dataRows = this.tripData?.tripEvents
      .filter(tripEvent => tripEvent.eventType !== dto.TripEventType.TRIP_EXPECTATION)
      .map(tripEvent => [
        tripEvent.eventType !== dto.TripEventType.TRIP ? tripEvent.poiLabel ? `${tripEvent.poiLabel} ${tripEvent.address}` : tripEvent.address : 'Trajet',
        tripEvent.start?.toLocaleTimeString() || '',
        tripEvent.end?.toLocaleTimeString() || '',
        tripEvent.eventType === dto.TripEventType.STOP ? this.tripsService.formatDuration(tripEvent.duration!) : '-',
        tripEvent.eventType === dto.TripEventType.TRIP ? this.tripsService.formatDuration(tripEvent.duration!) : '-',
        tripEvent.eventType === dto.TripEventType.TRIP ? tripEvent.distance?.toFixed(1) + ' Km' : '-',
        tripEvent.eventType === dto.TripEventType.TRIP ? `${((tripEvent.distance || 0) / (tripEvent.duration! / 3600))?.toFixed(1)} Km/h` : '-'
      ].join(',')) || [];
    downloadAsCsv([headers.join(','), ...dataRows], `trips_` +
      (this.tripGeoloc ? `` : `non_geoloc_`) + `${this.vehicleId}_${this.date}.csv`);
  }

  protected hideCalendar(event: Event) {
    this.calendar.hideOverlay()
  }
}
