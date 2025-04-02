import {Component, OnDestroy, OnInit, ViewChild} from '@angular/core';
import {FilterService} from "../../commons/navbar/filter.service";
import {TeamHierarchyNode, VehicleService} from "../vehicle/vehicle.service";
import {dto} from "../../../habarta/dto";
import {TreeNode} from "primeng/api";
import {Router} from "@angular/router";
import {TreeTable} from "primeng/treetable";
import VehicleSummaryDTO = dto.VehicleSummaryDTO;
import {Subscription} from "rxjs";
import VehicleDTO = dto.VehicleDTO;
import VehicleLocalizationDTO = dto.VehicleLocalizationDTO;

/** Définition d'une constante pour les détails de statuts (primaires + unplugged) */
const STATUS_DETAILS: Record<string, { displayName: string, color: string, icon: string }> = {
  DRIVING: { displayName: 'ROULANT(S)', color: '#21A179', icon: 'pi-play' },
  PARKED: { displayName: 'ARRÊTÉ', color: '#C71400', icon: 'pi-stop' },
  IDLE: { displayName: 'À L\'ARRÊT', color: '#FE8F2B', icon: 'pi-step-forward' },
  NO_COM: { displayName: 'SANS SIGNAL', color: '#E0E0E0', icon: 'pi-times' },
  UNPLUGGED: { displayName: 'DÉCONNECTÉ', color: '#BDBDBD', icon: 'pi-ban' }
};

/** Interface pour représenter un statut dans toggle-buttons-group */
interface StatusCount {
  state: string;
  count: number;
  displayName: string;
  color: string;
  icon: string;
}

@Component({
  selector: 'app-dashboard',
  template: `
    <!-- Barres de filtres statuts via toggle-buttons-group -->
    <div class="status-buttons">
      <!-- Statuts primaires : DRIVING, PARKED, IDLE, NO_COM -->
      <app-toggle-buttons-group
        [items]="primaryStatusCounts"
        [selectedItem]="selectedPrimaryStatus"
        [identifierFn]="primaryIdentifierFn"
        [displayFn]="primaryDisplayFn"
        [colorFn]="primaryColorFn"
        [iconFn]="primaryIconFn"
        (selectionChange)="onPrimaryStatusChange($event)"
        buttonWidth="19vw">
      </app-toggle-buttons-group>

      <!-- Statut unplugged -->
      <app-toggle-buttons-group
        [items]="unpluggedStatusCounts"
        [selectedItem]="selectedUnpluggedStatus"
        [identifierFn]="unpluggedIdentifierFn"
        [displayFn]="unpluggedDisplayFn"
        [colorFn]="unpluggedColorFn"
        [iconFn]="unpluggedIconFn"
        (selectionChange)="onUnpluggedStatusChange($event)"
        buttonWidth="19vw">
      </app-toggle-buttons-group>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <p-button [raised]="true" severity="info" icon="pi pi-sync" (click)="loadFilteredVehicles()"
                styleClass="custom-button"></p-button>
      <p-button [raised]="true" severity="info" icon="{{ isExpanded ? 'pi pi-minus' : 'pi pi-plus' }}"
                (click)="toggleTree()" styleClass="custom-button"></p-button>
      <p-button label="Exporter CSV" [raised]="true" severity="info" (click)="exportToCSV()"
                styleClass="custom-button"></p-button>
    </div>

    <div style="margin-bottom: 10px;"></div>

    <!-- On vérifie vehiclesTree et sa longueur pour éviter un affichage vide -->
    <p-treeTable *ngIf="vehiclesTree && vehiclesTree.length > 0"
                 #treeTable
                 [value]="vehiclesTree"
                 [scrollable]="true"
                 [tableStyle]="{'width': '95%', 'margin': '0 auto' , 'table-layout' :'auto'}"
                 [resizableColumns]="true"
                 styleClass="p-treetable-gridlines custom-tree-table">

      <!-- En-tête (facultatif si vous n’affichez pas de colonnes en-tête statiques) -->
      <ng-template pTemplate="header">
      </ng-template>

      <!-- Template du body du treeTable -->
      <ng-template pTemplate="body" let-rowNode let-rowData="rowData">
        <!-- Lignes parent (pas de véhicule -> colspan=8) -->
        <tr [ttRow]="rowNode"
            [ngClass]="{
              'root-node': !rowNode.parent,
              'no-vehicle': rowNode.parent && rowData.children && rowData.children.length > 0,
              'has-vehicle': rowData.vehicle
            }"
            *ngIf="!rowData.vehicle">
          <td colspan="8">
            <p-treeTableToggler [rowNode]="rowNode"></p-treeTableToggler>
            {{ rowData.label }}
          </td>
        </tr>

        <!-- Ligne d'en-tête pour les colonnes quand c’est un root-node -->
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

        <!-- Ligne pour les véhicules (rowData.vehicle != null) -->
        <tr [ttRow]="rowNode"
            [ngClass]="{
              'root-node': !rowNode.parent,
              'no-vehicle': rowNode.parent && rowData.children && rowData.children.length > 0,
              'has-vehicle': rowData.vehicle
            }"
            *ngIf="rowData.vehicle">
          <!-- 1. Conducteur -->
          <td *ngIf="rowData.vehicle.driver; else noDriver">
            {{ rowData.vehicle.driver.firstName }} {{ rowData.vehicle.driver.lastName || 'Véhicule non attribué' }}
          </td>
          <ng-template #noDriver>
            <td>Véhicule non attribué</td>
          </ng-template>

          <!-- 2. Immatriculation -->
          <td>{{ rowData.label }}</td>

          <!-- 3. État -->
          <td [ngClass]="{
              'DRIVING': rowData.vehicle.device?.deviceDataState?.state === 'DRIVING',
              'PARKED': rowData.vehicle.device?.deviceDataState?.state === 'PARKED',
              'IDLE': rowData.vehicle.device?.deviceDataState?.state === 'IDLE',
              'NO_COM': rowData.vehicle.device?.deviceDataState?.state === 'NO_COM',
              'UNPLUGGED': rowData.vehicle.device?.deviceDataState?.state === 'UNPLUGGED',
              'DEFAULT': rowData.vehicle.device?.deviceDataState?.state === null
            }">
            <ng-container [ngSwitch]="rowData.vehicle.device?.deviceDataState?.state">
              <span *ngSwitchCase="'DRIVING'" class="status-icon">
                Roulant <div><i class="pi pi-play"></i>
                  <img *ngIf="rowData.vehicle.device?.deviceDataState?.plugged === false"
                       ngSrc="../../../assets/icon/unplugged.svg"
                       alt="unplugged" height="16" width="16"
                       style="float: right; margin-left: 8px;">
                </div>
              </span>
              <span *ngSwitchCase="'IDLE'" class="status-icon">À l'arrêt
                <div>
                <i class="pi pi-step-forward"></i>
                <img *ngIf="rowData.vehicle.device?.deviceDataState?.plugged == false"
                     ngSrc="../../../assets/icon/unplugged.svg"
                     alt="unplugged"
                     height="16"
                     width="16"
                     style="float: right; margin-left: 8px;"
                /></div>
              </span>
              <span *ngSwitchCase="'PARKED'" class="status-icon">Arrêté
                <div><i class="pi pi-stop"></i>
                  <img *ngIf="rowData.vehicle.device?.deviceDataState?.plugged == false"
                       ngSrc="../../../assets/icon/unplugged.svg"
                       alt="unplugged"
                       height="16"
                       width="16"
                       style="float: right; margin-left: 8px;"
                  /></div>
                </span>
              <span *ngSwitchCase="'NO_COM'" class="status-icon">Aucun signal
                <div>
                  <i class="pi pi-times"></i>
                  <img *ngIf="rowData.vehicle.device?.deviceDataState?.plugged == false"
                       ngSrc="../../../assets/icon/unplugged.svg"
                       alt="unplugged"
                       height="16" width="16"
                       style="float: right;
                       margin-left: 8px;"/>
                </div></span>
              <span *ngSwitchCase="'UNPLUGGED'" class="status-icon">Déconnecté
                <div>
                  <i class="pi pi-ban"></i>
                  <img *ngIf="rowData.vehicle.device?.deviceDataState?.plugged == false"
                       ngSrc="../../../assets/icon/unplugged.svg"
                       alt="unplugged"
                       height="16"
                       width="16"
                       style="float: right; margin-left: 8px;"
                  /></div>
                </span>
              <span *ngSwitchDefault class="status-icon">
                Inconnu <div><i class="pi pi-question-circle"></i>
                  <img *ngIf="rowData.vehicle.device?.deviceDataState?.plugged === false"
                       ngSrc="../../../assets/icon/unplugged.svg"
                       alt="unplugged" height="16" width="16"
                       style="float: right; margin-left: 8px;">
                </div>
              </span>
            </ng-container>
          </td>

          <!-- 4. Dernière communication -->
          <td class="custom-cell">
            {{ rowData.vehicle.device?.deviceDataState?.lastCommTime | date: 'HH:mm  dd-MM-yyyy' }}
          </td>

          <!-- 5. Heure de départ -->
          <td class="custom-cell">
            <span *ngIf="rowData.vehicle.firstTripStart; else notStarted">
              {{ rowData.vehicle.firstTripStart }}
            </span>
            <ng-template #notStarted>
              Journée <br/>non commencée
            </ng-template>
          </td>

          <!-- 6. Adresse (exemple avec un composant app-mask-toggle) -->
          <td class="poi-cell" [ngStyle]="{ 'width': 'auto' }">
            <app-mask-toggle
              [canMask]="isVehicleInLunchBreak(rowData.vehicle)"
              [canToggle]="false">
              <ng-template #maskedTemplate>
                <!-- ... -->
              </ng-template>
              <ng-template #unmaskedTemplate>
                <!-- ... -->
              </ng-template>
            </app-mask-toggle>
          </td>

          <!-- 7. Distance totale -->
          <td class="custom-cell">
            {{ rowData.vehicle.distance?.toFixed(0) ?? 0 }} km
          </td>

          <!-- 8. Bouton d'action -->
          <td class="custom-cell">
            <p-button (onClick)="router.navigate(['trip', rowData.vehicle.id, today])"
                      icon="pi pi-calendar"
                      styleClass="red-button">
            </p-button>
            <p-button *ngIf="rowData.vehicle.driver"
                      icon="pi pi-envelope"
                      styleClass="red-button"
                      (click)="openSmsOverlay(
                        rowData.vehicle.driver.firstName + ' ' + rowData.vehicle.driver.lastName,
                        rowData.vehicle.driver.phoneNumber,
                        '+33',
                        'Normandie Manutention'
                      )">
            </p-button>
          </td>
        </tr>
      </ng-template>
    </p-treeTable>

    <!-- Modale SMS identique à la version initiale -->
    <div class="overlay" *ngIf="smsOverlayVisible">
      <div class="dialog-box">
        <h3>Envoyer un SMS</h3>
        <div class="dialog-content">
          <app-sms-form
            [driverLabel]="smsModalDriverLabel"
            [phoneNumber]="smsModalPhoneNumber"
            [callingCode]="smsModalCallingCode"
            [companyName]="smsModalCompanyName"
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
    /* Styles inchangés pour préserver l’apparence et éviter toute régression */
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
      align-items: center;
    }
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
      color: white !important;
      padding: 0 5px !important;
      font-weight: bold !important;
      margin-right: 10px !important;
    }
    .custom-status-button .status-text {
      color: var(--button-color, #007bff);
    }
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
   * Propriétés pour la modale SMS
   */
  smsOverlayVisible = false;
  smsModalDriverLabel: string;
  smsModalPhoneNumber: string;
  smsModalCallingCode: string;
  smsModalCompanyName: string;

  /**
   * Filtres
   */
  filters: { agencies: string[], vehicles: string[], drivers: string[] } = { agencies: [], vehicles: [], drivers: [] };

  /**
   * Les données brutes (non filtrées) pour garder la hiérarchie initiale
   */
  originalTeamHierarchy: TeamHierarchyNode[];
  teamHierarchy: TeamHierarchyNode[];

  /**
   * Arbre utilisé par le p-treeTable
   */
  vehiclesTree: TreeNode[] = [];
  @ViewChild(TreeTable) treeTable: TreeTable;

  /**
   * Statistiques de statuts (primaires et unplugged)
   */
  primaryStatusCounts: StatusCount[] = [];
  unpluggedStatusCounts: StatusCount[] = [];

  /**
   * Sélection courante dans chaque groupe de boutons
   */
  selectedPrimaryStatus: StatusCount | null = null;
  selectedUnpluggedStatus: StatusCount | null = null;

  private filtersSubscription?: Subscription;
  today = new Date().toISOString().split('T')[0].replaceAll('-', '');
  isExpanded = true;

  constructor(
    private filterService: FilterService,
    private readonly vehicleService: VehicleService,
    public router: Router,
  ) {}

  ngOnInit() {
    this.filtersSubscription = this.subscribeToFilterChanges();
  }

  ngOnDestroy(): void {
    this.filtersSubscription?.unsubscribe();
  }

  private subscribeToFilterChanges(): Subscription {
    return this.filterService.filters$.subscribe(filters => {
      this.filters = filters as { agencies: string[], vehicles: string[], drivers: string[] };
      this.loadFilteredVehicles();
    });
  }

  primaryIdentifierFn = (item: StatusCount) => item.state;
  primaryDisplayFn    = (item: StatusCount) => `${item.displayName}`;
  primaryColorFn      = (item: StatusCount) => item.color;
  primaryIconFn       = (item: StatusCount) => item.icon;

  unpluggedIdentifierFn = (item: StatusCount) => item.state;
  unpluggedDisplayFn    = (item: StatusCount) => `${item.displayName}`;
  unpluggedColorFn      = (item: StatusCount) => item.color;
  unpluggedIconFn       = (item: StatusCount) => item.icon;


  loadFilteredVehicles(): void {
    this.vehicleService.getFilteredVehiclesDashboard(
      this.filters.agencies,
      this.filters.vehicles,
      this.filters.drivers
    ).subscribe(filteredVehicles => {
      // On stocke la hiérarchie brute pour un futur filtrage combiné
      this.originalTeamHierarchy = filteredVehicles;
      this.teamHierarchy = filteredVehicles;

      // Transforme la hiérarchie en TreeNodes pour le p-treeTable
      this.vehiclesTree = this.transformToTreeNodes(filteredVehicles);

      // Calcule les compteurs pour les statuts primaires et unplugged
      this.primaryStatusCounts = this.calculatePrimaryStatusCounts(filteredVehicles);
      this.unpluggedStatusCounts = this.calculateUnpluggedStatusCounts(filteredVehicles);

      // Réinitialise la sélection dans les deux groupes
      this.selectedPrimaryStatus = null;
      this.selectedUnpluggedStatus = null;
    });
  }

  transformToTreeNodes(teamNodes: TeamHierarchyNode[]): TreeNode[] {
    const sortByLabel = (a: { data: { label: string } }, b: { data: { label: string } }) =>
      a.data.label.localeCompare(b.data.label);

    const sortByDriverName = (
      a: { data: { vehicle: dto.VehicleTableDTO } },
      b: { data: { vehicle: dto.VehicleTableDTO } }
    ) => {
      const driverA = a.data.vehicle?.driver || { lastName: '', firstName: '' };
      const driverB = b.data.vehicle?.driver || { lastName: '', firstName: '' };
      const lastNameComparison = driverA.lastName.localeCompare(driverB.lastName);
      return lastNameComparison !== 0
        ? lastNameComparison
        : driverA.firstName.localeCompare(driverB.firstName);
    };

    return teamNodes.map(team => ({
      data: { label: team.label, vehicle: null },
      expanded: true,
      children: (team.children || []).map(child => ({
        data: { label: child.label, vehicle: null },
        expanded: true,
        children: (child.vehicles || [])
          .map((vehicle: dto.VehicleTableDTO) => ({
            data: { label: vehicle.licenseplate, vehicle },
            expanded: true,
            children: []
          }))
          .sort(sortByDriverName)
      })).sort(sortByLabel)
    })).sort(sortByLabel);
  }

  calculatePrimaryStatusCounts(teamNodes: TeamHierarchyNode[]): StatusCount[] {
    const primaryStates = ['DRIVING', 'PARKED', 'IDLE', 'NO_COM'];
    const counts: Record<string, number> = {};

    const traverse = (nodes: TeamHierarchyNode[]) => {
      nodes.forEach(team => {
        team.vehicles.forEach(vehicle => {
          const st = vehicle.device?.deviceDataState?.state;
          if (st && primaryStates.includes(st)) {
            counts[st] = (counts[st] || 0) + 1;
          }
        });
        if (team.children) traverse(team.children);
      });
    };
    traverse(teamNodes);

    // Construit la liste de statuts à partir de STATUS_DETAILS
    return primaryStates.map(state => ({
      state,
      count: counts[state] || 0,
      displayName: STATUS_DETAILS[state].displayName,
      color: STATUS_DETAILS[state].color,
      icon: STATUS_DETAILS[state].icon,
    }));
  }

  calculateUnpluggedStatusCounts(teamNodes: TeamHierarchyNode[]): StatusCount[] {
    let unpluggedCount = 0;

    const traverse = (nodes: TeamHierarchyNode[]) => {
      nodes.forEach(team => {
        team.vehicles.forEach(vehicle => {
          // On compte si plugged === false
          if (vehicle.device?.deviceDataState?.plugged === false) {
            unpluggedCount++;
          }
        });
        if (team.children) traverse(team.children);
      });
    };
    traverse(teamNodes);

    return [{
      state: 'UNPLUGGED',
      count: unpluggedCount,
      displayName: STATUS_DETAILS['UNPLUGGED'].displayName,
      color: STATUS_DETAILS['UNPLUGGED'].color,
      icon: STATUS_DETAILS['UNPLUGGED'].icon
    }];
  }

  filterVehicles(): void {
    if (!this.originalTeamHierarchy) {
      console.error('Aucune donnée d’origine disponible pour filtrer.');
      return;
    }
    // Si aucun statut n'est sélectionné, on réaffiche tout
    if (!this.selectedPrimaryStatus && !this.selectedUnpluggedStatus) {
      this.teamHierarchy = this.originalTeamHierarchy;
      this.vehiclesTree = this.transformToTreeNodes(this.originalTeamHierarchy);
      return;
    }

    const filteredHierarchy: TeamHierarchyNode[] = this.originalTeamHierarchy.map(team => {
      // Filtrage des vehicles
      const filteredVehicles = (team.vehicles || []).filter(vehicle => {
        let primaryOk = true;
        let unpluggedOk = true;

        // Vérifie le statut primaire
        if (this.selectedPrimaryStatus) {
          primaryOk = (vehicle.device?.deviceDataState?.state === this.selectedPrimaryStatus.state);
        }

        // Vérifie la déconnexion
        if (this.selectedUnpluggedStatus) {
          unpluggedOk = (vehicle.device?.deviceDataState?.plugged === false);
        }
        return primaryOk && unpluggedOk;
      });

      // Filtrage récursif sur les enfants
      const filteredChildren = (team.children || []).map(child => {
        const childFilteredVehicles = child.vehicles.filter(vehicle => {
          let primaryOk = true;
          let unpluggedOk = true;

          if (this.selectedPrimaryStatus) {
            primaryOk = (vehicle.device?.deviceDataState?.state === this.selectedPrimaryStatus.state);
          }
          if (this.selectedUnpluggedStatus) {
            unpluggedOk = (vehicle.device?.deviceDataState?.plugged === false);
          }
          return primaryOk && unpluggedOk;
        });
        return {
          ...child,
          vehicles: childFilteredVehicles
        };
      }).filter(c => c.vehicles && c.vehicles.length > 0);

      return {
        ...team,
        vehicles: filteredVehicles,
        children: filteredChildren
      };
    }).filter(t =>
      (t.vehicles && t.vehicles.length > 0) || (t.children && t.children.length > 0)
    );

    // Met à jour la hiérarchie filtrée et le TreeTable
    this.teamHierarchy = filteredHierarchy;
    this.vehiclesTree = this.transformToTreeNodes(filteredHierarchy);
  }

  onPrimaryStatusChange(selected: StatusCount | null): void {
    this.selectedPrimaryStatus = selected;
    // Filtre la hiérarchie en fonction de la nouvelle sélection
    this.filterVehicles();
  }

  onUnpluggedStatusChange(selected: StatusCount | null): void {
    this.selectedUnpluggedStatus = selected;
    this.filterVehicles();
  }

  exportToCSV(): void {
    const csvData = this.convertToCSV(this.teamHierarchy);
    const bom = '\uFEFF';
    const fullData = bom + csvData;
    const blob = new Blob([fullData], { type: 'text/csv;charset=utf-8;' });
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('fr-FR');
    const formattedTime = currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const fileName = `Positions Au ${formattedDate} ${formattedTime}.csv`.replace(/[:]/g, '-');
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
    const headers = [
      'Véhicule', 'Immatriculation', 'Marque', 'Modèle', 'Etat', 'Energie', 'Conducteur',
      'Dernière communication', 'Heure de départ', 'Adresse', 'Type d\'adresse de référence',
      'Distance totale', 'Entité Conducteur', 'Entité Véhicule', 'Groupe de salarié'
    ];
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
            vehicle.driver
              ? (vehicle.driver.lastName + ' ' + vehicle.driver.firstName)
              : 'Véhicule non attribué',
            this.formatDateTime(vehicle.device?.deviceDataState?.lastPositionTime),
            vehicle.firstTripStart,
            vehicle.lastPositionAddress,
            vehicle.lastPositionAddressInfo?.label,
            vehicle.distance?.toString() ?? '0',
            vehicle.driver?.team.label ?? '',
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

  toggleTree(): void {
    if (this.vehiclesTree && this.vehiclesTree.length > 0) {
      this.isExpanded = !this.isExpanded;
      this.vehiclesTree = this.vehiclesTree.map(vehicle => ({
        ...vehicle,
        expanded: this.isExpanded
      }));
    }
  }

  formatDateTime(dateString: Date | null | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  }

  isVehicleInLunchBreak(vehicle: VehicleSummaryDTO | VehicleDTO | VehicleLocalizationDTO): boolean {
    if (!vehicle.ranges) return false;
    const lunchBreak = vehicle.ranges.find(r => r.label === 'LUNCH_BREAK');
    if (!lunchBreak) return false;
    const nowParisString = new Date().toLocaleString('fr-FR', { timeZone: 'Europe/Paris', hour12: false });
    const nowHoursMinutes = nowParisString.split(' ')[1].substring(0, 5);
    const startDate = new Date(lunchBreak.range.start);
    const endDate = lunchBreak.range.end ? new Date(lunchBreak.range.end) : null;
    if (!endDate) return false;
    const startHoursMinutes = startDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris', hour12: false })
      .split(' ')[1]
      .substring(0, 5);
    const endHoursMinutes = endDate.toLocaleString('fr-FR', { timeZone: 'Europe/Paris', hour12: false })
      .split(' ')[1]
      .substring(0, 5);
    return (startHoursMinutes <= nowHoursMinutes && nowHoursMinutes <= endHoursMinutes);
  }

  getLunchBreakRangeDescription(vehicle: VehicleSummaryDTO | VehicleDTO | VehicleLocalizationDTO): string {
    if (!vehicle.ranges) return '';
    const lunchBreak = vehicle.ranges.find(r => r.label === 'LUNCH_BREAK');
    return lunchBreak?.description ?? '';
  }

  openSmsOverlay(driverLabel: string, phoneNumber: string, callingCode: string, companyName: string): void {
    this.smsModalDriverLabel = driverLabel;
    this.smsModalPhoneNumber = phoneNumber;
    this.smsModalCallingCode = callingCode;
    this.smsModalCompanyName = companyName;
    this.smsOverlayVisible = true;
  }

  closeSmsOverlay(): void {
    this.smsOverlayVisible = false;
  }

  onSmsSent(): void {
    this.closeSmsOverlay();
  }

  onPackPurchased(): void {
    console.log("Pack de SMS acheté !");
  }
}
