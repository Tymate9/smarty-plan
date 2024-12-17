import {ChangeDetectorRef, Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FilterService} from "../../commons/navbar/filter.service";
import {TeamHierarchyNode, VehicleService} from "../vehicle/vehicle.service";
import {dto} from "../../../habarta/dto";
import {TreeNode} from "primeng/api";
import {Router} from "@angular/router";
import {DatePipe} from "@angular/common";
import {TreeTable} from "primeng/treetable";
import VehicleSummaryDTO = dto.VehicleSummaryDTO;
import {Subscription} from "rxjs";

@Component({
  selector: 'app-dashboard',
  template: `

    <div class="status-buttons">
      <button
        *ngFor="let status of vehicleStatusCounts"
        pButton
        [ngStyle]="{ '--button-color': getStatusDetails(status.state).color }"
        class="custom-status-button"
        (click)="filterByStatus(status.state)"
      >
        <span>
          <span class="status-count">{{ status.count }}</span>
          <span class="status-text">{{ getStatusDetails(status.state).displayName }}</span>
          <span class="icon"><i class="pi" [ngClass]="getStatusDetails(status.state).icon"></i></span>
        </span>
      </button>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <p-button [raised]="true" severity="info" icon="{{ isExpanded ? 'pi pi-minus' : 'pi pi-plus' }}" (click)="toggleTree()"  styleClass="custom-button"></p-button>
      <p-button label="Exporter CSV" [raised]="true" severity="info" (click)="exportToCSV()" styleClass="custom-button"></p-button>
    </div>

    <div style="margin-bottom: 10px;">

    </div>



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
          <td *ngIf="!rowData.vehicle" colspan="8">
            <p-treeTableToggler [rowNode]="rowNode"  />
            {{ rowData.label }}
          </td>
        </tr>

        <tr [ttRow]="rowNode"
            *ngIf="!rowNode.parent"
            class="table-header">
          <td>Conducteur</td>
          <td>Immatriculation</td>
          <td>État</td>
          <td>Dernière communication</td>
          <td>Heure de départ</td>
          <td>Adresse</td>
          <td>Distance totale</td>
          <td>Fiche journalière</td>
        </tr>

        <tr [ttRow]="rowNode"
            [ngClass]="{
          'root-node': !rowNode.parent,
          'no-vehicle': rowNode.parent && rowData.children && rowData.children.length > 0,
          'has-vehicle': rowData.vehicle
        }"
            *ngIf="rowData.vehicle">
          <td>
            {{ (rowData.vehicle.driver.lastName || 'Non spécifié') + ' ' + (rowData.vehicle.driver.firstName || 'Non spécifié') }}
          </td>
          <td>{{ rowData.label }}</td>
          <td
            [ngClass]="{
            'DRIVING': rowData.vehicle.device?.deviceDataState?.state === 'DRIVING',
            'PARKED': rowData.vehicle.device?.deviceDataState?.state === 'PARKED',
            'IDLE': rowData.vehicle.device?.deviceDataState?.state === 'IDLE',
            'NO_COM': rowData.vehicle.device?.deviceDataState?.state === 'NO_COM',
            'UNPLUGGED': rowData.vehicle.device?.deviceDataState?.state === 'UNPLUGGED',
            'DEFAULT': rowData.vehicle.device?.deviceDataState?.state === null,
          }">
            <!-- Icon and text -->
            <ng-container [ngSwitch]="rowData.vehicle.device?.deviceDataState?.state">
              <span *ngSwitchCase="'DRIVING'" class="status-icon">Roulant<i class="pi pi-play"></i></span>
              <span *ngSwitchCase="'IDLE'" class="status-icon">À l'arrêt<i class="pi pi-step-forward"></i></span>
              <span *ngSwitchCase="'PARKED'" class="status-icon">Arrêté<i class="pi pi-stop"></i></span>
              <span *ngSwitchCase="'NO_COM'" class="status-icon">Aucun signal<i class="pi pi-times"></i></span>
              <span *ngSwitchCase="'UNPLUGGED'" class="status-icon">Déconnecté<i class="pi pi-ban"></i></span>
              <span *ngSwitchDefault class="status-icon">Inconnu<i class="pi pi-question"></i></span>
            </ng-container>
          </td>
          <td
            class="button-cell">{{ rowData.vehicle.device?.deviceDataState?.lastCommTime | date: 'HH:mm  dd-MM-yyyy' }}
          </td>
          <td
            class="button-cell">{{ rowData.vehicle.firstTripStart}}
          </td>

          <td class="poi-cell" [ngStyle]="{ 'white-space': 'nowrap', 'width': 'auto' }">
            <div style="display: flex; align-items: center; gap: 8px;">
              <!-- Icon on the left -->
              <span *ngIf="poiIcons[rowData.vehicle.lastPositionAdresseType]"
                    [ngStyle]="{ 'color': getPoiColor(rowData.vehicle.lastPositionAdresseType) }"
                    class="poi-icon">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30"
                   [ngStyle]="{ 'fill': getPoiColor(rowData.vehicle.lastPositionAdresseType) }">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"></path>
              </svg>
            </span>

              <span>
            {{ rowData.vehicle.lastPositionAddress ?? 'Inconnu' }}
              </span>
            </div>
          </td>


          <td class="button-cell">{{ rowData.vehicle.distance?.toFixed(0) ?? 0 }} km</td>
          <td class="button-cell">
            <p-button (onClick)="this.router.navigate(['trip', rowData.vehicle.id, today])" icon="pi pi-calendar"
                      styleClass="red-button"></p-button>
          </td>
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
      font-weight: 700;
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
    :host ::ng-deep .p-treetable.custom-tree-table .root-node {
      background-color: #aa001f;
      color: white;
      border-radius: 15px 15px 0px 0px !important;
      border: none !important;
      width: 100% !important;
      margin: 0 auto !important;
      box-shadow: 0 2px 4px #0000001a !important;
      // display: inline-block !important;
      font-weight: 700 !important;
      clip-path: polygon(0% 100%, 0% 15%, 25% 15%, 27% 75%, 100% 75%, 100% 100%) !important;
      height: 50px;
      line-height: 50px;
    }
    :host ::ng-deep .p-treetable.custom-tree-table .root-node td {
      padding: 12px; /* Adjust padding for better appearance */
      border-width: 0px;
      font-weight: 700 !important;
    }

    :host ::ng-deep .p-treetable.custom-tree-table .DRIVING {
      background-color: #21A179;
      color: white;
    }

    :host ::ng-deep .p-treetable.custom-tree-table .IDLE {
      background-color: #FE8F2B;
      color: white;
    }

    :host ::ng-deep .p-treetable.custom-tree-table .PARKED {
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

    :host ::ng-deep .p-treeTable.custom-tree-table .poi-icon {
      margin-right: 8px;
      font-size: 1.2em;
      vertical-align: middle;
    }

    :host ::ng-deep .p-treetable.custom-tree-table .UNPLUGGED {
      background-color: var(--gray-400);
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
      margin-top: 20px;
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
      box-shadow: 0px 4px 20px rgba(0, 0, 0, 0.2);

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
      padding-left: 10px;
    }

    .custom-status-button .status-count {
      color: white;
      padding: 0 5px;
      font-weight: bold;
      margin-right: 10px;
    }

    .custom-status-button .status-text {
      color: var(--button-color, #007bff);
    }


    .p-treeTable .poi-cell {
      white-space: nowrap;
      width: auto;
      display: flex;
      //align-items: center;
      text-align: left;
      justify-content: space-between;
    }

    .p-treeTable .poi-icon {
      margin-right: 8px; /* Space between icon and text */
    }
    .toggle-button {
      margin-right: 10px;
      background-color: #5a5aad;
      color: #ffffff;
    }
    .toggle-button:hover {
      background-color: #4a4a9d;
    }

    .button-cell {
      width: 1%; /* Shrink-wrap the column width to its content */
      white-space: nowrap; /* Prevent wrapping in case of larger content */
      text-align: center; /* Align the button in the center of the cell */
      padding: 0; /* Optional: Remove padding for a tighter fit */
      align-items: center
    }
    .table-header {
      background-color: var(--gray-500);
      color: white;
     // text-align: center !Important;
      padding: 10px !Important;
      font-weight: 700 !Important;
    }
    .table-header td{
      text-align: center !Important;
    }
    ::ng-deep .p-button.p-component.p-button-info.p-button-raised.custom-button  {
      background-color:#aa001f !important;
      border-color:#aa001f !important;
      color: white !important;
      font-weight:600;
    }
    ::ng-deep .p-button.p-component.p-button-icon-only.red-button {
      background-color: #aa001f !important;
      border-color: #aa001f !important;
      color: white !important;
    }

    .p-treeTable .p-treetable-toggler {
      color: white !important; /* Change the icon color */
    }
    ::ng-deep .p-treetable .p-treetable-tbody > tr > td .p-treetable-toggler {
      color: white;
      background:#aa001f !important;
      width: 1.3rem;
      height:1.3rem;
    }

  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  filters: { agencies : string[], vehicles : string[], drivers : string[] } = {
    agencies: [],
    vehicles: [],
    drivers: []
  };
  protected unTrackedVehicle : String = "Liste des véhicules non-communicants : ";
  vehicles: VehicleSummaryDTO[] = [];
  vehiclesTree: TreeNode[] = [];
  @ViewChild(TreeTable) treeTable: TreeTable;
  vehicleStatusCounts: { state: string; count: number }[] = [];
  teamHierarchy:TeamHierarchyNode[];
  today = new Date().toISOString().split('T')[0].replaceAll('-', '');
  randomColors: string[] = ['#fccc55', '#f1749e', '#f79530', '#9c27b0'];
  isExpanded = true;

  getRandomColor(): string {
    const randomIndex = Math.floor(Math.random() * this.randomColors.length);
    return this.randomColors[randomIndex];
  }
  private filtersSubscription?: Subscription

  // Assign a random color to each rowNode
  getRowStyles(isRootNode: boolean): { [key: string]: string } | null {
    if (isRootNode) {
      const randomColor = this.getRandomColor();
      return {
        '--background-color': randomColor,
        '--text-color': randomColor
      };
    }
    return null;
  }

  poiIcons: { [key: string]: string } = {
    'Agence NM': '#FF5733',
    'Fournisseur': '#3357FF',
    'Client': '#A833FF',
    'Station Service': '#33A8FF',
    'Hotel/Restaurant': '#A8FF33',
    'route':'#000000'
  };

// Helper function to get the color for the POI label
  getPoiColor(label: string): string {
    return this.poiIcons[label] || '#000000'; // Default to black if label not found
  }

  constructor(
    private filterService: FilterService,
    private readonly vehicleService: VehicleService,
    protected router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // S'abonner aux filtres partagés
    this.filtersSubscription = this.subscribeToFilterChanges();
  }

  ngOnDestroy(): void {
    this.filtersSubscription?.unsubscribe()
  }

  private subscribeToFilterChanges(): Subscription {
    return this.filterService.filters$.subscribe(filters => {
      this.filters = filters as { agencies : string[], vehicles : string[], drivers : string[] };

      // Fetch the filtered vehicles based on the selected filters
      this.vehicleService.getFilteredVehiclesDashboard(this.filters.agencies, this.filters.vehicles, this.filters.drivers)
        .subscribe(filteredVehicles => {
        this.vehiclesTree=this.transformToTreeNodes(filteredVehicles)
        //this.expandAllNodes(this.vehiclesTree);

          const stateCounts = this.calculateStatusCounts(filteredVehicles);
          this.vehicleStatusCounts = [
            { state: 'DRIVING', count: stateCounts['DRIVING'] || 0 },
            { state: 'PARKED', count: stateCounts['PARKED'] || 0 },
            { state: 'IDLE', count: stateCounts['IDLE'] || 0 },
            { state: 'NO_COM', count: stateCounts['NO_COM'] || 0 },
            { state: 'UNPLUGGED', count: stateCounts['UNPLUGGED'] || 0 },
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
          vehicle : null,


        },
        expanded:true,
        children : [
          ...(team.children || []).map((child: TeamHierarchyNode) => ({
            data : {
              label : child.label,
              vehicle : null
            },
            expanded:true,
            children : [
              ...(child.vehicles || []).map((vehicle : dto.VehicleTableDTO)=> ({
                data : {
                  label : vehicle.licenseplate,
                  vehicle: vehicle,
                },
                expanded:true,
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
    // Filter the teamHierarchy variable based on the selected status
    const filteredHierarchy: TeamHierarchyNode[] = this.teamHierarchy.map((team) => ({
      ...team,
      children: team.children?.map((child) => ({
        ...child,
        vehicles: child.vehicles.filter((vehicle) => vehicle.device?.deviceDataState?.state === state),
      })).filter((child) => child.vehicles.length > 0), // Remove child nodes without vehicles
      vehicles: team.vehicles.filter((vehicle) => vehicle.device?.deviceDataState?.state === state), // Filter vehicles at the team level
    })).filter((team) =>
      (team.children?.length || 0) > 0 || team.vehicles.length > 0 // Keep teams with vehicles or children
    );

    // Transform the filtered hierarchy into TreeNodes
    this.vehiclesTree = this.transformToTreeNodes(filteredHierarchy);
   // this.expandAllNodes(this.vehiclesTree);

  }




  private displayFilteredVehiclesOnDashboard(vehicles: any[]): void {
    this.unTrackedVehicle = "Liste des véhicules non-communicants ";
    this.vehicles = vehicles;  // Assign filtered vehicles to vehicles array

    vehicles.forEach(vehicle => {
      if (vehicle.device?.coordinate) {

      } else {
        this.unTrackedVehicle += `${vehicle.licenseplate} /// `;
      }
    });
  }

  getStatusDetails(state: string): { color: string; displayName: string; icon: string } {
    const statusDetails: Record<string, { color: string; displayName: string; icon: string }> = {
      DRIVING: { color: '#21A179', displayName: 'ROULANT(S)', icon: 'pi-play' },
      PARKED: { color: '#C71400', displayName: 'ARRÊTÉ', icon: 'pi-stop' },
      IDLE: { color: '#FE8F2B', displayName: 'À L\'ARRÊT', icon: 'pi-step-forward' },
      NO_COM: { color: '#E0E0E0', displayName: 'SANS SIGNAL', icon: 'pi-times' },
      UNPLUGGED: { color: '#E0E0E0', displayName: 'DÉCONNECTE', icon: 'pi-ban' },
    };

    return statusDetails[state] || {
      color: '#E0E0E0',
      displayName: 'UNKNOWN',
      icon: 'pi-exclamation-circle',
    };
  }

  resetTreeNode() {
    this.vehiclesTree = this.transformToTreeNodes(this.teamHierarchy);
  }


  exportToCSV(): void {
    const csvData = this.convertToCSV(this.teamHierarchy);

    const bom = '\uFEFF';
    const fullData = bom + csvData;

    const blob = new Blob([fullData], { type: 'text/csv;charset=utf-8;' });

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('fr-FR'); // Format: dd/mm/yyyy
    const formattedTime = currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); // Format: hh:mm
    const fileName = `Positions Au ${formattedDate} ${formattedTime}.csv`.replace(/[:]/g, '-'); // Replace colons in time for compatibility

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }


  convertToCSV(data: TeamHierarchyNode[]): string {
    const rows: string[] = [];
    const headers = ['Véhicule','Immatriculation','Marque','Modèle','Etat','Energie','Conducteur','Dernière communication','Heure de départ','Adresse','Type d\'adresse de référence','Distance totale','Entité Conducteur', 'Entité Véhicule','Groupe de salarié'];
    rows.push(headers.join(','));


    const processNode = (node: TeamHierarchyNode, parentLabel: string = ''): void => {
      const teamLabel = node.label;
      if (node.vehicles) {
        for (const vehicle of node.vehicles) {
          rows.push([
            vehicle.driver?.lastName+'-'+vehicle.licenseplate,
            vehicle.licenseplate,
            vehicle.category.label,
            vehicle.category.label,
            vehicle.device?.deviceDataState?.state,
            vehicle.energy,
            vehicle.driver?.lastName+' '+vehicle.driver?.firstName,
            formatDateTime(vehicle.device?.deviceDataState?.lastPositionTime),
            vehicle.firstTripStart,
            vehicle.lastPositionAddress,
            vehicle.lastPositionAdresseType,
            vehicle.distance,
            vehicle.driver?.team.label,
            parentLabel || teamLabel,
            teamLabel,
          ].join(','));
        }
      }

      if (node.children) {
        for (const child of node.children) {
          processNode(child, teamLabel);
        }
      }
    };

    for (const team of data) {
      processNode(team);
    }

    return rows.join('\n'); // Combine rows with newlines
  }


  toggleTree() {
    if (this.vehiclesTree && this.vehiclesTree.length > 0) {
      this.isExpanded = !this.isExpanded;
      this.vehiclesTree = this.vehiclesTree.map(vehicle => ({
        ...vehicle,
        expanded: !vehicle.expanded
      }));
    }
  }

  protected readonly DatePipe = DatePipe;
}
function formatDateTime(dateString: Date | null | undefined): string {
  if (!dateString) return '';

  const date = new Date(dateString); // Parse the date string
  const formattedDate = new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);

  return formattedDate; // Return the formatted date
}





