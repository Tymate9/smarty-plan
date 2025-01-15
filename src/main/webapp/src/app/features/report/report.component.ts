import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {FilterService} from "../../commons/navbar/filter.service";
import {Calendar} from "primeng/calendar";

@Component({
  selector: 'app-report',
  template: `
    <div class="calendar-container">
      <p-calendar
        [(ngModel)]="dateFrom"
        placeholder="Select From Date"
        [maxDate]="now"
        [showOtherMonths]="true"
        [showButtonBar]="true"
        appendTo="body">
      </p-calendar>
      <p-calendar
        [(ngModel)]="dateTo"
        placeholder="Select To Date"
        [maxDate]="now"
        [showOtherMonths]="true"
        [showButtonBar]="true"
        appendTo="body">
      </p-calendar>
    </div>

    <div class="status-buttons">
      <button
        *ngFor="let indicator of indicatorsValues"
        pButton
        [ngStyle]="{ '--button-color': 'var(--gray-300)' }"
        class="custom-status-button">
<!--        (click)="filterByStatus(status.state)">-->
        <span>
          <span class="status-count">{{ indicator.count }}</span>
          <span class="status-text">{{ indicator.state }}</span>
        </span>
      </button>
    </div>
    <div class="status-buttons">
      <button
        *ngFor="let indicatorclick of indicatorsclick"
        pButton
        [ngStyle]="{ '--button-color': 'var(--gray-400)' }"
        class="custom-status-button">
        <!--        (click)="filterByStatus(status.state)">-->
        <span>
          <span class="status-count">{{ indicatorclick.count }}</span>
          <span class="status-text">{{ indicatorclick.state }}</span>
        </span>
      </button>
    </div>


  `,
  styles: [`
    .calendar-container {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      gap: 200px;
      margin-top: 20px;
    }

    ::ng-deep .p-calendar .p-inputtext:focus,
    ::ng-deep .p-calendar .p-inputtext:hover,
    ::ng-deep .p-calendar:not(.p-calendar-disabled).p-focus>.p-inputtext {
      outline: 0 none;
      outline-offset: 0;
      border-color: white !important;
      box-shadow: 0 0 0 0.2rem rgba(255, 87, 51, 0.25);
    }
    ::ng-deep .p-calendar .p-datepicker {
      z-index: 1000;
      top:50px;
      border-color: white !important;
      box-shadow: 0 0 0 0.2rem rgba(255, 87, 51, 0.25);
    }
    ::ng-deep .p-button.p-button-text{
      color:var(--gray-700) !important;
    }
    ::ng-deep .p-button:active,::ng-deep .p-button:focus {
      border-color: white !important;
      box-shadow: 0 0 0 0.2rem rgba(255, 87, 51, 0.25);
    }

    /*Style de bouton Indicateur*/
    .status-buttons {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      margin-top: 20px;
      justify-content: center;
      align-items: center;
    }

    .custom-status-button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30px;
      font-size: 10px;
      font-weight: bold;
      border: none;
      width: 100%;
      flex: 1 1 170px;
      height: 90px;
      box-sizing: border-box;
      position: relative;
      border-radius: 20px;
      color: #333;
      background: white;
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
      white-space: nowrap;
      box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.2);

    }

    .custom-status-button i {
      margin-right: auto;
      font-size: 30px;
      color: var(--button-color, #007bff);
      margin-left: auto;

    }

    .custom-status-button:hover {
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2);
      transform: translateY(-2px);
    }

    .custom-status-button::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 30%;
      background: var(--button-color, #007bff);
      border-top-left-radius: 20px;
      border-bottom-left-radius: 20px;
    }

    .custom-status-button span {
      position: relative;
      z-index: 3;
      display: flex;
      flex: 1;
      justify-content: space-between;
      padding-left: 13px;
    }

    .custom-status-button .status-count {
      color: white !Important;
      padding: 0 5px !Important;
      font-weight: bold !Important;
      margin-right: 10px !Important;
    }

    .custom-status-button .status-text {
      color: var(--button-color, #007bff);
    }

    /*fin de Style de bouton Indicateur*/

  `]
})
export class ReportComponent implements OnInit {
  selectedTags: { [key: string]: string[] } = {};
  dateFrom: Date | null = new Date();
  dateTo: Date | null = new Date();
  protected now = new Date();
  constructor(private filterService: FilterService) {}
 // indicatorsValues: { state: string; count: number }[] = [];
  @Input()
  vehicleId: string = '';
  @Input()
  date: string = '';

  @ViewChild('calendar')
  calendar!: Calendar;

  get calendarDate(): string {
    return this.date;
  }

  set calendarDate(date: Date) {
    date.setHours(3);
    //this.loading = true;
    //this.router.navigate(['/trip', this.vehicleId, date.toISOString().slice(0, 10).replaceAll('-', '')])
  }

  indicatorsValues: { state: string; count: number }[] = [
    { state: 'TEMPS DE CONDUITE TOTAL', count: 152 },
    { state: 'TEMPS D\'ATTENTE TOTAL (en hh:mm)\n', count: 98 },
    { state: 'DISTANCE PARCOURUE (en km)\n', count: 74 },
    { state: 'TRAJETS EFFECTUES (en nb)\n', count: 123 },
    { state: 'DISTANCE MOYENNE/TRAJET (en km)\n', count: 85 }
  ];
  indicatorsclick: { state: string; count: number }[] = [
    { state: 'TEMPS DE CONDUITE DECLARE TOTAL\n', count: 67 },
    { state: 'CONDUITE EN DEHORS PLAGE AUTORISEE  (en hh:mm)\n', count: 93 },
    { state: 'DEPART TARDIF  (en nb)\n', count: 41 },
    { state: 'PAUSE DEJEUNER>1h30  (en nb)\n', count: 57 },
    { state: 'DERNIER TRAJET>45mn  (en nb)\n', count: 110 }
  ];
  ngOnInit() {
    // S'abonner aux filtres partagés
    this.filterService.filters$.subscribe(filters => {
      this.selectedTags = filters;
    });
  }
}

