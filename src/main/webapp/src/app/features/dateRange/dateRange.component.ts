import { Component, EventEmitter, Output , ChangeDetectorRef } from '@angular/core';
import {Calendar} from "primeng/calendar";
import {FormsModule} from "@angular/forms";
import {Button} from "primeng/button";

@Component({
  selector: 'app-date-range',
  template: `
    <div class="calendar-container">
      <p-calendar
        [(ngModel)]="dateFrom"
        placeholder="De"
        [maxDate]="now"
        [showOtherMonths]="true"
        [selectOtherMonths]="true"
        [showButtonBar]="true"
        [showIcon]="true"
        appendTo="body"
      >
      </p-calendar>

      <p-calendar
        [(ngModel)]="dateTo"
        placeholder="à"
        [maxDate]="now"
        [showOtherMonths]="true"
        [selectOtherMonths]="true"
        [showButtonBar]="true"
        [showIcon]="true"
        appendTo="body"
      >
      </p-calendar>

      <p-button
        [raised]="true"
        severity="info"
        icon="pi pi-search"
        (click)="fetchVehicleStats()"
        styleClass="custom-button">
      </p-button>
    </div>

  `,
  standalone: true,
  imports: [
    Calendar,
    FormsModule,
    Button
  ],
  styles: [`
    .calendar-container {
      display: flex;
      flex-direction: row;
      justify-content: center;
      align-items: center;
      gap: 100px;
      margin-top: 20px;
    }

    ::ng-deep .p-calendar .p-inputtext:focus,
    ::ng-deep .p-calendar .p-inputtext:hover,
    ::ng-deep .p-calendar:not(.p-calendar-disabled).p-focus > .p-inputtext {
      outline: 0 none;
      outline-offset: 0;
      color: black;
      border-color: white !important;
      box-shadow: 0 0 0 0.2rem rgba(255, 87, 51, 0.25);
    }

    ::ng-deep .p-calendar .p-datepicker {
      z-index: 1000;
      top: 50px;
      border-color: white !important;
      box-shadow: 0 0 0 0.2rem rgba(255, 87, 51, 0.25);
    }

    ::ng-deep .p-calendar .p-button {
      background-color: #aa001f;
      border-color: #aa001f !important;
      color: white !important;
      font-weight: 600;
    }

    /*style de bouton personnalisé*/
    ::ng-deep .p-button.p-component.p-button-info.p-button-raised.custom-button {
      background-color: #aa001f !important;
      border-color: #aa001f !important;
      color: white !important;
      font-weight: 600;
    }

    ::ng-deep .p-button.p-component.p-button-info.p-button-raised.custom-button:focus,
    ::ng-deep .p-button.p-component.p-button-info.p-button-raised.custom-button:active {
      border-color: white !important;
      box-shadow: 0 0 0 0.2rem rgba(255, 87, 51, 0.25);
    }

    ::ng-deep .p-button.p-button-text {
      color: white !important;
    }

    ::ng-deep .p-button:active, ::ng-deep .p-button:focus {
      border-color: white !important;
      box-shadow: 0 0 0 0.2rem rgba(255, 87, 51, 0.25);
    }

  `]
})
export class DateRangePickerComponent {
  dateFrom: Date= new Date();
  dateTo: Date= new Date();
  now: Date = new Date();

  @Output() fetchStats = new EventEmitter<{ dateFrom: Date; dateTo: Date }>();

  constructor(private cdr: ChangeDetectorRef) {}

  fetchVehicleStats() {
    this.fetchStats.emit({ dateFrom: this.dateFrom, dateTo: this.dateTo });
  }

}
