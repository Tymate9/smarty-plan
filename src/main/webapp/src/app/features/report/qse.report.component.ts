import {Component, OnDestroy, OnInit} from '@angular/core';
import {FilterService} from "../../commons/navbar/filter.service";
import {
  qseIndicatorAlertMap,
  qseIndicatorWarningMap,
  TeamHierarchyNodeStatsQSE,
  VehicleService
} from "../vehicle/vehicle.service";
import {Subscription} from "rxjs";
import {dto} from "../../../habarta/dto";
import {TreeNode} from "primeng/api";
import {DateRangePickerComponent} from "../dateRange/dateRange.component";
import {TreeTableModule} from "primeng/treetable";
import {AsyncPipe, NgClass, NgIf} from "@angular/common";
import {ToggleButtonsGroupComponent} from "../../commons/toggle-button-group/toggle-button-group.component";
import {Stat} from "./report.component";
import {Divider} from "primeng/divider";
import VehicleStatsQseDTO = dto.VehicleStatsQseDTO;
import VehiclesStatsQseDTO = dto.VehiclesStatsQseDTO;
import {LoadingService} from "../../services/loading.service";
import {ProgressSpinner} from "primeng/progressspinner";


const QSE_STATS_DETAILS: Record<string, {displayName: string, color: string, selectable: boolean}> = {
  totalDrivingTime: {displayName: "TEMPS DE CONDUITE TOTAL", color: "#fda9a9", selectable: false},
  totalWaitingTime: {displayName: "TEMPS D'ARRET TOTAL", color: "#fda9a9", selectable: false},
  totalDistanceSum: {displayName: "DISTANCE PARCOURUE", color: "#fda9a9", selectable: false},
  averageRangeAvg: {displayName: "AMPLITUDE MOYENNE", color: "#fda9a9", selectable: false},
  idleDurationTotal: {displayName: "TEMPS DE MOTEUR TOURNANT ESTIME TOTAL", color: "#fda9a9", selectable: false},
  useSeverity: {displayName: "SÉVÉRITÉ D'USAGE TOTAL DE LA FLOTTE", color: "#fda9a9", selectable: false},
  turnUseSeverity: {displayName: "SÉVÉRITÉ D'USAGE DE LA FLOTTE EN VIRAGE", color: "#fda9a9", selectable: false},
  accelerationUseSeverity: {displayName: "SÉVÉRITÉ D'USAGE DE LA FLOTTE EN ACCÉLÉRATION", color: "#fda9a9", selectable: false},
  riskExposure: {displayName: "EXPOSITION AUX RISQUES TOTALE", color: "#fda9a9", selectable: false},
  turnRiskExposure: {displayName: "EXPOSITION AUX RISQUES EN VIRAGE", color: "#fda9a9", selectable: false},
  accelerationRiskExposure: {displayName: "EXPOSITION AUX RISQUES EN ACCÉLÉRATION", color: "#fda9a9", selectable: false},
  longestTrip: {displayName: "LE TRAJET LE PLUS LONG", color: "#a0b2d9", selectable: true}
};

const QSE_ALERTS_NAMINGS = {
  highwayAccelScore: 'ACCÉLÉRATION SÉVÈRE SUR AUTOROUTE',
  roadAccelScore: 'ACCÉLÉRATION SÉVÈRE SUR ROUTE',
  cityAccelScore: 'ACCÉLÉRATION SÉVÈRE EN VILLE',
  highwayTurnScore: 'VIRAGE SÉVÈRE SUR AUTOROUTE',
  roadTurnScore: 'VIRAGE SÉVÈRE SUR ROUTE',
  cityTurnScore: 'VIRAGE SÉVÈRE EN VILLE',
  highwaySpeedScore: 'ALLURE ÉLEVÉE SUR AUTOROUTE',
  roadSpeedScore: 'ALLURE ÉLEVÉE SUR ROUTE',
  citySpeedScore: 'ALLURE ÉLEVÉE EN VILLE'
}


@Component({
  selector: 'app-qse-report',
  template: `
    <!-- Spinner local au composant -->
    <p-progressSpinner *ngIf="(loadingService.loading$ | async)"></p-progressSpinner>

    <app-date-range (fetchStats)="onFetchVehicleStats($event)"></app-date-range>
    <!--    <app-indicator-buttons-->
    <!--      [statsMap]="vehiclesStatsTotal"-->
    <!--      [keyLabels]="keyLabels"-->
    <!--      [buttonColor]="'var(&#45;&#45;p-red-100)'"-->
    <!--      [sliceRange]="[0, 4]"-->
    <!--      [keyToPropertyMap]="keyToPropertyMap"-->
    <!--      (filterClicked)="filterByKey($event)">-->
    <!--    </app-indicator-buttons>-->

    <!--    <app-indicator-buttons-->
    <!--      [statsMap]="vehiclesStatsTotal"-->
    <!--      [keyLabels]="keyLabels"-->
    <!--      [buttonColor]="'var(&#45;&#45;p-gray-300)'"-->
    <!--      [sliceRange]="[4, 9]"-->
    <!--      [keyToPropertyMap]="keyToPropertyMap"-->
    <!--      (filterClicked)="filterByKey($event)">-->
    <!--    </app-indicator-buttons>-->
    <div class="indicators">
      <app-toggle-buttons-group
        [items]="stats"
        [identifierFn]="identifierFn"
        [displayFn]="displayFn"
        [colorFn]="colorFn"
        buttonWidth="18vw"
        [clickable]="false"
        fontSize="1rem"
        textColor="black">
      </app-toggle-buttons-group>
      <app-toggle-buttons-group
        [items]="selectableStats"
        [selectedItem]="selectedStat"
        [identifierFn]="identifierFn"
        [displayFn]="displayFn"
        [colorFn]="colorFn"
        (selectionChange)="filterBySelectedStat($event)"
        buttonWidth="18vw"
        [clickable]="true"
        fontSize="1rem"
        textColor="black">
      </app-toggle-buttons-group>

      <p-divider/>

      <h2>Alertes</h2>
      <app-toggle-buttons-group
        [items]="alerts"
        [selectedItem]="selectedStat"
        [identifierFn]="identifierFn"
        [displayFn]="displayFn"
        [colorFn]="colorFn"
        (selectionChange)="filterBySelectedStat($event)"
        buttonWidth="18vw"
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

      <ng-template pTemplate="body" let-rowNode let-rowData="rowData">
        <tr [ttRow]="rowNode"
            [ngClass]="{
          'dynamic-tt-parent-node': !rowNode.parent,
          'no-vehicle': rowNode.parent && rowData.children && rowData.children.length > 0,
          'dynamic-tt-leaf': rowData.vehicle
        }">
          <td *ngIf="!rowData.vehicle" colspan="17">
            <p-treeTableToggler class="dynamic-tt-togglerButton" [rowNode]="rowNode"/>
            {{ rowData.label }}
          </td>
        </tr>
        <tr [ttRow]="rowNode"
            *ngIf="!rowNode.parent"
            class="dynamic-tt-header">
          <td rowspan="2">Véhicule</td>
          <td rowspan="2">Conducteur</td>
          <td rowspan="2">Durée de conduite totale</td>
          <td rowspan="2">Amplitude moyenne</td>
          <td rowspan="2">Temps de moteur tournant estimé total</td>

          <!-- Grouped Columns -->
          <td colspan="3">Distance parcourue</td>
          <td colspan="3">Accélération et freinage</td>
          <td colspan="3">Virage</td>
          <td colspan="3">Allure</td>
        </tr>
        <!-- Sub-header row for AR, R, V -->
        <tr [ttRow]="rowNode" *ngIf="!rowNode.parent" class="dynamic-tt-header">
          <td>AR</td>
          <td>R</td>
          <td>V</td>
          <td>AR</td>
          <td>R</td>
          <td>V</td>
          <td>AR</td>
          <td>R</td>
          <td>V</td>
          <td>AR</td>
          <td>R</td>
          <td>V</td>
        </tr>


        <tr [ttRow]="rowNode"
            [ngClass]="{
          'dynamic-tt-parent-node': !rowNode.parent,
          'no-vehicle': rowNode.parent && rowData.children && rowData.children.length > 0,
          'dynamic-tt-leaf': rowData.vehicle
        }"
            *ngIf="rowData.vehicle">
          <td>{{ rowData.vehicle.vehicleStatsQse.licensePlate || 'Véhicule' }}</td>
          <td *ngIf="rowData.vehicle.vehicleStatsQse.driverName; else noDriver">
            {{ rowData.vehicle.vehicleStatsQse.driverName || 'Véhicule non attribué' }}
          </td>
          <ng-template #noDriver>
            <td>Véhicule non attribué</td>
          </ng-template>
          <td>{{ rowData.vehicle.vehicleStatsQse.drivingTime }}</td>
          <td>{{ rowData.vehicle.vehicleStatsQse.rangeAvg }}</td>
          <td>{{ rowData.vehicle.vehicleStatsQse.idleDuration }}</td>
          <td class="centered-and-nowrapped">{{ rowData.vehicle.vehicleStatsQse.highwayDistanceSum }}</td>
          <td class="centered-and-nowrapped">{{ rowData.vehicle.vehicleStatsQse.roadDistanceSum }}</td>
          <td class="centered-and-nowrapped">{{ rowData.vehicle.vehicleStatsQse.cityDistanceSum }}</td>
          <td class="centered-and-nowrapped"
            [style]="getAlertIndicatorStyle('highwayAccelScore', rowData.vehicle.vehicleStatsQse.highwayAccelScore)"
          >{{ rowData.vehicle.vehicleStatsQse.highwayAccelScore }}
          </td>
          <td class="centered-and-nowrapped"
            [style]="getAlertIndicatorStyle('roadAccelScore', rowData.vehicle.vehicleStatsQse.roadAccelScore)"
          >{{ rowData.vehicle.vehicleStatsQse.roadAccelScore }}
          </td>
          <td class="centered-and-nowrapped"
            [style]="getAlertIndicatorStyle('cityAccelScore', rowData.vehicle.vehicleStatsQse.cityAccelScore)"
          >{{ rowData.vehicle.vehicleStatsQse.cityAccelScore }}
          </td>
          <td class="centered-and-nowrapped"
            [style]="getAlertIndicatorStyle('highwayTurnScore', rowData.vehicle.vehicleStatsQse.highwayTurnScore)"
          >{{ rowData.vehicle.vehicleStatsQse.highwayTurnScore }}
          </td>
          <td class="centered-and-nowrapped"
            [style]="getAlertIndicatorStyle('roadTurnScore', rowData.vehicle.vehicleStatsQse.roadTurnScore)"
          >{{ rowData.vehicle.vehicleStatsQse.roadTurnScore }}
          </td>
          <td class="centered-and-nowrapped"
            [style]="getAlertIndicatorStyle('cityTurnScore', rowData.vehicle.vehicleStatsQse.cityTurnScore)"
          >{{ rowData.vehicle.vehicleStatsQse.cityTurnScore }}
          </td>
          <td class="centered-and-nowrapped"
            [style]="getAlertIndicatorStyle('highwaySpeedScore', rowData.vehicle.vehicleStatsQse.highwaySpeedScore)"
          >{{ rowData.vehicle.vehicleStatsQse.highwaySpeedScore }}
          </td>
          <td class="centered-and-nowrapped"
            [style]="getAlertIndicatorStyle('roadSpeedScore', rowData.vehicle.vehicleStatsQse.roadSpeedScore)"
          >{{ rowData.vehicle.vehicleStatsQse.roadSpeedScore }}
          </td>
          <td class="centered-and-nowrapped"
            [style]="getAlertIndicatorStyle('citySpeedScore', rowData.vehicle.vehicleStatsQse.citySpeedScore)"
          >{{ rowData.vehicle.vehicleStatsQse.citySpeedScore }}
          </td>

        </tr>

      </ng-template>
    </p-treeTable>

  `,
  standalone: true,
  imports: [
    DateRangePickerComponent,
    TreeTableModule,
    NgClass,
    NgIf,
    ToggleButtonsGroupComponent,
    Divider,
    AsyncPipe,
    ProgressSpinner
  ],
  styles: [`
    p-progressSpinner {
      position: fixed;
      width: 100%;
      height: 100vh;
      margin-top: -75px;
      background-color: #0001;
      z-index: 1000;
      display: flex;
      align-items: center;
    }

    .indicators {
      width: 96vw;
      margin: 0 auto;
    }

    .centered-and-nowrapped {
      text-align: center;
      text-wrap: nowrap;
    }
  `],
  providers: [LoadingService]
})
export class QseReportComponent implements OnInit, OnDestroy {

  constructor(
    private filterService: FilterService,
    private vehicleService: VehicleService,
    protected loadingService: LoadingService
  ) {}

  private filtersSubscription?: Subscription;
  filters: { agencies: string[], vehicles: string[], drivers: string[] } = {
    agencies: [],
    vehicles: [],
    drivers: []
  };
  dateFrom: Date = new Date();
  dateTo: Date = new Date();
  vehiclesType: string = '';
  vehicleStatsQse: any [] = [];
  vehiclesStatsTree: TreeNode[] = [];
  vehiclesStatsTotal: Record<string, any>;

  stats: Stat[] = [];

  selectableStats: Stat[] = [];
  alerts: Stat[] = [];
  selectedStat: Stat | null = null;

  identifierFn = (item: Stat) => item.key;
  displayFn = (item: Stat) => `${item.displayName}`;
  colorFn = (item: Stat) => item.color;

  ngOnInit() {
    this.filtersSubscription = this.subscribeToFilterChanges();
  }

  ngOnDestroy(): void {
    this.filtersSubscription?.unsubscribe()
  }

  onFetchVehicleStats(event: { dateFrom: Date; dateTo: Date; vehiclesType: string }) {
    this.dateFrom = event.dateFrom;
    this.dateTo = event.dateTo;
    this.vehiclesType = event.vehiclesType;
    this.fetchVehicleStatsQse();
  }

  fetchVehicleStatsQse(): void {
    if (this.dateFrom && this.dateTo) {
      this.loadingService.setLoading(true);

      const startDate = this.dateFrom.getFullYear() + '-' +
        String(this.dateFrom.getMonth() + 1).padStart(2, '0') + '-' +
        String(this.dateFrom.getDate()).padStart(2, '0');

      const endDate = this.dateTo.getFullYear() + '-' +
        String(this.dateTo.getMonth() + 1).padStart(2, '0') + '-' +
        String(this.dateTo.getDate()).padStart(2, '0');


      this.vehicleService.getVehiclesStatsQse(startDate, endDate, this.filters.agencies, this.filters.vehicles, this.filters.drivers, this.vehiclesType).subscribe({
        next: (data) => {
          const {teamHierarchyNodes, stats} = data;

          this.vehicleStatsQse = teamHierarchyNodes;
          this.vehiclesStatsTotal = stats;

          this.stats = Object.entries(this.vehiclesStatsTotal)
            .filter(([key]) => {
              return QSE_STATS_DETAILS[key] && !QSE_STATS_DETAILS[key].selectable;
            }) // only include keys defined in STATS_DETAILS and that aren't selectable
            .map(([key, value]) => ({
              key: key,
              count: value,
              displayName: QSE_STATS_DETAILS[key].displayName,
              color: QSE_STATS_DETAILS[key].color
            }));
          // todo : generalize selectable stats
          this.selectableStats = [{
            key: 'longestTrip',
            count: this.vehiclesStatsTotal['longestTrip'],
            displayName: QSE_STATS_DETAILS['longestTrip'].displayName,
            color: QSE_STATS_DETAILS['longestTrip'].color
          }]
          this.alerts = this.getQseAlerts(teamHierarchyNodes);

          //transformer les résultats originaux de la table.ts en TreeNode
          this.vehiclesStatsTree = VehicleService.transformToTreeNodes(
            this.vehicleStatsQse,
            (vehicle: dto.VehiclesStatsQseDTO) => ({
              driverName: vehicle.vehicleStatsQse.driverName || '',
              licensePlate: vehicle.vehicleStatsQse.licensePlate || 'unknown',
            })
          )

          this.loadingService.setLoading(false);
        },
        error: (err) => {
          console.error('Erreur lors de la récupération des statistiques du véhicule:', err);
          this.loadingService.setLoading(false);
        }
      });
    } else {
      alert('Veuillez sélectionner les dates De et À.');
    }
  }

  private subscribeToFilterChanges(): Subscription {
    return this.filterService.filters$.subscribe(filters => {
      this.filters = filters as { agencies: string[], vehicles: string[], drivers: string[] };
      this.fetchVehicleStatsQse();
    })
  };

  filterBySelectedStat(selected: Stat | null): void {
    this.selectedStat = selected;

    this.vehiclesStatsTree = VehicleService.transformToTreeNodes(
      selected === null ?
        this.vehicleStatsQse :
        this.vehicleService.filterVehiclesHierarchyByQseStat(
          this.vehicleStatsQse,
          selected.key,
          this.vehiclesStatsTotal
        ),
      (vehicle: VehiclesStatsQseDTO) => ({
        driverName: vehicle.vehicleStatsQse.driverName || '',
        licensePlate: vehicle.vehicleStatsQse.licensePlate || 'unknown',
      })
    );
  }

  getQseAlerts(vehicleStatsQse: TeamHierarchyNodeStatsQSE[]): Stat[] {
    return Object.entries(QSE_ALERTS_NAMINGS).map(([key, displayName]) => {
      const filteredStats = this.vehicleService.filterVehiclesHierarchyByQseStat(vehicleStatsQse, key, this.vehiclesStatsTotal);
      const count = filteredStats.reduce((acc, node) => {
        const nodeCount = node.vehicles.length + (node.children ? node.children.reduce((childAcc, childNode) => childAcc + childNode.vehicles.length, 0) : 0);
        return acc + nodeCount;
      }, 0);

      return {
        key,
        count,
        displayName,
        color: count > 0 ? '#C71400' : '#21A179',
      };
    });
  }

  getAlertIndicatorStyle(
    alertIndicatorKey: keyof typeof QSE_ALERTS_NAMINGS,
    alertIndicatorValue: string | null
  ): { [key: string]: string } {
    if (alertIndicatorValue === null) {
      return {};
    }

    if (qseIndicatorAlertMap[alertIndicatorKey](alertIndicatorValue)) {
      return {backgroundColor: 'var(--p-red-300)'};
    } else if (qseIndicatorWarningMap[alertIndicatorKey](alertIndicatorValue)) {
      return {backgroundColor: 'var(--p-orange-300)'};
    } else {
      return {};
    }
  }

  protected readonly indicatorAlertMap = qseIndicatorAlertMap;
}
