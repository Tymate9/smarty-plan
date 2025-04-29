import {Component, OnInit} from '@angular/core';
import {FilterService} from "../../commons/navbar/filter.service";
import {TeamHierarchyNodeStats, TeamHierarchyNodeStatsQSE, VehicleService} from "../vehicle/vehicle.service";
import {Subscription} from "rxjs";
import {dto} from "../../../habarta/dto";
import VehicleStatsDTO = dto.VehicleStatsDTO;
import {TreeNode} from "primeng/api";
import {DateRangePickerComponent} from "../dateRange/dateRange.component";
import {IndicatorButtonsComponent} from "../indicator/indicator-buttons.component";
import {TreeTableModule} from "primeng/treetable";
import {NgClass, NgIf} from "@angular/common";
import VehicleStatsQseDTO = dto.VehicleStatsQseDTO;
import VehiclesStatsQseDTO = dto.VehiclesStatsQseDTO;

@Component({
  selector: 'app-qse-report',
  template: `
    <app-date-range (fetchStats)="onFetchVehicleStats($event)"></app-date-range>
    <app-indicator-buttons
      [statsMap]="vehiclesStatsTotal"
      [keyLabels]="keyLabels"
      [buttonColor]="'var(--p-red-100)'"
      [sliceRange]="[0, 4]"
      [keyToPropertyMap]="keyToPropertyMap"
      (filterClicked)="filterByKey($event)">
    </app-indicator-buttons>

    <app-indicator-buttons
      [statsMap]="vehiclesStatsTotal"
      [keyLabels]="keyLabels"
      [buttonColor]="'var(--p-gray-300)'"
      [sliceRange]="[4, 9]"
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
          <td>{{ rowData.vehicle.vehicleStatsQse.highwayAccelScore }}/20</td>
          <td>{{ rowData.vehicle.vehicleStatsQse.roadAccelScore }}/20</td>
          <td>{{ rowData.vehicle.vehicleStatsQse.cityAccelScore }}/20</td>
          <td>{{ rowData.vehicle.vehicleStatsQse.highwayTurnScore }}/20</td>
          <td>{{ rowData.vehicle.vehicleStatsQse.roadTurnScore }}/20</td>
          <td>{{ rowData.vehicle.vehicleStatsQse.cityTurnScore }}/20</td>
          <td>{{ rowData.vehicle.vehicleStatsQse.highwaySpeedScore }}%</td>
          <td>{{ rowData.vehicle.vehicleStatsQse.roadSpeedScore }}%</td>
          <td>{{ rowData.vehicle.vehicleStatsQse.citySpeedScore }}%</td>

        </tr>

      </ng-template>
    </p-treeTable>

  `,
  standalone: true,
  imports: [
    DateRangePickerComponent,
    IndicatorButtonsComponent,
    TreeTableModule,
    NgClass,
    NgIf
  ],
  styles: [``]
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
  vehiclesType:string='';
  vehicleStatsQse: any [] = [];
  vehiclesStatsTree: TreeNode[] = [];
  vehiclesStatsTotal: Record<string, any>;
  filteredVehiclesStats: TeamHierarchyNodeStatsQSE[] = [];


  keyToPropertyMap: Record<string, keyof VehicleStatsQseDTO> = {
    // example# totalHasLastTripLong: "hasLastTripLong",
    longestTrip : "distanceMax"
  };

  keyLabels: Record<string, string> = {
    totalDrivingTime: "TEMPS DE CONDUITE TOTAL",
    totalWaitingTime: "TEMPS D\'ARRET TOTAL (en hh:mm)",
    totalDistanceSum: "DISTANCE PARCOURUE (en km)",
    selectionScore: "SCORE DE LA SELECTION",
    severityOfUseTurn: "SEVERITE D'USAGE VIRAGE",
    severityOfAcceleration: "SEVERITE D'USAGE ACCELERATION-FREINAGE",
    averageRangeAvg: "AMPLITUDE MOYENNE",
    idleDurationTotal:"TEMPS DE MOTEUR TOURNANT ESTIME TOTAL(en hh:mm)",
    longestTrip:"LE TRAJET LE PLUS LONG"
  };


  ngOnInit() {
    this.filtersSubscription = this.subscribeToFilterChanges();
  }

  ngOnDestroy(): void {
    this.filtersSubscription?.unsubscribe()
  }

  onFetchVehicleStats(event: { dateFrom: Date; dateTo: Date ;vehiclesType:string}) {
    this.dateFrom = event.dateFrom;
    this.dateTo = event.dateTo;
    this.vehiclesType=event.vehiclesType;
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


  filterByKey(key: string): void {
    const property = this.keyToPropertyMap[key];

    console.log(property);
    if (property) {
      const longestTripValue = this.vehiclesStatsTotal?.[key];

      if (typeof longestTripValue !== 'number') {
        return;
      }

      //Filter vehicles that match `longestTrip` value for `distanceMax`
      this.filteredVehiclesStats = this.vehicleStatsQse.map((node: TeamHierarchyNodeStatsQSE) => ({
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
        this.filteredVehiclesStats,
        (vehicle: VehiclesStatsQseDTO) => ({
          driverName: vehicle.vehicleStatsQse.driverName || '',
          licensePlate: vehicle.vehicleStatsQse.licensePlate || 'unknown',
        })
      );
    }
  }

}
