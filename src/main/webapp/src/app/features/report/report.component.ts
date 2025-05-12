import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {FilterService} from "../../commons/navbar/filter.service";
import {TeamHierarchyNodeBase, TeamHierarchyNodeStats, VehicleService} from "../vehicle/vehicle.service";
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
import {ToggleButtonsGroupComponent} from "../../commons/toggle-button-group/toggle-button-group.component";


const STATS_DETAILS: Record<string, { displayName: string, color: string }> = {
  totalHasLastTripLong: { displayName: 'DERNIER TRAJET>45mn', color: '#a0b2d9'},
  totalHasLateStartSum: { displayName: 'DEPART TARDIF', color: '#a0b2d9'},
  totalHasLateStop: { displayName: 'ARRETS TARDIFS', color: '#a0b2d9'},
  averageDistance: { displayName: 'DISTANCE MOYENNE/TRAJET', color: '#fda9a9' },
  averageDuration: { displayName: 'TEMPS DE CONDUITE DECLARE TOTAL', color: '#fda9a9' },
  averageRangeAvg: { displayName: 'AMPLITUDE MOYENNE', color: '#fda9a9' },
  totalDistanceSum: { displayName: 'DISTANCE PARCOURUE', color: '#fda9a9' },
  totalDrivers: { displayName: 'NOMBRE TOTAL DE CONDUCTEURS', color: '#fda9a9'},
  totalDrivingTime: { displayName: 'TEMPS DE CONDUITE TOTAL', color: '#fda9a9'},
  totalTripCount: { displayName: 'NOMBRE DE TRAJETS EFFECTUES', color: '#fda9a9'},
  totalVehicles: { displayName: 'NOMBRE TOTAL DE VEHICULES', color: '#fda9a9'},
  totalWaitingTime: { displayName: 'TEMPS D\'ARRET TOTAL', color: '#fda9a9'},
};

export interface Stat {
  key: string;
  count: number;
  displayName: string;
  color: string;
}

@Component({
  selector: 'app-report',
  template: `

    <app-date-range (fetchStats)="onFetchVehicleStats($event)"></app-date-range>

<!--    <app-indicator-buttons-->
<!--      [statsMap]="vehiclesStatsTotal"-->
<!--      [keyLabels]="keyLabels"-->
<!--      [buttonColor]="'var(&#45;&#45;p-red-100)'"-->
<!--      [sliceRange]="[0, 6]"-->
<!--      [keyToPropertyMap]="keyToPropertyMap"-->
<!--      (filterClicked)="filterByKey($event)">-->
<!--    </app-indicator-buttons>-->

<!--    <app-indicator-buttons-->
<!--      [statsMap]="vehiclesStatsTotal"-->
<!--      [keyLabels]="keyLabels"-->
<!--      [buttonColor]="'var(&#45;&#45;p-gray-300)'"-->
<!--      [sliceRange]="[6, 12]"-->
<!--      [keyToPropertyMap]="keyToPropertyMap"-->
<!--      (filterClicked)="filterByKey($event)">-->
<!--    </app-indicator-buttons>-->
    <div class="indicators">
      <app-toggle-buttons-group
        [items]="statsCounts.slice(0, 9)"
        [selectedItem]="selectedStats"
        [identifierFn]="identifierFn"
        [displayFn]="displayFn"
        [colorFn]="colorFn"
        (selectionChange)="filterByKey($event)"
        buttonWidth="18.5vw"
        [clickable]="false"
        fontSize="1rem"
        textColor="black">
      </app-toggle-buttons-group>
      <app-toggle-buttons-group
        [items]="statsCounts.slice(9)"
        [selectedItem]="selectedStats"
        [identifierFn]="identifierFn"
        [displayFn]="displayFn"
        [colorFn]="colorFn"
        (selectionChange)="filterByKey($event)"
        buttonWidth="18.5vw"
        [clickable]="true"
        fontSize="1rem"
        textColor="black">
      </app-toggle-buttons-group>
    </div>

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
          <td>Nb de trajets effectués</td>
          <td>Distance parcourue</td>
          <td>Temps de conduite</td>
          <td>Distance moyenne / trajet</td>
          <td>Durée moyenne / trajet</td>
          <td>Départ tardif (>7H30)</td>
          <td>Dernier arrêt tardif (>18H)</td>
          <td>Dernier trajet long (>45mn)</td>
          <td>Amplitude moyenne journalière</td>
          <td>Durée arrêt total</td>
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
              [modal]="true"
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
              <th>Nb de trajets effectués</th>
              <th>Distance parcourue</th>
              <th>Temps de conduite</th>
              <th>Distance moyenne / trajet</th>
              <th>Durée moyenne / trajet</th>
              <th>Départ tardif (>7H30)</th>
              <th>Dernier arrêt tardif (>18H)</th>
              <th>Dernier trajet long (>45mn)</th>
              <th>Amplitude</th>
              <th>Temps d'arrêt total</th>
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
              <td [ngStyle]="{'background-color': dailyStat.hasLateStartSum ? '#fca5a5' : 'transparent'}">
                {{ dailyStat.hasLateStartSum ? 'Oui' : 'Non' }}
              </td>
              <td [ngStyle]="{'background-color': dailyStat.hasLateStop ? '#fca5a5' : 'transparent'}">
                {{ dailyStat.hasLateStop ? 'Oui' : 'Non' }}
              </td>
              <td [ngStyle]="{'background-color': dailyStat.hasLastTripLong ? '#fca5a5' : 'transparent'}">
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
    NgStyle,
    DateRangePickerComponent,
    TableModule,
    ToggleButtonsGroupComponent
  ],
  styles: [`
    .indicators {
      width: 96vw;
      margin: 0 auto;
    }

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

  statsCounts: Stat[] = [];
  selectedStats: Stat | null = null;


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




  get calendarDate(): string {
    return this.date;
  }

  set calendarDate(date: Date) {
    date.setHours(3);
  }

  identifierFn = (item: Stat) => item.key;
  displayFn    = (item: Stat) => `${item.displayName}`;
  colorFn      = (item: Stat) => item.color;


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
          this.vehiclesStatsTotal = stats;


          this.statsCounts = Object.entries(this.vehiclesStatsTotal)
          .filter(([key]) => STATS_DETAILS[key]) // only include keys defined in STATS_DETAILS
          .map(([key, value]) => ({
            key: key,
            count: value,
            displayName: STATS_DETAILS[key].displayName,
            color: STATS_DETAILS[key].color
          }));

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
  filterByKey(selected: Stat): void {
     const property = this.keyToPropertyMap[selected.key]; // Obtenir le nom de la propriété pour filtrer par

    // const property=selected.state

    console.log(selected);

    this.selectedStats = selected;
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

