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
        (click)="filterByStatus(status.state)">
        <span>
          <span class="status-count">{{ status.count }}</span>
          <span class="status-text">{{ getStatusDetails(status.state).displayName }}</span>
          <span class="icon"><i class="pi" [ngClass]="getStatusDetails(status.state).icon"></i></span>
        </span>
      </button>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <p-button [raised]="true" severity="info" icon="{{ isExpanded ? 'pi pi-minus' : 'pi pi-plus' }}"
                (click)="toggleTree()" styleClass="custom-button"></p-button>
      <p-button label="Exporter CSV" [raised]="true" severity="info" (click)="exportToCSV()"
                styleClass="custom-button"></p-button>
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
            <p-treeTableToggler [rowNode]="rowNode"/>
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
          <td>Bouton d'action</td>
        </tr>

        <tr [ttRow]="rowNode"
            [ngClass]="{
          'root-node': !rowNode.parent,
          'no-vehicle': rowNode.parent && rowData.children && rowData.children.length > 0,
          'has-vehicle': rowData.vehicle
        }"
            *ngIf="rowData.vehicle">
          <td *ngIf="rowData.vehicle.driver; else noDriver">
                {{ rowData.vehicle.driver.firstName }} {{ rowData.vehicle.driver.lastName || 'Véhicule non attribué' }}
            </td>
          <ng-template #noDriver>
            <td>Véhicule non attribué</td>
          </ng-template>
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
              <span *ngSwitchDefault class="status-icon">Inconnu<i class="pi pi-question-circle"></i></span>
            </ng-container>
          </td>
          <td
            class="custom-cell">{{ rowData.vehicle.device?.deviceDataState?.lastCommTime | date: 'HH:mm  dd-MM-yyyy' }}
          </td>
          <td
            class="custom-cell">
                <span *ngIf="rowData.vehicle.firstTripStart">{{ rowData.vehicle.firstTripStart }}</span>
                <span *ngIf="!rowData.vehicle.firstTripStart">Journée <br/>non commencée</span>
          </td>

          <td class="poi-cell" [ngStyle]="{ 'width': 'auto' }">
            <div style="display: flex; align-items: center; gap: 8px;">
              <span [ngStyle]="{ 'color': rowData.vehicle.lastPositionAddressInfo?.color || 'black' }"
                    class="poi-icon">

              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="30" height="30"
                   [ngStyle]="{ 'fill': rowData.vehicle.lastPositionAddressInfo?.color || 'black'}">
                <path
                  d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62 6.5 12 6.5s2.5 1.12 2.5 2.5S13.38 11.5 12 11.5z"></path>
              </svg>
            </span>

              <span>
            {{ rowData.vehicle.lastPositionAddress ?? 'Adresse inconnue' }}
              </span>
            </div>
          </td>
          <td class="custom-cell">{{ rowData.vehicle.distance?.toFixed(0) ?? 0 }} km</td>
          <td class="custom-cell">
            <p-button (onClick)="this.router.navigate(['trip', rowData.vehicle.id, today])" icon="pi pi-calendar"
                      styleClass="red-button"></p-button>

            <p-button
              *ngIf="rowData.vehicle.driver"
              icon="pi pi-envelope"
              styleClass="red-button"
              (click)="openSmsOverlay(rowData.vehicle.driver.firstName + ' ' + rowData.vehicle.driver.lastName, rowData.vehicle.driver.phoneNumber, '+33','Normandie Manutention' )"
            >
            </p-button>
          </td>
        </tr>

      </ng-template>
    </p-treeTable>

    <div class="overlay" *ngIf="smsOverlayVisible">
      <div class="dialog-box">
        <h3>Envoyer un SMS</h3>
        <div class="dialog-content">
          <app-sms-form
            [driverLabel]="this.smsModalDriverLabel"
            [phoneNumber]="this.smsModalPhoneNumber"
            [callingCode]="this.smsModalCallingCode"
            [companyName]="this.smsModalCompanyName"
            (smsSent)="onSmsSent()"
            (packPurchased)="onPackPurchased()">
          </app-sms-form>
        </div>

        <div class="dialog-footer">
          <button (click)="closeSmsOverlay()">Fermer</button>
        </div>
      </div>
    </div>

  `,
  styles: [`
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

    /*style de colonne état*/
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
      background-color: var(--gray-400);
      color: white;
    }

    :host ::ng-deep .p-treetable.custom-tree-table .UNPLUGGED {
      background-color: var(--gray-400);
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

    /*fin de style de colonne état*/

    /*Style de colonne d'adresse*/
    :host ::ng-deep .p-treeTable.custom-tree-table .poi-icon {
      margin-right: 8px;
      font-size: 1.2em;
      vertical-align: middle;
    }

    .p-treeTable .poi-cell {
      white-space: nowrap;
      width: auto;
      display: flex;
      text-align: left;
      justify-content: space-between;
    }

    /*fin de style de colonne d'adresse*/

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
      font-size: 22px;
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


    /*style de bouton personnalisé*/
    ::ng-deep .p-button.p-component.p-button-info.p-button-raised.custom-button {
      background-color: #aa001f !important;
      border-color: #aa001f !important;
      color: white !important;
      font-weight: 600;
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
export class DashboardComponent implements OnInit, OnDestroy {

  /**
   * Modale SMS
   */
  smsOverlayVisible = false;

  smsModalDriverLabel : string;
  smsModalPhoneNumber : string;
  smsModalCallingCode : string;
  smsModalCompanyName : string;

  // Ouvre la modale
  openSmsOverlay(driverLabel: string, phoneNumber: string, callingCode:string, companyName:string) {
    this.smsModalDriverLabel = driverLabel
    this.smsModalPhoneNumber = phoneNumber
    this.smsModalCallingCode = callingCode
    this.smsModalCompanyName = companyName
    this.smsOverlayVisible = true;
  }

  // Ferme la modale
  closeSmsOverlay() {
    this.smsOverlayVisible = false;
  }

  // Callback quand <app-sms-form> émet (smsSent)
  onSmsSent() {
    console.log("SMS envoyé !");
    // par exemple, recharger une liste, ou afficher un toast...
  }

  // Callback quand <app-sms-form> émet (packPurchased)
  onPackPurchased() {
    console.log("Pack de SMS acheté !");
    // par exemple, recharger l’UI, etc.
  }

  filters: { agencies: string[], vehicles: string[], drivers: string[] } = {
    agencies: [],
    vehicles: [],
    drivers: []
  };
  protected unTrackedVehicle: String = "Liste des véhicules non-communicants : ";
  vehicles: VehicleSummaryDTO[] = [];
  vehiclesTree: TreeNode[] = [];
  @ViewChild(TreeTable) treeTable: TreeTable;
  vehicleStatusCounts: { state: string; count: number }[] = [];
  teamHierarchy: TeamHierarchyNode[];
  today = new Date().toISOString().split('T')[0].replaceAll('-', '');
  isExpanded = true;
  private filtersSubscription?: Subscription

  constructor(
    private filterService: FilterService,
    private readonly vehicleService: VehicleService,
    protected router: Router,
  ) {
  }

  ngOnInit() {
    this.filtersSubscription = this.subscribeToFilterChanges();
  }

  ngOnDestroy(): void {
    this.filtersSubscription?.unsubscribe()
  }

  private subscribeToFilterChanges(): Subscription {
    return this.filterService.filters$.subscribe(filters => {
      this.filters = filters as { agencies: string[], vehicles: string[], drivers: string[] };

      // Fetch the filtered vehicles based on the selected filters
      this.vehicleService.getFilteredVehiclesDashboard(this.filters.agencies, this.filters.vehicles, this.filters.drivers)
        .subscribe(filteredVehicles => {

          this.teamHierarchy = filteredVehicles
          this.vehiclesTree = this.transformToTreeNodes(filteredVehicles)

          const stateCounts = this.calculateStatusCounts(filteredVehicles);
          this.vehicleStatusCounts = [
            {state: 'DRIVING', count: stateCounts['DRIVING'] || 0},
            {state: 'PARKED', count: stateCounts['PARKED'] || 0},
            {state: 'IDLE', count: stateCounts['IDLE'] || 0},
            {state: 'NO_COM', count: stateCounts['NO_COM'] || 0},
            {state: 'UNPLUGGED', count: stateCounts['UNPLUGGED'] || 0},
          ];
        });
    })
  };

  //TODO make it more general (>3 levels)
  //Cette méthode permet de transformer les résultats obtenus par la requête en TreeNode
  transformToTreeNodes(teamNodes: TeamHierarchyNode[]): TreeNode[] {
    // Helper function to sort by label alphabetically
    const sortByLabel = (a: { data: { label: string } }, b: { data: { label: string } }) =>
      a.data.label.localeCompare(b.data.label);

    // Helper function to sort vehicles by driver's lastName and firstName
    const sortByDriverName = (
      a: { data: { vehicle: dto.VehicleTableDTO } },
      b: { data: { vehicle: dto.VehicleTableDTO } }
    ) => {
      const driverA = a.data.vehicle?.driver || { lastName: '', firstName: '' };
      const driverB = b.data.vehicle?.driver || { lastName: '', firstName: '' };

      // First compare by lastName
      const lastNameComparison = driverA.lastName.localeCompare(driverB.lastName);
      if (lastNameComparison !== 0) {
        return lastNameComparison;
      }

      // If lastName is the same, compare by firstName
      return driverA.firstName.localeCompare(driverB.firstName);
    };

    return teamNodes.map((team) => {
      return {
        data: {
          label: team.label,
          vehicle: null,
        },
        expanded: true,
        children: [
          ...(team.children || []).map((child: TeamHierarchyNode) => ({
            data: {
              label: child.label,
              vehicle: null
            },
            expanded: true,
            children: [
              ...(child.vehicles || []).map((vehicle: dto.VehicleTableDTO) => ({
                data: {
                  label: vehicle.licenseplate,
                  vehicle: vehicle,
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

  //Cette méthode permet de calculer le nombre de véhicules pour chaque état
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

    traverseTeams(teams);
    return counts;
  }

  //Cette méthode permet de filtrer les véhicule en fonction du statut sélectionné
  filterByStatus(state: string) {
    if (!Array.isArray(this.teamHierarchy)) {
      console.error('teamHierarchy is not an array or is undefined:', this.teamHierarchy);
      return;
    }
    const filteredHierarchy: TeamHierarchyNode[] = this.teamHierarchy.map((team) => ({
      ...team,
      children: team.children?.map((child) => ({
        ...child,
        vehicles: child.vehicles?.filter((vehicle) => vehicle.device?.deviceDataState?.state === state) || [],
      })).filter((child) => child.vehicles.length > 0) || [], // Remove child nodes without vehicles
      vehicles: team.vehicles?.filter((vehicle) => vehicle.device?.deviceDataState?.state === state) || [], // Filter vehicles at the team level
    })).filter((team) =>
      (team.children?.length || 0) > 0 || team.vehicles.length > 0 // Keep teams with vehicles or children
    );
    // Transformer en TreeNode
    this.teamHierarchy = filteredHierarchy;
    console.log(this.teamHierarchy);
    this.vehiclesTree = this.transformToTreeNodes(filteredHierarchy);

  }

  //Cette méthode permet de donner les informations de chaque état
  getStatusDetails(state: string): { color: string; displayName: string; icon: string } {
    const statusDetails: Record<string, { color: string; displayName: string; icon: string }> = {
      DRIVING: {color: '#21A179', displayName: 'ROULANT(S)', icon: 'pi-play'},
      PARKED: {color: '#C71400', displayName: 'ARRÊTÉ', icon: 'pi-stop'},
      IDLE: {color: '#FE8F2B', displayName: 'À L\'ARRÊT', icon: 'pi-step-forward'},
      NO_COM: {color: '#E0E0E0', displayName: 'SANS SIGNAL', icon: 'pi-times'},
      UNPLUGGED: {color: '#BDBDBD', displayName: 'DÉCONNECTÉ', icon: 'pi-ban'},
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


  //Cette méthode permet d'exporter un fichier CSV
  exportToCSV(): void {
    const csvData = this.convertToCSV(this.teamHierarchy);
    const bom = '\uFEFF';
    const fullData = bom + csvData;
    const blob = new Blob([fullData], {type: 'text/csv;charset=utf-8;'});
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('fr-FR'); // Format: dd/mm/yyyy
    const formattedTime = currentDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}); // Format: hh:mm
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
    const headers = ['Véhicule', 'Immatriculation', 'Marque', 'Modèle', 'Etat', 'Energie', 'Conducteur', 'Dernière communication', 'Heure de départ', 'Adresse', 'Type d\'adresse de référence', 'Distance totale', 'Entité Conducteur', 'Entité Véhicule', 'Groupe de salarié'];
    rows.push(headers.join(','));

    const processNode = (node: TeamHierarchyNode, parentLabel: string = ''): void => {
      const teamLabel = node.label;
      if (node.vehicles) {
        for (const vehicle of node.vehicles) {
          rows.push([
            vehicle.driver?.lastName + '-' + vehicle.licenseplate,
            vehicle.licenseplate,
            vehicle.category.label,
            vehicle.category.label,
            vehicle.device?.deviceDataState?.state,
            vehicle.energy,
            vehicle.driver?.lastName + ' ' + vehicle.driver?.firstName ?? 'Véhicule non attribué',
            this.formatDateTime(vehicle.device?.deviceDataState?.lastPositionTime),
            vehicle.firstTripStart,
            vehicle.lastPositionAddress,
            vehicle.lastPositionAddressInfo?.label,
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

    return rows.join('\n');
  }

  //Cette méthode permet d'agrandir la table et vice versa
  toggleTree() {
    if (this.vehiclesTree && this.vehiclesTree.length > 0) {
      this.isExpanded = !this.isExpanded;
      this.vehiclesTree = this.vehiclesTree.map(vehicle => ({
        ...vehicle,
        expanded: !vehicle.expanded
      }));
    }
  }

  //Cette méthode pour transformer le format de date
  formatDateTime(dateString: Date | null | undefined): string {
    if (!dateString) return '';

    const date = new Date(dateString); // Parse the date string
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
    return formattedDate;
  }
}
