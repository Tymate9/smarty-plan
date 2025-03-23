// src/app/components/poi-popup/poi-popup.component.ts
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {PointOfInterestForm, PoiService} from "../poi.service";
import * as wellknown from 'wellknown'
import {dto} from "../../../../habarta/dto";
import {VehicleService, VehicleWithDistanceDTO} from "../../vehicle/vehicle.service";
import {LayerEvent, LayerEventType} from "../../../core/cartography/layer/layer.event";
import {GeoJSONGeometry} from "wellknown";
import {PopUpConfig} from "../../../core/cartography/marker/pop-up-config";
import {EntityType} from "../../../core/cartography/marker/MarkerFactory";
import {Router} from "@angular/router";
import {ButtonDirective, ButtonModule} from "primeng/button";
import {DatePipe, DecimalPipe, NgForOf, NgIf} from "@angular/common";
import {FormsModule} from "@angular/forms";
import {TabPanel, TabView} from "primeng/tabview";
import {ProgressSpinner} from "primeng/progressspinner";
import {InputText} from "primeng/inputtext";
import {Select} from "primeng/select";

@Component({
  selector: 'app-poi-popup',
  template: `
    <div class="poi-popup">
      <p-tabView [(activeIndex)]="activeTabIndex" (onChange)="onTabChange($event)">
        <!-- Onglet Information -->
        <p-tabPanel header="Information" *ngIf="popUpConfig.isTabEnabled(entityType, 'information')">
          <div class="p-fluid">
            <div class="p-field">
              <label><h4>Dénomination :</h4></label>
              <span>{{ entity.client_code ?? "0000" }}-{{ entity.client_label }}</span>
            </div>
            <div class="p-field">
              <label><h4>Adresse :</h4></label>
              <span>{{ entity.address }}</span>
            </div>
            <div class="p-field">
              <label><h4>Catégorie :</h4></label>
              <span>{{ entity.category.label }}</span>
            </div>
            <div class="p-field">
              <label><h4>Coordonnées :</h4></label>
              <span>Latitude :  {{ entity.coordinate.coordinates[1] }}
                <br/>Longitude : {{ entity.coordinate.coordinates[0] }}</span>
            </div>
          </div>
        </p-tabPanel>

        <!-- Onglet Proximité -->
        <p-tabPanel header="Proximité" *ngIf="popUpConfig.isTabEnabled(entityType, 'proximite')">
          <h4>Véhicules les Plus Proches</h4>
          <p-progressSpinner *ngIf="loadingProximity" styleClass="custom-spinner"></p-progressSpinner>
          <p *ngIf="!loadingProximity && proximityVehicles.length === 0">
            Aucun véhicule trouvé à proximité.
          </p>
          <div *ngIf="!loadingProximity && proximityVehicles.length > 0">
            <div *ngFor="let vehicle of proximityVehicles" class="vehicle-item">
              <div>
                <strong>{{ vehicle.second.driver?.firstName }} {{ vehicle.second.driver?.lastName }}
                  -{{ vehicle.second.licenseplate }}</strong>
                - {{ vehicle.second.category.label }}
                <span> ({{ vehicle.first | number:'1.2-2' }} km)</span>
              </div>
              <div class="vehicle-actions">
                <p-button
                  label="Zoom"
                  icon="pi pi-search-plus"
                  (click)="centerMapOnVehicle(vehicle.second)" >
                </p-button>
                <p-button
                  [label]="isMarkerHighlighted('vehicle-' + vehicle.second.id) ? 'Désactiver surbrillance' : 'Mettre en surbrillance'"
                  [icon]="isMarkerHighlighted('vehicle-' + vehicle.second.id) ? 'pi pi-eye-slash' : 'pi pi-eye'"
                  (click)="toggleHighlightMarker('vehicle-' + vehicle.second.id)"
                  styleClass="custom-gray-button">
                </p-button>
              </div>
            </div>
          </div>
        </p-tabPanel>

        <!-- Onglet Dans POI -->
        <p-tabPanel header="Dans POI" *ngIf="popUpConfig.isTabEnabled(entityType, 'dessus')">
          <h4>Véhicules dans le Polygone</h4>
          <p-progressSpinner *ngIf="loadingDessus" styleClass="custom-spinner"></p-progressSpinner>
          <p *ngIf="!loadingDessus && dessusVehicles.length === 0">
            Aucun véhicule trouvé dans ce polygone.
          </p>
          <div *ngIf="!loadingDessus && dessusVehicles.length > 0">
            <div *ngFor="let vehicle of dessusVehicles" class="vehicle-item">
              <div>
                Conducteur: {{ vehicle.driver?.firstName + " " + vehicle.driver?.lastName || 'Aucun conducteur' }}
              </div>
              <div>
                <strong>{{ vehicle.licenseplate }}</strong> - {{ vehicle.category.label }}
              </div>
              <div>
                Équipe: {{ vehicle.team?.label }} ({{ vehicle.team?.category?.label }})
              </div>
              <div>
                Dernière communication: {{ vehicle.device?.lastCommunicationDate | date:'short' }}
              </div>
            </div>
          </div>
        </p-tabPanel>

        <!-- Onglet Éditer -->
        <p-tabPanel header="Éditer" *ngIf="popUpConfig.isTabEnabled(entityType, 'editer')">
          <h4>Modifier le POI</h4>
          <form (ngSubmit)="submitUpdate()" #poiForm="ngForm">
            <div class="p-fluid">
              <div class="p-field">
                <label for="label">Code client : </label>
                <input
                  pInputText
                  type="text"
                  id="label-code"
                  [(ngModel)]="updatedPoi.clientCode"
                  name="label-code"
                  required
                />
              </div>
              <div class="p-field">
                <label for="label">Nom :</label>
                <input
                  pInputText
                  type="text"
                  id="label"
                  [(ngModel)]="updatedPoi.clientLabel"
                  name="label"
                  required
                />
              </div>
              <div class="p-field">
                <label for="category">Type : </label>
                <div class="p-field">
                  <p-select
                    id="category"
                    [(ngModel)]="selectedCategoryId"
                    optionLabel="label"
                    optionValue="value"
                    name="category"
                    required
                    [options]="categoryOptions"
                  >
                  </p-select>
                </div>
                <small
                  *ngIf="!poiForm.form.controls['category']?.valid && poiForm.form.controls['category']?.get('touched')"
                  class="error-message"
                >
                  Veuillez sélectionner une catégorie.
                </small>
              </div>
            </div>
            <div class="form-actions">
              <div class="button-row">
                <p-button
                  type="submit"
                  label="Mettre à jour"
                  icon="pi pi-check"
                  [disabled]="!poiForm.form.valid"
                ></p-button>
                <p-button
                  type="button"
                  label="Supprimer le POI"
                  icon="pi pi-trash"
                  (onClick)="deletePOI()"
                ></p-button>
              </div>
              <div class="button-row">
                <p-button
                  type="button"
                  label="Aller à l'Édition POI"
                  icon="pi pi-external-link"
                  (onClick)="navigateToPoiEdit()"
                  styleClass="custom-gray-button"
                ></p-button>
              </div>
            </div>
          </form>
        </p-tabPanel>
      </p-tabView>
    </div>
  `,
  standalone: true,
  imports: [
    NgIf,
    FormsModule,
    NgForOf,
    TabPanel,
    ProgressSpinner,
    DecimalPipe,
    TabView,
    DatePipe,
    ButtonModule,
    InputText,
    Select
  ],
  styles: [`
    .form-actions .button-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .form-actions .button-row button:last-child {
      margin-right: 0;
    }
    .vehicle-item {
      border: 1px solid #ccc;
      padding: 10px;
      margin-bottom: 10px;
      border-radius: 5px;
    }

    .vehicle-actions {
      margin-top: 10px;
      display: flex;
      gap: 5px;
    }

    .form-actions {
      margin-top: 20px;
      display: flex;
      flex-direction: column;
    }

    .button-row {
      display: flex;
      gap: 10px;
    }

    .custom-spinner {
      display: block;
      margin: 0 auto;
    }

    .error-message {
      color: red;
      font-size: 0.8rem;
    }

    .required {
      color: red;
    }

    .p-field select {
      width: 100%;
      padding: 0.5rem;
      border-radius: 4px;
      border: 1px solid #ccc;
    }
  `]
})
export class PoiPopupComponent implements OnInit {
  @Input() popUpConfig: PopUpConfig;
  entityType: EntityType = EntityType.POI;
  @Input() entity: dto.PointOfInterestEntity;
  @Output() layerEvent = new EventEmitter<LayerEvent>();

  highlightedStates: { [markerId: string]: boolean } = {};
  activeTabIndex: number = 0;
  tabNames: string[] = ['information', 'proximite', 'dessus', 'editer'];

  updatedPoi: { clientCode: string, clientLabel: string };
  categories: dto.PointOfInterestCategoryEntity[] = [];
  categoryOptions: { label: string; value: number }[] = [];

  selectedCategoryId: number | null = null;

  proximityVehicles: VehicleWithDistanceDTO[] = [];
  loadingProximity: boolean = false;

  dessusVehicles: dto.VehicleSummaryDTO[] = [];
  loadingDessus: boolean = false;

  constructor(
    private readonly poiService: PoiService,
    private readonly vehicleService: VehicleService,
    private readonly router: Router
  ) {}

  ngOnInit() {

    // Initialiser updatedPoi avec les valeurs actuelles du POI
    this.updatedPoi = {
      clientCode: this.entity.client_code?? '0000',
      clientLabel: this.entity.client_label
    };

    // Récupérer les catégories et préparer les options pour le select
    this.poiService.getAllPOICategory().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.selectedCategoryId = this.entity.category.id;

        this.categoryOptions = categories.map(category => ({
          label: category.label,
          value: category.id
        }));
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des catégories:', error);
      }
    });

    // Initialiser l'index de l'onglet actif
    this.activeTabIndex = this.tabNames.indexOf('information');
  }

  navigateToPoiEdit() {
    this.router.navigate(['/poiedit'], { queryParams: { labels: this.entity.client_label } });
  }

  onTabChange(event: any) {
    this.activeTabIndex = event.index;
    const tabName = this.tabNames[this.activeTabIndex];
    this.selectTab(tabName);
  }

  selectTab(tab: string) {
    // Mettre à jour l'index de l'onglet actif
    this.activeTabIndex = this.tabNames.indexOf(tab);

    if (tab === 'proximite' && this.proximityVehicles.length === 0 && !this.loadingProximity) {
      this.loadProximityVehicles();
    }
    if (tab === 'dessus' && this.dessusVehicles.length === 0 && !this.loadingDessus) {
      this.loadDessusVehicles();
    }
  }

  deletePOI() {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce POI ?')) {
      this.poiService.deletePOI(this.entity.id).subscribe({
        next: () => {
          alert('POI supprimé avec succès.');
          this.layerEvent.emit({
            type: LayerEventType.RemoveMarker,
            payload: {
              entityType: EntityType.POI,
              markerId: 'poi-' + this.entity.id,
            }
          });
        },
        error: (error) => {
          console.error('Erreur lors de la suppression du POI:', error);
          alert('Une erreur est survenue lors de la suppression du POI.');
        },
      });
    }
  }

  submitUpdate() {
    if (this.selectedCategoryId === null) {
      alert('Veuillez sélectionner une catégorie pour le POI.');
      return;
    }

    if (
      this.entity.coordinate.coordinates[0] === null ||
      this.entity.coordinate.coordinates[1] === null ||
      isNaN(this.entity.coordinate.coordinates[0]) ||
      isNaN(this.entity.coordinate.coordinates[1])
    ) {
      alert("Veuillez fournir des coordonnées valides pour le POI.");
      return;
    }

    const wktPoint = `POINT(${this.entity.coordinate.coordinates[0]} ${this.entity.coordinate.coordinates[1]})`;

    const updatedData: PointOfInterestForm = {
      clientCode : this.updatedPoi.clientCode,
      clientLabel: this.updatedPoi.clientLabel,
      type: this.selectedCategoryId,
      WKTPoint: wktPoint,
      WKTPolygon: wellknown.stringify(this.entity.area as GeoJSONGeometry),
      adresse:this.entity.address
    };

    this.poiService.updatePOI(this.entity.id, updatedData).subscribe({
      next: (updatedPoi) => {
        alert('POI mis à jour avec succès.');
        this.entity = updatedPoi;
        this.layerEvent.emit({
          type: LayerEventType.POIUpdated,
          payload: { updatedPoi }
        });
      },
      error: (error) => {
        console.error('Erreur lors de la mise à jour du POI:', error);
        alert('Une erreur est survenue lors de la mise à jour du POI.');
      },
    });
  }

  centerMapAroundAllMarkers() {
    this.layerEvent.emit({
      type: LayerEventType.ZoomToHighlightedMarkersIncludingCoords,
      payload: {
        lat: this.entity.coordinate.coordinates[1],
        lng: this.entity.coordinate.coordinates[0]
      }
    });
  }

  loadProximityVehicles() {
    this.loadingProximity = true;
    const latitude = this.entity.coordinate.coordinates[1];
    const longitude = this.entity.coordinate.coordinates[0];
    const limit = 5;

    this.vehicleService.getNearestVehiclesWithDistance(latitude, longitude, limit).subscribe({
      next: (data) => {
        this.proximityVehicles = data;
        this.loadingProximity = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des véhicules proches:', error);
        this.loadingProximity = false;
      }
    });
  }

  centerMapOnVehicle(vehicle: dto.VehicleSummaryDTO) {
    const coordinates = vehicle.device?.coordinate?.coordinates;
    if (coordinates && coordinates.length === 2) {
      this.layerEvent.emit({
        type: LayerEventType.ZoomToCoordinates,
        payload: {
          coordinates: [coordinates[0], coordinates[1]]
        }
      });
    }
  }

  loadDessusVehicles() {
    this.loadingDessus = true;
    const wkt = this.convertToWktPolygon(this.entity.area.coordinates);
    this.vehicleService.getVehicleInPolygon(wkt).subscribe({
      next: (data) => {
        this.dessusVehicles = data;
        this.loadingDessus = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des véhicules dans le polygone:', error);
        this.loadingDessus = false;
      }
    });
  }

  convertToWktPolygon(coordinates: number[][][]): string {
    if (!coordinates || coordinates.length === 0) {
      throw new Error('Les coordonnées du polygone sont manquantes ou invalides.');
    }
    const linearRing = coordinates[0];

    const firstPoint = linearRing[0];
    const lastPoint = linearRing[linearRing.length - 1];
    const isClosed = firstPoint[0] === lastPoint[0] && firstPoint[1] === lastPoint[1];

    const closedLinearRing = isClosed ? linearRing : [...linearRing, firstPoint];

    const pointsWkt = closedLinearRing.map(point => `${point[0]} ${point[1]}`).join(', ');
    return `POLYGON((${pointsWkt}))`;
  }

  toggleHighlightMarker(markerId: string) {
    this.highlightedStates[markerId] = !this.highlightedStates[markerId];
    const eventType = this.highlightedStates[markerId]
      ? LayerEventType.HighlightMarker
      : LayerEventType.RemoveHighlightMarker;
    this.layerEvent.emit({
      type: eventType,
      payload: { markerID: markerId }
    });
    this.centerMapAroundAllMarkers();
  }

  isMarkerHighlighted(markerId: string): boolean {
    return this.highlightedStates[markerId] || false;
  }
}

