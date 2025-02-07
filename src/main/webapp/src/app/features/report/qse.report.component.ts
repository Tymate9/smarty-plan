import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {FilterService} from "../../commons/navbar/filter.service";
import {VehicleService} from "../vehicle/vehicle.service";
import {Subscription} from "rxjs";
import {dto} from "../../../habarta/dto";
import VehicleStatsDTO = dto.VehicleStatsDTO;

@Component({
  selector:'app-qse-report',
  template:`
    <app-date-range (fetchStats)="onFetchVehicleStats($event)"></app-date-range>
    <app-indicator-buttons
      [statsMap]="vehiclesStatsTotal"
      [keyLabels]="keyLabels"
      [buttonColor]="'var(--red-100)'"
      [sliceRange]="[0, 4]"
      [keyToPropertyMap]="keyToPropertyMap"
      (filterClicked)="filterByKey($event)">
    </app-indicator-buttons>

    <app-indicator-buttons
      [statsMap]="vehiclesStatsTotal"
      [keyLabels]="keyLabels"
      [buttonColor]="'var(--gray-300)'"
      [sliceRange]="[4, 8]"
      [keyToPropertyMap]="keyToPropertyMap"
      (filterClicked)="filterByKey($event)">
    </app-indicator-buttons>

  `,
  styles:[``]
})
export class QseReportComponent implements OnInit {

  constructor(private filterService: FilterService) {}
  private filtersSubscription?: Subscription;
  filters: { agencies: string[], vehicles: string[], drivers: string[] } = {
    agencies: [],
    vehicles: [],
    drivers: []
  };
  dateFrom: Date = new Date();
  dateTo: Date = new Date();
  //vehiclesStatsTotal: Record<string, any>;

  keyToPropertyMap: Record<string, keyof VehicleStatsDTO> = {
    totalHasLastTripLong: "hasLastTripLong",
    totalHasLateStartSum: "hasLateStartSum",
    totalHasLateStop: "hasLateStop",
  };

  keyLabels: Record<string, string> = {
    totalDrivingTime: "TEMPS DE CONDUITE TOTAL",
    totalWaitingTime: "TEMPS D\'ATTENTE TOTAL (en hh:mm)",
    totalDistanceSum: "DISTANCE PARCOURUE (en km)",
    longTrips:"TRAJETS LE PLUS LONG",
    averageBreakLength:"TEMPS REPOS MOYEN (en hh:mm)",
    selectionScore:"SCORE DE LA SELECTION",
    turn:"SEVERITE D'USAGE VIRAGE",
    speed:"SEVERITE D'USAGE ACCELERATION-FREINAGE"
  };


  vehiclesStatsTotal: Record<string, any> = {
    totalDrivingTime: "1420:45",
    totalWaitingTime: "360:15",
    totalDistanceSum: 15840,
    longTrips: 320,
    averageBreakLength: "00:45",
    selectionScore: "C",
    turn: "A",
    speed:"D"
  };

  ngOnInit() {
    this.filtersSubscription = this.subscribeToFilterChanges();
  }
  ngOnDestroy(): void {
    this.filtersSubscription?.unsubscribe()
  }
  onFetchVehicleStats(event: { dateFrom: Date; dateTo: Date }) {
    this.dateFrom=event.dateFrom;
    this.dateTo=event.dateTo;
    console.log(this.dateFrom, this.dateTo)
    //this.fetchVehicleStats();
  }

  private subscribeToFilterChanges(): Subscription {
    return this.filterService.filters$.subscribe(filters => {
      this.filters = filters as { agencies: string[], vehicles: string[], drivers: string[] };

    })
  };

  filterByKey(key: string) {
    console.log("Hello");
  }
}
