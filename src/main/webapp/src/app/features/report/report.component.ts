import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {FilterService} from "../../commons/navbar/filter.service";
import {TeamHierarchyNodeStats, VehicleService} from "../vehicle/vehicle.service";
import {Calendar} from "primeng/calendar";
import {TreeNode} from "primeng/api";
import {dto} from "../../../habarta/dto";
import VehiclesStatsDTO = dto.VehiclesStatsDTO;
import {Subscription} from "rxjs";
import VehicleStatsDTO = dto.VehicleStatsDTO;
import {TreeTableModule} from "primeng/treetable";
import {NgClass, NgForOf, NgIf, NgStyle} from "@angular/common";
import {Button} from "primeng/button";
import {Dialog} from "primeng/dialog";
import {DateRangePickerComponent} from "../dateRange/dateRange.component";
import {IndicatorButtonsComponent} from "../indicator/indicator-buttons.component";
import {TableModule} from "primeng/table";


@Component({
  selector: 'app-report',
  template: `

    <app-date-range (fetchStats)="onFetchVehicleStats($event)"></app-date-range>

    <app-indicator-buttons
      [statsMap]="vehiclesStatsTotal"
      [keyLabels]="keyLabels"
      [buttonColor]="'var(--p-red-100)'"
      [sliceRange]="[0, 6]"
      [keyToPropertyMap]="keyToPropertyMap"
      (filterClicked)="filterByKey($event)">
    </app-indicator-buttons>

    <app-indicator-buttons
      [statsMap]="vehiclesStatsTotal"
      [keyLabels]="keyLabels"
      [buttonColor]="'var(--p-gray-300)'"
      [sliceRange]="[6, 12]"
      [keyToPropertyMap]="keyToPropertyMap"
      (filterClicked)="filterByKey($event)">
    </app-indicator-buttons>

    <p-treeTable *ngIf="vehiclesStatsTree.length"
                 #treeTable
                 [value]="vehiclesStatsTree"
                 [scrollable]="true"
                 [tableStyle]="{'width': '95%', 'margin': '0 auto' , 'table-layout' :'auto'}"
                 [resizableColumns]="true"
                 styleClass="p-treetable-gridlines custom-tree-table">

      <ng-template pTemplate="header">
      </ng-template>

      <ng-template pTemplate="body" let-rowNode let-rowData="rowData">
        <tr [ttRow]="rowNode"
            [ngClass]="{
          'dynamic-tt-parent-node': !rowNode.parent,
          'no-vehicle': rowNode.parent && rowData.children && rowData.children.length > 0,
          'dynamic-tt-leaf': rowData.vehicle
        }">
          <td *ngIf="!rowData.vehicle" colspan="13">
            <p-treeTableToggler class="dynamic-tt-togglerButton" [rowNode]="rowNode"/>
            {{ rowData.label }}
          </td>
        </tr>
        <tr [ttRow]="rowNode"
            *ngIf="!rowNode.parent"
            class="dynamic-tt-header">
          <td>Véhicule</td>
          <td>Conducteur</td>
          <td>Nb de trajets effectués (nb)</td>
          <td>Distance parcourue</td>
          <td>Temps de conduite (en HH:MM)</td>
          <td>Distance moyenne / Trajet (en km)</td>
          <td>Durée moyenne / Trajet (en HH:MM)</td>
          <td>Départ tardif (>7H30)</td>
          <td>Dernier arrêt tardif (>18H)</td>
          <td>Dernier trajet long (>45mn)</td>
          <td>Amplitude</td>
          <td>Temps d'attente</td>
          <td>Détails</td>
        </tr>

        <tr [ttRow]="rowNode"
            [ngClass]="{
          'dynamic-tt-parent-node': !rowNode.parent,
          'no-vehicle': rowNode.parent && rowData.children && rowData.children.length > 0,
          'dynamic-tt-leaf': rowData.vehicle
        }"
            *ngIf="rowData.vehicle">
          <td>{{ rowData.vehicle.vehicleStats.licensePlate || 'Véhicule' }}</td>
          <td *ngIf="rowData.vehicle.vehicleStats.driverName; else noDriver">
            {{ rowData.vehicle.vehicleStats.driverName || 'Véhicule non attribué' }}
          </td>
          <ng-template #noDriver>
            <td>Véhicule non attribué</td>
          </ng-template>
          <td>{{ rowData.vehicle.vehicleStats.tripCount }}</td>
          <td>{{ rowData.vehicle.vehicleStats.distanceSum }}</td>
          <td>{{ rowData.vehicle.vehicleStats.drivingTime }}</td>
          <td>{{ rowData.vehicle.vehicleStats.distancePerTripAvg }}</td>
          <td>{{ rowData.vehicle.vehicleStats.durationPerTripAvg }}</td>
          <td>{{ rowData.vehicle.vehicleStats.hasLateStartSum }}</td>
          <td>{{ rowData.vehicle.vehicleStats.hasLateStop }}</td>
          <td>{{ rowData.vehicle.vehicleStats.hasLastTripLong }}</td>
          <td>{{ rowData.vehicle.vehicleStats.rangeAvg }}</td>
          <td>{{ rowData.vehicle.vehicleStats.waitingDuration }}</td>
          <td>
            <p-button icon="pi pi-info-circle"
                      (click)="fetchVehicleDailyStats(rowData.vehicle?.vehicleStats.vehicleId , rowData.vehicle?.vehicleStats.licensePlate)"
            ></p-button>
          </td>
        </tr>

      </ng-template>
    </p-treeTable>

    <p-dialog [(visible)]="displayDailyStats"
              [modal]="false"
              [header]="'Détails journaliers - ' + selectedDailyStat"
              [style]="{width: '60vw'}"
              [draggable]="false"
              (onHide)="closeDialog()">
      <div class="table-container">
        <p-table [value]="vehicleDailyStats" showGridlines stripedRows>
          <ng-template #header>
            <tr>
              <th>Date</th>
              <th>Conducteur</th>
              <th>Nb de trajets effectués (nb)</th>
              <th>Distance parcourue</th>
              <th>Temps de conduite (en HH:MM)</th>
              <th>Distance moyenne / Trajet (en km)</th>
              <th>Durée moyenne / Trajet (en HH:MM)</th>
              <th>Départ tardif (>7H30)</th>
              <th>Dernier arrêt tardif (>18H)</th>
              <th>Dernier trajet long (>45mn)</th>
              <th>Amplitude</th>
              <th>Temps d'attente</th>
            </tr>
          </ng-template>
          <ng-template #body let-dailyStat>
            <tr>
              <td>{{ dailyStat.tripDate }}</td>
              <td>{{ dailyStat.driverName }}</td>
              <td>{{ dailyStat.tripCount }}</td>
              <td>{{ dailyStat.distanceSum }}</td>
              <td>{{ dailyStat.drivingTime }}</td>
              <td>{{ dailyStat.distancePerTripAvg }}</td>
              <td>{{ dailyStat.durationPerTripAvg }}</td>
              <td [ngStyle]="{'background-color': dailyStat.hasLateStartSum ? '#e5e7eb' : 'transparent'}">
                {{ dailyStat.hasLateStartSum ? 'Oui' : 'Non' }}
              </td>
              <td [ngStyle]="{'background-color': dailyStat.hasLateStop ? '#e5e7eb' : 'transparent'}">
                {{ dailyStat.hasLateStop ? 'Oui' : 'Non' }}
              </td>
              <td [ngStyle]="{'background-color': dailyStat.hasLastTripLong ? '#e5e7eb' : 'transparent'}">
                {{ dailyStat.hasLastTripLong ? 'Oui' : 'Non' }}
              </td>
              <td>{{ dailyStat.rangeAvg }}</td>
              <td>{{ dailyStat.waitingDuration }}</td>
            </tr>
          </ng-template>
        </p-table>
      </div>
    </p-dialog>
  `,
  standalone: true,
  imports: [
    TreeTableModule,
    NgIf,
    NgClass,
    Button,
    Dialog,
    NgForOf,
    NgStyle,
    DateRangePickerComponent,
    IndicatorButtonsComponent,
    TableModule
  ],
  styles: [`
    /* Make dialog content flexible */
    ::ng-deep .p-dialog {
      max-width: 95%;
      width: auto !important;
      height: auto !important;
      max-height: 90vh;
    }
    ::ng-deep .p-dialog .p-dialog-header {
      border-top-left-radius: 20px !important;
      border-top-right-radius: 20px !important;
    }

    /* Ensure modal adjusts based on content */
    ::ng-deep .p-dialog-content {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      border-bottom-left-radius: 20px !important;
      border-bottom-right-radius: 20px !important;
    }

    /* Table container with scrolling */
    .table-container {
      max-height: 60vh;
      overflow-y: auto;
    }
  `]
})

export class ReportComponent implements OnInit {

  dateFrom: Date = new Date();
  dateTo: Date = new Date();
  vehiclesType:string='';
  protected now = new Date();
  vehiclesStatsTree: TreeNode[] = [];
  vehicleStats: any[] = [];
  vehicleDailyStats:  VehicleStatsDTO[] ;
  filteredVehiclesStats: TeamHierarchyNodeStats[] = [];
  vehiclesStatsTotal: Record<string, any>;
  private filtersSubscription?: Subscription;
  displayDailyStats: boolean = false;
  selectedDailyStat: string = '';

  constructor(private filterService: FilterService , private vehicleService: VehicleService) {}
  @Input()
  vehicleId: string = '';
  @Input()
  date: string = '';
  @ViewChild('calendar')
  calendar!: Calendar;
  filters: { agencies: string[], vehicles: string[], drivers: string[] } = {
    agencies: [],
    vehicles: [],
    drivers: []
  };

  keyToPropertyMap: Record<string, keyof VehicleStatsDTO> = {
    totalHasLastTripLong: "hasLastTripLong",
    totalHasLateStartSum: "hasLateStartSum",
    totalHasLateStop: "hasLateStop",
  };


  keyLabels: Record<string, string> = {
    averageDistance: "DISTANCE MOYENNE/TRAJET (en km)",
    averageDuration: "TEMPS DE CONDUITE DECLARE TOTAL",
    averageRangeAvg: "AMPLITUDE MOYENNE",
    totalDistanceSum: "DISTANCE PARCOURUE (en km)",
    totalDrivers: "NOMBRE TOTAL DE CONDUCTEURS",
    totalDrivingTime: "TEMPS DE CONDUITE TOTAL",
    totalHasLastTripLong: "DERNIER TRAJET>45mn  (en nb)",
    totalHasLateStartSum: "DEPART TARDIF  (en nb)",
    totalHasLateStop: "ARRETS TARDIFS",
    totalTripCount: "TRAJETS EFFECTUES (en nb)",
    totalVehicles: "NOMBRE TOTAL DE VEHICULES",
    totalWaitingTime: "TEMPS D\'ARRET TOTAL (en hh:mm)",
  };


  get calendarDate(): string {
    return this.date;
  }

  set calendarDate(date: Date) {
    date.setHours(3);
  }

  //Récupérer des statistiques pour une période spécifique
  fetchVehicleStats(): void {
    if (this.dateFrom && this.dateTo) {

      const startDate = this.dateFrom.getFullYear() + '-' +
        String(this.dateFrom.getMonth() + 1).padStart(2, '0') + '-' +
        String(this.dateFrom.getDate()).padStart(2, '0');

      const endDate = this.dateTo.getFullYear() + '-' +
        String(this.dateTo.getMonth() + 1).padStart(2, '0') + '-' +
        String(this.dateTo.getDate()).padStart(2, '0');


      this.vehicleService.getVehiclesStats(startDate, endDate ,this.filters.agencies, this.filters.vehicles, this.filters.drivers , this.vehiclesType).subscribe({
        next: (data) => {
          const { teamHierarchyNodes, stats } = data;

          //cette variable contient les résultats originaux du tableau
          this.vehicleStats = teamHierarchyNodes;

          //Cette variable contient les résultats originaux des boutons statistiques
          this.vehiclesStatsTotal=stats;

          //transformer les résultats originaux de la table.ts en TreeNode
          this.vehiclesStatsTree=VehicleService.transformToTreeNodes(
            this.vehicleStats,
            (vehicle: dto.VehiclesStatsDTO) => ({
              driverName: vehicle.vehicleStats.driverName ||'',
              licensePlate: vehicle.vehicleStats.licensePlate || 'unknown',
            })

          )
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des statistiques du véhicule:', err);
        }
      });
    } else {
      alert('Veuillez sélectionner les dates De et À.');
    }
  }

  //Récupérer des statistiques pour une période spécifique
  fetchVehicleDailyStats(vehicleId:string, licenseplat:string): void {
    if (this.dateFrom && this.dateTo) {
        if (!vehicleId) {
          console.error("Error: vehicleId is undefined or empty!");
          return;
        }

      const startDate = this.dateFrom.getFullYear() + '-' +
        String(this.dateFrom.getMonth() + 1).padStart(2, '0') + '-' +
        String(this.dateFrom.getDate()).padStart(2, '0');

      const endDate = this.dateTo.getFullYear() + '-' +
        String(this.dateTo.getMonth() + 1).padStart(2, '0') + '-' +
        String(this.dateTo.getDate()).padStart(2, '0');


      this.vehicleService.getVehicleDailyStats(startDate, endDate ,vehicleId ,this.vehiclesType).subscribe({
        next: (data) => {
          this.vehicleDailyStats = data;
          this.displayDailyStats = true;
          this.selectedDailyStat=licenseplat;

        },
        error: (err) => {
          console.error('Erreur lors de la récupération des statistiques du véhicule:', err);
        }
      });
    } else {
      alert('Veuillez sélectionner les dates De et À.');
    }
  }

  //fonction permettant de filtrer les résultats en fonction des boutons cliqués
  filterByKey(key: string): void {
    const property = this.keyToPropertyMap[key]; // Obtenir le nom de la propriété pour filtrer par

    if (property) {
      this.filteredVehiclesStats = this.vehicleStats.map((node: TeamHierarchyNodeStats) => ({
        ...node,
        vehicles: node.vehicles?.filter((vehicle: VehiclesStatsDTO) => {
          const value = vehicle.vehicleStats?.[property as keyof VehicleStatsDTO];
          return typeof value === 'number' && value > 0;
        }) || [],
        children: node.children?.map((childNode: TeamHierarchyNodeStats) => ({
          ...childNode,
          vehicles: childNode.vehicles?.filter((vehicle: VehiclesStatsDTO) => {
            const value = vehicle.vehicleStats?.[property as keyof VehicleStatsDTO];
            return typeof value === 'number' && value > 0;
          }) || [],
        }))
          .filter((childNode) => childNode.vehicles.length > 0) || [], // Supprimer les nœuds enfants sans véhicules
      }))
        .filter((node) => node.children.length > 0 || node.vehicles.length > 0); // Supprimer les nœuds parents s'ils n'ont pas d'enfants ou de véhicules
    }

    this.vehiclesStatsTree=VehicleService.transformToTreeNodes(
      this.filteredVehiclesStats,
      (vehicle: dto.VehiclesStatsDTO) => ({
        driverName: vehicle.vehicleStats.driverName ||'',
        licensePlate: vehicle.vehicleStats.licensePlate || 'unknown',
      })
    )
  }

  ngOnInit() {
    this.filtersSubscription = this.subscribeToFilterChanges();
  }
  ngOnDestroy(): void {
    this.filtersSubscription?.unsubscribe()
  }
  closeDialog() {
    this.displayDailyStats = false;
  }

  onFetchVehicleStats(event: { dateFrom: Date; dateTo: Date ; vehiclesType:string }) {
    this.dateFrom=event.dateFrom;
    this.dateTo=event.dateTo;
    this.vehiclesType=event.vehiclesType;
    this.fetchVehicleStats();
  }

  private subscribeToFilterChanges(): Subscription {
    return this.filterService.filters$.subscribe(filters => {
      this.filters = filters as { agencies: string[], vehicles: string[], drivers: string[] };
      this.fetchVehicleStats();
    })
  };
}

