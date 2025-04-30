import {Component, OnInit} from '@angular/core';
import {FilterService} from "../../commons/navbar/filter.service";
import {
  qseIndicatorAlertMap, qseIndicatorWarningMap,
  QseAlertCount,
  QseIndicatorCheckers,
  TeamHierarchyNodeStats,
  TeamHierarchyNodeStatsQSE,
  VehicleService
} from "../vehicle/vehicle.service";
import {Subscription} from "rxjs";
import {dto} from "../../../habarta/dto";
import VehicleStatsDTO = dto.VehicleStatsDTO;
import {TreeNode} from "primeng/api";
import {DateRangePickerComponent} from "../dateRange/dateRange.component";
import {IndicatorButtonsComponent} from "../indicator/indicator-buttons.component";
import {TreeTableModule} from "primeng/treetable";
import {KeyValuePipe, NgClass, NgIf} from "@angular/common";
import VehicleStatsQseDTO = dto.VehicleStatsQseDTO;
import VehiclesStatsQseDTO = dto.VehiclesStatsQseDTO;
import {ToggleButtonsGroupComponent} from "../../commons/toggle-button-group/toggle-button-group.component";
import {StatsCount} from "./report.component";
import {Divider} from "primeng/divider";


const STATS_QSE_DETAILS: Record<string, { displayName: string, color: string }> = {
  totalDrivingTime: {displayName: "TEMPS DE CONDUITE TOTAL", color: "#fee2e2"},
  totalWaitingTime: {displayName: "TEMPS D'ARRET TOTAL (en hh:mm)", color: "#fee2e2"},
  totalDistanceSum: {displayName: "DISTANCE PARCOURUE (en km)", color: "#fee2e2"},
  selectionScore: {displayName: "SCORE DE LA SELECTION", color: "#fee2e2"},
  severityOfUseTurn: {displayName: "SEVERITE D'USAGE VIRAGE", color: "#fee2e2"},
  severityOfAcceleration: {displayName: "SEVERITE D'USAGE ACCELERATION-FREINAGE", color: "#fee2e2"},
  averageRangeAvg: {displayName: "AMPLITUDE MOYENNE", color: "#fee2e2"},
  idleDurationTotal: {displayName: "TEMPS DE MOTEUR TOURNANT ESTIME TOTAL(en hh:mm)", color: "#fee2e2"},
  longestTrip: {displayName: "LE TRAJET LE PLUS LONG", color: "#d1d5db"}
};


@Component({
  selector: 'app-qse-report',
  template: `
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
        [items]="statsCounts.slice(0,4)"
        [selectedItem]="selectedStats"
        [identifierFn]="identifierFn"
        [displayFn]="displayFn"
        [colorFn]="colorFn"
        (selectionChange)="filterByKey($event)"
        buttonWidth="18vw"
        [clickable]="false"
        fontSize="0.7rem"
        textColor="black">
      </app-toggle-buttons-group>
      <app-toggle-buttons-group
        [items]="statsCounts.slice(4,9)"
        [selectedItem]="selectedStats"
        [identifierFn]="identifierFn"
        [displayFn]="displayFn"
        [colorFn]="colorFn"
        (selectionChange)="filterByKey($event)"
        buttonWidth="18vw"
        [clickable]="true"
        fontSize="0.7rem"
        textColor="black">
      </app-toggle-buttons-group>

      <p-divider/>

      <h2>Alertes</h2>
      <app-toggle-buttons-group
      [items]="alerts"
      [selectedItem]="selectedAlert"
      [identifierFn]="alertIdentifierFn"
      [displayFn]="alertDisplayFn"
      [colorFn]="alertColorFn"
      (selectionChange)="filterByAlert($event)"
      buttonWidth="18vw"
      [clickable]="true"
      fontSize="0.7rem"
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
          <td *ngIf="!rowData.vehicle" colspan="15">
            <p-treeTableToggler class="dynamic-tt-togglerButton" [rowNode]="rowNode"/>
            {{ rowData.label }}
          </td>
        </tr>
        <tr [ttRow]="rowNode"
            *ngIf="!rowNode.parent"
            class="dynamic-tt-header">
          <td rowspan="2">Véhicule</td>
          <td rowspan="2">Conducteur</td>
          <td rowspan="2">Distance parcourue</td>
          <td rowspan="2">Durée de conduite moyenne (en HH:MM)</td>
          <td rowspan="2">Amplitude moyenne (en HH:MM)</td>
          <td rowspan="2">Temps de moteur tournant estimé total (en HH:MM)</td>

          <!-- Grouped Columns -->
          <td colspan="3">Accélération et freinage (/20)</td>
          <td colspan="3">Virage (/20)</td>
          <td colspan="3">Allure (%)</td>
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
          <td>{{ rowData.vehicle.vehicleStatsQse.distanceSum }}</td>
          <td>{{ rowData.vehicle.vehicleStatsQse.durationPerTripAvg }}</td>
          <td>{{ rowData.vehicle.vehicleStatsQse.rangeAvg }}</td>
          <td>{{ rowData.vehicle.vehicleStatsQse.idleDuration }}</td>
          <td
            [style]="getIndicatorStyle('highwayAccelScore', rowData.vehicle.vehicleStatsQse.highwayAccelScore)"
          >{{ rowData.vehicle.vehicleStatsQse.highwayAccelScore ?? 'N/A' }}/20
          </td>
          <td
            [style]="getIndicatorStyle('roadAccelScore', rowData.vehicle.vehicleStatsQse.roadAccelScore)"
          >{{ rowData.vehicle.vehicleStatsQse.roadAccelScore ?? 'N/A' }}/20
          </td>
          <td
            [style]="getIndicatorStyle('cityAccelScore', rowData.vehicle.vehicleStatsQse.cityAccelScore)"
          >{{ rowData.vehicle.vehicleStatsQse.cityAccelScore ?? 'N/A' }}/20
          </td>
          <td
            [style]="getIndicatorStyle('highwayTurnScore', rowData.vehicle.vehicleStatsQse.highwayTurnScore)"
          >{{ rowData.vehicle.vehicleStatsQse.highwayTurnScore ?? 'N/A' }}/20
          </td>
          <td
            [style]="getIndicatorStyle('roadTurnScore', rowData.vehicle.vehicleStatsQse.roadTurnScore)"
          >{{ rowData.vehicle.vehicleStatsQse.roadTurnScore ?? 'N/A' }}/20
          </td>
          <td
            [style]="getIndicatorStyle('cityTurnScore', rowData.vehicle.vehicleStatsQse.cityTurnScore)"
          >{{ rowData.vehicle.vehicleStatsQse.cityTurnScore ?? 'N/A' }}/20
          </td>
          <td
            [style]="getIndicatorStyle('highwaySpeedScore', rowData.vehicle.vehicleStatsQse.highwaySpeedScore)"
          >{{ rowData.vehicle.vehicleStatsQse.highwaySpeedScore ?? 'N/A' }}%
          </td>
          <td
            [style]="getIndicatorStyle('roadSpeedScore', rowData.vehicle.vehicleStatsQse.roadSpeedScore)"
          >{{ rowData.vehicle.vehicleStatsQse.roadSpeedScore ?? 'N/A' }}%
          </td>
          <td
            [style]="getIndicatorStyle('citySpeedScore', rowData.vehicle.vehicleStatsQse.citySpeedScore)"
          >{{ rowData.vehicle.vehicleStatsQse.citySpeedScore ?? 'N/A' }}%
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
    Divider
  ],
  styles: [`
    .indicators {
      width: 96vw;
      margin: 0 auto;
    }
  `]
})
export class QseReportComponent implements OnInit {

  constructor(private filterService: FilterService, private vehicleService: VehicleService) {
  }

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

  statsCounts: StatsCount[] = [];
  selectedStats: StatsCount | null = null;

  alerts: QseAlertCount[] = [];
  selectedAlert: QseAlertCount | null = null;

  keyToPropertyMap: Record<string, keyof VehicleStatsQseDTO> = {
    // example# totalHasLastTripLong: "hasLastTripLong",
    longestTrip: "distanceMax"
  };

  // keyLabels: Record<string, string> = {
  //   totalDrivingTime: "TEMPS DE CONDUITE TOTAL",
  //   totalWaitingTime: "TEMPS D\'ARRET TOTAL (en hh:mm)",
  //   totalDistanceSum: "DISTANCE PARCOURUE (en km)",
  //   selectionScore: "SCORE DE LA SELECTION",
  //   severityOfUseTurn: "SEVERITE D'USAGE VIRAGE",
  //   severityOfAcceleration: "SEVERITE D'USAGE ACCELERATION-FREINAGE",
  //   averageRangeAvg: "AMPLITUDE MOYENNE",
  //   idleDurationTotal: "TEMPS DE MOTEUR TOURNANT ESTIME TOTAL(en hh:mm)",
  //   longestTrip: "LE TRAJET LE PLUS LONG"
  // };

  identifierFn = (item: StatsCount) => item.state;
  displayFn = (item: StatsCount) => `${item.displayName}`;
  colorFn = (item: StatsCount) => item.color;

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
          this.alerts = this.vehicleService.getQseAlerts(teamHierarchyNodes);

          this.statsCounts = Object.entries(this.vehiclesStatsTotal)
            .filter(([key]) => STATS_QSE_DETAILS[key]) // only include keys defined in STATS_DETAILS
            .map(([key, value]) => ({
              state: key,
              count: value,
              displayName: STATS_QSE_DETAILS[key].displayName,
              color: STATS_QSE_DETAILS[key].color
            }));

          //transformer les résultats originaux de la table.ts en TreeNode
          this.vehiclesStatsTree = VehicleService.transformToTreeNodes(
            this.vehicleStatsQse,
            (vehicle: dto.VehiclesStatsQseDTO) => ({
              driverName: vehicle.vehicleStatsQse.driverName || '',
              licensePlate: vehicle.vehicleStatsQse.licensePlate || 'unknown',
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

  private subscribeToFilterChanges(): Subscription {
    return this.filterService.filters$.subscribe(filters => {
      this.filters = filters as { agencies: string[], vehicles: string[], drivers: string[] };
      this.fetchVehicleStatsQse();
    })
  };


  filterByKey(selected: StatsCount): void {
    const property = this.keyToPropertyMap[selected.state];

    console.log(property);
    if (property) {
      const longestTripValue = this.vehiclesStatsTotal?.[selected.state];

      if (typeof longestTripValue !== 'number') {
        return;
      }

      //Filter vehicles that match `longestTrip` value for `distanceMax`
      const filteredVehiclesStats: TeamHierarchyNodeStatsQSE[] = this.vehicleStatsQse.map((node: TeamHierarchyNodeStatsQSE) => ({
        ...node,
        vehicles: node.vehicles?.filter((vehicle: VehiclesStatsQseDTO) => {
          const distanceMaxValue = vehicle.vehicleStatsQse?.distanceMax;
          return distanceMaxValue === longestTripValue; // Filter vehicles with the same `distanceMax` as `longestTrip`
        }) || [],
        children: node.children?.map((childNode: TeamHierarchyNodeStatsQSE) => ({
          ...childNode,
          vehicles: childNode.vehicles?.filter((vehicle: VehiclesStatsQseDTO) => {
            const distanceMaxValue = vehicle.vehicleStatsQse?.distanceMax;
            return distanceMaxValue === longestTripValue; // Same filter logic for children
          }) || [],
        }))
          .filter((childNode) => childNode.vehicles.length > 0) || [],
      }))
        .filter((node) => node.children.length > 0 || node.vehicles.length > 0);

      //Update the table or tree structure
      this.vehiclesStatsTree = VehicleService.transformToTreeNodes(
        filteredVehiclesStats,
        (vehicle: VehiclesStatsQseDTO) => ({
          driverName: vehicle.vehicleStatsQse.driverName || '',
          licensePlate: vehicle.vehicleStatsQse.licensePlate || 'unknown',
        })
      );
    }
  }

  filterByAlert(selected: QseAlertCount | null): void {
    this.selectedAlert = selected;

    this.vehiclesStatsTree = VehicleService.transformToTreeNodes(
      selected === null ?
        this.vehicleStatsQse :
        this.vehicleService.filterQseAlerts(
          this.vehicleStatsQse,
          selected.key
        ),
      (vehicle: VehiclesStatsQseDTO) => ({
        driverName: vehicle.vehicleStatsQse.driverName || '',
        licensePlate: vehicle.vehicleStatsQse.licensePlate || 'unknown',
      })
    );
  }

  getIndicatorStyle(
    indicatorKey: keyof QseIndicatorCheckers,
    indicatorValue: number | null
  ): { [key: string]: string } {
    if (indicatorValue === null) {
      return {};
    }

    if (qseIndicatorAlertMap[indicatorKey](indicatorValue)) {
      return {color: 'var(--p-red-500)'};
    } else if (qseIndicatorWarningMap[indicatorKey](indicatorValue)) {
      return {color: 'var(--p-orange-500)'};
    } else {
      return {};
    }
  }

  alertIdentifierFn = (alert: QseAlertCount) => alert.key;
  alertDisplayFn = (alert: QseAlertCount) => alert.displayName;
  alertColorFn = (alert: QseAlertCount) => alert.color;
  protected readonly indicatorAlertMap = qseIndicatorAlertMap;
}
