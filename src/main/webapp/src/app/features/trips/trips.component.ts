import {Component, Input, OnInit, ViewChild} from "@angular/core";
import {ActivatedRoute, Router} from "@angular/router";
import {TripsService} from "./trips.service";
import {dto} from "../../../habarta/dto";
import TripEventsDTO = dto.TripEventsDTO;
import {Calendar} from "primeng/calendar";


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
        <p-calendar #calendar
                    id="date-selector"
                    (blur)="hideCalendar($event)"
                    [(ngModel)]="calendarDate"
                    [showIcon]="true"
                    [readonlyInput]="true"
                    [maxDate]="now"
                    dateFormat="yymmdd"></p-calendar>
      </p-tabView>
    </div>
  `,
  styles: [`
    #trip-container {
      position: relative;
      z-index: 10000;

      #date-selector {
        position: absolute;
        top: 0;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10000;
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

  protected hideCalendar(event: Event) {
    console.log(event);
    this.calendar.hideOverlay()
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

  protected readonly Date = Date;
}
