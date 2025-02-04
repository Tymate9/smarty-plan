import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {FilterService} from "../../commons/navbar/filter.service";
import {TeamHierarchyNode,TeamHierarchyNodeStats, VehicleService} from "../vehicle/vehicle.service";
import {Calendar} from "primeng/calendar";
import {TreeNode} from "primeng/api";
import {dto} from "../../../habarta/dto";
import VehiclesStatsDTO = dto.VehiclesStatsDTO;
import {Subscription} from "rxjs";
import VehicleStatsDTO = dto.VehicleStatsDTO;
import { DialogModule } from 'primeng/dialog';


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
        [showIcon]="true"
        appendTo="body">
      </p-calendar>
      <p-calendar
        [(ngModel)]="dateTo"
        placeholder="Select To Date"
        [maxDate]="now"
        [showOtherMonths]="true"
        [showButtonBar]="true"
        appendTo="body"
        [showIcon]="true"
      >
      </p-calendar>
      <p-button [raised]="true" severity="info" icon="pi pi-search"
                (click)="fetchVehicleStats()" styleClass="custom-button"></p-button>
    </div>

    <div class="status-buttons">
      <button
        *ngFor="let stat of vehiclesStatsTotal | keyvalue | slice:0:5"
        pButton
        [ngStyle]="{ '--button-color': 'var(--red-100)' }"
        class="custom-status-button"
        (click)="['totalHasLastTripLong', 'totalHasLateStartSum', 'totalHasLateStop'].includes(stat.key) ? filterByKey(stat.key) : null">
        <span>
          <span class="status-count">{{ stat.value }}</span>
          <span class="status-text">{{ keyLabels[stat.key] }}</span>
        </span>
      </button>
    </div>
    <div class="status-buttons">
      <button
        *ngFor="let stat of vehiclesStatsTotal | keyvalue | slice:5:10"
        pButton
        [ngStyle]="{ '--button-color': 'var(--gray-300)' }"
        class="custom-status-button"
        (click)="['totalHasLastTripLong', 'totalHasLateStartSum', 'totalHasLateStop'].includes(stat.key) ? filterByKey(stat.key) : null">
        <!--        (click)="filterByStatus(status.state)">-->
        <span>
          <span class="status-count">{{ stat.value }}</span>
          <span class="status-text">{{ keyLabels[stat.key] }}</span>
        </span>
      </button>
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
          'root-node': !rowNode.parent,
          'no-vehicle': rowNode.parent && rowData.children && rowData.children.length > 0,
          'has-vehicle': rowData.vehicle
        }">
          <td *ngIf="!rowData.vehicle" colspan="13">
            <p-treeTableToggler [rowNode]="rowNode"/>
            {{ rowData.label }}
          </td>
        </tr>
        <tr [ttRow]="rowNode"
            *ngIf="!rowNode.parent"
            class="table-header">
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
          'root-node': !rowNode.parent,
          'no-vehicle': rowNode.parent && rowData.children && rowData.children.length > 0,
          'has-vehicle': rowData.vehicle
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
            <p-button [raised]="true" severity="info" icon="pi pi-info-circle"
                      (click)="fetchVehicleDailyStats(rowData.vehicle?.vehicleStats.vehicleId , rowData.vehicle?.vehicleStats.licensePlate)"
                      styleClass="custom-button"></p-button>
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
        <table>
          <thead>
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
          </thead>
          <tbody>
          <tr *ngFor="let dailyStat of vehicleDailyStats">
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
              {{ dailyStat.hasLateStop ? 'Oui' : 'Non'  }}
            </td>
            <td [ngStyle]="{'background-color': dailyStat.hasLastTripLong ? '#e5e7eb' : 'transparent'}">
              {{ dailyStat.hasLastTripLong ? 'Oui' : 'Non'  }}
            </td>
            <td>{{ dailyStat.rangeAvg }}</td>
            <td>{{ dailyStat.waitingDuration }}</td>
          </tr>
          </tbody>
        </table>
      </div>
    </p-dialog>



  `,
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
      //z-index: 3;
      display: flex;
      flex: 1;
      justify-content: space-between;
      padding-left: 13px;
    }

    .custom-status-button .status-count {
      color: black !Important;
      padding: 0 5px !Important;
      font-weight: bold !Important;
      margin-right: 10px !Important;
    }

    .custom-status-button .status-text {
      color: var(--button-color, #007bff);

    }
    /*fin de Style de bouton Indicateur*/



    /*style de treeTable*/
    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table th {
      background-color: #007ad9 !important;
      color: white !important;
      text-align: center !important;
      padding: 2px 8px !important;
    }

    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table td {
      padding: 2px 8px !important;
      border-bottom: 1px solid #ddd !important;
      width: auto;
      font-weight: 700;
    }

    .table-header {
      background-color: var(--gray-500);
      color: white;
      padding: 10px !Important;
      font-weight: 700 !Important;
    }

    .table-header td {
      text-align: center !Important;
    }

    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table tr.no-vehicle {
      background-color: var(--gray-200) !important;
      //color: var(--blue-600) !important;
      font-weight: 700;
      color: red;
    }

    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table tr.has-vehicle {
      background-color: var(--gray-200) !important;
      font-weight: 600;
    }

    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table tr:hover {
      background-color: var(--bluegray-100) !important;
    }

    .p-treeTable .p-treetable-toggler {
      color: white !important;
    }

    ::ng-deep .p-treetable .p-treetable-tbody > tr > td .p-treetable-toggler {
      color: white;
      background: #aa001f !important;
      width: 1.3rem;
      height: 1.3rem;
    }

    .custom-cell {
      width: 1%;
      white-space: nowrap;
      text-align: center;
      padding: 0;
      align-items: center
    }

    /*fin de style de treeTable*/

    /*style de treeTable parent ligne*/
    :host ::ng-deep .p-treetable.custom-tree-table .root-node {
      background-color: #aa001f;
      color: white;
      border-radius: 15px 15px 0px 0px !important;
      border: none !important;
      width: 100% !important;
      margin: 0 auto !important;
      box-shadow: 0 2px 4px #0000001a !important;
      font-weight: 700 !important;
      clip-path: polygon(0% 100%, 0% 15%, 25% 15%, 27% 75%, 100% 75%, 100% 100%) !important;
      height: 50px;
      line-height: 50px;
    }

    :host ::ng-deep .p-treetable.custom-tree-table .root-node td {
      padding: 12px;
      border-width: 0px;
      font-weight: 700 !important;
    }
    /*fin de style de treeTable parent ligne*/



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

    ::ng-deep .p-button.p-component.p-button-icon-only.red-button {
      background-color: #aa001f !important;
      border-color: #aa001f !important;
      color: white !important;
      margin: 1px !important;
    }

    /*fin de style de bouton personnalisé*/

    .overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 9999;
    }

    .dialog-box {
      background: #fff;
      padding: 20px;
      border-radius: 8px;
      min-width: 320px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .dialog-box h3 {
      margin-top: 0;
      margin-bottom: 10px;
      color: #333;
    }

    .dialog-content {
      margin-bottom: 16px;
    }

    .dialog-footer {
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    }

    .dialog-footer button {
      background-color: #aa001f;
      border: none;
      border-radius: 4px;
      color: #fff;
      font-weight: 600;
      padding: 8px 12px;
      cursor: pointer;
      transition: background-color 0.2s ease;
    }

    .dialog-footer button:hover {
      background-color: #8e001b;
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

    ::ng-deep .p-calendar .p-button {
      background-color: #aa001f;
      border-color: #aa001f !important;
      color: white !important;
      font-weight: 600;
    }



    /* Make dialog content flexible */
    ::ng-deep .p-dialog {
      max-width: 95%;
      width: auto !important;
      height: auto !important;
      max-height: 90vh;

    }
    ::ng-deep .p-dialog .p-dialog-header{
      border-top-left-radius:20px !important;
      border-top-right-radius:20px !important;
    }

    /* Ensure modal adjusts based on content */
    ::ng-deep .p-dialog-content {
      overflow: hidden; /* Prevents unwanted scrolling */
      display: flex;
      flex-direction: column;
      border-bottom-left-radius:20px !important;
      border-bottom-right-radius:20px !important;
    }

    /* Table container with scrolling */
    .table-container {
      max-height: 60vh; /* Ensures the table scrolls within the dialog */
      overflow-y: auto;
    }

    /* Make table fully responsive */
    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: auto; /* Adjusts column width dynamically */
      border-radius: 12px;
      white-space: nowrap;
    }

    /* Sticky table header */
    thead th {
      background-color: #aa001f;
      color: white;
      padding: 10px;
      text-align: left;
      font-weight: bold;
      position: sticky;
      top: 0;
      z-index: 2;
    }

    /* Table row styling */
    td {
      padding: 8px;
      border: 1px solid #ddd;
    }

    tbody tr:nth-child(odd) {
      background-color: #f9f9f9;
    }

    tbody tr:hover {
      background-color: #f1f1f1;
    }

  `]
})

export class ReportComponent implements OnInit {

  selectedTags: { [key: string]: string[] } = {};
  dateFrom: Date | null = new Date();
  dateTo: Date | null = new Date();
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

  //Pour référencer uniquement les propriétés valides de VehiclesStatsDTO
  // keyToPropertyMap: Record<string, keyof VehiclesStatsDTO> = {
  //   vehitotalHasLastTripLong: 'hasLastTripLong',
  //   totalHasLateStartSum: 'hasLateStartSum',
  //   totalHasLateStop: 'hasLateStop',
  // };

  keyToPropertyMap: Record<string, keyof VehicleStatsDTO> = {
    vehitotalHasLastTripLong: "hasLastTripLong",
    totalHasLateStartSum: "hasLateStartSum",
    totalHasLateStop: "hasLateStop",
  };


  keyLabels: Record<string, string> = {
    averageDistance: "DISTANCE MOYENNE/TRAJET (en km)",
    averageDuration: "TEMPS DE CONDUITE DECLARE TOTAL",
    averageRangeAvg: "Average Range",
    totalDistanceSum: "DISTANCE PARCOURUE (en km)",
    totalDrivers: "Total Drivers",
    totalDrivingTime: "TEMPS DE CONDUITE TOTAL",
    totalHasLastTripLong: "DERNIER TRAJET>45mn  (en nb)",
    totalHasLateStartSum: "DEPART TARDIF  (en nb)",
    totalHasLateStop: "Late Stops",
    totalTripCount: "TRAJETS EFFECTUES (en nb)",
    totalVehicles: "Total Vehicles",
    totalWaitingTime: "TEMPS D\'ATTENTE TOTAL (en hh:mm)",
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
      // const startDate = this.dateFrom.toISOString().split('T')[0];
      // const endDate = this.dateTo.toISOString().split('T')[0];

      const startDate = this.dateFrom.getFullYear() + '-' +
        String(this.dateFrom.getMonth() + 1).padStart(2, '0') + '-' +
        String(this.dateFrom.getDate()).padStart(2, '0');

      const endDate = this.dateTo.getFullYear() + '-' +
        String(this.dateTo.getMonth() + 1).padStart(2, '0') + '-' +
        String(this.dateTo.getDate()).padStart(2, '0');

      console.log(startDate+"c   "+ endDate);
      this.vehicleService.getVehiclesStats(startDate, endDate ,this.filters.agencies, this.filters.vehicles, this.filters.drivers ).subscribe({
        next: (data) => {
          const { teamHierarchyNodes, stats } = data;

          //cette variable contient les résultats originaux du tableau
          this.vehicleStats = teamHierarchyNodes;

          //Cette variable contient les résultats originaux des boutons statistiques
          this.vehiclesStatsTotal=stats;

          //transformer les résultats originaux de la table en TreeNode
          this.vehiclesStatsTree = this.transformToTreeNodes(this.vehicleStats)
          console.log(this.vehiclesStatsTree)

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
        console.log("Vehicle ID Received:", vehicleId);

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

      console.log(startDate+ endDate);
      console.log(vehicleId);

      this.vehicleService.getVehicleDailyStats(startDate, endDate ,vehicleId ).subscribe({
        next: (data) => {
          this.vehicleDailyStats = data;
          this.displayDailyStats = true;
          this.selectedDailyStat=licenseplat;


          //cette variable contient les résultats originaux du tableau

          console.log("here", this.vehicleDailyStats)

        },
        error: (err) => {
          console.error('Erreur lors de la récupération des statistiques du véhicule:', err);
        }
      });
    } else {
      alert('Veuillez sélectionner les dates De et À.');
    }
  }



  //Fonction à transférer vers treeNode
  transformToTreeNodes(teamNodes: TeamHierarchyNodeStats[]): TreeNode[] {
    //Fonctions d'aide pour trier par ordre alphabétique
    const sortByLabel = (a: { data: { label: string } }, b: { data: { label: string } }) =>
      a.data.label.localeCompare(b.data.label);

    const sortByDriverName = (
      a: { data: { vehicle: dto.VehiclesStatsDTO } },
      b: { data: { vehicle: dto.VehiclesStatsDTO } }
    ) => {
      const driverA = a.data.vehicle?.vehicleStats.driverName || '';
      const driverB = b.data.vehicle?.vehicleStats.driverName || '';

      return driverA.localeCompare(driverB);
    };

    return teamNodes.map((team) => {
      return {
        data: {
          label: team.label,
          vehicle: null,
        },
        expanded: true,
        children: [
          ...(team.children || []).map((child: TeamHierarchyNodeStats) => ({
            data: {
              label: child.label,
              vehicle: null
            },
            expanded: true,
            children: [
              ...(child.vehicles || [])
                .filter((vehicle) => vehicle.vehicleStats?.licensePlate !== null && vehicle !== undefined) // Exclude null or undefined vehicles
                .map((vehicle: VehiclesStatsDTO) => ({
                data: {
                  label: vehicle?.vehicleStats?.licensePlate || 'Unknown License Plate',
                  vehicle: vehicle || null,
                },
                expanded: true,
                children: []
              }))
                .sort(sortByDriverName),
            ]
          }))
            .sort(sortByLabel),
        ]
      };
    }).sort(sortByLabel);
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

    this.vehiclesStatsTree = this.transformToTreeNodes(this.filteredVehiclesStats);
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


  private subscribeToFilterChanges(): Subscription {
    return this.filterService.filters$.subscribe(filters => {
      this.filters = filters as { agencies: string[], vehicles: string[], drivers: string[] };

    })
  };
}

