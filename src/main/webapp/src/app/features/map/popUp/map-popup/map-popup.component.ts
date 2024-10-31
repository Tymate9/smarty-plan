import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {MarkerFactory} from "../../MarkerFactory";
import {PoiService, PoiWithDistance} from "../../../poi/poi.service";
import {dto} from "../../../../../habarta/dto";
import PointOfInterestCategoryEntity = dto.PointOfInterestCategoryEntity;
import {VehicleService, VehicleWithDistanceDTO} from "../../../vehicle/vehicle.service";

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

    <div class="tab-content">
      <h4>Coordonnées : {{ latitude.toFixed(5) }}, {{ longitude.toFixed(5) }} / Adresse : {{ address }}</h4>
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
            <span> ({{ vehicle.first | number:'1.2-2' }} m)</span>
            <button (click)="centerMapOnVehicle(vehicle.second)">Zoom</button>
            <button (click)="highlightMarker('vehicle-'+vehicle.second.id)">Mettre en surbrillance</button>
          </li>
        </ul>
      </div>

      <div *ngIf="activeTab === 'poi'">
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
              <span> ({{ poi.first | number:'1.2-2' }} m)</span>
              <button (click)="centerMapOnPOI(poi.second)">Zoom</button>
              <button (click)="highlightMarker( 'poi-'+poi.second.id)">Mettre en surbrillance</button>
            </li>
          </ul>
        </div>
      </div>

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
})
export class MapPopupComponent implements OnInit,OnDestroy {
  constructor(
    private markerFactory : MarkerFactory,
    private poiService : PoiService,
    private vehicleService : VehicleService) {}
  @Input() latitude!: number;
  @Input() longitude!: number;
  @Output() addPOIRequest = new EventEmitter<{ lat: number, lng: number }>();
  @Output() buttonClick = new EventEmitter<void>();
  @Output() poiCreated = new EventEmitter<any>();
  @Output() closePopup = new EventEmitter<void>();
  @Output() radiusChanged = new EventEmitter<number>();

  address: string = 'Chargement...';
  categories: PointOfInterestCategoryEntity[] = [];
  selectedCategoryId: number = -1;
  poiName: string = '';
  poiRadius : number = 1;
  activeTab: string = 'vehicule';
  nearbyVehicles: VehicleWithDistanceDTO[] = [];
  loadingVehicles: boolean = false;
  nearbyPOIs: any[] = [];
  loadingPOIs: boolean = false;

  highlightedPOINames: string[] = [];
  highlightedVehicleNames: string[] = [];


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
    this.selectTab('vehicle');
  }

  ngOnDestroy() {
    this.markerFactory.resetAllHighlights();
  }

  onRadiusChange(newRadius: number) {
    this.radiusChanged.emit(newRadius);
  }

  onButtonClick() {
    this.buttonClick.emit(); // Émet un événement pour réinitialiser la croix
  }

  highlightMarker(markerId: string) {
    this.markerFactory.resetAllHighlights()
    // Ajoutez également le nom du marker à la liste si nécessaire
    const marker = this.markerFactory.markersMap.get(markerId);
    marker?.highlight()
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
        this.poiCreated.emit({ ...response, coordinates: [this.latitude, this.longitude] });
        this.closePopup.emit();
      },
      error: (error) => console.error("Erreur lors de l'ajout du POI:", error)
    });
  }

  selectTab(tab: string) {
    this.onButtonClick()
    this.activeTab = tab;

    if (tab === 'vehicule' && this.highlightedVehicleNames.length === 0 && !this.loadingVehicles) {
      this.loadNearbyVehicles();
    }

    if (tab === 'poi' && this.highlightedPOINames.length === 0 && !this.loadingPOIs) {
      this.loadNearbyPOIs();
    }

    if (tab === 'creation')
    {
      this.markerFactory.resetAllHighlights()
      this.addPOI()
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

  @Output() zoomRequest = new EventEmitter<[number, number]>();

  centerMapOnVehicle(vehicle: dto.VehicleSummaryDTO) {
    const coordinates = vehicle.device?.coordinate?.coordinates;
    if (coordinates && coordinates.length === 2) {
      // Émettre les coordonnées sous forme de [latitude, longitude]
      this.zoomRequest.emit([coordinates[1], coordinates[0]]);
    }
  }

  centerMapOnPOI(poi: dto.PointOfInterestEntity) {
    const coordinates = poi.coordinate?.coordinates;
    if (coordinates && coordinates.length === 2) {
      // Émettre les coordonnées sous forme de [latitude, longitude]
      this.zoomRequest.emit([coordinates[1], coordinates[0]]);
    }
  }

  addPOI() {
    this.addPOIRequest.emit({ lat: this.latitude, lng: this.longitude });
  }
}
