import {Component, OnDestroy, OnInit, ViewChild, ViewEncapsulation} from '@angular/core';
import {FilterService} from "../../commons/navbar/filter.service";
import {TeamHierarchyNode, TeamHierarchyNodeBase, VehicleService} from "../vehicle/vehicle.service";
import {dto} from "../../../habarta/dto";
import {TreeNode} from "primeng/api";
import {Router} from "@angular/router";
import {
  DatePipe,
  NgClass,
  NgIf,
  NgOptimizedImage,
  NgStyle,
  NgSwitch,
  NgSwitchCase,
  NgSwitchDefault
} from "@angular/common";
import {TreeTable, TreeTableModule} from "primeng/treetable";
import VehicleSummaryDTO = dto.VehicleSummaryDTO;
import {Subscription} from "rxjs";
import VehicleDTO = dto.VehicleDTO;
import VehicleLocalizationDTO = dto.VehicleLocalizationDTO;
import {ButtonModule} from "primeng/button";
import {SmsFormComponent} from "../sms/sms-form/sms-form.component";
import {MaskToggleComponent} from "../../commons/mask-toggle/mask-toggle.component";
import {ToggleButtonsGroupComponent} from "../../commons/toggle-button-group/toggle-button-group.component";

/** Définition d'une constante pour les détails de statuts (primaires + unplugged) */
const STATUS_DETAILS: Record<string, { displayName: string, color: string, icon: string }> = {
  DRIVING: { displayName: 'ROULANT(S)', color: '#21A179', icon: 'pi pi-play' },
  PARKED: { displayName: 'ARRÊTÉ', color: '#C71400', icon: 'pi pi-stop' },
  IDLE: { displayName: 'À L\'ARRÊT', color: '#FE8F2B', icon: 'pi pi-step-forward' },
  NO_COM: { displayName: 'SANS SIGNAL', color: '#E0E0E0', icon: 'pi pi-times' },
  UNPLUGGED: { displayName: 'DÉCONNECTÉ', color: '#BDBDBD', icon: 'pi pi-ban' }
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
        buttonWidth="18.5vw">
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
        buttonWidth="18.5vw">
      </app-toggle-buttons-group>
    </div>

    <div style="display: flex; justify-content: flex-end; gap: 10px;">
      <p-button icon="pi pi-sync" (click)="loadFilteredVehicles()"></p-button>
      <p-button icon="{{ isExpanded ? 'pi pi-minus' : 'pi pi-plus' }}"
                (click)="toggleTree()"></p-button>
      <p-button label="Exporter CSV" (click)="exportToCSV()"
                ></p-button>
    </div>

    <div style="margin-bottom: 10px;"></div>

    <!-- On vérifie vehiclesTree et sa longueur pour éviter un affichage vide -->
    <p-treeTable *ngIf="vehiclesTree && vehiclesTree.length > 0"
                 #treeTable
                 [value]="vehiclesTree"
                 [scrollable]="true"
                 [tableStyle]="{'width': '96vw', 'margin': '0 auto' , 'table-layout' :'auto'}"
                 [resizableColumns]="true"
                 styleClass="p-treetable-gridlines">

      <!-- En-tête (facultatif si vous n’affichez pas de colonnes en-tête statiques) -->
      <ng-template pTemplate="header">
      </ng-template>

      <!-- Template du body du treeTable -->
      <ng-template pTemplate="body" let-rowNode let-rowData="rowData">
        <!-- Lignes parent (pas de véhicule -> colspan=8) -->
        <tr [ttRow]="rowNode"
            [ngClass]="{
          'dynamic-tt-parent-node': !rowNode.parent,
          'no-vehicle': rowNode.parent && rowData.children && rowData.children.length > 0,
          'dynamic-tt-leaf': rowData.vehicle
        }">
          <td *ngIf="!rowData.vehicle" colspan="8">
            <p-treeTableToggler class="dynamic-tt-togglerButton" [rowNode]="rowNode"/>
            {{ rowData.label }}
          </td>
        </tr>

        <!-- Ligne d'en-tête pour les colonnes quand c’est un root-node -->
        <tr [ttRow]="rowNode"
            *ngIf="!rowNode.parent"
            class="dynamic-tt-header">
          <td>Conducteur</td>
          <td>Immatriculation</td>
          <td>État</td>
          <td>Dernière communication</td>
          <td>Heure de départ</td>
          <td *ngIf="!non_geoloc">Adresse</td>
          <td>Distance totale</td>
          <td>Action</td>
        </tr>

        <!-- Ligne pour les véhicules (rowData.vehicle != null) -->
        <tr [ttRow]="rowNode"
            [ngClass]="{
          'dynamic-tt-parent-node': !rowNode.parent,
          'no-vehicle': rowNode.parent && rowData.children && rowData.children.length > 0,
          'dynamic-tt-leaf': rowData.vehicle
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
          <td>
            {{ rowData.vehicle.device?.deviceDataState?.lastCommTime | date: 'HH:mm  dd-MM-yyyy' }}
          </td>

          <!-- 5. Heure de départ -->
          <td>
            <span *ngIf="rowData.vehicle.firstTripStart; else notStarted">
              {{ rowData.vehicle.firstTripStart }}
            </span>
            <ng-template #notStarted>
              Journée <br/>non commencée
            </ng-template>
          </td>

          <!-- 6. Adresse -->
          <td *ngIf="!non_geoloc" class="poi-cell" [ngStyle]="{ 'width': 'auto' }">
            <app-mask-toggle
              [canMask]="isVehicleInLunchBreak(rowData.vehicle)"
              [canToggle]="false"
            >
              <!-- Template MASQUÉ : icône lunch-break + texte range -->
              <ng-template #maskedTemplate>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <img
                    ngSrc="../../../assets/icon/lunch-break.svg"
                    width="30"
                    height="30"
                    alt="Pause midi icon"
                  />
                  <span>{{ getLunchBreakRangeDescription(rowData.vehicle) }}</span>
                </div>
              </ng-template>

              <!-- Template NON MASQUÉ : la logique historique -->
              <ng-template #unmaskedTemplate>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <!-- Vérifie si l'adresse commence par 'pause midi' -->
                  <ng-container
                    *ngIf="rowData.vehicle.lastPositionAddress?.startsWith('pause déjeuner'); else defaultIcon">
                    <img
                      ngSrc="../../../assets/icon/lunch-break.svg"
                      width="30"
                      height="30"
                      alt="Pause midi icon"
                    />
                  </ng-container>

                  <!-- Sinon, on affiche le SVG existant -->
                  <ng-template #defaultIcon>
                    <span
                      [ngStyle]="{ 'color': rowData.vehicle.lastPositionAddressInfo?.color || 'black' }"
                      class="poi-icon"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                        width="30"
                        height="30"
                        [ngStyle]="{ 'fill': rowData.vehicle.lastPositionAddressInfo?.color || 'black'}"
                      >
                        <path
                          d="M12 2C8.13 2 5 5.13 5 9
                            c0 5.25 7 13 7 13s7-7.75 7-13
                            c0-3.87-3.13-7-7-7zm0
                            9.5c-1.38 0-2.5-1.12-2.5-2.5S10.62
                            6.5 12 6.5s2.5 1.12 2.5 2.5S13.38
                            11.5 12 11.5z"
                        ></path>
                      </svg>
                    </span>
                  </ng-template>
                  <!-- L'adresse s'affiche (que ce soit 'pause midi...' ou non) -->
                  <span
                    [title]="rowData.vehicle.lastPositionDate
                            ? ('Position calculée à ' + (rowData.vehicle.lastPositionDate | date:'dd/MM/yyyy HH:mm:ss':'Europe/Paris'))
                            : 'Erreur lors de la récupération de l\\'heure de la position'"
                  >
                    {{ rowData.vehicle.lastPositionAddress ?? 'Adresse inconnue' }}
                  </span>
                </div>
              </ng-template>
            </app-mask-toggle>
          </td>

          <!-- 7. Distance totale -->
          <td>
            {{ rowData.vehicle.distance?.toFixed(0) ?? 0 }} km
          </td>

          <!-- 8. Bouton d'action -->
          <td>
            <p-button (onClick)="router.navigate(['trip'+(non_geoloc?'-non-geoloc':''), rowData.vehicle.id, today])"
                      icon="pi pi-calendar"
                      [style]="{ 'margin-right': '5px' }">
            </p-button>
            <p-button *ngIf="!non_geoloc && rowData.vehicle.driver"
                      icon="pi pi-envelope"
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
          <p-button (click)="closeSmsOverlay()" label="Fermer"></p-button>
        </div>
      </div>
    </div>
  `,
  standalone: true,
  imports: [

    NgStyle,
    NgClass,
    TreeTableModule,
    NgIf,
    NgOptimizedImage,
    NgSwitchDefault,
    NgSwitchCase,
    NgSwitch,
    DatePipe,
    SmsFormComponent,
    ButtonModule,
    MaskToggleComponent,
    ToggleButtonsGroupComponent
  ],
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
    .DRIVING {
      background-color: #21A179;
      color: white;
    }
    .IDLE {
      background-color: #FE8F2B;
      color: white;
    }
    .PARKED {
      background-color: #C71400;
      color: white;
    }
    .NO_COM {
      background-color: #E0E0E0;
      color: white;
    }
    .UNPLUGGED {
      background-color: #BDBDBD;
      color: white;
    }
    .DEFAULT {
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

    .p-treeTable .poi-cell {
      white-space: nowrap;
      width: auto;
      display: flex;
      text-align: left;
      justify-content: space-between;
    }

    /*fin de style de colonne d'adresse*/

    /* Icônes de statut (span + i) */
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

    /* Conteneur et style des boutons d'indicateurs */
    .status-buttons {
      display: flex;
      gap: 15px;
      justify-content: center;
      align-items: center;
      width : 96vw;
      margin : 0 auto;
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

    /* Overlay + dialog SMS */
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
      z-index: 9998;
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
  `]}
)
export class DashboardComponent implements OnInit, OnDestroy {
  /**
   * Propriétés pour la modale SMS
   */
  smsOverlayVisible = false;
  smsModalDriverLabel: string;
  smsModalPhoneNumber: string;
  smsModalCallingCode: string;
  smsModalCompanyName: string;

  non_geoloc : boolean = false;

  // Ouvre la modale
  openSmsOverlay(driverLabel: string, phoneNumber: string, callingCode: string, companyName: string) {
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
  /**
   * Filtres
   */
  filters: { agencies: string[], vehicles: string[], drivers: string[] } = { agencies: [], vehicles: [], drivers: [] };

  /**
   * Les données brutes (non filtrées) pour garder la hiérarchie initiale
   */
  originalTeamHierarchy: TeamHierarchyNode<dto.VehicleTableDTO>[];
  teamHierarchy: TeamHierarchyNode<dto.VehicleTableDTO>[];

  // Callback quand <app-sms-form> émet (smsSent)
  onSmsSent() {
    this.closeSmsOverlay()
  }

  // Callback quand <app-sms-form> émet (packPurchased)
  onPackPurchased() {
    console.log("Pack de SMS acheté !");
  }

  protected unTrackedVehicle: String = "Liste des véhicules non-communicants : ";
  vehicles: VehicleSummaryDTO[] = [];
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

  today = new Date().toISOString().split('T')[0].replaceAll('-', '');
  isExpanded = true;
  private filtersSubscription?: Subscription

  constructor(
    private filterService: FilterService,
    private readonly vehicleService: VehicleService,
    protected router: Router,
  ) {
    this.non_geoloc = location.pathname.indexOf('-non-geoloc')>0
  }

  ngOnInit() {
    this.non_geoloc = location.pathname.indexOf('-non-geoloc')>0
    this.filtersSubscription = this.subscribeToFilterChanges();
  }

  ngOnDestroy(): void {
    this.filtersSubscription?.unsubscribe();
  }

  primaryIdentifierFn = (item: StatusCount) => item.state;
  primaryDisplayFn    = (item: StatusCount) => `${item.displayName}`;
  primaryColorFn      = (item: StatusCount) => item.color;
  primaryIconFn       = (item: StatusCount) => item.icon;

  unpluggedIdentifierFn = (item: StatusCount) => item.state;
  unpluggedDisplayFn    = (item: StatusCount) => `${item.displayName}`;
  unpluggedColorFn      = (item: StatusCount) => item.color;
  unpluggedIconFn       = (item: StatusCount) => item.icon;


  loadFilteredDataAndFilters(filteredVehicles : TeamHierarchyNodeBase[]) : void{
    // On stocke la hiérarchie brute pour un futur filtrage combiné
    this.originalTeamHierarchy = filteredVehicles;
    this.teamHierarchy = filteredVehicles;

    // Transforme la hiérarchie en TreeNodes pour le p-treeTable
    this.vehiclesTree = VehicleService.transformToTreeNodes(
      filteredVehicles,
      (vehicle: dto.VehicleTableDTO) => ({
        driverName: vehicle.driver ? `${vehicle.driver.lastName} ${vehicle.driver.firstName}` : '',
        licensePlate: vehicle.licenseplate,
      })
    );
    // Calcule les compteurs pour les statuts primaires et unplugged
    this.primaryStatusCounts = this.calculatePrimaryStatusCounts(filteredVehicles);
    this.unpluggedStatusCounts = this.calculateUnpluggedStatusCounts(filteredVehicles);

    // Réinitialise la sélection dans les deux groupes
    this.selectedPrimaryStatus = null;
    this.selectedUnpluggedStatus = null;
  }

  loadFilteredVehicles(): void {

    if (this.non_geoloc) {
      this.vehicleService.getFilteredNonGeolocVehiclesDashboard(
        this.filters.agencies,
        this.filters.vehicles,
        this.filters.drivers
      ).subscribe(filteredVehicles => {
        this.loadFilteredDataAndFilters(filteredVehicles)
      });
    }
    else {
      this.vehicleService.getFilteredVehiclesDashboard(
        this.filters.agencies,
        this.filters.vehicles,
        this.filters.drivers
      ).subscribe(filteredVehicles => {
        this.loadFilteredDataAndFilters(filteredVehicles)
      });
    }

  }


  private subscribeToFilterChanges(): Subscription {
    return this.filterService.filters$.subscribe(filters => {
      this.filters = filters as { agencies: string[], vehicles: string[], drivers: string[] };
      this.loadFilteredVehicles();
    })
  };


  //Cette méthode permet de calculer le nombre de véhicules pour chaque état
  calculatePrimaryStatusCounts(teamNodes: TeamHierarchyNodeBase[]): StatusCount[] {
    const primaryStates = ['DRIVING', 'PARKED', 'IDLE', 'NO_COM'];
    const counts: Record<string, number> = {};

    const traverse = (nodes: TeamHierarchyNodeBase[]) => {
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

  calculateUnpluggedStatusCounts(teamNodes: TeamHierarchyNodeBase[]): StatusCount[] {
    let unpluggedCount = 0;

    const traverse = (nodes: TeamHierarchyNodeBase[]) => {
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

  //Cette méthode permet de filtrer les véhicule en fonction du statut sélectionné
  filterVehicles(): void {
    if (!this.originalTeamHierarchy) {
      console.error('Aucune donnée d’origine disponible pour filtrer.');
      return;
    }
    // Si aucun statut n'est sélectionné, on réaffiche tout
    if (!this.selectedPrimaryStatus && !this.selectedUnpluggedStatus) {
      this.teamHierarchy = this.originalTeamHierarchy;
      this.vehiclesTree = VehicleService.transformToTreeNodes(this.originalTeamHierarchy,
        (vehicle: dto.VehicleTableDTO) => ({
          driverName: vehicle.driver ? `${vehicle.driver.lastName} ${vehicle.driver.firstName}` : '',
          licensePlate: vehicle.licenseplate,
        }));
      return;
    }

    const filteredHierarchy: TeamHierarchyNodeBase[] = this.originalTeamHierarchy.map(team => {
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
    this.vehiclesTree = VehicleService.transformToTreeNodes(filteredHierarchy,
      (vehicle: dto.VehicleTableDTO) => ({
        driverName: vehicle.driver ? `${vehicle.driver.lastName} ${vehicle.driver.firstName}` : '',
        licensePlate: vehicle.licenseplate,
      }));
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

  resetTreeNode() {
    //this.vehiclesTree = this.transformToTreeNodes(this.teamHierarchy);
    this.vehiclesTree = VehicleService.transformToTreeNodes(
      this.teamHierarchy,
      (vehicle: dto.VehicleTableDTO) => ({
        driverName: vehicle.driver ? `${vehicle.driver.lastName} ${vehicle.driver.firstName}` : '',
        licensePlate: vehicle.licenseplate,
      }))

  }

  //Cette méthode permet d'exporter un fichier CSV
  exportToCSV(): void {
    const csvData = this.convertToCSV(this.teamHierarchy);
    const bom = '\uFEFF';
    const fullData = bom + csvData;
    const blob = new Blob([fullData], { type: 'text/csv;charset=utf-8;' });
    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('fr-FR'); // Format: dd/mm/yyyy
    const formattedTime = currentDate.toLocaleTimeString('fr-FR', {hour: '2-digit', minute: '2-digit'}); // Format: hh:mm
    const fileName = `Positions ` + (this.non_geoloc ? ` non géolocalisées` : ``) + ` Au ${formattedDate} ${formattedTime}.csv`.replace(/[:]/g, '-'); // Replace colons in time for compatibility

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  convertToCSV(data: TeamHierarchyNode<dto.VehicleTableDTO>[]): string {
    const rows: string[] = [];
    const headers = [
      'Véhicule', 'Immatriculation', 'Marque', 'Modèle', 'Etat', 'Energie', 'Conducteur',
      'Dernière communication', 'Heure de départ', 'Adresse', 'Type d\'adresse de référence',
      'Distance totale', 'Entité Conducteur', 'Entité Véhicule', 'Groupe de salarié'
    ];
    rows.push(headers.join(','));

    const processNode = (node: TeamHierarchyNode<dto.VehicleTableDTO>, parentLabel: string = ''): void => {
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
            vehicle.driver?.team?.label ?? '',
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
    console.log('le vehicleTree',this.vehiclesTree)
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
}
