import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {MarkerFactory} from "../../../core/cartography/MarkerFactory";
import {PoiService, PoiWithDistance} from "../../poi/poi.service";
import {dto} from "../../../../habarta/dto";
import PointOfInterestCategoryEntity = dto.PointOfInterestCategoryEntity;
import {VehicleService, VehicleWithDistanceDTO} from "../../vehicle/vehicle.service";
import {LayerEvent, LayerEventType} from "../../../core/cartography/tmpTest/layer.event";

@Component({
  selector: 'app-map-popup',
  template: `
    <div class="tabs">
      <button
        [class.active]="activeTab === 'vehicule'"
        (click)="selectTab('vehicule')"
      >
        Véhicule
      </button>
      <button
        [class.active]="activeTab === 'poi'"
        (click)="selectTab('poi')"
      >
        POI
      </button>
      <button
        [class.active]="activeTab === 'creation'"
        (click)="selectTab('creation')"
      >
        Création
      </button>
    </div>

    <!-- Bouton pour voir tous les marqueurs mis en surbrillance -->
    <div class="view-all-button" *ngIf="activeTab === 'vehicule' || activeTab === 'poi'">
      <button (click)="onViewAllHighlightedMarkers()">Voir tous les marqueurs mis en surbrillance</button>
    </div>

    <div class="tab-content">
      <h4>Coordonnées : {{ latitude.toFixed(5) }}, {{ longitude.toFixed(5) }} / Adresse : {{ address }}</h4>

      <!-- Onglet Véhicule -->
      <div *ngIf="activeTab === 'vehicule'">
        <h4>Véhicules les Plus Proches</h4>
        <div *ngIf="loadingVehicles">
          Chargement des véhicules proches...
        </div>
        <div *ngIf="!loadingVehicles && nearbyVehicles.length === 0">
          Aucun véhicule trouvé à proximité.
        </div>
        <ul *ngIf="!loadingVehicles && nearbyVehicles.length > 0">
          <li *ngFor="let vehicle of nearbyVehicles">
            <strong>{{ vehicle.second.licenseplate }}</strong> - {{ vehicle.second.category.label }}
            <span> ({{ vehicle.first | number:'1.2-2' }} km)</span>
            <button (click)="centerMapOnVehicle(vehicle.second)">Zoom</button>
            <button
              (click)="toggleHighlightMarker('vehicle-' + vehicle.second.id)"
              [class.active]="highlightedStates['vehicle-' + vehicle.second.id]"
            >
              {{ highlightedStates['vehicle-' + vehicle.second.id] ? 'Désactiver surbrillance' : 'Mettre en surbrillance' }}
            </button>
          </li>
        </ul>
      </div>

      <!-- Onglet POI -->
      <div *ngIf="activeTab === 'poi'">
        <h4>POIs les Plus Proches</h4>
        <div *ngIf="loadingPOIs">
          Chargement des POIs proches...
        </div>
        <div *ngIf="!loadingPOIs && nearbyPOIs.length === 0">
          Aucun POI trouvé à proximité.
        </div>
        <ul *ngIf="!loadingPOIs && nearbyPOIs.length > 0">
          <li *ngFor="let poi of nearbyPOIs">
            <strong>{{ poi.second.label }}</strong> - {{ poi.second.category.label }}
            <span> ({{ poi.first | number:'1.2-2' }} km)</span>
            <button (click)="centerMapOnPOI(poi.second)">Zoom</button>
            <button
              (click)="toggleHighlightMarker('poi-' + poi.second.id)"
              [class.active]="highlightedStates['poi-' + poi.second.id]"
            >
              {{ highlightedStates['poi-' + poi.second.id] ? 'Désactiver surbrillance' : 'Mettre en surbrillance' }}
            </button>
          </li>
        </ul>
      </div>

      <!-- Onglet Création -->
      <div *ngIf="activeTab === 'creation'">
        <h4>Créer un POI</h4>
        <form (ngSubmit)="submitPOI()">
          <label for="poiName">Nom du POI:</label>
          <input type="text" id="poiName" placeholder="Nom du POI" [(ngModel)]="poiName" name="poiName" required><br/>

          <label for="poiCategory">Type de POI:</label>
          <select id="poiCategory" [(ngModel)]="selectedCategoryId" name="poiCategory" required>
            <option *ngFor="let category of categories" [value]="category.id">
              {{ category.label }}
            </option>
          </select><br/>

          <label for="poiRadius">Rayon (mètres):</label>
          <input type="number" id="poiRadius" placeholder="Rayon en mètres" [(ngModel)]="poiRadius" name="poiRadius" (ngModelChange)="onRadiusChange($event)" required><br/>
          <button type="submit">Soumettre</button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    /* Styles pour les boutons toggle */
    .active {
      background-color: #007bff;
      color: white;
    }
  `]
})
export class MapPopupComponent implements OnInit, OnDestroy {
  constructor(
    private poiService: PoiService,
    private vehicleService: VehicleService
  ) {}

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

  // Gestion des états de surbrillance des marqueurs
  highlightedStates: { [markerId: string]: boolean } = {};

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

    this.selectTab('vehicule');
  }

  ngOnDestroy() {
    this.layerEvent.emit({ type: LayerEventType.PopupClosed });
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
  }

  submitPOI() {
    if (this.selectedCategoryId === -1) {
      alert("Veuillez sélectionner une catégorie pour le POI.");
      return;
    }

    const poiData = {
      label: this.poiName,
      type: this.selectedCategoryId,
      WKTPoint: `POINT(${this.longitude} ${this.latitude})`,
      radius: this.poiRadius
    };

    this.poiService.createPOI(poiData).subscribe({
      next: (response) => {
        this.layerEvent.emit({
          type: LayerEventType.POICreated,
          payload: { poi: { ...response, coordinates: [this.latitude, this.longitude] } }
        });
        this.layerEvent.emit({ type: LayerEventType.ClosePopup });
      },
      error: (error) => console.error("Erreur lors de l'ajout du POI:", error)
    });
  }

  selectTab(tab: string) {
    this.onButtonClick();
    this.activeTab = tab;

    if (tab === 'vehicule' && this.nearbyVehicles.length === 0 && !this.loadingVehicles) {
      this.loadNearbyVehicles();
    }

    if (tab === 'poi' && this.nearbyPOIs.length === 0 && !this.loadingPOIs) {
      this.loadNearbyPOIs();
    }

    if (tab === 'creation') {
      this.addPOI();
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
        console.log(pois)
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
    });  }

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
}
