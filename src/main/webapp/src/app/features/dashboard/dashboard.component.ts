import { Component, OnInit } from '@angular/core';
import { FilterService} from "../../commons/navbar/filter.service";
import {TeamHierarchyNode, VehicleService} from "../vehicle/vehicle.service";
import {dto} from "../../../habarta/dto";
import VehicleSummaryDTO = dto.VehicleSummaryDTO;
import {TreeNode} from "primeng/api";
import {PoiService} from "../poi/poi.service";
import {GeocodingService} from "../../commons/geo/geo-coding.service";
import {Router} from "@angular/router";
import {DatePipe} from "@angular/common";

@Component({
  selector: 'app-dashboard',
  template: `
<!--    <h1>Dashboard</h1>-->
    <div class="status-buttons">
      <button
        *ngFor="let status of vehicleStatusCounts"
        pButton
        [ngStyle]="{ '--button-color': getButtonColor(status.state) }"
        class="custom-status-button"
        (click)="filterByStatus(status.state)"
      >
    <span>
      <span class="status-count">{{ status.count }}</span>
      <span class="status-text">{{ getStatusDisplayName(status.state) }}</span>
      <span class="icon"><i class="pi" [ngClass]="getStatusIcon(status.state)"></i></span>
    </span>
      </button>
    </div>
    <p-treeTable *ngIf="vehiclesTree.length"
                 [value]="vehiclesTree"
                 [scrollable]="true"
                 [tableStyle]="{'width': '95%', 'margin': '0 auto'}"
                 styleClass="p-treetable-gridlines custom-tree-table">

      <ng-template pTemplate="header">
      </ng-template>

      <ng-template pTemplate="body" let-rowNode let-rowData="rowData">
        <tr [ttRow]="rowNode"
            [ngClass]="{
          'root-node': !rowNode.parent,
          'no-vehicle': rowData.children && rowData.children.length > 0 && !rowData.vehicle,
          'has-vehicle': rowData.vehicle
        }">

          <td *ngIf="!rowData.vehicle" colspan="7">
            <p-treeTableToggler [rowNode]="rowNode" />
            {{ rowData.label }}
          </td>


          <td *ngIf="rowData.vehicle">
            {{ (rowData.vehicle.driver.lastName || 'Non spécifié') + ' ' + (rowData.vehicle.driver.firstName || 'Non spécifié') }}
          </td>
          <td *ngIf="rowData.vehicle">{{ rowData.label }}</td>
          <td *ngIf="rowData.vehicle"
              [ngClass]="{
            'MOVING': rowData.vehicle.device.deviceDataState.state === 'MOVING',
            'OFF': rowData.vehicle.device.deviceDataState.state === 'OFF',
            'STOP': rowData.vehicle.device.deviceDataState.state === 'STOP',
            'NO_COM': rowData.vehicle.device.deviceDataState.state === 'NO_COM',
            'DEFAULT': rowData.vehicle.device.deviceDataState.state === null,
          }">
            <!-- Icon and text -->
            <ng-container [ngSwitch]="rowData.vehicle.device.deviceDataState.state">
              <!-- Roulant -->
              <span *ngSwitchCase="'MOVING'" class="status-icon">
                 Roulant
                 <i class="pi pi-play"></i>

              </span>

              <!-- A l'arrêt -->
              <span *ngSwitchCase="'STOP'" class="status-icon">
                À l'arrêt
                 <i class="pi pi-step-forward"></i>

                </span>

              <!-- Arrêté -->
              <span *ngSwitchCase="'OFF'" class="status-icon">
                Arrêté
                 <i class="pi pi-stop"></i>

             </span>

              <!-- Non C -->
              <span *ngSwitchCase="'NO_COM'" class="status-icon">
                Aucun signal
                 <i class="pi pi-times"></i>

             </span>

              <!-- Default Case -->
              <span *ngSwitchDefault class="status-icon">
                 Inconnu
                <i class="pi pi-question"></i>
                </span>
            </ng-container>
          </td>
          <td *ngIf="rowData.vehicle">{{ rowData.vehicle.device.deviceDataState.lastCommTime | date: 'HH:mm'  }}</td>
          <td *ngIf="rowData.vehicle">{{ rowData.vehicle.lastPositionAddress ?? 'Inconnu'}}</td>
          <td *ngIf="rowData.vehicle">{{ rowData.vehicle.distance || '50 km' }}</td>
          <td *ngIf="rowData.vehicle"><p-button (onClick)="this.router.navigate(['trip', rowData.vehicle.id, today])" icon="pi pi-calendar" class="transparent-blur-bg"></p-button></td>
        </tr>
      </ng-template>
    </p-treeTable>


  `,
  styles: [`

    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table th {
      background-color: #007ad9 !important;
      color: white !important;
      text-align: left !important;
      //padding: 1px !important;
      padding: 2px 8px !important;
    }

    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table td {
      padding: 2px 8px !important;
      border-bottom: 1px solid #ddd !important;
      width: auto;
    }

    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table tr.no-vehicle {
      background-color: var(--gray-200) !important;
      color: white !important;
      font-weight: 500;
    }

    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table tr.has-vehicle {
      background-color: var(--gray-200) !important;
      font-weight: 500;
    }

    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table tr:hover {
      background-color: var(--bluegray-100) !important;
    }
    :host ::ng-deep .p-treetable.custom-tree-table .root-node {
      background-color: var(--gray-200);
      color: var(--blue-800);
      border-radius: 15px 15px 0 0 !important;
      border: none !important;
      width: 100% !important;
      margin: 0 auto !important;
      box-shadow: 0 2px 4px #0000001a !important;
      display: inline-block !important;
      font-weight: bold;


    }
    :host ::ng-deep .p-treetable.custom-tree-table .root-node td {
      padding: 12px; /* Adjust padding for better appearance */
      border-width: 0px;
    }

    :host ::ng-deep .p-treetable.custom-tree-table .MOVING {
      background-color: #21A179;
      color: white;
    }

    :host ::ng-deep .p-treetable.custom-tree-table .STOP {
      background-color: #FE8F2B;
      color: white;
    }

    :host ::ng-deep .p-treetable.custom-tree-table .OFF {
      background-color: #C71400;
      color: white;
    }

    :host ::ng-deep .p-treetable.custom-tree-table .NO_COM {
      //background-color: #E5E5E5;
      background-color:var(--gray-400);
      color: white;
    }

    :host ::ng-deep .p-treetable.custom-tree-table .DEFAULT {
      background-color: #E5E5E5;
      color: white;
    }

    .status-icon {
      display: flex;
      align-items: center;
      font-size: 1rem;
      justify-content: space-between;
      color: white;
    }

    .status-icon i {
      font-size: 1.2rem;
      color: white;
      margin-left: 0.5rem;

    }
    .status-buttons {
      display: flex;
      gap: 15px;
      margin-bottom: 20px;
      justify-content: center;
      align-items: center;
    }

    .custom-status-button {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 30px;
      font-size: 25px;
      font-weight: bold;
      border: none;
      width: 100%;
      flex: 1 1 170px; /* Flex-grow, flex-shrink, and initial width */
      height: 90px;
      box-sizing: border-box; /* Include padding and border in width */
      position: relative;
      border-radius: 20px;
      color: #333;
      background: white;
      overflow: hidden;
      cursor: pointer;
      transition: box-shadow 0.2s ease-in-out, transform 0.2s ease-in-out;
      white-space: nowrap;

    }

    .custom-status-button i {
      margin-right: 10px; /* Space between icon and text */
      font-size: 35px; /* Adjust icon size */
      color: var(--button-color, #007bff);
      margin-left: auto;

    }

    .custom-status-button:hover {
      box-shadow: 0px 4px 10px rgba(0, 0, 0, 0.2); /* Add shadow on hover */
      transform: translateY(-2px); /* Subtle lift effect */
    }

    .custom-status-button::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 30%; /* 30% colored area */
      background: var(--button-color, #007bff); /* Use dynamic color */
      border-top-left-radius: 20px;
      border-bottom-left-radius: 20px;
    }

    .custom-status-button span {
      position: relative; /* Prevent content from being under the gradient */
      z-index: 1; /* Ensure text is above gradient */
      display: flex;
      flex: 1;
      justify-content: space-between; /* Space text and count */
      padding-left: 10px; /* Space from the gradient */
    }

    .custom-status-button .status-count {
      color: white; /* Count inside the colored area */
      padding: 0 5px;
      font-weight: bold;
      margin-right: 10px;
    }

    .custom-status-button .status-text {
      color: var(--button-color, #007bff); /* Text outside the colored area */
    }

  `]
})
export class DashboardComponent implements OnInit {
  selectedTags: { [key: string]: string[] } = {};
  protected unTrackedVehicle : String = "Liste des véhicules non-géolocalisés : ";
  vehicles: VehicleSummaryDTO[] = [];
  vehiclesTree: TreeNode[] = [];
  vehicleStatusCounts: { state: string; count: number }[] = [];
  teamHierarchy:TeamHierarchyNode[];
  today = new Date().toISOString().split('T')[0].replaceAll('-', '');

  constructor(
    private filterService: FilterService,
    private readonly vehicleService: VehicleService,
    private readonly poiService: PoiService,
    private readonly geoCodingService:GeocodingService,
    protected router: Router
  ) {}

  ngOnInit() {
    // S'abonner aux filtres partagés
      this.filterService.filters$.subscribe(filters => {
      this.selectedTags = filters;
      this.subscribeToFilterChanges();

    });

  }

  private subscribeToFilterChanges(): void {
    this.filterService.filters$.subscribe(filters => {
      const {agencies, vehicles, drivers} = filters;

      // Fetch the filtered vehicles based on the selected filters
      this.vehicleService.getFilteredVehiclesDashboard(agencies, vehicles, drivers).subscribe(filteredVehicles => {
        this.vehiclesTree=this.transformToTreeNodes(filteredVehicles)

        const stateCounts = this.calculateStatusCounts(filteredVehicles);
        this.vehicleStatusCounts = [
          { state: 'MOVING', count: stateCounts['MOVING'] || 0 },
          { state: 'OFF', count: stateCounts['OFF'] || 0 },
          { state: 'STOP', count: stateCounts['STOP'] || 0 },
          { state: 'NO_COM', count: stateCounts['NO_COM'] || 0 },
        ];

      });
    })
  };

  //TODO make it more general (+3 levels)
  transformToTreeNodes(teamNodes: TeamHierarchyNode[]): TreeNode[] {
    return teamNodes.map((team) => {
      return {
        data : {
          label : team.label,
          vehicle : null

        },
        children : [
          ...(team.children || []).map((child: TeamHierarchyNode) => ({
            data : {
              label : child.label,
              vehicle : null
            },
            children : [
              ...(child.vehicles || []).map((vehicle : dto.VehicleTableDTO)=> ({
                data : {
                  label : vehicle.licenseplate,
                  vehicle: vehicle
                },
                children :[]
              }))
            ]
          }))
        ]
      }
      ;
    });
  }

  calculateStatusCounts(teams: TeamHierarchyNode[]): Record<string, number> {
    const counts: Record<string, number> = {};

    function traverseTeams(teamNodes: TeamHierarchyNode[]): void {
      teamNodes.forEach((team) => {
        // Count states from the vehicles at this team level
        team.vehicles.forEach((vehicle) => {
          const state = vehicle.device?.deviceDataState?.state;
          if (state) {
            counts[state] = (counts[state] || 0) + 1;
          }
        });

        // Recursively process child teams
        if (team.children && team.children.length > 0) {
          traverseTeams(team.children);
        }
      });
    }

    // Start traversing from the root teams
    traverseTeams(teams);

    return counts;
  }

  filterByStatus(state: string) {
    // Implement filtering logic here, or update the vehiclesTree based on the selected status
    console.log(`Filtering vehicles by status: ${state}`);
  }

  private displayFilteredVehiclesOnDashboard(vehicles: any[]): void {
    this.unTrackedVehicle = "Liste des véhicules non-géolocalisés : ";
    this.vehicles = vehicles;  // Assign filtered vehicles to vehicles array

    vehicles.forEach(vehicle => {
      if (vehicle.device?.coordinate) {

      } else {
        this.unTrackedVehicle += `${vehicle.licenseplate} /// `;
      }
    });
  }

  getButtonColor(state: string): string {
    switch (state) {
      case 'MOVING':
        return '#21A179';
      case 'OFF':
        return '#C71400';
      case 'STOP':
        return '#FE8F2B';
      case 'NO_COM':
        return '#E0E0E0';
      default:
        return '#E0E0E0';
    }
  }

  getStatusDisplayName(state: string): string {
    const stateDisplayNames: Record<string, string> = {
      MOVING: 'ROULANT',
      OFF: 'ARRÊTÉ',
      STOP: 'À L\'ARRÊT',
      NO_COM: 'SANS SIGNAL',
    };
    return stateDisplayNames[state] || 'UNKNOWN';
  }

  getStatusIcon(status: string): string {
    switch (status) {
      case 'MOVING':
        return 'pi-play';
      case 'OFF':
        return 'pi-stop';
      case 'STOP':
        return 'pi-step-forward';
      case 'NO_COM':
        return 'pi-times';
      default:
        return 'pi-exclamation-circle';
    }
  }

  protected readonly DatePipe = DatePipe;
}



