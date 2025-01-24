import {Component, Input, OnInit, ViewChild} from '@angular/core';
import {FilterService} from "../../commons/navbar/filter.service";
import {TeamHierarchyNode, TeamHierarchyNode1, VehicleService} from "../vehicle/vehicle.service";
import {Calendar} from "primeng/calendar";
import {TreeNode} from "primeng/api";
import {dto} from "../../../habarta/dto";
import VehiclesStatsDTO = dto.VehiclesStatsDTO;


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
      <button (click)="fetchVehicleStats()">OK</button>
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

<!--    <p-treeTable [value]="vehicleStats" [columns]="columns">-->
<!--      <ng-template pTemplate="header" let-columns>-->
<!--        <tr>-->
<!--          <th *ngFor="let col of columns">{{ col.header }}</th>-->
<!--        </tr>-->
<!--      </ng-template>-->
<!--      <ng-template pTemplate="body" let-rowData let-columns="columns">-->
<!--        <tr>-->
<!--          <td *ngFor="let col of columns">{{ rowData[col.field] }}</td>-->
<!--        </tr>-->
<!--      </ng-template>-->
<!--    </p-treeTable>-->

<!--    <p-table [value]="vehiclesTree" [columns]="columns" responsiveLayout="scroll">-->
<!--      <ng-template pTemplate="header" let-columns>-->
<!--        <tr>-->
<!--          <th *ngFor="let col of columns">{{ col.header }}</th>-->
<!--        </tr>-->
<!--      </ng-template>-->
<!--      <ng-template pTemplate="body" let-rowData let-columns="columns">-->
<!--        <tr>-->
<!--          <td *ngFor="let col of columns">{{ rowData[col.field] }}</td>-->
<!--        </tr>-->
<!--      </ng-template>-->
<!--    </p-table>-->
<!--    <p-treeTable [value]="vehiclesTree" [columns]="columns" responsiveLayout="scroll">-->
<!--      <ng-template pTemplate="header" let-columns>-->
<!--        <tr>-->
<!--          <th *ngFor="let col of columns">{{ col.header }}</th>-->
<!--        </tr>-->
<!--      </ng-template>-->

<!--      <ng-template pTemplate="body" let-rowData let-columns="columns">-->
<!--        <tr>-->
<!--          <td *ngFor="let col of columns">-->
<!--            &lt;!&ndash; Make sure to handle hierarchical data if needed &ndash;&gt;-->
<!--            <ng-container *ngIf="col.field === 'label'">-->
<!--              &lt;!&ndash; Display the hierarchical level of the label (e.g. tree node label) &ndash;&gt;-->
<!--              <span>{{ rowData.vehicleStats.label }}</span>-->
<!--            </ng-container>-->
<!--            <ng-container *ngIf="col.field !== 'label'">-->
<!--              &lt;!&ndash; Display other fields if necessary &ndash;&gt;-->
<!--              <span>{{ rowData.data[col.field] }}</span>-->
<!--            </ng-container>-->
<!--          </td>-->
<!--        </tr>-->
<!--      </ng-template>-->
<!--    </p-treeTable>-->


    <p-treeTable *ngIf="vehiclesTree.length"
                 #treeTable
                 [value]="vehiclesTree"
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
          <td *ngIf="!rowData.vehicle" colspan="12">
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
          <td>Temps  d'attente</td>
        </tr>

        <tr [ttRow]="rowNode"
            [ngClass]="{
          'root-node': !rowNode.parent,
          'no-vehicle': rowNode.parent && rowData.children && rowData.children.length > 0,
          'has-vehicle': rowData.vehicle
        }"
            *ngIf="rowData.vehicle">

          <td>{{ rowData.vehicle.licensePlate || 'Véhicule' }}</td>
          <td *ngIf="rowData.vehicle.driverName; else noDriver">
            {{ rowData.vehicle.driverName || 'Véhicule non attribué' }}
          </td>
          <ng-template #noDriver>
            <td>Véhicule non attribué</td>
          </ng-template>
          <td>{{ rowData.vehicle.tripCount }}</td>
          <td>{{ rowData.vehicle.distanceSum }}</td>
          <td>{{ rowData.vehicle.drivingTime }}</td>
          <td>{{ rowData.vehicle.distancePerTripAvg }}</td>
          <td>{{ rowData.vehicle.durationPerTripAvg }}</td>
          <td>{{ rowData.vehicle.hasLateStartSum }}</td>
          <td>{{ rowData.vehicle.hasLateStop }}</td>
          <td>{{ rowData.vehicle.hasLastTripLong }}</td>
          <td>{{ rowData.vehicle.rangeAvg }}</td>
          <td>{{ rowData.vehicle.waitingDuration }}</td>

        </tr>

      </ng-template>
    </p-treeTable>


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



    /*style de treeTable*/
    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table th {
      background-color: #007ad9 !important;
      color: white !important;
      text-align: left !important;
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


  `]
})
export class ReportComponent implements OnInit {
  selectedTags: { [key: string]: string[] } = {};
  dateFrom: Date | null = new Date();
  dateTo: Date | null = new Date();
  protected now = new Date();
  vehiclesTree: TreeNode[] = [];


  vehicleStats: any[] = []; // TreeTable data
  constructor(private filterService: FilterService , private vehicleService: VehicleService) {}
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


  fetchVehicleStats(): void {
    if (this.dateFrom && this.dateTo) {
      const startDate = this.dateFrom.toISOString().split('T')[0];
      const endDate = this.dateTo.toISOString().split('T')[0];

      this.vehicleService.getVehiclesStats(startDate, endDate).subscribe({
        next: (data) => {
          const { teamHierarchyNodes, stats } = data;
          this.vehicleStats = teamHierarchyNodes;
          console.log(stats)
          console.log(this.vehicleStats)
          this.vehiclesTree = this.transformToTreeNodes(this.vehicleStats)
          console.log(this.vehiclesTree)
        },
        error: (err) => {
          console.error('Error fetching vehicle stats:', err);
        }
      });
    } else {
      alert('Please select both From and To dates.');
    }
  }

  transformToTreeNodes(teamNodes: TeamHierarchyNode1[]): TreeNode[] {
    // Helper function to sort by label alphabetically
    const sortByLabel = (a: { data: { label: string } }, b: { data: { label: string } }) =>
      a.data.label.localeCompare(b.data.label);

    return teamNodes.map((team) => {
      return {
        data: {
          label: team.label,
          vehicle: null,
        },
        expanded: true,
        children: [
          ...(team.children || []).map((child: TeamHierarchyNode1) => ({
            data: {
              label: child.label,
              vehicle: null
            },
            expanded: true,
            children: [
              ...(child.vehicles || [])
                .filter((vehicle) => vehicle.licensePlate !== null && vehicle !== undefined) // Exclude null or undefined vehicles
                .map((vehicle: VehiclesStatsDTO) => ({
                data: {
                  label: vehicle?.licensePlate || 'Unknown License Plate',
                  //label: 'Unknown License Plate',
                  vehicle: vehicle || null,
                },
                expanded: true,
                children: []
              }))

            ]
          }))
            .sort(sortByLabel),
        ]
      };
    }).sort(sortByLabel);
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

