import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import * as turf from '@turf/turf';
import * as wellknown from 'wellknown'
import {GeoJSONGeometry} from 'wellknown'
import {PointOfInterestForm, PoiService} from "../../poi/poi.service";
import {dto} from "../../../../habarta/dto";
import {VehicleService, VehicleWithDistanceDTO} from "../../vehicle/vehicle.service";
import {LayerEvent, LayerEventType} from "../../../core/cartography/layer/layer.event";
import PointOfInterestCategoryEntity = dto.PointOfInterestCategoryEntity;
import {TabPanel, TabView, TabViewChangeEvent} from "primeng/tabview";
import {Button} from "primeng/button";
import {DatePipe, DecimalPipe, NgForOf, NgIf} from "@angular/common";
import { ButtonModule } from 'primeng/button';
import {ProgressSpinner} from "primeng/progressspinner";

@Component({
  selector: 'app-map-popup',
  template: `
    <div class="mapContextMenu">
      <div class="field">
        <label>Adresse</label>
        <div class="copy-container">
          <input readonly [value]="address" class="copy-input">
          <button pButton type="button" icon="pi pi-copy"
                  class="copy-btn"
                  (click)="copyToClipboard(address)">
          </button>
        </div>
      </div>

      <div class="field">
                <label>Coordonnées (lat,lon)</label>
                <div class="copy-container">
                  <input
                    readonly
                    [value]="latitude.toFixed(5) + ', ' + longitude.toFixed(5)"
                    class="copy-input" />
                  <button
                    pButton
                    type="button"
                    icon="pi pi-copy"
                    class="copy-btn"
                    (click)="copyToClipboard(latitude.toFixed(5) + ',' + longitude.toFixed(5))">
                  </button>
                </div>
      </div>

      <div class="field">
        <label>Latitude / Longitude</label>
        <div class="copy-container">
          <input readonly
                 [value]="latitude.toFixed(5)"
                 class="copy-input">
          <button pButton type="button" icon="pi pi-copy"
                  class="copy-btn"
                  (click)="copyToClipboard(latitude.toFixed(5))">
          </button>
          <input readonly
                 [value]="longitude.toFixed(5)"
                 class="copy-input">
          <button pButton type="button" icon="pi pi-copy"
                  class="copy-btn"
                  (click)="copyToClipboard(longitude.toFixed(5))">
          </button>
        </div>



      </div>

      <!-- Create POI Tab -->
      <p-button (click)="redirectToPoiEditWithCoords()" styleClass="space-bottom custom-gray-button" >Créer un POI
      </p-button>
      <p-tabView (onChange)="selectTab($event)">
        <!-- Véhicule Tab -->
        <p-tabPanel header="Véhicule">
          <h4>Véhicules les Plus Proches</h4>
          <div *ngIf="loadingVehicles">Chargement des véhicules proches...</div>
          <div *ngIf="!loadingVehicles && nearbyVehicles.length === 0">Aucun véhicule trouvé à proximité.</div>
          <ul *ngIf="!loadingVehicles && nearbyVehicles.length > 0">
            <li *ngFor="let vehicle of nearbyVehicles">
              <strong>{{ vehicle.second.licenseplate }}</strong> - {{ vehicle.second.category.label }}
              <span> ({{ vehicle.first | number:'1.2-2' }} km)</span>
              <div style="display: flex; gap: 10px;">
                <p-button
                  label="Zoom"
                  (click)="centerMapOnVehicle(vehicle.second)">
                </p-button>
                <p-button
                  (click)="toggleHighlightMarker('vehicle-' + vehicle.second.id)"
                  styleClass="custom-gray-button"
                  [class.active]="highlightedStates['vehicle-' + vehicle.second.id]">
                  {{ highlightedStates['vehicle-' + vehicle.second.id] ? 'Surbrillance' : 'Surbrillance' }}
                </p-button>
              </div>
            </li>
          </ul>
        </p-tabPanel>

        <!-- POI Tab -->
        <p-tabPanel header="POI">
          <h4>POIs les Plus Proches</h4>
          <div *ngIf="loadingPOIs">Chargement des POIs proches...</div>
          <div *ngIf="!loadingPOIs && nearbyPOIs.length === 0">Aucun POI trouvé à proximité.</div>
          <ul *ngIf="!loadingPOIs && nearbyPOIs.length > 0">
            <li *ngFor="let poi of nearbyPOIs">
              <strong>{{ poi.second.label }}</strong> - {{ poi.second.category.label }}
              <span> ({{ poi.first | number:'1.2-2' }} km)</span>
              <div style="display: flex; gap: 10px;">
                <p-button
                  label="Zoom"
                  (click)="centerMapOnPOI(poi.second)">
                </p-button>
                <p-button
                  (click)="toggleHighlightMarker('poi-' + poi.second.id)"
                  styleClass="custom-gray-button"
                  [class.active]="highlightedStates['poi-' + poi.second.id]">
                  {{ highlightedStates['poi-' + poi.second.id] ? 'Surbrillance' : 'Surbrillance' }}
                </p-button>
              </div>
            </li>
          </ul>
        </p-tabPanel>
      </p-tabView>
    </div>
  `,
  standalone: true,
  imports: [
    Button,
    ButtonModule,
    DecimalPipe,
    DatePipe,
    ProgressSpinner,
    TabPanel,
    TabView,
    NgIf,
    NgForOf
  ],
  styles: [`
    .active {
      background-color: #007bff;
      color: white;
    }

    /* 1. Popup global – plus étroit, hauteur auto, plus de scroll interne */
    .mapContextMenu {
      background: var(--popup-bg);
      color:      var(--popup-text);
      border:     1px solid var(--border);
    }
    .copy-btn.p-button-active {
      background-color: var(--primary) !important;
    }

    /* 2. Champs “Adresse”/“Coordonnées” – marges resserrées */
    .field {
      margin-bottom: 0.5rem;
    }
    .field label {
      display: block;
      font-weight: 600;
      margin-bottom: 0.2rem;
      font-size: 0.8em;
    }

    /* 3. Conteneur input + bouton – gap réduit */
    .copy-container {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    /* 4. Input – texte et padding plus petits */
    .copy-input {
      flex: 1;
      min-width: 0;
      padding: 0.2rem 0.3rem;
      font-size: 0.7rem;
      border: 1px solid #666;
      border-radius: 2px;
      background: white;
      color:black;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    /* 5. Bouton copy – plus compact */
    .copy-btn {
      flex: 0 0 auto;
      width: 1.6rem;
      height: 1.6rem;
      line-height: 1.6rem;
      font-size: 0.7rem;
      padding: 0;
    }

    /* 6. État “copié” */
    .copy-btn.p-button-active {
      background: #28a745 !important;
      color: #fff !important;
    }

    /* test de ta popup */
    :host ::ng-deep .mapContextMenu {
      /* ajoute !important pour écraser tout autre style */
      background: var(--popup-bg) !important;
      color:      var(--popup-text) !important;
      border:     1px solid var(--border) !important;
    }

    /* tu peux aussi tester surface/text global sur le host */
    :host {
      background: var(--surface) !important;
      color:      var(--text) !important;
    }

    /* conserve ton reste de style… */
    .copy-btn.p-button-active {
      background-color: var(--primary) !important;
    }

  `]
})
export class MapPopupComponent implements OnInit {
  @Input() latitude!: number;
  @Input() longitude!: number;
  @Output() layerEvent = new EventEmitter<LayerEvent>();


  address: string = 'Chargement...';
  categories: PointOfInterestCategoryEntity[] = [];
  selectedCategoryId: number = -1;
  poiName: string = '';
  poiRadius: number = 1;
  activeTab: string = 'vehicule';
  nearbyVehicles: VehicleWithDistanceDTO[] = [];
  loadingVehicles: boolean = false;
  nearbyPOIs: any[] = [];
  loadingPOIs: boolean = false;
  highlightedStates: { [markerId: string]: boolean } = {};

  constructor(
    private poiService: PoiService,
    private vehicleService: VehicleService
  ) {}

  /** Copie le texte en presse-papier */
  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
      .then(() => console.log('Copié :', text))
      .catch(() => console.error('Échec copie'));
  }

  ngOnInit() {
    this.poiService.getAddressFromCoordinates(this.latitude, this.longitude).subscribe({
      next: (response) => {
        this.address = response.adresse;
      },
      error: () => this.address = 'Adresse non disponible',
    });

    // Récupérer les catégories
    this.poiService.getAllPOICategory().subscribe({
      next: (categories) => {
        this.categories = categories;
        if (this.categories.length > 0) {
          this.selectedCategoryId = this.categories[0].id;
        }
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des catégories:', error);
      }
    });

    this.selectTab();
  }

  onRadiusChange(newRadius: number) {
    this.layerEvent.emit({
      type: LayerEventType.RadiusChanged,
      payload: { lat: this.latitude, lng: this.longitude, radius: newRadius }
    });  }

  onButtonClick() {
    this.layerEvent.emit({ type: LayerEventType.ButtonClicked });
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
    this.onViewAllHighlightedMarkers()
  }

  submitPOI() {
    if (this.selectedCategoryId === -1) {
      alert("Veuillez sélectionner une catégorie pour le POI.");
      return;
    }
    // Vérifier que les coordonnées sont valides
    if (this.longitude === null || this.latitude === null || isNaN(this.longitude) || isNaN(this.latitude)) {
      alert("Veuillez fournir des coordonnées valides pour le POI.");
      return;
    }
    // Générer le WKTPoint
    const wktPoint = `POINT(${this.longitude} ${this.latitude})`;
    // Créer un objet GeoJSON pour le point
    const pointGeoJSON = turf.point([this.longitude, this.latitude]);
    // Créer un buffer de 50 mètres autour du point pour générer un polygone approximant un cercle
    const buffered = turf.buffer(pointGeoJSON, this.poiRadius, { units: 'meters' });
    // Convertir le GeoJSON du polygone en chaîne WKT
    const wktPolygon = wellknown.stringify(buffered!.geometry as GeoJSONGeometry);
    // Vérifier que la conversion a réussi
    if (!wktPolygon) {
      alert("Erreur lors de la génération du polygone.");
      return;
    }
    // Construire l'objet poiData avec WKTPoint et WKTPolygon
    const poiData: PointOfInterestForm = {
      clientCode : this.poiName,
      clientLabel: this.poiName,
      type: this.selectedCategoryId,
      WKTPoint: wktPoint,
      WKTPolygon: wktPolygon,
      adresse:this.address
    };
    // Appeler le service pour créer le POI
    this.poiService.createPOI(poiData).subscribe({
      next: (response) => {
        // Émettre l'événement POICreated avec les données reçues du backend
        this.layerEvent.emit({
          type: LayerEventType.POICreated,
          payload: { poi: { ...response, coordinates: [this.latitude, this.longitude] } }
        });
        // Fermer le popup ou effectuer d'autres actions nécessaires
        this.layerEvent.emit({ type: LayerEventType.ClosePopup });
      },
      error: (error) => {
        console.error("Erreur lors de l'ajout du POI:", error);
        alert("Une erreur s'est produite lors de l'ajout du POI. Veuillez réessayer.");
      }
    });
  }

  selectTab(tab? : TabViewChangeEvent) {
    this.onButtonClick();
    this.activeTab = tab?.index.toString() || '0';
    if (this.activeTab === '0' && this.nearbyVehicles.length === 0 && !this.loadingVehicles) {
      this.loadNearbyVehicles();
    }
    if (this.activeTab === '1' && this.nearbyPOIs.length === 0 && !this.loadingPOIs) {
      this.loadNearbyPOIs();
    }
  }

  loadNearbyVehicles() {
    this.loadingVehicles = true;
    this.vehicleService.getNearestVehiclesWithDistance(this.latitude, this.longitude, 3).subscribe({
      next: (vehicles) => {
        this.nearbyVehicles = vehicles;
        this.loadingVehicles = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des véhicules proches:', error);
        this.loadingVehicles = false;
      }
    });
  }

  loadNearbyPOIs() {
    this.loadingPOIs = true;
    // Appel au service pour récupérer les POIs proches
    this.poiService.getNearestPOIsWithDistance(this.latitude, this.longitude, 3).subscribe({
      next: (pois) => {
        this.nearbyPOIs = pois;
        this.loadingPOIs = false;
      },
      error: (error) => {
        console.error('Erreur lors de la récupération des POIs proches:', error);
        this.loadingPOIs = false;
      }
    });
  }

  onViewAllHighlightedMarkers() {
    this.layerEvent.emit({
      type: LayerEventType.ZoomToHighlightedMarkersIncludingCoords,
      payload: { lat: this.latitude, lng: this.longitude }
    });
  }

  centerMapOnVehicle(vehicle: dto.VehicleSummaryDTO) {
    const coordinates = vehicle.device?.coordinate?.coordinates;
    if (coordinates && coordinates.length === 2) {
      // Émettre les coordonnées sous forme de [latitude, longitude]
      this.layerEvent.emit({
        type: LayerEventType.ZoomToCoordinates,
        payload: { coordinates: [coordinates[0], coordinates[1]] }
      });    }
  }

  centerMapOnPOI(poi: dto.PointOfInterestEntity) {
    const coordinates = poi.coordinate?.coordinates;
    if (coordinates && coordinates.length === 2) {
      // Émettre les coordonnées sous forme de [latitude, longitude]
      this.layerEvent.emit({
        type: LayerEventType.ZoomToCoordinates,
        payload: { coordinates: [coordinates[0], coordinates[1]] }
      });    }
  }

  addPOI() {
    this.layerEvent.emit({
      type: LayerEventType.AddPOIRequest,
      payload: { lat: this.latitude, lng: this.longitude }
    });
    this.poiRadius = 50;
    this.onRadiusChange(50);
    this.poiRadius = 50
  }

  redirectToPoiEditWithCoords() {
    window.location.href = `/poiedit?coords=${this.latitude},${this.longitude}`;
  }
}

