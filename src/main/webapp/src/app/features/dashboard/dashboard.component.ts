import { Component, OnInit } from '@angular/core';
import { FilterService} from "../../commons/navbar/filter.service";
import {TeamHierarchyNode, VehicleService} from "../vehicle/vehicle.service";
import {dto} from "../../../habarta/dto";
import VehicleSummaryDTO = dto.VehicleSummaryDTO;
import {TreeNode} from "primeng/api";
import {PoiService} from "../poi/poi.service";
import {GeocodingService} from "../../commons/geo/geo-coding.service";

@Component({
  selector: 'app-dashboard',
  template: `
    <h1>Dashboard</h1>
    <div>
      <p><strong>Agences sélectionnées :</strong> {{ selectedTags['agencies'].join(', ') || 'Aucune' }}</p>
      <p><strong>Véhicules sélectionnés :</strong> {{ selectedTags['vehicles'].join(', ') || 'Aucune' }}</p>
      <p><strong>Conducteurs sélectionnés :</strong> {{ selectedTags['drivers'].join(', ') || 'Aucune' }}</p>
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

          <td *ngIf="!rowData.vehicle" colspan="6">
            <p-treeTableToggler [rowNode]="rowNode" />
            {{ rowData.label }}
          </td>

          <td *ngIf="rowData.vehicle">{{ rowData.label }}</td>
          <td *ngIf="rowData.vehicle">
            {{ (rowData.vehicle.driver.lastName || 'Non spécifié') + ' ' + (rowData.vehicle.driver.firstName || 'Non spécifié') }}
          </td>
          <td *ngIf="rowData.vehicle"
              [ngClass]="{
            'roulant': rowData.vehicle.device.deviceDataState.state === 'Roulant',
            'a-l-arret': rowData.vehicle.device.deviceDataState.state === 'A l\\'arrêt',
            'arrete': rowData.vehicle.device.deviceDataState.state === 'Arrêté'
          }">{{ rowData.vehicle.device.deviceDataState.state }}</td>
          <td *ngIf="rowData.vehicle">{{ rowData.vehicle.device.deviceDataState.lastCommTime | date: 'shortTime'  }}</td>
          <td *ngIf="rowData.vehicle">{{ rowData.vehicle.lastPositionAddress ?? 'Inconnu'}}</td>
          <td *ngIf="rowData.vehicle">{{ rowData.vehicle.distance || '50 km' }}</td>
        </tr>
      </ng-template>
    </p-treeTable>


  `,
  styles: [`

    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table th {
      background-color: #007ad9 !important;
      color: white !important;
      text-align: left !important;
      padding: 8px !important;
    }

    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table td {
      padding: 8px !important;
      border-bottom: 1px solid #ddd !important;
      width: auto;
    }

    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table tr.no-vehicle {
      background-color: var(--gray-200) !important;
      color: white !important;
      font-weight: bold;
    }

    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table tr.has-vehicle {
      background-color: var(--gray-200) !important;
      font-weight: bold;
    }

    :host ::ng-deep .p-treetable.p-treetable-gridlines.custom-tree-table tr:hover {
      background-color: var(--bluegray-100) !important;
    }
    :host ::ng-deep .p-treetable.custom-tree-table .root-node {
      background-color: var(--gray-200);
      color: var(--blue-800);
      border-top-left-radius: 10px;
      border-top-right-radius: 10px;

    }

    :host ::ng-deep .p-treetable.custom-tree-table .roulant {
      background-color: #21A179;
      color: white;
    }

    :host ::ng-deep .p-treetable.custom-tree-table .a-l-arret {
      background-color: #FE8F2B;
      color: white;
    }

    :host ::ng-deep .p-treetable.custom-tree-table .arrete {
      background-color: #C71400;
      color: white;
    }

  `]
})
export class DashboardComponent implements OnInit {
  selectedTags: { [key: string]: string[] } = {};
  protected unTrackedVehicle : String = "Liste des véhicules non-géolocalisés : ";
  vehicles: VehicleSummaryDTO[] = [];
  vehiclesTree: TreeNode[] = [];
  teamHierarchy:TeamHierarchyNode[];


  constructor(
    private filterService: FilterService,
    private readonly vehicleService: VehicleService,
    private readonly poiService: PoiService,
    private readonly geoCodingService:GeocodingService) {}

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

}

