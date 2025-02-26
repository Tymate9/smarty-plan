import { Component, EventEmitter, Output , ChangeDetectorRef } from '@angular/core';
import {Calendar} from "primeng/calendar";
import {FormsModule} from "@angular/forms";
import {Button} from "primeng/button";
import {DatePicker} from "primeng/datepicker";
import {SelectButton} from "primeng/selectbutton";

@Component({
  selector: 'app-date-range',
  template: `
    <div class="calendar-container">
      <p-datepicker
        [(ngModel)]="dateFrom"
        placeholder="De"
        [maxDate]="now"
        [showOtherMonths]="true"
        [selectOtherMonths]="true"
        [showButtonBar]="true"
        [showIcon]="true"
        [readonlyInput]="true"
        appendTo="body"
      >
      </p-datepicker>

      <p-datepicker
        [(ngModel)]="dateTo"
        [showIcon]="true"
        placeholder="à"
        [maxDate]="now"
        [showOtherMonths]="true"
        [selectOtherMonths]="true"
        [showButtonBar]="true"
        [showOnFocus]="true"
        [readonlyInput]="true"
        appendTo="body"
      >
      </p-datepicker>

      <p-button
        icon="pi pi-search"
        (click)="fetchVehicleStats()"
        >
      </p-button>
      <p-selectButton
        [options]="inputVehicleOptions"
        [(ngModel)]="vehiclesTypeList"
        optionLabel="label"
        optionValue="value"
        [multiple]="true"
        (ngModelChange)="onVehicleSelectionChange()"
      ></p-selectButton>
    </div>

  `,
  standalone: true,
  imports: [
    Calendar,
    FormsModule,
    Button,
    DatePicker,
    SelectButton
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

  `]
})
export class DateRangePickerComponent {
  dateFrom: Date= new Date();
  dateTo: Date= new Date();
  now: Date = new Date();

  inputVehicleOptions = [
    { label: 'Géo', value: 'tracked' },
    { label:'Non Géo', value:'untracked'}
  ];
  vehiclesTypeList: string[] = ['tracked'];
  vehiclesType:string='';

  @Output() fetchStats = new EventEmitter<{ dateFrom: Date; dateTo: Date ; vehiclesType: string }>();

  constructor(private cdr: ChangeDetectorRef) {}

  fetchVehicleStats() {
    this.fetchStats.emit({ dateFrom: this.dateFrom, dateTo: this.dateTo ,vehiclesType:this.vehiclesType });
  }
  // onVehicleSelectionChange() {
  //   if (this.vehiclesTypeList.includes('tracked') && this.vehiclesTypeList.includes('untracked')) {
  //     this.vehiclesType = 'allVehicles';
  //     console.log('heeeeellllllooo')
  //   }
  //   else {
  //     // Handle the case where either only "tracked" or "untracked" is selected
  //     this.vehiclesType = this.vehiclesTypeList.join(', ');
  //     console.log('heee')
  //   }
  // }
  onVehicleSelectionChange() {
    if (this.vehiclesTypeList.includes('tracked') && this.vehiclesTypeList.includes('untracked')) {
      this.vehiclesType = 'allVehicles'
    } else {
      this.vehiclesType = this.vehiclesTypeList.join(',');

    }
  }

}
